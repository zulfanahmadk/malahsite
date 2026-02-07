import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stats')

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    
    Promise.all([
      fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }),
      fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }),
    ])
      .then(async ([statsRes, usersRes]) => {
        const statsData = await statsRes.json()
        const usersData = await usersRes.json()
        setStats(statsData)
        setUsers(usersData.data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch admin data:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token')
              window.location.href = '/'
            }}
            className="text-red-600 hover:text-red-700 font-medium"
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
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total User</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">
                {stats.total_users}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Subscription Aktif</p>
              <p className="text-4xl font-bold text-green-600 mt-2">
                {stats.active_subscriptions}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Pending Subscription</p>
              <p className="text-4xl font-bold text-yellow-600 mt-2">
                {stats.pending_subscriptions}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Transaksi Bulan Ini</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">
                {stats.total_transactions_this_month}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Pendapatan Bulan Ini</p>
              <p className="text-4xl font-bold text-pink-600 mt-2">
                Rp {stats.total_income_this_month.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Template</p>
              <p className="text-4xl font-bold text-indigo-600 mt-2">
                {stats.total_templates}
              </p>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Subscriptions
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      Tidak ada user
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.subscriptions?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-purple-600 hover:text-purple-700 font-medium mr-4">
                          Detail
                        </button>
                        <button className="text-red-600 hover:text-red-700 font-medium">
                          Suspend
                        </button>
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
