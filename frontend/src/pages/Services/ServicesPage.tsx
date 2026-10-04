import { useEffect, useMemo, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Tags,
} from "lucide-react";

import type { LaundryService } from "../../types/service";

import { getServices, updateService } from "../../services/service.service";

import { useAuth } from "../../contexts/AuthContext";

import ServiceFormModal from "../../components/services/ServiceFormModal";

import ServiceDetailModal from "../../components/services/ServiceDetailModal";

import Toast, { type ToastType } from "../../components/ui/Toast";

import ConfirmDialog from "../../components/ui/ConfirmDialog";

type ToastState = {
  type: ToastType;
  title: string;
  message: string;
};

export default function ServicesPage() {
  const { user } = useAuth();

  const [services, setServices] = useState<LaundryService[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);

  const [editingService, setEditingService] = useState<LaundryService | null>(
    null,
  );

  const [selectedService, setSelectedService] = useState<LaundryService | null>(
    null,
  );

  const [serviceToToggle, setServiceToToggle] = useState<LaundryService | null>(
    null,
  );

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);

  const pageSize = 10;

  async function loadServices() {
    try {
      setLoading(true);

      const data = await getServices();

      setServices(data);
    } catch (error) {
      console.error("Gagal memuat service:", error);

      setToast({
        type: "error",
        title: "Gagal memuat service",
        message: "Data service tidak dapat diambil dari server.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        keyword.length === 0 ||
        service.name.toLowerCase().includes(keyword) ||
        service.unit.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && service.isActive) ||
        (statusFilter === "INACTIVE" && !service.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [services, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));

  const safePage = Math.min(page, totalPages);

  const startIndex = (safePage - 1) * pageSize;

  const paginatedServices = filteredServices.slice(
    startIndex,
    startIndex + pageSize,
  );

  const activeCount = services.filter((service) => service.isActive).length;

  const inactiveCount = services.filter((service) => !service.isActive).length;

  function openCreateModal() {
    setEditingService(null);
    setFormOpen(true);
  }

  function openEditModal(service: LaundryService) {
    setSelectedService(null);
    setEditingService(service);
    setFormOpen(true);
  }

  function handleSaved(service: LaundryService, mode: "create" | "update") {
    setServices((current) => {
      if (mode === "update") {
        return current.map((item) => (item.id === service.id ? service : item));
      }

      return [service, ...current];
    });

    setFormOpen(false);
    setEditingService(null);

    setToast({
      type: "success",
      title: mode === "create" ? "Service ditambahkan" : "Service diperbarui",
      message:
        mode === "create"
          ? "Service baru berhasil ditambahkan."
          : "Perubahan service berhasil disimpan.",
    });
  }

  function requestToggleStatus(service: LaundryService) {
    setSelectedService(null);
    setServiceToToggle(service);
  }

  async function confirmToggleStatus() {
    if (!serviceToToggle) {
      return;
    }

    try {
      setTogglingId(serviceToToggle.id);

      const updated = await updateService(serviceToToggle.id, {
        isActive: !serviceToToggle.isActive,
      });

      setServices((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );

      setToast({
        type: "success",
        title: updated.isActive
          ? "Service diaktifkan"
          : "Service dinonaktifkan",
        message: updated.isActive
          ? "Service kembali tersedia untuk digunakan."
          : "Service tidak lagi tersedia untuk order baru.",
      });

      setServiceToToggle(null);
    } catch (error) {
      console.error("Gagal mengubah status service:", error);

      setToast({
        type: "error",
        title: "Gagal mengubah status",
        message: "Status service gagal diperbarui.",
      });
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="page-enter space-y-6">
      {/* HEADER */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">Services</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Layanan Laundry
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola layanan, satuan, harga, dan status service.
          </p>
        </div>

        {user?.role === "ADMIN" && (
          <button
            type="button"
            onClick={openCreateModal}
            title="Tambah Service"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 p-3 text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
          </button>
        )}
      </section>

      {/* SUMMARY */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatBox icon={Tags} label="Total Service" value={services.length} />

        <StatBox icon={Power} label="Service Aktif" value={activeCount} />

        <StatBox icon={Power} label="Service Nonaktif" value={inactiveCount} />
      </section>

      {/* TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
              placeholder="Cari nama service atau satuan..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "ALL" | "ACTIVE" | "INACTIVE",
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Semua Status</option>

            <option value="ACTIVE">Aktif</option>

            <option value="INACTIVE">Nonaktif</option>
          </select>

          <button
            type="button"
            onClick={() => void loadServices()}
            disabled={loading}
            title="Refresh"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <p className="text-sm text-slate-500">Memuat service...</p>
          </div>
        ) : (
          <div className="rtable-wrap overflow-x-auto p-3 sm:p-0">
            <table className="rtable w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Service
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Satuan
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Harga
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <p className="text-sm font-semibold text-slate-500">
                        Tidak ada service
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Coba ubah pencarian atau filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedServices.map((service) => (
                    <tr
                      key={service.id}
                      className="border-b border-slate-50 transition hover:bg-slate-50/60"
                    >
                      <td data-label="Service" className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Tags size={18} />
                          </div>

                          <div className="min-w-0 text-left">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {service.name}
                            </p>

                            <p className="mt-1 max-w-[320px] truncate text-xs text-slate-400">
                              {service.description || "Tidak ada deskripsi"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td data-label="Satuan" className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {service.unit}
                        </span>
                      </td>

                      <td data-label="Harga" className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(service.price)}
                      </td>

                      <td data-label="Status" className="px-5 py-4">
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                            service.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          ].join(" ")}
                        >
                          {service.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>

                      <td data-label="Action" className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedService(service)}
                            title="Detail"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                          >
                            <Eye size={15} />
                          </button>

                          {user?.role === "ADMIN" && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(service)}
                                title="Edit"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                type="button"
                                disabled={togglingId === service.id}
                                onClick={() => requestToggleStatus(service)}
                                title={service.isActive ? "Nonaktifkan" : "Aktifkan"}
                                className={[
                                  "inline-flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-50",
                                  service.isActive
                                    ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                    : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                                ].join(" ")}
                              >
                                <Power size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredServices.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Menampilkan{" "}
              <span className="font-semibold text-slate-900">
                {startIndex + 1}–
                {Math.min(startIndex + pageSize, filteredServices.length)}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-900">
                {filteredServices.length}
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

      {/* FORM */}
      {formOpen && (
        <ServiceFormModal
          service={editingService}
          onClose={() => {
            setFormOpen(false);
            setEditingService(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* DETAIL */}
      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          canEdit={user?.role === "ADMIN"}
          onClose={() => setSelectedService(null)}
          onEdit={() => openEditModal(selectedService)}
          onToggleStatus={() => requestToggleStatus(selectedService)}
        />
      )}

      {/* CONFIRM */}
      {serviceToToggle && (
        <ConfirmDialog
          title={
            serviceToToggle.isActive
              ? "Nonaktifkan service?"
              : "Aktifkan service?"
          }
          message={
            serviceToToggle.isActive
              ? `Service "${serviceToToggle.name}" tidak akan dapat digunakan untuk order baru setelah dinonaktifkan.`
              : `Service "${serviceToToggle.name}" akan tersedia kembali untuk order baru.`
          }
          confirmText={
            serviceToToggle.isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan"
          }
          loading={togglingId === serviceToToggle.id}
          onCancel={() => setServiceToToggle(null)}
          onConfirm={() => void confirmToggleStatus()}
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tags;
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
