import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { createExpense, updateExpense } from "../../services/expense.service";
import type { Expense, ExpenseCategory, ExpensePayload } from "../../types/expense";
import { formatCurrency } from "../../utils/format";

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "ELECTRICITY", label: "Listrik" },
  { value: "WATER", label: "Air" },
  { value: "DETERGENT", label: "Deterjen" },
  { value: "SUPPLIES", label: "Perlengkapan" },
  { value: "MACHINE_MAINTENANCE", label: "Maintenance Mesin" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "RENT", label: "Sewa" },
  { value: "SALARY", label: "Gaji" },
  { value: "OTHER", label: "Lainnya" },
];

type Props = {
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSaved: (expense: Expense, mode: "create" | "update") => void;
};

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function getErrorMessage(error: unknown) {
  const value = error as { response?: { data?: { message?: string } } };
  return value.response?.data?.message ?? "Expense gagal disimpan.";
}

export default function ExpenseFormModal({ open, expense, onClose, onSaved }: Props) {
  const editing = expense !== null;
  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategory(expense?.category ?? "OTHER");
    setDescription(expense?.description ?? "");
    setAmount(expense ? String(Number(expense.amount)) : "");
    setExpenseDate(toDateTimeLocal(expense?.expenseDate));
    setError("");
  }, [open, expense]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (description.trim().length < 2) {
      setError("Deskripsi minimal 2 karakter.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Nominal harus lebih besar dari 0.");
      return;
    }
    if (!expenseDate) {
      setError("Tanggal expense wajib diisi.");
      return;
    }

    const payload: ExpensePayload = {
      category,
      description: description.trim(),
      amount: numericAmount,
      expenseDate: new Date(expenseDate).toISOString(),
    };

    if (!window.confirm(`Simpan pengeluaran sebesar ${formatCurrency(Number(amount) || 0)}?`)) return;

    try {
      setSaving(true);
      setError("");
      const saved = editing
        ? await updateExpense(expense.id, payload)
        : await createExpense(payload);
      onSaved(saved, editing ? "update" : "create");
      onClose();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Expense Management</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {editing ? "Edit Expense" : "Tambah Expense"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Kategori *</span>
              <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={inputClass}>
                {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Nominal *</span>
              <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} placeholder="Contoh: 150000" />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Deskripsi *</span>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Contoh: Pembelian deterjen bulan September" />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Tanggal Expense *</span>
            <input type="datetime-local" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className={inputClass} />
          </label>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
            <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {saving && <Loader2 size={17} className="animate-spin" />}
              {editing ? "Simpan Perubahan" : "Tambah Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
