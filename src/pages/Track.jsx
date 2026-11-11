import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  Check,
  MapPin,
  Clock3,
  Phone,
  ArrowRight,
  LoaderCircle,
  ShieldCheck,
  PlusCircle,
  Copy,
  Settings,
  Sparkles,
  RefreshCw,
  Building2,
  Package,
} from 'lucide-react'
import { PageHero } from '@/components/SharedSections'
import { storageClient } from '@/lib/storage'
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

function generateTrackingCode() {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return `HAYD-${Array.from(bytes, (b) => chars[b % chars.length]).join('')}`
}

export default function Track() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialRef = searchParams.get('ref') || ''

  const [reference, setReference] = useState(initialRef)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Dispatcher / Staff management mode
  const [isDispatcherMode, setIsDispatcherMode] = useState(false)
  const [recentList, setRecentList] = useState([])
  const [copiedLink, setCopiedLink] = useState(false)

  // Dispatcher Create Form
  const [newCodeForm, setNewCodeForm] = useState({
    reference: generateTrackingCode(),
    recipient_name: '',
    town: 'Birmingham',
    status: 'received',
    note: 'Consignment logged in dispatch system. Awaiting scheduled dispensary collection.',
  })
  const [createMsg, setCreateMsg] = useState('')

  // Dispatcher Update Form for current result
  const [updateStatus, setUpdateStatus] = useState('dispatched')
  const [updateNote, setUpdateNote] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)

  const loadRecent = async () => {
    try {
      const items = await storageClient.entities.TrackStatus.list()
      setRecentList(items.slice(0, 8))
    } catch {
      // ignore
    }
  }

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
        setUpdateStatus(list[0].status || 'dispatched')
        setUpdateNote(list[0].note || '')
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
    loadRecent()
  }, [initialRef])

  const handleTrackSubmit = (e) => {
    e.preventDefault()
    if (reference.trim()) {
      setSearchParams({ ref: reference.trim().toUpperCase() })
      executeTrack(reference.trim())
    }
  }

  const handleCreateCode = async (e) => {
    e.preventDefault()
    try {
      await storageClient.entities.TrackStatus.create({
        ...newCodeForm,
        updated_date: new Date().toISOString(),
      })
      setCreateMsg(`Created ${newCodeForm.reference} successfully!`)
      loadRecent()
      // Auto track the newly created code
      setReference(newCodeForm.reference)
      setSearchParams({ ref: newCodeForm.reference })
      executeTrack(newCodeForm.reference)
      // Reset form with a fresh new code
      setNewCodeForm({
        reference: generateTrackingCode(),
        recipient_name: '',
        town: 'Birmingham',
        status: 'received',
        note: 'Consignment logged in dispatch system. Awaiting scheduled dispensary collection.',
      })
      setTimeout(() => setCreateMsg(''), 4000)
    } catch {
      setCreateMsg('Error creating code.')
    }
  }

  const handleStatusUpdate = async () => {
    if (!result?.reference) return
    setUpdateLoading(true)
    try {
      const updated = await storageClient.entities.TrackStatus.update(result.reference, {
        status: updateStatus,
        note: updateNote,
      })
      setResult(updated)
      loadRecent()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdateLoading(false)
    }
  }

  const copyDirectLink = (code) => {
    const link = `https://thehayd.uk/track?ref=${code}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const stepIndex = result ? STATUS_STEPS.findIndex((s) => s.id === result.status) : -1
  const isCancelled = result?.status === 'cancelled'

  return (
    <>
      <PageHero
        eyebrow="Delivery Tracking"
        title="Follow your medicines to the door"
        intro="Enter your HAYD manifest reference to view real-time courier custody, temperature compliance, and proof of delivery."
      />

      <section className="bg-background py-14 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div className="space-y-8">
            {/* Search Card */}
            <form onSubmit={handleTrackSubmit} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reference"
                  className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Enter Manifest / Tracking Reference
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsDispatcherMode(!isDispatcherMode)
                    loadRecent()
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition-colors',
                    isDispatcherMode
                      ? 'bg-accent text-accent-foreground'
                      : 'border border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Settings className="h-3 w-3" />
                  {isDispatcherMode ? 'Staff Mode Active' : 'Staff Dispatcher Tool'}
                </button>
              </div>

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
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm animate-in fade-in">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-extrabold tracking-[0.1em] text-foreground">
                        {result.reference}
                      </span>
                      <button
                        onClick={() => copyDirectLink(result.reference)}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground hover:text-foreground"
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

                    {result.pharmacy_name && (
                      <p className="mt-2 text-xs font-medium text-foreground/80">
                        Dispensary: <strong>{result.pharmacy_name}</strong>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    {result.town && (
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                        {result.town}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" strokeWidth={1.7} />
                      Last updated{' '}
                      {new Date(result.updated_date || Date.now()).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Progress Steps Timeline */}
                {!isCancelled && (
                  <div className="mt-8">
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
                                  idx < stepIndex ? 'bg-accent' : 'bg-border'
                                )}
                              />
                            )}

                            <span
                              className={cn(
                                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all',
                                isDone
                                  ? 'border-accent bg-accent text-accent-foreground'
                                  : 'border-border bg-card text-muted-foreground',
                                isCurrent && 'ring-4 ring-accent/20'
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

                {/* Dispatcher Inline Status Editor */}
                {isDispatcherMode && (
                  <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-accent">
                        Staff Controls: Update Live Status for {result.reference}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[0.72rem] font-semibold text-foreground/80">New Status</label>
                        <select
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value)}
                          className="h-10 w-full rounded-lg border border-input bg-card px-3 text-xs font-medium"
                        >
                          <option value="received">1. Request received</option>
                          <option value="verifying">2. Pharmacist verification</option>
                          <option value="dispatched">3. Out for delivery (Courier collected)</option>
                          <option value="delivered">4. Delivered & signed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[0.72rem] font-semibold text-foreground/80">Tracking Note</label>
                        <input
                          type="text"
                          value={updateNote}
                          onChange={(e) => setUpdateNote(e.target.value)}
                          placeholder="e.g. Courier en route, ETA 15 mins"
                          className="h-10 w-full rounded-lg border border-input bg-card px-3 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleStatusUpdate}
                      disabled={updateLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                    >
                      {updateLoading ? 'Saving update…' : 'Save Status Update'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Staff Dispatcher Management Box */}
            {isDispatcherMode && (
              <div className="rounded-2xl border-2 border-accent/40 bg-card p-6 md:p-8 space-y-6 shadow-md animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground font-bold">
                    <PlusCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      Generate New Tracking Code (Manual / Phone Booking)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Use this when a pharmacy calls or emails you directly to book a collection.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateCode} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Tracking Reference Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCodeForm.reference}
                          onChange={(e) => setNewCodeForm({ ...newCodeForm, reference: e.target.value.toUpperCase() })}
                          className="h-10 flex-1 rounded-lg border border-input bg-background px-3 font-mono text-sm font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setNewCodeForm({ ...newCodeForm, reference: generateTrackingCode() })}
                          className="rounded-lg border border-border px-3 text-xs hover:bg-secondary"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Pharmacy / Recipient</label>
                      <input
                        type="text"
                        value={newCodeForm.recipient_name}
                        onChange={(e) => setNewCodeForm({ ...newCodeForm, recipient_name: e.target.value })}
                        placeholder="e.g. Well Pharmacy / Mr Smith"
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Destination Town</label>
                      <input
                        type="text"
                        value={newCodeForm.town}
                        onChange={(e) => setNewCodeForm({ ...newCodeForm, town: e.target.value })}
                        placeholder="e.g. Birmingham, Solihull"
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Initial Status</label>
                      <select
                        value={newCodeForm.status}
                        onChange={(e) => setNewCodeForm({ ...newCodeForm, status: e.target.value })}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium"
                      >
                        <option value="received">1. Request received</option>
                        <option value="verifying">2. Pharmacist verification</option>
                        <option value="dispatched">3. Out for delivery (Courier collected)</option>
                        <option value="delivered">4. Delivered & signed</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Operational Note</label>
                    <input
                      type="text"
                      value={newCodeForm.note}
                      onChange={(e) => setNewCodeForm({ ...newCodeForm, note: e.target.value })}
                      placeholder="e.g. Courier en route to pharmacy counter"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-xs font-bold text-accent-foreground hover:bg-accent/90"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Save & Activate Tracking Code
                    </button>
                    {createMsg && <span className="text-xs font-bold text-accent">{createMsg}</span>}
                  </div>
                </form>

                {/* Recent tracked deliveries quick list */}
                {recentList.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Recently Created Consignments
                    </h4>
                    <div className="space-y-2">
                      {recentList.map((item) => (
                        <div
                          key={item.reference}
                          className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 p-2.5 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-foreground">{item.reference}</span>
                            <span className="rounded bg-accent/15 px-2 py-0.5 text-[0.7rem] font-semibold text-accent uppercase">
                              {item.status}
                            </span>
                            <span className="text-muted-foreground text-[0.72rem]">{item.town}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setReference(item.reference)
                                setSearchParams({ ref: item.reference })
                                executeTrack(item.reference)
                              }}
                              className="font-semibold text-primary hover:underline text-[0.72rem]"
                            >
                              View / Edit
                            </button>
                            <button
                              onClick={() => copyDirectLink(item.reference)}
                              className="text-muted-foreground hover:text-foreground text-[0.72rem]"
                              title="Copy link"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
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
                How tracking references work
              </h3>
              <ul className="mt-4 space-y-3.5 text-[0.825rem] leading-relaxed text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[0.7rem] font-bold">1</span>
                  <span>Issued upon collection booking or phone confirmation (e.g. <code>HAYD-8F2K9Q</code>).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[0.7rem] font-bold">2</span>
                  <span>Direct link <code>thehayd.uk/track?ref=CODE</code> opens the parcel status automatically.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[0.7rem] font-bold">3</span>
                  <span>Proof of delivery and timestamped signature recorded on completion.</span>
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
