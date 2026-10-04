import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
  Check,
} from "lucide-react";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "../../services/notificationService";

function formatNotificationDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getNotificationStyle(type: NotificationItem["type"]) {
  switch (type) {
    case "SUCCESS":
      return "bg-emerald-100 text-emerald-600";

    case "WARNING":
      return "bg-amber-100 text-amber-600";

    case "ERROR":
      return "bg-red-100 text-red-600";

    default:
      return "bg-sky-100 text-sky-600";
  }
}

export default function Topbar() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const notificationRef = useRef<HTMLDivElement>(null);

  const [profileOpen, setProfileOpen] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [notificationLoading, setNotificationLoading] = useState(false);

  const [query, setQuery] = useState("");

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /*
   * =====================================================
   * MENGAMBIL NOTIFIKASI DARI DATABASE
   * =====================================================
   */
  async function loadNotifications() {
    try {
      setNotificationLoading(true);

      const data = await getNotifications();

      setNotifications(data);
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
    } finally {
      setNotificationLoading(false);
    }
  }

  /*
   * Ambil notification pertama kali
   * ketika Topbar ditampilkan.
   */
  useEffect(() => {
    void loadNotifications();
  }, []);

  /*
   * Cek notification setiap 30 detik.
   *
   * Jadi kalau ada order baru,
   * notification akan muncul tanpa
   * harus refresh halaman.
   */
  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /*
   * =====================================================
   * TUTUP NOTIFICATION KETIKA KLIK DI LUAR
   * =====================================================
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
   * =====================================================
   * TUTUP DENGAN TOMBOL ESC
   * =====================================================
   */
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!user) {
    return null;
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault();

    const value = query.trim();

    if (!value) {
      return;
    }

    navigate(`/orders?search=${encodeURIComponent(value)}`);
  }

  /*
   * =====================================================
   * JUMLAH NOTIFICATION BELUM DIBACA
   * =====================================================
   */
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  /*
   * =====================================================
   * KETIKA USER KLIK NOTIFICATION
   * =====================================================
   */
  async function handleNotificationClick(notification: NotificationItem) {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : item,
          ),
        );
      }
    } catch (error) {
      console.error("Gagal menandai notification:", error);
    }

    /*
     * Setelah notification diklik,
     * popup ditutup.
     */
    setNotificationsOpen(false);

    /*
     * Karena notification kita saat ini
     * berhubungan dengan order,
     * arahkan user ke halaman Orders.
     */
    navigate("/orders");
  }

  /*
   * =====================================================
   * TANDAI SEMUA SUDAH DIBACA
   * =====================================================
   */
  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
    } catch (error) {
      console.error("Gagal menandai semua notification:", error);
    }
  }

  const date = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);

  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-200/80 bg-white px-4 sm:px-6 lg:left-64">
      <div className="flex h-full items-center justify-between gap-3">
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() =>
              window.dispatchEvent(new Event("laundrify:open-sidebar"))
            }
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>

          <form
            onSubmit={submitSearch}
            className="relative hidden w-64 sm:block lg:w-80"
          >
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari order ID, pelanggan..."
              className="w-full rounded-xl border border-slate-200/80 bg-slate-100/80 py-2 pl-9 pr-12 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-500/20"
            />

            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
              Enter
            </span>
          </form>
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* CLOCK */}
          <div className="hidden flex-col border-r border-slate-200 pr-3 text-right lg:flex">
            <span className="font-mono text-xs font-bold text-slate-800">
              {time} WIB
            </span>

            <span className="text-[10px] font-medium text-slate-500">
              {date}
            </span>
          </div>

          {/* ================================================= */}
          {/* NOTIFICATION */}
          {/* ================================================= */}

          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((current) => !current);

                setProfileOpen(false);

                /*
                 * Setiap kali Bell dibuka,
                 * ambil data terbaru dari database.
                 */
                void loadNotifications();
              }}
              className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"
              aria-label="Notifikasi"
            >
              <Bell size={16} />

              {/* BADGE */}
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5 text-[8px] font-black text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* POPUP */}
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-96 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                      Notifikasi
                    </h4>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {unreadCount > 0
                        ? `${unreadCount} belum dibaca`
                        : "Semua sudah dibaca"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* TANDAI SEMUA */}
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void handleMarkAllRead()}
                        title="Tandai semua sudah dibaca"
                        className="rounded-lg p-1.5 text-sky-700 hover:bg-sky-50"
                      >
                        <Check size={14} />
                      </button>
                    )}

                    {/* CLOSE */}
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Tutup notifikasi"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="max-h-[min(420px,calc(100vh-120px))] overflow-y-auto p-2">
                  {notificationLoading ? (
                    <div className="px-4 py-8 text-center text-xs font-semibold text-slate-400">
                      Memuat notifikasi...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                        <Bell size={18} />
                      </div>

                      <p className="mt-3 text-xs font-bold text-slate-700">
                        Belum ada notifikasi
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Aktivitas order dan pembayaran akan muncul di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() =>
                            void handleNotificationClick(notification)
                          }
                          className={`flex w-full gap-3 rounded-xl p-3 text-left transition ${
                            notification.isRead
                              ? "hover:bg-slate-50"
                              : "bg-sky-50/70 hover:bg-sky-50"
                          }`}
                        >
                          {/* ICON */}
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${getNotificationStyle(
                              notification.type,
                            )}`}
                          >
                            {notification.type === "SUCCESS" ? (
                              <Check size={16} />
                            ) : (
                              <Bell size={16} />
                            )}
                          </span>

                          {/* TEXT */}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <b className="text-xs font-extrabold text-slate-800">
                                {notification.title}
                              </b>

                              {!notification.isRead && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                              )}
                            </span>

                            <span className="mt-1 block text-[11px] leading-5 text-slate-500">
                              {notification.message}
                            </span>

                            <span className="mt-1.5 block text-[9px] font-semibold text-slate-400">
                              {formatNotificationDate(notification.createdAt)}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PROFILE */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((current) => !current);

                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900 text-xs font-black text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>

              <div className="hidden text-left md:block">
                <p className="text-xs font-bold leading-tight text-slate-800">
                  {user.name}
                </p>

                <span className="rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                  Admin
                </span>
              </div>

              <ChevronDown
                size={11}
                className="hidden text-slate-400 sm:block"
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-black text-slate-800">
                    {user.name}
                  </p>

                  <p className="mt-1 truncate text-[11px] text-slate-400">
                    {user.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  title="Profil & Settings"
                  className="mt-1 flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-50"
                >
                  <UserRound size={16} />
                </button>

                <button
                  type="button"
                  onClick={logout}
                  title="Keluar"
                  className="mt-1 flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
