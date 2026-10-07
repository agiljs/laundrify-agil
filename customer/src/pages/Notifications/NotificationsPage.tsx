import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";
import type { NotificationItem } from "../../types";
import { useRealtime } from "../../hooks/useRealtime";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/customer.service";
import { EmptyState, NOTIFICATIONS_CHANGED, PageTitle, Spinner } from "../../components/CustomerLayout";

const EVENTS = ["notification:new"] as const;

const ICON = {
  INFO: { icon: Info, className: "bg-sky-50 text-sky-600" },
  SUCCESS: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" },
  WARNING: { icon: TriangleAlert, className: "bg-amber-50 text-amber-600" },
  ERROR: { icon: XCircle, className: "bg-red-50 text-red-600" },
} as const;

function dateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function CustomerNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setItems(await getNotifications());
    } catch {
      /* biarkan daftar lama tetap tampil */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtime(EVENTS, () => void load(true), 100);

  async function open(item: NotificationItem) {
    if (item.isRead) return;
    setItems((current) => current.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationAsRead(item.id);
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    } catch {
      void load(true);
    }
  }

  async function readAll() {
    setItems((current) => current.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsAsRead();
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    } catch {
      void load(true);
    }
  }

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="page-enter">
      <div className="flex items-start justify-between gap-3">
        <PageTitle eyebrow="Pemberitahuan" title="Notifikasi" subtitle="Update order dan pembayaran Anda muncul di sini secara real-time." />
        {unread > 0 && (
          <button
            type="button"
            onClick={() => void readAll()}
            className="mt-6 inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-sky-700"
          >
            <CheckCheck size={13} /> Tandai dibaca
          </button>
        )}
      </div>

      {loading ? (
        <Spinner label="Memuat notifikasi..." />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="Belum ada notifikasi" text="Kami akan mengabari Anda saat status order berubah." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const meta = ICON[item.type] ?? ICON.INFO;
            const Icon = meta.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void open(item)}
                  className={`laundry-card flex w-full items-start gap-3 p-3.5 text-left transition ${item.isRead ? "opacity-70" : "!border-sky-200"}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${meta.className}`}>
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900">{item.title}</span>
                      {!item.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.message}</span>
                    <span className="mt-1 block text-[10px] font-semibold text-slate-400">{dateTime(item.createdAt)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
