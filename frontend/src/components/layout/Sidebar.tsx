import { useEffect, useState } from "react";
import {
  CircleDollarSign,
  Cog,
  LogOut,
  BarChart3,
  Menu,
  Package,
  Settings2,
  ShoppingBag,
  SlidersHorizontal,
  Tags,
  Truck,
  Users,
  WashingMachine,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/logo.jpg";

const navItems = [
  { label: "Dashboard", path: "/", icon: BarChart3, end: true },
  { label: "Orders", path: "/orders", icon: ShoppingBag },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Operations", path: "/operations", icon: Cog },
  { label: "Finance", path: "/finance", icon: CircleDollarSign },
  { label: "Settings", path: "/settings", icon: SlidersHorizontal },
] as const;

const subItems: Record<
  string,
  { label: string; path: string; icon: typeof Tags }[]
> = {
  Operations: [
    { label: "Services", path: "/operations/services", icon: Tags },
    { label: "Inventory", path: "/operations/inventory", icon: Package },
    { label: "Deliveries", path: "/operations/deliveries", icon: Truck },
    { label: "Machines", path: "/operations/machines", icon: WashingMachine },
  ],
  Finance: [
    { label: "Expenses", path: "/finance/expenses", icon: CircleDollarSign },
  ],
  Settings: [{ label: "Users", path: "/settings/users", icon: Settings2 }],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener("laundrify:open-sidebar", open);
    return () => window.removeEventListener("laundrify:open-sidebar", open);
  }, []);

  if (!user) return null;

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* MOBILE TRIGGER */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3 z-[70] grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white shadow-lg lg:hidden"
        aria-label="Buka menu"
      >
        <Menu size={18} />
      </button>

      {/* ================================================= */}
      {/* DESKTOP ICON RAIL */}
      {/* ================================================= */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col border-r border-slate-800 bg-slate-900 text-slate-300 shadow-2xl lg:flex">
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-slate-800/80">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-600">
            <img
              src={logo}
              alt="Laundrify"
              className="h-8 w-8 rounded-lg object-cover"
            />
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const children = subItems[item.label];
            return (
              <div
                key={item.path}
                className="relative"
                onMouseEnter={() => setHovered(item.label)}
                onMouseLeave={() =>
                  setHovered((current) =>
                    current === item.label ? null : current,
                  )
                }
              >
                <NavLink
                  to={item.path}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `flex h-12 w-full items-center justify-center rounded-xl transition-all ${isActive ? "bg-[#0284c7] text-white shadow-md shadow-cyan-700/30" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"}`
                  }
                >
                  <Icon size={19} />
                </NavLink>

                {/* HOVER TOOLTIP / FLYOUT */}
                {hovered === item.label && (
                  <div className="absolute left-full top-0 z-50 ml-2 min-w-[172px] rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl">
                    <p className="truncate px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white">
                      {item.label}
                    </p>
                    {children && (
                      <div className="mt-0.5 space-y-0.5 border-t border-slate-800 pt-1.5">
                        {children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              onClick={closeMobile}
                              className={({ isActive }) =>
                                `flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold ${isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/70 hover:text-white"}`
                              }
                            >
                              <ChildIcon size={13} />
                              {child.label}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-800/80 p-2.5">
          <button
            type="button"
            onClick={logout}
            title="Keluar"
            className="flex h-12 w-full items-center justify-center rounded-xl text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* ================================================= */}
      {/* MOBILE DRAWER */}
      {/* ================================================= */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={closeMobile}
            aria-label="Tutup sidebar"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-900 shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-600">
                  <img
                    src={logo}
                    alt="Laundrify"
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-extrabold tracking-tight text-white">
                    Laundrify
                  </h1>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                    Admin Portal
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeMobile}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
                aria-label="Tutup menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const children = subItems[item.label];
                return (
                  <div key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => {
                        if (children)
                          setOpenSub((current) =>
                            current === item.label ? null : item.label,
                          );
                        closeMobile();
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition-all ${isActive ? "bg-[#0284c7] font-bold text-white shadow-md shadow-cyan-700/30" : "font-semibold text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"}`
                      }
                    >
                      <Icon size={16} className="w-5 shrink-0 text-center" />
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                    </NavLink>
                    {children && openSub === item.label && (
                      <div className="ml-8 mt-1 space-y-1 border-l border-slate-700 pl-2">
                        {children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              onClick={closeMobile}
                              className={({ isActive }) =>
                                `flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold ${isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/70 hover:text-white"}`
                              }
                            >
                              <ChildIcon size={13} />
                              {child.label}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="shrink-0 border-t border-slate-800/80 p-3">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut size={15} /> Keluar
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
