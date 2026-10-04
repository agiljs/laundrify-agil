import { Pencil, Power, X } from "lucide-react";

import type { LaundryService } from "../../types/service";

import { formatCurrency, formatDate } from "../../utils/format";

type Props = {
  service: LaundryService;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
};

export default function ServiceDetailModal({
  service,
  canEdit,
  onClose,
  onEdit,
  onToggleStatus,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Detail Service</h2>

            <p className="mt-1 text-sm text-slate-500">
              Informasi layanan laundry
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {service.name}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {service.description || "Tidak ada deskripsi"}
              </p>
            </div>

            <span
              className={[
                "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                service.isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-200 text-slate-600",
              ].join(" ")}
            >
              {service.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Info label="Harga" value={formatCurrency(service.price)} />

            <Info label="Satuan" value={service.unit} />

            <Info label="Dibuat" value={formatDate(service.createdAt)} />

            <Info label="Diperbarui" value={formatDate(service.updatedAt)} />
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Inventory Usage
            </p>

            {service.inventoryUsage &&
            Object.keys(service.inventoryUsage).length > 0 ? (
              <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                {JSON.stringify(service.inventoryUsage, null, 2)}
              </pre>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                Belum dikonfigurasi.
              </p>
            )}
          </div>

          {canEdit && (
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <Pencil size={16} />
                Edit
              </button>

              <button
                type="button"
                onClick={onToggleStatus}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
                  service.isActive
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                ].join(" ")}
              >
                <Power size={16} />

                {service.isActive ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
