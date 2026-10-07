import { ArrowRight, CalendarDays, CheckCircle2, CircleDollarSign, PackageCheck, ShoppingBag, Users, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { useRealtime } from "../../hooks/useRealtime";
import { Link } from "react-router-dom";
import RevenueChart from "../../components/dashboard/RevenueChart";
import OrderStatusChart from "../../components/dashboard/OrderStatusChart";
import RecentCustomers from "../../components/dashboard/RecentCustomers";
import RecentOrders from "../../components/dashboard/RecentOrders";
import { formatCurrency } from "../../utils/format";
import { getDashboardSummary, getDailyReport, getRecentCustomers, getRecentOrders } from "../../services/dashboard.service";
import type { DashboardSummary, DailyReportItem, RecentCustomer, RecentOrder } from "../../types/dashboard";

const DASHBOARD_EVENTS = ["order:created","order:updated","order:status-updated","order:deleted","payment:updated","data:changed:customers","data:changed:expenses"] as const;

export default function DashboardPage() {
  const [summary,setSummary]=useState<DashboardSummary|null>(null); const [daily,setDaily]=useState<DailyReportItem[]>([]); const [customers,setCustomers]=useState<RecentCustomer[]>([]); const [orders,setOrders]=useState<RecentOrder[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [period,setPeriod]=useState("today");
  async function load(silent=false){try{if(!silent)setLoading(true);setError("");const now=new Date();let start=new Date(now),end=new Date(now);if(period==="week"){const day=now.getDay()||7;start.setDate(now.getDate()-day+1);}else if(period==="month"){start=new Date(now.getFullYear(),now.getMonth(),1);}start.setHours(0,0,0,0);end.setHours(23,59,59,999);const [s,d,c,o]=await Promise.all([getDashboardSummary(),getDailyReport(start.toISOString(),end.toISOString()),getRecentCustomers(6),getRecentOrders(6)]);setSummary(s);setDaily(d);setCustomers(c);setOrders(o);}catch(e){console.error(e);setError("Dashboard belum dapat dimuat. Pastikan server aktif.");}finally{setLoading(false);}}
  useEffect(()=>{void load();},[period]); useRealtime(DASHBOARD_EVENTS,()=>void load(true));
  if(loading)return <div className="grid min-h-[70vh] place-items-center"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0284c7]"/><p className="mt-4 text-sm font-bold text-slate-500">Menyiapkan dashboard...</p></div></div>;
  if(error||!summary)return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error||"Data tidak tersedia"}</div>;
  const today=new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short"}).format(new Date());
  return <div className="page-enter space-y-6">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold text-sky-700">Admin Dashboard</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">Selamat Datang, Admin! 👋</h2><p className="mt-1 text-xs text-slate-500 sm:text-sm">Berikut adalah ringkasan operasional & performa bisnis laundry Anda hari ini.</p></div><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm"><CalendarDays size={13} className="text-slate-400"/><select value={period} onChange={e=>setPeriod(e.target.value)} className="cursor-pointer bg-transparent text-xs font-bold text-slate-700 outline-none"><option value="today">Hari Ini ({today})</option><option value="week">Minggu Ini</option><option value="month">Bulan Ini</option></select></div></section>

    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat title="Pendapatan Hari Ini" value={formatCurrency(summary.today.revenue)} detail="Pembayaran berhasil hari ini" icon={CircleDollarSign} tone="green"/>
      <Stat title="Order Hari Ini" value={`${summary.today.orders} Pesanan`} detail="Order baru masuk" icon={ShoppingBag} tone="blue"/>
      <Stat title="Profit Bersih" value={formatCurrency(summary.today.profit)} detail="Revenue dikurangi expense" icon={WalletCards} tone="indigo"/>
      <Stat title="Customer Aktif" value={String(summary.customers.total)} detail={`${summary.customers.members} member terdaftar`} icon={Users} tone="amber"/>
    </section>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
      <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between"><div><h3 className="text-base font-extrabold text-slate-800">Pendapatan & Profit</h3><p className="mt-0.5 text-xs text-slate-500">Tren performa keuangan periode berjalan.</p></div><div className="flex gap-1 rounded-lg bg-slate-100 p-1"><button type="button" onClick={()=>setPeriod("month")} className={`rounded-lg px-3 py-1 text-[10px] font-bold ${period === "month" ? "bg-sky-50 text-sky-700" : "text-slate-500"}`}>Bulanan</button><button type="button" onClick={()=>setPeriod("week")} className={`rounded-lg px-3 py-1 text-[10px] font-bold ${period === "week" ? "bg-sky-50 text-sky-700" : "text-slate-500"}`}>Mingguan</button></div></div>
        <RevenueChart data={daily}/>
      </div>
      <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="mb-4"><h3 className="text-base font-extrabold text-slate-800">Status Order</h3><p className="mt-0.5 text-xs text-slate-500">Distribusi order saat ini.</p></div><OrderStatusChart completed={summary.orderStatus.completed} pending={summary.orderStatus.pending} cancelled={summary.orderStatus.cancelled}/></div>
    </section>

    <section className="overflow-hidden rounded-2xl bg-[#0369a1] p-6 text-white shadow-xl shadow-sky-900/15 sm:p-7"><div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)] lg:items-center"><div><div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-100"><CircleDollarSign size={13}/> Business Lifetime</div><p className="text-[10px] font-bold uppercase tracking-wider text-sky-100">Total Pendapatan Sejak Laundry Dibuka</p><p className="mt-2 break-words text-3xl font-extrabold tracking-tight sm:text-4xl">{formatCurrency(summary.lifetime.revenue)}</p><p className="mt-2 max-w-xl text-xs leading-5 text-sky-100/80">Akumulasi seluruh pembayaran berhasil yang tercatat di sistem.</p></div><div className="grid w-full grid-cols-2 gap-4 border-t border-white/20 pt-4 md:w-auto md:grid-cols-3 md:border-l md:border-t-0 md:pl-8 md:pt-0"><Lifetime label="Order Sudah Paid" value={String(summary.lifetime.paidOrders)} icon={CheckCircle2}/><Lifetime label="Customer Aktif" value={String(summary.customers.total)} icon={Users}/><Lifetime label="Order Hari Ini" value={String(summary.today.orders)} icon={PackageCheck}/></div></div></section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.65fr)]">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="text-base font-extrabold text-slate-800">Pesanan Terbaru</h3><p className="mt-0.5 text-xs text-slate-500">Transaksi terakhir yang masuk ke sistem.</p></div><Link to="/orders" className="flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline">Lihat Semua <ArrowRight size={12}/></Link></div><div className="min-w-0 p-3 sm:p-5"><RecentOrders data={orders}/></div></div>
      <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-base font-extrabold text-slate-800">Pelanggan Terbaru</h3><p className="mt-0.5 text-xs text-slate-500">Member yang baru terdaftar.</p></div><span className="rounded-lg bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700">Aktif</span></div><RecentCustomers data={customers}/></div>
    </section>

  </div>;
}

function Stat({title,value,detail,icon:Icon,tone}:{title:string;value:string;detail:string;icon:typeof CircleDollarSign;tone:"green"|"blue"|"indigo"|"amber"}){const tones={green:"bg-emerald-50 text-emerald-600",blue:"bg-sky-50 text-sky-600",indigo:"bg-indigo-50 text-indigo-600",amber:"bg-amber-50 text-amber-600"};return <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between"><span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{title}</span><div className={`grid h-10 w-10 place-items-center rounded-xl text-lg transition group-hover:scale-105 ${tones[tone]}`}><Icon size={18}/></div></div><h3 className="mt-3 break-words text-2xl font-extrabold tracking-tight text-slate-800">{value}</h3><p className="mt-2 text-[11px] font-medium text-slate-400">{detail}</p></div>}
function Lifetime({label,value,icon:Icon}:{label:string;value:string;icon:typeof CheckCircle2}){return <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm"><div className="flex items-center justify-between gap-2"><span className="text-[9px] font-bold uppercase tracking-wider text-sky-100">{label}</span><Icon size={14}/></div><p className="mt-2 break-words text-lg font-extrabold sm:text-xl">{value}</p></div>}
