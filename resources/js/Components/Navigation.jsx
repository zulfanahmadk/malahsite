import { Link } from '@inertiajs/react'

export default function Navigation({ user }) {
  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              MaLah
            </Link>
          </div>
          <div className="flex items-center gap-4">
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
