import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function PaymentProcess() {
  const [searchParams] = useSearchParams()
  const subscriptionId = searchParams.get('subscription_id')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    if (!subscriptionId) {
      setError('Subscription ID tidak ditemukan')
      setLoading(false)
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    // Fetch subscription details and initiate payment
    initiateMidtransPayment()
  }, [subscriptionId])

  const initiateMidtransPayment = async () => {
    const token = localStorage.getItem('auth_token')
    
    try {
      // First, get transaction details
      const response = await fetch('/api/transactions/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: parseInt(subscriptionId),
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.message || 'Gagal menginisiasi pembayaran')
        setLoading(false)
        return
      }

      const paymentData = await response.json()
      setSubscription(paymentData)

      // Load Midtrans Snap script
      loadMidtransSnap(paymentData)
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError('Terjadi kesalahan saat menginisiasi pembayaran')
      setLoading(false)
    }
  }

  const loadMidtransSnap = (paymentData) => {
    // Load Midtrans Snap script
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.REACT_APP_MIDTRANS_CLIENT_KEY || '')
    script.onload = () => {
      // Show Snap payment modal
      if (window.snap) {
        window.snap.pay(paymentData.order_id, {
          onSuccess: handlePaymentSuccess,
          onPending: handlePaymentPending,
          onError: handlePaymentError,
          onClose: handlePaymentClose,
        })
      }
    }
    document.body.appendChild(script)
  }

  const handlePaymentSuccess = (result) => {
    console.log('Payment successful:', result)
    // Redirect to success page
    window.location.href = `/dashboard/subscriptions/${subscriptionId}`
  }

  const handlePaymentPending = (result) => {
    console.log('Payment pending:', result)
  }

  const handlePaymentError = (result) => {
    console.log('Payment error:', result)
    setError('Pembayaran gagal. Silakan coba lagi.')
  }

  const handlePaymentClose = () => {
    window.location.href = `/dashboard/subscriptions/${subscriptionId}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 pt-20">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-semibold">Sedang memproses pembayaran...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4 pt-20">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        {error ? (
          <>
            <div className="inline-block w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gagal Memproses Pembayaran</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Kembali ke Dashboard
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sedang membuka halaman pembayaran...</h2>
            <p className="text-gray-600">
              Jika halaman pembayaran tidak muncul, klik tombol di bawah
            </p>
            <button
              onClick={() => initiateMidtransPayment()}
              className="mt-6 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Buka Halaman Pembayaran
            </button>
          </>
        )}
      </div>
    </div>
  )
}
