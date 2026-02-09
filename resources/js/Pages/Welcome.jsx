import React, { useState, useEffect } from 'react'
import { Link, usePage } from '@inertiajs/react'

export default function Welcome() {
  const props = usePage().props
  const initialTemplates = Array.isArray(props.templates) ? props.templates : []
  const branding = props.branding || {}
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [filteredTemplates, setFilteredTemplates] = useState(initialTemplates)
  const [expandedFaqId, setExpandedFaqId] = useState(null)

  useEffect(() => {
    if (selectedCategory) {
      setFilteredTemplates(
        initialTemplates.filter(t => t.category === selectedCategory)
      )
    } else {
      setFilteredTemplates(initialTemplates)
    }
  }, [selectedCategory, initialTemplates])

  const faqItems = [
    {
      id: 1,
      question: 'Bagaimana cara membuat undangan digital?',
      answer: 'Anda cukup mendaftar akun, memilih template yang diinginkan, kemudian mengisi data acara Anda. Setelah itu, undangan siap dibagikan kepada tamu melalui link atau QR code.'
    },
    {
      id: 2,
      question: 'Apakah saya bisa mengedit template setelah membelinya?',
      answer: 'Ya, tentu saja. Semua template dapat diedit sepenuhnya. Anda bisa mengubah warna, teks, foto, dan elemen lainnya sesuai keinginan Anda.'
    },
    {
      id: 3,
      question: 'Berapa lama waktu yang dibutuhkan untuk membuat undangan?',
      answer: 'Proses pembuatan sangat cepat, biasanya hanya membutuhkan waktu 15-30 menit tergantung dari jumlah perubahan yang ingin Anda lakukan.'
    },
    {
      id: 4,
      question: 'Apakah template bisa digunakan untuk acara lain?',
      answer: 'Template undangan pernikahan dirancang khusus untuk pernikahan. Namun, Anda dapat mengeditnya untuk disesuaikan dengan acara lainnya jika diperlukan.'
    },
    {
      id: 5,
      question: 'Bagaimana cara tamu merespon undangan?',
      answer: 'Tamu dapat merespon melalui fitur RSVP yang ada di undangan digital. Respons mereka akan tercatat otomatis di dashboard Anda untuk memudahkan pencatatan.'
    }
  ]

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Hero Section */}
      <section id="home" className="py-20 px-4 text-center pt-32">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Buat Undangan Digital Pernikahan Impianmu
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Platform terpercaya untuk membuat undangan digital yang cantik, murah, dan instan
        </p>
        <Link
          href="/register"
          className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105"
        >
          Buat Undangan Sekarang
        </Link>
      </section>

      {/* Filters */}
      <section className="py-8 px-4 bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                !selectedCategory
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semua
            </button>
            {['Floral', 'Minimalis', 'Adat', 'Luxury'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Template Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Tidak ada template yang sesuai</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTemplates.map(template => (
                <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-xl transition overflow-hidden">
                  {template.thumbnail_path && (
                    <img
                      src={template.thumbnail_path}
                      alt={template.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-purple-600">
                        Rp {Number(template.price || 0).toLocaleString('id-ID')}
                      </span>
                      {template.category && (
                        <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                          {template.category}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(template.demo_url, '_blank')}
                        className="flex-1 border border-purple-600 text-purple-600 py-2 rounded hover:bg-purple-50 transition font-medium"
                      >
                        Lihat Demo
                      </button>
                      <Link
                        href="/login"
                        className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition font-medium text-center"
                      >
                        Beli
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Pertanyaan yang Sering Diajukan
          </h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
              >
                <button
                  onClick={() => setExpandedFaqId(expandedFaqId === item.id ? null : item.id)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900 text-left">
                    {item.question}
                  </h3>
                  <svg
                    className={`w-6 h-6 text-purple-600 transition-transform ${
                      expandedFaqId === item.id ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                {expandedFaqId === item.id && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
