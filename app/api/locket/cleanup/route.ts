import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Thiếu cấu hình Supabase Key' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Tính mốc 30 ngày trước
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // 1. Tìm các ảnh locket cũ hơn 30 ngày
    const { data: oldPhotos, error: fetchErr } = await supabase
      .from('locket_photos')
      .select('id, photo_url')
      .lt('created_at', thirtyDaysAgo)

    if (fetchErr) {
      console.error('Lỗi tìm ảnh cũ:', fetchErr)
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 })
    }

    if (!oldPhotos || oldPhotos.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'Không có ảnh nào cũ hơn 30 ngày cần dọn dẹp' })
    }

    // 2. Tìm các file vật lý trên Supabase Storage bucket 'locket'
    const filePathsToRemove: string[] = []
    oldPhotos.forEach(p => {
      if (p.photo_url && p.photo_url.includes('/locket/')) {
        const parts = p.photo_url.split('/locket/')
        if (parts.length > 1) {
          const rawName = parts[1].split('?')[0]
          if (rawName) filePathsToRemove.push(decodeURIComponent(rawName))
        }
      }
    })

    if (filePathsToRemove.length > 0) {
      try {
        await supabase.storage.from('locket').remove(filePathsToRemove)
      } catch (storageErr) {
        console.error('Lỗi xóa file storage:', storageErr)
      }
    }

    // 3. Xóa các bản ghi cũ khỏi bảng locket_photos
    const oldIds = oldPhotos.map(p => p.id)
    const { error: deleteErr } = await supabase
      .from('locket_photos')
      .delete()
      .in('id', oldIds)

    if (deleteErr) {
      return NextResponse.json({ success: false, error: deleteErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deletedCount: oldPhotos.length,
      filesRemoved: filePathsToRemove.length,
      message: `Đã dọn dẹp ${oldPhotos.length} ảnh cũ hơn 30 ngày`
    })
  } catch (err: any) {
    console.error('Lỗi API locket cleanup:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
