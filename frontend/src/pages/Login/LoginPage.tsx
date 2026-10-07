import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Loader2, ShieldCheck, Sparkles, UserRound, UserRoundCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/logo.jpg";

const customerUrl = (import.meta.env.VITE_CUSTOMER_URL as string | undefined) ?? "http://localhost:5174";
const heroImage = "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=1600&auto=format&fit=crop";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "CUSTOMER">("ADMIN");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!googleClientId || !googleRef.current) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (window.google?.accounts?.id && googleRef.current) {
        window.clearInterval(timer);
        googleRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (!response.credential) return;
            setLoading(true); setError("");
            try {
              const user = await googleLogin(response.credential);
              if (user.role !== role) { logout(); setError(`Akun ini bukan akun ${role === "ADMIN" ? "admin" : "customer"}.`); return; }
              if (user.role === "ADMIN") navigate("/", { replace: true });
              else { logout(); setError(`Akun customer masuk lewat Aplikasi Customer Laundrify: ${customerUrl}`); }
            } catch (err) {
              setError((err as {response?:{data?:{message?:string}}}).response?.data?.message ?? "Login Google gagal.");
            } finally { setLoading(false); }
          },
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(googleRef.current, { type: "standard", theme: "outline", size: "large", text: "signin_with", shape: "rectangular", width: Math.min(window.innerWidth - 56, 430) });
      }
      if (attempts >= 50) window.clearInterval(timer);
    }, 200);
    return () => window.clearInterval(timer);
  }, [googleClientId, googleLogin, logout, navigate, role]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    try {
      const user = await login(email.trim(), password);
      if (remember) localStorage.setItem("laundrify_remember_login", "1");
      if (user.role !== role) { logout(); setError(`Akun ini bukan akun ${role === "ADMIN" ? "admin" : "customer"}.`); return; }
      if (user.role === "ADMIN") navigate("/", { replace: true });
      else { logout(); setError(`Akun customer masuk lewat Aplikasi Customer Laundrify: ${customerUrl}`); }
    } catch (err) {
      setError((err as {response?:{data?:{message?:string}}}).response?.data?.message ?? "Email atau password tidak sesuai.");
    } finally { setLoading(false); }
  }

  return <main className="relative flex min-h-screen items-center justify-center bg-slate-100 p-3 sm:p-6 lg:p-8">
    <div className="relative z-20 flex min-h-[680px] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl lg:flex-row">
      <section className="relative flex min-h-[320px] overflow-hidden p-8 text-white lg:min-h-full lg:w-1/2 lg:p-12" style={{backgroundImage:`linear-gradient(135deg, rgba(12,74,110,.85) 0%, rgba(3,105,161,.75) 100%), url('${heroImage}')`, backgroundSize:"cover", backgroundPosition:"center"}}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,.12),transparent_30%)]"/>
        <div className="relative flex w-full flex-col justify-between">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white/95 shadow-lg"><img src={logo} alt="Laundrify" className="h-8 w-8 rounded-lg object-cover"/></div><div><h1 className="text-base font-extrabold tracking-tight">Laundrify</h1><span className="text-[10px] font-semibold uppercase tracking-wider text-sky-100">Laundry Management System</span></div></div>
          <div className="max-w-xl py-10 lg:py-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] font-bold backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300"/> Sistem laundry terpadu</div>
            <h2 className="text-4xl font-extrabold leading-[1.08] tracking-[-.04em] sm:text-5xl">Kelola laundry lebih <span className="text-sky-200">cepat</span>, rapi, dan terukur.</h2>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/80">Satu workspace untuk memantau order, pelanggan, layanan, pembayaran, inventory, delivery, mesin, dan keuangan.</p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <Feature icon={Sparkles} title="Cepat" text="Operasional terpusat"/>
              <Feature icon={UserRound} title="Customer" text="Data lebih rapi"/>
              <Feature icon={ShieldCheck} title="Aman" text="Akses terproteksi"/>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/15 pt-4 text-[10px] text-white/60"><span>© {new Date().getFullYear()} Laundrify</span><span>Secure workspace</span></div>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center bg-white px-6 py-10 sm:px-12 lg:px-14 xl:px-20">
        <div className="w-full max-w-[430px]">
          <div className="mb-7 lg:hidden"><div className="flex items-center gap-3"><img src={logo} alt="Laundrify" className="h-11 w-11 rounded-xl object-cover"/><div><p className="font-black text-slate-800">Laundrify</p><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Admin Portal</p></div></div></div>
          <div className="mb-6 text-center sm:text-left"><p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Laundrify workspace</p><h2 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">Welcome back!</h2><p className="mt-2 text-xs leading-5 text-slate-500">Masuk untuk mengelola operasional laundry Anda.</p></div>

          <div className="mb-5 rounded-xl bg-slate-100 p-1.5"><div className="grid grid-cols-2 gap-1.5"><button type="button" onClick={()=>{setRole("ADMIN");setError("")}} className={`rounded-xl py-2.5 text-xs font-bold transition-all ${role === "ADMIN" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}><UserRoundCog size={14} className="mr-1.5 inline"/> Admin</button><button type="button" onClick={()=>{setRole("CUSTOMER");setError("")}} className={`rounded-xl py-2.5 text-xs font-bold transition-all ${role === "CUSTOMER" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}><UserRound size={14} className="mr-1.5 inline"/> Customer</button></div></div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Username / Email" value={email} onChange={setEmail} placeholder={role === "ADMIN" ? "admin@laundrify.com" : "customer@email.com"}/>
            <div><div className="mb-1.5 flex items-center justify-between"><label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Kata Sandi</label><button type="button" onClick={()=>setError("Fitur reset password tersedia melalui administrator.")} className="text-xs font-bold text-sky-700 hover:text-sky-800">Lupa Kata Sandi?</button></div><div className="relative"><span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><LockKeyhole size={14}/></span><input required type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-800 outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-sky-500"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600" aria-label="Tampilkan password">{showPassword?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></div>
            <label className="flex cursor-pointer items-center gap-2.5 pt-1"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"/><span className="text-xs font-medium text-slate-600">Ingat saya selama 30 hari</span></label>
            {error&&<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0369a1] to-[#0284c7] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:from-[#075985] hover:to-[#0369a1] disabled:cursor-not-allowed disabled:opacity-60">{loading?<Loader2 size={16} className="animate-spin"/>:<ArrowRight size={15}/>}<span>{loading?"Memverifikasi...":"Masuk ke Akun"}</span></button>
          </form>

          <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"/></div><div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Atau Masuk Dengan</span></div></div>
          <div ref={googleRef} className="flex min-h-[44px] justify-center overflow-hidden rounded-xl">{!googleClientId&&<button type="button" disabled className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-400">Google Login belum dikonfigurasi</button>}</div>
          <p className="mt-5 text-center text-[10px] leading-5 text-slate-400">Customer dapat menggunakan akun ini pada aplikasi mobile React Native Laundrify.</p>
        </div>
      </section>
    </div>
  </main>;
}

function Field({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder:string}) { return <div><label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">{label}</label><input required type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoComplete="username" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-sky-500"/></div>; }
function Feature({icon:Icon,title,text}:{icon:typeof Sparkles;title:string;text:string}) { return <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur"><Icon size={15} className="text-sky-200"/><p className="mt-2 text-[11px] font-bold">{title}</p><p className="mt-1 text-[10px] leading-4 text-white/65">{text}</p></div>; }
