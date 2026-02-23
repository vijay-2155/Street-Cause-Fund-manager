-- ============================================
-- Street Cause Fund Manager - Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'treasurer', 'coordinator');
CREATE TYPE payment_mode AS ENUM ('upi', 'cash', 'bank_transfer', 'cheque', 'other');
CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE expense_category AS ENUM ('food', 'supplies', 'transport', 'venue', 'printing', 'medical', 'donation_forward', 'other');
CREATE TYPE event_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');

-- ============================================
-- TABLES
-- ============================================

-- Club profile/settings
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'Street Cause',
    description TEXT,
    logo_url TEXT,
    upi_id TEXT,
    bank_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members (linked to Supabase Auth)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'coordinator',
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events / Campaigns
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status event_status DEFAULT 'upcoming',
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coordinator assignments to events
CREATE TABLE event_coordinators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, member_id)
);

-- Donations
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    donor_name TEXT NOT NULL,
    donor_email TEXT,
    donor_phone TEXT,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_mode payment_mode NOT NULL DEFAULT 'upi',
    transaction_id TEXT,
    screenshot_url TEXT,
    notes TEXT,
    collected_by UUID REFERENCES members(id),
    donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    category expense_category NOT NULL DEFAULT 'other',
    receipt_url TEXT,
    status expense_status DEFAULT 'pending',
    submitted_by UUID REFERENCES members(id),
    approved_by UUID REFERENCES members(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_donations_club ON donations(club_id);
CREATE INDEX idx_donations_event ON donations(event_id);
CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_donations_collected_by ON donations(collected_by);
CREATE INDEX idx_expenses_club ON expenses(club_id);
CREATE INDEX idx_expenses_event ON expenses(event_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_members_club ON members(club_id);
CREATE INDEX idx_members_auth ON members(auth_id);
CREATE INDEX idx_events_club ON events(club_id);
CREATE INDEX idx_audit_club ON audit_log(club_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: get current member's club_id
CREATE OR REPLACE FUNCTION get_my_club_id()
RETURNS UUID AS $$
    SELECT club_id FROM members WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current member's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
    SELECT role FROM members WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Clubs: members can view their club
CREATE POLICY "Members can view their club"
    ON clubs FOR SELECT
    USING (id = get_my_club_id());

CREATE POLICY "Admins can update their club"
    ON clubs FOR UPDATE
    USING (id = get_my_club_id() AND get_my_role() = 'admin');

-- Members: can view team, admins can manage
CREATE POLICY "Members can view team"
    ON members FOR SELECT
    USING (club_id = get_my_club_id());

CREATE POLICY "Admins can manage members"
    ON members FOR ALL
    USING (club_id = get_my_club_id() AND get_my_role() = 'admin');

-- Events: all members can view, coordinators+ can create
CREATE POLICY "Members can view events"
    ON events FOR SELECT
    USING (club_id = get_my_club_id());

CREATE POLICY "Coordinators can create events"
    ON events FOR INSERT
    WITH CHECK (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'treasurer', 'coordinator'));

CREATE POLICY "Coordinators can update events"
    ON events FOR UPDATE
    USING (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'treasurer', 'coordinator'));

-- Donations: all can view, coordinators+ can add
CREATE POLICY "Members can view donations"
    ON donations FOR SELECT
    USING (club_id = get_my_club_id());

CREATE POLICY "Coordinators can add donations"
    ON donations FOR INSERT
    WITH CHECK (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'treasurer', 'coordinator'));

CREATE POLICY "Admins can update donations"
    ON donations FOR UPDATE
    USING (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'treasurer'));

-- Expenses: all can view, coordinators+ can submit, admins/treasurer approve
CREATE POLICY "Members can view expenses"
    ON expenses FOR SELECT
    USING (club_id = get_my_club_id());

CREATE POLICY "Coordinators can submit expenses"
    ON expenses FOR INSERT
    WITH CHECK (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'treasurer', 'coordinator'));

CREATE POLICY "Approvers can update expenses"
    ON expenses FOR UPDATE
    USING (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'treasurer'));

-- Audit log: admins and treasurers can view
CREATE POLICY "Admins can view audit log"
    ON audit_log FOR SELECT
    USING (club_id = get_my_club_id() AND get_my_role() IN ('admin', 'treasurer'));

CREATE POLICY "System can insert audit log"
    ON audit_log FOR INSERT
    WITH CHECK (club_id = get_my_club_id());

-- Event coordinators
CREATE POLICY "Members can view event coordinators"
    ON event_coordinators FOR SELECT
    USING (event_id IN (SELECT id FROM events WHERE club_id = get_my_club_id()));

CREATE POLICY "Admins can manage event coordinators"
    ON event_coordinators FOR ALL
    USING (event_id IN (SELECT id FROM events WHERE club_id = get_my_club_id()) AND get_my_role() IN ('admin', 'treasurer'));

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run in Supabase Dashboard > Storage:
-- 1. Create bucket: "donation-screenshots" (public: false, max size: 5MB, allowed: image/*)
-- 2. Create bucket: "expense-receipts" (public: false, max size: 5MB, allowed: image/*)
-- 3. Create bucket: "club-assets" (public: true, max size: 2MB, allowed: image/*)

-- Storage policies
CREATE POLICY "Members can upload donation screenshots"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'donation-screenshots' AND auth.uid() IS NOT NULL);

CREATE POLICY "Members can view donation screenshots"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'donation-screenshots' AND auth.uid() IS NOT NULL);

CREATE POLICY "Members can upload expense receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'expense-receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Members can view expense receipts"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'expense-receipts' AND auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_clubs BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_members BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_events BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_donations BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_expenses BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Get fund summary for a club
CREATE OR REPLACE FUNCTION get_fund_summary(p_club_id UUID)
RETURNS TABLE (
    total_donations DECIMAL,
    total_expenses DECIMAL,
    pending_expenses DECIMAL,
    balance DECIMAL,
    donation_count BIGINT,
    expense_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(d.total, 0) AS total_donations,
        COALESCE(e.approved, 0) AS total_expenses,
        COALESCE(e.pending, 0) AS pending_expenses,
        COALESCE(d.total, 0) - COALESCE(e.approved, 0) AS balance,
        COALESCE(d.count, 0) AS donation_count,
        COALESCE(e.count, 0) AS expense_count
    FROM
        (SELECT SUM(amount) AS total, COUNT(*) AS count FROM donations WHERE club_id = p_club_id) d,
        (SELECT
            SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) AS approved,
            SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending,
            COUNT(*) AS count
         FROM expenses WHERE club_id = p_club_id) e;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
