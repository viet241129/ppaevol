'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  MapPin, Heart, Smile, CalendarDays, 
  Wallet, CheckSquare, Gift, LogOut, Plus, Trash2, Check, X, ExternalLink, Navigation
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

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<'boyfriend' | 'girlfriend' | null>(null)
  const [partnerRole, setPartnerRole] = useState<'boyfriend' | 'girlfriend' | null>(null)

  // Mood
  const [mood, setMood] = useState('😊')
  const [statusMessage, setStatusMessage] = useState('Đang tải...')
  const [partnerMood, setPartnerMood] = useState('😊')
  const [partnerStatus, setPartnerStatus] = useState('Đang tải...')
  
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [newMoodIcon, setNewMoodIcon] = useState('😊')
  const [newStatusMsg, setNewStatusMsg] = useState('')

  // Location
  const [myLat, setMyLat] = useState<number | null>(null)
  const [myLng, setMyLng] = useState<number | null>(null)
  const [partnerLat, setPartnerLat] = useState<number | null>(null)
  const [partnerLng, setPartnerLng] = useState<number | null>(null)
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

  const [pinged, setPinged] = useState(false)

  const fetchProfiles = async (currentUser: any) => {
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
          setMyLat(myProfile.latitude)
          setMyLng(myProfile.longitude)
          setPartnerRole(myProfile.role === 'boyfriend' ? 'girlfriend' : 'boyfriend')
        }
        if (otherProfile) {
          setPartnerMood(otherProfile.mood || '😊')
          setPartnerStatus(otherProfile.status_message || 'Bình thường')
          setPartnerLat(otherProfile.latitude)
          setPartnerLng(otherProfile.longitude)
        }
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Profiles:', err)
    }
  }

  const fetchLoveFund = async () => {
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
  }

  const fetchSpecialDates = async () => {
    try {
      const { data, error } = await supabase.from('special_dates').select('*').order('event_date', { ascending: true })
      if (error) console.error('❌ Lỗi lấy Special Dates:', error)
      else if (data) setSpecialDates(data)
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Special Dates:', err)
    }
  }

  const fetchWishlist = async () => {
    try {
      const { data, error } = await supabase.from('couple_wishlists').select('*').order('created_at', { ascending: false })
      if (error) console.error('❌ Lỗi lấy Wishlist:', error)
      else if (data) setWishlistData(data)
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Wishlist:', err)
    }
  }

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase.from('couple_todos').select('*').order('created_at', { ascending: false })
      if (error) console.error('❌ Lỗi lấy Todos:', error)
      else if (data) setTodos(data)
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ Todos:', err)
    }
  }

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
        fetchTodos()
      ])
    } catch (err) {
      console.error('❌ Lỗi khởi tạo dữ liệu:', err)
    }
  }, [supabase])

  useEffect(() => {
    fetchUserAndData()
    const channel = supabase
      .channel('public-updates')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchUserAndData()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchUserAndData, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // --- ACTIONS ---

  const saveMood = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase.from('profiles').update({ 
        mood: newMoodIcon,
        status_message: newStatusMsg 
      }).eq('id', user.id)
      
      if (error) {
        console.error('❌ Lỗi cập nhật Tâm trạng:', error)
        alert('Lỗi cập nhật tâm trạng')
      } else {
        setShowMoodModal(false)
        await fetchProfiles(user)
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
    setIsUpdatingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const { error } = await supabase.from('profiles').update({ 
            latitude: lat, 
            longitude: lng 
          }).eq('id', user.id)
          
          if (error) console.error('❌ Lỗi lưu vị trí:', error)
          else {
            setMyLat(lat)
            setMyLng(lng)
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
        setFundAmount('')
        setFundReason('')
        await fetchLoveFund()
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ thêm Love Fund:', err)
    }
  }

  const deleteLoveFund = async (id: string) => {
    if (!confirm('Xóa khoản này?')) return
    try {
      const { error } = await supabase.from('love_fund').delete().eq('id', id)
      if (error) console.error('❌ Lỗi xóa Love Fund:', error)
      else await fetchLoveFund()
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ xóa Love Fund:', err)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo) return
    try {
      const { error } = await supabase.from('couple_todos').insert([{ title: newTodo, is_completed: false }])
      if (error) console.error('❌ Lỗi thêm Todo:', error)
      else {
        setNewTodo('')
        await fetchTodos()
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ thêm Todo:', err)
    }
  }

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('couple_todos').update({ is_completed: !currentStatus }).eq('id', id)
      if (error) console.error('❌ Lỗi cập nhật Todo:', error)
      else await fetchTodos()
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ cập nhật Todo:', err)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase.from('couple_todos').delete().eq('id', id)
      if (error) console.error('❌ Lỗi xóa Todo:', error)
      else await fetchTodos()
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ xóa Todo:', err)
    }
  }

  const addWishlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wlName || !user || !role) return
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
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ thêm Wishlist:', err)
    }
  }

  const toggleWishlistBought = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('couple_wishlists').update({ is_bought: !currentStatus }).eq('id', id)
      if (error) console.error('❌ Lỗi cập nhật Wishlist:', error)
      else await fetchWishlist()
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ cập nhật Wishlist:', err)
    }
  }

  const deleteWishlist = async (id: string) => {
    if (!confirm('Xóa món quà này?')) return
    try {
      const { error } = await supabase.from('couple_wishlists').delete().eq('id', id)
      if (error) console.error('❌ Lỗi xóa Wishlist:', error)
      else await fetchWishlist()
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ xóa Wishlist:', err)
    }
  }

  const addDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDateTitle || !newDateValue) return
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
      }
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ thêm Special Date:', err)
    }
  }

  const deleteDate = async (id: string) => {
    if (!confirm('Xóa ngày này?')) return
    try {
      const { error } = await supabase.from('special_dates').delete().eq('id', id)
      if (error) console.error('❌ Lỗi xóa Special Date:', error)
      else await fetchSpecialDates()
    } catch (err) {
      console.error('❌ Lỗi ngoại lệ xóa Special Date:', err)
    }
  }

  const handlePing = () => {
    setPinged(true)
    setTimeout(() => setPinged(false), 2000)
  }

  const myWishlist = wishlistData.filter(w => user && w.user_id === user.id)
  const partnerWishlistData = wishlistData.filter(w => user && w.user_id !== user.id)

  // Location logic
  const mapLat = partnerLat || myLat || 21.028511 // Default Hanoi
  const mapLng = partnerLng || myLng || 105.804817
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - 0.02}%2C${mapLat - 0.02}%2C${mapLng + 0.02}%2C${mapLat + 0.02}&layer=mapnik&marker=${mapLat}%2C${mapLng}`

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
        <button onClick={handleLogout} className="rounded-full bg-white p-2 text-gray-400 shadow-sm transition-colors hover:text-red-500">
          <LogOut size={20} />
        </button>
      </header>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        
        {/* Nửa kia Mood */}
        <div className="col-span-2 sm:col-span-1 flex flex-col justify-between rounded-3xl bg-blue-50 p-5 shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-blue-800">
              {partnerRole === 'boyfriend' ? 'Bạn Trai' : partnerRole === 'girlfriend' ? 'Bạn Gái' : 'Nửa kia'}
            </h2>
            <div className="rounded-full bg-blue-200 p-2 text-xl">
              {partnerMood}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-blue-900 line-clamp-2">{partnerStatus}</p>
            <p className="text-[10px] text-blue-500/80">Cảm xúc hiện tại</p>
          </div>
        </div>

        {/* Location (Map) */}
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
          {/* Overlay to prevent accidental scrolling on map */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col justify-between h-full pointer-events-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-800 bg-white/70 px-2 py-1 rounded-lg backdrop-blur-sm">Vị trí nửa kia</h2>
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
              <div className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                <p className="text-[10px] text-gray-600 font-medium">Bạn: {myLat ? `${myLat.toFixed(3)}, ${myLng?.toFixed(3)}` : 'Chưa rõ'}</p>
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

        {/* Ping */}
        <div 
          onClick={handlePing}
          className={`col-span-1 flex cursor-pointer flex-col items-center justify-center rounded-3xl p-5 shadow-sm transition-all active:scale-90 ${pinged ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-500'}`}
        >
          <Heart size={32} className={pinged ? 'animate-ping' : ''} fill={pinged ? 'white' : 'currentColor'} />
          <span className="mt-2 text-xs font-semibold">{pinged ? 'Đã Ping!' : 'Ping'}</span>
        </div>

        {/* Của bạn Mood */}
        <div onClick={() => {
          setNewMoodIcon(mood)
          setNewStatusMsg(statusMessage !== 'Bình thường' && statusMessage !== 'Đang tải...' ? statusMessage : '')
          setShowMoodModal(true)
        }} className="col-span-1 flex cursor-pointer flex-col justify-between rounded-3xl bg-yellow-100 p-5 shadow-sm active:scale-95 transition-transform">
           <div className="flex items-center justify-between">
            <div className="rounded-full bg-yellow-200 p-2 text-xl">
              {mood}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-yellow-800 line-clamp-2">{statusMessage}</p>
            <p className="text-[10px] text-yellow-600/80">Tâm trạng của bạn</p>
          </div>
        </div>

        {/* Special Dates */}
        <div className="col-span-2 flex flex-col rounded-3xl bg-purple-100 p-5 shadow-sm max-h-72">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-purple-800">Ngày quan trọng</h2>
            <div className="rounded-full bg-purple-200 p-2 text-purple-600">
              <CalendarDays size={20} />
            </div>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto hide-scrollbar mb-3">
            {specialDates.map(date => (
              <div key={date.id} className="flex justify-between items-center text-sm bg-white/50 p-2 rounded-xl">
                <div>
                  <span className="font-medium text-purple-900">{date.title}</span>
                  <p className="text-xs text-purple-700">{new Date(date.event_date).toLocaleDateString('vi-VN')}</p>
                </div>
                <button onClick={() => deleteDate(date.id)} className="text-purple-400 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            ))}
            {specialDates.length === 0 && <p className="text-xs text-purple-600 italic">Chưa có ngày nào</p>}
          </div>

          <form onSubmit={addDate} className="flex gap-2 mt-auto">
            <input type="text" value={newDateTitle} onChange={e => setNewDateTitle(e.target.value)} placeholder="Tên sự kiện" className="w-1/2 rounded-lg p-1 text-xs outline-none" required />
            <input type="date" value={newDateValue} onChange={e => setNewDateValue(e.target.value)} className="w-1/2 rounded-lg p-1 text-xs outline-none" required />
            <button type="submit" className="bg-purple-500 text-white p-1 rounded-lg"><Plus size={16}/></button>
          </form>
        </div>

        {/* Love Fund */}
        <div className="col-span-2 flex flex-col rounded-3xl bg-green-100 p-5 shadow-sm max-h-72">
           <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-green-800">Love Fund</h2>
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
            <div className="flex-1 space-y-1 overflow-y-auto hide-scrollbar">
              {loveFund.map(fund => (
                <div key={fund.id} className="flex justify-between items-center text-xs bg-white/50 p-2 rounded-xl">
                  <span className="truncate w-1/2 text-green-900 font-medium">{fund.reason}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${fund.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {fund.type === 'income' ? '+' : '-'}{Number(fund.amount).toLocaleString('vi-VN')}
                    </span>
                    <button onClick={() => deleteLoveFund(fund.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Todos */}
        <div className="col-span-2 sm:col-span-1 flex flex-col rounded-3xl bg-white p-5 shadow-sm max-h-72">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600">To-do chung</h2>
            <div className="rounded-full bg-orange-100 p-2 text-orange-500">
              <CheckSquare size={20} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2 mb-3">
            {todos.map(todo => (
              <div key={todo.id} className="flex items-center justify-between group">
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="checkbox" checked={todo.is_completed} onChange={() => toggleTodo(todo.id, todo.is_completed)} className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 accent-orange-500 flex-shrink-0" />
                  <span className={`text-sm break-words w-full ${todo.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{todo.title}</span>
                </label>
                <button onClick={() => deleteTodo(todo.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
          <form onSubmit={addTodo} className="flex gap-2 mt-auto bg-gray-50 p-1 rounded-xl">
            <input type="text" value={newTodo} onChange={e => setNewTodo(e.target.value)} placeholder="Thêm việc..." className="w-full bg-transparent p-1 text-sm outline-none" required />
            <button type="submit" className="text-orange-500 p-1"><Plus size={18}/></button>
          </form>
        </div>

        {/* Wishlist */}
        <div className="col-span-2 sm:col-span-1 flex flex-col rounded-3xl bg-white p-5 shadow-sm max-h-72 overflow-hidden">
           <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600">
              Wishlist
            </h2>
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
                      <input type="checkbox" checked={w.is_bought} onChange={() => toggleWishlistBought(w.id, w.is_bought)} className="h-4 w-4 accent-red-500 flex-shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-xs font-semibold truncate ${w.is_bought ? 'line-through text-gray-400' : 'text-red-700'}`}>{w.item_name}</span>
                        {w.price_estimate && <span className="text-[10px] text-red-500">{Number(w.price_estimate).toLocaleString('vi-VN')} ₫</span>}
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
                      <input type="checkbox" checked={w.is_bought} onChange={() => toggleWishlistBought(w.id, w.is_bought)} className="h-4 w-4 accent-gray-500 flex-shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-xs font-semibold truncate ${w.is_bought ? 'line-through text-gray-400' : 'text-gray-700'}`}>{w.item_name}</span>
                        {w.price_estimate && <span className="text-[10px] text-gray-500">{Number(w.price_estimate).toLocaleString('vi-VN')} ₫</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {w.link_url && <a href={w.link_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600"><ExternalLink size={14}/></a>}
                      <button onClick={() => deleteWishlist(w.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

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
