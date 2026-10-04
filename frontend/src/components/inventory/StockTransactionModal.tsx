import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { InventoryItem, InventoryTransactionType } from "../../types/inventory";
import { createInventoryTransaction } from "../../services/inventory.service";

type Props = { item: InventoryItem; onClose: () => void; onSaved: (item: InventoryItem) => void };

export default function StockTransactionModal({ item, onClose, onSaved }: Props) {
  const [type, setType] = useState<InventoryTransactionType>("PURCHASE");
  const [quantity, setQuantity] = useState("");
  const [supplierName, setSupplierName] = useState(item.supplierName ?? "");
  const [purchasePrice, setPurchasePrice] = useState(String(item.lastPurchasePrice ?? item.costPrice ?? 0));
  const [purchaseReference, setPurchaseReference] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setSupplierName(item.supplierName ?? ""); }, [item]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) return setError("Jumlah harus lebih besar dari 0.");
    if (type === "USAGE" && qty > Number(item.currentStock)) return setError("Jumlah pemakaian melebihi stok saat ini.");
    if (type === "PURCHASE" && Number(purchasePrice) < 0) return setError("Harga pembelian tidak valid.");
    if (!window.confirm(`Simpan transaksi stok ${type}?`)) return;

    try {
      setLoading(true); setError("");
      const result = await createInventoryTransaction({
        inventoryItemId: item.id, type, quantity: qty,
        supplierName: supplierName.trim() || undefined,
        purchasePrice: type === "PURCHASE" ? Number(purchasePrice) : undefined,
        purchaseReference: purchaseReference.trim() || undefined,
        note: note.trim() || undefined,
      });
      onSaved(result.inventoryItem);
    } catch (err) { console.error(err); setError("Transaksi gagal disimpan. Periksa data dan koneksi server."); }
    finally { setLoading(false); }
  }

  const projected = Number(item.currentStock) + (type === "USAGE" ? -Number(quantity || 0) : Number(quantity || 0));
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><div><h2 className="text-lg font-bold text-slate-900">Transaksi Stok</h2><p className="mt-1 text-sm text-slate-500">{item.name} · Stok {Number(item.currentStock)} {item.unit}</p></div><button onClick={onClose} disabled={loading} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X size={18}/></button></div>
    <form onSubmit={submit} className="space-y-5 p-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Jenis Transaksi"><select value={type} onChange={e => setType(e.target.value as InventoryTransactionType)} className={input}><option value="PURCHASE">Purchase / Pembelian</option><option value="USAGE">Usage / Pemakaian</option><option value="ADJUSTMENT">Adjustment / Penyesuaian</option><option value="RETURN">Return / Pengembalian</option></select></Field><Field label={`Jumlah (${item.unit})`}><input type="number" min="0.001" step="0.001" value={quantity} onChange={e=>setQuantity(e.target.value)} required className={input}/></Field></div>
      <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Perkiraan stok setelah transaksi</p><p className={`mt-1 text-xl font-bold ${projected < Number(item.minimumStock) ? "text-red-600" : "text-slate-900"}`}>{Number.isFinite(projected) ? projected : Number(item.currentStock)} {item.unit}</p></div>
      {type === "PURCHASE" && <div className="grid gap-4 sm:grid-cols-2"><Field label="Supplier"><input value={supplierName} onChange={e=>setSupplierName(e.target.value)} className={input}/></Field><Field label="Harga Pembelian"><input type="number" min="0" value={purchasePrice} onChange={e=>setPurchasePrice(e.target.value)} className={input}/></Field></div>}
      <Field label="Referensi Pembelian"><input value={purchaseReference} onChange={e=>setPurchaseReference(e.target.value)} placeholder="Nomor nota / invoice (opsional)" className={input}/></Field>
      <Field label="Catatan"><textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} className={`${input} resize-none`} placeholder="Catatan transaksi..."/></Field>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">Batal</button><button disabled={loading} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">{loading ? "Menyimpan..." : "Simpan Transaksi"}</button></div>
    </form></div></div>;
}
const input="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
function Field({label,children}:{label:string;children:React.ReactNode}){return <div><label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>{children}</div>}
