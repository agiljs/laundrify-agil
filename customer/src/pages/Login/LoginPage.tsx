import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Loader2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { apiErrorMessage } from "../../services/customer.service";
import logo from "../../assets/logo.jpg";

// Tampilan disamakan dengan halaman login web admin Laundrify (khusus customer: tanpa tab role & tanpa Google).
const heroImage = "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=1600&auto=format&fit=crop";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: sessionLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = (location.state as { from?: string } | null)?.from;

  if (!sessionLoading && user) return <Navigate to={from && from !== "/login" ? from : "/"} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await login(email.trim(), password);
      navigate(from && from !== "/login" ? from : "/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Email atau password tidak sesuai."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-100 p-3 sm:p-6 lg:p-8">
      <div className="relative z-20 flex min-h-[680px] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl lg:flex-row">
        <section
          className="relative hidden overflow-hidden p-8 text-white lg:flex lg:min-h-full lg:w-1/2 lg:p-12"
          style={{ backgroundImage: `linear-gradient(135deg, rgba(12,74,110,.85) 0%, rgba(3,105,161,.75) 100%), url('${heroImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,.12),transparent_30%)]" />
          <div className="relative flex w-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/95 shadow-lg"><img src={logo} alt="Laundrify" className="h-8 w-8 rounded-lg object-cover" /></div>
              <div><h1 className="text-base font-extrabold tracking-tight">Laundrify</h1><span className="text-[10px] font-semibold uppercase tracking-wider text-sky-100">Customer Portal</span></div>
            </div>
            <div className="max-w-xl py-16">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] font-bold backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Pantau cucian real-time</div>
              <h2 className="text-5xl font-extrabold leading-[1.08] tracking-[-.04em]">Laundry <span className="text-sky-200">praktis</span>, tinggal pantau dari HP.</h2>
              <p className="mt-5 max-w-lg text-sm leading-6 text-white/80">Buat order, bayar online, dan lihat progres cucian Anda langsung dari satu tempat.</p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                <Feature icon={Sparkles} title="Cepat" text="Order dalam hitungan detik" />
                <Feature icon={UserRound} title="Real-time" text="Status selalu terbaru" />
                <Feature icon={ShieldCheck} title="Aman" text="Pembayaran via Midtrans" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/15 pt-4 text-[10px] text-white/60"><span>© {new Date().getFullYear()} Laundrify</span><span>Secure workspace</span></div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center bg-white px-6 py-10 sm:px-12 lg:px-14 xl:px-20">
          <div className="w-full max-w-[430px]">
            <div className="mb-7 lg:hidden">
              <div className="flex items-center gap-3"><img src={logo} alt="Laundrify" className="h-11 w-11 rounded-xl object-cover" /><div><p className="font-black text-slate-800">Laundrify</p><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Customer Portal</p></div></div>
            </div>
            <div className="mb-6 text-center sm:text-left">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Laundrify customer</p>
              <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">Welcome back!</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">Masuk untuk membuat order dan memantau cucian Anda.</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Username / Email</label>
                <input required type="text" inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" autoComplete="username" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Kata Sandi</label>
                  <button type="button" onClick={() => setError("Fitur reset password tersedia melalui administrator.")} className="text-xs font-bold text-sky-700 hover:text-sky-800">Lupa Kata Sandi?</button>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><LockKeyhole size={14} /></span>
                  <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-800 outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-sky-500" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600" aria-label="Tampilkan password">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
              </div>
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0369a1] to-[#0284c7] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:from-[#075985] hover:to-[#0369a1] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={15} />}
                <span>{loading ? "Memverifikasi..." : "Masuk ke Akun"}</span>
              </button>
            </form>
            <p className="mt-6 text-center text-xs text-slate-500">
              Belum punya akun? <Link to="/register" className="font-extrabold text-sky-700 hover:text-sky-800">Daftar sekarang</Link>
            </p>
            <p className="mt-2 text-center text-[10px] leading-5 text-slate-400">Pelanggan lama tanpa akun? Daftar dengan nomor HP yang tercatat di kasir, lalu masukkan Kode Customer Anda.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof Sparkles; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur">
      <Icon size={15} className="text-sky-200" />
      <p className="mt-2 text-[11px] font-bold">{title}</p>
      <p className="mt-1 text-[10px] leading-4 text-white/65">{text}</p>
    </div>
  );
}
