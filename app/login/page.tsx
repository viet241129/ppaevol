'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'

export default function LoginPage() {
  // Login State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Reset Password State
  const [isResetting, setIsResetting] = useState(false)
  const [pin, setPin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResetSuccess(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResetSuccess(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin, newPassword })
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      setResetSuccess(data.message)
      setIsResetting(false)
      setPassword('')
      setPin('')
      setNewPassword('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pink-50 p-4 font-sans text-gray-800">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-pink-500">
            <Heart size={32} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-pink-600">ppaevol 💖</h1>
          <p className="text-sm text-gray-500">Đăng nhập vào không gian riêng</p>
        </div>

        {resetSuccess && (
          <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-600 border border-green-200">
            {resetSuccess}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-500 border border-red-200">
            {error}
          </div>
        )}

        {!isResetting ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300"
                placeholder="anhyeuem@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300"
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => { setIsResetting(true); setError(null); setResetSuccess(null); }}
                className="text-xs text-pink-500 hover:text-pink-600 font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-pink-500 p-3 font-semibold text-white transition-colors hover:bg-pink-600 disabled:opacity-70"
            >
              {loading ? 'Đang vào...' : 'Đăng nhập'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email cần đổi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300"
                placeholder="anhyeuem@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mã xác nhận (PIN)</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300 tracking-widest"
                placeholder="Nhập mã 6 số"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300"
                placeholder="Mật khẩu mới"
              />
            </div>

            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => { setIsResetting(false); setError(null); }}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Quay lại đăng nhập
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-pink-600 p-3 font-semibold text-white transition-colors hover:bg-pink-700 disabled:opacity-70"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận đổi'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
