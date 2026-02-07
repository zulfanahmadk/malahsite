import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import Layout from './Layouts/Layout'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true })
    const page = pages[`./Pages/${name}.jsx`]

    if (!page) {
      console.error(`Page not found: ${name}`)
      throw new Error(`Page not found: ${name}`)
    }

    page.default.layout = page.default.layout || (page => <Layout children={page} />)
    return page
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
