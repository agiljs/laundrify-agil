import { useMemo, useState, type FormEvent } from "react";
import { Banknote, CheckCircle2, CreditCard, ReceiptText, X } from "lucide-react";
import type { Order } from "../../types/order";
import type { PaymentMethod } from "../../types/payment";
import { createPayment } from "../../services/payment.service";
import { getOrderById } from "../../services/order.service";

type Props = { open: boolean; order: Order | null; onClose: () => void; onUpdated: (order: Order) => void; onToast: (message: string, type?: "success" | "error" | "info") => void };
type ApiError = { response?: { data?: { message?: string } } };
const METHOD_LABEL: Record<PaymentMethod, string> = { CASH: "Cash", BANK_TRANSFER: "Bank Transfer", QRIS: "QRIS", OTHER: "Lainnya" };
function money(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
function errorMessage(error: unknown) { if (typeof error === "object" && error !== null && "response" in error) return (error as ApiError).response?.data?.message ?? "Gagal menyimpan pembayaran."; return "Gagal menyimpan pembayaran."; }

export default function PaymentFormModal({ open, order, onClose, onUpdated, onToast }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amount, setAmount] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [transactionCode, setTransactionCode] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const paid = useMemo(() => order?.payments?.filter((p) => (p.status ?? "SUCCESS") === "SUCCESS").reduce((sum, p) => sum + Number(p.amount), 0) ?? 0, [order]);
  const remaining = Math.max(0, (order?.total ?? 0) - paid);
  const numericAmount = Number(amount) || 0;
  const numericCash = Number(cashReceived) || 0;
  const change = method === "CASH" ? Math.max(0, numericCash - numericAmount) : 0;

  if (!open || !order) return null;

  const orderId = order.id;

  async function submitPayment() {
    setError("");
    if (!numericAmount || numericAmount <= 0) return setError("Jumlah pembayaran harus lebih dari 0.");
    if (numericAmount > remaining) return setError(`Jumlah pembayaran melebihi sisa tagihan ${money(remaining)}.`);
    if (method === "CASH" && numericCash < numericAmount) return setError("Uang diterima harus sama atau lebih besar dari jumlah pembayaran.");
    try {
      setSaving(true);
      const result = await createPayment({ orderId, method, amount: numericAmount, ...(method === "CASH" ? { cashReceived: numericCash } : {}), ...(transactionCode.trim() ? { transactionCode: transactionCode.trim() } : {}), ...(note.trim() ? { note: note.trim() } : {}) });
      const updatedOrder = await getOrderById(orderId);
      onUpdated(updatedOrder);
      setAmount(""); setCashReceived(""); setTransactionCode(""); setNote(""); setMethod("CASH"); setConfirming(false); onClose();
      onToast(result.payment.changeAmount ? `Pembayaran tersimpan. Kembalian ${money(Number(result.payment.changeAmount))}.` : "Pembayaran berhasil disimpan.", "success");
    } catch (saveError) { const message = errorMessage(saveError); setError(message); setConfirming(false); onToast(message, "error"); }
    finally { setSaving(false); }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setConfirming(true); }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
    <div className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/60 bg-white shadow-2xl shadow-slate-950/20">
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
        <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#185df9]"><ReceiptText size={21}/></div><div><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#185df9]">Payment</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Catat pembayaran</h2><p className="mt-0.5 text-xs font-medium text-slate-400">Order {order.orderCode}</p></div></div>
        <button type="button" onClick={onClose} disabled={saving} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={19}/></button>
      </div>
      <form onSubmit={handleSubmit} className="max-h-[78vh] space-y-5 overflow-y-auto p-6 sm:p-7">
        <div className="grid gap-3 sm:grid-cols-3"><Metric label="Total" value={money(order.total)} /><Metric label="Sudah dibayar" value={money(paid)} tone="green" /><Metric label="Sisa" value={money(remaining)} tone="amber" /></div>
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        <div><p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Metode pembayaran</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((key) => <button type="button" key={key} onClick={() => setMethod(key)} className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${method === key ? "border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-500/10" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50"}`}><span className="block">{METHOD_LABEL[key]}</span></button>)}</div></div>
        <label className="block"><span className="mb-2 block text-sm font-black text-slate-800">Jumlah yang dibayar</span><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span><input type="number" min="1" max={remaining} step="1" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={saving || remaining <= 0} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-lg font-black text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" placeholder="0" required /></div></label>
        {method === "CASH" && <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5"><div className="mb-4 flex items-center gap-2"><Banknote size={18} className="text-blue-600"/><p className="text-sm font-black text-slate-900">Kalkulator uang tunai</p></div><label className="block"><span className="mb-2 block text-xs font-bold text-slate-500">Uang diterima dari customer</span><input type="number" min={numericAmount || 1} step="1" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3.5 text-base font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="Contoh: 100000" required /></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-white p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tagihan</p><p className="mt-1 text-lg font-black text-slate-900">{money(numericAmount)}</p></div><div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Kembalian</p><p className="mt-1 text-lg font-black text-blue-300">{money(change)}</p></div></div></div>}
        {(method === "BANK_TRANSFER" || method === "QRIS" || method === "OTHER") && <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Kode transaksi <span className="font-normal text-slate-400">(opsional)</span></span><input value={transactionCode} onChange={(e) => setTransactionCode(e.target.value)} disabled={saving} maxLength={150} className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="TRX-20260921-001" /></label>}
        <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Catatan <span className="font-normal text-slate-400">(opsional)</span></span><textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={saving} rows={3} maxLength={1000} className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="Tambahkan catatan pembayaran..." /></label>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Batal</button><button type="submit" disabled={saving || remaining <= 0} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#185df9] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"><CreditCard size={17}/> Simpan pembayaran</button></div>
      </form>
    </div>
    {confirming && <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><CheckCircle2 size={23}/></div><h3 className="mt-4 text-xl font-black text-slate-950">Simpan pembayaran?</h3><p className="mt-2 text-sm leading-6 text-slate-500">Pastikan nominal dan metode pembayaran sudah benar. {method === "CASH" ? `Kembalian ${money(change)}.` : "Transaksi akan tercatat sebagai berhasil."}</p><div className="mt-6 flex gap-2"><button type="button" onClick={() => setConfirming(false)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">Periksa lagi</button><button type="button" onClick={() => void submitPayment()} disabled={saving} className="flex-1 rounded-2xl bg-[#185df9] px-4 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? "Menyimpan..." : "Ya, simpan"}</button></div></div></div>}
  </div>;
}
function Metric({ label, value, tone }: { label: string; value: string; tone?: "green" | "amber" }) { const cls = tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-900"; return <div className={`rounded-2xl p-4 ${cls}`}><p className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</p><p className="mt-1 text-sm font-black sm:text-base">{value}</p></div>; }
