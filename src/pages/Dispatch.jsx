import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Lock,
  Unlock,
  KeyRound,
  Search,
  PlusCircle,
  Copy,
  RefreshCw,
  Send,
  LoaderCircle,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Building2,
  Package,
  ShieldCheck,
  LogOut,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { PageHero } from '@/components/SharedSections'
import { storageClient } from '@/lib/storage'
import { sendStatusUpdateEmail, getTrackingUrl } from '@/lib/email'
import { cn } from '@/lib/utils'
import haydIconNavy from '@/assets/hayd-icon-navy.png'

const DISPATCH_PIN = import.meta.env.VITE_DISPATCH_PIN || 'hayd2026'

const STATUS_OPTIONS = [
  { id: 'received', label: '1. Request received & scheduled' },
  { id: 'verifying', label: '2. Pharmacist verification at counter' },
  { id: 'dispatched', label: '3. Out for delivery (Courier collected)' },
  { id: 'delivered', label: '4. Delivered & signed for at doorstep' },
  { id: 'cancelled', label: 'Cancelled' },
]

function generateTrackingCode() {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return `HAYD-${Array.from(bytes, (b) => chars[b % chars.length]).join('')}`
}

export default function Dispatch() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [authError, setAuthError] = useState('')

  // Dispatcher Dashboard State
  const [recentList, setRecentList] = useState([])
  const [searchRef, setSearchRef] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Update Status Form
  const [updateStatus, setUpdateStatus] = useState('dispatched')
  const [updateNote, setUpdateNote] = useState('')
  const [updatePharmacyEmail, setUpdatePharmacyEmail] = useState('')
  const [updateRecipientEmail, setUpdateRecipientEmail] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState('')

  // Create Manual Code Form
  const [newCode, setNewCode] = useState({
    reference: generateTrackingCode(),
    pharmacy_name: '',
    pharmacy_email: '',
    recipient_name: '',
    recipient_email: '',
    town: 'Birmingham',
    status: 'received',
    note: 'Consignment logged in dispatch system. Awaiting scheduled collection from pharmacy counter.',
  })
  const [createMsg, setCreateMsg] = useState('')
  const [copiedLink, setCopiedLink] = useState('')

  // Check existing session
  useEffect(() => {
    const isLogged = sessionStorage.getItem('hayd_dispatch_auth') === 'true'
    if (isLogged) {
      setIsAuthenticated(true)
      loadRecent()
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    if (pinInput.trim() === DISPATCH_PIN) {
      sessionStorage.setItem('hayd_dispatch_auth', 'true')
      setIsAuthenticated(true)
      setAuthError('')
      loadRecent()
    } else {
      setAuthError('Incorrect passcode. Please check with operations manager.')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('hayd_dispatch_auth')
    setIsAuthenticated(false)
    setSelectedItem(null)
    setPinInput('')
  }

  const loadRecent = async () => {
    try {
      const list = await storageClient.entities.TrackStatus.list()
      setRecentList(list)
    } catch {
      // ignore
    }
  }

  const handleSearch = async (target = null) => {
    const term = (typeof target === 'string' ? target : searchRef).trim().toUpperCase()
    if (!term) return

    setSearchLoading(true)
    setSearchError('')
    setUpdateSuccess('')

    try {
      const records = await storageClient.entities.TrackStatus.filter({ reference: term })
      const list = Array.isArray(records) ? records : records?.items || []
      if (list.length) {
        const item = list[0]
        setSelectedItem(item)
        setUpdateStatus(item.status || 'dispatched')
        setUpdateNote(item.note || '')
        setUpdatePharmacyEmail(item.pharmacy_email || item.email || '')
        setUpdateRecipientEmail(item.recipient_email || '')
      } else {
        setSearchError(`No consignment found with reference "${term}".`)
      }
    } catch {
      setSearchError('Error looking up consignment.')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleCreateCode = async (e) => {
    e.preventDefault()
    try {
      const created = await storageClient.entities.TrackStatus.create({
        ...newCode,
        updated_date: new Date().toISOString(),
      })
      setCreateMsg(`Consignment ${created.reference} generated & activated!`)
      loadRecent()
      setSelectedItem(created)
      setUpdateStatus(created.status)
      setUpdateNote(created.note)
      setUpdatePharmacyEmail(created.pharmacy_email || '')
      setUpdateRecipientEmail(created.recipient_email || '')
      // Reset form with a fresh reference
      setNewCode({
        reference: generateTrackingCode(),
        pharmacy_name: '',
        pharmacy_email: '',
        recipient_name: '',
        recipient_email: '',
        town: 'Birmingham',
        status: 'received',
        note: 'Consignment logged in dispatch system. Awaiting scheduled collection from pharmacy counter.',
      })
      setTimeout(() => setCreateMsg(''), 5000)
    } catch {
      setCreateMsg('Error creating consignment.')
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedItem?.reference) return
    setUpdateLoading(true)
    setUpdateSuccess('')

    try {
      const patch = {
        status: updateStatus,
        note: updateNote,
        pharmacy_email: updatePharmacyEmail,
        recipient_email: updateRecipientEmail,
      }
      const updated = await storageClient.entities.TrackStatus.update(selectedItem.reference, patch)
      setSelectedItem(updated)
      loadRecent()

      // Automatically dispatch notification emails to pharmacy and recipient
      await sendStatusUpdateEmail(updated)
      setUpdateSuccess('Status updated & notification emails dispatched!')
      setTimeout(() => setUpdateSuccess(''), 5000)
    } catch (err) {
      console.error(err)
      setUpdateSuccess('Status updated locally (email alert failed).')
    } finally {
      setUpdateLoading(false)
    }
  }

  const copyLink = (code) => {
    const url = getTrackingUrl(code)
    navigator.clipboard.writeText(url)
    setCopiedLink(code)
    setTimeout(() => setCopiedLink(''), 2500)
  }

  // -------------------------------------------------------------
  // VIEW: Login Screen if not authenticated
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary p-3">
            <img src={haydIconNavy} alt="HAYD" className="h-full w-full invert object-contain" />
          </div>

          <span className="mt-5 inline-block text-[0.7rem] font-bold uppercase tracking-widest text-accent">
            Restricted Staff Area
          </span>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground">
            Staff Dispatch Portal
          </h1>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Enter your operational passcode to manage active collection rounds, generate tracking codes, and update parcel delivery statuses.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4 text-left">
            <div className="space-y-1.5">
              <label htmlFor="pin" className="text-xs font-semibold text-foreground/80">
                Staff Passcode
              </label>
              <div className="relative">
                <input
                  id="pin"
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter passcode"
                  autoFocus
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 font-mono text-base tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>
            </div>

            {authError && <p className="text-xs font-semibold text-destructive">{authError}</p>}

            <button
              type="submit"
              className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <KeyRound className="h-4 w-4" />
              Sign In to Dispatch
            </button>
          </form>

          <p className="mt-6 text-[0.7rem] text-muted-foreground">
            Authorised HAYD dispatch personnel only.
          </p>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // VIEW: Authenticated Dispatcher Dashboard
  // -------------------------------------------------------------
  return (
    <>
      {/* Top Banner */}
      <div className="border-b border-border bg-[#08162E] text-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 p-1.5">
              <img src={haydIconNavy} alt="HAYD" className="h-full w-full invert object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-base font-bold tracking-tight text-white">
                  HAYD Operations & Dispatch Portal
                </h1>
                <span className="inline-flex items-center rounded-full bg-[#0d9488]/20 px-2 py-0.5 text-[0.65rem] font-bold text-[#0d9488]">
                  Live
                </span>
              </div>
              <p className="text-[0.7rem] text-white/60">Dispensary rounds, manifests & tracking dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/track"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Public Tracking Page
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-destructive hover:text-white transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <section className="bg-background py-10 md:py-14">
        <div className="container-page space-y-10">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Consignments
              </span>
              <div className="mt-2 text-2xl font-extrabold text-foreground">{recentList.length}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                In Transit / Dispatched
              </span>
              <div className="mt-2 text-2xl font-extrabold text-[#0d9488]">
                {recentList.filter((i) => i.status === 'dispatched').length}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Awaiting Collection
              </span>
              <div className="mt-2 text-2xl font-extrabold text-foreground">
                {recentList.filter((i) => i.status === 'received' || i.status === 'verifying').length}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Delivered Today
              </span>
              <div className="mt-2 text-2xl font-extrabold text-foreground">
                {recentList.filter((i) => i.status === 'delivered').length}
              </div>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
            {/* Left Column: Search & Manage Live Parcel */}
            <div className="space-y-8">
              {/* Lookup Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="font-heading text-base font-bold text-foreground">
                  Search & Update Existing Consignment
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter any reference to modify status and send automatic email updates.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSearch()
                  }}
                  className="mt-4 flex gap-3"
                >
                  <input
                    type="text"
                    value={searchRef}
                    onChange={(e) => setSearchRef(e.target.value.toUpperCase())}
                    placeholder="e.g. HAYD-8F2K9Q"
                    className="h-11 flex-1 rounded-xl border border-input bg-background px-4 font-mono text-sm font-bold tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  />
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {searchLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search
                  </button>
                </form>
                {searchError && <p className="mt-2.5 text-xs font-semibold text-destructive">{searchError}</p>}
              </div>

              {/* Selected Consignment Details & Live Status Editor */}
              {selectedItem && (
                <div className="rounded-2xl border-2 border-accent/40 bg-card p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xl font-extrabold tracking-wider text-foreground">
                          {selectedItem.reference}
                        </span>
                        <button
                          onClick={() => copyLink(selectedItem.reference)}
                          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-foreground/80 hover:bg-secondary/80"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedLink === selectedItem.reference ? 'Copied link!' : 'Copy tracking link'}
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-foreground/80">
                        {selectedItem.pharmacy_name && (
                          <span>
                            Pharmacy: <strong>{selectedItem.pharmacy_name}</strong>
                          </span>
                        )}
                        {selectedItem.recipient_name && (
                          <span>
                            Recipient: <strong>{selectedItem.recipient_name}</strong>
                          </span>
                        )}
                        {selectedItem.town && (
                          <span>
                            Town: <strong>{selectedItem.town}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent uppercase">
                        Current: {selectedItem.status}
                      </span>
                    </div>
                  </div>

                  {/* Status Update Form */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" /> Update Live Status & Trigger Email Notifications
                      </h3>
                      {updateSuccess && (
                        <span className="text-xs font-bold text-accent animate-in fade-in">
                          {updateSuccess}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/80">New Status</label>
                        <select
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value)}
                          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/80">Operational Note</label>
                        <input
                          type="text"
                          value={updateNote}
                          onChange={(e) => setUpdateNote(e.target.value)}
                          placeholder="e.g. Courier collected, ETA 20 mins"
                          className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 pt-1">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/80">
                          Pharmacy Email (Receives Status Update)
                        </label>
                        <input
                          type="email"
                          value={updatePharmacyEmail}
                          onChange={(e) => setUpdatePharmacyEmail(e.target.value)}
                          placeholder="dispensary@pharmacy.co.uk"
                          className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/80">
                          Recipient Email (Receives Status Update)
                        </label>
                        <input
                          type="email"
                          value={updateRecipientEmail}
                          onChange={(e) => setUpdateRecipientEmail(e.target.value)}
                          placeholder="patient@example.com"
                          className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleStatusUpdate}
                        disabled={updateLoading}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-xs font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-50 shadow-sm"
                      >
                        {updateLoading ? (
                          <>
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Dispatching emails & updating…
                          </>
                        ) : (
                          'Save Status & Send Email Notifications'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Active Deliveries Table */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Recent Consignments ({recentList.length})
                  </h3>
                  <button
                    onClick={loadRecent}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </button>
                </div>

                <div className="divide-y divide-border/60">
                  {recentList.map((item) => (
                    <div
                      key={item.reference}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-foreground">{item.reference}</span>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold uppercase',
                            item.status === 'delivered'
                              ? 'bg-accent/20 text-accent'
                              : item.status === 'dispatched'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {item.status}
                        </span>
                        <span className="text-muted-foreground text-[0.75rem]">
                          {item.pharmacy_name || item.town || 'Active'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSearchRef(item.reference)
                            handleSearch(item.reference)
                          }}
                          className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-secondary/70"
                        >
                          Update Status
                        </button>
                        <button
                          onClick={() => copyLink(item.reference)}
                          className="rounded-lg border border-border p-1 text-muted-foreground hover:text-foreground"
                          title="Copy tracking link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Generate New Code (Manual / Phone Booking) */}
            <div className="space-y-6">
              <div className="rounded-2xl border-2 border-primary/20 bg-card p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                    <PlusCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-base font-bold text-foreground">
                      New Manual Booking
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      For orders phoned into dispatch or received via email.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Tracking Reference Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCode.reference}
                        onChange={(e) => setNewCode({ ...newCode, reference: e.target.value.toUpperCase() })}
                        className="h-10 flex-1 rounded-xl border border-input bg-background px-3 font-mono text-sm font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setNewCode({ ...newCode, reference: generateTrackingCode() })}
                        className="rounded-xl border border-border px-3 text-xs hover:bg-secondary"
                        title="Generate another code"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Pharmacy / Dispensary Name</label>
                    <input
                      type="text"
                      value={newCode.pharmacy_name}
                      onChange={(e) => setNewCode({ ...newCode, pharmacy_name: e.target.value })}
                      placeholder="e.g. Well Pharmacy, Church St"
                      className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Pharmacy Email (for alerts)</label>
                    <input
                      type="email"
                      value={newCode.pharmacy_email}
                      onChange={(e) => setNewCode({ ...newCode, pharmacy_email: e.target.value })}
                      placeholder="dispensary@pharmacy.co.uk"
                      className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Recipient / Patient Name</label>
                    <input
                      type="text"
                      value={newCode.recipient_name}
                      onChange={(e) => setNewCode({ ...newCode, recipient_name: e.target.value })}
                      placeholder="e.g. Robert Hughes"
                      className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Recipient Email (for tracking)</label>
                    <input
                      type="email"
                      value={newCode.recipient_email}
                      onChange={(e) => setNewCode({ ...newCode, recipient_email: e.target.value })}
                      placeholder="patient@example.com"
                      className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Destination Town</label>
                    <input
                      type="text"
                      value={newCode.town}
                      onChange={(e) => setNewCode({ ...newCode, town: e.target.value })}
                      placeholder="e.g. Birmingham"
                      className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Initial Status</label>
                    <select
                      value={newCode.status}
                      onChange={(e) => setNewCode({ ...newCode, status: e.target.value })}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Operational Note</label>
                    <input
                      type="text"
                      value={newCode.note}
                      onChange={(e) => setNewCode({ ...newCode, note: e.target.value })}
                      placeholder="e.g. Courier en route to pharmacy counter"
                      className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Save & Activate Consignment
                  </button>

                  {createMsg && <p className="text-xs font-bold text-accent text-center">{createMsg}</p>}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

