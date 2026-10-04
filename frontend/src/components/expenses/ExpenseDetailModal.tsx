import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getExpenseById } from "../../services/expense.service";
import type { Expense } from "../../types/expense";
import { formatCurrency, formatDate } from "../../utils/format";

type Props = {
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
};

const categoryLabel: Record<Expense["category"], string> = {
  ELECTRICITY: "Listrik",
  WATER: "Air",
  DETERGENT: "Deterjen",
  SUPPLIES: "Perlengkapan",
  MACHINE_MAINTENANCE: "Maintenance Mesin",
  DELIVERY: "Delivery",
  RENT: "Sewa",
  SALARY: "Gaji",
  OTHER: "Lainnya",
};

export default function ExpenseDetailModal({ open, expense, onClose, onEdit }: Props) {
  const [detail, setDetail] = useState<Expense | null>(expense);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !expense) return;
    setDetail(expense);
    setLoading(true);
    getExpenseById(expense.id).then(setDetail).catch(console.error).finally(() => setLoading(false));
  }, [open, expense]);

  if (!open || !expense) return null;

  const current = detail ?? expense;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Expense Detail</p><h2 className="mt-1 text-xl font-bold text-slate-900">Detail Pengeluaran</h2></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </div>

        <div className="space-y-5 p-6">
          {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Memuat detail...</div>}
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">Nominal</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{formatCurrency(Number(current.amount))}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase text-slate-400">Kategori</p><p className="mt-1 font-semibold text-slate-800">{categoryLabel[current.category]}</p></div>
            <div><p className="text-xs font-semibold uppercase text-slate-400">Tanggal</p><p className="mt-1 font-semibold text-slate-800">{formatDate(current.expenseDate)}</p></div>
            <div className="sm:col-span-2"><p className="text-xs font-semibold uppercase text-slate-400">Deskripsi</p><p className="mt-1 text-slate-800">{current.description}</p></div>
            <div><p className="text-xs font-semibold uppercase text-slate-400">Dibuat Oleh</p><p className="mt-1 font-semibold text-slate-800">{current.createdBy?.name ?? "-"}</p></div>
            <div><p className="text-xs font-semibold uppercase text-slate-400">Dibuat</p><p className="mt-1 font-semibold text-slate-800">{formatDate(current.createdAt)}</p></div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Tutup</button>
            <button type="button" onClick={() => onEdit(current)} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Edit Expense</button>
          </div>
        </div>
      </div>
    </div>
  );
}
