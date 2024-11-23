import { validateCronSchedule } from "@/lib/validateCron";
import { z } from "zod";

export const promoterSchema = z
  .object({
    source: z.string().min(1, { message: "Source is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    isEnabled: z.boolean(),
    manualRun: z.boolean(),
    schedule: z.string().optional(),
  })
  .refine((data) => !data.schedule || validateCronSchedule(data.schedule), {
    message: "Invalid cron expression",
    path: ["schedule"],
  })
  .refine((data) => data.schedule || data.manualRun, {
    message: "Either schedule or manualRun must be provided",
    path: ["schedule", "manualRun"],
  });

export type PromoterSchema = z.infer<typeof promoterSchema>;
