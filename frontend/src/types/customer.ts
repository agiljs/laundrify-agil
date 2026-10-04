export type MembershipType = "NONE" | "MEMBER";

export type Customer = {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;

  membershipType: MembershipType;

  membershipDiscount: number;

  membershipStartedAt: string | null;

  membershipExpiredAt: string | null;

  loyaltyPoints: number;

  createdAt: string;

  updatedAt: string;
};
