import React, { useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'
import Navigation from '@/Components/Navigation'
import Footer from '@/Components/Footer'

export default function Layout({ children }) {
  const { auth } = usePage().props

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation user={auth?.user} />
      <main className="pt-16 flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  )
}
