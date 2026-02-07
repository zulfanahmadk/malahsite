import { useState, useEffect } from 'react'
import { Link } from '@inertiajs/react'

export default function Welcome() {
  const [templates, setTemplates] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [filteredTemplates, setFilteredTemplates] = useState([])

  useEffect(() => {
    // Fetch templates from API
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates || [])
        setFilteredTemplates(data.templates || [])
      })
      .catch(err => console.error('Failed to fetch templates:', err))
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      setFilteredTemplates(
        templates.filter(t => t.category === selectedCategory)
      )
    } else {
      setFilteredTemplates(templates)
    }
  }, [selectedCategory, templates])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center pt-32">
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
                        Rp {template.price.toLocaleString('id-ID')}
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
    </div>
  )
}
