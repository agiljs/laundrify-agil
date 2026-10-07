import { useCallback, useEffect, useState, type ReactNode } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Bell, ClipboardList, Home, Plus, UserRound, Wifi, WifiOff } from "lucide-react";
import logo from "../assets/logo.jpg";
import { getNotifications } from "../services/customer.service";
import { getSocket } from "../services/socket";
import { useRealtime } from "../hooks/useRealtime";

export const NOTIFICATIONS_CHANGED = "laundrify:notifications-changed";

const NOTIFICATION_EVENTS = ["notification:new"] as const;

const NAV = [
  { to: "/", label: "Beranda", icon: Home, end: true },
  { to: "/orders/new", label: "Order", icon: Plus, end: true },
  { to: "/notifications", label: "Notifikasi", icon: Bell, end: true },
  { to: "/profile", label: "Profil", icon: UserRound, end: true },
] as const;

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [online, setOnline] = useState(false);

  // Halaman "Order Baru" punya bar aksi sendiri di bawah, jadi navigasi bawah disembunyikan.
  const hideNav = location.pathname.startsWith("/orders/new");

  const loadUnread = useCallback(async () => {
    try {
      const items = await getNotifications();
      setUnread(items.filter((item) => !item.isRead).length);
    } catch {
      /* diabaikan: badge hanya pelengkap */
    }
  }, []);

  useEffect(() => {
    void loadUnread();
  }, [loadUnread, location.pathname]);

  useEffect(() => {
    const onChanged = () => void loadUnread();
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged);
  }, [loadUnread]);

  useRealtime(NOTIFICATION_EVENTS, () => void loadUnread(), 100);

  // indikator koneksi real-time
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    setOnline(socket.connected);
    socket.on("connect", up);
    socket.on("disconnect", down);
    socket.on("connect_error", down);
    return () => {
      socket.off("connect", up);
      socket.off("disconnect", down);
      socket.off("connect_error", down);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      <header
        className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Laundrify" className="h-9 w-9 rounded-xl object-cover" />
            <div className="leading-tight">
              <p className="text-sm font-black tracking-tight text-slate-900">Laundrify</p>
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Customer</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span
              title={online ? "Terhubung real-time" : "Menyambungkan..."}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {online ? <Wifi size={11} /> : <WifiOff size={11} />}
              {online ? "Live" : "Offline"}
            </span>
            <Link
              to="/notifications"
              aria-label="Notifikasi"
              className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600"
            >
              <Bell size={16} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className={`mx-auto w-full max-w-xl px-4 pt-4 ${hideNav ? "pb-36" : "pb-28"}`}>{children}</main>

      {!hideNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto grid max-w-xl grid-cols-4 px-2">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-extrabold transition ${
                    isActive ? "text-sky-700" : "text-slate-400"
                  }`
                }
              >
                {to === "/orders/new" ? (
                  <span className="-mt-5 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#0369a1] to-[#0284c7] text-white shadow-lg shadow-sky-500/30">
                    <Icon size={20} />
                  </span>
                ) : (
                  <span className="relative">
                    <Icon size={20} />
                    {to === "/notifications" && unread > 0 && (
                      <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </span>
                )}
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export function PageTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      {eyebrow && <p className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600">{eyebrow}</p>}
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon = ClipboardList, title, text }: { icon?: typeof ClipboardList; title: string; text?: string }) {
  return (
    <div className="laundry-card flex flex-col items-center px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-600">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-sm font-extrabold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{text}</p>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-xs text-slate-500">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
      {label}
    </div>
  );
}
