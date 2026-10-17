/**
 * TIỆN ÍCH NÉN ẢNH CLIENT-SIDE & CHỐNG TRÀN BĂNG THÔNG
 * - Resize chiều dài nhất về tối đa 1080px.
 * - Định dạng image/jpeg hoặc image/webp với quality: 0.7.
 * - Kiểm tra dung lượng đầu ra: nếu > 200KB thì nén tiếp về quality: 0.5.
 * - Tuyệt đối không lưu Base64 Data URL vào Database.
 */

export interface CompressionOptions {
  maxDimension?: number
  initialQuality?: number
  fallbackQuality?: number
  maxSizeBytes?: number
  format?: 'image/jpeg' | 'image/webp'
}

export interface CompressionResult {
  blob: Blob
  width: number
  height: number
  sizeBytes: number
  format: 'image/jpeg' | 'image/webp'
}

/**
 * Tải ảnh vào đối tượng HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(new Error('Không thể tải dữ liệu ảnh vào Canvas: ' + err))
    img.src = src
  })
}

/**
 * Xuất Canvas ra Blob với định dạng và chất lượng chỉ định
 */
function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas xuất ra Blob thất bại.'))
      },
      format,
      quality
    )
  })
}

/**
 * Hàm nén ảnh chính
 * @param source URL chuỗi (Base64/Blob URL) hoặc đối tượng File/Blob
 * @param options Tùy chọn nén
 */
export async function compressImage(
  source: string | File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const maxDim = options.maxDimension ?? 1080
  const initialQuality = options.initialQuality ?? 0.7
  const fallbackQuality = options.fallbackQuality ?? 0.5
  const maxSizeBytes = options.maxSizeBytes ?? 200 * 1024 // 200 KB
  const format = options.format ?? 'image/jpeg'

  let srcUrl = ''
  let needRevoke = false

  if (typeof source === 'string') {
    srcUrl = source
  } else if (source && typeof source === 'object' && 'slice' in source) {
    srcUrl = URL.createObjectURL(source as Blob)
    needRevoke = true
  } else {
    throw new Error('Nguồn ảnh đầu vào không hợp lệ.')
  }

  try {
    const img = await loadImage(srcUrl)

    // 1. Tính toán kích thước mới (chiều dài nhất tối đa 1080px)
    let width = img.naturalWidth || img.width
    let height = img.naturalHeight || img.height

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width)
        width = maxDim
      } else {
        width = Math.round((width * maxDim) / height)
        height = maxDim
      }
    }

    // 2. Vẽ lên Canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Không thể tạo 2D context cho Canvas.')
    }

    // Khử mờ trên màn hình retina / vẽ mượt
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, width, height)

    // 3. Nén lần 1: quality: 0.7
    let blob = await canvasToBlob(canvas, format, initialQuality)

    // 4. Kiểm tra dung lượng đầu ra: nếu > 200KB thì nén tiếp về quality: 0.5
    if (blob.size > maxSizeBytes) {
      console.log(`[ImageCompressor] Ảnh nén lần 1 là ${(blob.size / 1024).toFixed(1)}KB (> 200KB). Nén tiếp về quality: ${fallbackQuality}...`)
      blob = await canvasToBlob(canvas, format, fallbackQuality)
    }

    // Nếu vẫn > 200KB (đối với ảnh quá nhiều chi tiết), nén thêm một nấc an toàn 0.4
    if (blob.size > maxSizeBytes) {
      console.log(`[ImageCompressor] Dung lượng vẫn ${(blob.size / 1024).toFixed(1)}KB. Tối ưu thêm về quality: 0.4...`)
      blob = await canvasToBlob(canvas, format, 0.4)
    }

    return {
      blob,
      width,
      height,
      sizeBytes: blob.size,
      format
    }
  } finally {
    if (needRevoke && srcUrl) {
      URL.revokeObjectURL(srcUrl)
    }
  }
}

/**
 * BỘ LỌC KIỂM TRA (VALIDATOR):
 * Tuyệt đối không cho phép chuỗi Base64 ("data:image...") lọt vào database.
 * Chỉ cho phép Public URL từ Storage (http:// hoặc https://).
 */
export function validateStoragePhotoUrl(url: unknown): asserts url is string {
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('Đường dẫn ảnh rỗng hoặc không hợp lệ.')
  }

  const trimmed = url.trim()

  // Chặn đứng hoàn toàn Base64 Data URL
  if (trimmed.startsWith('data:image') || trimmed.includes(';base64,')) {
    throw new Error('CHẶN BẢO VỆ: Phát hiện chuỗi Base64 (data:image). Tuyệt đối không lưu Base64 vào Database để chống tràn băng thông vĩnh viễn!')
  }

  // Phải là URL http/https hợp lệ từ Storage
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    throw new Error('CHẶN BẢO VỆ: Đường dẫn ảnh phải là HTTP/HTTPS Public URL từ Supabase Storage.')
  }

  // Độ dài URL thông thường < 500 ký tự (Base64 thường > 50,000 ký tự)
  if (trimmed.length > 1000) {
    throw new Error('CHẶN BẢO VỆ: Độ dài URL vượt quá giới hạn cho phép (nghi ngờ Base64).')
  }
}
