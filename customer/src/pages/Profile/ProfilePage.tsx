import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Phone, QrCode } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { PageTitle } from "../../components/CustomerLayout";

export default function CustomerProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.name ?? "C")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const rows = [
    { icon: Mail, label: "Email", value: user?.email },
    { icon: Phone, label: "Telepon", value: user?.phone && !user.phone.startsWith("GOOGLE-") ? user.phone : null },
    { icon: QrCode, label: "Kode customer", value: user?.customerCode },
  ];

  return (
    <div className="page-enter">
      <PageTitle eyebrow="Akun" title="Profil" />

      <section className="laundry-card flex items-center gap-4 p-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#0369a1] to-[#0284c7] text-lg font-extrabold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold text-slate-900">{user?.name}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600">Customer</p>
        </div>
      </section>

      <section className="laundry-card mt-4 divide-y divide-slate-100">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500">
              <Icon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="truncate text-sm font-semibold text-slate-800">{value || "-"}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="mt-3 px-1 text-[11px] leading-5 text-slate-400">Untuk mengubah data akun, silakan hubungi admin Laundrify.</p>

      <button
        type="button"
        onClick={() => {
          logout();
          navigate("/login", { replace: true });
        }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-bold text-red-600"
      >
        <LogOut size={16} /> Keluar
      </button>
    </div>
  );
}
