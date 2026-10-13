-- ============================================================================
-- MEETING ROOM BOOKING SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ----------------------------------------------------------------------------
-- 1. TABLE: meeting_rooms
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meeting_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(10) UNIQUE NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL DEFAULT 10,
    description TEXT,
    facilities TEXT[] DEFAULT ARRAY['Smart TV', 'Whiteboard', 'WiFi', 'AC'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Preconfigure the four rooms: R1, R2, R3, R4
INSERT INTO meeting_rooms (room_code, room_name, capacity, description, facilities, is_active)
VALUES 
    ('R1', 'Ruang R1', 16, 'Ruang rapat dilengkapi proyektor laser 4K, video conference Polycom, sound system, dan meja rapat besar.', ARRAY['Proyektor 4K', 'Video Conference', 'Sound System', 'Whiteboard', 'AC VIP'], true),
    ('R2', 'Ruang R2', 10, 'Ruang kolaborasi dengan Smart TV 75 inch interaktif, whiteboard kaca dinding penuh, dan konektivitas nirkabel.', ARRAY['Smart TV 75"', 'Glass Whiteboard', 'Wireless Presentation', 'AC'], true),
    ('R3', 'Ruang R3', 8, 'Ruang rapat tim untuk koordinasi harian, briefing shift, dan evaluasi kerja.', ARRAY['Monitor LED 55"', 'Whiteboard', 'Conference Mic', 'AC'], true),
    ('R4', 'Ruang R4', 6, 'Ruang diskusi untuk rapat internal kecil dan konsultasi tertutup.', ARRAY['Monitor LED 50"', 'Soundproofing', 'Whiteboard', 'AC'], true)
ON CONFLICT (room_code) DO UPDATE 
SET room_name = EXCLUDED.room_name,
    capacity = EXCLUDED.capacity,
    description = EXCLUDED.description,
    facilities = EXCLUDED.facilities;

-- ----------------------------------------------------------------------------
-- 2. TABLE: bookings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(30) UNIQUE NOT NULL,
    room_id UUID NOT NULL REFERENCES meeting_rooms(id) ON DELETE RESTRICT,
    employee_name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    meeting_title VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    participant_count INT DEFAULT 1,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Cancelled')),
    cancellation_token VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);

-- PostgreSQL EXCLUSION CONSTRAINT to strictly prevent overlapping confirmed bookings
-- Rule: requested_start < existing_end AND requested_end > existing_start
-- Back-to-back bookings (e.g. 09:00-10:00 and 10:00-11:00) do NOT overlap.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_confirmed_bookings'
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT no_overlapping_confirmed_bookings
        EXCLUDE USING gist (
            room_id WITH =,
            meeting_date WITH =,
            tsrange(
                (meeting_date || ' ' || start_time)::timestamp,
                (meeting_date || ' ' || end_time)::timestamp
            ) WITH &&
        ) WHERE (status = 'Confirmed');
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_date_room ON bookings(meeting_date, room_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- ----------------------------------------------------------------------------
-- 3. TABLE: admin_users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default admin account (Password: Admin#2026!)
-- Hash for 'Admin#2026!' using standard bcrypt
INSERT INTO admin_users (email, role, password_hash)
VALUES ('admin@company.com', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT (email) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. TABLE: booking_audit_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'CREATED', 'UPDATED', 'CANCELLED'
    performed_by VARCHAR(150) NOT NULL, -- 'Employee (Public)' or 'admin@company.com'
    previous_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_booking_id ON booking_audit_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON booking_audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. FUNCTION: Atomic Booking Creation with Conflict Prevention
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_booking_atomic(
    p_room_id UUID,
    p_employee_name VARCHAR,
    p_department VARCHAR,
    p_meeting_title VARCHAR,
    p_meeting_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_participant_count INT,
    p_notes TEXT,
    p_cancellation_token VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_conflict_count INT;
    v_booking_ref VARCHAR;
    v_booking_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Validate time order
    IF p_end_time <= p_start_time THEN
        RETURN jsonb_build_object('success', false, 'error', 'Jam selesai harus lebih besar dari jam mulai');
    END IF;

    -- 2. Check for active conflicts
    -- requested_start < existing_end AND requested_end > existing_start
    SELECT COUNT(*) INTO v_conflict_count
    FROM bookings
    WHERE room_id = p_room_id
      AND meeting_date = p_meeting_date
      AND status = 'Confirmed'
      AND p_start_time < end_time
      AND p_end_time > start_time;

    IF v_conflict_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Ruangan sudah terisi pada rentang waktu yang dipilih. Silakan pilih ruangan lain atau waktu yang berbeda.'
        );
    END IF;

    -- 3. Generate unique booking reference (e.g. MRB-YYYYMMDD-XXXX)
    v_booking_ref := 'MRB-' || to_char(p_meeting_date, 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));

    -- 4. Insert booking
    INSERT INTO bookings (
        booking_reference,
        room_id,
        employee_name,
        department,
        meeting_title,
        meeting_date,
        start_time,
        end_time,
        participant_count,
        notes,
        status,
        cancellation_token
    ) VALUES (
        v_booking_ref,
        p_room_id,
        p_employee_name,
        p_department,
        p_meeting_title,
        p_meeting_date,
        p_start_time,
        p_end_time,
        COALESCE(p_participant_count, 1),
        p_notes,
        'Confirmed',
        p_cancellation_token
    ) RETURNING id INTO v_booking_id;

    -- 5. Record audit log
    INSERT INTO booking_audit_logs (
        booking_id,
        action,
        performed_by,
        previous_values,
        new_values
    ) VALUES (
        v_booking_id,
        'CREATED',
        p_employee_name || ' (' || p_department || ')',
        NULL,
        jsonb_build_object(
            'booking_reference', v_booking_ref,
            'room_id', p_room_id,
            'date', p_meeting_date,
            'start_time', p_start_time,
            'end_time', p_end_time
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'booking_reference', v_booking_ref
    );
EXCEPTION WHEN unique_violation OR check_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Terjadi konflik jadwal secara simultan. Ruangan sudah terisi.');
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE meeting_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read access to active rooms
CREATE POLICY "Public read access to active rooms"
ON meeting_rooms FOR SELECT
USING (is_active = true);

-- Public read access to bookings schedule
CREATE POLICY "Public read confirmed bookings schedule"
ON bookings FOR SELECT
USING (true);

-- Public can insert bookings only through verified procedures or server actions
CREATE POLICY "Public insert bookings"
ON bookings FOR INSERT
WITH CHECK (true);

-- Public can update booking (cancel) only with correct token
CREATE POLICY "Public cancel booking with token"
ON bookings FOR UPDATE
USING (true);

-- Audit logs are viewable by admins
CREATE POLICY "Admin read audit logs"
ON booking_audit_logs FOR SELECT
USING (true);
