import type { Request, Response } from "express";
import { z } from "zod";
import {
  getAuthenticatedUser,
  login,
  loginWithGoogle,
  registerCustomer,
} from "../services/auth.service.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});


const googleLoginSchema = z.object({
  credential: z.string().min(20),
});

const registerCustomerSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email().max(150),
  password: z.string().min(8).max(100),
  phone: z.string().min(5).max(30),
  address: z.string().max(500).optional(),
});

export async function loginController(req: Request, res: Response) {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi dengan benar",
      });
    }

    const result = await login(validation.data.email, validation.data.password);

    return res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Login gagal",
    });
  }
}

export async function googleLoginController(req: Request, res: Response) {
  try {
    const validation = googleLoginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, message: "Credential Google tidak valid" });
    }

    const result = await loginWithGoogle(validation.data.credential);
    return res.status(200).json({ success: true, message: "Login Google berhasil", data: result });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Login Google gagal",
    });
  }
}

export async function registerCustomerController(req: Request, res: Response) {
  try {
    const validation = registerCustomerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Data pendaftaran customer tidak valid",
        errors: validation.error.flatten(),
      });
    }

    const result = await registerCustomer(validation.data);

    return res.status(201).json({
      success: true,
      message: "Akun customer berhasil dibuat",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Registrasi gagal",
    });
  }
}

export async function meController(req: Request, res: Response) {
  try {
    const user = await getAuthenticatedUser(req.user!.id);
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Sesi tidak valid",
    });
  }
}
