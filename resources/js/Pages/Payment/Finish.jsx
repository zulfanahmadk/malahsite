import React, { useEffect, useState } from 'react'
import { usePage, router } from '@inertiajs/react'

export default function PaymentFinish() {
  const { subscriptionId, message } = usePage().props
  const [status, setStatus] = useState('checking')
  const [displayMessage, setDisplayMessage] = useState(message || 'Memeriksa status pembayaran...')
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    let timeoutId = null
    let isMounted = true

    const pollStatus = async (currentAttempt) => {
      if (!isMounted) return

      if (currentAttempt > 30) {
        // After 30 attempts (~30-45 seconds), give up and redirect to dashboard
        if (isMounted) {
          setStatus('timeout')
          setDisplayMessage('Status pembayaran tidak dapat diverifikasi. Silakan check di dashboard.')
          setTimeout(() => {
            router.visit('/dashboard')
          }, 1500)
        }
        return
      }

      try {
        console.log(`[Payment] Checking status - Attempt ${currentAttempt + 1}/30`)

        const response = await fetch(`/api/subscriptions/${subscriptionId}/status`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for session auth
        })

        if (!response.ok) {
          console.error(`[Payment] Status check failed: ${response.status}`)
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        console.log('[Payment] Status response:', {
          subscription_status: data.subscription?.status,
          transaction_status: data.transaction?.status,
          attempt: currentAttempt + 1
        })

        if (isMounted) {
          if (data.subscription?.status === 'active') {
            // Payment successful!
            console.log('[Payment] SUCCESS - redirecting to config page')
            setStatus('success')
            setDisplayMessage('Pembayaran berhasil! Silakan setup konfigurasi undangan Anda.')
            setTimeout(() => {
              router.visit(`/dashboard/subscriptions/${subscriptionId}`)
            }, 1000)
            return
          } else if (data.subscription?.status === 'pending') {
            // Still pending, keep polling with faster intervals
            const nextDelay = currentAttempt < 10 ? 500 : currentAttempt < 20 ? 1000 : 1500
            setAttempts(currentAttempt + 1)
            timeoutId = setTimeout(() => pollStatus(currentAttempt + 1), nextDelay)
          } else {
            // Unknown status
            setStatus('error')
            setDisplayMessage(`Status pembayaran tidak diketahui: ${data.subscription?.status}. Silakan refresh atau cek dashboard.`)
          }
        }
      } catch (err) {
        console.error('[Payment] Polling error:', err.message)

        if (isMounted) {
          // Retry on error dengan cepat di awal
          setAttempts(currentAttempt + 1)
          const nextDelay = currentAttempt < 5 ? 800 : currentAttempt < 15 ? 1500 : 2000
          timeoutId = setTimeout(() => pollStatus(currentAttempt + 1), nextDelay)
        }
      }
    }

    // Start polling immediately for faster detection
    timeoutId = setTimeout(() => pollStatus(0), 300)

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [subscriptionId])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        {status === 'success' ? (
          <div className="animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
            <p className="text-gray-600">{displayMessage}</p>
            <p className="text-sm text-gray-400 mt-4">Sedang mengarahkan ke dashboard...</p>
          </div>
        ) : status === 'error' ? (
          <div className="animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Masalah</h2>
            <p className="text-gray-600 mb-8">{displayMessage}</p>
            <button
              onClick={() => router.visit('/dashboard')}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition shadow-lg"
            >
              Kembali ke Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Memeriksa Pembayaran</h2>
              <p className="text-gray-600 text-sm">{displayMessage}</p>
              <p className="text-xs text-gray-400 mt-4">Percobaan: {attempts + 1}/30</p>
            </div>

            <div className="pt-6 border-t border-dashed space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition text-sm"
              >
                Refresh Halaman
              </button>
              <button
                onClick={() => router.visit('/dashboard')}
                className="w-full text-gray-600 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50 transition text-sm"
              >
                Ke Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
