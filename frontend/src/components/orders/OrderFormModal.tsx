import { useEffect, useMemo, useState } from "react";
import { Calculator, Loader2, Plus, Trash2, X } from "lucide-react";
import SearchableSelect from "../ui/SearchableSelect";

import type { CreateOrderPayload, Order } from "../../types/order";

import type { Customer } from "../../types/customer";
import type { LaundryService } from "../../types/service";

import { getCustomers } from "../../services/customer.service";
import { getServices } from "../../services/service.service";
import { createOrder } from "../../services/order.service";

type OrderFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (order: Order) => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
};

type FormItem = {
  serviceId: string;
  quantity: string;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const apiError = error as ApiError;

    return apiError.response?.data?.message ?? fallback;
  }

  return fallback;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function OrderFormModal({
  open,
  onClose,
  onSaved,
  onToast,
}: OrderFormModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<LaundryService[]>([]);

  const [loadingMaster, setLoadingMaster] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<FormItem[]>([
    {
      serviceId: "",
      quantity: "1",
    },
  ]);

  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");

  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadMasterData() {
      try {
        setLoadingMaster(true);
        setFormError("");

        const [customerData, serviceData] = await Promise.all([
          getCustomers(),
          getServices(),
        ]);

        if (cancelled) {
          return;
        }

        setCustomers(customerData);
        setServices(serviceData.filter((service) => service.isActive));
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = getErrorMessage(
          error,
          "Gagal memuat customer dan service.",
        );

        setFormError(message);
      } finally {
        if (!cancelled) {
          setLoadingMaster(false);
        }
      }
    }

    void loadMasterData();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCustomerId("");
    setItems([
      {
        serviceId: "",
        quantity: "1",
      },
    ]);
    setDueAt("");
    setNote("");
    setFormError("");
  }, [open]);

  const selectedCustomer = useMemo(() => {
    return customers.find((customer) => customer.id === customerId);
  }, [customers, customerId]);

  const discountPercent =
    selectedCustomer?.membershipType === "MEMBER"
      ? Number(selectedCustomer.membershipDiscount ?? 10)
      : 0;

  const previewItems = useMemo(() => {
    return items.map((item) => {
      const service = services.find(
        (serviceItem) => serviceItem.id === item.serviceId,
      );

      const quantity = Math.max(0, Number(item.quantity) || 0);

      const price = Number(service?.price ?? 0);

      return {
        ...item,
        service,
        quantity,
        price,
        subtotal: quantity * price,
      };
    });
  }, [items, services]);

  const subtotal = useMemo(() => {
    return previewItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [previewItems]);

  const discount = useMemo(() => {
    return subtotal * (discountPercent / 100);
  }, [subtotal, discountPercent]);

  const total = Math.max(0, subtotal - discount);

  function updateItem(index: number, key: keyof FormItem, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        serviceId: "",
        quantity: "1",
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_item, itemIndex) => itemIndex !== index);
    });
  }

  function handleClose() {
    if (saving) {
      return;
    }

    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError("");

    if (!customerId) {
      setFormError("Customer wajib dipilih.");
      return;
    }

    if (items.length === 0) {
      setFormError("Minimal satu service harus ditambahkan.");
      return;
    }

    const normalizedItems = items.map((item) => ({
      serviceId: item.serviceId,
      quantity: Number(item.quantity),
    }));

    const invalidItem = normalizedItems.some(
      (item) =>
        !item.serviceId ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0,
    );

    if (invalidItem) {
      setFormError(
        "Setiap service harus dipilih dan quantity harus lebih dari 0.",
      );
      return;
    }

    const duplicateService =
      new Set(normalizedItems.map((item) => item.serviceId)).size !==
      normalizedItems.length;

    if (duplicateService) {
      setFormError(
        "Service yang sama tidak boleh dipilih lebih dari satu kali.",
      );
      return;
    }

    const payload: CreateOrderPayload = {
      customerId,
      items: normalizedItems,
    };

    if (dueAt) {
      payload.dueAt = new Date(dueAt).toISOString();
    }

    if (note.trim()) {
      payload.note = note.trim();
    }

    if (!window.confirm(`Buat order untuk ${selectedCustomer?.name ?? "customer ini"} dengan total ${formatCurrency(total)}?`)) {
      return;
    }

    try {
      setSaving(true);

      const createdOrder = await createOrder(payload);

      onSaved(createdOrder);

      onToast("Order berhasil dibuat.", "success");

      onClose();
    } catch (error) {
      const message = getErrorMessage(error, "Gagal membuat order.");

      setFormError(message);

      onToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-md sm:p-6">
      <div className="mx-auto mt-4 flex w-full max-w-4xl flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl sm:mt-8">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Buat Order Laundry
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tambahkan customer dan layanan laundry.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-6 p-5">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            {loadingMaster ? (
              <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-12">
                <Loader2 size={24} className="animate-spin text-blue-600" />

                <span className="ml-3 text-sm text-slate-600">
                  Memuat data customer dan service...
                </span>
              </div>
            ) : (
              <>
                <section>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Customer
                  </label>

                  <SearchableSelect
                    value={customerId}
                    onChange={setCustomerId}
                    disabled={saving}
                    placeholder="Pilih customer"
                    searchPlaceholder="Cari nama, nomor HP, atau kode..."
                    options={customers.map((customer) => ({
                      value: customer.id,
                      label: customer.name,
                      description: `${customer.phone} • ${customer.customerCode}`,
                      keywords: customer.customerCode,
                    }))}
                  />

                  {selectedCustomer && (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedCustomer.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {selectedCustomer.phone}
                          </p>
                        </div>

                        {selectedCustomer.membershipType === "MEMBER" ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            MEMBER {discountPercent}%
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            REGULAR
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Layanan
                      </h3>

                      <p className="text-xs text-slate-500">
                        Service yang nonaktif tidak tersedia untuk order baru.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addItem}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={17} />
                      Tambah Service
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const selectedService = services.find(
                        (service) => service.id === item.serviceId,
                      );

                      const itemSubtotal = selectedService
                        ? Number(selectedService.price) *
                          (Number(item.quantity) || 0)
                        : 0;

                      return (
                        <div
                          key={`${index}-${item.serviceId}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="grid gap-3 md:grid-cols-[1fr_140px_160px_auto] md:items-end">
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Service
                              </label>

                              <SearchableSelect
                                value={item.serviceId}
                                onChange={(value) => updateItem(index, "serviceId", value)}
                                disabled={saving}
                                placeholder="Pilih service"
                                searchPlaceholder="Cari nama service..."
                                options={services.filter((service) => !items.some((currentItem, currentIndex) => currentIndex !== index && currentItem.serviceId === service.id)).map((service) => ({
                                  value: service.id,
                                  label: service.name,
                                  description: `${formatCurrency(Number(service.price))} / ${service.unit}`,
                                  keywords: service.name,
                                }))}
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Quantity
                              </label>

                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "quantity",
                                    event.target.value,
                                  )
                                }
                                disabled={saving}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Subtotal
                              </label>

                              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900">
                                {formatCurrency(itemSubtotal)}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              disabled={saving || items.length === 1}
                              className="rounded-lg p-2.5 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                              title="Hapus service"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {selectedService && (
                            <p className="mt-2 text-xs text-slate-500">
                              Harga:{" "}
                              {formatCurrency(Number(selectedService.price))} /{" "}
                              {selectedService.unit}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Estimasi Selesai
                    </label>

                    <input
                      type="datetime-local"
                      value={dueAt}
                      onChange={(event) => setDueAt(event.target.value)}
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Catatan
                    </label>

                    <input
                      type="text"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      maxLength={500}
                      disabled={saving}
                      placeholder="Contoh: pakaian putih dipisahkan"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white">
                  <div className="mb-4 flex items-center gap-2">
                    <Calculator size={18} />
                    <h3 className="font-semibold">Ringkasan Order</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Subtotal</span>

                      <span className="font-medium">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Discount Member</span>

                      <span className="font-medium text-emerald-300">
                        - {formatCurrency(discount)}
                      </span>
                    </div>

                    <div className="my-3 border-t border-slate-700" />

                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold">
                        Total Preview
                      </span>

                      <span className="text-xl font-bold">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-slate-400">
                    Total di atas hanya preview. Nilai transaksi final dihitung
                    ulang oleh backend berdasarkan harga service dan membership
                    di database.
                  </p>
                </section>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving || loadingMaster || !customerId}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 size={17} className="animate-spin" />}

              {saving ? "Menyimpan..." : "Buat Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
