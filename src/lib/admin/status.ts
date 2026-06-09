// Client-safe status vocabulary (no server-only deps), shared by the admin
// query layer and the order-detail <select>.

export type AdminOrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Refunded";

/** Status values the order-detail <select> can persist. */
export const ADMIN_STATUS_OPTIONS: AdminOrderStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
];
