export type UserRole = "admin" | "treasurer" | "coordinator";
export type PaymentMode = "upi" | "cash" | "bank_transfer" | "cheque" | "other";
export type ExpenseStatus = "pending" | "approved" | "rejected";
export type ExpenseCategory = "food" | "supplies" | "transport" | "venue" | "printing" | "medical" | "donation_forward" | "other";
export type EventStatus = "upcoming" | "active" | "completed" | "cancelled";

export interface Club {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  upi_id?: string;
  bank_details?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  auth_id: string;
  club_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  joined_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  club_id: string;
  name: string;
  description?: string;
  target_amount: number;
  start_date?: string;
  end_date?: string;
  status: EventStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  club_id: string;
  event_id?: string;
  donor_name: string;
  donor_email?: string;
  donor_phone?: string;
  amount: number;
  payment_mode: PaymentMode;
  transaction_id?: string;
  screenshot_url?: string;
  notes?: string;
  collected_by: string;
  donation_date: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  event?: Event;
  collector?: Member;
}

export interface Expense {
  id: string;
  club_id: string;
  event_id?: string;
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  receipt_url?: string;
  status: ExpenseStatus;
  submitted_by: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  event?: Event;
  submitter?: Member;
  approver?: Member;
}

export interface FundSummary {
  total_donations: number;
  total_expenses: number;
  pending_expenses: number;
  balance: number;
  donation_count: number;
  expense_count: number;
}

export interface AuditLog {
  id: string;
  club_id: string;
  member_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  created_at: string;
  member?: Member;
}
