import { z } from "zod";

export const promoterSchema = z
  .object({
    source: z.string().min(1, { message: "Source is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    isEnabled: z.boolean().optional().default(true),
    manualRun: z.boolean().optional().default(false),
    schedule: z
      .number()
      .gt(599, { message: "Schedule must be at least 10 minutes" })
      .optional(),
  })
  .refine((data) => data.schedule || data.manualRun, {
    message: "Either schedule or manualRun must be provided",
    path: ["schedule", "manualRun"],
  });

export const updatePromoterSchema = z
  .object({
    source: z.string().url("Please enter a valid URL").optional(),
    email: z.string().email("Please enter a valid email address").optional(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .optional(),
    isEnabled: z.boolean().optional().default(true),
    manualRun: z.boolean().optional().default(false),
    schedule: z
      .number()
      .gt(599, { message: "Schedule must be at least 10 minutes" })
      .optional(),
  })
  .refine((data) => !(data.schedule && data.manualRun), {
    message: "Both schedule and manualRun cannot be provided",
    path: ["schedule", "manualRun"],
  });

export type PromoterSchema = z.infer<typeof promoterSchema>;
export type UpdatePromoterSchema = z.infer<typeof updatePromoterSchema>;
