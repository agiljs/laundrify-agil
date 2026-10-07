import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, History, Loader2, LockKeyhole } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { apiErrorCode, apiErrorMessage } from "../../services/customer.service";
import logo from "../../assets/logo.jpg";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-sky-500";
const labelClass = "mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-600";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user, loading: sessionLoading, register } = useAuth();

  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", confirm: "", address: "", customerCode: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!sessionLoading && user) return <Navigate to="/" replace />;

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (form.password.length < 8) return setError("Kata sandi minimal 8 karakter.");
    if (form.password !== form.confirm) return setError("Konfirmasi kata sandi tidak sama.");

    setLoading(true);
    try {
      await register({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        address: form.address,
        customerCode: existingCustomer ? form.customerCode : undefined,
      });
      navigate("/", { replace: true });
    } catch (err) {
      const code = apiErrorCode(err);
      // Nomor HP sudah tercatat sebagai pelanggan lama -> tampilkan kolom Kode Customer.
      if (code === "CLAIM_CODE_REQUIRED" || code === "CLAIM_CODE_INVALID") setExistingCustomer(true);
      setError(apiErrorMessage(err, "Pendaftaran gagal. Silakan coba lagi."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-3 sm:p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <img src={logo} alt="Laundrify" className="h-11 w-11 rounded-xl object-cover" />
          <div>
            <p className="font-black text-slate-800">Laundrify</p>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Customer Portal</p>
          </div>
        </div>

        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Akun baru</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Daftar Customer</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">Buat akun untuk memesan laundry dan memantau cucian Anda.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className={labelClass}>Nama Lengkap</label>
            <input required minLength={2} value={form.name} onChange={set("name")} placeholder="Nama Anda" autoComplete="name" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>No. HP / WhatsApp</label>
            <input required type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="081234567890" autoComplete="tel" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input required type="email" inputMode="email" autoCapitalize="none" value={form.email} onChange={set("email")} placeholder="nama@email.com" autoComplete="email" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Kata Sandi</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><LockKeyhole size={14} /></span>
              <input required type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Minimal 8 karakter" autoComplete="new-password" className={`${inputClass} pl-10 pr-11`} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600" aria-label="Tampilkan password">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Ulangi Kata Sandi</label>
            <input required type={showPassword ? "text" : "password"} value={form.confirm} onChange={set("confirm")} placeholder="Ketik ulang kata sandi" autoComplete="new-password" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Alamat <span className="font-semibold normal-case tracking-normal text-slate-400">(opsional)</span></label>
            <textarea value={form.address} onChange={set("address")} rows={2} placeholder="Alamat penjemputan/pengantaran" className={`${inputClass} resize-none`} />
          </div>

          {/* Pelanggan lama: data mereka sudah ada di kasir tanpa akun login */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3.5">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={existingCustomer} onChange={(e) => setExistingCustomer(e.target.checked)} className="mt-0.5 h-4 w-4 accent-sky-700" />
              <span>
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-sky-900"><History size={13} /> Saya pernah laundry di sini sebelumnya</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-sky-800/70">Hubungkan riwayat order lama ke akun ini dengan Kode Customer.</span>
              </span>
            </label>
            {existingCustomer && (
              <div className="mt-3">
                <label className={labelClass}>Kode Customer</label>
                <input value={form.customerCode} onChange={set("customerCode")} placeholder="CUS-XXXXXXXXXXXX" autoCapitalize="characters" className={`${inputClass} bg-white uppercase`} />
                <p className="mt-1.5 text-[11px] leading-4 text-slate-500">Tanyakan Kode Customer Anda ke kasir/admin. Gunakan nomor HP yang sama dengan yang tercatat di kasir.</p>
              </div>
            )}
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0369a1] to-[#0284c7] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:from-[#075985] hover:to-[#0369a1] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={15} />}
            <span>{loading ? "Mendaftarkan..." : "Daftar & Masuk"}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Sudah punya akun? <Link to="/login" className="font-extrabold text-sky-700 hover:text-sky-800">Masuk</Link>
        </p>
      </div>
    </main>
  );
}
