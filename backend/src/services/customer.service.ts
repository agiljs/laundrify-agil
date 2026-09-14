import {
  createCustomer,
  deleteCustomer,
  findCustomerById,
  findCustomerByPhone,
  findCustomers,
  updateCustomer,
} from "../repositories/customer.repository";
import { randomUUID } from "node:crypto";
import { Prisma } from "../../generated/prisma/client";

function generateCustomerCode() {
  //   const random = Math.floor(100000 + Math.random() * 900000);
  return `CUS-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

  //   return `CUS-${random}`;
}

export async function getCustomers() {
  return findCustomers();
}

export async function getCustomersById(id: string) {
  const customer = await findCustomerById(id);

  if (!customer) {
    throw new Error("Customer tidak ditemukan");
  }

  return customer;
}

export async function createNewCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  const existingCustomer = await findCustomerByPhone(data.phone);

  if (existingCustomer) {
    throw new Error("Nomor telepon customer sudah terdaftar");
  }

  return createCustomer({
    customerCode: generateCustomerCode(),
    ...data,
  });
}

export async function updateExistingCustomer(
  id: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  },
) {
  const customer = await findCustomerById(id);

  if (!customer) {
    throw new Error("Customer tidak ditemukan");
  }

  if (data.phone && data.phone !== customer.phone) {
    const existingCustomer = await findCustomerByPhone(data.phone);

    if (existingCustomer) {
      throw new Error("Nomor telepon customer sudah terdaftar");
    }
  }

  return updateCustomer(id, data);
}

export async function removeCustomer(id: string) {
  const customer = await findCustomerById(id);

  if (!customer) {
    throw new Error("Customer tidak ditemukan");
  }

  return deleteCustomer(id);
}
