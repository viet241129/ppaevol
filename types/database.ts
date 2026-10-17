/**
 * PPAEVOL - SCHEMA CONTRACT (KHÓA CỨNG CẤU TRÚC DỮ LIỆU)
 * Khớp 100% với Database Supabase hiện tại.
 * Không tự ý thay đổi tên trường gọi API.
 */

export type UserRole = 'boyfriend' | 'girlfriend'

// 1. PROFILES (Hồ sơ cá nhân & trạng thái cặp đôi)
export interface Profile {
  id: string
  role: UserRole
  display_name?: string | null
  mood?: string | null
  mood_emoji?: string | null
  status_message?: string | null
  lat?: number | null
  latitude?: number | null
  lng?: number | null
  longitude?: number | null
  is_pinged?: boolean | null
  pinged_by?: string | null
  updated_at?: string | null
  created_at?: string | null
}

// 2. COUPLE_WISHLISTS (Danh sách mong ước)
export interface CoupleWishlist {
  id: string
  user_id?: string | null
  item_name?: string | null
  title?: string | null
  price?: number | null
  price_estimate?: number | null
  estimated_price?: number | null
  link?: string | null
  link_url?: string | null
  url?: string | null
  owner_role?: UserRole | string | null
  is_bought: boolean
  created_at?: string
  updated_at?: string
}

// 3. COUPLE_TODOS (Việc cần làm chung)
export interface CoupleTodo {
  id: string
  user_id?: string | null
  title: string
  is_completed: boolean
  created_at?: string
  updated_at?: string
}

// 4. LOVE_FUND (Quỹ tình yêu)
export interface LoveFund {
  id: string
  user_id?: string | null
  balance?: number | null
  amount: number
  target_amount?: number | null
  reason?: string | null
  note?: string | null
  type: 'income' | 'expense' | string
  user_role?: UserRole | string | null
  created_at?: string
}

// 5. SPECIAL_DATES (Ngày kỷ niệm / Sự kiện quan trọng)
export interface SpecialDate {
  id: string
  user_id?: string | null
  title: string
  event_date: string
  created_at?: string
}

// 6. ACTIVITY_LOGS (Lịch sử hoạt động)
export interface ActivityLog {
  id: string
  user_id?: string | null
  user_role?: UserRole | string | null
  module?: string | null
  action?: string | null
  action_type?: string | null
  title?: string | null
  description?: string | null
  content?: string | null
  created_at?: string
}

// 7. LOCKET_PHOTOS (Khoảnh khắc Locket - Tuyệt đối không lưu Base64)
export interface LocketPhoto {
  id: string
  user_id?: string | null
  user_role?: UserRole | string | null
  photo_url: string
  caption?: string | null
  is_deleted: boolean
  created_at?: string
}

// 8. PUSH_SUBSCRIPTIONS (Web Push Notification)
export interface PushSubscriptionRecord {
  id: string
  user_id?: string | null
  subscription: any
  created_at?: string
}

// SUPABASE DATABASE TYPE CONTRACT
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; role: UserRole }
        Update: Partial<Profile>
      }
      couple_wishlists: {
        Row: CoupleWishlist
        Insert: Partial<CoupleWishlist> & { is_bought?: boolean }
        Update: Partial<CoupleWishlist>
      }
      couple_todos: {
        Row: CoupleTodo
        Insert: Partial<CoupleTodo> & { title: string }
        Update: Partial<CoupleTodo>
      }
      love_fund: {
        Row: LoveFund
        Insert: Partial<LoveFund> & { amount: number; type: string }
        Update: Partial<LoveFund>
      }
      special_dates: {
        Row: SpecialDate
        Insert: Partial<SpecialDate> & { title: string; event_date: string }
        Update: Partial<SpecialDate>
      }
      activity_logs: {
        Row: ActivityLog
        Insert: Partial<ActivityLog> & { module?: string }
        Update: Partial<ActivityLog>
      }
      locket_photos: {
        Row: LocketPhoto
        Insert: Partial<LocketPhoto> & { photo_url: string }
        Update: Partial<LocketPhoto>
      }
      push_subscriptions: {
        Row: PushSubscriptionRecord
        Insert: Partial<PushSubscriptionRecord> & { subscription: any }
        Update: Partial<PushSubscriptionRecord>
      }
    }
  }
}
