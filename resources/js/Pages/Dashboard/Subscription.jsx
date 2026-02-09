import React, { useState, useEffect } from 'react'
import { useForm, usePage, router } from '@inertiajs/react'
import axios from 'axios'

export default function SubscriptionDetail() {
  // Ambil data langsung dari Laravel Props
  const { subscription, invitation, flash } = usePage().props
  const [successMessage, setSuccessMessage] = useState('')

  // Show flash message if available
  useEffect(() => {
    if (flash?.message) {
      setSuccessMessage(flash.message)
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [flash])

  // Check if subscription is active
  const isActive = subscription?.status === 'active'

  // Inisialisasi Form dengan data yang ada
  const { data, setData, put, processing, errors } = useForm({
    groom_name: invitation?.groom_name || '',
    bride_name: invitation?.bride_name || '',
    groom_father_name: invitation?.groom_father_name || '',
    groom_mother_name: invitation?.groom_mother_name || '',
    bride_father_name: invitation?.bride_father_name || '',
    bride_mother_name: invitation?.bride_mother_name || '',
    event_date: invitation?.event_date || '',
    ceremony_time: invitation?.ceremony_time || '',
    ceremony_location: invitation?.ceremony_location || '',
    reception_location: invitation?.reception_location || '',
    reception_google_maps_link: invitation?.reception_google_maps_link || '',
    love_story: invitation?.love_story || '',
    wedding_info: invitation?.wedding_info || {},
    uploaded_photos: [],
    removed_photos: [],
    photo_gallery: [],
  })

  const [uploadedFiles, setUploadedFiles] = useState([])
  const [existingPhotos, setExistingPhotos] = useState(invitation?.gallery_photos || [])
  const [isSaving, setIsSaving] = useState(false)
  const [photoErrors, setPhotoErrors] = useState([])
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [debugData, setDebugData] = useState(null)
  const [debugLoading, setDebugLoading] = useState(false)

  // Fetch debug info from database
  const fetchDebugData = async () => {
    setDebugLoading(true)
    try {
      const response = await axios.get(`/api/debug/invitation/${subscription.id}`)
      setDebugData(response.data)
      console.log('Debug data retrieved:', response.data)
    } catch (error) {
      console.error('Error fetching debug data:', error)
      alert('Gagal mengambil data debug. Silakan cek console.')
    } finally {
      setDebugLoading(false)
    }
  }

  // Validate file format and size
  const validatePhotoFiles = (files) => {
    const errors = []
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSizeBytes = 5 * 1024 * 1024 // 5MB

    files.forEach((file) => {
      // Check format
      if (!validFormats.includes(file.type)) {
        errors.push(`${file.name}: Format tidak didukung. Hanya JPG, PNG, WebP yang diperbolehkan.`)
      }
      // Check size
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name}: Ukuran terlalu besar. Max 5MB per foto.`)
      }
    })

    return errors
  }

  // Sync form and existing photos when invitation data changes (from props reload)
  useEffect(() => {
    console.log('Invitation data updated:', {
      has_invitation: !!invitation,
      gallery_photos_count: invitation?.gallery_photos?.length || 0,
    })

    // Update existing photos from newly loaded invitation data
    setExistingPhotos(invitation?.gallery_photos || [])

    // Update form data with newly loaded invitation data
    if (invitation) {
      setData({
        groom_name: invitation.groom_name || '',
        bride_name: invitation.bride_name || '',
        groom_father_name: invitation.groom_father_name || '',
        groom_mother_name: invitation.groom_mother_name || '',
        bride_father_name: invitation.bride_father_name || '',
        bride_mother_name: invitation.bride_mother_name || '',
        event_date: invitation.event_date || '',
        ceremony_time: invitation.ceremony_time || '',
        ceremony_location: invitation.ceremony_location || '',
        reception_location: invitation.reception_location || '',
        reception_google_maps_link: invitation.reception_google_maps_link || '',
        love_story: invitation.love_story || '',
        wedding_info: invitation.wedding_info || {},
        uploaded_photos: [],
        removed_photos: [],
        photo_gallery: [],
      })
    }
  }, [invitation?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isActive) {
      alert('Harap selesaikan pembayaran terlebih dahulu.')
      return
    }

    setIsSaving(true)

    try {
      // Use FormData to support file uploads
      const formData = new FormData()

      // Log what we're sending
      console.log('Form data before submission:', data)

      // Add text fields
      Object.keys(data).forEach((key) => {
        if (key === 'uploaded_photos') {
          // Add uploaded files
          if (Array.isArray(data.uploaded_photos)) {
            data.uploaded_photos.forEach((file, index) => {
              if (file instanceof File) {
                formData.append(`uploaded_photos[${index}]`, file)
              }
            })
          }
        } else if (key === 'removed_photos') {
          // Add removed photo IDs
          if (Array.isArray(data.removed_photos)) {
            data.removed_photos.forEach((id, index) => {
              formData.append(`removed_photos[${index}]`, id)
            })
          }
        } else if (typeof data[key] === 'object' && data[key] !== null) {
          // Add JSON fields
          formData.append(key, JSON.stringify(data[key]))
        } else {
          formData.append(key, data[key])
        }
      })

      // Log FormData
      console.log('FormData entries:')
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name})`)
        } else {
          console.log(`  ${key}: ${value}`)
        }
      }

      console.log('Submitting form data...')

      // Use axios for file upload with PUT method to web endpoint (session auth)
      const response = await axios.put(
        `/dashboard/subscriptions/${subscription.id}/invitation`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      console.log('Form submitted successfully!')
      console.log('Response status:', response.status)
      console.log('Response data:', response.data)

      // Show debug info if available
      if (response.data?.debug) {
        console.log('Debug info from server:', response.data.debug)
      }

      // Show success message
      setSuccessMessage('Data undangan berhasil disimpan!')

      // Reset uploaded files state
      setUploadedFiles([])

      // Reset form for new uploads
      setData({
        ...data,
        uploaded_photos: [],
        removed_photos: [],
        photo_gallery: [],
      })

      // Reload page data through Inertia to get fresh data from server
      // This will call PageController::subscriptionDetail which fetches latest data
      setTimeout(() => {
        router.visit(window.location.href, {
          only: ['subscription', 'invitation'],
          preserveScroll: true
        })
      }, 1500)
    } catch (error) {
      console.error('Error saving invitation:', error)
      console.error('Full error object:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      })

      let errorMessage = 'Gagal menyimpan data'
      let debugInfo = ''

      if (error.response?.status === 0) {
        errorMessage = 'Koneksi gagal - silakan cek koneksi internet Anda'
      } else if (error.response?.data?.errors) {
        // Validation errors
        const errors = error.response.data.errors
        errorMessage = Object.values(errors).flat().join(', ')
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      if (error.response?.data?.debug) {
        debugInfo = '\n\nDebug info: ' + JSON.stringify(error.response.data.debug, null, 2)
      }

      alert(`Error: ${errorMessage}${debugInfo}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Kelola Undangan
        </h1>

        {/* Informasi Status Undangan */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Template</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription?.template?.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Subdomain</p>
              <p className="text-lg font-mono font-bold text-purple-600">
                {subscription?.subdomain}.malahproject.test
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                subscription?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {subscription?.status === 'active' ? 'AKTIF' : 'MENUNGGU PEMBAYARAN'}
              </span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-6">
            <p className="text-green-700 font-semibold">✓ {successMessage}</p>
          </div>
        )}

        {/* Debug Info Section */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => {
              setShowDebugInfo(!showDebugInfo)
              if (!showDebugInfo && !debugData) {
                fetchDebugData()
              }
            }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {showDebugInfo ? '▼' : '▶'} Info Debug (Verifikasi Data)
          </button>

          {showDebugInfo && (
            <div className="mt-3 bg-gray-100 rounded p-4 text-xs font-mono overflow-auto max-h-64">
              {debugLoading ? (
                <p className="text-gray-600">Mengambil data...</p>
              ) : debugData ? (
                <>
                  <p className="font-bold mb-2">Data dari Database:</p>
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(debugData, null, 2)}
                  </pre>
                </>
              ) : (
                <p className="text-gray-600">Klik tombol untuk mengambil data dari database</p>
              )}
            </div>
          )}
        </div>

        {/* Pesan jika masih menunggu pembayaran */}
        {!isActive && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
            <p className="text-yellow-700 font-semibold">⏳ Menunggu Pembayaran</p>
            <p className="text-sm text-yellow-600 mt-1">
              Selesaikan pembayaran untuk mulai setup konfigurasi undangan Anda.
            </p>
          </div>
        )}

        {/* Form Pengaturan Konten Undangan */}
        <form onSubmit={handleSubmit} className={`bg-white rounded-lg shadow p-6 space-y-8 ${!isActive ? 'opacity-60 pointer-events-none' : ''}`}>
          {/* Data Mempelai */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-100">
              👫 Data Mempelai
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Mempelai Pria
                </label>
                <input
                  type="text"
                  value={data.groom_name}
                  onChange={(e) => setData('groom_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
                {errors.groom_name && <p className="text-red-500 text-xs mt-1">{errors.groom_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Mempelai Wanita
                </label>
                <input
                  type="text"
                  value={data.bride_name}
                  onChange={(e) => setData('bride_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
                {errors.bride_name && <p className="text-red-500 text-xs mt-1">{errors.bride_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Ayah Mempelai Pria
                </label>
                <input
                  type="text"
                  value={data.groom_father_name}
                  onChange={(e) => setData('groom_father_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Ibu Mempelai Pria
                </label>
                <input
                  type="text"
                  value={data.groom_mother_name}
                  onChange={(e) => setData('groom_mother_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Ayah Mempelai Wanita
                </label>
                <input
                  type="text"
                  value={data.bride_father_name}
                  onChange={(e) => setData('bride_father_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Ibu Mempelai Wanita
                </label>
                <input
                  type="text"
                  value={data.bride_mother_name}
                  onChange={(e) => setData('bride_mother_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Tanggal & Waktu Acara */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-100">
              📅 Tanggal & Waktu Acara
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Acara
                </label>
                <input
                  type="date"
                  value={data.event_date}
                  onChange={(e) => setData('event_date', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
                {errors.event_date && <p className="text-red-500 text-xs mt-1">{errors.event_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waktu Acara (HH:mm)
                </label>
                <input
                  type="time"
                  value={data.ceremony_time}
                  onChange={(e) => setData('ceremony_time', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
                {errors.ceremony_time && <p className="text-red-500 text-xs mt-1">{errors.ceremony_time}</p>}
              </div>
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-100">
              📍 Lokasi Acara
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasi Upacara
                </label>
                <input
                  type="text"
                  value={data.ceremony_location}
                  onChange={(e) => setData('ceremony_location', e.target.value)}
                  placeholder="Contoh: Gereja Santo Petrus, Jl. Merdeka No. 123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasi Resepsi
                </label>
                <input
                  type="text"
                  value={data.reception_location}
                  onChange={(e) => setData('reception_location', e.target.value)}
                  placeholder="Contoh: Hotel Grand Ballroom, Jl. Sudirman No. 456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Google Maps (Optional)
                </label>
                <input
                  type="url"
                  value={data.reception_google_maps_link}
                  onChange={(e) => setData('reception_google_maps_link', e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
                {errors.reception_google_maps_link && <p className="text-red-500 text-xs mt-1">{errors.reception_google_maps_link}</p>}
              </div>
            </div>
          </div>

          {/* Cerita & Informasi Lainnya */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-100">
              💌 Cerita & Informasi
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cerita Cinta Kami
              </label>
              <textarea
                value={data.love_story}
                onChange={(e) => setData('love_story', e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder="Ceritakan kisah cinta kalian di sini... Bagaimana kalian bertemu, momen spesial, dan harapan kalian untuk pernikahan ini."
              />
              {errors.love_story && <p className="text-red-500 text-xs mt-1">{errors.love_story}</p>}
            </div>
          </div>

          {/* Galeri Foto */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-100">
              📸 Galeri Foto (Max: 12 Foto)
            </h2>

            {/* Existing Photos */}
            {existingPhotos.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Foto yang Sudah Diunggah ({existingPhotos.length}/12)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {existingPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={`/storage/${photo.photo_path}`}
                          alt="Gallery"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setExistingPhotos(existingPhotos.filter(p => p.id !== photo.id))
                          setData('removed_photos', [...data.removed_photos, photo.id])
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Area */}
            {existingPhotos.length < 12 && (
              <div className="space-y-4">
                {/* Photo validation errors */}
                {photoErrors.length > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700 font-semibold mb-2">❌ Error Upload Foto:</p>
                    <ul className="text-red-600 text-sm space-y-1">
                      {photoErrors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setPhotoErrors([])}
                      className="text-xs text-red-500 hover:underline mt-2"
                    >
                      Tutup
                    </button>
                  </div>
                )}

                <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-500 transition">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])

                      // Validate files
                      const validationErrors = validatePhotoFiles(files)

                      if (validationErrors.length > 0) {
                        setPhotoErrors(validationErrors)
                        return
                      }

                      // Clear errors if validation passes
                      setPhotoErrors([])

                      const remainingSlots = 12 - existingPhotos.length - uploadedFiles.length
                      const filesToAdd = files.slice(0, remainingSlots)

                      setUploadedFiles([...uploadedFiles, ...filesToAdd])
                      setData('uploaded_photos', [...data.uploaded_photos, ...filesToAdd])
                    }}
                    id="photo-upload"
                    className="hidden"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-700 font-medium mb-1">Klik atau Drag & Drop Foto di Sini</p>
                    <p className="text-sm text-gray-500">Format: JPG, JPEG, PNG, WebP (Max 5MB per foto)</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Sisa slot: {12 - existingPhotos.length - uploadedFiles.length} foto
                    </p>
                  </label>
                </div>

                {/* Preview Uploaded Photos */}
                {uploadedFiles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview Foto yang Akan Diunggah ({uploadedFiles.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
                              setData('uploaded_photos', data.uploaded_photos.filter((_, i) => i !== index))
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.uploaded_photos && <p className="text-red-500 text-xs mt-1">{errors.uploaded_photos}</p>}
              </div>
            )}

            {existingPhotos.length >= 12 && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-blue-700 font-semibold">✓ Galeri Foto Penuh</p>
                <p className="text-sm text-blue-600 mt-1">Anda sudah mencapai batas maksimal 12 foto.</p>
              </div>
            )}
          </div>

          {/* Informasi Pernikahan Tambahan */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-100">
              ℹ️ Informasi Tambahan
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dress Code
                </label>
                <input
                  type="text"
                  value={data.wedding_info?.dress_code || ''}
                  onChange={(e) => setData('wedding_info', { ...data.wedding_info, dress_code: e.target.value })}
                  placeholder="Contoh: Formal / Semi Formal / Batik"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Untuk Hadiah
                </label>
                <input
                  type="text"
                  value={data.wedding_info?.gift_bank || ''}
                  onChange={(e) => setData('wedding_info', { ...data.wedding_info, gift_bank: e.target.value })}
                  placeholder="Contoh: BCA 123456789 a.n. Nama"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-wallet Untuk Hadiah
                </label>
                <input
                  type="text"
                  value={data.wedding_info?.gift_ewallet || ''}
                  onChange={(e) => setData('wedding_info', { ...data.wedding_info, gift_ewallet: e.target.value })}
                  placeholder="Contoh: Gopay/Dana/OVO +62812345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protokol Kesehatan
                </label>
                <textarea
                  value={data.wedding_info?.health_protocol || ''}
                  onChange={(e) => setData('wedding_info', { ...data.wedding_info, health_protocol: e.target.value })}
                  rows={3}
                  placeholder="Contoh: Mohon menggunakan masker, menjaga jarak, dll"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>
              {errors.wedding_info && <p className="text-red-500 text-xs mt-1">{errors.wedding_info}</p>}
            </div>
          </div>

          {/* Tombol Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50"
            >
              {isSaving ? 'Sedang Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
