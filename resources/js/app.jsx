import React from 'react'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import Layout from './Layouts/Layout'
import './bootstrap'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true })
    const page = pages[`./Pages/${name}.jsx`]

    if (!page) {
      console.error(`Page not found: ${name}`)
      // Return a fallback page instead of throwing error
      const NotFound = () => (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">Halaman tidak ditemukan</p>
            <a href="/" className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
              Kembali ke Beranda
            </a>
          </div>
        </div>
      )
      NotFound.layout = page => <Layout>{page}</Layout>
      return { default: NotFound }
    }

    page.default.layout = page.default.layout || (page => <Layout children={page} />)
    return page
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
