import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { DailyReportItem } from "../../types/dashboard";
import { formatCurrency } from "../../utils/format";

type RevenueChartProps = { data: DailyReportItem[] };

export default function RevenueChart({ data }: RevenueChartProps) {
  return <div className="min-w-0"><div className="h-[280px] min-w-0 sm:h-[320px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="revenueGradientBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#185df9" stopOpacity={0.18} /><stop offset="95%" stopColor="#185df9" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#E2E8F0" vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={44} /><Tooltip formatter={(value) => formatCurrency(Number(value))} /><Area type="monotone" dataKey="revenue" stroke="#185df9" fill="url(#revenueGradientBlue)" strokeWidth={2.5} /><Area type="monotone" dataKey="profit" stroke="#06b6d4" fill="transparent" strokeWidth={2} /></AreaChart></ResponsiveContainer></div><div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#185df9]" /> Revenue</span><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-500" /> Profit</span></div></div>;
}
