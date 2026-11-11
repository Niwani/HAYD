import React, { useEffect } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ChatWidget } from '@/components/ChatWidget'

export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if (navType !== 'POP') {
      if (hash) {
        const id = decodeURIComponent(hash.slice(1))
        const timer = window.setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
        return () => window.clearTimeout(timer)
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [pathname, hash, navType])

  return null
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

