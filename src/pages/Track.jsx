import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  Check,
  MapPin,
  Clock3,
  Phone,
  LoaderCircle,
  ShieldCheck,
  Copy,
  Navigation,
  ThermometerSnowflake,
  Package,
  Calendar,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { PageHero } from '@/components/SharedSections'
import { storageClient } from '@/lib/storage'
import { getTrackingUrl } from '@/lib/email'
import { calculateDeliveryETA } from '@/lib/etaCalculator'
import { cn } from '@/lib/utils'

const STATUS_STEPS = [
  { id: 'received', label: 'Request received', detail: 'Consignment logged in dispatch system.' },
  {
    id: 'verifying',
    label: 'Pharmacist verification',
    detail: 'Prescription assembled and verified at dispensary counter.',
  },
  {
    id: 'dispatched',
    label: 'Out for delivery',
    detail: 'Courier collected in validated carrier and is en route to recipient.',
  },
  { id: 'delivered', label: 'Delivered & signed', detail: 'Signed for at doorstep with electronic POD.' },
]

export default function Track() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialRef = searchParams.get('ref') || ''

  const [reference, setReference] = useState(initialRef)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  const executeTrack = async (targetRef) => {
    const trimmed = (targetRef || '').trim().toUpperCase()
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

  // Auto-search on page load if ?ref= is in URL
  useEffect(() => {
    if (initialRef) {
      setReference(initialRef.toUpperCase())
      executeTrack(initialRef.toUpperCase())
    }
  }, [initialRef])

  const handleTrackSubmit = (e) => {
    e.preventDefault()
    if (reference.trim()) {
      setSearchParams({ ref: reference.trim().toUpperCase() })
      executeTrack(reference.trim())
    }
  }

  const copyDirectLink = (code) => {
    const link = getTrackingUrl(code)
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const stepIndex = result ? STATUS_STEPS.findIndex((s) => s.id === result.status) : -1
  const isCancelled = result?.status === 'cancelled'

  // Dynamic ETA & Distance calculation
  const etaInfo = result
    ? calculateDeliveryETA({
        pickupAddress: result.pickup_address || `${result.pharmacy_name || 'Dispensary'}, ${result.town || 'Birmingham'}`,
        deliveryAddress: result.delivery_address || `${result.recipient_name || 'Patient'}, ${result.town || 'Birmingham'}`,
        collectionTime: result.collection_time || null,
        status: result.status || 'received',
        deliveredTime: result.delivery_time || null,
      })
    : null

  return (
    <>
      <PageHero
        eyebrow="Delivery Tracking"
        title="Follow your medicines to the door"
        intro="Enter your HAYD manifest reference to view real-time courier custody, temperature compliance, estimated time of delivery, and proof of delivery."
      />

      <section className="bg-background py-14 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div className="space-y-8">
            {/* Search Card */}
            <form onSubmit={handleTrackSubmit} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <label
                htmlFor="reference"
                className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-muted-foreground block"
              >
                Enter Manifest / Tracking Reference
              </label>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  placeholder="e.g. HAYD-8F2K9Q"
                  className="h-12 flex-1 rounded-xl border border-input bg-background px-4 font-mono text-base font-bold tracking-[0.08em] text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 shadow-sm"
                >
                  {loading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Search className="h-4 w-4" strokeWidth={2} />
                  )}
                  Track delivery
                </button>
              </div>
              {error && <p className="mt-3 text-xs font-semibold text-destructive">{error}</p>}
            </form>

            {/* Tracking Result Card */}
            {result && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-md animate-in fade-in space-y-6">
                  {/* Header Row */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-extrabold tracking-[0.1em] text-foreground bg-secondary px-3 py-1 rounded-lg">
                          {result.reference}
                        </span>
                        <button
                          onClick={() => copyDirectLink(result.reference)}
                          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedLink ? 'Link copied!' : 'Copy tracking link'}
                        </button>
                      </div>

                      <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.02em] text-foreground">
                        {isCancelled ? 'Delivery cancelled' : STATUS_STEPS[stepIndex]?.label || 'Active Consignment'}
                      </h2>
                      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                        {result.note || STATUS_STEPS[stepIndex]?.detail}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-foreground/80">
                        {result.pharmacy_name && (
                          <span>
                            Dispensary: <strong>{result.pharmacy_name}</strong>
                          </span>
                        )}
                        {result.recipient_name && (
                          <span>
                            Recipient: <strong>{result.recipient_name}</strong>
                          </span>
                        )}
                        {result.assigned_name && (
                          <span className="text-[#0d9488] font-semibold">
                            Assigned Courier: <strong>{result.assigned_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:text-right">
                      {result.town && (
                        <span className="inline-flex items-center gap-1.5 font-medium sm:justify-end">
                          <MapPin className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                          {result.town}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 sm:justify-end">
                        <Clock3 className="h-3.5 w-3.5" strokeWidth={1.7} />
                        Last update{' '}
                        {new Date(result.updated_date || Date.now()).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* ESTIMATED TIME OF DELIVERY (ETA) & DISTANCE BANNER */}
                  {/* ========================================================= */}
                  {etaInfo && !isCancelled && (
                    <div className="rounded-2xl border-2 border-[#0d9488]/30 bg-gradient-to-br from-[#0d9488]/5 to-secondary/50 p-5 md:p-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0d9488] text-white">
                            <Clock3 className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground block">
                              {result.status === 'delivered' ? 'Delivery Confirmed' : 'Estimated Time of Delivery (ETA)'}
                            </span>
                            <span className="font-heading text-lg md:text-xl font-bold text-foreground">
                              {result.status === 'delivered'
                                ? `Delivered at ${new Date(result.delivery_time || result.updated_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                                : result.status === 'dispatched'
                                ? `Estimated Delivery: ${etaInfo.windowStr}`
                                : `Estimated Window: ${etaInfo.windowStr} (Upon collection)`}
                            </span>
                          </div>
                        </div>

                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider',
                            result.status === 'delivered'
                              ? 'bg-emerald-600/15 text-emerald-600'
                              : result.status === 'dispatched'
                              ? 'bg-[#0d9488]/15 text-[#0d9488]'
                              : 'bg-amber-500/15 text-amber-600'
                          )}
                        >
                          {result.status === 'delivered' ? 'Complete' : result.status === 'dispatched' ? 'En Route' : 'Scheduled'}
                        </span>
                      </div>

                      {/* Route & Timing Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 pt-1 text-xs">
                        <div className="rounded-xl border border-border/80 bg-background/60 p-3">
                          <span className="text-[0.68rem] text-muted-foreground block">Route Distance</span>
                          <span className="font-heading text-sm font-bold text-foreground">
                            {result.distance_miles || etaInfo.distanceMiles} miles
                          </span>
                        </div>

                        <div className="rounded-xl border border-border/80 bg-background/60 p-3">
                          <span className="text-[0.68rem] text-muted-foreground block">Estimated Transit Time</span>
                          <span className="font-heading text-sm font-bold text-foreground">
                            ~{result.transit_duration_mins || etaInfo.transitMinutes} mins driving
                          </span>
                        </div>

                        <div className="col-span-2 sm:col-span-1 rounded-xl border border-border/80 bg-background/60 p-3">
                          <span className="text-[0.68rem] text-muted-foreground block">Time of Collection</span>
                          <span className="font-heading text-sm font-bold text-foreground">
                            {result.collection_time
                              ? new Date(result.collection_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                              : 'Awaiting counter pickup'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress Steps Timeline */}
                  {!isCancelled && (
                    <div className="pt-2">
                      <ol className="relative grid gap-8 sm:grid-cols-4 sm:gap-4">
                        {STATUS_STEPS.map((step, idx) => {
                          const isDone = idx <= stepIndex
                          const isCurrent = idx === stepIndex
                          return (
                            <li key={step.id} className="relative flex flex-col items-start">
                              {/* Horizontal connector on larger screens */}
                              {idx < STATUS_STEPS.length - 1 && (
                                <div
                                  className={cn(
                                    'absolute left-4 top-4 hidden h-0.5 w-[calc(100%-1rem)] sm:block',
                                    idx < stepIndex ? 'bg-[#0d9488]' : 'bg-border'
                                  )}
                                />
                              )}

                              <span
                                className={cn(
                                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all',
                                  isDone
                                    ? 'border-[#0d9488] bg-[#0d9488] text-white'
                                    : 'border-border bg-card text-muted-foreground',
                                  isCurrent && 'ring-4 ring-[#0d9488]/20'
                                )}
                              >
                                {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
                              </span>

                              <div className="mt-3.5">
                                <span
                                  className={cn(
                                    'block text-xs font-bold leading-tight',
                                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                                  )}
                                >
                                  {step.label}
                                </span>
                                <span className="mt-1 block text-[0.72rem] leading-relaxed text-muted-foreground">
                                  {step.detail}
                                </span>
                              </div>
                            </li>
                          )
                        })}
                      </ol>
                    </div>
                  )}
                </div>

                {/* ========================================================= */}
                {/* TIMESTAMPED MILESTONE AUDIT TRAIL */}
                {/* ========================================================= */}
                {Array.isArray(result.history) && result.history.length > 0 && (
                  <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-[#0d9488]" />
                        Delivery Event & Timestamp Audit Trail
                      </h3>
                      <span className="text-[0.68rem] text-muted-foreground">
                        GDP Audited Timestamp Log
                      </span>
                    </div>

                    <div className="divide-y divide-border/60">
                      {result.history.map((ev, evIdx) => (
                        <div key={ev.id || evIdx} className="py-3.5 first:pt-1 last:pb-1 flex flex-wrap items-start justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{ev.title}</span>
                              {ev.updated_by && (
                                <span className="rounded bg-secondary px-2 py-0.5 text-[0.65rem] text-muted-foreground">
                                  {ev.updated_by}
                                </span>
                              )}
                            </div>
                            {ev.note && <p className="text-muted-foreground">{ev.note}</p>}
                          </div>

                          <div className="text-right text-muted-foreground text-[0.72rem] font-mono">
                            {new Date(ev.timestamp).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            <span className="block text-[0.65rem] text-muted-foreground/70">
                              {new Date(ev.timestamp).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar info */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-heading text-[0.95rem] font-semibold text-foreground">
                How our dynamic ETA is computed
              </h3>
              <ul className="mt-4 space-y-3.5 text-[0.825rem] leading-relaxed text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[0.7rem] font-bold">1</span>
                  <span><strong>Collection Time:</strong> Measured in real time the moment our courier scans custody at the pharmacy counter.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[0.7rem] font-bold">2</span>
                  <span><strong>Road Distance:</strong> Calculated between the dispensary address and patient doorstep.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[0.7rem] font-bold">3</span>
                  <span><strong>Custody Handover:</strong> Includes regulated safety buffer for temperature checks and signature verification.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2.5 text-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={1.8} />
                <span className="text-[0.85rem] font-semibold">Strict Chain of Custody</span>
              </div>
              <p className="mt-3 text-[0.8rem] leading-relaxed text-muted-foreground">
                All high-integrity items including 2°C–8°C thermal lines and Controlled Drugs carry continuous custody logs from dispensary counter to recipient door.
              </p>
            </div>

            <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
              <h3 className="font-heading text-[0.95rem] font-semibold">Need urgent status update?</h3>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-white/70">
                If you need to reach the courier on the route or redirect a delivery, call dispatch:
              </p>
              <a
                href="tel:+447761734423"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-white/90"
              >
                <Phone className="h-4 w-4" strokeWidth={2} />
                07761 734423
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
