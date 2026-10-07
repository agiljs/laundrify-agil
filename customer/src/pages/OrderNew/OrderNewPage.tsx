import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Minus, Plus, Shirt } from "lucide-react";
import { getActiveServices } from "../../services/customer.service";
import { apiErrorMessage, createMyOrder } from "../../services/customer.service";
import type { LaundryService } from "../../types";
import { formatCurrency } from "../../utils/format";
import Toast from "../../components/ui/Toast";
import { EmptyState, PageTitle, Spinner } from "../../components/CustomerLayout";

function stepFor(unit: string) {
  return ["PCS", "SET"].includes(unit.toUpperCase()) ? 1 : 0.5;
}

export default function CustomerOrderNewPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<LaundryService[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getActiveServices()
      .then(setServices)
      .catch((e) => setError(apiErrorMessage(e, "Layanan belum dapat dimuat.")))
      .finally(() => setLoading(false));
  }, []);

  function change(service: LaundryService, delta: number) {
    setQuantities((current) => {
      const next = Math.max(0, Math.round(((current[service.id] ?? 0) + delta) * 1000) / 1000);
      const copy = { ...current };
      if (next <= 0) delete copy[service.id];
      else copy[service.id] = next;
      return copy;
    });
  }

  const selected = useMemo(
    () => services.filter((s) => (quantities[s.id] ?? 0) > 0),
    [services, quantities],
  );
  const subtotal = selected.reduce((sum, s) => sum + s.price * (quantities[s.id] ?? 0), 0);

  async function submit() {
    if (submitting || selected.length === 0) return;

    if (dueDate && new Date(`${dueDate}T23:59:59`) < new Date()) {
      setError("Tanggal yang diinginkan tidak boleh sebelum hari ini.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const order = await createMyOrder({
        items: selected.map((s) => ({ serviceId: s.id, quantity: quantities[s.id] })),
        dueAt: dueDate ? new Date(`${dueDate}T17:00:00`).toISOString() : undefined,
        note: note.trim() || undefined,
      });
      navigate(`/orders/${order.id}`, { replace: true, state: { justCreated: true } });
    } catch (e) {
      setError(apiErrorMessage(e, "Order gagal dibuat."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-enter">
      {error && <Toast type="error" title="Tidak bisa melanjutkan" message={error} onClose={() => setError("")} />}

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"
      >
        <ArrowLeft size={14} /> Kembali
      </button>

      <PageTitle eyebrow="Order baru" title="Pilih layanan" subtitle="Tentukan jumlah tiap layanan. Berat final dikonfirmasi saat cucian ditimbang." />

      {loading ? (
        <Spinner label="Memuat layanan..." />
      ) : services.length === 0 ? (
        <EmptyState icon={Shirt} title="Belum ada layanan aktif" text="Silakan hubungi admin Laundrify." />
      ) : (
        <div className="space-y-3">
          {services.map((service) => {
            const qty = quantities[service.id] ?? 0;
            const step = stepFor(service.unit);
            return (
              <div
                key={service.id}
                className={`laundry-card p-4 transition ${qty > 0 ? "!border-sky-300 ring-2 ring-sky-100" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900">{service.name}</p>
                    {service.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{service.description}</p>}
                    <p className="mt-1.5 text-xs font-bold text-sky-700">
                      {formatCurrency(service.price)} <span className="font-medium text-slate-400">/ {service.unit}</span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {qty > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => change(service, -step)}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 active:bg-slate-100"
                          aria-label="Kurangi"
                        >
                          <Minus size={15} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-extrabold text-slate-900">{qty}</span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => change(service, step)}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-sky-700 text-white shadow active:bg-sky-800"
                      aria-label="Tambah"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
                {qty > 0 && (
                  <p className="mt-2 text-right text-xs font-bold text-slate-600">
                    {qty} {service.unit} = {formatCurrency(service.price * qty)}
                  </p>
                )}
              </div>
            );
          })}

          <div className="laundry-card space-y-4 p-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                Tanggal diinginkan (opsional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-transparent focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                Catatan (opsional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Contoh: jangan pakai pelembut, ada noda di kemeja putih"
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-transparent focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          <p className="px-1 text-[11px] leading-5 text-slate-400">
            Diskon member (jika ada) dihitung otomatis saat order dibuat. Pembayaran dilakukan setelah order terbuat.
          </p>
        </div>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Perkiraan subtotal</p>
            <p className="text-lg font-extrabold text-slate-900">{formatCurrency(subtotal)}</p>
          </div>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting || selected.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0369a1] to-[#0284c7] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? "Memproses..." : "Buat Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
