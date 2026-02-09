import React, { useState } from 'react'
import { Link, usePage, router } from '@inertiajs/react'

export default function AdminDashboard() {
  // Ambil data langsung dari props yang dikirim AdminPageController
  const { stats, users } = usePage().props
  const [activeTab, setActiveTab] = useState('stats')

  const handleLogout = () => {
    // Gunakan router.post untuk logout agar session di server hancur
    router.post('/logout')
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 font-medium bg-red-50 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2 font-medium transition ${
              activeTab === 'stats'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Statistik
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 font-medium transition ${
              activeTab === 'users'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manajemen User
          </button>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total User" value={stats.total_users} color="text-purple-600" />
            <StatCard title="Subscription Aktif" value={stats.active_subscriptions} color="text-green-600" />
            <StatCard title="Pending Subscription" value={stats.pending_subscriptions} color="text-yellow-600" />
            <StatCard title="Transaksi Bulan Ini" value={stats.total_transactions_this_month} color="text-blue-600" />
            <StatCard 
              title="Pendapatan Bulan Ini" 
              value={`Rp ${stats.total_income_this_month?.toLocaleString('id-ID')}`} 
              color="text-pink-600" 
            />
            <StatCard title="Total Template" value={stats.total_templates} color="text-indigo-600" />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Username</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!users || users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">Tidak ada user ditemukan</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.username}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                           {user.user_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button className="text-purple-600 hover:text-purple-900 mr-3">Detail</button>
                        <button className="text-red-600 hover:text-red-900">Suspend</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Komponen kecil untuk Card Statistik
function StatCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  )
}