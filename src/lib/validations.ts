import { z } from "zod";

export const donationSchema = z.object({
  donor_name: z.string().min(2, "Name must be at least 2 characters"),
  donor_email: z.string().email("Invalid email").optional().or(z.literal("")),
  donor_phone: z.string().optional().or(z.literal("")),
  amount: z.number().min(1, "Amount must be greater than 0"),
  payment_mode: z.enum(["upi", "cash", "bank_transfer", "cheque", "other"]),
  transaction_id: z.string().optional().or(z.literal("")),
  event_id: z.string().optional().or(z.literal("")),
  donation_date: z.string(),
  notes: z.string().optional().or(z.literal("")),
  blood_group: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional().or(z.literal("")),
  can_contact_for_blood: z.boolean().optional(),
});

export const expenseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().or(z.literal("")),
  amount: z.number().min(1, "Amount must be greater than 0"),
  category: z.enum([
    "food",
    "supplies",
    "transport",
    "venue",
    "printing",
    "medical",
    "donation_forward",
    "other",
  ]),
  event_id: z.string().optional().or(z.literal("")),
  expense_date: z.string(),
});

export const eventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  description: z.string().optional().or(z.literal("")),
  target_amount: z.number().min(0, "Target amount must be 0 or more"),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]),
});

export const memberSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional().or(z.literal("")),
  role: z.enum(["admin", "treasurer", "coordinator", "volunteer", "viewer"]),
});

export type DonationFormData = z.infer<typeof donationSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type MemberFormData = z.infer<typeof memberSchema>;
