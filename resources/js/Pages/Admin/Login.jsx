import { useState } from 'react'
import { Link } from '@inertiajs/react'

export default function AdminLogin() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    identifier: '',
    password: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Admin-Login': 'true',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Login failed')
        setLoading(false)
        return
      }

      // Check if user is admin
      if (result.user.user_type !== 'admin') {
        setError('You do not have admin access')
        setLoading(false)
        return
      }

      localStorage.setItem('auth_token', result.token)
      window.location.href = '/admin/dashboard'
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Admin Panel</h2>
        <p className="text-center text-gray-600 mb-8">Masuk dengan email atau username</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
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
