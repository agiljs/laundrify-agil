import { api } from "./api";
import type { ServiceItem } from "../types/api";

export async function getActiveServices() {
  const response = await api.get<{ data: ServiceItem[] }>("/services/active");
  return response.data.data;
}
