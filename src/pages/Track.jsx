import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Check,
  MapPin,
  Clock3,
  Phone,
  ArrowRight,
  LoaderCircle,
} from 'lucide-react'
import { PageHero } from '@/components/SharedSections'
import { storageClient } from '@/lib/storage'
import { cn } from '@/lib/utils'

const STATUS_STEPS = [
  { id: 'received', label: 'Request received', detail: 'We have your prescription request.' },
  {
    id: 'verifying',
    label: 'Pharmacist verification',
    detail: 'Your prescription is being checked at the counter.',
  },
  {
    id: 'dispatched',
    label: 'Out for delivery',
    detail: 'A courier has collected it and is on the route.',
  },
  { id: 'delivered', label: 'Delivered', detail: 'Signed for at your door.' },
]

export default function Track() {
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleTrack = async (e) => {
    e.preventDefault()
    const trimmed = reference.trim().toUpperCase()
    if (!trimmed) {
      setError('Enter the reference from your confirmation, e.g. HAYD-8F2K9Q.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const records = await storageClient.entities.TrackStatus.filter({ reference: trimmed })
      const list = Array.isArray(records) ? records : records?.items || []
      if (list.length) {
        setResult(list[0])
      } else {
        setError('We could not find that reference. Check it matches your confirmation, or call dispatch.')
      }
    } catch {
      setError('Something went wrong looking that up. Please try again or call dispatch on 07761 734423.')
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = result ? STATUS_STEPS.findIndex((s) => s.id === result.status) : -1
  const isCancelled = result?.status === 'cancelled'

  return (
    <>
      <PageHero
        eyebrow="Track"
        title="Follow your medicine to the door"
        intro="Enter the HAYD reference from your confirmation. Every status change is stamped against your delivery."
      />

      <section className="bg-background py-14 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div className="space-y-8">
            <form onSubmit={handleTrack} className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <label
                htmlFor="reference"
                className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted-foreground"
              >
                Delivery reference
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  placeholder="HAYD-8F2K9Q"
                  className="h-12 flex-1 rounded-xl border border-input bg-background px-4 font-mono text-sm tracking-[0.08em] text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Search className="h-4 w-4" strokeWidth={1.8} />
                  )}
                  Track
                </button>
              </div>
              {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}
            </form>

            {result && (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
                  <div>
                    <p className="font-mono text-sm tracking-[0.1em] text-muted-foreground">
                      {result.reference}
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground">
                      {isCancelled ? 'Delivery cancelled' : STATUS_STEPS[stepIndex]?.label}
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                      {result.note || STATUS_STEPS[stepIndex]?.detail}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    {result.town && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.7} />
                        {result.town}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" strokeWidth={1.7} />
                      Updated{' '}
                      {new Date(result.updated_date).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <ol className="relative mt-8 space-y-8 pl-9">
                  <span
                    className="absolute bottom-2 left-[0.6875rem] top-2 w-px bg-border"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute left-[0.6875rem] top-2 w-px bg-accent transition-all duration-700"
                    style={{
                      height: isCancelled
                        ? '0%'
                        : `${(Math.max(stepIndex, 0) / (STATUS_STEPS.length - 1)) * 100}%`,
                    }}
                    aria-hidden="true"
                  />
                  {STATUS_STEPS.map((st, idx) => {
                    const isDone = !isCancelled && idx <= stepIndex
                    const isCurrent = !isCancelled && idx === stepIndex
                    return (
                      <li key={st.id} className="relative">
                        <span
                          className={cn(
                            'absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full border bg-card transition-colors',
                            isDone
                              ? 'border-accent bg-accent text-accent-foreground'
                              : 'border-border text-muted-foreground'
                          )}
                        >
                          {isDone ? (
                            <Check className="h-3 w-3" strokeWidth={3} />
                          ) : (
                            <span className="h-1 w-1 rounded-full bg-current" />
                          )}
                        </span>
                        <p
                          className={cn(
                            'text-sm font-medium',
                            isCurrent || isDone ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {st.label}
                          {isCurrent && (
                            <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--signal))]/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[hsl(var(--signal))]">
                              Live
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-[0.8rem] leading-relaxed text-muted-foreground">
                          {st.detail}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
              <h3 className="font-heading text-[0.95rem] font-semibold">Something not right?</h3>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-white/60">
                If a status has not moved in two hours, call dispatch and we will look at the route
                with you.
              </p>
              <a
                href="tel:+447761734423"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white"
              >
                <Phone className="h-4 w-4" strokeWidth={1.8} />
                07761 734423
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-heading text-[0.95rem] font-semibold text-foreground">
                Lost your reference?
              </h3>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-muted-foreground">
                It is in the confirmation text we send when your request is accepted. If you cannot
                find it, contact dispatch with the patient name and postcode.
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent"
              >
                Contact dispatch
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}

