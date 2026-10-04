import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { CreateDeliveryPayload, DeliveryType } from "../../types/delivery";
import type { Order } from "../../types/order";
import { createDelivery } from "../../services/delivery.service";
import { formatCurrency } from "../../utils/format";
import SearchableSelect from "../ui/SearchableSelect";

type Props = {
  open: boolean;
  orders: Order[];
  onClose: () => void;
  onCreated: (delivery: Awaited<ReturnType<typeof createDelivery>>) => void;
};

export default function DeliveryFormModal({ open, orders, onClose, onCreated }: Props) {
  const [orderId, setOrderId] = useState("");
  const [type, setType] = useState<DeliveryType>("DELIVERY");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const first = orders[0];
    setOrderId(first?.id ?? "");
    setType("DELIVERY");
    setRecipientName(first?.customer?.name ?? "");
    setRecipientPhone(first?.customer?.phone ?? "");
    setAddress("");
    setScheduledAt("");
    setNotes("");
    setError("");
  }, [open, orders]);

  useEffect(() => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    setRecipientName(order.customer?.name ?? "");
    setRecipientPhone(order.customer?.phone ?? "");
  }, [orderId, orders]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!orderId) {
      setError("Pilih order terlebih dahulu.");
      return;
    }
    if (type === "DELIVERY" && !address.trim()) {
      setError("Alamat wajib diisi untuk delivery.");
      return;
    }

    const payload: CreateDeliveryPayload = {
      orderId,
      type,
      recipientName: recipientName.trim() || undefined,
      recipientPhone: recipientPhone.trim() || undefined,
      address: address.trim() || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      notes: notes.trim() || undefined,
    };

    if (!window.confirm(`Buat ${type === "DELIVERY" ? "delivery" : "pickup"} untuk ${orders.find((item) => item.id === orderId)?.orderCode ?? "order ini"}?`)) return;

    try {
      setSaving(true);
      const delivery = await createDelivery(payload);
      onCreated(delivery);
      onClose();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      setError(message ?? "Delivery gagal dibuat.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Buat Delivery</h2>
            <p className="mt-1 text-sm text-slate-500">Buat pickup atau pengantaran untuk order.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Order</label>
            <SearchableSelect
              value={orderId}
              onChange={setOrderId}
              placeholder="Pilih order"
              searchPlaceholder="Cari kode order atau customer..."
              options={orders.map((order) => ({
                value: order.id,
                label: order.orderCode,
                description: `${order.customer?.name ?? "Tanpa customer"} • ${formatCurrency(order.total)}`,
                keywords: `${order.orderCode} ${order.customer?.name ?? ""} ${order.customer?.phone ?? ""}`,
              }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Tipe</label>
              <select value={type} onChange={(e) => setType(e.target.value as DeliveryType)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500">
                <option value="DELIVERY">Delivery</option>
                <option value="PICKUP">Pickup</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Jadwal</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Nama Penerima</label><input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">No. Telepon</label><input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500" /></div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Alamat {type === "DELIVERY" && <span className="text-red-500">*</span>}</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="Alamat lengkap tujuan" />
          </div>

          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Catatan</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500" /></div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving && <Loader2 size={17} className="animate-spin" />} Buat Delivery</button>
          </div>
        </form>
      </div>
    </div>
  );
}
