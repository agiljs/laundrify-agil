import { useEffect, useMemo, useState } from "react";
import { useRealtime } from "../../hooks/useRealtime";
import { AlertCircle, ChevronLeft, ChevronRight, Eye, Loader2, Pencil, Plus, Receipt, RefreshCw, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getExpenses } from "../../services/expense.service";
import type { Expense, ExpenseCategory } from "../../types/expense";
import ExpenseFormModal from "../../components/expenses/ExpenseFormModal";
import ExpenseDetailModal from "../../components/expenses/ExpenseDetailModal";
import { formatCurrency, formatDate } from "../../utils/format";

const PAGE_SIZE = 10;
const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "ELECTRICITY", label: "Listrik" }, { value: "WATER", label: "Air" }, { value: "DETERGENT", label: "Deterjen" },
  { value: "SUPPLIES", label: "Perlengkapan" }, { value: "MACHINE_MAINTENANCE", label: "Maintenance Mesin" }, { value: "DELIVERY", label: "Delivery" },
  { value: "RENT", label: "Sewa" }, { value: "SALARY", label: "Gaji" }, { value: "OTHER", label: "Lainnya" },
];
const labels = Object.fromEntries(CATEGORIES.map((item) => [item.value, item.label])) as Record<ExpenseCategory, string>;
function getErrorMessage(error: unknown) { return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Data expense tidak dapat dimuat."; }

const EXPENSE_EVENTS = ["data:changed:expenses"] as const;

export default function ExpensesPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN";
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"ALL" | ExpenseCategory>("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  async function load(silent = false) {
    try { if(!silent)setLoading(true); setError(""); setExpenses(await getExpenses()); }
    catch (err) { console.error(err); setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useRealtime(EXPENSE_EVENTS, () => void load(true));
  useEffect(() => { setPage(1); }, [search, category]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((item) => {
      const matchesSearch = !q || item.description.toLowerCase().includes(q) || labels[item.category].toLowerCase().includes(q) || item.createdBy?.name?.toLowerCase().includes(q);
      return matchesSearch && (category === "ALL" || item.category === category);
    });
  }, [expenses, search, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const thisMonth = expenses.filter((item) => { const d = new Date(item.expenseDate); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((sum, item) => sum + Number(item.amount), 0);

  function handleSaved(expense: Expense, mode: "create" | "update") {
    setExpenses((current) => mode === "update" ? current.map((item) => item.id === expense.id ? expense : item) : [expense, ...current]);
  }

  return <div className="page-enter space-y-6">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <div><p className="text-sm font-medium text-blue-600">Financial Management</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Expenses</h1><p className="mt-1 text-sm text-slate-500">Kelola dan pantau seluruh pengeluaran operasional laundry.</p></div>
      {canEdit && <button type="button" title="Tambah Expense" onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center justify-center rounded-xl bg-blue-600 p-3 text-white hover:bg-blue-700"><Plus size={18}/></button>}
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Transaksi</p><p className="mt-2 text-2xl font-bold text-slate-900">{expenses.length}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Pengeluaran</p><p className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(totalAmount)}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pengeluaran Bulan Ini</p><p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(thisMonth)}</p></div>
    </div>

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row">
        <div className="relative flex-1"><Search size={18} className="absolute left-3 top-3.5 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari deskripsi, kategori, pembuat..." className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"/></div>
        <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm"><option value="ALL">Semua Kategori</option>{CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <button type="button" title="Refresh" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center rounded-xl border border-slate-300 p-3 text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/></button>
      </div>

      {loading ? <div className="flex min-h-80 items-center justify-center gap-3 text-sm text-slate-500"><Loader2 size={24} className="animate-spin text-blue-600"/>Memuat expense...</div> : error ? <div className="flex min-h-80 flex-col items-center justify-center text-center"><AlertCircle size={28} className="text-red-500"/><p className="mt-3 font-bold">Gagal memuat expense</p><p className="mt-1 text-sm text-slate-500">{error}</p><button type="button" onClick={() => void load()} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Coba Lagi</button></div> : rows.length === 0 ? <div className="flex min-h-80 flex-col items-center justify-center text-center"><Receipt size={32} className="text-slate-400"/><p className="mt-3 font-bold">Belum ada expense</p><p className="mt-1 text-sm text-slate-500">Tidak ada data yang sesuai dengan filter.</p></div> : <>
        <div className="rtable-wrap overflow-x-auto p-3 sm:p-0"><table className="rtable w-full"><thead className="border-b border-slate-200 bg-slate-50"><tr>{["Tanggal","Kategori","Deskripsi","Nominal","Dibuat Oleh","Aksi"].map((title) => <th key={title} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((item) => <tr key={item.id} className="hover:bg-slate-50"><td data-label="Tanggal" className="px-5 py-4 text-sm text-slate-600">{formatDate(item.expenseDate)}</td><td data-label="Kategori" className="px-5 py-4"><span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{labels[item.category]}</span></td><td data-label="Deskripsi" className="max-w-[360px] px-5 py-4"><p className="truncate font-semibold text-slate-900">{item.description}</p></td><td data-label="Nominal" className="px-5 py-4 font-bold text-red-600">{formatCurrency(Number(item.amount))}</td><td data-label="Dibuat Oleh" className="px-5 py-4 text-sm text-slate-600">{item.createdBy?.name ?? "-"}</td><td data-label="Aksi" className="px-5 py-4"><div className="flex gap-2"><button type="button" title="Detail" onClick={() => setSelected(item)} className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"><Eye size={17}/></button>{canEdit && <button type="button" title="Edit" onClick={() => { setEditing(item); setFormOpen(true); }} className="rounded-lg border border-blue-200 p-2 text-blue-600 hover:bg-blue-50"><Pencil size={17}/></button>}</div></td></tr>)}</tbody></table></div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4"><p className="text-sm text-slate-500">Menampilkan {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length}</p><div className="flex items-center gap-2"><button type="button" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft size={18}/></button><span className="min-w-16 text-center text-sm font-semibold">{safePage} / {totalPages}</span><button type="button" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight size={18}/></button></div></div>
      </>}
    </div>

    <ExpenseFormModal open={formOpen} expense={editing} onClose={() => setFormOpen(false)} onSaved={handleSaved}/>
    <ExpenseDetailModal open={selected !== null} expense={selected} onClose={() => setSelected(null)} onEdit={(item) => { setSelected(null); setEditing(item); setFormOpen(true); }}/>
  </div>;
}
