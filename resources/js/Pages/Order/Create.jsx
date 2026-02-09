import React, { useState, useEffect } from 'react'
import { usePage, useForm, router, Link } from '@inertiajs/react'
import axios from 'axios'

const PAYMENT_DURATION_SECONDS = 300
const POLLING_INTERVAL_MS = 3000

export default function CreateOrder() {
  // Ambil templates dari props Laravel (dikirim via Controller)
  const { templates, auth } = usePage().props

  const [step, setStep] = useState(1) // 1: Select Template, 2: Configure, 3: Payment
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [checking, setChecking] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState(null)
  const [subdomainStatus, setSubdomainStatus] = useState(null)
  const [localError, setLocalError] = useState('')

  // Payment states
  const [paymentStep, setPaymentStep] = useState('ready') // ready, charging, waiting, redirecting, error
  const [snapInitialized, setSnapInitialized] = useState(false)
  const [timeLeft, setTimeLeft] = useState(PAYMENT_DURATION_SECONDS)
  const [pollingAttempt, setPollingAttempt] = useState(0)
  const [subscriptionId, setSubscriptionId] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState(null)
  const [clientKey, setClientKey] = useState(null)
  const [isSandbox, setIsSandbox] = useState(true)

  // Gunakan form helper Inertia
  const { data, setData, processing, errors } = useForm({
    template_id: '',
    subdomain: '',
  })

  // Load snap.js when moving to payment step
  useEffect(() => {
    if (step !== 3) return

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
      setLocalError('Gagal memuat sistem pembayaran Midtrans')
      setPaymentStep('error')
    }

    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        try {
          document.body.removeChild(script)
        } catch (e) {}
      }
    }
  }, [step, clientKey, isSandbox])

  // Timer untuk countdown
  useEffect(() => {
    if (paymentStep !== 'waiting') return

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
  }, [paymentStep])

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Logika Cek Subdomain
  const checkSubdomain = async () => {
    if (!data.subdomain) return

    setChecking(true)
    setLocalError('')
    setSubdomainStatus(null)

    try {
      const response = await axios.post('/api/subscriptions/check-subdomain', {
        subdomain: data.subdomain
      })

      if (response.data.available) {
        setSubdomainAvailable(true)
        setSubdomainStatus('available')
      } else {
        setSubdomainAvailable(false)
        setSubdomainStatus('taken')
      }
    } catch (error) {
      setLocalError('Gagal mengecek subdomain. Silakan coba lagi.')
      setSubdomainStatus(null)
    } finally {
      setChecking(false)
    }
  }

  const handleProceedToCheckout = async (e) => {
    e.preventDefault()
    if (!subdomainAvailable) return

    setLocalError('')

    try {
      const response = await axios.post('/order/store', {
        template_id: data.template_id,
        subdomain: data.subdomain,
      })

      // Get payment info from response
      setSubscriptionId(response.data.subscription_id)
      setPaymentAmount(response.data.amount)
      setClientKey(response.data.client_key)
      setIsSandbox(response.data.is_sandbox)

      // Move to payment step
      setStep(3)
      setPaymentStep('ready')
      setTimeLeft(PAYMENT_DURATION_SECONDS)
    } catch (error) {
      if (error.response?.status === 422) {
        setLocalError(error.response?.data?.subdomain || 'Data tidak valid. Silakan coba lagi.')
      } else {
        setLocalError('Gagal membuat pesanan. Silakan coba lagi.')
      }
    }
  }

  // Start polling untuk verify status pembayaran
  const startPolling = async () => {
    console.log('[Polling] Starting status polling...')

    const poll = async (attempt) => {
      if (attempt > 100) return

      try {
        const response = await axios.get(`/api/subscriptions/${subscriptionId}/status`)

        const data = response.data
        console.log(`[Polling] Attempt ${attempt + 1}: ${data.subscription?.status}`)

        if (data.subscription?.status === 'active') {
          console.log('[Polling] Success - redirecting')
          setPaymentStep('redirecting')
          setTimeout(() => {
            router.visit('/dashboard')
          }, 1500)
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

  // Request snap token dan pembayaran
  const handlePaymentClick = async () => {
    console.log('[Payment] Button clicked')

    if (!snapInitialized) {
      console.error('[Payment] Snap not initialized yet')
      setLocalError('Sistem pembayaran masih dimuat. Mohon tunggu...')
      return
    }

    if (!window.snap) {
      console.error('[Payment] window.snap is not available')
      setLocalError('Sistem pembayaran tidak tersedia')
      setPaymentStep('error')
      return
    }

    setPaymentStep('charging')
    setLocalError('')

    try {
      console.log('[Payment] Fetching snap token...')

      const response = await axios.post('/api/payment/charge', {
        subscription_id: subscriptionId
      })

      console.log('[Payment] Got snap token, length:', response.data.snap_token.length)
      console.log('[Payment] Calling snap.pay()...')

      setPaymentStep('waiting')

      // Call snap.pay with the token
      window.snap.pay(response.data.snap_token, {
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
      const errorMsg = err.response?.data?.error || err.message || 'Terjadi kesalahan'
      setLocalError('Gagal membuat pembayaran: ' + errorMsg)
      setPaymentStep('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 text-center">
              <div className={`inline-block w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-colors ${
                s <= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {s}
              </div>
              <p className={`text-sm font-medium ${s <= step ? 'text-purple-600' : 'text-gray-500'}`}>
                {s === 1 ? 'Pilih Template' : s === 2 ? 'Konfigurasi' : 'Bayar'}
              </p>
            </div>
          ))}
        </div>

        {(localError || errors.subdomain) && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
            {localError || errors.subdomain}
          </div>
        )}

        {/* Step 1: Select Template */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pilih Template Undangan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setData('template_id', template.id)
                    setStep(2)
                  }}
                  className="bg-white rounded-xl shadow hover:shadow-2xl transition-all cursor-pointer overflow-hidden group border-2 border-transparent hover:border-purple-300"
                >
                  <img src={template.thumbnail_path} alt={template.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                    <p className="text-gray-500 text-sm mt-1 mb-4 line-clamp-2">{template.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-extrabold text-purple-600">Rp {template.price.toLocaleString('id-ID')}</span>
                      <span className="text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-600 px-3 py-1 rounded-full">{template.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 2 && selectedTemplate && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Konfigurasi Subdomain</h2>
            
            <div className="flex items-center gap-4 bg-purple-50 p-4 rounded-lg mb-8">
              <img src={selectedTemplate.thumbnail_path} className="w-20 h-20 rounded object-cover shadow" />
              <div>
                <p className="text-sm text-purple-600 font-bold uppercase tracking-tight">Template Terpilih</p>
                <h3 className="text-lg font-bold">{selectedTemplate.name}</h3>
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:underline">Ganti Template</button>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2">Subdomain Unik</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={data.subdomain}
                  onChange={(e) => {
                    setData('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    setSubdomainAvailable(null)
                    setSubdomainStatus(null)
                  }}
                  placeholder="contoh: budi-dan-ani"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <button
                  type="button"
                  onClick={checkSubdomain}
                  disabled={checking || !data.subdomain}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 font-bold"
                >
                  {checking ? '...' : 'Cek'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-3 italic">
                Akses: <span className="text-purple-600 font-bold">{data.subdomain || 'nama-anda'}.malahproject.test</span>
              </p>
              {subdomainStatus === 'available' && (
                <p className="text-green-600 text-sm font-bold mt-2">✓ Subdomain tersedia!</p>
              )}
              {subdomainStatus === 'taken' && (
                <p className="text-red-600 text-sm font-bold mt-2">✗ Subdomain sudah terpakai, pilih yang lain</p>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 py-3 text-gray-600 font-bold border rounded-lg hover:bg-gray-50">Kembali</button>
              <button
                onClick={handleProceedToCheckout}
                disabled={!subdomainAvailable || processing}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:shadow-xl transition-all disabled:opacity-50 font-bold"
              >
                {processing ? 'Proses...' : 'Lanjut ke Pembayaran'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <>
            {/* Ready State */}
            {paymentStep === 'ready' && (
              <div className="min-h-96 flex items-center justify-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                  <div className="mb-6">
                    {selectedTemplate?.thumbnail_path && (
                      <img
                        src={selectedTemplate.thumbnail_path}
                        alt={selectedTemplate?.name}
                        className="w-24 h-24 rounded-lg object-cover mx-auto shadow-md"
                      />
                    )}
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Pembayaran</h1>
                  <p className="text-gray-600 mb-2">{selectedTemplate?.name}</p>
                  <p className="text-2xl font-bold text-purple-600 mb-8">
                    Rp {paymentAmount ? parseInt(paymentAmount).toLocaleString('id-ID') : '0'}
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
            )}

            {/* Charging State */}
            {paymentStep === 'charging' && (
              <div className="min-h-96 flex items-center justify-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                  <div className="inline-block mb-6">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Memproses</h2>
                  <p className="text-gray-600">Mempersiapkan halaman pembayaran...</p>
                </div>
              </div>
            )}

            {/* Waiting State */}
            {paymentStep === 'waiting' && (
              <div className="min-h-96 flex items-center justify-center">
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
            )}

            {/* Redirecting State */}
            {paymentStep === 'redirecting' && (
              <div className="min-h-96 flex items-center justify-center">
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
            )}

            {/* Error State */}
            {paymentStep === 'error' && (
              <div className="min-h-96 flex items-center justify-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Masalah</h2>
                  <p className="text-red-600 mb-6 p-4 bg-red-50 rounded-lg text-sm">
                    {localError || 'Kesalahan tidak diketahui'}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setLocalError('')
                        setPaymentStep('ready')
                      }}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700"
                    >
                      Coba Lagi
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black"
                    >
                      Kembali ke Konfigurasi
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
