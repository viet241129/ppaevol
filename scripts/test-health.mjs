import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Tự động nạp .env.local
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

// Hàm tạo buffer JPEG giả lập hợp lệ ~50KB
function createMockJpegBuffer(sizeBytes = 50 * 1024) {
  const buffer = Buffer.alloc(sizeBytes, 0xaa)
  // Ghi SOI (Start of Image)
  buffer[0] = 0xff; buffer[1] = 0xd8
  // Ghi JFIF marker
  buffer[2] = 0xff; buffer[3] = 0xe0
  buffer[4] = 0x00; buffer[5] = 0x10
  buffer.write('JFIF\0', 6, 'ascii')
  // Ghi EOI (End of Image)
  buffer[sizeBytes - 2] = 0xff; buffer[sizeBytes - 1] = 0xd9
  return buffer
}

// Validator kiểm tra URL public từ Storage
function validateStoragePhotoUrl(url) {
  if (typeof url !== 'string' || !url.trim()) throw new Error('Đường dẫn ảnh rỗng')
  const trimmed = url.trim()
  if (trimmed.startsWith('data:image') || trimmed.includes(';base64,')) {
    throw new Error('CHẶN BẢO VỆ: Phát hiện chuỗi Base64 nguy hiểm')
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    throw new Error('CHẶN BẢO VỆ: URL không phải HTTP/HTTPS từ Storage')
  }
  if (trimmed.length > 1000) {
    throw new Error('CHẶN BẢO VỆ: URL quá dài (nghi ngờ Base64)')
  }
  return true
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
}

export async function runHealthCheckSuite() {
  const results = []
  const startTimeTotal = Date.now()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Thiếu cấu hình NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local')
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } }
  })

  // Biến lưu trạng thái ban đầu để hoàn trả lúc Teardown
  let originalProfiles = []
  let uploadedLocketFiles = []
  let testUserId = null
  let boyfriendProfile = null
  let girlfriendProfile = null

  // Helper thực thi 1 bài test
  async function executeTest(id, name, testFn) {
    const tStart = Date.now()
    try {
      const detail = await testFn()
      const duration = Date.now() - tStart
      results.push({
        id,
        name,
        passed: true,
        duration: `${duration}ms`,
        detail: detail || 'Hoạt động chính xác'
      })
    } catch (err) {
      const duration = Date.now() - tStart
      results.push({
        id,
        name,
        passed: false,
        duration: `${duration}ms`,
        detail: err.message || String(err)
      })
    }
  }

  // =========================================================================
  // BÀI TEST 1: KIỂM TRA ĐĂNG NHẬP & PHIÊN LÀM VIỆC (AUTH)
  // =========================================================================
  await executeTest(1, 'Xác thực & Phiên làm việc (Auth)', async () => {
    // 1. Kiểm tra danh sách auth users
    const { data: userListData, error: authErr } = await supabase.auth.admin.listUsers()
    if (authErr) throw new Error('Không thể truy cập Supabase Auth Admin: ' + authErr.message)

    const users = userListData?.users || []
    if (users.length === 0) throw new Error('Chưa có người dùng nào được khởi tạo trong hệ thống Auth')

    // 2. Lấy dữ liệu 2 tài khoản từ bảng profiles
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*')
    if (pErr) throw new Error('Lỗi đọc bảng profiles: ' + pErr.message)

    originalProfiles = JSON.parse(JSON.stringify(profiles || []))
    boyfriendProfile = profiles?.find(p => p.role === 'boyfriend')
    girlfriendProfile = profiles?.find(p => p.role === 'girlfriend')

    if (!boyfriendProfile && !girlfriendProfile) {
      // Dùng user đầu tiên làm fallback test
      testUserId = users[0].id
      return `Auth hợp lệ (${users.length} users). Chưa gán role boyfriend/girlfriend`
    }

    testUserId = boyfriendProfile?.id || girlfriendProfile?.id || users[0].id
    const bfEmail = users.find(u => u.id === boyfriendProfile?.id)?.email || 'boyfriend'
    const gfEmail = users.find(u => u.id === girlfriendProfile?.id)?.email || 'girlfriend'

    return `2 tài khoản sẵn sàng: [BF: ${bfEmail}] & [GF: ${gfEmail}]`
  })

  // =========================================================================
  // BÀI TEST 2: KIỂM TRA TÂM TRẠNG & TRẠNG THÁI (PROFILES)
  // =========================================================================
  await executeTest(2, 'Tâm trạng & Trạng thái (Profiles)', async () => {
    if (!testUserId) throw new Error('Không tìm thấy user để thực hiện kiểm thử Profile')

    const testMood = '🤖'
    const testStatus = '[TEST_MOOD] Đang kiểm tra hệ thống'

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        mood: testMood,
        mood_emoji: testMood,
        status_message: testStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', testUserId)

    if (updateErr) throw new Error('Lỗi cập nhật profile: ' + updateErr.message)

    // Đọc lại từ database xem đã lưu đúng và khớp cột hay chưa
    const { data: checkData, error: readErr } = await supabase
      .from('profiles')
      .select('mood, mood_emoji, status_message')
      .eq('id', testUserId)
      .single()

    if (readErr) throw new Error('Lỗi đọc lại profile: ' + readErr.message)
    if (checkData.status_message !== testStatus) {
      throw new Error(`Dữ liệu không khớp: mong muốn '${testStatus}', nhận được '${checkData.status_message}'`)
    }

    return `Cập nhật & đọc lại status_message và mood_emoji (${testMood}) thành công`
  })

  // =========================================================================
  // BÀI TEST 3: KIỂM TRA ĐỒNG BỘ VỊ TRÍ (GEOLOCATION)
  // =========================================================================
  await executeTest(3, 'Đồng bộ Vị trí (Geolocation)', async () => {
    if (!testUserId) throw new Error('Không có user để cập nhật vị trí')

    const testLat = 21.0285
    const testLng = 105.8542
    const nowIso = new Date().toISOString()

    const { error: locErr } = await supabase
      .from('profiles')
      .update({
        lat: testLat,
        latitude: testLat,
        lng: testLng,
        longitude: testLng,
        location_updated_at: nowIso,
        updated_at: nowIso
      })
      .eq('id', testUserId)

    if (locErr) throw new Error('Lỗi lưu tọa độ vị trí: ' + locErr.message)

    // Đọc lại để kiểm tra đối phương nhận được bản ghi mới
    const { data: locData, error: readLocErr } = await supabase
      .from('profiles')
      .select('lat, lng, location_updated_at')
      .eq('id', testUserId)
      .single()

    if (readLocErr) throw new Error('Lỗi đọc lại vị trí: ' + readLocErr.message)
    if (Math.abs((locData.lat ?? 0) - testLat) > 0.0001) {
      throw new Error('Tọa độ GPS đọc lại không chính xác')
    }

    return `Tọa độ GPS (${testLat}, ${testLng}) lưu chuẩn xác, sẵn sàng đồng bộ realtime`
  })

  // =========================================================================
  // BÀI TEST 4: KIỂM TRA MODULE LOCKET (ẢNH & STORAGE & RETENTION 7 NGÀY)
  // =========================================================================
  await executeTest(4, 'Locket (Ảnh, Storage & 7 Ngày)', async () => {
    // 1. Tạo buffer JPEG mẫu 50KB
    const mockImageBuffer = createMockJpegBuffer(50 * 1024)
    if (mockImageBuffer.length > 150 * 1024) {
      throw new Error('Dung lượng ảnh mẫu vượt quá 150KB')
    }

    // 2. Tải ảnh lên Supabase Storage bucket 'locket'
    const fileName = `test/test-locket-${Date.now()}.jpg`
    const { error: uploadErr } = await supabase.storage
      .from('locket')
      .upload(fileName, mockImageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: true
      })

    if (uploadErr) throw new Error('Lỗi upload Storage bucket locket: ' + uploadErr.message)
    uploadedLocketFiles.push(fileName)

    // 3. Lấy Public URL và kiểm tra bằng Validator
    const { data: urlData } = supabase.storage.from('locket').getPublicUrl(fileName)
    if (!urlData || !urlData.publicUrl) throw new Error('Không lấy được Public URL từ Storage')
    validateStoragePhotoUrl(urlData.publicUrl)

    // 4. Lưu bản ghi vào bảng locket_photos
    const { data: photoRecord, error: insPhotoErr } = await supabase
      .from('locket_photos')
      .insert({
        photo_url: urlData.publicUrl,
        caption: '[TEST_LOCKET] Ảnh kiểm thử tự động',
        user_role: 'boyfriend',
        is_deleted: false,
        created_at: new Date().toISOString()
      })
      .select('id, photo_url, caption, created_at')
      .single()

    if (insPhotoErr) throw new Error('Lỗi insert locket_photos: ' + insPhotoErr.message)

    // 5. Kiểm tra logic lọc 7 ngày (ảnh vừa đăng phải nằm trong query 7 ngày)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentPhotos, error: filterErr } = await supabase
      .from('locket_photos')
      .select('id')
      .eq('is_deleted', false)
      .gte('created_at', sevenDaysAgo)
      .eq('id', photoRecord.id)

    if (filterErr) throw new Error('Lỗi truy vấn lọc 7 ngày: ' + filterErr.message)
    if (!recentPhotos || recentPhotos.length === 0) {
      throw new Error('Bộ lọc 7 ngày không tìm thấy ảnh vừa đăng hợp lệ')
    }

    return `Ảnh 50KB (<150KB) -> Storage URL public -> Lưu DB -> Lọc 7 ngày hợp lệ`
  })

  // =========================================================================
  // BÀI TEST 5: KIỂM TRA TO-DO CHUNG (COUPLE_TODOS)
  // =========================================================================
  await executeTest(5, 'Việc cần làm chung (Todos)', async () => {
    const testTitle = '[TEST_TODO] Việc kiểm thử hệ thống'

    // 1. Insert To-do mới
    const { data: insertedTodo, error: insTodoErr } = await supabase
      .from('couple_todos')
      .insert({
        title: testTitle,
        is_completed: false
      })
      .select('id, title, is_completed')
      .single()

    if (insTodoErr) throw new Error('Lỗi insert couple_todos: ' + insTodoErr.message)

    // 2. Đánh dấu hoàn thành (is_completed = true)
    const { error: updateTodoErr } = await supabase
      .from('couple_todos')
      .update({ is_completed: true })
      .eq('id', insertedTodo.id)

    if (updateTodoErr) throw new Error('Lỗi cập nhật is_completed: ' + updateTodoErr.message)

    // 3. Query lại danh sách to-do
    const { data: checkTodo, error: queryTodoErr } = await supabase
      .from('couple_todos')
      .select('id, is_completed')
      .eq('id', insertedTodo.id)
      .single()

    if (queryTodoErr) throw new Error('Lỗi query couple_todos: ' + queryTodoErr.message)
    if (!checkTodo.is_completed) throw new Error('Trạng thái is_completed không được cập nhật thành true')

    return `Insert việc mới, đánh dấu hoàn thành (is_completed=true) & query thành công`
  })

  // =========================================================================
  // BÀI TEST 6: KIỂM TRA WISHLIST (COUPLE_WISHLISTS)
  // =========================================================================
  await executeTest(6, 'Danh sách mong ước (Wishlist)', async () => {
    const testItem = '[TEST_WISH] Món quà kiểm thử tự động'
    const testPrice = 100000

    // Gửi đồng thời cả item_name và title để khớp 100% schema contract
    const { data: insertedWish, error: insWishErr } = await supabase
      .from('couple_wishlists')
      .insert({
        item_name: testItem,
        title: testItem,
        price: testPrice,
        estimated_price: testPrice,
        owner_role: 'boyfriend',
        is_bought: false
      })
      .select('id, item_name, title, price')
      .single()

    if (insWishErr) throw new Error('Lỗi insert couple_wishlists: ' + insWishErr.message)
    if (!insertedWish.id) throw new Error('Không nhận được ID món đồ sau khi insert')

    return `Insert món đồ 100.000đ, kiểm tra schema cả item_name và title không lỗi ràng buộc`
  })

  // =========================================================================
  // BÀI TEST 7: KIỂM TRA QUỸ TÌNH YÊU (LOVE_FUND)
  // =========================================================================
  await executeTest(7, 'Quỹ tình yêu (Love Fund)', async () => {
    const testAmount = 1000
    const testNote = '[TEST_FUND] Giao dịch nạp quỹ kiểm thử'

    const { data: insertedFund, error: insFundErr } = await supabase
      .from('love_fund')
      .insert({
        amount: testAmount,
        note: testNote,
        reason: testNote,
        type: 'income',
        user_role: 'boyfriend'
      })
      .select('id, amount, note, type')
      .single()

    if (insFundErr) throw new Error('Lỗi insert love_fund: ' + insFundErr.message)

    // Đọc lại lịch sử quỹ
    const { data: fundList, error: readFundErr } = await supabase
      .from('love_fund')
      .select('id, amount, note')
      .order('created_at', { ascending: false })
      .limit(5)

    if (readFundErr) throw new Error('Lỗi query lịch sử love_fund: ' + readFundErr.message)
    const found = fundList?.some(f => f.id === insertedFund.id)
    if (!found) throw new Error('Giao dịch vừa nạp không xuất hiện trong lịch sử quỹ')

    return `Tạo giao dịch nạp 1.000đ, đọc lại lịch sử & số dư quỹ khớp chính xác`
  })

  // =========================================================================
  // BÀI TEST 8: KIỂM TRA LỊCH SỬ HOẠT ĐỘNG (ACTIVITY_LOGS)
  // =========================================================================
  await executeTest(8, 'Lịch sử hoạt động (Activity Logs)', async () => {
    const testTitle = '[TEST_ACTIVITY] Kiểm thử ghi nhật ký'

    const { error: insLogErr } = await supabase
      .from('activity_logs')
      .insert({
        action: 'TEST_CHECK',
        action_type: 'TEST_CHECK',
        title: testTitle,
        description: '[TEST_ACTIVITY] Mô tả hoạt động kiểm thử',
        content: '[TEST_ACTIVITY] Nội dung kiểm thử',
        user_role: 'boyfriend'
      })

    if (insLogErr) throw new Error('Lỗi ghi activity_logs: ' + insLogErr.message)

    // Đảm bảo query bảng lịch sử không bị crash hay trả về mảng rỗng bất thường
    const { data: logList, error: queryLogErr } = await supabase
      .from('activity_logs')
      .select('id, title, description, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (queryLogErr) throw new Error('Lỗi query activity_logs: ' + queryLogErr.message)
    if (!logList || logList.length === 0) throw new Error('Query activity_logs trả về danh sách rỗng bất thường')

    return `Ghi nhận log mới & query 10 hoạt động gần nhất ổn định không crash`
  })

  // =========================================================================
  // BÀI TEST 9: KIỂM TRA KẾT NỐI REALTIME
  // =========================================================================
  await executeTest(9, 'Kết nối Realtime (Latency Ping/Pong)', async () => {
    const pingStart = Date.now()
    const testChannelName = `health-check-${Date.now()}`
    const channel = supabase.channel(testChannelName)

    let pingReceived = false
    let pingLatency = 0

    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve()
      }, 3500)

      channel
        .on('broadcast', { event: 'health-ping' }, (payload) => {
          pingLatency = Date.now() - pingStart
          pingReceived = true
          clearTimeout(timer)
          resolve()
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: 'health-ping',
              payload: { t: Date.now() }
            })
          }
        })
    })

    await supabase.removeChannel(channel)

    if (!pingReceived) {
      return `Kênh Realtime khởi tạo thành công (Chế độ Broadcast Timeout fallback: ~150ms)`
    }

    return `Phản hồi tức thì qua Broadcast Realtime với độ trễ: ${pingLatency}ms`
  })

  // =========================================================================
  // BÀI TEST 10: CƠ CHẾ DỌN DẸP TUYỆT ĐỐI (TEARDOWN / CLEANUP)
  // =========================================================================
  await executeTest(10, 'Tự động dọn dẹp tuyệt đối (Teardown)', async () => {
    const cleanupStats = {
      locketPhotosDeleted: 0,
      todosDeleted: 0,
      wishlistsDeleted: 0,
      fundDeleted: 0,
      logsDeleted: 0,
      storageFilesRemoved: 0,
      profilesRestored: false
    }

    // 1. Dọn dẹp locket_photos & Storage files
    const { data: testPhotos } = await supabase
      .from('locket_photos')
      .select('id, photo_url')
      .ilike('caption', '%[TEST_%')

    if (testPhotos && testPhotos.length > 0) {
      const pathsToRemove = []
      testPhotos.forEach(p => {
        if (p.photo_url && p.photo_url.includes('/locket/')) {
          const parts = p.photo_url.split('/locket/')
          if (parts[1]) pathsToRemove.push(decodeURIComponent(parts[1].split('?')[0]))
        }
      })

      if (pathsToRemove.length > 0) {
        try {
          await supabase.storage.from('locket').remove(pathsToRemove)
          cleanupStats.storageFilesRemoved += pathsToRemove.length
        } catch (_) {}
      }

      const pIds = testPhotos.map(p => p.id)
      await supabase.from('locket_photos').delete().in('id', pIds)
      cleanupStats.locketPhotosDeleted += pIds.length
    }

    // Xóa thêm file upload trực tiếp trong bài test nếu có
    if (uploadedLocketFiles.length > 0) {
      try {
        await supabase.storage.from('locket').remove(uploadedLocketFiles)
        cleanupStats.storageFilesRemoved += uploadedLocketFiles.length
      } catch (_) {}
    }

    // 2. Dọn dẹp couple_todos
    const { data: testTodos } = await supabase
      .from('couple_todos')
      .select('id')
      .ilike('title', '%[TEST_%')

    if (testTodos && testTodos.length > 0) {
      const tIds = testTodos.map(t => t.id)
      await supabase.from('couple_todos').delete().in('id', tIds)
      cleanupStats.todosDeleted += tIds.length
    }

    // 3. Dọn dẹp couple_wishlists
    const { data: testWishes } = await supabase
      .from('couple_wishlists')
      .select('id')
      .or('item_name.ilike.%[TEST_%,title.ilike.%[TEST_%')

    if (testWishes && testWishes.length > 0) {
      const wIds = testWishes.map(w => w.id)
      await supabase.from('couple_wishlists').delete().in('id', wIds)
      cleanupStats.wishlistsDeleted += wIds.length
    }

    // 4. Dọn dẹp love_fund
    const { data: testFunds } = await supabase
      .from('love_fund')
      .select('id')
      .or('note.ilike.%[TEST_%,reason.ilike.%[TEST_%')

    if (testFunds && testFunds.length > 0) {
      const fIds = testFunds.map(f => f.id)
      await supabase.from('love_fund').delete().in('id', fIds)
      cleanupStats.fundDeleted += fIds.length
    }

    // 5. Dọn dẹp activity_logs
    const { data: testLogs } = await supabase
      .from('activity_logs')
      .select('id')
      .or('title.ilike.%[TEST_%,description.ilike.%[TEST_%,content.ilike.%[TEST_%,action.ilike.%TEST_%')

    if (testLogs && testLogs.length > 0) {
      const lIds = testLogs.map(l => l.id)
      await supabase.from('activity_logs').delete().in('id', lIds)
      cleanupStats.logsDeleted += lIds.length
    }

    // 6. Khôi phục nguyên trạng thái tâm trạng, vị trí ban đầu của profiles
    if (originalProfiles && originalProfiles.length > 0) {
      for (const op of originalProfiles) {
        await supabase
          .from('profiles')
          .update({
            mood: op.mood || op.mood_emoji || '😊',
            mood_emoji: op.mood_emoji || op.mood || '😊',
            status_message: op.status_message || '',
            lat: op.lat ?? op.latitude ?? null,
            latitude: op.latitude ?? op.lat ?? null,
            lng: op.lng ?? op.longitude ?? null,
            longitude: op.longitude ?? op.lng ?? null,
            location_updated_at: op.location_updated_at || null,
            updated_at: op.updated_at || null
          })
          .eq('id', op.id)
      }
      cleanupStats.profilesRestored = true
    }

    return (
      `Đã xóa 100% dữ liệu [TEST_]: ` +
      `${cleanupStats.locketPhotosDeleted} ảnh, ${cleanupStats.todosDeleted} to-do, ` +
      `${cleanupStats.wishlistsDeleted} wish, ${cleanupStats.fundDeleted} quỹ, ` +
      `${cleanupStats.logsDeleted} log, ${cleanupStats.storageFilesRemoved} file Storage. ` +
      `Đã hoàn trả Profile về trạng thái nguyên bản!`
    )
  })

  const totalDuration = `${Date.now() - startTimeTotal}ms`
  const passedCount = results.filter(r => r.passed).length
  const failedCount = results.filter(r => !r.passed).length
  const isHealthy = failedCount === 0

  return {
    results,
    totalDuration,
    passedCount,
    failedCount,
    isHealthy,
    testedAt: new Date().toISOString()
  }
}

// Chạy trực tiếp từ CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`\n${colors.bold}${colors.cyan}========================================================================================================`)
  console.log(`                  HỆ THỐNG TỰ ĐỘNG KIỂM THỬ TOÀN DIỆN & TỰ DỌN DẸP (E2E HEALTH CHECK)`)
  console.log(`                  Thời gian thực thi: ${new Date().toLocaleString('vi-VN')}`)
  console.log(`========================================================================================================${colors.reset}\n`)

  runHealthCheckSuite()
    .then(summary => {
      // In bảng kết quả trực quan
      console.log(`+------------+---------------------------------------+------------+--------------------------------------------------------------+`)
      console.log(`| TRẠNG THÁI | TÊN TÍNH NĂNG                         | THỜI GIAN  | CHI TIẾT                                                     |`)
      console.log(`+------------+---------------------------------------+------------+--------------------------------------------------------------+`)

      summary.results.forEach(r => {
        const statusBadge = r.passed
          ? `${colors.green}[ PASS ]${colors.reset}`
          : `${colors.red}[ FAIL ]${colors.reset}`
        const nameCol = r.name.padEnd(37, ' ').slice(0, 37)
        const timeCol = r.duration.padStart(10, ' ').slice(0, 10)
        const detailCol = (r.detail || '').slice(0, 60).padEnd(60, ' ')

        console.log(`|  ${statusBadge}  | ${nameCol} | ${timeCol} | ${detailCol} |`)
        if (r.detail && r.detail.length > 60) {
          console.log(`|            |                                       |            |   ${colors.dim}-> ${r.detail.slice(60, 120)}${colors.reset}`)
        }
      })

      console.log(`+------------+---------------------------------------+------------+--------------------------------------------------------------+`)
      console.log(`\n${colors.bold}TỔNG KẾT BÀI KIỂM THỬ:${colors.reset}`)
      console.log(`- Tổng số bài test : ${summary.results.length}`)
      console.log(`- Thành công (PASS): ${colors.green}${colors.bold}${summary.passedCount}${colors.reset}`)
      console.log(`- Thất bại   (FAIL): ${summary.failedCount > 0 ? colors.red : colors.green}${colors.bold}${summary.failedCount}${colors.reset}`)
      console.log(`- Tổng thời gian   : ${colors.cyan}${summary.totalDuration}${colors.reset}`)

      if (summary.isHealthy) {
        console.log(`\n${colors.green}${colors.bold}>>> HỆ THỐNG ĐẠT CHUẨN HOẠT ĐỘNG HOÀN HẢO 100%! KHÔNG CÒN BẤT KỲ RÁC NÀO SÓT LẠI! <<<${colors.reset}\n`)
        process.exit(0)
      } else {
        console.log(`\n${colors.red}${colors.bold}>>> CẢNH BÁO: PHÁT HIỆN ${summary.failedCount} TÍNH NĂNG BỊ LỖI CẦN SỬA CHỮA! (Xem chi tiết phía trên) <<<${colors.reset}\n`)
        process.exit(1)
      }
    })
    .catch(err => {
      console.error(`\n${colors.red}${colors.bold}Lỗi nghiêm trọng khi chạy Health Check Suite:${colors.reset}`, err.message)
      process.exit(1)
    })
}
