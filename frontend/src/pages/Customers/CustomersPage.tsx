import { useEffect, useMemo, useState } from "react";
import { useRealtime } from "../../hooks/useRealtime";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react";

import type { Customer, MembershipType } from "../../types/customer";

import { deleteCustomer, getCustomers } from "../../services/customer.service";

import { useAuth } from "../../contexts/AuthContext";

import CustomerFormModal from "../../components/customers/CustomerFormModal";
import CustomerDetailModal from "../../components/customers/CustomerDetailModal";
import Toast, { type ToastType } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

type ToastState = {
  type: ToastType;
  title: string;
  message: string;
};

const CUSTOMER_EVENTS = ["data:changed:customers"] as const;

export default function CustomersPage() {
  const { user } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const [membershipFilter, setMembershipFilter] = useState<
    "ALL" | MembershipType
  >("ALL");

  const [formOpen, setFormOpen] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  const [toast, setToast] = useState<ToastState | null>(null);

  const pageSize = 10;

  async function loadCustomers(silent = false) {
    try {
      if(!silent)setLoading(true);

      const data = await getCustomers();

      setCustomers(data);
    } catch (error) {
      console.error("Gagal memuat customer:", error);

      setToast({
        type: "error",
        title: "Gagal memuat data",
        message: "Tidak dapat mengambil data pelanggan dari server.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);
  useRealtime(CUSTOMER_EVENTS, () => void loadCustomers(true));

  useEffect(() => {
    setPage(1);
  }, [search, membershipFilter]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        keyword.length === 0 ||
        customer.name.toLowerCase().includes(keyword) ||
        customer.phone.toLowerCase().includes(keyword) ||
        customer.customerCode.toLowerCase().includes(keyword);

      const matchesMembership =
        membershipFilter === "ALL" ||
        customer.membershipType === membershipFilter;

      return matchesSearch && matchesMembership;
    });
  }, [customers, search, membershipFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize),
  );

  const safePage = Math.min(page, totalPages);

  const startIndex = (safePage - 1) * pageSize;

  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + pageSize,
  );

  const memberCount = customers.filter(
    (customer) => customer.membershipType === "MEMBER",
  ).length;

  const totalPoints = customers.reduce(
    (total, customer) => total + customer.loyaltyPoints,
    0,
  );

  function openCreateModal() {
    setEditingCustomer(null);
    setFormOpen(true);
  }

  function openEditModal(customer: Customer) {
    setSelectedCustomer(null);
    setEditingCustomer(customer);
    setFormOpen(true);
  }

  function handleSaved(customer: Customer, mode: "create" | "update") {
    setCustomers((current) => {
      if (mode === "update") {
        return current.map((item) =>
          item.id === customer.id ? customer : item,
        );
      }

      return [customer, ...current];
    });

    setFormOpen(false);
    setEditingCustomer(null);

    setToast({
      type: "success",
      title:
        mode === "create" ? "Pelanggan ditambahkan" : "Pelanggan diperbarui",
      message:
        mode === "create"
          ? "Data pelanggan berhasil ditambahkan."
          : "Perubahan pelanggan berhasil disimpan.",
    });
  }

  function requestDelete(customer: Customer) {
    setSelectedCustomer(null);
    setCustomerToDelete(customer);
  }

  async function confirmDelete() {
    if (!customerToDelete) {
      return;
    }

    try {
      setDeletingId(customerToDelete.id);

      await deleteCustomer(customerToDelete.id);

      const deletedId = customerToDelete.id;

      setCustomers((current) =>
        current.filter((item) => item.id !== deletedId),
      );

      setCustomerToDelete(null);

      setToast({
        type: "success",
        title: "Pelanggan dihapus",
        message: "Pelanggan berhasil dihapus dari daftar.",
      });
    } catch (error) {
      console.error("Gagal menghapus customer:", error);

      setToast({
        type: "error",
        title: "Gagal menghapus",
        message: "Pelanggan gagal dihapus. Periksa koneksi server.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page-enter space-y-6">
      {/* HEADER */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">Customers</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Pelanggan
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola pelanggan, membership, dan loyalty points.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          title="Tambah Pelanggan"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 p-3 text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
        </button>
      </section>

      {/* SUMMARY */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatBox
          icon={Users}
          label="Total Pelanggan"
          value={customers.length}
        />

        <StatBox icon={Star} label="Member" value={memberCount} />

        <StatBox icon={Star} label="Loyalty Points" value={totalPoints} />
      </section>

      {/* TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TOOLBAR */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, nomor HP, atau kode customer..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={membershipFilter}
            onChange={(event) =>
              setMembershipFilter(event.target.value as "ALL" | MembershipType)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Semua Membership</option>

            <option value="NONE">Non Member</option>

            <option value="MEMBER">Member</option>
          </select>

          <button
            type="button"
            onClick={() => void loadCustomers()}
            disabled={loading}
            title="Refresh"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ERROR */}
        {/* TABLE */}
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <p className="text-sm text-slate-500">Memuat pelanggan...</p>
          </div>
        ) : (
          <div className="rtable-wrap overflow-x-auto p-3 sm:p-0">
            <table className="rtable w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Kontak
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Membership
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Loyalty
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <p className="text-sm font-semibold text-slate-500">
                        Tidak ada pelanggan
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Coba ubah pencarian atau filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <CustomerTableRow
                      key={customer.id}
                      customer={customer}
                      canDelete={user?.role === "ADMIN"}
                      deleting={deletingId === customer.id}
                      onDetail={() => setSelectedCustomer(customer)}
                      onEdit={() => openEditModal(customer)}
                      onDelete={() => requestDelete(customer)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Menampilkan{" "}
              <span className="font-semibold text-slate-900">
                {startIndex + 1}–
                {Math.min(startIndex + pageSize, filteredCustomers.length)}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-900">
                {filteredCustomers.length}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                title="Sebelumnya"
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-2 text-sm font-medium text-slate-600">
                {safePage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                title="Berikutnya"
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* CREATE / EDIT */}
      {formOpen && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => {
            if (deletingId === null) {
              setFormOpen(false);
              setEditingCustomer(null);
            }
          }}
          onSaved={handleSaved}
        />
      )}

      {/* DETAIL */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          canDelete={user?.role === "ADMIN"}
          onClose={() => setSelectedCustomer(null)}
          onEdit={() => openEditModal(selectedCustomer)}
          onDelete={() => requestDelete(selectedCustomer)}
        />
      )}

      {/* CONFIRM DELETE */}
      {customerToDelete && (
        <ConfirmDialog
          title="Hapus pelanggan?"
          message={`Pelanggan "${customerToDelete.name}" akan dihapus dari daftar aktif.`}
          loading={deletingId === customerToDelete.id}
          onCancel={() => setCustomerToDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}

      {/* TOAST */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function CustomerTableRow({
  customer,
  canDelete,
  deleting,
  onDetail,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  canDelete: boolean;
  deleting: boolean;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-slate-50 transition hover:bg-slate-50/60">
      <td data-label="Customer" className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
            {customer.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-semibold text-slate-900">
              {customer.name}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {customer.customerCode}
            </p>
          </div>
        </div>
      </td>

      <td data-label="Kontak" className="px-5 py-4">
        <div className="text-left sm:text-right">
          <p className="text-sm text-slate-700">{customer.phone}</p>

          <p className="mt-1 text-xs text-slate-400">
            {customer.email || "Tidak ada email"}
          </p>
        </div>
      </td>

      <td data-label="Membership" className="px-5 py-4">
        {customer.membershipType === "MEMBER" ? (
          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Member
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            Non Member
          </span>
        )}
      </td>

      <td data-label="Loyalty" className="px-5 py-4">
        <span className="text-sm font-semibold text-slate-700">
          {customer.loyaltyPoints.toLocaleString("id-ID")} pts
        </span>
      </td>

      <td data-label="Action" className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDetail}
            title="Detail"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <Eye size={15} />
          </button>

          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
          >
            <Pencil size={15} />
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              title={deleting ? "Menghapus..." : "Hapus"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={18} />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>

          <p className="mt-1 text-xl font-bold text-slate-900">
            {value.toLocaleString("id-ID")}
          </p>
        </div>
      </div>
    </div>
  );
}
