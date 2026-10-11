'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  MapPin, Heart, Smile, CalendarDays, 
  Wallet, CheckSquare, Gift, LogOut, Plus, Trash2, Check, X, ExternalLink, Navigation, BellRing,
  Info, Camera, Clock, Eye, Sparkles
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
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Activity Logs & Info Modal
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [logFilterModule, setLogFilterModule] = useState<string>('all')

  const [pinged, setPinged] = useState(false)
  const channelRef = useRef<any>(null)

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

  // --- HÀM GHI NHẬN ACTIVITY LOG ---
  const logActivity = useCallback(async (moduleName: string, actionType: string, description: string) => {
    if (!user) return
    try {
      const { error } = await supabase.from('activity_logs').insert([{
        user_id: user.id,
        user_role: role,
        module: moduleName,
        action_type: actionType,
        description: description
      }])
      if (error) console.error('Lỗi ghi activity log:', error)
      else fetchActivityLogs()
    } catch (err) {
      console.error('Ngoại lệ ghi activity log:', err)
    }
  }, [role, supabase, user])

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
          setMood(myProfile.mood || '😊')
          setStatusMessage(myProfile.status_message || 'Bình thường')
          setMyMoodUpdatedAt(myProfile.updated_at || myProfile.created_at || null)
          setMyLat(myProfile.latitude)
          setMyLng(myProfile.longitude)
          setPartnerRole(myProfile.role === 'boyfriend' ? 'girlfriend' : 'boyfriend')
        }
        if (otherProfile) {
          setPartnerId(otherProfile.id)
          setPartnerMood(otherProfile.mood || '😊')
          setPartnerStatus(otherProfile.status_message || 'Bình thường')
          setPartnerMoodUpdatedAt(otherProfile.updated_at || otherProfile.created_at || null)
          setPartnerLat(otherProfile.latitude)
          setPartnerLng(otherProfile.longitude)
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
      const { data, error } = await supabase.from('locket_photos').select('*').order('created_at', { ascending: false }).limit(20)
      if (error) console.error('❌ Lỗi lấy Locket:', error)
      else if (data) setLocketPhotos(data)
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Locket:', err)
    }
  }, [supabase])

  const fetchActivityLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50)
      if (error) console.error('❌ Lỗi lấy Activity Logs:', error)
      else if (data) setActivityLogs(data)
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Activity Logs:', err)
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
      // Cố gắng cập nhật có kèm updated_at
      let { error } = await supabase.from('profiles').update({ 
        mood: newMoodIcon,
        status_message: newStatusMsg,
        updated_at: nowIso
      }).eq('id', user.id)
      
      // Nếu bảng profiles chưa có cột updated_at, fallback update không có cột này
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

  const updateLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ lấy vị trí.')
      return
    }
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    setIsUpdatingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const nowIso = new Date().toISOString()
        try {
          let { error } = await supabase.from('profiles').update({ 
            latitude: lat, 
            longitude: lng,
            updated_at: nowIso
          }).eq('id', user.id)
          
          if (error && error.message?.includes('updated_at')) {
            const res = await supabase.from('profiles').update({ 
              latitude: lat, 
              longitude: lng 
            }).eq('id', user.id)
            error = res.error
          }

          if (error) console.error('❌ Lỗi lưu vị trí:', error)
          else {
            setMyLat(lat)
            setMyLng(lng)
            await sendPushNotification('Vị trí mới 📍', `${senderName} vừa cập nhật vị trí mới`)
            await logActivity('location', 'update', `${senderName} cập nhật vị trí (${lat.toFixed(3)}, ${lng.toFixed(3)})`)
          }
        } catch (err) {
          console.error('❌ Lỗi ngoại lệ lưu vị trí:', err)
        }
        setIsUpdatingLocation(false)
      },
      (err) => {
        console.error('Lỗi lấy vị trí:', err)
        alert('Không thể lấy vị trí. Hãy bật Quyền truy cập vị trí.')
        setIsUpdatingLocation(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const addLoveFund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fundAmount || !fundReason) return
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'
    try {
      const mappedType = fundType === 'Thu' ? 'income' : 'expense'
      const { error } = await supabase.from('love_fund').insert([{
        amount: Number(fundAmount),
        reason: fundReason,
        type: mappedType
      }])
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
    const itemName = wlName
    try {
      const { error } = await supabase.from('couple_wishlists').insert([{ 
        user_id: user.id, 
        owner_role: role,
        item_name: wlName,
        price_estimate: wlPrice ? Number(wlPrice) : null,
        link_url: wlLink || null,
        is_bought: false
      }])
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

  // --- TỰ ĐỘNG DỌN DẸP ẢNH LOCKET CŨ HƠN 30 NGÀY ---
  const cleanupOldLocketPhotos = async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      // 1. Tìm các bản ghi locket_photos cũ hơn 30 ngày
      const { data: oldPhotos, error: fetchErr } = await supabase
        .from('locket_photos')
        .select('id, photo_url')
        .lt('created_at', thirtyDaysAgo)

      if (fetchErr || !oldPhotos || oldPhotos.length === 0) return

      // 2. Tìm và xóa file vật lý trên Supabase Storage bucket 'locket'
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
          console.error('Lỗi xóa file vật lý trên storage:', storageErr)
        }
      }

      // 3. Xóa các bản ghi cũ khỏi bảng locket_photos
      const oldIds = oldPhotos.map(p => p.id)
      const { error: deleteErr } = await supabase
        .from('locket_photos')
        .delete()
        .in('id', oldIds)

      if (deleteErr) {
        console.error('Lỗi xóa bản ghi locket cũ:', deleteErr)
      } else {
        console.log(`Đã tự động dọn dẹp ${oldPhotos.length} ảnh Locket cũ hơn 30 ngày.`)
      }
    } catch (err) {
      console.error('Ngoại lệ khi dọn dẹp ảnh cũ:', err)
    }
  }

  // --- LOCKET UPLOAD ---
  const handleUploadLocket = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setIsUploadingLocket(true)
    const senderName = role === 'boyfriend' ? 'Bạn Trai' : 'Bạn Gái'

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const img = new window.Image()
        img.onload = async () => {
          // Nén ảnh qua Canvas (tối đa 900px, chất lượng 0.75) để tối ưu dung lượng và tốc độ
          const canvas = document.createElement('canvas')
          const maxDim = 900
          let width = img.width
          let height = img.height
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75)

          let finalUrl = compressedDataUrl

          // Thử upload lên Supabase Storage bucket 'locket'
          try {
            const fileName = `${user.id}-${Date.now()}.jpg`
            const blob = await (await fetch(compressedDataUrl)).blob()
            const { data: storageData, error: storageErr } = await supabase.storage.from('locket').upload(fileName, blob, {
              contentType: 'image/jpeg',
              upsert: true
            })
            if (!storageErr && storageData) {
              const { data: pubData } = supabase.storage.from('locket').getPublicUrl(fileName)
              if (pubData?.publicUrl) {
                finalUrl = pubData.publicUrl
              }
            }
          } catch (storageErr) {
            console.log('Storage fallback to dataURL:', storageErr)
          }

          // Lưu bản ghi vào bảng locket_photos
          const { error: dbErr } = await supabase.from('locket_photos').insert([{
            user_id: user.id,
            user_role: role,
            photo_url: finalUrl,
            caption: ''
          }])

          if (dbErr) {
            console.error('❌ Lỗi lưu locket photo:', dbErr)
            alert('Lỗi lưu ảnh: ' + dbErr.message)
          } else {
            // Tự động dọn dẹp ảnh cũ hơn 30 ngày
            await cleanupOldLocketPhotos()
            await fetchLocketPhotos()
            await sendPushNotification('Khoảnh khắc mới 📸', `${senderName} vừa gửi một khoảnh khắc ảnh mới`)
            await logActivity('locket', 'create', `${senderName} đăng một khoảnh khắc ảnh mới`)
          }
          setIsUploadingLocket(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      console.error('Lỗi upload ảnh:', err)
      alert('Lỗi upload: ' + err.message)
      setIsUploadingLocket(false)
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
      case 'locket': return 'Khoảnh khắc (Locket)'
      default: return 'Tất cả hoạt động'
    }
  }

  const myWishlist = wishlistData.filter(w => user && w.user_id === user.id)
  const partnerWishlistData = wishlistData.filter(w => user && w.user_id !== user.id)
  const latestLocketPhoto = locketPhotos.length > 0 ? locketPhotos[0] : null

  // Location logic
  const mapLat = partnerLat || myLat || 21.028511 // Mặc định Hà Nội
  const mapLng = partnerLng || myLng || 105.804817

  const filteredLogs = logFilterModule === 'all' 
    ? activityLogs 
    : activityLogs.filter(log => log.module === logFilterModule)

  return (
    <div className="min-h-screen bg-pink-50 p-4 pb-20 font-sans text-gray-800 relative">
      
      {/* HEADER */}
      <header className="mb-6 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-pink-600">ppaevol 💖</h1>
          <p className="text-sm text-gray-500">
            {role === 'boyfriend' ? 'Bạn Trai' : role === 'girlfriend' ? 'Bạn Gái' : 'Đang tải...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
              <div className="bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm flex flex-col">
                <span className="text-[10px] text-gray-600 font-medium">Bạn: {myLat ? `${myLat.toFixed(3)}, ${myLng?.toFixed(3)}` : 'Chưa rõ'}</span>
                {partnerLocationUpdatedAt && (
                  <span className="text-[9px] text-blue-600 font-bold">Cập nhật lúc {format24h(partnerLocationUpdatedAt)}</span>
                )}
              </div>
              <button 
                onClick={updateLocation} 
                disabled={isUpdatingLocation}
                className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:bg-blue-600 disabled:opacity-50"
              >
                <Navigation size={12} />
                {isUpdatingLocation ? 'Đang dò...' : 'Cập nhật'}
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

        {/* 6. MODULE MỚI: KHOẢNH KHẮC (LOCKET) */}
        <div className="col-span-2 sm:col-span-1 flex flex-col justify-between rounded-3xl bg-amber-50 p-5 shadow-sm max-h-72 border border-amber-100 relative group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-amber-800">Khoảnh khắc 📸</h2>
              <button 
                onClick={() => openActivityModal('locket')} 
                className="text-amber-500 hover:text-amber-700 p-0.5 rounded-full" 
                title="Lịch sử khoảnh khắc"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                ref={fileInputRef} 
                onChange={handleUploadLocket} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploadingLocket}
                className="rounded-full bg-amber-200 p-1.5 text-amber-700 hover:bg-amber-300 transition-colors shadow-sm disabled:opacity-50"
                title="Gửi ảnh mới"
              >
                <Camera size={18} />
              </button>
            </div>
          </div>

          {/* Nội dung ảnh */}
          <div className="flex-1 flex flex-col justify-center items-center overflow-hidden my-1">
            {latestLocketPhoto ? (
              <div className="relative w-full h-32 rounded-2xl overflow-hidden group/img cursor-pointer shadow-sm border border-amber-200/60" onClick={() => setViewingPhoto(latestLocketPhoto)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={latestLocketPhoto.photo_url} 
                  alt="Khoảnh khắc" 
                  className="w-full h-full object-cover transition-transform group-hover/img:scale-105 duration-300" 
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye size={22} />
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-2xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-amber-100/50 transition-colors"
              >
                <Camera size={26} className="text-amber-400 mb-1" />
                <span className="text-xs font-medium text-amber-700">Chưa có ảnh nào</span>
                <span className="text-[10px] text-amber-500">Chạm để chụp / gửi ảnh 📸</span>
              </div>
            )}
          </div>

          {/* Thông tin thời gian */}
          <div className="mt-1 flex items-center justify-between text-[11px] text-amber-700 font-medium">
            {isUploadingLocket ? (
              <span className="text-amber-600 animate-pulse font-bold">Đang tải ảnh lên...</span>
            ) : latestLocketPhoto ? (
              <>
                <span className="text-amber-800 font-bold truncate">
                  {latestLocketPhoto.user_role === 'boyfriend' ? '👦🏻 Bạn Trai' : latestLocketPhoto.user_role === 'girlfriend' ? '👧🏻 Bạn Gái' : 'Nửa kia'}
                </span>
                <span className="text-[10px] text-amber-600">
                  Đăng lúc {format24h(latestLocketPhoto.created_at)}
                </span>
              </>
            ) : (
              <span className="text-[10px] text-amber-500">Gửi ảnh locket ngay</span>
            )}
          </div>
        </div>

        {/* 7. LOVE FUND */}
        <div className="col-span-2 flex flex-col rounded-3xl bg-green-100 p-5 shadow-sm max-h-72">
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
            <div className="rounded-full bg-green-200 p-2 text-green-600 cursor-pointer transition-transform hover:scale-110" onClick={() => setShowFundForm(!showFundForm)}>
              {showFundForm ? <X size={20} /> : <Plus size={20} />}
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-2xl font-bold text-green-700">{fundTotal.toLocaleString('vi-VN')}<span className="text-lg font-medium text-green-600/80"> ₫</span></p>
          </div>

          {showFundForm ? (
            <form onSubmit={addLoveFund} className="flex flex-col gap-2 bg-white/60 p-2 rounded-xl mb-2">
              <div className="flex gap-2">
                <select value={fundType} onChange={e => setFundType(e.target.value as any)} className="rounded-lg p-1 text-xs outline-none bg-white">
                  <option value="Thu">Thu (+)</option>
                  <option value="Chi">Chi (-)</option>
                </select>
                <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="Số tiền" className="w-full rounded-lg p-1 text-xs outline-none" required />
              </div>
              <div className="flex gap-2">
                <input type="text" value={fundReason} onChange={e => setFundReason(e.target.value)} placeholder="Lý do" className="w-full rounded-lg p-1 text-xs outline-none" required />
                <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap">Lưu</button>
              </div>
            </form>
          ) : (
            <div className="flex-1 space-y-1.5 overflow-y-auto hide-scrollbar">
              {loveFund.map(fund => (
                <div key={fund.id} className="flex justify-between items-center text-xs bg-white/60 p-2 rounded-xl">
                  <div className="flex flex-col truncate w-1/2">
                    <span className="truncate text-green-900 font-medium">{fund.reason}</span>
                    <span className="text-[9px] text-green-700/80">{formatDateTime24h(fund.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${fund.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {fund.type === 'income' ? '+' : '-'}{Number(fund.amount).toLocaleString('vi-VN')}
                    </span>
                    <button onClick={() => deleteLoveFund(fund.id, fund.reason)} className="text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 8. TODOS */}
        <div className="col-span-2 sm:col-span-1 flex flex-col rounded-3xl bg-white p-5 shadow-sm max-h-72">
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
        <div className="col-span-2 sm:col-span-1 flex flex-col rounded-3xl bg-white p-5 shadow-sm max-h-72 overflow-hidden">
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
                      <input type="checkbox" checked={w.is_bought} onChange={() => toggleWishlistBought(w.id, w.is_bought, w.item_name)} className="h-4 w-4 accent-red-500 flex-shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-xs font-semibold truncate ${w.is_bought ? 'line-through text-gray-400' : 'text-red-700'}`}>{w.item_name}</span>
                        <div className="flex items-center gap-2">
                          {w.price_estimate && <span className="text-[10px] text-red-500">{Number(w.price_estimate).toLocaleString('vi-VN')} ₫</span>}
                          <span className="text-[9px] text-gray-400">{formatDateTime24h(w.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {w.link_url && <a href={w.link_url} target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-600 ml-2"><ExternalLink size={14}/></a>}
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
                      <input type="checkbox" checked={w.is_bought} onChange={() => toggleWishlistBought(w.id, w.is_bought, w.item_name)} className="h-4 w-4 accent-gray-500 flex-shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-xs font-semibold truncate ${w.is_bought ? 'line-through text-gray-400' : 'text-gray-700'}`}>{w.item_name}</span>
                        <div className="flex items-center gap-2">
                          {w.price_estimate && <span className="text-[10px] text-gray-500">{Number(w.price_estimate).toLocaleString('vi-VN')} ₫</span>}
                          <span className="text-[9px] text-gray-400">{formatDateTime24h(w.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {w.link_url && <a href={w.link_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600"><ExternalLink size={14}/></a>}
                      <button onClick={() => deleteWishlist(w.id, w.item_name)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
                {myWishlist.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có gì</p>}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- MODAL LỊCH SỬ HOẠT ĐỘNG (ACTIVITY LOGS) --- */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Clock size={18} className="text-pink-500" />
                  {getModuleTitle(logFilterModule)}
                </h2>
                <p className="text-[11px] text-gray-500">Các hoạt động và thay đổi gần nhất</p>
              </div>
              <button onClick={() => setShowActivityModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X size={20}/>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 hide-scrollbar text-xs">
              <button 
                onClick={() => setLogFilterModule('all')} 
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${logFilterModule === 'all' ? 'bg-pink-500 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Tất cả
              </button>
              {['mood', 'location', 'locket', 'love_fund', 'todos', 'wishlist', 'special_dates'].map(mKey => (
                <button 
                  key={mKey}
                  onClick={() => setLogFilterModule(mKey)} 
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${logFilterModule === mKey ? 'bg-pink-500 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {getModuleTitle(mKey)}
                </button>
              ))}
            </div>

            {/* Danh sách log */}
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
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-xs font-bold text-gray-800">
                  {viewingPhoto.user_role === 'boyfriend' ? '👦🏻 Bạn Trai gửi' : '👧🏻 Bạn Gái gửi'}
                </span>
                <p className="text-[10px] text-gray-500">
                  {formatDateTime24h(viewingPhoto.created_at)}
                </p>
              </div>
              <button onClick={() => setViewingPhoto(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full bg-gray-100">
                <X size={18} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={viewingPhoto.photo_url} 
              alt="Khoảnh khắc" 
              className="w-full max-h-[65vh] object-cover rounded-2xl shadow-inner"
            />
            {viewingPhoto.caption && (
              <p className="mt-3 text-xs text-gray-700 text-center font-medium">{viewingPhoto.caption}</p>
            )}
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
