import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { InventoryItem } from "../../types/inventory";
import { createInventoryItem, updateInventoryItem } from "../../services/inventory.service";

type Props = {
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: (item: InventoryItem, mode: "create" | "update") => void;
};

export default function InventoryFormModal({ item, onClose, onSaved }: Props) {
  const isEdit = item !== null;
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("PCS");
  const [currentStock, setCurrentStock] = useState("0");
  const [minimumStock, setMinimumStock] = useState("0");
  const [maximumStock, setMaximumStock] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSku(item?.sku ?? "");
    setName(item?.name ?? "");
    setCategory(item?.category ?? "");
    setUnit(item?.unit ?? "PCS");
    setCurrentStock(String(item?.currentStock ?? 0));
    setMinimumStock(String(item?.minimumStock ?? 0));
    setMaximumStock(item?.maximumStock == null ? "" : String(item.maximumStock));
    setCostPrice(String(item?.costPrice ?? 0));
    setSupplierName(item?.supplierName ?? "");
    setSupplierPhone(item?.supplierPhone ?? "");
    setError("");
  }, [item]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanSku = sku.trim();
    const min = Number(minimumStock);
    const max = maximumStock.trim() === "" ? undefined : Number(maximumStock);
    const cost = Number(costPrice);
    const stock = Number(currentStock);

    if (!isEdit && !cleanSku) return setError("SKU wajib diisi.");
    if (!cleanName) return setError("Nama inventory wajib diisi.");
    if (!unit.trim()) return setError("Satuan wajib diisi.");
    if ([min, cost].some((v) => Number.isNaN(v) || v < 0) || (!isEdit && (Number.isNaN(stock) || stock < 0))) {
      return setError("Nilai stok dan harga tidak valid.");
    }
    if (max !== undefined && (Number.isNaN(max) || max < min)) return setError("Maximum stock tidak boleh lebih kecil dari minimum stock.");

    if (!window.confirm(isEdit ? `Simpan perubahan inventory ${name.trim()}?` : `Tambahkan inventory ${name.trim()}?`)) return;

    try {
      setLoading(true);
      setError("");
      const saved = isEdit
        ? await updateInventoryItem(item.id, {
            name: cleanName, category: category.trim() || undefined, unit: unit.trim(), minimumStock: min,
            maximumStock: max, costPrice: cost, supplierName: supplierName.trim() || undefined,
            supplierPhone: supplierPhone.trim() || undefined,
          })
        : await createInventoryItem({
            sku: cleanSku, name: cleanName, category: category.trim() || undefined, unit: unit.trim(),
            currentStock: stock, minimumStock: min, maximumStock: max, costPrice: cost,
            supplierName: supplierName.trim() || undefined, supplierPhone: supplierPhone.trim() || undefined,
          });
      onSaved(saved, isEdit ? "update" : "create");
    } catch (err) {
      console.error(err);
      setError("Inventory gagal disimpan. Periksa data dan koneksi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div><h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit Inventory" : "Tambah Inventory"}</h2><p className="mt-1 text-sm text-slate-500">Kelola bahan dan stok inventory.</p></div>
          <button type="button" onClick={onClose} disabled={loading} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU"><input value={sku} onChange={(e) => setSku(e.target.value)} disabled={isEdit || loading} required={!isEdit} placeholder="DET-001" className={input} /></Field>
            <Field label="Nama Inventory"><input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} required placeholder="Detergent" className={input} /></Field>
            <Field label="Kategori"><input value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading} placeholder="Chemical" className={input} /></Field>
            <Field label="Satuan"><select value={unit} onChange={(e) => setUnit(e.target.value)} disabled={loading} className={input}><option>PCS</option><option>KG</option><option>LITER</option><option>ML</option><option>GRAM</option><option>SET</option></select></Field>
            {!isEdit && <Field label="Stok Awal"><input type="number" min="0" step="0.001" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} disabled={loading} className={input} /></Field>}
            <Field label="Minimum Stock"><input type="number" min="0" step="0.001" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} disabled={loading} className={input} /></Field>
            <Field label="Maximum Stock"><input type="number" min="0" step="0.001" value={maximumStock} onChange={(e) => setMaximumStock(e.target.value)} disabled={loading} placeholder="Opsional" className={input} /></Field>
            <Field label="Harga Modal"><input type="number" min="0" step="1" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} disabled={loading} className={input} /></Field>
            <Field label="Nama Supplier"><input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} disabled={loading} className={input} /></Field>
            <Field label="Telepon Supplier"><input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} disabled={loading} className={input} /></Field>
          </div>
          {isEdit && <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">Stok saat ini tidak diubah dari form ini. Gunakan menu transaksi stok agar setiap perubahan memiliki riwayat.</p>}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">Batal</button><button disabled={loading} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">{loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Inventory"}</button></div>
        </form>
      </div>
    </div>
  );
}

const input = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>{children}</div>; }
