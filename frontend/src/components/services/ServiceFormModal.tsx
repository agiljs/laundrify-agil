import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import type { LaundryService } from "../../types/service";
import type { InventoryItem } from "../../types/inventory";
import { createService, updateService } from "../../services/service.service";
import { getInventoryItems } from "../../services/inventory.service";

 type Props = {
  service: LaundryService | null;
  onClose: () => void;
  onSaved: (service: LaundryService, mode: "create" | "update") => void;
};

type UsageRow = { inventoryItemId: string; quantity: string };

export default function ServiceFormModal({ service, onClose, onSaved }: Props) {
  const isEdit = service !== null;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("KG");
  const [price, setPrice] = useState("0");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadInventory() {
      try {
        setLoadingInventory(true);
        const items = await getInventoryItems();
        if (!cancelled) setInventory(items.filter((item) => item.isActive));
      } catch {
        if (!cancelled) setError("Inventory gagal dimuat. Anda tetap dapat menyimpan service tanpa konfigurasi inventory.");
      } finally {
        if (!cancelled) setLoadingInventory(false);
      }
    }
    void loadInventory();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setName(service?.name ?? "");
    setDescription(service?.description ?? "");
    setUnit(service?.unit ?? "KG");
    setPrice(String(service?.price ?? 0));
    setError("");
  }, [service]);

  useEffect(() => {
    if (!service?.inventoryUsage) {
      setUsage([]);
      return;
    }
    const rows = Object.entries(service.inventoryUsage).map(([key, value]) => {
      const match = inventory.find((item) => item.id === key || item.sku === key || item.name.toLowerCase() === key.toLowerCase());
      return { inventoryItemId: match?.id ?? key, quantity: String(value) };
    });
    setUsage(rows);
  }, [service, inventory]);

  const availableInventory = useMemo(() => inventory.filter((item) => !usage.some((row) => row.inventoryItemId === item.id)), [inventory, usage]);

  function addUsage() {
    const first = availableInventory[0];
    if (first) setUsage((rows) => [...rows, { inventoryItemId: first.id, quantity: "0.01" }]);
  }

  function updateUsage(index: number, key: keyof UsageRow, value: string) {
    setUsage((rows) => rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  }

  function removeUsage(index: number) {
    setUsage((rows) => rows.filter((_row, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const numericPrice = Number(price);
    if (!cleanName) return setError("Nama service wajib diisi.");
    if (!unit.trim()) return setError("Satuan service wajib diisi.");
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return setError("Harga harus lebih besar dari 0.");

    const inventoryUsage: Record<string, number> = {};
    for (const row of usage) {
      const qty = Number(row.quantity);
      if (!row.inventoryItemId) return setError("Semua inventory usage harus memilih item.");
      if (!Number.isFinite(qty) || qty <= 0) return setError("Jumlah pemakaian inventory harus lebih dari 0.");
      inventoryUsage[row.inventoryItemId] = qty;
    }

    if (!window.confirm(isEdit ? `Simpan perubahan service ${cleanName}?` : `Tambahkan service ${cleanName}?`)) return;

    try {
      setLoading(true);
      const payload = {
        name: cleanName,
        description: description.trim() || undefined,
        unit: unit.trim(),
        price: numericPrice,
        inventoryUsage: Object.keys(inventoryUsage).length ? inventoryUsage : undefined,
      };
      const saved = isEdit ? await updateService(service.id, payload) : await createService(payload);
      onSaved(saved, isEdit ? "update" : "create");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Service gagal disimpan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-md sm:p-6">
      <div className="mx-auto mt-4 w-full max-w-2xl overflow-hidden rounded-[30px] bg-white shadow-2xl sm:mt-8">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
          <div><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#185df9]">Service configuration</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">{isEdit ? "Edit Service" : "Tambah Service"}</h2><p className="mt-1 text-sm text-slate-500">Atur harga sekaligus bahan inventory yang otomatis dipakai setiap order.</p></div>
          <button type="button" onClick={onClose} disabled={loading} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={19}/></button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[calc(100vh-8rem)] overflow-y-auto p-6 sm:p-7">
          {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="mb-2 block text-sm font-black text-slate-800">Nama Service</span><input value={name} onChange={(e)=>setName(e.target.value)} disabled={loading} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" placeholder="Cuci + Setrika"/></label>
            <label><span className="mb-2 block text-sm font-black text-slate-800">Satuan</span><select value={unit} onChange={(e)=>setUnit(e.target.value)} disabled={loading} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"><option>KG</option><option>PCS</option><option>SET</option><option>METER</option><option>LITER</option></select></label>
            <label><span className="mb-2 block text-sm font-black text-slate-800">Harga</span><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span><input type="number" min="1" step="1" value={price} onChange={(e)=>setPrice(e.target.value)} disabled={loading} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-black outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"/></div></label>
            <label className="sm:col-span-2"><span className="mb-2 block text-sm font-black text-slate-800">Deskripsi</span><textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} disabled={loading} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" placeholder="Deskripsi layanan..."/></label>
          </div>

          <section className="mt-7 rounded-[26px] border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[11px] font-black uppercase tracking-[.14em] text-blue-600">Inventory usage</p><h3 className="mt-1 text-lg font-black text-slate-950">Bahan yang dipakai per {unit}</h3><p className="mt-1 text-xs leading-5 text-slate-500">Contoh: detergent 0.03 berarti 0.03 unit inventory digunakan setiap 1 KG.</p></div><button type="button" onClick={addUsage} disabled={loading || loadingInventory || availableInventory.length===0} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#185df9] px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-500/20 disabled:opacity-40"><Plus size={16}/> Tambah bahan</button></div>
            {loadingInventory ? <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500"><Loader2 size={18} className="animate-spin text-blue-600"/> Memuat inventory...</div> : usage.length===0 ? <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-white p-5 text-center text-sm text-slate-500">Belum ada bahan yang dikonfigurasi. Klik <b>Tambah bahan</b> jika service memakai detergent, softener, plastik, atau bahan lain.</div> : <div className="mt-5 space-y-3">{usage.map((row,index)=>{const selected=inventory.find(item=>item.id===row.inventoryItemId);return <div key={`${row.inventoryItemId}-${index}`} className="grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-[minmax(0,1fr)_150px_auto] sm:items-end"><label className="min-w-0"><span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-400">Inventory</span><select value={row.inventoryItemId} onChange={(e)=>updateUsage(index,"inventoryItemId",e.target.value)} className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500"><option value="">Pilih inventory</option>{selected && !inventory.some(item=>item.id===row.inventoryItemId) && <option value={row.inventoryItemId}>{row.inventoryItemId}</option>}{inventory.map(item=><option key={item.id} value={item.id}>{item.name} · {item.sku}</option>)}</select></label><label><span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-400">Pemakaian</span><input type="number" min="0.0001" step="0.0001" value={row.quantity} onChange={(e)=>updateUsage(index,"quantity",e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-black outline-none focus:border-blue-500"/></label><button type="button" onClick={()=>removeUsage(index)} className="grid h-11 w-11 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" title="Hapus bahan"><Trash2 size={17}/></button></div>})}</div>}
          </section>
          <div className="mt-7 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={loading} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Batal</button><button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#185df9] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50">{loading&&<Loader2 size={17} className="animate-spin"/>}{loading?"Menyimpan...":isEdit?"Simpan Perubahan":"Tambah Service"}</button></div>
        </form>
      </div>
    </div>
  );
}
