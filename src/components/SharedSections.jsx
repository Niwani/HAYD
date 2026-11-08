import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function PageHero({ eyebrow, title, intro, children }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-primary">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 130% at 15% 10%, rgba(31,158,150,0.32) 0%, rgba(8,22,46,0) 62%)',
        }}
      />
      <div className="container-page relative py-16 md:py-24">
        <div className="max-w-3xl">
          {eyebrow && <span className="label-caps text-white/50">{eyebrow}</span>}
          <h1 className="mt-5 text-[clamp(2.25rem,5.2vw,4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-white">
            {title}
          </h1>
          {intro && (
            <p className="mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-white/65">{intro}</p>
          )}
          {children}
        </div>
      </div>
    </section>
  )
}

export function CallToAction({
  title = 'Move medicines on one accountable route.',
  body = 'Open a trade account and we will build your collection schedule — from a single pharmacy counter to a multi-site group.',
  primary = { label: 'Partner with HAYD', to: '/partners' },
  secondary = { label: 'Speak to the team', to: '/contact' },
}) {
  return (
    <section className="relative overflow-hidden bg-primary py-20 md:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 120% at 80% 20%, rgba(31,158,150,0.35) 0%, rgba(8,22,46,0) 65%)',
        }}
      />
      <div className="container-page relative flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
        <div className="max-w-xl">
          <h2 className="text-[clamp(1.9rem,3.6vw,2.85rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-white">
            {title}
          </h2>
          <p className="mt-4 text-[0.975rem] leading-relaxed text-white/60">{body}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Link
            to={primary.to}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-primary transition-all duration-300 hover:bg-white/90"
          >
            {primary.label}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={1.8}
            />
          </Link>
          <Link
            to={secondary.to}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-7 py-4 text-sm font-medium text-white transition-colors duration-300 hover:border-white hover:bg-white/10"
          >
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  )
}

