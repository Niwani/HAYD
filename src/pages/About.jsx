import React from 'react'
import { HandHeart, Route, Eye, HeartPulse } from 'lucide-react'
import { PageHero, CallToAction } from '@/components/SharedSections'

const ABOUT_CARDS = [
  {
    icon: HandHeart,
    title: 'Our mission',
    body: 'Take the effort out of regulated transport. A collection should arrive the way a checked order does — counted, signed for, and never chased.',
  },
  {
    icon: Route,
    title: 'How we started',
    body: 'HAYD was built after watching a neighbour miss two days of medication because the pharmacy closed before she could collect it. The first route was one van, five pharmacies and a printed list.',
  },
  {
    icon: Eye,
    title: 'Our vision',
    body: 'A network where any pharmacy can hand over a route — and know exactly where it went, and who signed for it.',
  },
]

const STATS = [
  { value: '4h', label: 'Average same-day collection' },
  { value: '2–8°C', label: 'Cold chain, data-logged' },
  { value: '100%', label: 'Signed handovers' },
  { value: '0', label: 'Regulated items unattended' },
]

const VALUES = [
  {
    title: 'Patient first, always',
    body: 'If a route runs late, the medicine still comes first. We tell you before you have to ask.',
  },
  {
    title: 'Nothing unverified',
    body: 'Speed never outranks the pharmacist’s check. A delayed delivery is recoverable; a wrong dose is not.',
  },
  {
    title: 'Quiet professionalism',
    body: 'Uniformed, DBS-checked couriers who call ahead, remove their shoes at the door and never discuss what is in the parcel.',
  },
  {
    title: 'Show the working',
    body: 'Live status, named handovers and a real person on the phone. Trust is built from evidence, not promises.',
  },
]

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About HAYD"
        title="Regulated transport, run by people who answer the phone"
        intro="HAYD is a healthcare logistics company working directly with pharmacies. Prescriptions out, proof back, one accountable route — with MHRA-guided procedures throughout."
      />

      <section className="bg-background py-16 md:py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="overflow-hidden rounded-2xl">
            <img
              src="/images/dispatch-bench.png"
              alt="An overhead view of the HAYD dispatch bench with sealed medication parcels."
              className="h-[22rem] w-full object-cover sm:h-[30rem]"
            />
          </div>
          <div>
            <span className="label-caps text-accent">Why we exist</span>
            <h2 className="mt-5 text-[clamp(1.9rem,3.8vw,3rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-foreground">
              Delivering more than medicine
            </h2>
            <div className="mt-6 space-y-5 text-[1rem] leading-relaxed text-muted-foreground">
              <p>
                A prescription that never reaches the person it was written for is not a delivery
                problem — it is a clinical one. We work directly with the pharmacies that carry that
                responsibility, and we treat it the way they do.
              </p>
              <p>
                HAYD moves medicines from your dispensary to the patient’s door. Every route runs
                against a manifest, every handover is named, and every temperature-sensitive item
                arrives with a record to prove it.
              </p>
              <p>
                Our procedures follow MHRA guidance and are aligned with Good Distribution Practice.
                The clinical check stays where it belongs — with the pharmacist — and the audit
                trail stays with you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-primary py-14">
        <div className="container-page grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((item) => (
            <div key={item.label}>
              <div className="font-heading text-[clamp(1.8rem,3.6vw,2.6rem)] font-semibold tracking-[-0.03em] text-white">
                {item.value}
              </div>
              <div className="mt-2 text-[0.78rem] leading-snug text-white/55">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-background py-16 md:py-24">
        <div className="container-page grid gap-px overflow-hidden rounded-2xl bg-border md:grid-cols-3">
          {ABOUT_CARDS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="bg-card p-8">
              <Icon className="h-5 w-5 text-accent" strokeWidth={1.6} />
              <h3 className="mt-5 font-heading text-[1.05rem] font-semibold tracking-[-0.01em] text-foreground">
                {title}
              </h3>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-background pb-16 md:pb-24">
        <div className="container-page grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <span className="label-caps text-accent">What we hold to</span>
            <h2 className="mt-5 text-[clamp(1.75rem,3.4vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground">
              Four values that survive a busy Tuesday
            </h2>
            <p className="mt-5 flex items-start gap-2.5 text-[0.9rem] leading-relaxed text-muted-foreground">
              <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.7} />
              Values are only real when they change what happens at 4:55pm on the last run of the
              day.
            </p>
          </div>

          <dl className="space-y-8">
            {VALUES.map((val, idx) => (
              <div
                key={val.title}
                className="grid gap-2 border-b border-border pb-8 last:border-0 last:pb-0 sm:grid-cols-[3rem_1fr]"
              >
                <dt className="font-mono text-xs tracking-[0.16em] text-accent">0{idx + 1}</dt>
                <dd>
                  <span className="block font-heading text-[1rem] font-semibold text-foreground">
                    {val.title}
                  </span>
                  <span className="mt-1.5 block text-[0.9rem] leading-relaxed text-muted-foreground">
                    {val.body}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CallToAction
        title="A pharmacy ready to hand over the run? Start here."
        body="We onboard partner pharmacies within about a week, including a trial run and a written procedure before anything moves."
        primary={{ label: 'Partner with HAYD', to: '/partners' }}
        secondary={{ label: 'Book a collection', to: '/request' }}
      />
    </>
  )
}

