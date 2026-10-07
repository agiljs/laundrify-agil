import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronRight, CreditCard, Plus, Receipt, Shirt, Wallet } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useRealtime } from "../../hooks/useRealtime";
import { getMyOrders, apiErrorMessage } from "../../services/customer.service";
import type { Order } from "../../types";
import { formatCurrency, formatDate } from "../../utils/format";
import Toast from "../../components/ui/Toast";
import { EmptyState, Spinner } from "../../components/CustomerLayout";
import {
  ACTIVE_STATUSES,
  ORDER_STATUS_CLASS,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_CLASS,
  PAYMENT_STATUS_LABEL,
  canPay,
} from "../../utils/orderStatus";

type Filter = "ALL" | "ACTIVE" | "UNPAID" | "DONE";

const FILTERS: Array<[Filter, string]> = [
  ["ALL", "Semua"],
  ["ACTIVE", "Diproses"],
  ["UNPAID", "Belum Bayar"],
  ["DONE", "Selesai"],
];

const ORDER_EVENTS = [
  "order:created",
  "order:updated",
  "order:status-updated",
  "order:deleted",
  "payment:updated",
] as const;

export default function CustomerHomePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      setOrders(await getMyOrders());
    } catch (e) {
      setError(apiErrorMessage(e, "Order belum dapat dimuat."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtime(ORDER_EVENTS, (event, payload) => {
    void load(true);
    const data = payload as { orderCode?: string; status?: keyof typeof ORDER_STATUS_LABEL } | null;
    if (event === "order:status-updated" && data?.orderCode && data.status) {
      setToast({ title: "Status order diperbarui", message: `${data.orderCode} • ${ORDER_STATUS_LABEL[data.status]}` });
    }
  });

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const stats = useMemo(() => {
    const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
    const outstanding = orders
      .filter(canPay)
      .reduce((sum, o) => {
        const paid = (o.payments ?? []).filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0);
        return sum + Math.max(0, Number(o.total) - paid);
      }, 0);
    return { active, outstanding };
  }, [orders]);

  const visible = useMemo(() => {
    switch (filter) {
      case "ACTIVE":
        return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
      case "UNPAID":
        return orders.filter(canPay);
      case "DONE":
        return orders.filter((o) => o.status === "COMPLETED");
      default:
        return orders;
    }
  }, [orders, filter]);

  const firstName = (user?.name ?? "").split(" ")[0] || "Customer";

  return (
    <div className="page-enter space-y-4">
      {toast && <Toast type="info" title={toast.title} message={toast.message} onClose={() => setToast(null)} />}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c4a6e] via-[#0369a1] to-[#0284c7] p-5 text-white shadow-xl shadow-sky-900/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,255,255,.18),transparent_35%)]" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-100">Selamat datang</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Halo, {firstName}!</h1>
          {user?.customerCode && <p className="mt-0.5 text-[11px] font-semibold text-sky-100/80">{user.customerCode}</p>}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
              <Shirt size={15} className="text-sky-200" />
              <p className="mt-2 text-xl font-extrabold">{stats.active}</p>
              <p className="text-[10px] font-semibold text-white/70">Order diproses</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
              <Wallet size={15} className="text-sky-200" />
              <p className="mt-2 text-xl font-extrabold">{formatCurrency(stats.outstanding)}</p>
              <p className="text-[10px] font-semibold text-white/70">Tagihan belum dibayar</p>
            </div>
          </div>

          <Link
            to="/orders/new"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-sky-700 shadow-lg transition hover:bg-sky-50"
          >
            <Plus size={16} /> Buat Order Baru
          </Link>
        </div>
      </section>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
              filter === value ? "bg-sky-700 text-white shadow" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Memuat order..." />
      ) : error ? (
        <div className="laundry-card flex flex-col items-center px-6 py-10 text-center">
          <AlertCircle className="text-red-500" />
          <p className="mt-3 text-sm font-extrabold">Gagal memuat order</p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
          <button onClick={() => void load()} className="mt-4 rounded-xl bg-sky-700 px-4 py-2.5 text-xs font-bold text-white">
            Coba Lagi
          </button>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={orders.length === 0 ? "Belum ada order" : "Tidak ada order di filter ini"}
          text={orders.length === 0 ? "Buat order pertama Anda dan pantau prosesnya langsung dari sini." : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => (
            <li key={order.id}>
              <div className="laundry-card overflow-hidden">
                <Link to={`/orders/${order.id}`} className="block p-4 transition active:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-900">{order.orderCode}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${ORDER_STATUS_CLASS[order.status]}`}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>

                  <p className="mt-2 truncate text-xs text-slate-500">
                    {order.items.map((item) => item.service?.name ?? "Layanan").slice(0, 3).join(", ")}
                    {order.items.length > 3 ? ` +${order.items.length - 3}` : ""}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{formatCurrency(Number(order.total))}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${PAYMENT_STATUS_CLASS[order.paymentStatus]}`}>
                        {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-sky-700">
                      Detail <ChevronRight size={14} />
                    </span>
                  </div>
                </Link>

                {canPay(order) && (
                  <Link
                    to={`/orders/${order.id}?bayar=1`}
                    className="flex items-center justify-center gap-2 border-t border-sky-100 bg-sky-700 px-4 py-3 text-xs font-bold text-white transition active:bg-sky-800"
                  >
                    <CreditCard size={14} /> Bayar Sekarang
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
