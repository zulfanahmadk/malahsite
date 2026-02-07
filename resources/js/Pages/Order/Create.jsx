import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function CreateOrder() {
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('template_id')
  
  const [step, setStep] = useState(1) // 1: Select Template, 2: Configure Subdomain, 3: Checkout
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [subdomain, setSubdomain] = useState('')
  const [subdomainAvailable, setSubdomainAvailable] = useState(null)
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates || [])
        if (templateId) {
          const template = data.templates?.find(t => t.id === parseInt(templateId))
          if (template) {
            setSelectedTemplate(template)
            setStep(2)
          }
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch templates:', err)
        setLoading(false)
        setError('Failed to load templates')
      })
  }, [templateId])

  const checkSubdomainAvailability = async () => {
    if (!subdomain.trim()) {
      setError('Subdomain tidak boleh kosong')
      return
    }

    setChecking(true)
    setError('')

    try {
      const response = await fetch('/api/subscriptions/check-subdomain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ subdomain: subdomain.toLowerCase() }),
      })

      const result = await response.json()
      setSubdomainAvailable(result.available)
      if (!result.available) {
        setError(result.message || 'Subdomain tidak tersedia')
      }
    } catch (err) {
      setError('Gagal mengecek ketersediaan subdomain')
    } finally {
      setChecking(false)
    }
  }

  const handleProceedToCheckout = async () => {
    if (!selectedTemplate || !subdomain || !subdomainAvailable) {
      setError('Mohon lengkapi semua data yang diperlukan')
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          subdomain: subdomain.toLowerCase(),
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.message || 'Gagal membuat pesanan')
        setLoading(false)
        return
      }

      const subscription = await response.json()
      setLoading(false)
      setStep(3)
    } catch (err) {
      setError('Terjadi kesalahan saat membuat pesanan')
      setLoading(false)
    }
  }

  if (loading && step === 1) {
    return <div className="text-center py-12">Loading templates...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 text-center">
              <div className={`inline-block w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                s <= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {s}
              </div>
              <p className={`text-sm font-medium ${
                s <= step ? 'text-purple-600' : 'text-gray-500'
              }`}>
                {s === 1 ? 'Pilih Template' : s === 2 ? 'Konfigurasi' : 'Bayar'}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
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
                    setStep(2)
                  }}
                  className="bg-white rounded-lg shadow hover:shadow-xl transition cursor-pointer overflow-hidden"
                >
                  {template.thumbnail_path && (
                    <img
                      src={template.thumbnail_path}
                      alt={template.name}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {template.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-purple-600">
                        Rp {template.price.toLocaleString('id-ID')}
                      </span>
                      {template.category && (
                        <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                          {template.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Configure Subdomain */}
        {step === 2 && selectedTemplate && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Konfigurasi Subdomain</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Template Pilihan</p>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedTemplate.name}
              </h3>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                Rp {selectedTemplate.price.toLocaleString('id-ID')}
              </p>
              <button
                onClick={() => setStep(1)}
                className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                ← Kembali pilih template
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subdomain Unik
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => {
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    setSubdomainAvailable(null)
                  }}
                  placeholder="masukkan nama subdomain"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <button
                  onClick={checkSubdomainAvailability}
                  disabled={checking || !subdomain}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  {checking ? 'Checking...' : 'Cek'}
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                URL undangan Anda akan menjadi: 
                <span className="font-mono font-bold text-purple-600">
                  {subdomain || 'nama-anda'}.malahproject.com
                </span>
              </p>
              {subdomainAvailable === true && (
                <p className="text-green-600 text-sm mt-2">✓ Subdomain tersedia!</p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Kembali
              </button>
              <button
                onClick={handleProceedToCheckout}
                disabled={!subdomainAvailable || loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50 font-medium"
              >
                {loading ? 'Membuat Pesanan...' : 'Lanjut ke Pembayaran'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Checkout */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="mb-6">
              <div className="inline-block w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pesanan Dibuat!
              </h2>
              <p className="text-gray-600">
                Silakan lanjutkan ke pembayaran untuk mengaktifkan undangan Anda
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <div className="flex justify-between mb-2">
                <p className="text-gray-600">Template</p>
                <p className="font-semibold text-gray-900">{selectedTemplate.name}</p>
              </div>
              <div className="flex justify-between mb-2">
                <p className="text-gray-600">Subdomain</p>
                <p className="font-mono font-semibold text-purple-600">{subdomain}.malahproject.com</p>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between">
                <p className="text-gray-900 font-semibold">Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  Rp {selectedTemplate.price.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                // This will trigger Midtrans payment in the next step
                window.location.href = '/dashboard'
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Lanjut ke Pembayaran
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
