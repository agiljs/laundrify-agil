import * as SecureStore from "expo-secure-store";

const PIN_KEY = "laundrify_app_pin";

export async function getStoredPin() {
  return SecureStore.getItemAsync(PIN_KEY);
}

export async function isPinEnabled() {
  return (await getStoredPin()) !== null;
}

export async function setPin(pin: string) {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function clearPin() {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

export async function verifyPin(pin: string) {
  const stored = await getStoredPin();
  return stored !== null && stored === pin;
}
