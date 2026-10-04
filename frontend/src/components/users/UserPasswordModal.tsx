import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { changeUserPassword } from "../../services/user.service";
import type { User } from "../../types/user";

type Props = { open: boolean; user: User | null; onClose: () => void; onSaved: (user: User) => void };
export default function UserPasswordModal({ open, user, onClose, onSaved }: Props) {
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  if (!open || !user) return null;
  const userId = user.id;
  const userName = user.name;
  async function submit(e: React.FormEvent) { e.preventDefault(); if(password.length<8){setError("Password minimal 8 karakter.");return;} if(password!==confirm){setError("Konfirmasi password tidak sama.");return;} if(!window.confirm(`Ubah password untuk ${userName}?`)) return; try{setSaving(true);setError("");const result=await changeUserPassword(userId,password);onSaved(result);onClose();setPassword("");setConfirm("");}catch(err){setError((err as {response?:{data?:{message?:string}}}).response?.data?.message??"Gagal mengubah password.");}finally{setSaving(false);} }
  const input="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500";
  return <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Security</p><h2 className="mt-1 text-xl font-bold">Ubah Password</h2><p className="mt-1 text-sm text-slate-500">{user.name}</p></div><button type="button" onClick={onClose}><X/></button></div><form onSubmit={submit} className="space-y-4 p-6">{error&&<div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}<label className="block space-y-2"><span className="text-sm font-semibold">Password Baru</span><input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} className={input}/></label><label className="block space-y-2"><span className="text-sm font-semibold">Konfirmasi Password</span><input type="password" minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} className={input}/></label><div className="flex justify-end gap-3 border-t pt-5"><button type="button" onClick={onClose} className="rounded-xl border px-5 py-3 text-sm font-semibold">Batal</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving&&<Loader2 size={17} className="animate-spin"/>}Simpan Password</button></div></form></div></div>;
}
