// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET;

// if (!JWT_SECRET) {
//   throw new Error("JWT_SECRET is not defined");
// }

// export function generateToken(payload: { id: string; role: string }) {
//   return jwt.sign(payload, JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN || "1d",
//   });
// }

import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "rahasia_super_aman";

export function generateToken(payload: { id: string; role: string }) {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload as object, JWT_SECRET, options);
}
