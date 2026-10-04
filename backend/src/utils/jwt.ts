import jwt, { type SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "rahasia_super_aman";

export function generateToken(payload: { id: string; role: "ADMIN" | "STAFF" | "CUSTOMER" }) {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, JWT_SECRET, options);
}
