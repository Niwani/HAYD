import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Check,
  ShieldCheck,
  ThermometerSnowflake,
  PackageCheck,
  FileCheck2,
  UserCheck,
  ClipboardList,
} from 'lucide-react'
import { PageHero, CallToAction } from '@/components/SharedSections'

const PARTNER_SECTIONS = [
  {
    id: 'pharmacies',
    n: '01',
    kicker: 'Pharmacies',
    title: 'Fulfilment routes that hold up to scrutiny',
    body: 'We collect from your dispensary on a schedule you set, deliver to patients and give you a reconciled manifest each evening — so you can see exactly what left, when it left, and who signed for it.',
    points: [
      'Scheduled daily, twice-daily or on-demand collections',
      'Per-patient manifest with a signature at both ends',
      'Private and NHS prescriptions, including fridge lines',
    ],
    image: '/images/pharmacist-checking.png',
    alt: 'A pharmacist checking a prescription against a tablet in a minimal pharmacy.',
  },
]

const COMPLIANCE_CONTROLS = [
  {
    icon: ShieldCheck,
    title: 'MHRA guidance, applied',
    body: 'Our procedures for transporting medicines follow MHRA guidance and are aligned with Good Distribution Practice. The clinical check stays with the dispensing pharmacy; we move what has been verified.',
  },
  {
    icon: ThermometerSnowflake,
    title: 'Temperature, evidenced',
    body: 'Validated insulated carriers, calibrated data loggers and retained records for every 2–8°C consignment. If a reading moves, you hear it from us first.',
  },
  {
    icon: PackageCheck,
    title: 'Tamper-evident packaging',
    body: 'Plain outer packaging with no medicine names or pharmacy branding. Every parcel is sealed and numbered against its manifest.',
  },
  {
    icon: FileCheck2,
    title: 'Audit-ready records',
    body: 'Every handover is named and time-stamped. Manifests, proof of delivery and temperature logs are available for inspection or audit.',
  },
  {
    icon: UserCheck,
    title: 'Trained, DBS-checked couriers',
    body: 'Uniformed couriers trained in medicines handling and confidentiality before their first route. No subcontracted drivers on regulated routes.',
  },
  {
    icon: ClipboardList,
    title: 'SOPs aligned with your dispensary',
    body: 'We follow strict standard operating procedures aligned with your dispensary requirements, ensuring compliance from day one.',
  },
]

const ONBOARDING_STEPS = [
  {
    n: '01',
    title: 'Initial contact',
    body: 'Tell us your collection times, address and regular delivery requirements via our online form or a quick call to dispatch.',
  },
  {
    n: '02',
    title: 'Agree your collection times',
    body: 'We confirm your pickup windows, daily cut-offs, and any cold-chain or controlled drug requirements.',
  },
  {
    n: '03',
    title: 'Start collections',
    body: 'Rounds start smoothly on your agreed schedule. You can book collections or track deliveries right here on the website.',
  },
]

export default function Partners() {
  return (
    <>
      <PageHero
        eyebrow="Partners"
        title="A delivery partner for pharmacies"
        intro="HAYD moves prescription medicines on behalf of the pharmacies accountable for them — with MHRA-guided procedures, GDP-aligned processes and an unbroken chain of custody from your counter to the patient’s door."
      >
        <Link
          to="/contact"
          className="group mt-8 inline-flex items-center gap-3 rounded-full border border-white/30 px-6 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white/10"
        >
          Open a partner account
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={1.6}
          />
        </Link>
      </PageHero>

      <section className="bg-background">
        {PARTNER_SECTIONS.map((sec, idx) => (
          <div
            key={sec.id}
            id={sec.id}
            className={`scroll-mt-24 ${idx > 0 ? 'border-t border-border' : ''}`}
          >
            <div className="container-page grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2 lg:gap-20">
              <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs tracking-[0.18em] text-accent">{sec.n}</span>
                  <span className="h-px flex-1 bg-border" />
                  <span className="label-caps text-muted-foreground">{sec.kicker}</span>
                </div>
                <h2 className="mt-6 text-[clamp(1.7rem,3.4vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground">
                  {sec.title}
                </h2>
                <p className="mt-5 max-w-lg text-[1rem] leading-relaxed text-muted-foreground">
                  {sec.body}
                </p>
                <ul className="mt-7 space-y-3">
                  {sec.points.map((pt) => (
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
                  src={sec.image}
                  alt={sec.alt}
                  className="h-[20rem] w-full rounded-2xl object-cover sm:h-[26rem]"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="border-y border-border bg-card py-16 md:py-24">
        <div className="container-page">
          <div className="max-w-2xl">
            <span className="label-caps text-accent">Compliance</span>
            <h2 className="mt-5 text-[clamp(1.9rem,3.8vw,2.9rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-foreground">
              Built to the standard the sector is held to
            </h2>
            <p className="mt-5 text-[0.975rem] leading-relaxed text-muted-foreground">
              Regulated transport is a records problem as much as a driving one. These are the
              controls behind every HAYD route.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-border md:grid-cols-2 lg:grid-cols-3">
            {COMPLIANCE_CONTROLS.map(({ icon: Icon, title, body }) => (
              <article key={title} className="bg-card p-7">
                <Icon className="h-5 w-5 text-accent" strokeWidth={1.6} />
                <h3 className="mt-5 font-heading text-[1rem] font-semibold tracking-[-0.01em] text-foreground">
                  {title}
                </h3>
                <p className="mt-2.5 text-[0.875rem] leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-8 max-w-3xl text-[0.78rem] leading-relaxed text-muted-foreground">
            HAYD is a healthcare logistics provider, not a pharmacy. Dispensing and clinical checks
            are carried out by our partner pharmacies.
          </p>
        </div>
      </section>

      <section className="bg-background py-16 md:py-24">
        <div className="container-page">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <span className="label-caps text-accent">Onboarding</span>
              <h2 className="mt-5 text-[clamp(1.9rem,3.8vw,2.9rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-foreground">
                Live in about a week
              </h2>
            </div>
            <Link
              to="/request"
              className="group inline-flex items-center gap-2 self-start text-sm font-medium text-foreground transition-colors hover:text-accent md:self-auto"
            >
              Book a one-off collection
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.8}
              />
            </Link>
          </div>

          <ol className="mt-12 grid gap-10 sm:grid-cols-3">
            {ONBOARDING_STEPS.map((step) => (
              <li key={step.n}>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs tracking-[0.18em] text-accent">{step.n}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <h3 className="mt-6 font-heading text-lg font-semibold tracking-[-0.01em] text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 text-[0.925rem] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CallToAction
        title="Tell us what you need moved"
        body="Send your volumes, collection points and cut-offs. We will come back with a route plan, a copy of the manifest we use and pricing."
        primary={{ label: 'Talk to partnerships', to: '/contact' }}
        secondary={{ label: 'Book a collection', to: '/request' }}
      />
    </>
  )
}

