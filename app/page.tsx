'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { compressImage, validateStoragePhotoUrl } from '@/lib/image-compressor'
import { 
  MapPin, Heart, Smile, CalendarDays, 
  Wallet, CheckSquare, Gift, LogOut, Plus, Minus, Trash2, Check, X, ExternalLink, Navigation, BellRing,
  Info, Camera, Clock, Eye, Sparkles, Images, RotateCw, RotateCcw
} from 'lucide-react'

const MOODS = [
  { icon: '😊', label: 'Vui vẻ' },
  { icon: '😢', label: 'Buồn' },
  { icon: '🥺', label: 'Nhớ quá' },
  { icon: '💻', label: 'Bận việc' },
  { icon: '😡', label: 'Cáu gắt' },
  { icon: '🥰', label: 'Hạnh phúc' },
  { icon: '🤒', label: 'Mệt mỏi' },
]

// Helper định dạng giờ 24h: HH:mm (VD: 14:30)
const format24h = (dateStr?: string | Date | null) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// Helper định dạng ngày giờ 24h: dd/MM HH:mm (VD: 11/10 14:30)
const formatDateTime24h = (dateStr?: string | Date | null) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month} ${hours}:${minutes}`
}

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<'boyfriend' | 'girlfriend' | null>(null)
  const [partnerRole, setPartnerRole] = useState<'boyfriend' | 'girlfriend' | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)

  // Mood
  const [mood, setMood] = useState('😊')
  const [statusMessage, setStatusMessage] = useState('Đang tải...')
  const [myMoodUpdatedAt, setMyMoodUpdatedAt] = useState<string | null>(null)
  
  const [partnerMood, setPartnerMood] = useState('😊')
  const [partnerStatus, setPartnerStatus] = useState('Đang tải...')
  const [partnerMoodUpdatedAt, setPartnerMoodUpdatedAt] = useState<string | null>(null)
  
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [newMoodIcon, setNewMoodIcon] = useState('😊')
  const [newStatusMsg, setNewStatusMsg] = useState('')

  // Location
  const [myLat, setMyLat] = useState<number | null>(null)
  const [myLng, setMyLng] = useState<number | null>(null)
  const [partnerLat, setPartnerLat] = useState<number | null>(null)
  const [partnerLng, setPartnerLng] = useState<number | null>(null)
  const [partnerLocationUpdatedAt, setPartnerLocationUpdatedAt] = useState<string | null>(null)
  const [myLocationUpdatedAt, setMyLocationUpdatedAt] = useState<string | null>(null)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)

  // Location Sync Refs
  const isSyncingLocationRef = useRef(false)
  const lastLocationSyncTimeRef = useRef(0)
  const userRef = useRef<any>(null)
  const roleRef = useRef<'boyfriend' | 'girlfriend' | null>(null)

  useEffect(() => {
    userRef.current = user
    roleRef.current = role
  }, [user, role])

  // Love Fund
  const [loveFund, setLoveFund] = useState<any[]>([])
  const [fundTotal, setFundTotal] = useState(0)
  const [showFundForm, setShowFundForm] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [fundReason, setFundReason] = useState('')
  const [fundType, setFundType] = useState<'Thu'|'Chi'>('Thu')

  // Todos
  const [todos, setTodos] = useState<any[]>([])
  const [newTodo, setNewTodo] = useState('')

  // Wishlist
  const [wishlistData, setWishlistData] = useState<any[]>([])
  const [showWishlistModal, setShowWishlistModal] = useState(false)
  const [wlName, setWlName] = useState('')
  const [wlPrice, setWlPrice] = useState('')
  const [wlLink, setWlLink] = useState('')

  // Special Dates
  const [specialDates, setSpecialDates] = useState<any[]>([])
  const [newDateTitle, setNewDateTitle] = useState('')
  const [newDateValue, setNewDateValue] = useState('')

  // Locket (Khoảnh khắc)
  const [locketPhotos, setLocketPhotos] = useState<any[]>([])
  const [isUploadingLocket, setIsUploadingLocket] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState<any | null>(null)
  const [showAlbumModal, setShowAlbumModal] = useState(false)
  const [albumFilter, setAlbumFilter] = useState<'all' | 'boyfriend' | 'girlfriend' | 'trash'>('all')

  useEffect(() => {
    if (role !== 'boyfriend' && albumFilter === 'trash') {
      setAlbumFilter('all')
    }
  }, [role, albumFilter])
  const [locketPreviewUrl, setLocketPreviewUrl] = useState<string | null>(null)
  const [locketCaption, setLocketCaption] = useState('')
  const [showLocketPreviewModal, setShowLocketPreviewModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Activity Logs & Info Modal
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [logFilterModule, setLogFilterModule] = useState<string>('all')

  const [pinged, setPinged] = useState(false)
  const channelRef = useRef<any>(null)

  // Love Counter (Bộ đếm thời gian yêu nhau từ 20:00:00 23/09/2022 GMT+7)
  const [loveDuration, setLoveDuration] = useState<{
    days: number;
    time: string;
    years: number;
    months: number;
    calendarDays: number;
  } | null>(null)

  useEffect(() => {
    const START_TIME = new Date('2022-09-23T20:00:00+07:00').getTime()
    const startDate = new Date('2022-09-23T20:00:00+07:00')

    const updateCounter = () => {
      const now = new Date()
      const diff = Math.max(0, now.getTime() - START_TIME)
      const totalSec = Math.floor(diff / 1000)
      const days = Math.floor(totalSec / 86400)
      const hours = String(Math.floor((totalSec % 86400) / 3600)).padStart(2, '0')
      const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
      const seconds = String(totalSec % 60).padStart(2, '0')

      // Tính chính xác quy đổi theo lịch: Năm - Tháng - Ngày
      let years = now.getFullYear() - startDate.getFullYear()
      let months = now.getMonth() - startDate.getMonth()
      let cDays = now.getDate() - startDate.getDate()

      const startHms = startDate.getHours() * 3600 + startDate.getMinutes() * 60 + startDate.getSeconds()
      const nowHms = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
      if (nowHms < startHms) {
        cDays -= 1
      }

      if (cDays < 0) {
        const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
        cDays += prevMonthLastDay
        months -= 1
      }

      if (months < 0) {
        months += 12
        years -= 1
      }

      setLoveDuration({
        days,
        time: `${hours}:${minutes}:${seconds}`,
        years: Math.max(0, years),
        months: Math.max(0, months),
        calendarDays: Math.max(0, cDays)
      })
    }

    updateCounter()
    const interval = setInterval(updateCounter, 1000)
    return () => clearInterval(interval)
  }, [])

  // --- HÀM GỬI THÔNG BÁO ĐẨY WEB PUSH ---
  const sendPushNotification = useCallback(async (title: string, body: string) => {
    if (!partnerId) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    try {
      await fetch('/api/send-ping-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          partner_id: partnerId, 
          sender_name: senderName,
          title,
          body
        })
      })
    } catch (err) {
      console.error('Lỗi gọi API send-ping-push:', err)
    }
  }, [partnerId, role])

  // --- FETCH ACTIVITY LOGS ---
  const fetchActivityLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) console.error('❌ Lỗi lấy Activity Logs:', error)
      else if (data) setActivityLogs(data)
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Activity Logs:', err)
    }
  }, [supabase])

  // --- HÀM GHI NHẬN ACTIVITY LOG ---
  const logActivity = useCallback(async (moduleName: string, actionType: string, description: string) => {
    const currentUser = userRef.current || user
    if (!currentUser) return
    try {
      const currentRole = role || 'boyfriend'
      const logPayload: any = {
        user_id: currentUser.id,
        user_role: currentRole,
        module: moduleName,
        action_type: actionType,
        description: description
      }

      let { error } = await supabase.from('activity_logs').insert([logPayload])

      // Fallback tương thích nếu database cũ dùng 'action' thay vì 'action_type' hoặc 'content' thay vì 'description'
      if (error && (error.message?.includes('column') || error.code === 'PGRST204')) {
        console.warn('Lỗi ghi activity log với schema chuẩn, thử lại fallback:', error.message)
        const fallbackPayload: any = {
          user_id: currentUser.id,
          user_role: currentRole,
          module: moduleName,
          action: actionType,
          content: description
        }
        const retryRes = await supabase.from('activity_logs').insert([fallbackPayload])
        error = retryRes.error
      }

      if (error) {
        console.error('❌ Lỗi ghi activity log:', error)
      } else {
        await fetchActivityLogs()
      }
    } catch (err) {
      console.error('❌ Ngoại lệ ghi activity log:', err)
    }
  }, [fetchActivityLogs, role, supabase, user])

  // --- FETCH DỮ LIỆU ---
  const fetchProfiles = useCallback(async (currentUser: any) => {
    try {
      const { data: profiles, error: pErr } = await supabase.from('profiles').select('*')
      if (pErr) console.error('❌ Lỗi lấy Profiles:', pErr)
      else if (profiles) {
        const myProfile = profiles.find(p => p.id === currentUser.id)
        const otherProfile = profiles.find(p => p.id !== currentUser.id)
        
        if (myProfile) {
          setRole(myProfile.role)
          setMood(myProfile.mood || myProfile.mood_emoji || '😊')
          setStatusMessage(myProfile.status_message || 'Bình thường')
          setMyMoodUpdatedAt(myProfile.updated_at || myProfile.created_at || null)
          setMyLat(myProfile.latitude ?? myProfile.lat ?? null)
          setMyLng(myProfile.longitude ?? myProfile.lng ?? null)
          setMyLocationUpdatedAt(myProfile.updated_at || null)
          setPartnerRole(myProfile.role === 'boyfriend' ? 'girlfriend' : 'boyfriend')
        }
        if (otherProfile) {
          setPartnerId(otherProfile.id)
          setPartnerMood(otherProfile.mood || otherProfile.mood_emoji || '😊')
          setPartnerStatus(otherProfile.status_message || 'Bình thường')
          setPartnerMoodUpdatedAt(otherProfile.updated_at || otherProfile.created_at || null)
          setPartnerLat(otherProfile.latitude ?? otherProfile.lat ?? null)
          setPartnerLng(otherProfile.longitude ?? otherProfile.lng ?? null)
          setPartnerLocationUpdatedAt(otherProfile.updated_at || null)
        }
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Profiles:', err)
    }
  }, [supabase])

  const fetchLoveFund = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('love_fund').select('*').order('created_at', { ascending: false })
      if (error) console.error('❌ Lỗi lấy Love Fund:', error)
      else if (data) {
        setLoveFund(data)
        const total = data.reduce((acc, curr) => curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0)
        setFundTotal(total)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Love Fund:', err)
    }
  }, [supabase])

  const fetchSpecialDates = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('special_dates').select('*').order('event_date', { ascending: true })
      if (error) console.error('❌ Lỗi lấy Special Dates:', error)
      else if (data) setSpecialDates(data)
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Special Dates:', err)
    }
  }, [supabase])

  const fetchWishlist = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('couple_wishlists').select('*').order('created_at', { ascending: false })
      if (error) console.error('❌ Lỗi lấy Wishlist:', error)
      else if (data) setWishlistData(data)
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Wishlist:', err)
    }
  }, [supabase])

  const fetchTodos = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('couple_todos').select('*').order('created_at', { ascending: false })
      if (error) console.error('❌ Lỗi lấy Todos:', error)
      else if (data) setTodos(data)
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Todos:', err)
    }
  }, [supabase])

  const fetchLocketPhotos = useCallback(async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('locket_photos')
        .select('*')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) console.error('❌ Lỗi lấy Locket:', error)
      else if (data) setLocketPhotos(data)
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Locket:', err)
    }
  }, [supabase])


  const fetchUserAndData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)
      await fetchProfiles(user)
      await Promise.all([
        fetchLoveFund(),
        fetchSpecialDates(),
        fetchWishlist(),
        fetchTodos(),
        fetchLocketPhotos(),
        fetchActivityLogs()
      ])
    } catch (err) {
      console.error('❌ Lỗi khởi tạo dữ liệu:', err)
    }
  }, [fetchActivityLogs, fetchLocketPhotos, fetchLoveFund, fetchProfiles, fetchSpecialDates, fetchTodos, fetchWishlist, supabase])

  // --- REALTIME LẮNG NGHE ĐỔI MỚI ---
  useEffect(() => {
    fetchUserAndData()
    const channel = supabase.channel('public-updates')
    
    channel
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchUserAndData()
      })
      .on('broadcast', { event: 'ping' }, (payload) => {
        if (payload.payload?.sender_id !== user?.id) {
          setPinged(true)
          setTimeout(() => setPinged(false), 2000)
        }
      })
      .subscribe()
      
    channelRef.current = channel

    return () => { supabase.removeChannel(channel) }
  }, [fetchUserAndData, supabase, user])

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Trình duyệt không hỗ trợ Web Push Notification.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Bạn đã từ chối cấp quyền thông báo.')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicVapidKey) {
        console.error('Thiếu NEXT_PUBLIC_VAPID_PUBLIC_KEY')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      })

      const { error } = await supabase.from('push_subscriptions').insert([{
        user_id: user.id,
        subscription: subscription.toJSON()
      }])

      if (error) {
        console.error('Lỗi lưu subscription:', error)
        alert('Không thể lưu đăng ký thông báo.')
      } else {
        alert('Đăng ký nhận thông báo thành công!')
      }
    } catch (err) {
      console.error('Lỗi đăng ký Push:', err)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // --- ACTIONS ---

  const saveMood = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    const nowIso = new Date().toISOString()
    try {
      let { error } = await supabase.from('profiles').update({ 
        mood: newMoodIcon,
        status_message: newStatusMsg,
        updated_at: nowIso
      }).eq('id', user.id)
      
      if (error && error.message?.includes('updated_at')) {
        const res = await supabase.from('profiles').update({ 
          mood: newMoodIcon,
          status_message: newStatusMsg 
        }).eq('id', user.id)
        error = res.error
      }

      if (error) {
        console.error('❌ Lỗi cập nhật Tâm trạng:', error)
        alert('Lỗi cập nhật tâm trạng: ' + error.message)
      } else {
        setShowMoodModal(false)
        setMyMoodUpdatedAt(nowIso)
        await fetchProfiles(user)
        await sendPushNotification('Tâm trạng mới 💕', `${senderName} vừa cập nhật tâm trạng: ${newMoodIcon} ${newStatusMsg || 'Bình thường'}`)
        await logActivity('mood', 'update', `${senderName} đổi tâm trạng: ${newMoodIcon} ${newStatusMsg || 'Bình thường'}`)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ cập nhật Tâm trạng:', err)
    }
  }

  const updateLocation = useCallback((isSilent = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (!isSilent) alert('Trình duyệt không hỗ trợ lấy vị trí.')
      return
    }

    const currentUser = userRef.current || user
    if (!currentUser) return

    // Throttle silent sync: Tránh spam nếu vừa lấy trong 20s (trừ khi người dùng bấm thủ công)
    const now = Date.now()
    if (isSilent && now - lastLocationSyncTimeRef.current < 20000) {
      return
    }

    if (isSyncingLocationRef.current) return
    isSyncingLocationRef.current = true

    if (!isSilent) {
      setIsUpdatingLocation(true)
    }

    const currentRole = roleRef.current || role
    const senderName = currentRole === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const nowIso = new Date().toISOString()
        lastLocationSyncTimeRef.current = Date.now()

        try {
          let { error } = await supabase.from('profiles').update({ 
            latitude: lat, 
            longitude: lng,
            updated_at: nowIso
          }).eq('id', currentUser.id)
          
          if (error && error.message?.includes('updated_at')) {
            const res = await supabase.from('profiles').update({ 
              latitude: lat, 
              longitude: lng 
            }).eq('id', currentUser.id)
            error = res.error
          }

          if (error) {
            console.error('❌ Lỗi lưu vị trí:', error)
          } else {
            setMyLat(lat)
            setMyLng(lng)
            setMyLocationUpdatedAt(nowIso)

            // Khi bấm thủ công thì gửi push notification và ghi activity log
            if (!isSilent) {
              await sendPushNotification('Vị trí mới 📍', `${senderName} vừa cập nhật vị trí mới`)
              await logActivity('location', 'update', `${senderName} cập nhật vị trí (${lat.toFixed(3)}, ${lng.toFixed(3)})`)
            }
          }
        } catch (err) {
          console.error('❌ Lỗi ngoại lệ lưu vị trí:', err)
        } finally {
          isSyncingLocationRef.current = false
          setIsUpdatingLocation(false)
        }
      },
      (err) => {
        console.error('Lỗi lấy vị trí:', err)
        if (!isSilent) {
          alert('Không thể lấy vị trí. Hãy bật Quyền truy cập vị trí.')
        }
        isSyncingLocationRef.current = false
        setIsUpdatingLocation(false)
      },
      { 
        enableHighAccuracy: !isSilent, 
        timeout: isSilent ? 10000 : 15000, 
        maximumAge: isSilent ? 60000 : 0 
      }
    )
  }, [logActivity, role, sendPushNotification, supabase, user])

  // --- TỰ ĐỘNG CẬP NHẬT VỊ TRÍ NGẦM (SILENT AUTO-SYNC) ---
  useEffect(() => {
    if (!user?.id) return

    // 1. Chạy ngay khi mở ứng dụng (component mount / auth ready)
    updateLocation(true)

    // 2. Lắng nghe visibilitychange và window.focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateLocation(true)
      }
    }

    const handleFocus = () => {
      updateLocation(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user?.id, updateLocation])

  const handleOpenFundForm = (type: 'Thu' | 'Chi') => {
    if (showFundForm && fundType === type) {
      setShowFundForm(false)
    } else {
      setFundType(type)
      setShowFundForm(true)
    }
  }

  const addLoveFund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fundAmount || !fundReason) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    try {
      const mappedType = fundType === 'Thu' ? 'income' : 'expense'
      let { error } = await supabase.from('love_fund').insert([{
        user_id: user?.id || null,
        user_role: role,
        amount: Number(fundAmount),
        reason: fundReason,
        note: fundReason,
        type: mappedType
      }])

      if (error && (error.message?.includes('column') || error.code === 'PGRST204')) {
        const retryRes = await supabase.from('love_fund').insert([{
          amount: Number(fundAmount),
          reason: fundReason,
          type: mappedType
        }])
        error = retryRes.error
      }
      if (error) console.error('❌ Lỗi thêm Love Fund:', error)
      else {
        setShowFundForm(false)
        const amtStr = Number(fundAmount).toLocaleString('vi-VN')
        setFundAmount('')
        setFundReason('')
        await fetchLoveFund()
        await sendPushNotification('Quỹ tình yêu 💰', `${senderName} đã ${mappedType === 'income' ? 'đóng góp' : 'chi'} ${amtStr}₫: ${fundReason}`)
        await logActivity('love_fund', 'create', `${senderName} đã ${mappedType === 'income' ? 'đóng góp' : 'chi tiêu'} ${amtStr}₫: ${fundReason}`)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ thêm Love Fund:', err)
    }
  }

  const deleteLoveFund = async (id: string, reason: string) => {
    if (!confirm('Xóa khoản này?')) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    try {
      const { error } = await supabase.from('love_fund').delete().eq('id', id)
      if (error) console.error('❌ Lỗi xóa Love Fund:', error)
      else {
        await fetchLoveFund()
        await logActivity('love_fund', 'delete', `${senderName} đã xóa khoản: "${reason}"`)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ xóa Love Fund:', err)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    const todoText = newTodo
    try {
      const { error } = await supabase.from('couple_todos').insert([{ title: todoText, is_completed: false }])
      if (error) console.error('❌ Lỗi thêm Todo:', error)
      else {
        setNewTodo('')
        await fetchTodos()
        await sendPushNotification('To-do mới 📝', `${senderName} đã thêm việc mới: ${todoText}`)
        await logActivity('todos', 'create', `${senderName} thêm việc: "${todoText}"`)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ thêm Todo:', err)
    }
  }

  const toggleTodo = async (id: string, currentStatus: boolean, title: string) => {
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    try {
      const { error } = await supabase.from('couple_todos').update({ is_completed: !currentStatus }).eq('id', id)
      if (error) console.error('❌ Lỗi cập nhật Todo:', error)
      else {
        await fetchTodos()
        await logActivity('todos', 'update', `${senderName} đã ${!currentStatus ? 'hoàn thành' : 'đánh dấu chưa xong'}: "${title}"`)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ cập nhật Todo:', err)
    }
  }

  const deleteTodo = async (id: string, title: string) => {
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    try {
      const { error } = await supabase.from('couple_todos').delete().eq('id', id)
      if (error) console.error('❌ Lỗi xóa Todo:', error)
      else {
        await fetchTodos()
        await logActivity('todos', 'delete', `${senderName} đã xóa việc: "${title}"`)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ xóa Todo:', err)
    }
  }

  const addWishlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wlName || !user || !role) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    const itemName = wlName.trim()
    const itemPrice = wlPrice ? Number(wlPrice) : null
    const itemLink = wlLink ? wlLink.trim() : null
    const userRole = role

    const payload: any = {
      user_id: user.id,
      title: itemName,
      item_name: itemName,
      price: itemPrice,
      price_estimate: itemPrice,
      estimated_price: itemPrice,
      link: itemLink,
      link_url: itemLink,
      url: itemLink,
      owner_role: userRole,
      is_bought: false
    }

    try {
      let { error } = await supabase.from('couple_wishlists').insert([payload])

      // Fallback nếu schema DB chỉ có các cột cơ bản
      if (error && (error.message?.includes('column') || error.code === 'PGRST204')) {
        console.warn('Lỗi thêm Wishlist với payload đầy đủ, thử lại fallback:', error.message)
        const fallbackPayload = {
          user_id: user.id,
          title: itemName,
          item_name: itemName,
          price: itemPrice,
          link: itemLink,
          owner_role: userRole,
          is_bought: false
        }
        const retryRes = await supabase.from('couple_wishlists').insert([fallbackPayload])
        error = retryRes.error
      }

      if (error) {
        console.error('❌ Lỗi thêm Wishlist:', error)
        alert(`Lỗi khi thêm Wishlist: ${error.message}`)
      } else {
        setShowWishlistModal(false)
        setWlName('')
        setWlPrice('')
        setWlLink('')
        await fetchWishlist()
        await sendPushNotification('Wishlist mới 🎁', `${senderName} đã thêm mong ước mới: ${itemName}`)
        await logActivity('wishlist', 'create', `${senderName} thêm ước muốn: "${itemName}"`)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ thêm Wishlist:', err)
    }
  }

  const toggleWishlistBought = async (id: string, currentStatus: boolean, itemName: string) => {
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    try {
      const { error } = await supabase.from('couple_wishlists').update({ is_bought: !currentStatus }).eq('id', id)
      if (error) console.error('❌ Lỗi cập nhật Wishlist:', error)
      else {
        await fetchWishlist()
        await logActivity('wishlist', 'update', `${senderName} đánh dấu ${!currentStatus ? 'đã mua' : 'chưa mua'}: "${itemName}"`)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ cập nhật Wishlist:', err)
    }
  }

  const deleteWishlist = async (id: string, itemName: string) => {
    if (!confirm('Xóa món quà này?')) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    try {
      const { error } = await supabase.from('couple_wishlists').delete().eq('id', id)
      if (error) console.error('❌ Lỗi xóa Wishlist:', error)
      else {
        await fetchWishlist()
        await logActivity('wishlist', 'delete', `${senderName} xóa món ước: "${itemName}"`)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ xóa Wishlist:', err)
    }
  }

  const addDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDateTitle || !newDateValue) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    const title = newDateTitle
    try {
      const { error } = await supabase.from('special_dates').insert([{ 
        title: newDateTitle, 
        event_date: newDateValue 
      }])
      if (error) console.error('❌ Lỗi thêm Special Date:', error)
      else {
        setNewDateTitle('')
        setNewDateValue('')
        await fetchSpecialDates()
        await sendPushNotification('Ngày quan trọng 📅', `${senderName} đã thêm ngày quan trọng: ${title}`)
        await logActivity('special_dates', 'create', `${senderName} thêm ngày kỷ niệm: "${title}" (${newDateValue})`)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ thêm Special Date:', err)
    }
  }

  const deleteDate = async (id: string, title: string) => {
    if (!confirm('Xóa ngày này?')) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    try {
      const { error } = await supabase.from('special_dates').delete().eq('id', id)
      if (error) console.error('❌ Lỗi xóa Special Date:', error)
      else {
        await fetchSpecialDates()
        await logActivity('special_dates', 'delete', `${senderName} xóa ngày kỷ niệm: "${title}"`)
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ xóa Special Date:', err)
    }
  }

  // --- TỰ ĐỘNG DỌN DẸP ẢNH LOCKET CŨ HƠN 7 NGÀY ---
  const cleanupOldLocketPhotos = async () => {
    try {
      fetch('/api/locket/cleanup', { method: 'POST' }).catch(err => {
        console.error('Lỗi gọi API dọn dẹp Locket 7 ngày:', err)
      })
    } catch (err) {
      console.error('Ngoại lệ khi dọn dẹp ảnh cũ:', err)
    }
  }

  // --- LOCKET UPLOAD: BƯỚC 1 CHỌN ẢNH ĐỂ XEM TRƯỚC VÀ NHẬP CAPTION ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setLocketPreviewUrl(event.target?.result as string)
      setLocketCaption('')
      setShowLocketPreviewModal(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsDataURL(file)
  }

  // --- LOCKET UPLOAD: BƯỚC 2 XÁC NHẬN GỬI ẢNH KÈM CAPTION ---
  const handleConfirmUploadLocket = async () => {
    if (!locketPreviewUrl || !user) return
    setIsUploadingLocket(true)
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    const finalCaption = locketCaption.trim()

    try {
      // 1. Nén ảnh qua tiện ích Canvas chuyên dụng:
      // - Resize chiều dài nhất về tối đa 1080px
      // - Định dạng image/jpeg với initial quality: 0.7
      // - Kiểm tra dung lượng đầu ra: nếu > 150KB thì nén tiếp về quality: 0.5 (< 150KB)
      const compressionResult = await compressImage(locketPreviewUrl, {
        maxDimension: 1080,
        initialQuality: 0.7,
        fallbackQuality: 0.5,
        maxSizeBytes: 150 * 1024,
        format: 'image/jpeg'
      })

      const blob = compressionResult.blob

      // 2. Upload Blob nhị phân vào bucket Storage 'locket' với cacheControl: '31536000' (1 năm)
      const fileName = `${user.id}-${Date.now()}.jpg`
      const { data: storageData, error: storageErr } = await supabase.storage.from('locket').upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: true
      })

      if (storageErr || !storageData) {
        console.error('Lỗi upload storage:', storageErr)
        throw new Error(`Lỗi tải ảnh lên Storage (${storageErr?.message || 'Không xác định'}). Vui lòng kiểm tra bucket "locket" trên Supabase!`)
      }

      // 3. Lấy Public URL ngắn từ Storage
      const { data: pubData } = supabase.storage.from('locket').getPublicUrl(fileName)
      const finalUrl = pubData?.publicUrl

      // 4. BỘ LỌC KIỂM TRA (VALIDATOR): Chặn đứng ngay lập tức nếu phát hiện chuỗi Base64
      validateStoragePhotoUrl(finalUrl)

      // 5. CHỈ lưu link URL ngắn vào bảng locket_photos
      const { error: dbErr } = await supabase.from('locket_photos').insert([{
        user_id: user.id,
        user_role: role,
        photo_url: finalUrl,
        caption: finalCaption,
        is_deleted: false
      }])

      if (dbErr) {
        console.error('❌ Lỗi lưu locket photo:', dbErr)
        alert('Lỗi lưu ảnh: ' + dbErr.message)
      } else {
        setShowLocketPreviewModal(false)
        setLocketPreviewUrl(null)
        setLocketCaption('')
        await cleanupOldLocketPhotos()
        await fetchLocketPhotos()

        // 6. Tự động đồng bộ bản sao sang Google Drive thư mục "Stuff" ở chế độ nền (không làm gián đoạn UI)
        fetch('/api/backup-to-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoUrl: finalUrl,
            role: role,
            caption: finalCaption
          })
        }).catch(driveErr => {
          console.error('Lỗi sao lưu ngầm sang Google Drive:', driveErr)
        })

        if (finalCaption) {
          await sendPushNotification('Khoảnh khắc mới 📸', `${senderName} vừa gửi khoảnh khắc: ${finalCaption}`)
          await logActivity('locket', 'create', `${senderName} đăng khoảnh khắc: "${finalCaption}"`)
        } else {
          await sendPushNotification('Khoảnh khắc mới 📸', `${senderName} vừa gửi một khoảnh khắc ảnh mới`)
          await logActivity('locket', 'create', `${senderName} đăng một khoảnh khắc ảnh mới`)
        }
      }
    } catch (err: any) {
      console.error('Lỗi nén và lưu ảnh:', err)
      alert('Lỗi xử lý ảnh: ' + (err?.message || 'Không xác định'))
    } finally {
      setIsUploadingLocket(false)
    }
  }

  // --- XÓA ẢNH LOCKET (XÓA MỀM - SOFT DELETE) ---
  const deleteLocketPhoto = async (photo: any) => {
    if (!photo || !confirm('Chuyển ảnh khoảnh khắc này vào thùng rác?')) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    try {
      // Cập nhật trạng thái is_deleted: true thay vì xóa vĩnh viễn
      const { error } = await supabase
        .from('locket_photos')
        .update({ is_deleted: true })
        .eq('id', photo.id)

      if (error) {
        console.error('Lỗi chuyển ảnh vào thùng rác:', error)
        alert('Không thể xóa ảnh: ' + error.message)
      } else {
        if (viewingPhoto && viewingPhoto.id === photo.id) {
          setViewingPhoto(null)
        }
        await fetchLocketPhotos()
        await logActivity('locket', 'delete', `${senderName} đã chuyển một ảnh vào thùng rác`)
      }
    } catch (err: any) {
      console.error('Ngoại lệ khi xóa ảnh:', err)
    }
  }

  // --- KHÔI PHỤC ẢNH LOCKET TỪ THÙNG RÁC ---
  const restoreLocketPhoto = async (photo: any) => {
    if (!photo) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    try {
      const { error } = await supabase
        .from('locket_photos')
        .update({ is_deleted: false })
        .eq('id', photo.id)

      if (error) {
        console.error('Lỗi khôi phục ảnh:', error)
        alert('Không thể khôi phục ảnh: ' + error.message)
      } else {
        if (viewingPhoto && viewingPhoto.id === photo.id) {
          setViewingPhoto({ ...viewingPhoto, is_deleted: false })
        }
        await fetchLocketPhotos()
        await logActivity('locket', 'restore', `${senderName} đã khôi phục một ảnh từ thùng rác`)
      }
    } catch (err: any) {
      console.error('Ngoại lệ khi khôi phục ảnh:', err)
    }
  }

  const handlePing = async () => {
    if (!user) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    setPinged(true)
    setTimeout(() => setPinged(false), 2000)

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'ping',
        payload: { sender_id: user.id }
      })
    }

    await sendPushNotification('Ting ting! 💖', `${senderName} vừa Ping bạn kìa!`)
    await logActivity('ping', 'ping', `${senderName} vừa bấm Ping yêu thương`)
  }

  // Mở modal Lịch sử hoạt động cho từng module
  const openActivityModal = (moduleKey: string) => {
    setLogFilterModule(moduleKey)
    setShowActivityModal(true)
  }

  const getModuleTitle = (mod: string) => {
    switch (mod) {
      case 'mood': return 'Tâm trạng'
      case 'location': return 'Vị trí'
      case 'ping': return 'Ping yêu thương'
      case 'special_dates': return 'Ngày quan trọng'
      case 'love_fund': return 'Quỹ tình yêu'
      case 'todos': return 'To-do chung'
      case 'wishlist': return 'Wishlist'
      case 'locket': return 'Khoảnh khắc'
      default: return 'Tất cả'
    }
  }

  const myWishlist = wishlistData.filter(w => user && (w.user_id === user.id || (w.owner_role && w.owner_role === role)))
  const partnerWishlistData = wishlistData.filter(w => user && (w.user_id ? w.user_id !== user.id : (w.owner_role && w.owner_role !== role)))

  // Tách riêng ảnh còn hiệu lực (active) và ảnh đã xóa mềm (trash) trong vòng 7 ngày
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const activeLocketPhotos = locketPhotos.filter(p => {
    if (p.is_deleted) return false
    const createdAtTime = new Date(p.created_at).getTime()
    return isNaN(createdAtTime) || (Date.now() - createdAtTime <= sevenDaysMs)
  })
  const deletedLocketPhotos = locketPhotos.filter(p => {
    if (!p.is_deleted) return false
    const createdAtTime = new Date(p.created_at).getTime()
    return isNaN(createdAtTime) || (Date.now() - createdAtTime <= sevenDaysMs)
  })
  const latestLocketPhoto = activeLocketPhotos.length > 0 ? activeLocketPhotos[0] : null

  // Bộ lọc ảnh cho Album Locket (hỗ trợ lọc Tất cả, Bạn Trai, Bạn Gái trong 7 ngày, và Thùng rác 7 ngày cho Bạn Trai)
  const filteredAlbumPhotos = locketPhotos.filter(p => {
    const createdAtTime = new Date(p.created_at).getTime()
    const isWithin7Days = isNaN(createdAtTime) || (Date.now() - createdAtTime <= sevenDaysMs)
    if (!isWithin7Days) return false

    if (albumFilter === 'trash') {
      // Phân quyền: Chỉ Bạn Trai mới được xem thùng rác
      if (role !== 'boyfriend') return false
      return p.is_deleted === true
    }
    if (p.is_deleted) return false // Các tab thông thường chỉ hiển thị ảnh chưa xóa (active)
    if (albumFilter === 'boyfriend') return p.user_role === 'boyfriend'
    if (albumFilter === 'girlfriend') return p.user_role === 'girlfriend'
    return true
  })

  // Location logic
  const mapLat = partnerLat || myLat || 21.028511
  const mapLng = partnerLng || myLng || 105.804817

  const filteredLogs = logFilterModule === 'all' 
    ? activityLogs 
    : activityLogs.filter(log => log.module === logFilterModule)

  return (
    <div className="min-h-screen bg-pink-50 p-4 pb-20 font-sans text-gray-800 relative">
      
      {/* HEADER */}
      <header className="mb-6 mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-pink-600 tracking-tight leading-none">ppaevol 💖</h1>
            <span className="text-[11px] text-gray-500 font-medium">
              ({role === 'boyfriend' ? 'Bạn Trai' : role === 'girlfriend' ? 'Bạn Gái' : 'Đang tải...'})
            </span>
          </div>

          {/* Love Counter Pills */}
          {loveDuration && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Nhãn 1: Tổng số ngày & Đồng hồ thời gian thực */}
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/90 border border-pink-200 shadow-sm backdrop-blur-md text-pink-600 text-[11px] sm:text-xs font-semibold">
                <span className="inline-block animate-pulse text-xs">💕</span>
                <span className="whitespace-nowrap flex items-center gap-1">
                  <span className="font-mono tabular-nums font-bold text-pink-700">{loveDuration.days}</span>
                  <span>ngày</span>
                  <span className="text-pink-300">•</span>
                  <span className="font-mono tabular-nums font-bold text-pink-700 tracking-wider">{loveDuration.time}</span>
                </span>
              </div>

              {/* Nhãn 2: Quy đổi chính xác Năm - Tháng - Ngày */}
              <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-pink-100/80 border border-pink-200/90 shadow-sm backdrop-blur-md text-pink-700 text-[11px] sm:text-xs font-medium whitespace-nowrap">
                <span className="text-xs">✨</span>
                <span>
                  <strong className="font-bold">{loveDuration.years}</strong> năm{' '}
                  <strong className="font-bold">{loveDuration.months}</strong> tháng{' '}
                  <strong className="font-bold">{loveDuration.calendarDays}</strong> ngày
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button 
            onClick={() => openActivityModal('all')} 
            className="rounded-full bg-white p-2 text-gray-500 shadow-sm transition-colors hover:text-pink-600" 
            title="Lịch sử hoạt động chung"
          >
            <Clock size={20} />
          </button>
          <button onClick={subscribeToPush} className="rounded-full bg-white p-2 text-pink-400 shadow-sm transition-colors hover:text-pink-600" title="Bật thông báo">
            <BellRing size={20} />
          </button>
          <button onClick={handleLogout} className="rounded-full bg-white p-2 text-gray-400 shadow-sm transition-colors hover:text-red-500" title="Đăng xuất">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        
        {/* 1. NỬA KIA MOOD */}
        <div className="col-span-2 sm:col-span-1 flex flex-col justify-between rounded-3xl bg-blue-50 p-5 shadow-sm border border-blue-100 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-blue-800">
                {partnerRole === 'boyfriend' ? 'Bạn Trai' : partnerRole === 'girlfriend' ? 'Bạn Gái' : 'Nửa kia'}
              </h2>
              <button 
                onClick={() => openActivityModal('mood')} 
                className="text-blue-400 hover:text-blue-600 p-0.5 rounded-full" 
                title="Lịch sử tâm trạng"
              >
                <Info size={14} />
              </button>
            </div>
            <div className="rounded-full bg-blue-200 p-2 text-xl">
              {partnerMood}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-blue-900 line-clamp-2">{partnerStatus}</p>
            <div className="mt-1 flex items-center justify-between text-[10px] text-blue-500/80">
              <span>Cảm xúc hiện tại</span>
              {partnerMoodUpdatedAt && (
                <span className="font-medium text-blue-600">Cập nhật lúc {format24h(partnerMoodUpdatedAt)}</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. LOCATION (BẢN ĐỒ) */}
        <div className="col-span-2 flex flex-col rounded-3xl bg-white p-5 shadow-sm overflow-hidden h-48 relative group">
          <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no" 
            marginHeight={0} 
            marginWidth={0} 
            src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&hl=vi&z=14&output=embed`}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          ></iframe>
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col justify-between h-full pointer-events-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/70 px-2 py-1 rounded-lg backdrop-blur-sm">
                  <h2 className="text-sm font-bold text-gray-800">Vị trí nửa kia</h2>
                  <button 
                    onClick={() => openActivityModal('location')} 
                    className="text-gray-500 hover:text-blue-600 pointer-events-auto p-0.5" 
                    title="Lịch sử vị trí"
                  >
                    <Info size={13} />
                  </button>
                </div>
                <a 
                  href={`https://www.google.com/maps?q=${mapLat},${mapLng}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="bg-white/80 backdrop-blur-sm text-blue-600 px-2 py-1 rounded-lg text-[10px] font-bold pointer-events-auto shadow-sm hover:bg-white transition-colors"
                >
                  Mở Google Maps
                </a>
              </div>
              <div className="rounded-full bg-blue-100 p-2 text-blue-500 shadow-sm bg-white/80 backdrop-blur-sm">
                <MapPin size={20} />
              </div>
            </div>
            
            <div className="flex items-center justify-between pointer-events-auto mt-auto">
              <div className="bg-white/85 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-sm flex flex-col gap-0.5 border border-white/60">
                <span className="text-[10px] text-gray-600 font-medium">
                  Bạn: {myLat ? `${myLat.toFixed(3)}, ${myLng?.toFixed(3)}` : 'Đang lấy vị trí...'}
                  {myLocationUpdatedAt && (
                    <span className="text-[9px] text-gray-400 ml-1">({format24h(myLocationUpdatedAt)})</span>
                  )}
                </span>
                {partnerLocationUpdatedAt ? (
                  <span className="text-[10px] text-blue-600 font-bold">
                    Cập nhật lúc {format24h(partnerLocationUpdatedAt)}
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-400 italic">Nửa kia chưa có vị trí</span>
                )}
              </div>
              <button 
                onClick={() => updateLocation(false)} 
                disabled={isUpdatingLocation}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-blue-600 hover:text-blue-700 hover:bg-white shadow-sm border border-blue-100 active:scale-90 transition-all disabled:opacity-50"
                title="Làm mới vị trí"
              >
                <RotateCw size={14} className={isUpdatingLocation ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. PING */}
        <div className="col-span-1 relative">
          <button 
            onClick={() => openActivityModal('ping')} 
            className="absolute top-2 right-2 z-10 text-pink-400 hover:text-pink-600 p-1 rounded-full bg-white/50 backdrop-blur-sm"
            title="Lịch sử Ping"
          >
            <Info size={14} />
          </button>
          <div 
            onClick={handlePing}
            className={`h-full flex cursor-pointer flex-col items-center justify-center rounded-3xl p-5 shadow-sm transition-all active:scale-90 ${pinged ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-500'}`}
          >
            <Heart size={32} className={pinged ? 'animate-ping' : ''} fill={pinged ? 'white' : 'currentColor'} />
            <span className="mt-2 text-xs font-semibold">{pinged ? 'Đã Ping!' : 'Ping'}</span>
          </div>
        </div>

        {/* 4. CỦA BẠN MOOD */}
        <div className="col-span-1 flex flex-col justify-between rounded-3xl bg-yellow-100 p-5 shadow-sm active:scale-95 transition-transform relative">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => openActivityModal('mood')} 
              className="text-yellow-600 hover:text-yellow-800 p-0.5 rounded-full" 
              title="Lịch sử tâm trạng"
            >
              <Info size={14} />
            </button>
            <div 
              onClick={() => {
                setNewMoodIcon(mood)
                setNewStatusMsg(statusMessage !== 'Bình thường' && statusMessage !== 'Đang tải...' ? statusMessage : '')
                setShowMoodModal(true)
              }}
              className="rounded-full bg-yellow-200 p-2 text-xl cursor-pointer hover:scale-110 transition-transform"
            >
              {mood}
            </div>
          </div>
          <div 
            onClick={() => {
              setNewMoodIcon(mood)
              setNewStatusMsg(statusMessage !== 'Bình thường' && statusMessage !== 'Đang tải...' ? statusMessage : '')
              setShowMoodModal(true)
            }}
            className="mt-4 cursor-pointer"
          >
            <p className="text-sm font-medium text-yellow-800 line-clamp-2">{statusMessage}</p>
            <div className="mt-1 flex flex-col text-[10px] text-yellow-600/80">
              <span>Tâm trạng của bạn</span>
              {myMoodUpdatedAt && (
                <span className="font-bold text-yellow-700">Cập nhật lúc {format24h(myMoodUpdatedAt)}</span>
              )}
            </div>
          </div>
        </div>

        {/* 5. NGÀY QUAN TRỌNG */}
        <div className="col-span-2 flex flex-col rounded-3xl bg-purple-100 p-5 shadow-sm max-h-72">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-purple-800">Ngày quan trọng</h2>
              <button 
                onClick={() => openActivityModal('special_dates')} 
                className="text-purple-400 hover:text-purple-700 p-0.5 rounded-full" 
                title="Lịch sử ngày quan trọng"
              >
                <Info size={14} />
              </button>
            </div>
            <div className="rounded-full bg-purple-200 p-2 text-purple-600">
              <CalendarDays size={20} />
            </div>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto hide-scrollbar mb-3">
            {specialDates.map(date => (
              <div key={date.id} className="flex justify-between items-center text-sm bg-white/60 p-2 rounded-xl">
                <div>
                  <span className="font-medium text-purple-900">{date.title}</span>
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <span>{new Date(date.event_date).toLocaleDateString('vi-VN')}</span>
                    {date.created_at && (
                      <span className="text-[10px] text-purple-500/80">(Lúc {format24h(date.created_at)})</span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteDate(date.id, date.title)} className="text-purple-400 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            ))}
            {specialDates.length === 0 && <p className="text-xs text-purple-600 italic">Chưa có ngày nào</p>}
          </div>

          <form onSubmit={addDate} className="flex gap-2 mt-auto">
            <input type="text" value={newDateTitle} onChange={e => setNewDateTitle(e.target.value)} placeholder="Tên sự kiện" className="w-1/2 rounded-lg p-1.5 text-xs outline-none bg-white/80" required />
            <input type="date" value={newDateValue} onChange={e => setNewDateValue(e.target.value)} className="w-1/2 rounded-lg p-1.5 text-xs outline-none bg-white/80" required />
            <button type="submit" className="bg-purple-500 text-white px-2.5 py-1 rounded-lg hover:bg-purple-600"><Plus size={16}/></button>
          </form>
        </div>

        {/* 6. MODULE: KHOẢNH KHẮC (LOCKET) */}
        <div className="col-span-2 sm:col-span-1 md:col-span-1 md:col-start-4 md:row-start-2 md:row-span-2 flex flex-col justify-between rounded-3xl bg-amber-50 p-5 shadow-sm border border-amber-100 relative group md:h-full md:max-h-none">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-amber-800">Khoảnh khắc 📸</h2>
              <button 
                onClick={() => openActivityModal('locket')} 
                className="text-amber-500 hover:text-amber-700 p-0.5 rounded-full" 
                title="Lịch sử hoạt động Locket"
              >
                <Info size={14} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowAlbumModal(true)} 
                className="rounded-full bg-amber-100 p-1.5 text-amber-700 hover:bg-amber-200 transition-colors shadow-sm"
                title="Album khoảnh khắc (Bộ sưu tập)"
              >
                <Images size={17} />
              </button>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploadingLocket}
                className="rounded-full bg-amber-200 p-1.5 text-amber-700 hover:bg-amber-300 transition-colors shadow-sm disabled:opacity-50"
                title="Chụp / Gửi ảnh mới"
              >
                <Camera size={17} />
              </button>
            </div>
          </div>

          {/* Nội dung ảnh */}
          <div className="flex-1 flex flex-col justify-center items-center overflow-hidden my-2 min-h-0">
            {latestLocketPhoto ? (
              <div 
                className="relative w-full aspect-[4/5] max-h-[340px] md:max-h-[460px] rounded-2xl overflow-hidden group/img cursor-pointer shadow-sm border border-amber-200/60 bg-amber-100/50" 
                onClick={() => setViewingPhoto(latestLocketPhoto)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={latestLocketPhoto.photo_url} 
                  alt="Khoảnh khắc" 
                  className="w-full h-full object-cover transition-transform group-hover/img:scale-105 duration-300" 
                />

                {/* Thanh Caption dạng viên thuốc mờ (Glassmorphism Pill) chuẩn phong cách Locket */}
                {latestLocketPhoto.caption && latestLocketPhoto.caption.trim() !== '' && (
                  <div className="absolute bottom-2.5 inset-x-2 flex justify-center pointer-events-none z-10">
                    <div className="bg-black/55 backdrop-blur-md text-white border border-white/20 px-3.5 py-1 rounded-full text-xs font-medium text-center line-clamp-2 max-w-[92%] shadow-lg">
                      {latestLocketPhoto.caption}
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2.5 text-white z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setViewingPhoto(latestLocketPhoto); }}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors"
                    title="Xem phóng to"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteLocketPhoto(latestLocketPhoto); }}
                    className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-600 backdrop-blur-sm transition-colors text-white"
                    title="Xóa ảnh này"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/5] max-h-[340px] md:max-h-[460px] rounded-2xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-amber-100/50 transition-colors bg-white/40"
              >
                <div className="rounded-full bg-amber-100 p-3 text-amber-500 mb-2 shadow-sm">
                  <Camera size={28} />
                </div>
                <span className="text-xs font-semibold text-amber-800">Chưa có ảnh nào</span>
                <span className="text-[10px] text-amber-600 mt-1">Chạm để chụp hoặc gửi ảnh 📸</span>
              </div>
            )}
          </div>

          {/* Thông tin thời gian */}
          <div className="mt-1 flex items-center justify-between text-[11px] text-amber-700 font-medium flex-shrink-0">
            {isUploadingLocket ? (
              <span className="text-amber-600 animate-pulse font-bold">Đang tải ảnh lên...</span>
            ) : latestLocketPhoto ? (
              <>
                <span className="text-amber-800 font-bold truncate">
                  {latestLocketPhoto.user_role === 'boyfriend' ? '👦🏻 Bạn Trai' : latestLocketPhoto.user_role === 'girlfriend' ? '👧🏻 Bạn Gái' : 'Nửa kia'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-600">
                    Đăng lúc {format24h(latestLocketPhoto.created_at)}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteLocketPhoto(latestLocketPhoto); }} 
                    className="text-amber-400 hover:text-red-500 p-0.5 rounded transition-colors" 
                    title="Xóa ảnh này"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            ) : (
              <span className="text-[10px] text-amber-500">Gửi ảnh locket ngay</span>
            )}
          </div>
        </div>

        {/* 7. LOVE FUND */}
        <div className="col-span-2 sm:col-span-1 md:col-span-1 flex flex-col rounded-3xl bg-green-100 p-5 shadow-sm max-h-72">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-green-800">Love Fund</h2>
              <button 
                onClick={() => openActivityModal('love_fund')} 
                className="text-green-500 hover:text-green-700 p-0.5 rounded-full" 
                title="Lịch sử Quỹ"
              >
                <Info size={14} />
              </button>
            </div>
            {/* 2 Nút riêng biệt: + (Thu màu xanh) và - (Chi màu đỏ) */}
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={() => handleOpenFundForm('Thu')}
                className={`rounded-full p-1.5 transition-all shadow-sm ${showFundForm && fundType === 'Thu' ? 'bg-green-600 text-white scale-105' : 'bg-green-200 text-green-700 hover:bg-green-300'}`}
                title="Thêm khoản thu (+)"
              >
                <Plus size={15} />
              </button>
              <button 
                type="button"
                onClick={() => handleOpenFundForm('Chi')}
                className={`rounded-full p-1.5 transition-all shadow-sm ${showFundForm && fundType === 'Chi' ? 'bg-red-500 text-white scale-105' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                title="Ghi nhận chi tiêu (-)"
              >
                <Minus size={15} />
              </button>
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-2xl font-bold text-green-700 truncate">{fundTotal.toLocaleString('vi-VN')}<span className="text-lg font-medium text-green-600/80"> ₫</span></p>
          </div>

          {showFundForm ? (
            <form onSubmit={addLoveFund} className={`flex flex-col gap-2 p-2.5 rounded-2xl mb-2 transition-colors border shadow-sm ${fundType === 'Thu' ? 'bg-green-50/90 border-green-200' : 'bg-red-50/90 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${fundType === 'Thu' ? 'text-green-700' : 'text-red-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${fundType === 'Thu' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {fundType === 'Thu' ? 'Khoản thu (+)' : 'Khoản chi (-)'}
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowFundForm(false)} 
                  className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-black/5 transition-colors"
                  title="Đóng form"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={fundAmount} 
                  onChange={e => setFundAmount(e.target.value)} 
                  placeholder="Số tiền..." 
                  className="w-full rounded-xl p-1.5 text-xs outline-none bg-white border border-gray-200 focus:border-green-400 font-medium" 
                  required 
                  autoFocus
                />
              </div>

              <div className="flex gap-1.5">
                <input 
                  type="text" 
                  value={fundReason} 
                  onChange={e => setFundReason(e.target.value)} 
                  placeholder={fundType === 'Thu' ? 'Lý do thu...' : 'Lý do chi...'} 
                  className="w-full min-w-0 rounded-xl p-1.5 text-xs outline-none bg-white border border-gray-200 focus:border-green-400" 
                  required 
                />
                <button 
                  type="submit" 
                  className={`text-white px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm transition-colors flex-shrink-0 ${fundType === 'Thu' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {fundType === 'Thu' ? 'Lưu' : 'Lưu'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-1 space-y-1.5 overflow-y-auto hide-scrollbar">
              {loveFund.map(fund => (
                <div key={fund.id} className="flex justify-between items-center text-xs bg-white/60 p-2 rounded-xl">
                  <div className="flex flex-col truncate flex-1 min-w-0 mr-1.5">
                    <span className="truncate text-green-900 font-medium">{fund.reason}</span>
                    <span className="text-[9px] text-green-700/80">{formatDateTime24h(fund.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`font-bold text-xs whitespace-nowrap ${fund.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {fund.type === 'income' ? '+' : '-'}{Number(fund.amount).toLocaleString('vi-VN')}
                    </span>
                    <button onClick={() => deleteLoveFund(fund.id, fund.reason)} className="text-gray-400 hover:text-red-500 p-0.5"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 8. TODOS */}
        <div className="col-span-2 sm:col-span-1 md:col-span-1 flex flex-col rounded-3xl bg-white p-5 shadow-sm max-h-72">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-gray-600">To-do chung</h2>
              <button 
                onClick={() => openActivityModal('todos')} 
                className="text-gray-400 hover:text-orange-500 p-0.5 rounded-full" 
                title="Lịch sử To-do"
              >
                <Info size={14} />
              </button>
            </div>
            <div className="rounded-full bg-orange-100 p-2 text-orange-500">
              <CheckSquare size={20} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2 mb-3">
            {todos.map(todo => (
              <div key={todo.id} className="flex items-center justify-between group">
                <label className="flex items-start gap-2 cursor-pointer w-full">
                  <input type="checkbox" checked={todo.is_completed} onChange={() => toggleTodo(todo.id, todo.is_completed, todo.title)} className="h-4 w-4 mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 accent-orange-500 flex-shrink-0" />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className={`text-sm break-words leading-tight ${todo.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{todo.title}</span>
                    <span className="text-[9px] text-gray-400 mt-0.5">{formatDateTime24h(todo.created_at)}</span>
                  </div>
                </label>
                <button onClick={() => deleteTodo(todo.id, todo.title)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
          <form onSubmit={addTodo} className="flex gap-2 mt-auto bg-gray-50 p-1 rounded-xl">
            <input type="text" value={newTodo} onChange={e => setNewTodo(e.target.value)} placeholder="Thêm việc..." className="w-full bg-transparent p-1 text-sm outline-none" required />
            <button type="submit" className="text-orange-500 p-1"><Plus size={18}/></button>
          </form>
        </div>

        {/* 9. WISHLIST */}
        <div className="col-span-2 sm:col-span-1 md:col-span-1 flex flex-col rounded-3xl bg-white p-5 shadow-sm max-h-72 overflow-hidden">
           <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-gray-600">Wishlist</h2>
              <button 
                onClick={() => openActivityModal('wishlist')} 
                className="text-gray-400 hover:text-red-500 p-0.5 rounded-full" 
                title="Lịch sử Wishlist"
              >
                <Info size={14} />
              </button>
            </div>
            <div className="rounded-full bg-red-100 p-2 text-red-500 cursor-pointer" onClick={() => setShowWishlistModal(true)}>
              <Plus size={20} />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4">
            {/* Nửa kia */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2">
                {partnerRole === 'boyfriend' ? 'Bạn Trai' : partnerRole === 'girlfriend' ? 'Bạn Gái' : 'Nửa kia'} đang ước
              </h3>
              <div className="space-y-2">
                {partnerWishlistData.map(w => (
                  <div key={w.id} className="flex items-center justify-between bg-red-50 p-2 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <input type="checkbox" checked={w.is_bought} onChange={() => toggleWishlistBought(w.id, w.is_bought, w.item_name || w.title || 'Món đồ')} className="h-4 w-4 accent-red-500 flex-shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-xs font-semibold truncate ${w.is_bought ? 'line-through text-gray-400' : 'text-red-700'}`}>{w.item_name || w.title}</span>
                        <div className="flex items-center gap-2">
                          {(w.price_estimate || w.price) && <span className="text-[10px] text-red-500">{Number(w.price_estimate || w.price).toLocaleString('vi-VN')} ₫</span>}
                          <span className="text-[9px] text-gray-400">{formatDateTime24h(w.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {(w.link_url || w.link) && <a href={w.link_url || w.link} target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-600 ml-2"><ExternalLink size={14}/></a>}
                  </div>
                ))}
                {partnerWishlistData.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có gì</p>}
              </div>
            </div>

            {/* Của mình */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Của mình</h3>
              <div className="space-y-2">
                {myWishlist.map(w => (
                  <div key={w.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100 group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <input type="checkbox" checked={w.is_bought} onChange={() => toggleWishlistBought(w.id, w.is_bought, w.item_name || w.title || 'Món đồ')} className="h-4 w-4 accent-gray-500 flex-shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-xs font-semibold truncate ${w.is_bought ? 'line-through text-gray-400' : 'text-gray-700'}`}>{w.item_name || w.title}</span>
                        <div className="flex items-center gap-2">
                          {(w.price_estimate || w.price) && <span className="text-[10px] text-gray-500">{Number(w.price_estimate || w.price).toLocaleString('vi-VN')} ₫</span>}
                          <span className="text-[9px] text-gray-400">{formatDateTime24h(w.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {(w.link_url || w.link) && <a href={w.link_url || w.link} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600"><ExternalLink size={14}/></a>}
                      <button onClick={() => deleteWishlist(w.id, w.item_name || w.title || 'Món đồ')} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
                {myWishlist.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có gì</p>}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- MODAL ALBUM LOCKET (LỊCH SỬ KHOẢNH KHẮC) --- */}
      {showAlbumModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 md:pt-20 p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAlbumModal(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl h-[580px] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Images size={20} className="text-amber-500" />
                  Album Khoảnh khắc 📸
                </h2>
                <p className="text-[11px] text-gray-500">Các ảnh trong 7 ngày qua ({activeLocketPhotos.length} ảnh)</p>
              </div>
              <button onClick={() => setShowAlbumModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X size={20}/>
              </button>
            </div>

            {/* 4 Tab bộ lọc (Tất cả, Bạn Trai, Bạn Gái, và Thùng rác chỉ cho Bạn Trai) */}
            <div className="flex gap-1.5 mb-3 text-xs flex-shrink-0 overflow-x-auto pb-1 hide-scrollbar">
              <button 
                onClick={() => setAlbumFilter('all')} 
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${albumFilter === 'all' ? 'bg-amber-500 text-white font-bold shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Tất cả ({activeLocketPhotos.length})
              </button>
              <button 
                onClick={() => setAlbumFilter('boyfriend')} 
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${albumFilter === 'boyfriend' ? 'bg-blue-500 text-white font-bold shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                👦🏻 Bạn Trai
              </button>
              <button 
                onClick={() => setAlbumFilter('girlfriend')} 
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${albumFilter === 'girlfriend' ? 'bg-pink-500 text-white font-bold shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                👧🏻 Bạn Gái
              </button>
              {/* Phân quyền: Chỉ Bạn Trai mới nhìn thấy nút Thùng rác */}
              {role === 'boyfriend' && (
                <button 
                  onClick={() => setAlbumFilter('trash')} 
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1 transition-colors ${albumFilter === 'trash' ? 'bg-red-500 text-white font-bold shadow-sm' : 'bg-gray-100 text-red-600 hover:bg-red-50'}`}
                  title="Xem ảnh đã xóa trong 7 ngày qua (Chỉ Bạn Trai)"
                >
                  <Trash2 size={13} />
                  <span>Đã xóa ({deletedLocketPhotos.length})</span>
                </button>
              )}
            </div>

            {/* Banner hướng dẫn khi ở Tab Thùng rác (Chỉ Bạn Trai) */}
            {albumFilter === 'trash' && role === 'boyfriend' && (
              <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between text-xs text-red-700 flex-shrink-0">
                <span className="flex items-center gap-1.5 font-medium">
                  <Trash2 size={13} className="text-red-500 flex-shrink-0" />
                  Thùng rác ({deletedLocketPhotos.length} ảnh trong 7 ngày)
                </span>
                <span className="text-[10px] text-red-500 font-medium">Bấm icon để khôi phục</span>
              </div>
            )}

            {/* Lưới ảnh 3 cột */}
            <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar">
              {filteredAlbumPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5">
                  {filteredAlbumPhotos.map(photo => (
                    <div 
                      key={photo.id}
                      onClick={() => setViewingPhoto(photo)}
                      className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm border transition-all hover:shadow-md ${photo.is_deleted ? 'bg-red-50/50 border-red-200/80 opacity-90' : 'bg-gray-100 border-gray-100'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={photo.photo_url} 
                        alt="Khoảnh khắc" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                      {/* Badge vai trò */}
                      <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                        {photo.user_role === 'boyfriend' ? '👦🏻' : '👧🏻'}
                      </div>
                      {/* Badge đã xóa nếu có (Chỉ Bạn Trai thấy) */}
                      {photo.is_deleted && role === 'boyfriend' && (
                        <div className="absolute top-1 left-7 bg-red-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
                          Đã xóa
                        </div>
                      )}
                      {/* Caption thu nhỏ nếu có */}
                      {photo.caption && photo.caption.trim() !== '' && (
                        <div className="absolute bottom-5 inset-x-1 flex justify-center pointer-events-none">
                          <span className="bg-black/65 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded-full truncate max-w-[92%] border border-white/10 font-medium">
                            {photo.caption}
                          </span>
                        </div>
                      )}
                      {/* Thời gian */}
                      <div className="absolute bottom-1 inset-x-1 bg-black/60 text-white text-[8px] text-center py-0.5 rounded backdrop-blur-sm font-medium truncate">
                        {format24h(photo.created_at)} {new Date(photo.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      </div>
                      {/* Nút thao tác nhanh trên ảnh */}
                      {photo.is_deleted ? (
                        role === 'boyfriend' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); restoreLocketPhoto(photo); }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md transition-all hover:scale-110"
                            title="Khôi phục ảnh này"
                          >
                            <RotateCcw size={12} />
                          </button>
                        ) : null
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteLocketPhoto(photo); }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xóa ảnh này"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-gray-400 text-xs italic">
                  {albumFilter === 'trash' ? 'Thùng rác trống, không có ảnh nào trong 7 ngày qua.' : 'Chưa có ảnh nào trong mục này.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL LỊCH SỬ HOẠT ĐỘNG (ACTIVITY LOGS) --- */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 md:pt-20 p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowActivityModal(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl h-[580px] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Clock size={18} className="text-pink-500" />
                  Lịch sử: {getModuleTitle(logFilterModule)}
                </h2>
                <p className="text-[11px] text-gray-500">Các hoạt động và thay đổi gần nhất</p>
              </div>
              <button onClick={() => setShowActivityModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X size={20}/>
              </button>
            </div>

            {/* Filter Tabs cố định, linh hoạt, không bị che khuất hay cắt chữ */}
            <div className="flex flex-wrap gap-1.5 mb-3 text-xs flex-shrink-0">
              <button 
                onClick={() => setLogFilterModule('all')} 
                className={`px-3 py-1.5 rounded-xl transition-colors ${logFilterModule === 'all' ? 'bg-pink-500 text-white font-bold shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Tất cả
              </button>
              {['mood', 'location', 'locket', 'love_fund', 'todos', 'wishlist', 'special_dates', 'ping'].map(mKey => (
                <button 
                  key={mKey}
                  onClick={() => setLogFilterModule(mKey)} 
                  className={`px-3 py-1.5 rounded-xl transition-colors ${logFilterModule === mKey ? 'bg-pink-500 text-white font-bold shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {getModuleTitle(mKey)}
                </button>
              ))}
            </div>

            {/* Danh sách log cuộn độc lập bên trong */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-3 rounded-2xl bg-gray-50 hover:bg-pink-50/50 transition-colors border border-gray-100 text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${log.user_role === 'boyfriend' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                      {log.user_role === 'boyfriend' ? '👦🏻 Bạn Trai' : log.user_role === 'girlfriend' ? '👧🏻 Bạn Gái' : 'Hệ thống'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {formatDateTime24h(log.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-normal">
                    {log.description}
                  </p>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-xs italic">
                  Chưa có lịch sử hoạt động nào trong mục này.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL XEM ẢNH LOCKET FULLSCREEN --- */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={() => setViewingPhoto(null)}>
          <div className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-800">
                    {viewingPhoto.user_role === 'boyfriend' ? '👦🏻 Bạn Trai gửi' : '👧🏻 Bạn Gái gửi'}
                  </span>
                  {viewingPhoto.is_deleted && role === 'boyfriend' && (
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md">
                      Thùng rác
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500">
                  {formatDateTime24h(viewingPhoto.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {viewingPhoto.is_deleted ? (
                  role === 'boyfriend' ? (
                    <button 
                      onClick={() => restoreLocketPhoto(viewingPhoto)} 
                      className="flex items-center gap-1.5 text-green-700 hover:text-green-800 px-3 py-1.5 rounded-full bg-green-100 hover:bg-green-200 transition-colors text-xs font-bold shadow-sm"
                      title="Khôi phục ảnh này"
                    >
                      <RotateCcw size={14} />
                      <span>Khôi phục</span>
                    </button>
                  ) : null
                ) : (
                  <button 
                    onClick={() => deleteLocketPhoto(viewingPhoto)} 
                    className="text-red-500 hover:text-red-700 p-1.5 rounded-full bg-red-50 hover:bg-red-100 transition-colors"
                    title="Chuyển vào thùng rác"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={() => setViewingPhoto(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full bg-gray-100">
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="relative rounded-2xl overflow-hidden shadow-inner bg-black">
              <img 
                src={viewingPhoto.photo_url} 
                alt="Khoảnh khắc" 
                className="w-full max-h-[65vh] object-cover"
              />
              {/* Thanh Caption dạng viên thuốc mờ trên ảnh phóng to */}
              {viewingPhoto.caption && viewingPhoto.caption.trim() !== '' && (
                <div className="absolute bottom-3 inset-x-3 flex justify-center pointer-events-none">
                  <div className="bg-black/55 backdrop-blur-md text-white border border-white/20 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium text-center shadow-lg max-w-[95%]">
                    {viewingPhoto.caption}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL XEM TRƯỚC & NHẬP CAPTION LOCKET --- */}
      {showLocketPreviewModal && locketPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md" onClick={() => !isUploadingLocket && setShowLocketPreviewModal(false)}>
          <div className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                <Camera size={18} className="text-amber-500" />
                Gửi khoảnh khắc 📸
              </h3>
              <button 
                onClick={() => !isUploadingLocket && setShowLocketPreviewModal(false)} 
                disabled={isUploadingLocket}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Khung ảnh xem trước với thanh caption floating */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black shadow-inner mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={locketPreviewUrl} 
                alt="Preview Locket" 
                className="w-full h-full object-cover" 
              />
              {locketCaption.trim() && (
                <div className="absolute bottom-3 inset-x-3 flex justify-center pointer-events-none">
                  <div className="bg-black/55 backdrop-blur-md text-white border border-white/20 px-3.5 py-1 rounded-full text-xs font-medium text-center shadow-md line-clamp-2 max-w-[95%]">
                    {locketCaption}
                  </div>
                </div>
              )}
            </div>

            {/* Ô nhập caption kèm chữ và emoji */}
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">
                Lời nhắn gửi đến nửa kia (tùy chọn):
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={locketCaption} 
                  onChange={e => setLocketCaption(e.target.value)} 
                  placeholder="Viết lời nhắn gửi đến nửa kia... ✨" 
                  className="w-full rounded-2xl border border-gray-200 p-2.5 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-gray-50/70"
                  maxLength={100}
                  disabled={isUploadingLocket}
                  autoFocus
                />
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowLocketPreviewModal(false)} 
                disabled={isUploadingLocket}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                type="button" 
                onClick={handleConfirmUploadLocket} 
                disabled={isUploadingLocket}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isUploadingLocket ? (
                  <span>Đang gửi... 🚀</span>
                ) : (
                  <span>Gửi ngay 💛</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Modal */}
      {showWishlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Thêm vào Wishlist 🎁</h2>
              <button onClick={() => setShowWishlistModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={addWishlist} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Tên món đồ *</label>
                <input type="text" value={wlName} onChange={e => setWlName(e.target.value)} required className="w-full rounded-xl border border-gray-200 p-2 text-sm outline-none focus:border-red-300" placeholder="VD: Giày thể thao" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Giá ước lượng (VNĐ)</label>
                <input type="number" value={wlPrice} onChange={e => setWlPrice(e.target.value)} className="w-full rounded-xl border border-gray-200 p-2 text-sm outline-none focus:border-red-300" placeholder="VD: 500000" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Link sản phẩm</label>
                <input type="url" value={wlLink} onChange={e => setWlLink(e.target.value)} className="w-full rounded-xl border border-gray-200 p-2 text-sm outline-none focus:border-red-300" placeholder="https://..." />
              </div>
              <button type="submit" className="w-full rounded-xl bg-red-500 py-2 font-bold text-white transition-colors hover:bg-red-600 mt-2">
                Lưu vào Wishlist
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mood Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Hôm nay bạn thế nào? 💭</h2>
              <button onClick={() => setShowMoodModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={saveMood} className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-center py-2">
                {MOODS.map(m => (
                  <div 
                    key={m.icon}
                    onClick={() => setNewMoodIcon(m.icon)}
                    className={`cursor-pointer rounded-2xl p-2 text-2xl transition-transform active:scale-90 ${newMoodIcon === m.icon ? 'bg-yellow-200 shadow-sm scale-110' : 'bg-gray-50 hover:bg-yellow-50'}`}
                    title={m.label}
                  >
                    {m.icon}
                  </div>
                ))}
              </div>
              <div>
                <textarea 
                  value={newStatusMsg} 
                  onChange={e => setNewStatusMsg(e.target.value)} 
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400" 
                  placeholder="Viết gì đó về hôm nay..."
                  rows={3}
                />
              </div>
              <button type="submit" className="w-full rounded-xl bg-yellow-400 py-2 font-bold text-yellow-900 transition-colors hover:bg-yellow-500">
                Cập nhật Tâm trạng
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
