import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check } from 'lucide-react'
import { PageHero, CallToAction } from '@/components/SharedSections'

const SERVICE_ROUTES = [
  {
    n: '01',
    title: 'Pharmacy fulfilment runs',
    body: 'We collect from your dispensary on a schedule you set and deliver to patients, returning proof of delivery against your manifest the same day. Private and NHS prescriptions, including fridge lines and controlled drugs.',
    points: [
      'Daily, twice-daily or on-demand collections',
      'Per-patient manifest, signed at both ends',
      'Controlled drugs on a dedicated courier',
    ],
    image: '/images/pharmacist-checking.png',
    alt: 'A pharmacist checking a prescription against a tablet in a minimal pharmacy.',
  },
  {
    n: '02',
    title: 'Urgent and out-of-hours runs',
    body: 'Hospital discharges, antibiotics started late, a patient leaving A&E at nine at night. Urgent collections are dispatched within the hour and prioritised ahead of standard routes.',
    points: [
      'Booked up to a 4pm cut-off for same-day',
      'Priority hospital-discharge and end-of-day runs',
      'Direct line to dispatch',
    ],
    image: '/images/courier-door.png',
    alt: 'A courier in a navy uniform holding a sealed medication package at a front door.',
  },
  {
    n: '03',
    title: 'Cold-chain and controlled drugs',
    body: 'Refrigerated lines travel in validated insulated carriers with a data logger. Controlled drugs move on a dedicated courier with formal chain of custody and ID-verified handover.',
    points: [
      '2–8°C carriers with a temperature record',
      'Controlled drugs, ID-verified handover',
      'Written procedure agreed with your pharmacy',
    ],
    image: '/images/dispatch-bench.png',
    alt: 'An overhead view of a dispatch bench with sealed medication parcels and gloved hands.',
  },
]

const NON_NEGOTIABLES = [
  'Every collection is matched to a manifest and signed at both ends.',
  'Refrigerated items travel in validated carriers with a data logger.',
  'Tamper-evident, unbranded packaging — nothing identifies the contents.',
  'Controlled drugs move with formal chain of custody and ID-verified handover.',
]

export default function Services() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Prescription logistics, handled properly"
        intro="Three core routes, one standard. We collect from your dispensary, deliver to patients and return proof of delivery against your manifest — counted, temperature-aware and signed for at both ends."
      >
        <Link
          to="/request"
          className="group mt-8 inline-flex items-center gap-3 rounded-full border border-white/30 px-6 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white/10"
        >
          Book a collection
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={1.6}
          />
        </Link>
      </PageHero>

      <section className="bg-background">
        {SERVICE_ROUTES.map((route, idx) => (
          <div key={route.n} className={idx > 0 ? 'border-t border-border' : ''}>
            <div className="container-page grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2 lg:gap-20">
              <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                <span className="font-mono text-xs tracking-[0.18em] text-accent">{route.n}</span>
                <h2 className="mt-4 text-[clamp(1.7rem,3.4vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground">
                  {route.title}
                </h2>
                <p className="mt-5 max-w-lg text-[1rem] leading-relaxed text-muted-foreground">
                  {route.body}
                </p>
                <ul className="mt-7 space-y-3">
                  {route.points.map((pt) => (
                    <li
                      key={pt}
                      className="flex items-start gap-3 text-[0.9rem] text-foreground/80"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.2} />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={idx % 2 === 1 ? 'lg:order-1' : ''}>
                <img
                  src={route.image}
                  alt={route.alt}
                  className="h-[20rem] w-full rounded-2xl object-cover sm:h-[26rem]"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="border-t border-border bg-card py-16 md:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <span className="label-caps text-accent">Non-negotiables</span>
            <h2 className="mt-5 text-[clamp(1.75rem,3.4vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground">
              What every collection includes
            </h2>
            <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">
              Trade terms are agreed per route at onboarding, with a written procedure and a trial
              run before the first regulated item moves.
            </p>
          </div>

          <ul className="grid gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-2">
            {NON_NEGOTIABLES.map((item, idx) => (
              <li key={item} className="bg-card p-6">
                <span className="font-mono text-[0.7rem] tracking-[0.18em] text-accent">
                  0{idx + 1}
                </span>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-foreground/80">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CallToAction
        title="Not sure which route you need?"
        body="Tell us your volumes, collection points and cut-off times. We will map the route, confirm coverage and send pricing the same working day."
        primary={{ label: 'Partner with HAYD', to: '/partners' }}
        secondary={{ label: 'Talk to us', to: '/contact' }}
      />
    </>
  )
}

