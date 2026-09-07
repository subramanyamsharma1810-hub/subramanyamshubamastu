-- ==============================================================================
-- SHUBHAMASTU.IN (OPERATED BY GLARK SOLUTIONS)
-- Matrimonial Platform Database Schema (PostgreSQL / Supabase)
-- Module: Referral Engine, Conditional Coupon System & Defense ID Verification
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('candidate', 'employee', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type_enum AS ENUM ('PERCENTAGE', 'FLAT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE defense_verification_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE referral_status_enum AS ENUM ('REGISTERED', 'QUALIFIED_PAID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT ('usr_' || substr(md5(random()::text), 1, 16)),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT,
    referral_code VARCHAR(32) NOT NULL UNIQUE,
    referred_by VARCHAR(32), -- Foreign key to users.referral_code
    is_defense_verified BOOLEAN DEFAULT FALSE NOT NULL,
    role user_role_enum DEFAULT 'candidate' NOT NULL,
    status VARCHAR(50) DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_no_self_referral CHECK (referral_code <> referred_by)
);

-- 4. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY DEFAULT ('cpn_' || substr(md5(random()::text), 1, 16)),
    code VARCHAR(64) NOT NULL UNIQUE,
    discount_type discount_type_enum NOT NULL,
    discount_val NUMERIC(10, 2) NOT NULL CHECK (discount_val > 0),
    requires_id_upload BOOLEAN DEFAULT FALSE NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    min_order_value NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    max_uses INTEGER DEFAULT 1000 NOT NULL,
    current_uses INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_valid_date_range CHECK (valid_until >= valid_from),
    CONSTRAINT check_uses_limit CHECK (current_uses <= max_uses)
);

-- 5. DEFENSE VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS defense_verifications (
    id TEXT PRIMARY KEY DEFAULT ('def_' || substr(md5(random()::text), 1, 16)),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coupon_id TEXT REFERENCES coupons(id) ON DELETE SET NULL,
    id_card_image_url TEXT NOT NULL,
    verification_status defense_verification_status_enum DEFAULT 'PENDING' NOT NULL,
    admin_notes TEXT,
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. REFERRALS TABLE ("Rule of 6" Milestone Engine)
CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY DEFAULT ('ref_' || substr(md5(random()::text), 1, 16)),
    referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE, -- One referee can only be referred once
    status referral_status_enum DEFAULT 'REGISTERED' NOT NULL,
    order_id VARCHAR(128),
    qualified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_referrer_referee_diff CHECK (referrer_id <> referee_id)
);

-- 7. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(md5(random()::text), 1, 16)),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_paid NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2) DEFAULT 1500.00 NOT NULL,
    coupon_applied VARCHAR(64),
    is_milestone_rate BOOLEAN DEFAULT FALSE NOT NULL,
    status subscription_status_enum DEFAULT 'ACTIVE' NOT NULL,
    payment_id VARCHAR(128),
    gateway_provider VARCHAR(50) DEFAULT 'CASHFREE',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days') NOT NULL
);

-- 8. INDEXES FOR HIGH-THROUGHPUT QUERIES
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_active_validity ON coupons(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_defense_verifications_status ON defense_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_defense_verifications_user ON defense_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status ON referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);

-- 9. HELPER FUNCTIONS & TRIGGERS

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_defense_verifications_updated_at
    BEFORE UPDATE ON defense_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Compute whether a user has unlocked the 6-referral ₹800 milestone
CREATE OR REPLACE FUNCTION check_user_milestone_eligibility(p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_qualified_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_qualified_count
    FROM referrals
    WHERE referrer_id = p_user_id
      AND status = 'QUALIFIED_PAID';

    RETURN (v_qualified_count >= 6);
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE defense_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users RLS
CREATE POLICY "Public read user referral codes" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id);

-- Coupons RLS (Everyone can read active coupons; only admins can modify)
CREATE POLICY "Anyone can view active coupons" ON coupons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins full access to coupons" ON coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
              AND users.role IN ('admin', 'super_admin')
        )
    );

-- Defense Verifications RLS
CREATE POLICY "Users view own defense submissions" ON defense_verifications
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users insert own defense submissions" ON defense_verifications
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Admins full access to defense verifications" ON defense_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
              AND users.role IN ('admin', 'super_admin')
        )
    );

-- Referrals RLS
CREATE POLICY "Referrers view their referrals" ON referrals
    FOR SELECT USING (referrer_id = auth.uid()::text OR referee_id = auth.uid()::text);

CREATE POLICY "Admins full access to referrals" ON referrals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
              AND users.role IN ('admin', 'super_admin')
        )
    );

-- Subscriptions RLS
CREATE POLICY "Users view their subscriptions" ON subscriptions
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Admins full access to subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
              AND users.role IN ('admin', 'super_admin')
        )
    );

-- 11. INITIAL SEED DATA (CORE BUSINESS RULES)
-- AGNIVEERFLAT50: 50% Flat Discount for Armed Forces / Agniveer / Military Personnel
INSERT INTO coupons (
    code,
    discount_type,
    discount_val,
    requires_id_upload,
    valid_from,
    valid_until,
    min_order_value,
    max_uses,
    current_uses,
    is_active,
    description
) VALUES (
    'AGNIVEERFLAT50',
    'PERCENTAGE',
    50.00,
    TRUE,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '365 days',
    1500.00,
    5000,
    0,
    TRUE,
    'Special 50% flat discount honoring Indian Armed Forces, Agniveer recruits, and Military defense personnel. Official Armed Forces ID required for verification.'
) ON CONFLICT (code) DO NOTHING;

-- FESTIVE10: General welcome coupon
INSERT INTO coupons (
    code,
    discount_type,
    discount_val,
    requires_id_upload,
    valid_from,
    valid_until,
    min_order_value,
    max_uses,
    current_uses,
    is_active,
    description
) VALUES (
    'SHUBH10',
    'PERCENTAGE',
    10.00,
    FALSE,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '180 days',
    1000.00,
    10000,
    14,
    TRUE,
    'Shubhamastu 10% welcome discount for new matrimonial registrations.'
) ON CONFLICT (code) DO NOTHING;

-- VEDA100: Flat ₹100 Off coupon
INSERT INTO coupons (
    code,
    discount_type,
    discount_val,
    requires_id_upload,
    valid_from,
    valid_until,
    min_order_value,
    max_uses,
    current_uses,
    is_active,
    description
) VALUES (
    'VEDA100',
    'FLAT',
    100.00,
    FALSE,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '90 days',
    1500.00,
    1000,
    8,
    TRUE,
    'Flat ₹100 discount on the complete first-month subscription package.'
) ON CONFLICT (code) DO NOTHING;
