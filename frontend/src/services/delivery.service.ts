import api from "./api";
import type { AssignCourierPayload, CreateDeliveryPayload, Delivery, DeliveryStatus } from "../types/delivery";
type List={success:boolean;data:Delivery[]}; type Item={success:boolean;data:Delivery;message?:string};
export async function getDeliveries(){const r=await api.get<List>("/deliveries");return r.data.data;}
export async function getDeliveryById(id:string){const r=await api.get<Item>(`/deliveries/${id}`);return r.data.data;}
export async function createDelivery(data:CreateDeliveryPayload){const r=await api.post<Item>("/deliveries",data);return r.data.data;}
export async function assignCourier(id:string,data:AssignCourierPayload){const r=await api.patch<Item>(`/deliveries/${id}/assign`,data);return r.data.data;}
export async function updateDeliveryStatus(id:string,status:DeliveryStatus){const r=await api.patch<Item>(`/deliveries/${id}/status`,{status});return r.data.data;}
