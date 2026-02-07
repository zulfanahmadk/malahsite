import React, { useState } from 'react'
import { useForm, Link } from '@inertiajs/react'

export default function Register() {
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { data, setData } = useForm({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors)
        } else {
          setError(result.message || 'Registration failed')
        }
        setLoading(false)
        return
      }

      // Store token and redirect
      localStorage.setItem('auth_token', result.token)
      window.location.href = '/dashboard'
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4 pt-20">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Daftar</h2>
        <p className="text-center text-gray-600 mb-8">
          Buat akun untuk memulai membuat undangan digital
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="Nama lengkap Anda"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={data.username}
              onChange={(e) => setData('username', e.target.value)}
              placeholder="Username unik Anda"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
            {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              placeholder="Email Anda"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              No. WhatsApp
            </label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => setData('phone', e.target.value)}
              placeholder="08xx xxxx xxxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              placeholder="Ulangi password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
            {errors.password_confirmation && <p className="text-red-600 text-sm mt-1">{errors.password_confirmation}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Sedang Mendaftar...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-purple-600 font-semibold hover:text-purple-700">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
