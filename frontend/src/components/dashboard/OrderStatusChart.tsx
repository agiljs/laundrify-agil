import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type OrderStatusChartProps = { completed: number; pending: number; cancelled: number };

export default function OrderStatusChart({ completed, pending, cancelled }: OrderStatusChartProps) {
  const data = [
    { name: "Completed", value: completed, color: "#16a34a" },
    { name: "Pending", value: pending, color: "#f59e0b" },
    { name: "Cancelled", value: cancelled, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  return <div className="min-w-0">
    <div className="h-[250px] min-w-0 sm:h-[280px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={66} outerRadius={94} paddingAngle={3}>{data.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
    <div className="grid grid-cols-3 gap-2">{data.map((item) => <div key={item.name} className="rounded-2xl bg-slate-50 p-3 text-center"><p className="text-lg font-black text-slate-900">{item.value}</p><p className="text-[10px] font-bold text-slate-500">{item.name}</p></div>)}</div>
  </div>;
}
