import { useEffect, useState, type FormEvent } from "react";

import { X } from "lucide-react";

import type { Customer, MembershipType } from "../../types/customer";

import {
  createCustomer,
  updateCustomer,
} from "../../services/customer.service";

type CustomerFormModalProps = {
  customer: Customer | null;
  onClose: () => void;
  onSaved: (customer: Customer, mode: "create" | "update") => void;
};

export default function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: CustomerFormModalProps) {
  const isEdit = customer !== null;

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const [address, setAddress] = useState("");

  const [notes, setNotes] = useState("");

  const [membershipType, setMembershipType] = useState<MembershipType>("NONE");

  const [membershipDiscount, setMembershipDiscount] = useState("0");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    setName(customer?.name ?? "");

    setPhone(customer?.phone ?? "");

    setEmail(customer?.email ?? "");

    setAddress(customer?.address ?? "");

    setNotes(customer?.notes ?? "");

    setMembershipType(customer?.membershipType ?? "NONE");

    setMembershipDiscount(String(customer?.membershipDiscount ?? 0));

    setError("");
  }, [customer]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = name.trim();

    const cleanPhone = phone.trim();

    if (!cleanName) {
      setError("Nama pelanggan wajib diisi.");

      return;
    }

    if (!cleanPhone) {
      setError("Nomor HP wajib diisi.");

      return;
    }

    const discount = Number(membershipDiscount);

    if (Number.isNaN(discount) || discount < 0 || discount > 100) {
      setError("Diskon membership harus antara 0 sampai 100.");

      return;
    }

    if (!window.confirm(isEdit ? `Simpan perubahan data ${name.trim()}?` : `Tambahkan pelanggan ${name.trim()}?`)) return;

    try {
      setLoading(true);
      setError("");

      const payload = {
        name: cleanName,
        phone: cleanPhone,

        email: email.trim() || undefined,

        address: address.trim() || undefined,

        notes: notes.trim() || undefined,

        membershipType,

        membershipDiscount: discount,
      };

      let savedCustomer: Customer;

      if (isEdit) {
        savedCustomer = await updateCustomer(customer.id, payload);
      } else {
        savedCustomer = await createCustomer(payload);
      }

      onSaved(savedCustomer, isEdit ? "update" : "create");
    } catch (error) {
      console.error("Customer save error:", error);

      setError(
        "Data customer gagal disimpan. Periksa koneksi server dan data yang dimasukkan.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? "Edit Pelanggan" : "Tambah Pelanggan"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEdit
                ? "Perbarui informasi pelanggan."
                : "Tambahkan pelanggan baru ke Laundrify."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Nama Pelanggan"
              value={name}
              onChange={setName}
              required
            />

            <InputField
              label="Nomor HP"
              value={phone}
              onChange={setPhone}
              required
            />

            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Membership
              </label>

              <select
                value={membershipType}
                onChange={(event) =>
                  setMembershipType(event.target.value as MembershipType)
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              >
                <option value="NONE">Non Member</option>

                <option value="MEMBER">Member</option>
              </select>
            </div>

            <InputField
              label="Diskon Membership (%)"
              type="number"
              value={membershipDiscount}
              onChange={setMembershipDiscount}
            />
          </div>

          <TextareaField
            label="Alamat"
            value={address}
            onChange={setAddress}
            placeholder="Alamat pelanggan..."
          />

          <TextareaField
            label="Catatan"
            value={notes}
            onChange={setNotes}
            placeholder="Catatan tambahan..."
          />

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Tambah Pelanggan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        min={type === "number" ? "0" : undefined}
        max={type === "number" ? "100" : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <textarea
        value={value}
        rows={3}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
