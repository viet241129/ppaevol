'use client'

import React, { useState } from 'react'
import { 
  MapPin, Heart, Smile, CalendarDays, 
  Wallet, CheckSquare, Gift, BellRing 
} from 'lucide-react'

export default function Dashboard() {
  const [pinged, setPinged] = useState(false)

  const handlePing = () => {
    setPinged(true)
    setTimeout(() => setPinged(false), 2000)
    // TODO: Send ping to Supabase
  }

  return (
    <div className="min-h-screen bg-pink-50 p-4 font-sans text-gray-800">
      {/* Header */}
      <header className="mb-6 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-pink-600">ppaevol 💖</h1>
          <p className="text-sm text-gray-500">Our private space</p>
        </div>
        <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-pink-300 shadow-sm">
          <img 
            src="https://api.dicebear.com/7.x/notionists/svg?seed=ppaevol&backgroundColor=ffdfbf" 
            alt="Avatar" 
            className="h-full w-full object-cover"
          />
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        
        {/* 1. Location */}
        <div className="col-span-2 flex flex-col justify-between rounded-3xl bg-white p-5 shadow-sm transition-transform active:scale-95">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-600">Location</h2>
            <div className="rounded-full bg-blue-100 p-2 text-blue-500">
              <MapPin size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-lg font-medium">Hanoi, Vietnam</p>
            <p className="text-xs text-gray-400">Updated 5m ago</p>
          </div>
        </div>

        {/* 2. Ping Button */}
        <div 
          onClick={handlePing}
          className={`col-span-1 flex cursor-pointer flex-col items-center justify-center rounded-3xl p-5 shadow-sm transition-all active:scale-90 ${pinged ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-500'}`}
        >
          <Heart size={32} className={pinged ? 'animate-ping' : ''} fill={pinged ? 'white' : 'currentColor'} />
          <span className="mt-2 text-xs font-semibold">{pinged ? 'Pinged!' : 'Ping'}</span>
        </div>

        {/* 3. Status / Mood */}
        <div className="col-span-1 flex flex-col justify-between rounded-3xl bg-yellow-100 p-5 shadow-sm transition-transform active:scale-95">
           <div className="flex items-center justify-between">
            <div className="rounded-full bg-yellow-200 p-2 text-yellow-600">
              <Smile size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-yellow-800">Happy!</p>
            <p className="text-xs text-yellow-600/80">Feeling great today</p>
          </div>
        </div>

        {/* 4. Schedule & Special Days */}
        <div className="col-span-2 flex flex-col justify-between rounded-3xl bg-purple-100 p-5 shadow-sm transition-transform active:scale-95">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-purple-800">Anniversary</h2>
            <div className="rounded-full bg-purple-200 p-2 text-purple-600">
              <CalendarDays size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-purple-700">142<span className="text-lg font-medium"> days</span></p>
            <p className="text-xs text-purple-600/80">Next: Nov 24, 2026</p>
          </div>
        </div>

        {/* 5. Love Fund */}
        <div className="col-span-2 flex flex-col justify-between rounded-3xl bg-green-100 p-5 shadow-sm transition-transform active:scale-95">
           <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-green-800">Love Fund</h2>
            <div className="rounded-full bg-green-200 p-2 text-green-600">
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-green-700">5.2M<span className="text-lg font-medium text-green-600/80"> ₫</span></p>
            <div className="mt-1 flex gap-2 text-xs text-green-800">
              <span className="rounded-md bg-green-200/50 px-2 py-1">+200k</span>
              <span className="rounded-md bg-red-200/50 px-2 py-1 text-red-700">-50k</span>
            </div>
          </div>
        </div>

        {/* 6. Todo List */}
        <div className="col-span-2 sm:col-span-1 flex flex-col justify-between rounded-3xl bg-white p-5 shadow-sm transition-transform active:scale-95">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600">To-do</h2>
            <div className="rounded-full bg-orange-100 p-2 text-orange-500">
              <CheckSquare size={20} />
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500" />
              <span className="text-gray-600 line-through">Buy tickets</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500" />
              <span className="text-gray-700">Book table</span>
            </li>
          </ul>
        </div>

        {/* 7. Wishlist */}
        <div className="col-span-2 sm:col-span-1 flex flex-col justify-between rounded-3xl bg-white p-5 shadow-sm transition-transform active:scale-95">
           <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600">Wishlist</h2>
            <div className="rounded-full bg-red-100 p-2 text-red-500">
              <Gift size={20} />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <div className="h-16 w-16 shrink-0 rounded-xl bg-gray-100 p-2 flex items-center justify-center text-xs text-center">Shoes</div>
            <div className="h-16 w-16 shrink-0 rounded-xl bg-gray-100 p-2 flex items-center justify-center text-xs text-center">Watch</div>
            <div className="h-16 w-16 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center border border-dashed border-gray-300 text-gray-400">+</div>
          </div>
        </div>
      </div>
      
      {/* Bottom padding for mobile scrolling */}
      <div className="h-20"></div>
    </div>
  )
}
