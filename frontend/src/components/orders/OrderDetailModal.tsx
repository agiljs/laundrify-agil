import { useEffect, useState } from "react";
import {
  Check,
  Clock3,
  CreditCard,
  Download,
  Loader2,
  PackageCheck,
  X,
  Plus,
} from "lucide-react";

import type { Order, OrderStatus } from "../../types/order";

import { getOrderById, updateOrderStatus } from "../../services/order.service";
import PaymentFormModal from "../payments/PaymentFormModal";

type OrderDetailModalProps = {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onUpdated: (order: Order) => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const STATUS_STEPS: OrderStatus[] = [
  "RECEIVED",
  "WASHING",
  "DRYING",
  "IRONING",
  "READY",
  "COMPLETED",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: "Diterima",
  WASHING: "Dicuci",
  DRYING: "Dikeringkan",
  IRONING: "Disetrika",
  READY: "Siap Diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const apiError = error as ApiError;

    return apiError.response?.data?.message ?? fallback;
  }

  return fallback;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClasses(status: OrderStatus): string {
  switch (status) {
    case "RECEIVED":
      return "bg-slate-100 text-slate-700";

    case "WASHING":
      return "bg-blue-100 text-blue-700";

    case "DRYING":
      return "bg-amber-100 text-amber-700";

    case "IRONING":
      return "bg-blue-100 text-blue-700";

    case "READY":
      return "bg-emerald-100 text-emerald-700";

    case "COMPLETED":
      return "bg-green-100 text-green-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getPaymentClasses(status: Order["paymentStatus"]): string {
  switch (status) {
    case "PAID":
      return "bg-emerald-100 text-emerald-700";

    case "PARTIAL":
      return "bg-amber-100 text-amber-700";

    case "REFUNDED":
      return "bg-red-100 text-red-700";

    case "UNPAID":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  if (currentIndex < 0 || currentIndex >= STATUS_STEPS.length - 1) {
    return null;
  }

  return STATUS_STEPS[currentIndex + 1];
}

export default function OrderDetailModal({
  open,
  order,
  onClose,
  onUpdated,
  onToast,
}: OrderDetailModalProps) {
  const [detail, setDetail] = useState<Order | null>(order);

  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [statusNote, setStatusNote] = useState("");

  const [error, setError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    setDetail(order);
  }, [order]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !order) {
      return;
    }

    const orderId = order.id;
    let cancelled = false;

    async function loadDetail() {
      try {
        setLoading(true);
        setError("");

        const result = await getOrderById(orderId);

        if (cancelled) {
          return;
        }

        setDetail(result);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        const message = getErrorMessage(
          loadError,
          "Gagal memuat detail order.",
        );

        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [open, order]);

  //   if (!open || !order) {
  //     return null;
  //   }

  //   const activeOrder = detail ?? order;
  if (!open || !order) {
    return null;
  }

  const currentOrder = order;

  const activeOrder = detail ?? currentOrder;

  const nextStatus = getNextStatus(activeOrder.status);

  async function handleStatusUpdate(status: OrderStatus) {
    try {
      setUpdatingStatus(true);
      setError("");

      const updatedOrder = await updateOrderStatus(
        activeOrder.id,
        status,
        statusNote,
      );

      setDetail(updatedOrder);

      onUpdated(updatedOrder);

      setStatusNote("");
      setShowStatusConfirm(false);
      setShowCancelConfirm(false);

      onToast(
        `Status order berhasil diubah menjadi ${STATUS_LABEL[status]}.`,
        "success",
      );
    } catch (updateError) {
      const message = getErrorMessage(
        updateError,
        "Gagal mengubah status order.",
      );

      setError(message);
      onToast(message, "error");
    } finally {
      setUpdatingStatus(false);
    }
  }

  function requestNextStatus() {
    if (!nextStatus) {
      return;
    }

    setShowStatusConfirm(true);
  }

  function requestCancel() {
    setShowCancelConfirm(true);
  }

  function handleDownloadInvoice() {
    const paid = (activeOrder.payments ?? [])
      .filter((payment) => (payment.status ?? "SUCCESS") === "SUCCESS")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remaining = Math.max(0, activeOrder.total - paid);

    const itemRows = (activeOrder.items ?? [])
      .map(
        (item) => `
        <tr>
          <td>${item.service?.name ?? "-"}</td>
          <td style="text-align:center">${item.quantity} ${item.service?.unit ?? ""}</td>
          <td style="text-align:right">${formatCurrency(item.priceSnapshot)}</td>
          <td style="text-align:right">${formatCurrency(item.subtotal)}</td>
        </tr>`,
      )
      .join("");

    const paymentRows = (activeOrder.payments ?? [])
      .map(
        (payment) => `
        <tr>
          <td>${formatDate(payment.paidAt ?? payment.createdAt)}</td>
          <td>${payment.method ?? "-"}</td>
          <td style="text-align:right">${formatCurrency(payment.amount)}</td>
        </tr>`,
      )
      .join("");

    const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Invoice ${activeOrder.orderCode}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; padding: 32px; }
  h1 { font-size: 20px; margin: 0; }
  .muted { color: #64748b; font-size: 12px; }
  .row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: left; }
  th { color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: .05em; }
  .totals { margin-top: 16px; margin-left: auto; width: 260px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .totals .grand { font-weight: bold; font-size: 15px; border-top: 1px solid #0f172a; margin-top: 6px; padding-top: 8px; }
  .section-title { font-weight: bold; margin-top: 28px; margin-bottom: 4px; font-size: 13px; }
  @media print { body { padding: 0 24px; } }
</style>
</head>
<body>
  <div class="row">
    <div>
      <h1>Laundrify</h1>
      <p class="muted">Invoice / Bukti Pembayaran</p>
    </div>
    <div style="text-align:right">
      <p class="muted">No. Order</p>
      <p style="font-weight:bold">${activeOrder.orderCode}</p>
      <p class="muted">${formatDate(activeOrder.createdAt)}</p>
    </div>
  </div>

  <div class="row">
    <div>
      <p class="muted">Pelanggan</p>
      <p style="font-weight:bold">${activeOrder.customer?.name ?? "-"}</p>
      <p class="muted">${activeOrder.customer?.phone ?? "-"}</p>
    </div>
    <div style="text-align:right">
      <p class="muted">Status Pembayaran</p>
      <p style="font-weight:bold">${activeOrder.paymentStatus}</p>
    </div>
  </div>

  <p class="section-title">Rincian Layanan</p>
  <table>
    <thead><tr><th>Layanan</th><th style="text-align:center">Qty</th><th style="text-align:right">Harga</th><th style="text-align:right">Subtotal</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${formatCurrency(activeOrder.subtotal)}</span></div>
    <div><span>Discount</span><span>- ${formatCurrency(activeOrder.discount)}</span></div>
    <div class="grand"><span>Total</span><span>${formatCurrency(activeOrder.total)}</span></div>
    <div><span>Sudah Dibayar</span><span>${formatCurrency(paid)}</span></div>
    <div><span>Sisa Tagihan</span><span>${formatCurrency(remaining)}</span></div>
  </div>

  ${
    (activeOrder.payments ?? []).length > 0
      ? `<p class="section-title">Riwayat Pembayaran</p>
  <table>
    <thead><tr><th>Tanggal</th><th>Metode</th><th style="text-align:right">Jumlah</th></tr></thead>
    <tbody>${paymentRows}</tbody>
  </table>`
      : ""
  }

  <p class="muted" style="margin-top:32px">Dicetak otomatis oleh sistem Laundrify.</p>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=800,height=900");

    if (!printWindow) {
      onToast("Izinkan pop-up untuk mengunduh invoice.", "error");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {activeOrder.orderCode}
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                  activeOrder.status,
                )}`}
              >
                {STATUS_LABEL[activeOrder.status]}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentClasses(
                  activeOrder.paymentStatus,
                )}`}
              >
                {activeOrder.paymentStatus}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Dibuat {formatDate(activeOrder.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={updatingStatus}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-blue-600" />

              <span className="ml-3 text-sm text-slate-500">
                Memuat detail order...
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </p>

                  <p className="mt-2 font-bold text-slate-900">
                    {activeOrder.customer?.name ?? "-"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {activeOrder.customer?.phone ?? "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estimasi Selesai
                  </p>

                  <p className="mt-2 font-bold text-slate-900">
                    {formatDate(activeOrder.dueAt)}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {activeOrder.note || "Tidak ada catatan"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Dibuat Oleh
                  </p>

                  <p className="mt-2 font-bold text-slate-900">
                    {activeOrder.createdBy?.name ?? "-"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {activeOrder.createdBy?.role ?? "-"}
                  </p>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <PackageCheck size={18} className="text-blue-600" />

                  <h3 className="font-bold text-slate-900">Status Progress</h3>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 p-4">
                  <div className="flex min-w-175 items-start">
                    {STATUS_STEPS.map((status, index) => {
                      const currentIndex = STATUS_STEPS.indexOf(
                        activeOrder.status,
                      );

                      const completed = currentIndex >= index;

                      const isCurrent = activeOrder.status === status;

                      return (
                        <div key={status} className="flex flex-1 items-start">
                          <div className="flex min-w-0 flex-1 flex-col items-center">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
                                completed
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-200 bg-white text-slate-400"
                              }`}
                            >
                              {completed && !isCurrent ? (
                                <Check size={16} />
                              ) : (
                                index + 1
                              )}
                            </div>

                            <p
                              className={`mt-2 text-center text-xs font-semibold ${
                                isCurrent
                                  ? "text-blue-600"
                                  : completed
                                    ? "text-slate-700"
                                    : "text-slate-400"
                              }`}
                            >
                              {STATUS_LABEL[status]}
                            </p>
                          </div>

                          {index < STATUS_STEPS.length - 1 && (
                            <div
                              className={`mt-4 h-0.5 flex-1 ${
                                currentIndex > index
                                  ? "bg-blue-600"
                                  : "bg-slate-200"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {nextStatus &&
                    activeOrder.status !== "CANCELLED" &&
                    activeOrder.status !== "COMPLETED" && (
                      <button
                        type="button"
                        onClick={requestNextStatus}
                        disabled={updatingStatus}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Clock3 size={17} />
                        Lanjut ke {STATUS_LABEL[nextStatus]}
                      </button>
                    )}

                  {activeOrder.status !== "COMPLETED" &&
                    activeOrder.status !== "CANCELLED" && (
                      <button
                        type="button"
                        onClick={requestCancel}
                        disabled={updatingStatus}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Batalkan Order
                      </button>
                    )}
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-bold text-slate-900">Item Layanan</h3>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">
                            Service
                          </th>

                          <th className="px-4 py-3 text-right font-semibold text-slate-600">
                            Qty
                          </th>

                          <th className="px-4 py-3 text-right font-semibold text-slate-600">
                            Harga
                          </th>

                          <th className="px-4 py-3 text-right font-semibold text-slate-600">
                            Subtotal
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {activeOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900">
                                {item.service?.name ?? "Service"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Unit: {item.service?.unit ?? "-"}
                              </p>
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {item.quantity}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatCurrency(item.priceSnapshot)}
                            </td>

                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}

                        {activeOrder.items.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-10 text-center text-sm text-slate-500"
                            >
                              Tidak ada item order.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-blue-600" />

                    <h3 className="font-bold text-slate-900">Pembayaran</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>

                      <span className="font-semibold">
                        {activeOrder.paymentStatus}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Order</span>

                      <span className="font-semibold">
                        {formatCurrency(activeOrder.total)}
                      </span>
                    </div>

                    {(() => {
                      const paid = (activeOrder.payments ?? [])
                        .filter((payment) => (payment.status ?? "SUCCESS") === "SUCCESS")
                        .reduce((sum, payment) => sum + Number(payment.amount), 0);
                      const remaining = Math.max(0, activeOrder.total - paid);

                      return (
                        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                          <div className="rounded-xl bg-emerald-50 p-3">
                            <p className="text-xs text-slate-500">Sudah Dibayar</p>
                            <p className="mt-1 font-bold text-emerald-700">{formatCurrency(paid)}</p>
                          </div>
                          <div className="rounded-xl bg-amber-50 p-3">
                            <p className="text-xs text-slate-500">Sisa Tagihan</p>
                            <p className="mt-1 font-bold text-amber-700">{formatCurrency(remaining)}</p>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="border-t border-slate-100 pt-3">
                      {activeOrder.payments &&
                      activeOrder.payments.length > 0 ? (
                        activeOrder.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="mb-2 rounded-lg bg-slate-50 p-3 last:mb-0"
                          >
                            <div className="flex justify-between">
                              <span className="text-slate-500">
                                {payment.method ?? "Payment"}
                              </span>

                              <span className="font-semibold text-slate-900">
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatDate(payment.paidAt ?? payment.createdAt)}
                            </p>
                            {payment.method === "CASH" && (payment.changeAmount ?? 0) > 0 && (
                              <div className="mt-2 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs">
                                <span className="font-semibold text-blue-700">Kembalian</span>
                                <span className="font-black text-blue-800">{formatCurrency(Number(payment.changeAmount))}</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          Belum ada pembayaran.
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPaymentForm(true)}
                        disabled={activeOrder.paymentStatus === "PAID" || activeOrder.status === "CANCELLED"}
                        title="Tambah Pembayaran"
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 p-2.5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadInvoice}
                        disabled={!activeOrder.payments || activeOrder.payments.length === 0}
                        title="Unduh Invoice"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="mb-4 font-bold text-slate-900">Ringkasan</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal</span>

                      <span>{formatCurrency(activeOrder.subtotal)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Discount</span>

                      <span className="text-emerald-600">
                        - {formatCurrency(activeOrder.discount)}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-base font-bold text-slate-900">
                          Total
                        </span>

                        <span className="text-lg font-bold text-slate-900">
                          {formatCurrency(activeOrder.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-bold text-slate-900">
                  Riwayat Status
                </h3>

                <div className="space-y-3">
                  {(activeOrder.statusHistory ?? []).length > 0 ? (
                    activeOrder.statusHistory?.map((history, index) => (
                      <div
                        key={`${history.status}-${history.changedAt}-${index}`}
                        className="flex gap-3 rounded-xl border border-slate-200 p-3"
                      >
                        <div className="mt-1">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${getStatusClasses(
                              history.status,
                            )}`}
                          >
                            <Clock3 size={15} />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap justify-between gap-2">
                            <p className="font-semibold text-slate-900">
                              {STATUS_LABEL[history.status]}
                            </p>

                            <span className="text-xs text-slate-400">
                              {formatDate(history.changedAt)}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {typeof history.changedBy === "object" && history.changedBy ? history.changedBy.name : "Admin"}
                          </p>

                          {history.note && (
                            <p className="mt-2 text-sm text-slate-600">
                              {history.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                      Belum ada riwayat status.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>

        {showStatusConfirm && nextStatus && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900">
                Ubah Status Order?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Status akan diubah dari{" "}
                <strong>{STATUS_LABEL[activeOrder.status]}</strong> menjadi{" "}
                <strong>{STATUS_LABEL[nextStatus]}</strong>.
              </p>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Catatan
                </span>

                <textarea
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  rows={3}
                  disabled={updatingStatus}
                  placeholder="Catatan opsional..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </label>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStatusConfirm(false)}
                  disabled={updatingStatus}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={() => void handleStatusUpdate(nextStatus)}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {updatingStatus && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Konfirmasi
                </button>
              </div>
            </div>
          </div>
        )}

        {showCancelConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900">
                Batalkan Order?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Order <strong>{activeOrder.orderCode}</strong> akan ditandai
                sebagai dibatalkan.
              </p>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Alasan
                </span>

                <textarea
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  rows={3}
                  disabled={updatingStatus}
                  placeholder="Masukkan alasan pembatalan..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                />
              </label>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={updatingStatus}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={() => void handleStatusUpdate("CANCELLED")}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {updatingStatus && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        )}

        {activeOrder.status === "COMPLETED" && (
          <div className="border-t border-slate-200 bg-emerald-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                <Check size={18} className="text-emerald-600" />
              </div>

              <div>
                <p className="text-sm font-bold text-emerald-800">
                  Order selesai
                </p>

                <p className="text-xs text-emerald-700">
                  {formatDate(activeOrder.completedAt)}
                </p>
              </div>
            </div>
          </div>
        )}

      <PaymentFormModal
        open={showPaymentForm}
        order={activeOrder}
        onClose={() => setShowPaymentForm(false)}
        onUpdated={(updatedOrder) => {
          setDetail(updatedOrder);
          onUpdated(updatedOrder);
        }}
        onToast={onToast}
      />
      </div>
    </div>
  );
}
