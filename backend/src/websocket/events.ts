import { getIO } from "./socket.js";

export function emitOrderStatusUpdated(order: {
  id: string;
  orderCode: string;
  status: string;
}) {
  getIO().emit("order:status-updated", {
    orderId: order.id,
    orderCode: order.orderCode,
    status: order.status,
  });
}
