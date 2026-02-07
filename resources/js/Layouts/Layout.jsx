import { useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'
import Navigation from '@/Components/Navigation'

export default function Layout({ children }) {
  const { auth } = usePage().props

  return (
    <div className="min-h-screen bg-white">
      <Navigation user={auth?.user} />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
