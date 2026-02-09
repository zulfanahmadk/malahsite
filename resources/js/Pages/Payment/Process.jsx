import React, { useEffect, useState } from 'react'
import { usePage, router } from '@inertiajs/react'

const PAYMENT_DURATION_SECONDS = 300
const POLLING_INTERVAL_MS = 3000

export default function PaymentProcess() {
  const { subscriptionId, amount, template, clientKey, isSandbox } = usePage().props
  
  const [step, setStep] = useState('ready')
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(PAYMENT_DURATION_SECONDS)
  const [pollingAttempt, setPollingAttempt] = useState(0)
  const [snapInitialized, setSnapInitialized] = useState(false)

  // Initialize snap.js on component mount
  useEffect(() => {
    console.log('[Init] Loading snap.js...')
    
    const snapUrl = isSandbox
      ? 'https://app.sandbox.midtrans.com/snap/snap.js'
      : 'https://app.midtrans.com/snap/snap.js'

    const script = document.createElement('script')
    script.src = snapUrl
    script.setAttribute('data-client-key', clientKey)
    script.async = true

    script.onload = () => {
      console.log('[Init] Snap.js loaded, snap available:', !!window.snap)
      setSnapInitialized(true)
    }

    script.onerror = () => {
      console.error('[Init] Failed to load Snap.js')
      setError('Gagal memuat sistem pembayaran Midtrans')
      setStep('error')
    }

    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        try {
          document.body.removeChild(script)
        } catch (e) {}
      }
    }
  }, [])

  // Timer untuk countdown
  useEffect(() => {
    if (step !== 'waiting') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          router.visit('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [step])

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Start polling untuk verify status
  const startPolling = async () => {
    console.log('[Polling] Starting status polling...')
    
    const poll = async (attempt) => {
      if (attempt > 100) return

      try {
        const response = await fetch(`/api/subscriptions/${subscriptionId}/status`, {
          credentials: 'include',
        })

        const data = await response.json()
        console.log(`[Polling] Attempt ${attempt + 1}: ${data.subscription?.status}`)

        if (data.subscription?.status === 'active') {
          console.log('[Polling] Success - redirecting')
          setStep('redirecting')
          setTimeout(() => {
            router.visit(`/dashboard/subscriptions/${subscriptionId}`)
          }, 1000)
          return
        }

        setPollingAttempt(attempt + 1)
        setTimeout(() => poll(attempt + 1), POLLING_INTERVAL_MS)
      } catch (err) {
        console.error('[Polling] Error:', err)
        setPollingAttempt(attempt + 1)
        setTimeout(() => poll(attempt + 1), POLLING_INTERVAL_MS)
      }
    }

    poll(0)
  }

  // Request snap token from backend and pay
  const handlePaymentClick = async () => {
    console.log('[Payment] Button clicked')
    
    if (!snapInitialized) {
      console.error('[Payment] Snap not initialized yet')
      setError('Sistem pembayaran masih dimuat. Mohon tunggu...')
      return
    }

    if (!window.snap) {
      console.error('[Payment] window.snap is not available')
      setError('Sistem pembayaran tidak tersedia')
      setStep('error')
      return
    }

    setStep('charging')
    setError('')

    try {
      console.log('[Payment] Fetching snap token...')
      
      const response = await fetch('/api/payment/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': window.csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify({ subscription_id: subscriptionId }),
      })

      console.log('[Payment] Response status:', response.status)

      const responseText = await response.text()
      console.log('[Payment] Response text (first 200 chars):', responseText.substring(0, 200))

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error('[Payment] Failed to parse response as JSON:', e)
        console.error('[Payment] Full response was:', responseText)
        throw new Error('Server returned invalid JSON: ' + e.message)
      }

      console.log('[Payment] Response received, keys:', Object.keys(data))

      if (!response.ok) {
        console.error('[Payment] Response not OK:', data)
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.snap_token) {
        console.error('[Payment] No snap_token in response:', data)
        throw new Error('Server did not return a snap token')
      }

      console.log('[Payment] Got snap token, length:', data.snap_token.length)
      console.log('[Payment] Calling snap.pay()...')

      setStep('waiting')

      // Call snap.pay with the token
      window.snap.pay(data.snap_token, {
        onSuccess: (result) => {
          console.log('[Payment] Success:', result)
          startPolling()
        },
        onPending: (result) => {
          console.log('[Payment] Pending:', result)
          startPolling()
        },
        onError: (result) => {
          console.log('[Payment] Error:', result)
          startPolling()
        },
        onClose: () => {
          console.log('[Payment] Popup closed')
          startPolling()
        },
      })
    } catch (err) {
      console.error('[Payment] Exception:', err.message, err)
      setError('Gagal membuat pembayaran: ' + err.message)
      setStep('error')
    }
  }

  // UI: Ready State
  if (step === 'ready') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="mb-6">
            {template?.thumbnail_path && (
              <img 
                src={template.thumbnail_path} 
                alt={template?.name}
                className="w-24 h-24 rounded-lg object-cover mx-auto shadow-md"
              />
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pembayaran</h1>
          <p className="text-gray-600 mb-2">{template?.name}</p>
          <p className="text-2xl font-bold text-purple-600 mb-8">
            Rp {amount?.toLocaleString('id-ID')}
          </p>

          <button
            onClick={handlePaymentClick}
            disabled={!snapInitialized}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {snapInitialized ? 'Lanjut Pembayaran' : 'Memuat...'}
          </button>

          <p className="text-xs text-gray-400 mt-6">
            💳 Pembayaran aman via Midtrans
          </p>
        </div>
      </div>
    )
  }

  // UI: Charging
  if (step === 'charging') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="inline-block mb-6">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Memproses</h2>
          <p className="text-gray-600">Mempersiapkan halaman pembayaran...</p>
        </div>
      </div>
    )
  }

  // UI: Waiting
  if (step === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="inline-block mb-6">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Menunggu Pembayaran</h2>
          <p className="text-gray-600 mb-6">Popup pembayaran sudah dibuka. Mohon tunggu...</p>
          
          <div className="bg-purple-50 p-4 rounded-lg mb-6">
            <p className="text-lg font-bold text-purple-600">{formatTime(timeLeft)}</p>
            <p className="text-xs text-gray-500 mt-2">Waktu tersisa untuk pembayaran</p>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Polling: {pollingAttempt} / 100
          </p>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700"
            >
              Refresh
            </button>
            <button
              onClick={() => router.visit('/dashboard')}
              className="w-full text-gray-600 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    )
  }

  // UI: Redirecting
  if (step === 'redirecting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
          <p className="text-gray-600">Sedang mengarahkan Anda ke halaman konfigurasi...</p>
        </div>
      </div>
    )
  }

  // UI: Error
  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Masalah</h2>
          <p className="text-red-600 mb-6 p-4 bg-red-50 rounded-lg text-sm">
            {error || 'Kesalahan tidak diketahui'}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setError('')
                setStep('ready')
              }}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => router.visit('/dashboard')}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}
