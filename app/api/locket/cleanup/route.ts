import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  return handleCleanup()
}

export async function POST() {
  return handleCleanup()
}

async function handleCleanup() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Thiếu cấu hình Supabase Key' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. Tính mốc 7 ngày trước
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // 2. Tìm các ảnh locket cũ hơn 7 ngày
    const { data: oldPhotos, error: fetchErr } = await supabase
      .from('locket_photos')
      .select('id, photo_url')
      .lt('created_at', sevenDaysAgo)

    if (fetchErr) {
      console.error('Lỗi tìm ảnh cũ hơn 7 ngày:', fetchErr)
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 })
    }

    if (!oldPhotos || oldPhotos.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'Không có ảnh nào cũ hơn 7 ngày cần dọn dẹp' })
    }

    // 3. Dọn các file vật lý trên Supabase Storage bucket 'locket' để giải phóng dung lượng & egress
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
        console.error('Lỗi dọn file storage cũ:', storageErr)
      }
    }

    // 4. Xóa vĩnh viễn (Hard Delete) bản ghi khỏi bảng locket_photos
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
      message: `Đã dọn sạch file storage và xóa vĩnh viễn ${oldPhotos.length} ảnh cũ hơn 7 ngày khỏi hệ thống.`
    })
  } catch (err: any) {
    console.error('Lỗi API locket cleanup:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
