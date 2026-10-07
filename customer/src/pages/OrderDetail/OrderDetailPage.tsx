import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, Clock, CreditCard, Loader2, PartyPopper, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useRealtime } from "../../hooks/useRealtime";
import {
  apiErrorMessage,
  getMyOrder,
  startMidtransPayment,
  syncMidtransPayment,
} from "../../services/customer.service";
import type { Order } from "../../types";
import { formatCurrency, formatDate } from "../../utils/format";
import { openMidtransSnap } from "../../utils/midtrans";
import Toast, { type ToastType } from "../../components/ui/Toast";
import { Spinner } from "../../components/CustomerLayout";
import {
  ORDER_FLOW,
  ORDER_STATUS_CLASS,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_CLASS,
  PAYMENT_STATUS_LABEL,
  canPay,
} from "../../utils/orderStatus";

const EVENTS = ["order:updated", "order:status-updated", "order:deleted", "payment:updated"] as const;

const PAYMENT_TX_LABEL: Record<string, { label: string; className: string }> = {
  SUCCESS: { label: "Berhasil", className: "bg-emerald-50 text-emerald-700" },
  PENDING: { label: "Menunggu pembayaran", className: "bg-amber-50 text-amber-700" },
  FAILED: { label: "Gagal / kedaluwarsa", className: "bg-red-50 text-red-700" },
  REFUNDED: { label: "Dikembalikan", className: "bg-slate-100 text-slate-600" },
};

function dateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function CustomerOrderDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated);
  const [searchParams, setSearchParams] = useSearchParams();
  const autoPayRef = useRef(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; title: string; message: string } | null>(null);
  const syncedPendingRef = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError("");
        const data = await getMyOrder(id);
        setOrder(data);

        // Ada transaksi Midtrans yang masih pending (mis. kembali dari halaman bayar)? Cek statusnya sekali.
        const hasPending = (data.payments ?? []).some((p) => p.status === "PENDING" && p.transactionCode?.startsWith("MT-"));
        if (hasPending && !syncedPendingRef.current) {
          syncedPendingRef.current = true;
          const synced = await syncMidtransPayment(id);
          setOrder(synced.order);
        }
      } catch (e) {
        setError(apiErrorMessage(e, "Order tidak dapat dimuat."));
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    syncedPendingRef.current = false;
    void load();
  }, [load]);

  useRealtime(EVENTS, (event) => {
    void load(true);
    if (event === "order:status-updated") {
      setToast({ type: "info", title: "Status diperbarui", message: "Status order Anda berubah." });
    }
  });

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const paid = useMemo(
    () => (order?.payments ?? []).filter((p) => p.status === "SUCCESS").reduce((sum, p) => sum + p.amount, 0),
    [order],
  );
  const remaining = order ? Math.max(0, Math.ceil(Number(order.total) - paid)) : 0;

  async function refreshAfterPay(outcome: "success" | "pending" | "error" | "closed") {
    setChecking(true);
    try {
      const synced = await syncMidtransPayment(id);
      setOrder(synced.order);

      if (synced.order.paymentStatus === "PAID") {
        setToast({ type: "success", title: "Pembayaran berhasil", message: "Terima kasih! Order Anda sudah lunas." });
      } else if (outcome === "pending") {
        setToast({ type: "info", title: "Menunggu pembayaran", message: "Selesaikan pembayaran sesuai instruksi. Status akan diperbarui otomatis." });
      } else if (outcome === "error") {
        setToast({ type: "error", title: "Pembayaran gagal", message: "Silakan coba lagi atau pilih metode lain." });
      }
    } catch (e) {
      setToast({ type: "error", title: "Gagal memeriksa pembayaran", message: apiErrorMessage(e) });
    } finally {
      setChecking(false);
    }
  }

  async function pay() {
    if (!order || paying) return;
    setPaying(true);
    try {
      const snap = await startMidtransPayment(order.id);
      const outcome = await openMidtransSnap({
        token: snap.token,
        clientKey: snap.clientKey,
        isProduction: snap.isProduction,
      });
      await refreshAfterPay(outcome);
    } catch (e) {
      setToast({ type: "error", title: "Tidak bisa membuka pembayaran", message: apiErrorMessage(e) });
    } finally {
      setPaying(false);
    }
  }

  // Datang dari tombol "Bayar Sekarang" di beranda (?bayar=1): langsung buka popup Midtrans satu kali.
  useEffect(() => {
    if (searchParams.get("bayar") !== "1" || autoPayRef.current || !order) return;
    autoPayRef.current = true;
    setSearchParams({}, { replace: true });
    if (canPay(order)) void pay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, searchParams]);

  if (loading) return <Spinner label="Memuat order..." />;

  if (error || !order) {
    return (
      <div className="laundry-card flex flex-col items-center px-6 py-10 text-center">
        <AlertCircle className="text-red-500" />
        <p className="mt-3 text-sm font-extrabold">Order tidak dapat dibuka</p>
        <p className="mt-1 text-xs text-slate-500">{error || "Order tidak ditemukan."}</p>
        <Link to="/" className="mt-4 rounded-xl bg-sky-700 px-4 py-2.5 text-xs font-bold text-white">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const cancelled = order.status === "CANCELLED";
  const currentIndex = ORDER_FLOW.indexOf(order.status);
  const deliveryFee = Number(order.deliveryFee ?? 0);
  const payable = canPay(order);
  const hasPending = (order.payments ?? []).some((p) => p.status === "PENDING");

  return (
    <div className="page-enter space-y-4">
      {toast && <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}

      <button type="button" onClick={() => navigate("/")} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
        <ArrowLeft size={14} /> Beranda
      </button>

      {justCreated && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <PartyPopper size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-extrabold">Order berhasil dibuat!</p>
            <p className="mt-0.5 text-xs leading-5 opacity-80">Anda bisa membayar sekarang atau nanti dari halaman ini.</p>
          </div>
        </div>
      )}

      <section className="laundry-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Kode order</p>
            <p className="mt-0.5 break-all text-lg font-extrabold tracking-tight text-slate-900">{order.orderCode}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Dibuat {dateTime(order.createdAt)}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${ORDER_STATUS_CLASS[order.status]}`}>
              {ORDER_STATUS_LABEL[order.status]}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${PAYMENT_STATUS_CLASS[order.paymentStatus]}`}>
              {PAYMENT_STATUS_LABEL[order.paymentStatus]}
            </span>
          </div>
        </div>
        {order.dueAt && <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">Target selesai: <b className="text-slate-700">{formatDate(order.dueAt)}</b></p>}
      </section>

      <section className="laundry-card p-4">
        <h2 className="text-sm font-extrabold text-slate-900">Progres cucian</h2>
        {cancelled ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-red-50 p-3 text-red-700">
            <XCircle size={18} />
            <p className="text-xs font-bold">Order ini dibatalkan.</p>
          </div>
        ) : (
          <ol className="mt-4">
            {ORDER_FLOW.map((step, index) => {
              const done = index < currentIndex || order.status === "COMPLETED";
              const active = index === currentIndex && order.status !== "COMPLETED";
              return (
                <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < ORDER_FLOW.length - 1 && (
                    <span className={`absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-0.5 ${index < currentIndex ? "bg-sky-500" : "bg-slate-200"}`} />
                  )}
                  <span
                    className={`z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-[10px] font-black ${
                      done
                        ? "border-sky-600 bg-sky-600 text-white"
                        : active
                          ? "border-sky-600 bg-white text-sky-700 ring-4 ring-sky-100"
                          : "border-slate-200 bg-white text-slate-300"
                    }`}
                  >
                    {done ? <Check size={13} /> : index + 1}
                  </span>
                  <div className="pt-1">
                    <p className={`text-xs font-extrabold ${done || active ? "text-slate-900" : "text-slate-400"}`}>{ORDER_STATUS_LABEL[step]}</p>
                    {active && <p className="text-[11px] text-sky-600">Sedang berlangsung</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="laundry-card p-4">
        <h2 className="text-sm font-extrabold text-slate-900">Rincian layanan</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-800">{item.service?.name ?? "Layanan"}</p>
                <p className="text-[11px] text-slate-400">
                  {item.quantity} {item.service?.unit ?? ""} × {formatCurrency(item.priceSnapshot)}
                </p>
              </div>
              <p className="shrink-0 text-xs font-extrabold text-slate-800">{formatCurrency(item.subtotal)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-2 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
          <div className="flex justify-between text-slate-500"><dt>Subtotal</dt><dd>{formatCurrency(Number(order.subtotal))}</dd></div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-600"><dt>Diskon member</dt><dd>- {formatCurrency(Number(order.discount))}</dd></div>
          )}
          {deliveryFee > 0 && <div className="flex justify-between text-slate-500"><dt>Ongkir</dt><dd>{formatCurrency(deliveryFee)}</dd></div>}
          <div className="flex justify-between pt-1 text-sm font-extrabold text-slate-900"><dt>Total</dt><dd>{formatCurrency(Number(order.total))}</dd></div>
          {paid > 0 && <div className="flex justify-between text-emerald-600"><dt>Sudah dibayar</dt><dd>{formatCurrency(paid)}</dd></div>}
        </dl>

        {order.note && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">Catatan: {order.note}</p>}
      </section>

      {payable && (
        <section className="laundry-card overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sisa tagihan</p>
                <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900">{formatCurrency(remaining)}</p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-700"><CreditCard size={20} /></span>
            </div>

            {hasPending && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-amber-800">
                <Clock size={14} className="mt-0.5 shrink-0" />
                <p className="text-[11px] leading-4">Ada pembayaran yang menunggu penyelesaian. Selesaikan pembayaran tadi atau tekan Bayar Sekarang untuk membuat yang baru.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => void pay()}
              disabled={paying || checking}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0369a1] to-[#0284c7] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paying || checking ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {paying ? "Membuka pembayaran..." : checking ? "Memeriksa pembayaran..." : "Bayar Sekarang"}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck size={12} /> Pilih metode pembayaran di popup Midtrans (QRIS, e-wallet, transfer bank, dll.)
            </p>
          </div>
        </section>
      )}

      {(order.payments ?? []).length > 0 && (
        <section className="laundry-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Riwayat pembayaran</h2>
            {hasPending && (
              <button
                type="button"
                onClick={() => void refreshAfterPay("closed")}
                disabled={checking}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700"
              >
                <RefreshCw size={12} className={checking ? "animate-spin" : ""} /> Cek status
              </button>
            )}
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {[...(order.payments ?? [])].reverse().map((payment) => {
              const tx = PAYMENT_TX_LABEL[payment.status ?? "SUCCESS"] ?? PAYMENT_TX_LABEL.SUCCESS;
              return (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">{formatCurrency(payment.amount)}</p>
                    <p className="text-[11px] text-slate-400">{dateTime(payment.paidAt ?? payment.createdAt)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${tx.className}`}>{tx.label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

    </div>
  );
}
