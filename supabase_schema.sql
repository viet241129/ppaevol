-- ==============================================================================
-- PPAEVOL - SUPABASE DATABASE MIGRATION SCRIPT HOÀN CHỈNH (CHẠY 1 LẦN TRÊN SQL EDITOR)
-- Bao gồm: Toàn bộ bảng, cột, RLS Policies, Realtime publication, Bucket Storage
-- ==============================================================================

-- 1. BẬT CÁC EXTENSION CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TẠO CÁC BẢNG & BỔ SUNG CỘT (ĐẢM BẢO KHÔNG BỊ LỖI THIẾU CỘT KHI ĐÃ CÓ BẢNG CŨ)
-- ==============================================================================

-- 2.1 BẢNG PROFILES (Tâm trạng, vị trí, vai trò)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('boyfriend', 'girlfriend')),
  mood text DEFAULT '😊',
  status_message text DEFAULT 'Bình thường',
  latitude double precision,
  longitude double precision,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Bổ sung cột nếu bảng profiles đã tồn tại nhưng thiếu cột
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('boyfriend', 'girlfriend'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mood text DEFAULT '😊';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_message text DEFAULT 'Bình thường';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2.2 BẢNG COUPLE_WISHLISTS (Danh sách điều ước)
CREATE TABLE IF NOT EXISTS public.couple_wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  price_estimate numeric,
  link_url text,
  is_bought boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bổ sung cột nếu thiếu (đặc biệt item_name, price_estimate, link_url)
ALTER TABLE public.couple_wishlists ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.couple_wishlists ADD COLUMN IF NOT EXISTS item_name text;
ALTER TABLE public.couple_wishlists ADD COLUMN IF NOT EXISTS price_estimate numeric;
ALTER TABLE public.couple_wishlists ADD COLUMN IF NOT EXISTS link_url text;
ALTER TABLE public.couple_wishlists ADD COLUMN IF NOT EXISTS is_bought boolean DEFAULT false;
ALTER TABLE public.couple_wishlists ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.couple_wishlists ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2.3 BẢNG COUPLE_TODOS (Việc cần làm chung)
CREATE TABLE IF NOT EXISTS public.couple_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.couple_todos ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.couple_todos ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.couple_todos ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false;
ALTER TABLE public.couple_todos ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.couple_todos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2.4 BẢNG LOVE_FUND (Quỹ tình yêu - Thu / Chi)
CREATE TABLE IF NOT EXISTS public.love_fund (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  reason text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.love_fund ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.love_fund ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 0;
ALTER TABLE public.love_fund ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE public.love_fund ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('income', 'expense'));
ALTER TABLE public.love_fund ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2.5 BẢNG SPECIAL_DATES (Ngày kỷ niệm / Ngày quan trọng)
CREATE TABLE IF NOT EXISTS public.special_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  event_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.special_dates ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.special_dates ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.special_dates ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE public.special_dates ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2.6 BẢNG LOCKET_PHOTOS (Khoảnh khắc Locket - có hỗ trợ Soft Delete)
CREATE TABLE IF NOT EXISTS public.locket_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role text CHECK (user_role IN ('boyfriend', 'girlfriend')),
  photo_url text NOT NULL,
  caption text DEFAULT '',
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.locket_photos ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.locket_photos ADD COLUMN IF NOT EXISTS user_role text CHECK (user_role IN ('boyfriend', 'girlfriend'));
ALTER TABLE public.locket_photos ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.locket_photos ADD COLUMN IF NOT EXISTS caption text DEFAULT '';
ALTER TABLE public.locket_photos ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE public.locket_photos ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2.7 BẢNG ACTIVITY_LOGS (Nhật ký lịch sử hoạt động các module)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role text,
  module text NOT NULL,
  action_type text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS user_role text;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS module text;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS action_type text;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2.8 BẢNG PUSH_SUBSCRIPTIONS (Web Push Notification)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS subscription jsonb;
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ==============================================================================
-- 3. CẤU HÌNH ROW LEVEL SECURITY (RLS) VÀ CHÍNH SÁCH BẢO MẬT (POLICIES)
-- ==============================================================================

-- Bật RLS cho tất cả bảng
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.love_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locket_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3.1 Policy cho profiles (Cặp đôi xem và sửa được thông tin)
DROP POLICY IF EXISTS "Allow authenticated full access to profiles" ON public.profiles;
CREATE POLICY "Allow authenticated full access to profiles"
ON public.profiles FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 3.2 Policy cho couple_wishlists
DROP POLICY IF EXISTS "Allow authenticated full access to couple_wishlists" ON public.couple_wishlists;
CREATE POLICY "Allow authenticated full access to couple_wishlists"
ON public.couple_wishlists FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 3.3 Policy cho couple_todos
DROP POLICY IF EXISTS "Allow authenticated full access to couple_todos" ON public.couple_todos;
CREATE POLICY "Allow authenticated full access to couple_todos"
ON public.couple_todos FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 3.4 Policy cho love_fund
DROP POLICY IF EXISTS "Allow authenticated full access to love_fund" ON public.love_fund;
CREATE POLICY "Allow authenticated full access to love_fund"
ON public.love_fund FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 3.5 Policy cho special_dates
DROP POLICY IF EXISTS "Allow authenticated full access to special_dates" ON public.special_dates;
CREATE POLICY "Allow authenticated full access to special_dates"
ON public.special_dates FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 3.6 Policy cho locket_photos
DROP POLICY IF EXISTS "Allow authenticated full access to locket_photos" ON public.locket_photos;
CREATE POLICY "Allow authenticated full access to locket_photos"
ON public.locket_photos FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 3.7 Policy cho activity_logs
DROP POLICY IF EXISTS "Allow authenticated full access to activity_logs" ON public.activity_logs;
CREATE POLICY "Allow authenticated full access to activity_logs"
ON public.activity_logs FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 3.8 Policy cho push_subscriptions (Cho phép cả authenticated và anon đọc/xóa phục vụ serverless API route push)
DROP POLICY IF EXISTS "Allow full access to push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow full access to push_subscriptions"
ON public.push_subscriptions FOR ALL
USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. KÍCH HOẠT SUPABASE REALTIME CHO TẤT CẢ CÁC BẢNG
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'profiles',
      'couple_wishlists',
      'couple_todos',
      'love_fund',
      'special_dates',
      'locket_photos',
      'activity_logs',
      'push_subscriptions'
    ])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    END IF;
  END LOOP;
END $$;

-- Bật replica identity full để realtime đồng bộ chính xác khi update/delete
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.couple_wishlists REPLICA IDENTITY FULL;
ALTER TABLE public.couple_todos REPLICA IDENTITY FULL;
ALTER TABLE public.love_fund REPLICA IDENTITY FULL;
ALTER TABLE public.special_dates REPLICA IDENTITY FULL;
ALTER TABLE public.locket_photos REPLICA IDENTITY FULL;
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;
ALTER TABLE public.push_subscriptions REPLICA IDENTITY FULL;

-- ==============================================================================
-- 5. TẠO BUCKET STORAGE 'locket' VÀ CẤP QUYỀN TRUY CẬP (STORAGE POLICIES)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'locket',
  'locket',
  true,
  10485760, -- Tối đa 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Policy xem ảnh public cho mọi người
DROP POLICY IF EXISTS "Public view locket photos" ON storage.objects;
CREATE POLICY "Public view locket photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'locket');

-- Policy tải ảnh lên cho authenticated users
DROP POLICY IF EXISTS "Authenticated upload locket photos" ON storage.objects;
CREATE POLICY "Authenticated upload locket photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'locket');

-- Policy cập nhật ảnh cho authenticated users
DROP POLICY IF EXISTS "Authenticated update locket photos" ON storage.objects;
CREATE POLICY "Authenticated update locket photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'locket');

-- Policy xóa ảnh cho authenticated users
DROP POLICY IF EXISTS "Authenticated delete locket photos" ON storage.objects;
CREATE POLICY "Authenticated delete locket photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'locket');

-- ==============================================================================
-- 6. TỰ ĐỘNG ĐỒNG BỘ TÀI KHOẢN TỪ AUTH.USERS SANG PROFILES (NẾU ĐÃ TẠO TÀI KHOẢN)
-- ==============================================================================

-- Trigger tự tạo profile khi có user mới đăng ký trong tương lai
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, mood, status_message)
  VALUES (
    NEW.id,
    CASE 
      WHEN (SELECT count(*) FROM public.profiles) = 0 THEN 'boyfriend'
      ELSE 'girlfriend'
    END,
    '😊',
    'Bình thường'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tự động sync tài khoản auth.users đã tạo vào profiles (tài khoản đầu tiên là boyfriend, thứ hai là girlfriend)
DO $$
DECLARE
  u RECORD;
  idx INT := 0;
BEGIN
  FOR u IN SELECT id FROM auth.users ORDER BY created_at ASC LOOP
    INSERT INTO public.profiles (id, role, mood, status_message)
    VALUES (
      u.id,
      CASE WHEN idx = 0 THEN 'boyfriend' ELSE 'girlfriend' END,
      '😊',
      'Bình thường'
    )
    ON CONFLICT (id) DO NOTHING;
    idx := idx + 1;
  END LOOP;
END $$;
