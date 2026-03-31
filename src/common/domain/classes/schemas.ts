import { z } from "zod";

const SAFE_NAME_RE = /^[^\x00-\x1f\x7f/\\]+$/;
const WINDOWS_RESERVED_RE = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

export const ClassDefSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z
    .string()
    .min(1)
    .max(128)
    .refine((v) => SAFE_NAME_RE.test(v), {
      message: "Class name contains invalid characters (control chars, slashes)",
    })
    .refine((v) => !WINDOWS_RESERVED_RE.test(v), {
      message: "Class name is a reserved Windows filename",
    }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a 6-digit hex string"),
  source: z.enum(["preset", "custom", "imported"]),
});
