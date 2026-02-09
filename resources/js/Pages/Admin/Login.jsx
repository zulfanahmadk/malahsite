import React, { useState } from 'react'
import { Link, router } from '@inertiajs/react'

export default function AdminLogin() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    identifier: '',
    password: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Gunakan router.post dari Inertia (Bukan fetch manual)
    // Ini otomatis menangani CSRF dan Session Laravel
    router.post('/login', {
      ...data,
      remember: true // Opsional: agar session tidak cepat habis
    }, {
      // Header khusus untuk memberi tahu Controller bahwa ini login admin
      headers: {
        'X-Admin-Login': 'true',
      },
      onSuccess: () => {
        // Jika login berhasil, Laravel akan otomatis redirect ke dashboard admin
        // karena kita sudah set logic redirect di AuthController
      },
      onError: (errors) => {
        setLoading(false)
        // Mengambil pesan error dari validasi Laravel
        setError(errors.identifier || 'Login failed. Please check your credentials.')
      },
      onFinish: () => {
        setLoading(false)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Admin Panel</h2>
        <p className="text-center text-gray-600 mb-8">Masuk dengan email atau username</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email atau Username
            </label>
            <input
              type="text"
              value={data.identifier}
              onChange={(e) => setData({ ...data, identifier: e.target.value })}
              placeholder="Masukkan email atau username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              placeholder="Masukkan password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Sedang Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          <Link href="/" className="text-purple-600 font-semibold hover:text-purple-700">
            Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  )
}