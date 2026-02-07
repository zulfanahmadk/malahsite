import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function SubscriptionDetail() {
  const [subscription, setSubscription] = useState(null)
  const [invitationData, setInvitationData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const subscriptionId = useParams().id

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    Promise.all([
      fetch(`/api/subscriptions/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }),
      fetch(`/api/subscriptions/${subscriptionId}/invitation`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }),
    ])
      .then(async ([subRes, invRes]) => {
        const sub = await subRes.json()
        const inv = await invRes.json()
        setSubscription(sub)
        setInvitationData(inv)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch:', err)
        setLoading(false)
      })
  }, [subscriptionId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(
        `/api/subscriptions/${subscriptionId}/invitation`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify(invitationData),
        }
      )

      if (response.ok) {
        alert('Data undangan berhasil disimpan!')
      } else {
        alert('Gagal menyimpan data')
      }
    } catch (err) {
      alert('Terjadi kesalahan')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Kelola Undangan
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Template</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription?.template?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Subdomain</p>
              <p className="text-lg font-mono font-bold text-purple-600">
                {subscription?.subdomain}.malahproject.com
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                subscription?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {subscription?.status === 'active' ? 'Aktif' : 'Menunggu Pembayaran'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Mempelai Pria
              </label>
              <input
                type="text"
                value={invitationData.groom_name || ''}
                onChange={(e) => setInvitationData({
                  ...invitationData,
                  groom_name: e.target.value,
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Mempelai Wanita
              </label>
              <input
                type="text"
                value={invitationData.bride_name || ''}
                onChange={(e) => setInvitationData({
                  ...invitationData,
                  bride_name: e.target.value,
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Acara
              </label>
              <input
                type="date"
                value={invitationData.event_date || ''}
                onChange={(e) => setInvitationData({
                  ...invitationData,
                  event_date: e.target.value,
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waktu Acara
              </label>
              <input
                type="time"
                value={invitationData.ceremony_time || ''}
                onChange={(e) => setInvitationData({
                  ...invitationData,
                  ceremony_time: e.target.value,
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cerita Cinta Kami
            </label>
            <textarea
              value={invitationData.love_story || ''}
              onChange={(e) => setInvitationData({
                ...invitationData,
                love_story: e.target.value,
              })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Ceritakan kisah cinta kalian di sini"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  )
}
