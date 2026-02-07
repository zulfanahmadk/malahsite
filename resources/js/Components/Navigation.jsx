import React, { useState } from 'react'
import { Link, usePage } from '@inertiajs/react'

export default function Navigation({ user }) {
  const { branding } = usePage().props
  const [logoError, setLogoError] = useState(false)

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Left */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              {branding?.logo?.url && !logoError ? (
                <img
                  src={branding.logo.url}
                  alt="Logo"
                  style={{ height: branding.logo.height || '32px' }}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-2xl font-bold text-purple-600">{branding?.logo?.text || 'MaLah'}</span>
              )}
            </Link>
          </div>

          {/* Nav Items - Center */}
          <div className="flex items-center gap-8 flex-1 justify-center">
            <button
              onClick={() => scrollToSection('home')}
              className="text-gray-700 hover:text-purple-600 transition"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-gray-700 hover:text-purple-600 transition"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-gray-700 hover:text-purple-600 transition"
            >
              Contact
            </button>
          </div>

          {/* Auth Buttons - Right */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-purple-600">
                  Dashboard
                </Link>
                <form method="post" action="/api/auth/logout" className="inline">
                  <button type="submit" className="text-gray-700 hover:text-purple-600">
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-purple-600">
                  Login
                </Link>
                <Link href="/register" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
