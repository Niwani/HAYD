import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ShieldCheck, Phone, Mail, MapPin, Clock3 } from 'lucide-react'
import { Logo } from '@/components/Logo'

const FOOTER_GROUPS = [
  {
    title: 'Services',
    links: [
      { label: 'Pharmacy fulfilment', to: '/services' },
      { label: 'Repeat prescription rounds', to: '/services' },
      { label: 'Cold-chain transport', to: '/services' },
      { label: 'Urgent collections', to: '/services' },
      { label: 'Controlled drug deliveries', to: '/services' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About HAYD', to: '/about' },
      { label: 'Partners', to: '/partners' },
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Track a delivery', to: '/track' },
      { label: 'Contact', to: '/contact' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-primary text-primary-foreground">
      <div
        className="pointer-events-none absolute -left-40 top-0 h-[36rem] w-[36rem] rounded-full opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent) / 0.55), transparent 65%)',
        }}
      />
      <div className="container-page relative py-16 md:py-24">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo variant="light" showTagline />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/65">
              HAYD — Health At Your Door. Regulated transport for prescription medicines, working
              directly with pharmacies.
            </p>
            <Link
              to="/request"
              className="group mt-8 inline-flex items-center gap-3 rounded-full border border-white/25 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Book a collection
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.8}
              />
            </Link>
            <div className="mt-8 flex items-center gap-2 text-xs text-white/50">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.6} />
              MHRA-guided procedures · GDP-aligned · UK GDPR · Fully insured
            </div>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <div key={group.title} className="md:col-span-2">
              <h3 className="label-caps text-white/40">{group.title}</h3>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-3">
            <h3 className="label-caps text-white/40">Dispatch</h3>
            <ul className="mt-5 space-y-4 text-sm text-white/70">
              <li>
                <a
                  href="tel:+447761734423"
                  className="inline-flex items-center gap-2.5 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4" strokeWidth={1.6} />
                  07761 734423
                </a>
              </li>
              <li>
                <a
                  href="mailto:healthatyourdoor.co@gmail.com"
                  className="inline-flex items-center gap-2.5 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.6} />
                  healthatyourdoor.co@gmail.com
                </a>
              </li>
              <li className="inline-flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
                <span>
                  Osbourne Suite, 2.08 Imperial and Whitehall
                  <br />
                  23 Colmore Row, Birmingham, B3 2BS
                </span>
              </li>
              <li className="inline-flex items-start gap-2.5">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
                <span>
                  Mon–Sat, 8am–8pm
                  <br />
                  Same-day cut-off 4pm
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} HAYD Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/privacy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-white">
              Terms
            </Link>
            <Link to="/dispatch" className="opacity-40 transition-opacity hover:opacity-100 hover:text-white">
              Staff Portal
            </Link>
            <span>Registered in England &amp; Wales</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

