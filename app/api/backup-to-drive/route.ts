import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { photoUrl, role, caption } = body

    if (!photoUrl) {
      return NextResponse.json({ success: false, error: 'Thiếu photoUrl' }, { status: 400 })
    }

    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || ''
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1NoSjwZNdoh0YGID60I5KtpfUDg41N3Mk'

    if (!clientEmail || !privateKey) {
      console.warn('[BackupToDrive] Chưa cấu hình GOOGLE_SERVICE_ACCOUNT_EMAIL hoặc GOOGLE_PRIVATE_KEY trên biến môi trường.')
      return NextResponse.json({
        success: false,
        warning: 'Google Drive credentials chưa được cấu hình trên biến môi trường. Ảnh đã được lưu an toàn trên Supabase Storage.'
      }, { status: 200 })
    }

    // Xử lý private key (chuỗi newline \n và dấu ngoặc kép thừa)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1)
    }
    privateKey = privateKey.replace(/\\n/g, '\n')

    // 1. Tải dữ liệu ảnh từ Supabase Storage URL
    const imgRes = await fetch(photoUrl)
    if (!imgRes.ok) {
      throw new Error(`Không thể tải ảnh từ Supabase Storage URL: ${imgRes.statusText}`)
    }
    const arrayBuffer = await imgRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 2. Định dạng tên file: [YYYY-MM-DD]-[role]-[timestamp].jpg
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    const timestamp = Date.now()
    const userRole = role === 'girlfriend' ? 'girlfriend' : 'boyfriend'
    const fileName = `${dateStr}-${userRole}-${timestamp}.jpg`

    // 3. Khởi tạo xác thực Google Drive API với Service Account
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ]
    })

    const drive = google.drive({ version: 'v3', auth })

    // 4. Đẩy bản sao vào thư mục Google Drive "Stuff"
    const fileMetadata: any = {
      name: fileName,
      parents: [folderId],
      description: caption ? `Locket Khoảnh khắc (${userRole}): "${caption}"` : `Locket Khoảnh khắc (${userRole})`
    }

    const media = {
      mimeType: 'image/jpeg',
      body: Readable.from(buffer)
    }

    const driveRes = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    })

    console.log(`[BackupToDrive] Đã đồng bộ ảnh thành công sang Google Drive: ${fileName} (ID: ${driveRes.data.id})`)

    return NextResponse.json({
      success: true,
      fileId: driveRes.data.id,
      fileName: driveRes.data.name,
      webViewLink: driveRes.data.webViewLink,
      message: `Đã sao lưu ảnh thành công vào thư mục Google Drive 'Stuff' (${fileName})`
    })
  } catch (err: any) {
    console.error('[BackupToDrive] Lỗi đồng bộ sang Google Drive:', err)
    return NextResponse.json({
      success: false,
      error: err?.message || 'Lỗi không xác định khi backup Google Drive'
    }, { status: 500 })
  }
}
