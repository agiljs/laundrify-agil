import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

const POINTS_PER_RUPIAH = 10_000;
const MEMBER_THRESHOLD = 100;
const MEMBER_DISCOUNT = 5;
const MEMBER_DURATION_DAYS = 365;

type LoyaltyEntry = {
  type: "EARN" | "MEMBER_UPGRADE";
  points: number;
  amount: number;
  orderId: string;
  createdAt: string;
  note: string;
};

export async function awardPointsForPaidOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  customerId: string,
  amount: number,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { loyaltyPointAwardedAt: true },
  });

  if (!order || order.loyaltyPointAwardedAt) return null;

  const points = Math.floor(Math.max(0, amount) / POINTS_PER_RUPIAH);
  if (points <= 0) {
    await tx.order.update({
      where: { id: orderId },
      data: { loyaltyPointAwardedAt: new Date() },
    });
    return null;
  }

  const customer = await tx.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      loyaltyPoints: true,
      membershipType: true,
      membershipDiscount: true,
      membershipStartedAt: true,
      membershipExpiredAt: true,
      loyaltyHistory: true,
      membershipHistory: true,
    },
  });

  if (!customer) throw new Error("Customer untuk loyalty point tidak ditemukan");

  const nextPoints = customer.loyaltyPoints + points;
  const now = new Date();
  const entries = Array.isArray(customer.loyaltyHistory)
    ? customer.loyaltyHistory
    : [];

  const loyaltyEntry: LoyaltyEntry = {
    type: "EARN",
    points,
    amount,
    orderId,
    createdAt: now.toISOString(),
    note: `Poin dari pembayaran order ${orderId}`,
  };

  const shouldActivate =
    nextPoints >= MEMBER_THRESHOLD &&
    (customer.membershipType !== "MEMBER" ||
      !customer.membershipExpiredAt ||
      customer.membershipExpiredAt <= now);

  let membershipStartedAt = customer.membershipStartedAt;
  let membershipExpiredAt = customer.membershipExpiredAt;
  let membershipType = customer.membershipType;
  let membershipDiscount = Number(customer.membershipDiscount);
  let membershipHistory = Array.isArray(customer.membershipHistory)
    ? customer.membershipHistory
    : [];

  if (shouldActivate) {
    membershipType = "MEMBER";
    membershipDiscount = MEMBER_DISCOUNT;
    membershipStartedAt = now;
    membershipExpiredAt = new Date(now.getTime() + MEMBER_DURATION_DAYS * 24 * 60 * 60 * 1000);
    membershipHistory = [
      ...membershipHistory,
      {
        type: "ACTIVATED",
        points: nextPoints,
        discount: MEMBER_DISCOUNT,
        startedAt: now.toISOString(),
        expiredAt: membershipExpiredAt.toISOString(),
        note: `Customer mencapai ${MEMBER_THRESHOLD} loyalty points`,
      },
    ];
    entries.push({
      type: "MEMBER_UPGRADE",
      points: 0,
      amount,
      orderId,
      createdAt: now.toISOString(),
      note: "Membership aktif otomatis karena target poin tercapai",
    });
  }

  const updatedCustomer = await tx.customer.update({
    where: { id: customerId },
    data: {
      loyaltyPoints: nextPoints,
      loyaltyHistory: [...entries, loyaltyEntry],
      membershipType,
      membershipDiscount,
      membershipStartedAt,
      membershipExpiredAt,
      membershipHistory,
    },
  });

  await tx.order.update({
    where: { id: orderId },
    data: { loyaltyPointAwardedAt: now },
  });

  return {
    pointsEarned: points,
    totalPoints: updatedCustomer.loyaltyPoints,
    membershipActivated: shouldActivate,
    membershipDiscount: Number(updatedCustomer.membershipDiscount),
  };
}

export const MEMBERSHIP_RULES = {
  pointsPerRupiah: POINTS_PER_RUPIAH,
  memberThreshold: MEMBER_THRESHOLD,
  memberDiscount: MEMBER_DISCOUNT,
  durationDays: MEMBER_DURATION_DAYS,
};


export async function getMembershipSummary(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true, name: true, membershipType: true, membershipDiscount: true,
      membershipStartedAt: true, membershipExpiredAt: true, loyaltyPoints: true,
      loyaltyHistory: true, membershipHistory: true,
    },
  });
  if (!customer) throw new Error("Customer tidak ditemukan");
  const active = customer.membershipType === "MEMBER" && (!customer.membershipExpiredAt || customer.membershipExpiredAt > new Date());
  return {
    ...customer,
    membershipDiscount: Number(customer.membershipDiscount),
    active,
    nextMemberTarget: Math.max(0, MEMBER_THRESHOLD - customer.loyaltyPoints),
    rules: MEMBERSHIP_RULES,
  };
}
