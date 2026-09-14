import { date } from "zod";
import { prisma } from "../lib/prisma";

export async function findCustomers() {
  return prisma.customer.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findCustomerById(id: string) {
  return prisma.customer.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
}

export async function findCustomerByPhone(phone: string) {
  return prisma.customer.findFirst({
    where: {
      phone,
      deletedAt: null,
    },
  });
}

export async function createCustomer(data: {
  customerCode: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  return prisma.customer.create({
    data,
  });
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  },
) {
  return prisma.customer.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteCustomer(id: string) {
  return prisma.customer.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}
