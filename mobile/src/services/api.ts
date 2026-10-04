import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:5000/api",
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("laundrify_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function saveToken(token: string) {
  await SecureStore.setItemAsync("laundrify_token", token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync("laundrify_token");
}

export function unwrap<T>(value: T | { data: T }): T {
  return typeof value === "object" && value !== null && "data" in value
    ? (value as { data: T }).data
    : value as T;
}
