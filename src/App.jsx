import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout, ScrollToTop } from '@/components/Layout'
import Home from '@/pages/Home'
import Services from '@/pages/Services'
import Partners from '@/pages/Partners'
import About from '@/pages/About'
import Request from '@/pages/Request'
import Track from '@/pages/Track'
import Contact from '@/pages/Contact'
import Privacy from '@/pages/Privacy'
import Terms from '@/pages/Terms'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/about" element={<About />} />
          <Route path="/request" element={<Request />} />
          <Route path="/track" element={<Track />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

