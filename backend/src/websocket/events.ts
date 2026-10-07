import { rooms, tryGetIO } from "./socket.js";

/**
 * Semua event dikirim ke room tertentu, bukan broadcast ke semua koneksi:
 *  - staff              : ADMIN + STAFF (web admin & aplikasi mobile)
 *  - customer:<id>      : hanya pemilik order
 *  - user:<id>          : satu akun (notifikasi pribadi)
 * Payload sengaja kecil (id + status). Klien mengambil data lengkap lewat REST
 * sehingga aturan akses REST tetap menjadi satu-satunya gerbang data.
 */

export type OrderEventKind = "created" | "updated" | "status-updated" | "deleted";

type OrderRef = {
  id: string;
  orderCode: string;
  customerId: string;
  status?: string;
  paymentStatus?: string;
};

export function emitOrderEvent(kind: OrderEventKind, order: OrderRef) {
  const io = tryGetIO();
  if (!io) return;

  const payload = {
    orderId: order.id,
    orderCode: order.orderCode,
    customerId: order.customerId,
    status: order.status,
    paymentStatus: order.paymentStatus,
  };

  io.to(rooms.staff).to(rooms.customer(order.customerId)).emit(`order:${kind}`, payload);
}

/** Kompatibilitas dengan kode lama. */
export function emitOrderStatusUpdated(order: { id: string; orderCode: string; status: string; customerId: string }) {
  emitOrderEvent("status-updated", order);
}

export function emitPaymentUpdated(data: {
  orderId: string;
  orderCode: string;
  customerId: string;
  paymentId: string;
  paymentTransactionStatus: string;
  orderPaymentStatus: string;
}) {
  const io = tryGetIO();
  if (!io) return;

  io.to(rooms.staff).to(rooms.customer(data.customerId)).emit("payment:updated", data);
}

/** Perubahan data umum (customer, service, inventory, dll) -> halaman admin/mobile refresh otomatis. */
export function emitDataChanged(entity: string, method: string) {
  tryGetIO()?.to(rooms.staff).emit("data:changed", { entity, method, at: Date.now() });
}

export function emitNotification(
  userId: string,
  notification: { id: string; title: string; message: string; type: string; createdAt: Date | string },
) {
  tryGetIO()?.to(rooms.user(userId)).emit("notification:new", {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    createdAt: notification.createdAt,
  });
}
