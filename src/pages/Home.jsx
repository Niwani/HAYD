import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  ThermometerSnowflake,
  PackageCheck,
  UserCheck,
  FileCheck2,
  Building2,
  Zap,
  Lock,
  BadgeCheck,
} from 'lucide-react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { CallToAction } from '@/components/SharedSections'

const STANDARDS_AT_A_GLANCE = [
  { icon: ShieldCheck, label: 'Operating to MHRA guidance' },
  { icon: ThermometerSnowflake, label: 'Temperature-controlled 2–8°C' },
  { icon: PackageCheck, label: 'Tamper-evident packaging' },
  { icon: UserCheck, label: 'DBS-checked couriers' },
  { icon: FileCheck2, label: 'Audit-ready chain of custody' },
]

const FOUR_STEPS = [
  {
    n: '01',
    title: 'Arrange your collection',
    body: 'One call or an online request right here on the website. We confirm your pickup times, delivery window, and specific handling needs.',
  },
  {
    n: '02',
    title: 'Book the round',
    body: 'Daily, twice-weekly or on demand. Repeat rounds are set once and run without a phone call; urgent items are booked up to your cut-off.',
  },
  {
    n: '03',
    title: 'Collected against a manifest',
    body: 'Your team signs items out against the manifest. Our courier checks the count, confirms the temperature carrier and takes custody on the handheld.',
  },
  {
    n: '04',
    title: 'Delivered with proof',
    body: 'Medicines are handed to a named person at the door, and every route reconciles against the manifest the same day.',
  },
]

const WHAT_WE_MOVE = [
  {
    icon: Building2,
    title: 'Pharmacy fulfilment runs',
    body: 'Scheduled collections from your dispensary with a per-patient manifest, and proof of delivery returned the same day.',
  },
  {
    icon: ThermometerSnowflake,
    title: 'Cold-chain transport',
    body: 'Validated insulated carriers and data loggers for medicines that must stay between 2°C and 8°C.',
  },
  {
    icon: Zap,
    title: 'Urgent collections',
    body: 'Same-day and out-of-hours runs for discharges, emergency supplies and time-critical specimens.',
  },
  {
    icon: FileCheck2,
    title: 'Audit trail & reporting',
    body: 'Manifests, proof of delivery and temperature logs retained and available for inspection or audit.',
  },
]

const REGULATORY_STANDARDS = [
  {
    icon: Lock,
    title: 'Unbroken chain of custody',
    body: 'Every handover is time-stamped and named — pharmacy to courier to you, with no anonymous gaps.',
  },
  {
    icon: ThermometerSnowflake,
    title: 'Cold chain, measured',
    body: 'Insulated carriers and a temperature logger on refrigerated items, so the 2–8°C range is proven, not assumed.',
  },
  {
    icon: BadgeCheck,
    title: 'Trained and vetted couriers',
    body: 'DBS-checked, uniformed and trained in medical handling and patient confidentiality before their first route.',
  },
  {
    icon: PackageCheck,
    title: 'Discreet by default',
    body: 'Plain, tamper-evident packaging. No medicine names, no pharmacy branding, nothing visible from the street.',
  },
]

const DISPENSARY_PRIORITIES = [
  {
    tag: 'Complete Chain of Custody',
    title: 'Digital manifests with zero paper chasing',
    body: 'Every prescription is tracked against your dispatch manifest and reconciled the same evening. Digital handovers, timestamped signatures, and geocoded delivery proof keep your dispensary audit-ready without administrative drag.',
    highlights: [
      'Reconciled electronic manifest returned daily',
      'Timestamped signature captured at recipient door',
    ],
  },
  {
    tag: 'GDP & MHRA Aligned',
    title: 'Cold-chain, CD lines and standard scripts on one round',
    body: 'Eliminate the complexity of juggling multiple couriers for different prescription classes. Our validated 2°C–8°C thermal carriers and ID-verified protocols allow your dispensary to dispatch all categories in a single scheduled pickup.',
    highlights: [
      '2°C–8°C validated thermal packaging transport',
      'Named courier ID verification for CD compliance',
    ],
  },
  {
    tag: 'Dispensary Continuity',
    title: 'Reliable scheduled cut-offs that protect workflow',
    body: 'No uncertain collection windows disrupting your checking bench. Dedicated, vetted couriers arrive at your agreed collection slots, giving your dispensary team a predictable rhythm from morning assembly to evening dispatch.',
    highlights: [
      'Fixed daily collection rounds (up to 3x daily)',
      'DBS-checked, uniformed medical couriers',
    ],
  },
]

const FAQS = [
  {
    q: 'Do you operate to MHRA requirements?',
    a: 'We operate to MHRA guidance for the storage, transport and handling of medicines, and our procedures are aligned with Good Distribution Practice. HAYD is a logistics partner, not a pharmacy: the clinical check stays with the dispensing pharmacy, and every item we move has been verified before it reaches us.',
  },
  {
    q: 'How quickly can a prescription go out?',
    a: 'Collections booked before 4pm go out the same day, typically delivered within four hours. Anything after the cut-off goes first thing the next working day, unless you book a scheduled slot.',
  },
  {
    q: 'Do you deliver to patients’ homes?',
    a: 'Yes. We deliver to private addresses, workplaces and residential settings, with a named handover and proof of delivery returned to your pharmacy the same day.',
  },
  {
    q: 'How are controlled drugs handled?',
    a: 'Controlled drugs move on a dedicated route with formal chain of custody, ID-verified handover and a named courier. We agree the procedure in writing with the supplying pharmacy before the first collection.',
  },
  {
    q: 'What records does a partner receive?',
    a: 'Every consignment comes with a signed manifest, proof of delivery and, where relevant, a temperature log. Records are retained and available for inspection or audit, and reconciled monthly for account customers.',
  },
  {
    q: 'Which areas do you cover?',
    a: 'Dispatch will confirm coverage for your postcode and cut-off times when you open an account. Multi-site groups can be served from a single account with reporting split by site.',
  },
]

export default function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#050D1C]" aria-label="HAYD hero">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(78% 106% at 26% 42%, rgba(31,158,150,0.34) 0%, rgba(16,72,110,0.22) 34%, rgba(5,13,28,0) 68%)',
          }}
        />
        <div
          className="pointer-events-none absolute -right-32 -top-24 h-[30rem] w-[30rem] rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(31,158,150,0.5), transparent 65%)',
          }}
        />
        <div className="container-page relative">
          <div className="grid items-stretch gap-12 py-14 md:py-20 lg:grid-cols-[1fr_minmax(0,44%)] lg:gap-14 lg:py-24">
            <div className="flex min-w-0 flex-col justify-between gap-10 text-white">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
                  <span className="label-caps text-white/55">Regulated medicines logistics</span>
                </div>
                <h1 className="mt-7 font-heading text-[clamp(2.6rem,7.4vw,5.6rem)] font-medium leading-[0.98] tracking-[-0.035em] text-white">
                  Your counter.
                  <br />
                  Their door.
                </h1>
              </div>
              <div className="max-w-md">
                <p className="text-[1.0625rem] leading-relaxed text-white/65">
                  HAYD works directly with pharmacies — collecting, moving and handing over
                  prescription medicines under MHRA guidance, with the chain of custody intact.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/partners"
                    className="group inline-flex items-center gap-3 rounded-full border border-white/35 px-7 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white transition-colors duration-300 hover:border-white hover:bg-white/10"
                  >
                    Partner with HAYD
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      strokeWidth={1.5}
                    />
                  </Link>
                  <Link
                    to="/request"
                    className="inline-flex items-center gap-2 text-sm font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    Book a collection
                  </Link>
                </div>
              </div>
            </div>

            <figure className="relative order-first w-full overflow-hidden rounded-2xl bg-[#04101F] lg:order-none lg:max-w-[calc(100%-2rem)] lg:justify-self-end">
              <img
                src="/images/hero-doorway.png"
                alt="A gloved hand holding a sealed HAYD medication parcel at a home doorway."
                className="h-[19rem] w-full object-cover sm:h-[24rem] lg:h-full"
              />
              <figcaption className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#08162E]/70 px-4 py-3 backdrop-blur-md">
                <span className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-white/70">
                  Cold chain · 2–8°C logged
                </span>
                <span className="flex items-center gap-1.5 text-[0.7rem] font-medium text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--signal))]" />
                  Live tracking
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card" aria-label="Standards at a glance">
        <div className="container-page">
          <ul className="grid grid-cols-2 divide-border md:grid-cols-5 md:divide-x">
            {STANDARDS_AT_A_GLANCE.map(({ icon: Icon, label }, idx) => (
              <li
                key={label}
                className={`flex items-center gap-3 py-5 md:justify-center md:py-6 ${
                  idx === STANDARDS_AT_A_GLANCE.length - 1 ? 'col-span-2 md:col-span-1' : ''
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.7} />
                <span className="text-[0.78rem] font-medium leading-snug text-foreground/70">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-background py-20 md:py-28">
        <div className="container-page">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="label-caps text-accent">The HAYD route</span>
              <h2 className="mt-5 text-[clamp(2rem,4.2vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
                Four steps from your counter to the door
              </h2>
            </div>
            <Link
              to="/partners"
              className="group inline-flex items-center gap-2 self-start text-sm font-medium text-foreground transition-colors hover:text-accent md:self-auto"
            >
              Partner with HAYD
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.8}
              />
            </Link>
          </div>

          <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {FOUR_STEPS.map((step, idx) => (
              <li key={step.n} className="relative">
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
                {idx === 0 && <span className="sr-only">Begin the HAYD journey</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-border bg-card py-20 md:py-28">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.6fr] lg:gap-16">
            <div>
              <span className="label-caps text-accent">What we move</span>
              <h2 className="mt-5 text-[clamp(2rem,4.2vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
                Built for regulated goods, not parcels
              </h2>
              <p className="mt-5 max-w-sm text-[1rem] leading-relaxed text-muted-foreground">
                Every route is designed around a manifest: counted out, temperature-aware, signed for
                at both ends and never left unattended.
              </p>
              <Link
                to="/services"
                className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-accent"
              >
                Explore all services
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.8}
                />
              </Link>
            </div>

            <div className="grid gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-2">
              {WHAT_WE_MOVE.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="group bg-card p-7 transition-colors duration-300 hover:bg-background"
                >
                  <Icon className="h-5 w-5 text-accent" strokeWidth={1.6} />
                  <h3 className="mt-5 font-heading text-[1.0625rem] font-semibold tracking-[-0.01em] text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2.5 text-[0.9rem] leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 md:py-28">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src="/images/cold-chain-pouch.png"
              alt="An insulated medical delivery pouch with a temperature logger and cold pack on a stainless steel bench."
              className="h-[22rem] w-full object-cover sm:h-[30rem]"
            />
            <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-[#08162E]/75 px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-md">
              2–8°C verified
            </div>
          </div>

          <div>
            <span className="label-caps text-accent">Regulatory standards</span>
            <h2 className="mt-5 text-[clamp(2rem,4.2vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
              Built to the standard the sector is held to
            </h2>
            <p className="mt-5 max-w-lg text-[1rem] leading-relaxed text-muted-foreground">
              Our procedures follow MHRA guidance and align with Good Distribution Practice. Patient
              safety first, speed second — and the records to prove both.
            </p>
            <dl className="mt-10 grid gap-8 sm:grid-cols-2">
              {REGULATORY_STANDARDS.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                    <Icon className="h-4 w-4 text-accent" strokeWidth={1.7} />
                  </span>
                  <dt className="mt-4 font-heading text-[0.975rem] font-semibold tracking-[-0.01em] text-foreground">
                    {title}
                  </dt>
                  <dd className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                    {body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40 py-20 md:py-28">
        <div className="container-page">
          <div className="max-w-2xl">
            <span className="label-caps text-accent">Dispensing priorities</span>
            <h2 className="mt-5 text-[clamp(2rem,4.2vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
              Built for how dispensaries actually operate
            </h2>
            <p className="mt-4 text-[1rem] leading-relaxed text-muted-foreground">
              We design our rounds around the accountability, regulatory compliance, and audit trails
              required by pharmacy managers and superintendent pharmacists.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {DISPENSARY_PRIORITIES.map((item) => (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-8 transition-shadow duration-300 hover:shadow-lift"
              >
                <div>
                  <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-wider text-accent">
                    {item.tag}
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-bold leading-snug tracking-[-0.015em] text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>

                <ul className="mt-8 space-y-2.5 border-t border-border pt-6 text-xs font-medium text-foreground/85">
                  {item.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                        ✓
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-20 md:py-28">
        <div className="container-page grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <span className="label-caps text-accent">Questions</span>
            <h2 className="mt-5 text-[clamp(2rem,4.2vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
              Answers before you appoint a partner
            </h2>
            <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">
              Still unsure about something? The partnerships team answers calls between 8am and 8pm,
              Monday to Saturday.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, idx) => (
              <AccordionItem key={faq.q} value={`item-${idx}`} className="border-border">
                <AccordionTrigger className="py-5 text-left font-heading text-[1rem] font-medium tracking-[-0.01em] text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[0.925rem] leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <CallToAction />
    </>
  )
}

