import React, { useEffect, useState } from 'react'
import { Link } from '@inertiajs/react'

export default function Dashboard() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    fetch('/api/subscriptions', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        setSubscriptions(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch subscriptions:', err)
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Saya</h1>
          <Link
            href="/order/create"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
          >
            Buat Undangan Baru
          </Link>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Anda belum membuat undangan digital</p>
            <Link
              href="/order/create"
              className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Mulai Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map(sub => (
              <div key={sub.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-purple-400 to-pink-400"></div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {sub.template?.name || 'Undangan Saya'}
                  </h3>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Subdomain</p>
                    <p className="text-lg font-mono font-bold text-purple-600">
                      {sub.subdomain}.malahproject.com
                    </p>
                  </div>
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' :
                      sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {sub.status === 'active' ? 'Aktif' :
                       sub.status === 'pending' ? 'Menunggu Pembayaran' :
                       'Berakhir'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/subscriptions/${sub.id}`}
                      className="flex-1 text-center bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition font-medium"
                    >
                      Kelola
                    </Link>
                    {sub.status === 'active' && (
                      <a
                        href={`https://${sub.subdomain}.malahproject.local`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center border border-purple-600 text-purple-600 py-2 rounded hover:bg-purple-50 transition font-medium"
                      >
                        Buka
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
