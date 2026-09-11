import type { Request, Response } from "express";
import { email, success, z } from "zod";
import { login } from "../services/auth.service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginController(req: Request, res: Response) {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi dengan benar",
        errors: validation.error.flatten(),
      });
    }

    const result = await login(validation.data.email, validation.data.password);

    return res.status(200).json({
      success: true,
      message: "login berhasil",
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login gagal";

    return res.status(401).json({
      success: false,
      message,
    });
  }
}
