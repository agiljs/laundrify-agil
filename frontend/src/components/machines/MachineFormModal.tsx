import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { createMachine, updateMachine } from "../../services/machine.service";
import type { Machine, MachinePayload, MachineStatus } from "../../types/machine";

type Props = { open: boolean; machine: Machine | null; onClose: () => void; onSaved: (machine: Machine) => void };
const STATUSES: MachineStatus[] = ["ACTIVE", "MAINTENANCE", "INACTIVE", "BROKEN"];

function toDateInput(value: string | null) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
function toDateTimeInput(value: string | null) { return value ? new Date(value).toISOString().slice(0, 16) : ""; }
function errorMessage(error: unknown) { return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Gagal menyimpan machine."; }

export default function MachineFormModal({ open, machine, onClose, onSaved }: Props) {
  const editing = Boolean(machine);
  const [form, setForm] = useState({ machineCode: "", name: "", type: "", brand: "", model: "", serialNumber: "", purchaseDate: "", purchasePrice: "", status: "ACTIVE" as MachineStatus, location: "", lastMaintenanceAt: "", nextMaintenanceAt: "", maintenanceCost: "0", maintenanceNotes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(machine ? {
      machineCode: machine.machineCode, name: machine.name, type: machine.type, brand: machine.brand ?? "", model: machine.model ?? "", serialNumber: machine.serialNumber ?? "",
      purchaseDate: toDateInput(machine.purchaseDate), purchasePrice: machine.purchasePrice == null ? "" : String(machine.purchasePrice), status: machine.status, location: machine.location ?? "",
      lastMaintenanceAt: toDateTimeInput(machine.lastMaintenanceAt), nextMaintenanceAt: toDateTimeInput(machine.nextMaintenanceAt), maintenanceCost: String(machine.maintenanceCost ?? 0), maintenanceNotes: machine.maintenanceNotes ?? "",
    } : { machineCode: "", name: "", type: "", brand: "", model: "", serialNumber: "", purchaseDate: "", purchasePrice: "", status: "ACTIVE", location: "", lastMaintenanceAt: "", nextMaintenanceAt: "", maintenanceCost: "0", maintenanceNotes: "" });
  }, [open, machine]);

  if (!open) return null;
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.machineCode.trim() || !form.name.trim() || !form.type.trim()) { setError("Machine code, nama, dan tipe wajib diisi."); return; }
    const payload: MachinePayload = {
      machineCode: form.machineCode.trim(), name: form.name.trim(), type: form.type.trim(), brand: form.brand.trim() || undefined, model: form.model.trim() || undefined,
      serialNumber: form.serialNumber.trim() || undefined, purchaseDate: form.purchaseDate ? new Date(`${form.purchaseDate}T00:00:00`).toISOString() : undefined,
      purchasePrice: form.purchasePrice === "" ? undefined : Number(form.purchasePrice), status: form.status, location: form.location.trim() || undefined,
      lastMaintenanceAt: form.lastMaintenanceAt ? new Date(form.lastMaintenanceAt).toISOString() : undefined, nextMaintenanceAt: form.nextMaintenanceAt ? new Date(form.nextMaintenanceAt).toISOString() : undefined,
      maintenanceCost: form.maintenanceCost === "" ? 0 : Number(form.maintenanceCost), maintenanceNotes: form.maintenanceNotes.trim() || undefined,
    };
    if (!window.confirm(`Simpan data mesin ${form.name.trim()}?`)) return;

    try { setSaving(true); setError(""); const result = editing ? await updateMachine(machine!.id, payload) : await createMachine(payload); onSaved(result); onClose(); }
    catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  const input = "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500";
  return <div className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/50 p-4"><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Machine Management</p><h2 className="mt-1 text-xl font-bold text-slate-900">{editing ? "Edit Machine" : "Tambah Machine"}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button></div>
    <form onSubmit={handleSubmit} className="space-y-5 p-6">{error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-3">{([['machineCode','Machine Code *','text'],['name','Nama Machine *','text'],['type','Tipe Machine *','text'],['brand','Brand','text'],['model','Model','text'],['serialNumber','Serial Number','text']] as const).map(([key,label,type]) => <label key={key} className="space-y-2"><span className="text-sm font-semibold text-slate-700">{label}</span><input type={type} value={form[key]} onChange={(e) => set(key,e.target.value)} className={input} /></label>)}
        <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">Status</span><select value={form.status} onChange={(e) => set("status",e.target.value)} className={input}>{STATUSES.map((s)=><option key={s}>{s}</option>)}</select></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">Lokasi</span><input value={form.location} onChange={(e)=>set("location",e.target.value)} className={input}/></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">Tanggal Pembelian</span><input type="date" value={form.purchaseDate} onChange={(e)=>set("purchaseDate",e.target.value)} className={input}/></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">Harga Pembelian</span><input type="number" min="0" value={form.purchasePrice} onChange={(e)=>set("purchasePrice",e.target.value)} className={input}/></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">Biaya Maintenance</span><input type="number" min="0" value={form.maintenanceCost} onChange={(e)=>set("maintenanceCost",e.target.value)} className={input}/></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">Maintenance Terakhir</span><input type="datetime-local" value={form.lastMaintenanceAt} onChange={(e)=>set("lastMaintenanceAt",e.target.value)} className={input}/></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-slate-700">Maintenance Berikutnya</span><input type="datetime-local" value={form.nextMaintenanceAt} onChange={(e)=>set("nextMaintenanceAt",e.target.value)} className={input}/></label>
      </div>
      <label className="block space-y-2"><span className="text-sm font-semibold text-slate-700">Catatan Maintenance</span><textarea rows={4} value={form.maintenanceNotes} onChange={(e)=>set("maintenanceNotes",e.target.value)} className={input} /></label>
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Batal</button><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 size={17} className="animate-spin"/>}{editing ? "Simpan Perubahan" : "Tambah Machine"}</button></div>
    </form></div></div>;
}
