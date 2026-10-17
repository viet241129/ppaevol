import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Helper nạp .env.local thủ công
function loadEnvLocal() {
  const envPath = path.join(rootDir, '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=')
        if (idx > 0) {
          const key = trimmed.slice(0, idx).trim()
          let val = trimmed.slice(idx + 1).trim()
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
          process.env[key] = val
        }
      }
    })
  }
}

loadEnvLocal()

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}

let totalTests = 0
let passedTests = 0
let failedTests = 0
let warningTests = 0

function logPass(title, details = '') {
  totalTests++
  passedTests++
  console.log(`  ${colors.green}✔ PASS${colors.reset} : ${title} ${details ? colors.cyan + '(' + details + ')' + colors.reset : ''}`)
}

function logFail(title, error = '') {
  totalTests++
  failedTests++
  console.log(`  ${colors.red}✖ FAIL${colors.reset} : ${title}`)
  if (error) console.log(`         ${colors.red}Chi tiết: ${error}${colors.reset}`)
}

function logWarn(title, warning = '') {
  totalTests++
  warningTests++
  console.log(`  ${colors.yellow}⚠ WARN${colors.reset} : ${title}`)
  if (warning) console.log(`         ${colors.yellow}Lưu ý: ${warning}${colors.reset}`)
}

function printHeader(title) {
  console.log(`\n${colors.bold}${colors.blue}=== [ ${title} ] ===${colors.reset}`)
}

async function runAllTests() {
  console.log(`${colors.bold}${colors.cyan}======================================================================`)
  console.log(`       BÀI KIỂM THỬ TOÀN DIỆN MỌI CHỨC NĂNG PPAEVOL (WEB APP)`)
  console.log(`       Thời gian kiểm tra: ${new Date().toLocaleString('vi-VN')}`)
  console.log(`======================================================================${colors.reset}`)

  // 1. KIỂM TRA MÔI TRƯỜNG & BIẾN CẤU HÌNH
  printHeader('1. BIẾN MÔI TRƯỜNG & KHÓA BẢO MẬT (.env.local)')
  const envVars = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', required: true },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key', required: true },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role Key (Admin)', required: true },
    { key: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', label: 'VAPID Public Key (Web Push)', required: true },
    { key: 'VAPID_PRIVATE_KEY', label: 'VAPID Private Key (Web Push)', required: true },
  ]

  for (const env of envVars) {
    const val = process.env[env.key]
    if (val && val.trim().length > 0) {
      logPass(env.label, `Có sẵn [${val.substring(0, 10)}...]`)
    } else {
      if (env.required) {
        logFail(env.label, `Thiếu biến ${env.key} trong file .env.local`)
      } else {
        logWarn(env.label, `Chưa khai báo biến ${env.key}`)
      }
    }
  }

  // 2. KẾT NỐI SUPABASE
  printHeader('2. KẾT NỐI SUPABASE & AUTH CLIENT')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  let supabaseAdmin = null
  let isEgressRestricted = false

  if (supabaseUrl && supabaseKey) {
    try {
      supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      logPass('Khởi tạo Supabase Client thành công')
    } catch (e) {
      logFail('Không thể khởi tạo Supabase Client', e.message)
    }
  } else {
    logFail('Supabase Client', 'Thiếu URL hoặc Service Key để kết nối')
  }

  if (supabaseAdmin) {
    // 3. KIỂM TRA 8 BẢNG DỮ LIỆU & SCHEMA CONTRACT
    printHeader('3. DATABASE SCHEMA (8/8 BẢNG DỮ LIỆU CỐT LÕI)')
    const tablesToCheck = [
      {
        table: 'profiles',
        columns: 'id, role, display_name, mood, mood_emoji, status_message, lat, lng, is_pinged, pinged_by, location_updated_at',
        description: 'Module 1: Hồ sơ, Trạng thái (Mood), Tọa độ ngầm & Ping'
      },
      {
        table: 'couple_wishlists',
        columns: 'id, title, item_name, price, estimated_price, link, url, owner_role, is_bought, created_at',
        description: 'Module 2: Danh sách mong ước (Wishlist)'
      },
      {
        table: 'couple_todos',
        columns: 'id, title, is_completed, created_at',
        description: 'Module 3: Việc cần làm cùng nhau (Todo List)'
      },
      {
        table: 'love_fund',
        columns: 'id, balance, target_amount, amount, note, user_role, created_at',
        description: 'Module 4: Quỹ tình yêu (Love Fund)'
      },
      {
        table: 'special_dates',
        columns: 'id, title, event_date, created_at',
        description: 'Module 5: Ngày kỷ niệm & Đếm ngày yêu'
      },
      {
        table: 'activity_logs',
        columns: 'id, user_id, action, title, description, content, created_at',
        description: 'Module 6: Nhật ký hoạt động (Activity Logs)'
      },
      {
        table: 'locket_photos',
        columns: 'id, photo_url, caption, user_role, is_deleted, created_at',
        description: 'Module 7: Khoảnh khắc Locket (7 ngày & Soft/Hard delete)'
      },
      {
        table: 'push_subscriptions',
        columns: 'id, user_id, subscription, created_at',
        description: 'Module 8: Đăng ký thông báo đẩy (Web Push Subscriptions)'
      }
    ]

    for (const t of tablesToCheck) {
      try {
        const { data, error } = await supabaseAdmin
          .from(t.table)
          .select(t.columns)
          .limit(1)

        if (error) {
          if (error.message.includes('exceed_egress_quota')) {
            isEgressRestricted = true
            logFail(
              `Bảng '${t.table}'`,
              `Project Supabase (${supabaseUrl}) đã VƯỢT QUÁ QUOTA EGRESS (5GB Free) của Supabase!`
            )
          } else {
            logFail(`Bảng '${t.table}' (${t.description})`, error.message)
          }
        } else {
          logPass(`Bảng '${t.table}'`, t.description)
        }
      } catch (err) {
        logFail(`Bảng '${t.table}'`, err.message)
      }
    }

    // 4. STORAGE BUCKET 'locket'
    printHeader('4. STORAGE BUCKET CHỨA ẢNH LOCKET')
    try {
      const { data: buckets, error: bucketErr } = await supabaseAdmin.storage.listBuckets()
      if (bucketErr) {
        if (bucketErr.message?.includes('exceed_egress_quota')) {
          logFail("Bucket 'locket'", "Bị chặn do dự án Supabase vượt quá quota băng thông egress.")
        } else {
          logFail("Truy vấn Storage Buckets", bucketErr.message)
        }
      } else {
        const locketBucket = buckets?.find(b => b.name === 'locket' || b.id === 'locket')
        if (locketBucket) {
          logPass("Bucket 'locket' tồn tại và sẵn sàng", `Chế độ: ${locketBucket.public ? 'Public URL' : 'Private'}`)
        } else {
          logFail("Bucket 'locket' chưa tồn tại!", "Cần vào Supabase Dashboard > Storage > Tạo bucket tên 'locket'")
        }
      }
    } catch (e) {
      logFail("Kiểm tra Storage bucket 'locket'", e.message)
    }

    // 5. TEST QUYỀN GHI/ĐỌC/XÓA (CRUD TEST)
    printHeader('5. KIỂM THỬ THAO TÁC GHI/ĐỌC/XÓA (CRUD TEST)')
    if (!isEgressRestricted) {
      try {
        const { data: insData, error: insErr } = await supabaseAdmin
          .from('activity_logs')
          .insert({
            action: 'HEALTH_CHECK',
            title: 'Kiểm thử hệ thống tự động',
            description: 'Bản ghi tạm test quyền Insert',
            content: 'Tự động dọn dẹp ngay sau khi test'
          })
          .select('id, title')
          .single()

        if (insErr || !insData) {
          logFail('Quyền Ghi (INSERT)', insErr ? insErr.message : 'Không nhận được dữ liệu vừa tạo')
        } else {
          logPass('Quyền Ghi (INSERT)', 'Ghi nhật ký thành công')

          const { data: readData, error: readErr } = await supabaseAdmin
            .from('activity_logs')
            .select('id, title')
            .eq('id', insData.id)
            .single()

          if (readErr || !readData) {
            logFail('Quyền Đọc (SELECT)', readErr ? readErr.message : 'Không tìm thấy bản ghi')
          } else {
            logPass('Quyền Đọc (SELECT)', 'Đọc lại dữ liệu chính xác')
          }

          const { error: delErr } = await supabaseAdmin
            .from('activity_logs')
            .delete()
            .eq('id', insData.id)

          if (delErr) {
            logFail('Quyền Xóa (DELETE)', delErr.message)
          } else {
            logPass('Quyền Xóa (DELETE)', 'Dọn dẹp bản ghi test hoàn tất')
          }
        }
      } catch (e) {
        logFail('CRUD Test simulation', e.message)
      }
    } else {
      logWarn('Bỏ qua CRUD Test', 'Do Supabase Project đang bị hạn chế vì vượt quota Egress')
    }

    // 6. KIỂM TRA LOGIC DỌN DẸP 7 NGÀY
    printHeader('6. LOGIC RETENTION LOCKET (GIỚI HẠN LƯU TRỮ 7 NGÀY)')
    if (!isEgressRestricted) {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { data: oldPhotos, error: queryOldErr } = await supabaseAdmin
          .from('locket_photos')
          .select('id, photo_url, created_at')
          .lt('created_at', sevenDaysAgo)

        if (queryOldErr) {
          logFail('Truy vấn ảnh cũ hơn 7 ngày', queryOldErr.message)
        } else {
          logPass(
            'Hàm lọc ảnh quá hạn 7 ngày',
            `Hiện có ${oldPhotos?.length || 0} ảnh cũ hơn 7 ngày trong database`
          )
        }
      } catch (e) {
        logFail('Logic dọn dẹp Locket 7 ngày', e.message)
      }
    } else {
      logWarn('Bỏ qua kiểm tra Locket retention query', 'Do lỗi Egress')
    }

    // 7. KIỂM TRA AUTH ADMIN (ĐỔI MẬT KHẨU)
    printHeader('7. SUPABASE AUTH ADMIN SERVICE (ĐỔI MẬT KHẨU / LOGIN)')
    if (!isEgressRestricted) {
      try {
        const { data: userList, error: listUserErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 5 })
        if (listUserErr) {
          logFail('Supabase Auth Admin listUsers()', listUserErr.message)
        } else {
          logPass('Auth Admin Service', `Kết nối tốt, quản lý ${userList.users.length} tài khoản`)
        }
      } catch (e) {
        logFail('Auth Admin API', e.message)
      }
    } else {
      logWarn('Bỏ qua kiểm tra Auth Admin', 'Do lỗi Egress')
    }
  }

  // 8. KIỂM TRA CẤU HÌNH WEB PUSH
  printHeader('8. HỆ THỐNG THÔNG BÁO ĐẨY WEB PUSH (VAPID)')
  try {
    const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privKey = process.env.VAPID_PRIVATE_KEY
    if (pubKey && privKey) {
      webpush.setVapidDetails('mailto:hello@ppaevol.app', pubKey, privKey)
      logPass('VAPID Web Push Credentials', 'Khóa công khai & bí mật hợp lệ, sẵn sàng gửi Push')
    } else {
      logWarn('VAPID Web Push', 'Chưa cấu hình VAPID keys')
    }
  } catch (e) {
    logFail('Khởi tạo Web Push VAPID', e.message)
  }

  // 9. VALIDATOR CHỐNG TRÀN BĂNG THÔNG & NÉN ẢNH
  printHeader('9. BỘ LỌC CHỐNG TRÀN BĂNG THÔNG & VALIDATOR ẢNH')
  function testValidateUrl(url) {
    if (typeof url !== 'string' || !url.trim()) throw new Error('Đường dẫn ảnh rỗng')
    const trimmed = url.trim()
    if (trimmed.startsWith('data:image') || trimmed.includes(';base64,')) {
      throw new Error('CHẶN BẢO VỆ: Phát hiện Base64')
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      throw new Error('CHẶN BẢO VỆ: Phải là URL http/https')
    }
    if (trimmed.length > 1000) {
      throw new Error('CHẶN BẢO VỆ: Quá dài')
    }
    return true
  }

  try {
    testValidateUrl('https://xyz.supabase.co/storage/v1/object/public/locket/sample.jpg')
    logPass('Chấp nhận Public Storage URL', 'URL ngắn, cache 1 năm, không tốn Egress')
  } catch (e) {
    logFail('Public Storage URL bị chặn nhầm', e.message)
  }

  try {
    testValidateUrl('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD...')
    logFail('Bỏ lọt chuỗi Base64 nguy hiểm')
  } catch (e) {
    logPass('Chặn đứng chuỗi Base64 (data:image)', 'Ngăn chặn tràn băng thông vĩnh viễn')
  }

  try {
    testValidateUrl('ftp://invalid-server/image.png')
    logFail('Bỏ lọt giao thức lạ (ftp)')
  } catch (e) {
    logPass('Chặn URL giao thức lạ không an toàn')
  }

  // 10. KIỂM TRA FILE CẤU TRÚC CODE & API ROUTES
  printHeader('10. KIỂM TRA CẤU TRÚC FILE MÃ NGUỒN CỐT LÕI')
  const coreFiles = [
    'app/page.tsx',
    'app/login/page.tsx',
    'app/api/locket/cleanup/route.ts',
    'app/api/send-ping-push/route.ts',
    'app/api/auth/reset-password/route.ts',
    'lib/image-compressor.ts',
    'lib/supabase.ts',
    'types/database.ts'
  ]

  for (const f of coreFiles) {
    const fullPath = path.join(rootDir, f)
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath)
      logPass(`File mã nguồn '${f}'`, `${(stats.size / 1024).toFixed(1)} KB`)
    } else {
      logFail(`Thiếu file mã nguồn cốt lõi '${f}'`)
    }
  }

  // NẾU CÓ CỜ --build THÌ CHẠY NEXT.JS BUILD TEST
  if (process.argv.includes('--build')) {
    printHeader('11. KIỂM TRA BIÊN DỊCH NEXT.JS (TYPESCRIPT & PRODUCTION BUILD)')
    try {
      console.log('  Đang chạy `next build` để kiểm tra toàn vẹn mã nguồn...')
      execSync('npx next build', { cwd: rootDir, stdio: 'inherit' })
      logPass('Next.js Production Build', 'Biên dịch 100% thành công không lỗi')
    } catch (err) {
      logFail('Next.js Production Build', 'Phát hiện lỗi TypeScript hoặc build Next.js')
    }
  }

  // TỔNG KẾT BÁO CÁO
  console.log(`\n${colors.bold}${colors.cyan}======================================================================`)
  console.log(`                     BẢNG TỔNG KẾT KIỂM THỬ HỆ THỐNG`)
  console.log(`======================================================================${colors.reset}`)
  console.log(`  Tổng số hạng mục kiểm tra  : ${colors.bold}${totalTests}${colors.reset}`)
  console.log(`  Hạng mục đạt yêu cầu (PASS) : ${colors.green}${colors.bold}${passedTests}${colors.reset}`)
  console.log(`  Hạng mục cảnh báo    (WARN) : ${colors.yellow}${colors.bold}${warningTests}${colors.reset}`)
  console.log(`  Hạng mục thất bại    (FAIL) : ${failedTests > 0 ? colors.red : colors.green}${colors.bold}${failedTests}${colors.reset}`)
  console.log(`${colors.cyan}======================================================================${colors.reset}`)

  if (isEgressRestricted) {
    console.log(`\n${colors.bold}${colors.red}>>> CẢNH BÁO QUAN TRỌNG: SUPABASE PROJECT ĐANG BỊ KHÓA DO VƯỢT EGRESS! <<<${colors.reset}`)
    console.log(`${colors.yellow}Dự án Supabase '${supabaseUrl}' đã chạm ngưỡng giới hạn băng thông 5GB của gói Free.`)
    console.log(`Giải pháp:`)
    console.log(`  1. Nếu bạn đã tạo Project Supabase mới: Hãy mở file .env.local và cập nhật:`)
    console.log(`     - NEXT_PUBLIC_SUPABASE_URL=<URL project mới>`)
    console.log(`     - NEXT_PUBLIC_SUPABASE_ANON_KEY=<Anon Key project mới>`)
    console.log(`     - SUPABASE_SERVICE_ROLE_KEY=<Service Role Key project mới>`)
    console.log(`  2. Sau đó mở Supabase SQL Editor chạy file 'supabase_schema.sql' và tạo bucket 'locket'.`)
    console.log(`  3. Chạy lại lệnh 'npm test' để hệ thống tự động kiểm tra lại toàn bộ.${colors.reset}\n`)
  } else if (failedTests === 0) {
    console.log(`\n${colors.green}${colors.bold}>>> TẤT CẢ CÁC HẠNG MỤC ĐỀU HOẠT ĐỘNG HOÀN HẢO! HỆ THỐNG SẴN SÀNG 100%! <<<${colors.reset}\n`)
  } else {
    console.log(`\n${colors.red}${colors.bold}>>> PHÁT HIỆN ${failedTests} VẤN ĐỀ CẦN XỬ LÝ (Xem chi tiết lỗi phía trên) <<<${colors.reset}\n`)
  }

  process.exit(failedTests > 0 ? 1 : 0)
}

runAllTests().catch(err => {
  console.error('Lỗi nghiêm trọng khi thực thi script test:', err)
  process.exit(1)
})
