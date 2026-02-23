-- ============================================
-- SEED DATA - Street Cause Fund Manager
-- ============================================
-- Instructions:
-- 1. Replace all placeholder values marked with ⚠️
-- 2. Run this in Supabase SQL Editor AFTER running COMPLETE_SETUP.sql
-- Link: https://supabase.com/dashboard/project/_/sql/new

-- ============================================
-- 1. CREATE ADMIN MEMBER FROM AUTH USER
-- ============================================
-- ⚠️ Replace with your actual Google email
INSERT INTO members (auth_id, club_id, full_name, email, role, avatar_url)
SELECT
    u.id,
    c.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
    u.email,
    'admin'::user_role,
    COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
FROM auth.users u
CROSS JOIN clubs c
WHERE u.email = 'YOUR_GOOGLE_EMAIL@gmail.com'   -- ⚠️ REPLACE THIS
AND c.name = 'Street Cause'
ON CONFLICT (auth_id) DO NOTHING;

-- ============================================
-- 2. INVITE OTHER MEMBERS
-- ============================================
-- ⚠️ Replace emails and roles as needed
-- Roles: admin, treasurer, coordinator, volunteer, viewer

INSERT INTO member_invites (email, role, invited_by)
VALUES
    ('treasurer@example.com', 'treasurer', NULL),    -- ⚠️ REPLACE
    ('coordinator@example.com', 'coordinator', NULL), -- ⚠️ REPLACE
    ('volunteer1@example.com', 'volunteer', NULL)     -- ⚠️ REPLACE
ON CONFLICT (email) DO UPDATE SET
    expires_at = NOW() + INTERVAL '7 days',
    accepted_at = NULL;

-- ============================================
-- 3. SAMPLE EVENTS
-- ============================================
-- ⚠️ These use the first admin member as creator

INSERT INTO events (club_id, name, description, target_amount, start_date, end_date, status, created_by)
SELECT
    c.id,
    e.name,
    e.description,
    e.target_amount,
    e.start_date::DATE,
    e.end_date::DATE,
    e.status::event_status,
    m.id
FROM clubs c
CROSS JOIN members m
CROSS JOIN (VALUES
    ('Blood Donation Camp',      'Annual blood donation drive',           5000.00,  '2026-03-01', '2026-03-01', 'upcoming'),
    ('Tree Plantation Drive',    'Plant 500 trees in the city',          15000.00, '2026-03-15', '2026-03-16', 'upcoming'),
    ('Street Children Education','Teaching underprivileged kids',         25000.00, '2026-02-01', '2026-04-30', 'active'),
    ('Food Distribution',        'Weekly food distribution to homeless', 10000.00, '2026-01-01', '2026-01-31', 'completed')
) AS e(name, description, target_amount, start_date, end_date, status)
WHERE c.name = 'Street Cause'
AND m.role = 'admin'
LIMIT 4;

-- ============================================
-- 4. SAMPLE DONATIONS
-- ============================================

INSERT INTO donations (club_id, event_id, donor_name, donor_email, donor_phone, amount, payment_mode, notes, collected_by, donation_date)
SELECT
    c.id,
    ev.id,
    d.donor_name,
    d.donor_email,
    d.donor_phone,
    d.amount,
    d.payment_mode::payment_mode,
    d.notes,
    m.id,
    d.donation_date::DATE
FROM clubs c
CROSS JOIN members m
CROSS JOIN (
    SELECT id, name FROM events ORDER BY created_at LIMIT 1
) ev
CROSS JOIN (VALUES
    ('Rahul Sharma',   'rahul@example.com',   '9876543210', 2000.00, 'upi',           'Monthly contribution',  '2026-02-01'),
    ('Priya Patel',    'priya@example.com',   '9876543211', 5000.00, 'bank_transfer', 'For education program',  '2026-02-05'),
    ('Amit Kumar',     'amit@example.com',    '9876543212', 1000.00, 'cash',          'Walk-in donation',       '2026-02-10'),
    ('Sneha Reddy',    'sneha@example.com',   '9876543213', 3000.00, 'upi',           'Event sponsorship',      '2026-02-12'),
    ('Vikram Singh',   'vikram@example.com',  '9876543214', 10000.00,'cheque',        'Corporate donation',     '2026-02-15')
) AS d(donor_name, donor_email, donor_phone, amount, payment_mode, notes, donation_date)
WHERE c.name = 'Street Cause'
AND m.role = 'admin';

-- ============================================
-- 5. SAMPLE EXPENSES
-- ============================================

INSERT INTO expenses (club_id, event_id, title, description, amount, category, status, submitted_by, expense_date)
SELECT
    c.id,
    ev.id,
    e.title,
    e.description,
    e.amount,
    e.category::expense_category,
    e.status::expense_status,
    m.id,
    e.expense_date::DATE
FROM clubs c
CROSS JOIN members m
CROSS JOIN (
    SELECT id, name FROM events ORDER BY created_at LIMIT 1
) ev
CROSS JOIN (VALUES
    ('Banners & Posters',   'Printing for event promotion',      1500.00, 'printing',   'approved',  '2026-02-02'),
    ('Refreshments',        'Food & water for volunteers',       3000.00, 'food',        'approved',  '2026-02-03'),
    ('Transport',           'Bus rental for site visit',         2500.00, 'transport',   'pending',   '2026-02-08'),
    ('Medical Supplies',    'First aid kits and medicines',      4000.00, 'medical',     'approved',  '2026-02-10'),
    ('Venue Booking',       'Community hall for 2 days',         5000.00, 'venue',       'pending',   '2026-02-14')
) AS e(title, description, amount, category, status, expense_date)
WHERE c.name = 'Street Cause'
AND m.role = 'admin';

-- ============================================
-- VERIFY SEED DATA
-- ============================================

SELECT 'Members' AS table_name, COUNT(*) AS count FROM members
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Donations', COUNT(*) FROM donations
UNION ALL
SELECT 'Expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'Invites', COUNT(*) FROM member_invites;
