import React, { useState } from 'react'
import { useForm, Link } from '@inertiajs/react'

export default function Login() {
  const [error, setError] = useState('')
  const { data, setData, post, processing } = useForm({
    identifier: '',
    password: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Gunakan fungsi 'post' bawaan useForm Inertia
    // Targetnya adalah '/login' (bukan /api/auth/login)
    post('/login', {
      onSuccess: () => {
        // Inertia otomatis menangani redirect berdasarkan logic di AuthController
      },
      onError: (errors) => {
        // Mengambil error validasi dari Laravel
        if (errors.identifier) {
          setError(errors.identifier)
        } else {
          setError('Login gagal. Silakan periksa kembali data Anda.')
        }
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4 pt-20">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Masuk</h2>
        <p className="text-center text-gray-600 mb-8">
          Gunakan email, username, atau nomor telepon
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email / Username / No. Telpon
            </label>
            <input
              type="text"
              value={data.identifier}
              onChange={(e) => setData('identifier', e.target.value)}
              placeholder="Masukkan email, username, atau nomor WA"
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
              onChange={(e) => setData('password', e.target.value)}
              placeholder="Masukkan password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {processing ? 'Sedang Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Belum punya akun?{' '}
          <Link href="/register" className="text-purple-600 font-semibold hover:text-purple-700">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  )
}