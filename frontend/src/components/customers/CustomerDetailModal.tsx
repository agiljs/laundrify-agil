import { Pencil, Star, Trash2, X } from "lucide-react";
import type { Customer } from "../../types/customer";
import { formatDate } from "../../utils/format";

type CustomerDetailModalProps = {
  customer: Customer;
  canDelete: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const MEMBER_TARGET = 100;

export default function CustomerDetailModal({ customer, canDelete, onClose, onEdit, onDelete }: CustomerDetailModalProps) {
  const points = Number(customer.loyaltyPoints ?? 0);
  const progress = Math.min(100, Math.round((points / MEMBER_TARGET) * 100));
  const active = customer.membershipType === "MEMBER" && (!customer.membershipExpiredAt || new Date(customer.membershipExpiredAt) > new Date());

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-md sm:p-6">
      <div className="mx-auto mt-4 w-full max-w-2xl overflow-hidden rounded-[30px] bg-white shadow-2xl sm:mt-8">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
          <div><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#185df9]">Customer profile</p><h2 className="mt-1 text-xl font-black text-slate-950">Detail Pelanggan</h2><p className="mt-1 text-xs font-semibold text-slate-400">{customer.customerCode}</p></div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={19}/></button>
        </div>
        <div className="space-y-5 p-6 sm:p-7">
          <div className="flex flex-col gap-4 rounded-[26px] bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#185df9] text-xl font-black">{customer.name.charAt(0).toUpperCase()}</div><div className="min-w-0"><h3 className="truncate text-xl font-black">{customer.name}</h3><p className="mt-1 truncate text-sm text-slate-300">{customer.phone}</p></div></div><span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-black ${active ? "bg-blue-400/15 text-blue-200" : "bg-white/10 text-slate-300"}`}>{active ? "Member aktif" : "Non-member"}</span></div>

          <section className="rounded-[26px] border border-blue-100 bg-blue-50/60 p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[.14em] text-blue-600">Laundrify Membership</p><h3 className="mt-1 text-lg font-black text-slate-950">{points.toLocaleString("id-ID")} points</h3><p className="mt-1 text-xs leading-5 text-slate-500">Setiap pembayaran lunas mendapatkan 1 point untuk setiap Rp10.000.</p></div><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm"><Star size={19} fill="currentColor"/></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#185df9] transition-all" style={{width:`${progress}%`}}/></div><div className="mt-2 flex justify-between text-[11px] font-bold text-slate-400"><span>{active ? `${customer.membershipDiscount}% diskon aktif` : `${Math.max(0, MEMBER_TARGET-points)} point menuju Member`}</span><span>{MEMBER_TARGET} pts</span></div>{active && customer.membershipExpiredAt && <p className="mt-3 text-xs font-semibold text-blue-700">Member berlaku sampai {formatDate(customer.membershipExpiredAt)}.</p>}</section>

          <div className="grid gap-4 sm:grid-cols-2"><Info label="Email" value={customer.email || "-"}/><Info label="Diskon Member" value={`${customer.membershipDiscount ?? 0}%`}/><Info label="Mulai Member" value={customer.membershipStartedAt ? formatDate(customer.membershipStartedAt) : "-"}/><Info label="Terdaftar" value={formatDate(customer.createdAt)}/></div>
          <Info label="Alamat" value={customer.address || "-"}/><Info label="Catatan" value={customer.notes || "-"}/>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onEdit} title="Edit" className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-700 hover:bg-blue-100"><Pencil size={16}/></button>{canDelete&&<button type="button" onClick={onDelete} title="Hapus" className="inline-flex items-center justify-center rounded-2xl bg-red-50 p-3 text-red-600 hover:bg-red-100"><Trash2 size={16}/></button>}</div>
        </div>
      </div>
    </div>
  );
}
function Info({label,value}:{label:string;value:string}){return <div className="min-w-0"><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-700">{value}</p></div>}
