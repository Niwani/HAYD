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
  User,
  Users,
  Truck,
  Zap,
  Phone,
  Mail,
  Navigation,
  Share2,
  Calendar,
  ThermometerSnowflake,
  ArrowRight,
  UserCheck,
  Printer,
  Scan,
  FileCheck,
} from 'lucide-react'
import { PageHero } from '@/components/SharedSections'
import { storageClient } from '@/lib/storage'
import {
  STAFF_ACCOUNTS,
  authenticateStaff,
  getCurrentStaff,
  setCurrentStaff,
  clearCurrentStaff,
  getAvailableCouriers,
  getStaffById,
} from '@/lib/staffAuth'
import { sendStatusUpdateEmail, getTrackingUrl } from '@/lib/email'
import AdminBookingSteps from '@/components/AdminBookingSteps'
import ParcelLabelModal from '@/components/ParcelLabelModal'
import DeliveryScanModal from '@/components/DeliveryScanModal'
import { StaffChatWidget } from '@/components/StaffChatWidget'
import { cn } from '@/lib/utils'
import haydIconNavy from '@/assets/hayd-icon-navy.png'

const STATUS_OPTIONS = [
  { id: 'received', label: '1. Request received & scheduled' },
  { id: 'verifying', label: '2. Pharmacist verification at counter' },
  { id: 'dispatched', label: '3. Out for delivery (Courier collected)' },
  { id: 'delivered', label: '4. Delivered & signed for at doorstep' },
  { id: 'cancelled', label: 'Cancelled' },
]

export const STATUS_DEFAULT_TEXTS = {
  received: (item) =>
    `Consignment logged in dispatch system. Awaiting scheduled collection from ${item?.pharmacy_name || 'dispensary'} counter.`,

  verifying: (item, staff) =>
    `Courier ${staff?.name || 'driver'} arrived at ${item?.pharmacy_name || 'dispensary'} counter. Prescription bag and patient address verified with dispensing pharmacist.`,

  dispatched: (item, staff) =>
    `Collected from ${item?.pharmacy_name || 'dispensary'} counter by ${staff?.name || 'courier'}. Validated temperature carrier active. En route to ${item?.recipient_name || 'patient'}.`,

  delivered: (item, staff) =>
    `Handed directly to recipient ${item?.recipient_name || 'patient'} at destination doorstep. Recipient identity verified and electronic POD signature captured.`,

  cancelled: (item) =>
    `Delivery run cancelled by dispensary / controller. Prescriptions returned safely to ${item?.pharmacy_name || 'dispensary'} counter with signed custody receipt.`,
}

export function getStatusTextForLevel(status, item, staff) {
  const gen = STATUS_DEFAULT_TEXTS[status]
  if (typeof gen === 'function') {
    return gen(item, staff)
  }
  return `Status updated to ${status}.`
}

function generateTrackingCode() {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return `HAYD-${Array.from(bytes, (b) => chars[b % chars.length]).join('')}`
}

function generateDispatchSlip(item, courier) {
  const pickup = item.pickup_address || `${item.pharmacy_name || 'Dispensary'}, Birmingham`
  const delivery = item.delivery_address || `${item.recipient_name || 'Patient'}, ${item.town || 'Birmingham'}`
  const cat = Array.isArray(item.categories) ? item.categories.join(', ') : 'Standard Ambient'
  const trackingUrl = getTrackingUrl(item.reference)

  const distStr = item.distance_miles ? `${item.distance_miles} miles` : 'Direct route'
  const transitStr = item.transit_duration_mins ? `~${item.transit_duration_mins} mins transit` : '~15 mins transit'
  const etaStr = item.estimated_delivery_window || 'Standard delivery round'
  const collectStr = item.collection_time
    ? new Date(item.collection_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : 'Awaiting counter pickup'

  return `*HAYD DISPATCH ASSIGNMENT*
Ref: ${item.reference}
Assigned to: ${courier?.name || item.assigned_name || 'Courier'}

*1. PICKUP (Dispensary Counter)*
${item.pharmacy_name || 'Partner Pharmacy'}
Address: ${pickup}
Phone: ${item.pharmacy_phone || '07761 734423'}

*2. DELIVERY (Patient Doorstep)*
Recipient: ${item.recipient_name || 'Patient'}
Address: ${delivery}
Phone: ${item.recipient_phone || 'N/A'}

*Route & Timing:*
• Distance: ${distStr} (${transitStr})
• Collection Time: ${collectStr}
• Estimated Delivery Window: ${etaStr}

*Handling:* ${cat} (${item.package_count || '1 parcel'})
*Instructions:* ${item.note || 'Hand-to-hand delivery. Confirm signature.'}
*Live Tracker:* ${trackingUrl}`
}

export default function Dispatch() {
  // Auth state
  const [currentStaff, setCurrentStaffState] = useState(null)
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // Data state
  const [consignments, setConsignments] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // all | unassigned | courier_1 | courier_2 | delivered
  const [searchQuery, setSearchQuery] = useState('')

  // Assignment Modal / State
  const [assigningRef, setAssigningRef] = useState(null)
  const [selectedStaffId, setSelectedStaffId] = useState('courier_1')
  const [assignSuccess, setAssignSuccess] = useState('')

  // Status update state
  const [updateStatus, setUpdateStatus] = useState('dispatched')
  const [updateNote, setUpdateNote] = useState('')
  const [updateNotifyEmails, setUpdateNotifyEmails] = useState(true)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState('')

  // Copied link/slip state
  const [copiedCode, setCopiedCode] = useState('')
  const [copiedSlipRef, setCopiedSlipRef] = useState('')

  // Multi-step booking intake form
  const [showManualCreator, setShowManualCreator] = useState(false)

  // Anti-misdelivery: Sticker Printing & Doorstep Scan Modals
  const [labelModalItem, setLabelModalItem] = useState(null)
  const [scanModalItem, setScanModalItem] = useState(null)

  // 1. Initial Load & Session Check
  useEffect(() => {
    const saved = getCurrentStaff()
    if (saved) {
      setCurrentStaffState(saved)
    }
  }, [])

  // 2. Reload consignments when current staff changes
  useEffect(() => {
    if (currentStaff) {
      loadConsignments(currentStaff)
    }
  }, [currentStaff])

  const loadConsignments = async (user = currentStaff) => {
    if (!user) return
    try {
      const items = await storageClient.entities.TrackStatus.listForUser(user)
      setConsignments(items)
      // Keep selected item fresh if still in list
      if (selectedItem) {
        const found = items.find((i) => i.reference === selectedItem.reference)
        if (found) setSelectedItem(found)
      }
    } catch (err) {
      console.error('Failed to load consignments:', err)
    }
  }

  // Handle Login
  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault()
    setAuthError('')

    const res = authenticateStaff(loginIdentifier, loginPassword)
    if (res.success) {
      setCurrentStaffState(res.user)
      setLoginIdentifier('')
      setLoginPassword('')
    } else {
      setAuthError(res.error || 'Authentication failed.')
    }
  }

  // Quick Demo Sign-In helper
  const handleQuickLogin = (acc) => {
    const res = authenticateStaff(acc.username, acc.password)
    if (res.success) {
      setCurrentStaffState(res.user)
      setAuthError('')
    }
  }

  // Handle Logout
  const handleLogout = () => {
    clearCurrentStaff()
    setCurrentStaffState(null)
    setSelectedItem(null)
    setAssigningRef(null)
  }

  // Handle Assignment (Admin only)
  const handleAssignCourier = async (ref, staffId) => {
    try {
      const staffMember = getStaffById(staffId)
      const staffName = staffMember ? `${staffMember.name} (${staffMember.badge})` : null
      const note = staffMember
        ? `Assigned to ${staffMember.name} (${staffMember.unit || 'Courier Desk'}) for collection & delivery.`
        : 'Unassigned. Returned to dispatch pool.'

      const updated = await storageClient.entities.TrackStatus.assign(ref, {
        staffId: staffId || null,
        staffName,
        note,
      })

      if (updated) {
        setAssignSuccess(`Assigned ${ref} to ${staffName || 'Pool'}!`)
        setTimeout(() => setAssignSuccess(''), 4000)
        setAssigningRef(null)
        await loadConsignments()
        if (selectedItem?.reference === ref) {
          setSelectedItem(updated)
        }
      }
    } catch (err) {
      console.error('Assignment error:', err)
    }
  }

  // Handle Status Update (Courier or Admin)
  const handleStatusSubmit = async (
    itemToUpdate = selectedItem,
    customStatus = null,
    customNote = null,
    extraPatch = {}
  ) => {
    const target = itemToUpdate || selectedItem
    if (!target?.reference) return

    setUpdateLoading(true)
    setUpdateSuccess('')

    const finalStatus = customStatus || updateStatus
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    const finalNote =
      customNote ||
      updateNote ||
      `Status updated to ${finalStatus} by ${currentStaff.name} at ${timeStr}.`

    try {
      const patch = {
        status: finalStatus,
        note: finalNote,
        updated_by: `${currentStaff.name} (${currentStaff.badge})`,
        updated_date: now.toISOString(),
        ...extraPatch,
      }

      if (finalStatus === 'dispatched' && !target.collection_time && !patch.collection_time) {
        patch.collection_time = now.toISOString()
      }
      if (finalStatus === 'delivered' && !target.delivery_time && !patch.delivery_time) {
        patch.delivery_time = now.toISOString()
      }

      const updated = await storageClient.entities.TrackStatus.update(target.reference, patch)
      setSelectedItem(updated)
      await loadConsignments()

      // Send email alert to pharmacy & recipient if enabled
      if (updateNotifyEmails && (updated.pharmacy_email || updated.recipient_email)) {
        try {
          await sendStatusUpdateEmail(updated)
          setUpdateSuccess('Status updated & notification emails sent to pharmacy and recipient!')
        } catch {
          setUpdateSuccess('Status updated in system (email service throttle).')
        }
      } else {
        setUpdateSuccess(`Status updated to ${finalStatus} at ${timeStr}!`)
      }

      setTimeout(() => setUpdateSuccess(''), 4500)
    } catch (err) {
      console.error('Update error:', err)
      setUpdateSuccess('Error updating status.')
    } finally {
      setUpdateLoading(false)
    }
  }

  // Handle Scan-Verified Doorstep Delivery with Electronic POD
  const handleConfirmVerifiedDelivery = async (targetItem, updateData) => {
    await handleStatusSubmit(
      targetItem,
      updateData.status || 'delivered',
      updateData.note,
      {
        delivery_time: updateData.delivery_time,
        pod_evidence: updateData.pod_evidence,
      }
    )
  }

  // Pre-fill note aligned with selected status level
  const handleStatusLevelChange = (newStatus, targetItem = selectedItem) => {
    setUpdateStatus(newStatus)
    const alignedText = getStatusTextForLevel(newStatus, targetItem, currentStaff)
    setUpdateNote(alignedText)
  }

  const copyTrackingLink = (code) => {
    const url = getTrackingUrl(code)
    navigator.clipboard.writeText(url)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2500)
  }

  const copyDispatchSlip = (item) => {
    const courier = getStaffById(item.assigned_to)
    const slip = generateDispatchSlip(item, courier)
    navigator.clipboard.writeText(slip)
    setCopiedSlipRef(item.reference)
    setTimeout(() => setCopiedSlipRef(''), 2500)
  }

  const openWhatsAppSlip = (item) => {
    const courier = getStaffById(item.assigned_to)
    const slip = generateDispatchSlip(item, courier)
    const phone = courier?.phone?.replace(/[^0-9]/g, '') || ''
    const waUrl = phone
      ? `https://wa.me/44${phone.replace(/^0/, '')}?text=${encodeURIComponent(slip)}`
      : `https://wa.me/?text=${encodeURIComponent(slip)}`
    window.open(waUrl, '_blank')
  }

  // -------------------------------------------------------------
  // VIEW: LOGIN SCREEN (if not signed in)
  // -------------------------------------------------------------
  if (!currentStaff) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 md:p-10 shadow-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#08162E] p-3 shadow-md">
            <img src={haydIconNavy} alt="HAYD" className="h-full w-full invert object-contain" />
          </div>

          <span className="mt-5 inline-block rounded-full bg-accent/15 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-widest text-accent">
            Restricted Operational Area
          </span>
          <h1 className="mt-2 font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            HAYD Staff Dispatch Portal
          </h1>
          <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
            Multi-user dispatch console. Admin supervises all bookings and assigns couriers; staff couriers securely view and action their assigned runs.
          </p>

          {/* Quick Demo One-Click Sign-In Buttons */}
          <div className="mt-6 rounded-2xl border border-border/80 bg-secondary/40 p-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                One-Click Quick Sign-In (For Testing)
              </span>
              <span className="text-[0.65rem] text-accent font-semibold">Demo credentials ready</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {STAFF_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="flex flex-col items-start rounded-xl border border-border bg-card p-2.5 text-left transition-all hover:border-[#0d9488] hover:shadow-sm"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    {acc.role === 'admin' ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/15 text-blue-600 text-[0.7rem]">
                        👑
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-600 text-[0.7rem]">
                        🚚
                      </span>
                    )}
                    <span className="truncate">{acc.name.split(' ')[0]}</span>
                  </div>
                  <span className="mt-1 text-[0.68rem] text-muted-foreground truncate w-full">
                    {acc.badge}
                  </span>
                  <span className="mt-0.5 text-[0.62rem] font-mono text-accent">
                    {acc.role === 'admin' ? 'Supervises all' : 'Assigned only'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Standard Form Login */}
          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">
                Staff Username or Email
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. admin@thehayd.uk, courier1, or marcus"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">
                Staff Password / Passcode
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password or passcode"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 font-mono text-sm tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
            >
              <KeyRound className="h-4 w-4" />
              Sign In with Staff Account
            </button>
          </form>

          <p className="mt-6 text-[0.7rem] text-muted-foreground">
            Authorised HAYD dispatch personnel only. For staff passcode resets, contact operations dispatch on 07761 734423.
          </p>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // Filter logic based on tab and role
  // -------------------------------------------------------------
  const couriers = getAvailableCouriers()

  const filteredConsignments = consignments.filter((item) => {
    // Role filter: If staff, they strictly only see their own assigned parcels
    if (currentStaff.role === 'staff' && item.assigned_to !== currentStaff.id) {
      return false
    }

    // Tab filter (Admin only)
    if (currentStaff.role === 'admin') {
      if (activeTab === 'unassigned' && item.assigned_to) return false
      if (activeTab === 'courier_1' && item.assigned_to !== 'courier_1') return false
      if (activeTab === 'courier_2' && item.assigned_to !== 'courier_2') return false
      if (activeTab === 'delivered' && item.status !== 'delivered') return false
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchRef = item.reference?.toLowerCase().includes(q)
      const matchPharm = item.pharmacy_name?.toLowerCase().includes(q)
      const matchRecip = item.recipient_name?.toLowerCase().includes(q)
      const matchTown = item.town?.toLowerCase().includes(q)
      return matchRef || matchPharm || matchRecip || matchTown
    }

    return true
  })

  // Admin stats
  const totalCount = consignments.length
  const unassignedCount = consignments.filter((i) => !i.assigned_to && i.status !== 'delivered' && i.status !== 'cancelled').length
  const courier1Count = consignments.filter((i) => i.assigned_to === 'courier_1' && i.status !== 'delivered').length
  const courier2Count = consignments.filter((i) => i.assigned_to === 'courier_2' && i.status !== 'delivered').length
  const deliveredCount = consignments.filter((i) => i.status === 'delivered').length

  // Staff specific stats
  const staffActiveCount = consignments.filter((i) => i.assigned_to === currentStaff.id && i.status !== 'delivered').length
  const staffDeliveredCount = consignments.filter((i) => i.assigned_to === currentStaff.id && i.status === 'delivered').length

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATED STAFF DASHBOARD
  // -------------------------------------------------------------
  return (
    <>
      {/* Top Operations Header Bar */}
      <div className="border-b border-border bg-[#08162E] text-white sticky top-0 z-30 shadow-md">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 p-1.5">
              <img src={haydIconNavy} alt="HAYD" className="h-full w-full invert object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-sm md:text-base font-bold tracking-tight text-white">
                  HAYD Operations & Dispatch
                </h1>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase',
                    currentStaff.role === 'admin'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  )}
                >
                  {currentStaff.role === 'admin' ? '👑 Controller' : '🚚 Field Staff'}
                </span>
              </div>
              <p className="text-[0.7rem] text-white/70">
                Logged in as <strong className="text-white">{currentStaff.name}</strong> ({currentStaff.badge})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/track"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Public Tracking
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

      <section className="bg-background py-8 md:py-12">
        <div className="container-page space-y-8">
          {/* ========================================================= */}
          {/* ROLE BANNER & METRICS */}
          {/* ========================================================= */}
          {currentStaff.role === 'admin' ? (
            /* ADMIN CONTROLLER METRICS */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-foreground">
                    Dispatch Operations Deck
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Supervise customer bookings, assign available couriers, and monitor live deliveries.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowManualCreator(!showManualCreator)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {showManualCreator ? 'Hide Booking Steps' : 'Book a Collection (4 Steps)'}
                  </button>
                  <button
                    onClick={() => loadConsignments()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    'cursor-pointer rounded-2xl border p-4 transition-all',
                    activeTab === 'all'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-foreground/20'
                  )}
                >
                  <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                    Total Bookings
                  </span>
                  <p className="mt-1 font-heading text-2xl font-bold text-foreground">{totalCount}</p>
                </div>

                <div
                  onClick={() => setActiveTab('unassigned')}
                  className={cn(
                    'cursor-pointer rounded-2xl border p-4 transition-all relative overflow-hidden',
                    activeTab === 'unassigned'
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                      : unassignedCount > 0
                      ? 'border-amber-400/60 bg-amber-500/5 hover:border-amber-500'
                      : 'border-border bg-card hover:border-foreground/20'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[0.68rem] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      ⚠️ Needs Assignment
                    </span>
                    {unassignedCount > 0 && (
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <p className="mt-1 font-heading text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {unassignedCount}
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('courier_1')}
                  className={cn(
                    'cursor-pointer rounded-2xl border p-4 transition-all',
                    activeTab === 'courier_1'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-border bg-card hover:border-foreground/20'
                  )}
                >
                  <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Marcus Vance (Unit 1)
                  </span>
                  <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                    {courier1Count} active
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('courier_2')}
                  className={cn(
                    'cursor-pointer rounded-2xl border p-4 transition-all',
                    activeTab === 'courier_2'
                      ? 'border-teal-500 bg-teal-500/10 shadow-sm'
                      : 'border-border bg-card hover:border-foreground/20'
                  )}
                >
                  <span className="text-[0.68rem] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Amara Okafor (Unit 2)
                  </span>
                  <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                    {courier2Count} active
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('delivered')}
                  className={cn(
                    'cursor-pointer rounded-2xl border p-4 transition-all',
                    activeTab === 'delivered'
                      ? 'border-[#0d9488] bg-[#0d9488]/10 shadow-sm'
                      : 'border-border bg-card hover:border-foreground/20'
                  )}
                >
                  <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#0d9488]">
                    Delivered Today
                  </span>
                  <p className="mt-1 font-heading text-2xl font-bold text-foreground">{deliveredCount}</p>
                </div>
              </div>
            </div>
          ) : (
            /* STAFF COURIER FOCUSED BANNER */
            <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-600 font-bold">
                      🚚
                    </span>
                    <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                      Welcome back, {currentStaff.name}
                    </h2>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    <strong>{currentStaff.unit}</strong> — Assigned active delivery run sheet for today.
                  </p>
                  <p className="text-[0.72rem] text-accent font-medium">
                    🔒 Strict staff isolation: You only see dispatches assigned directly to your unit.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-border bg-secondary/50 px-5 py-3 text-center">
                    <span className="text-[0.68rem] uppercase font-bold text-muted-foreground">
                      Your Active Drops
                    </span>
                    <p className="font-heading text-2xl font-bold text-[#0d9488]">{staffActiveCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-secondary/50 px-5 py-3 text-center">
                    <span className="text-[0.68rem] uppercase font-bold text-muted-foreground">
                      Completed Today
                    </span>
                    <p className="font-heading text-2xl font-bold text-foreground">{staffDeliveredCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEPPED DISPENSARY BOOKING (4 STEPS IDENTICAL TO WEBSITE) */}
          {/* ========================================================= */}
          {currentStaff.role === 'admin' && showManualCreator && (
            <AdminBookingSteps
              currentStaff={currentStaff}
              onBookingCreated={(newRecord) => {
                loadConsignments()
                setSelectedItem(newRecord)
              }}
              onCancel={() => setShowManualCreator(false)}
            />
          )}

          {/* ========================================================= */}
          {/* SEARCH & FILTER BAR */}
          {/* ========================================================= */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reference (HAYD-...), pharmacy, recipient, or town..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
              />
            </div>

            {assignSuccess && (
              <span className="text-xs font-bold text-accent animate-in fade-in flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> {assignSuccess}
              </span>
            )}
          </div>

          {/* ========================================================= */}
          {/* CONSIGNMENTS LIST / RUN SHEET */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-foreground">
                {currentStaff.role === 'admin'
                  ? `Active Manifests & Consignments (${filteredConsignments.length})`
                  : `Your Assigned Deliveries (${filteredConsignments.length})`}
              </h3>
              <span className="text-xs text-muted-foreground">
                {currentStaff.role === 'admin'
                  ? 'Showing live dispatches across all staff & pool'
                  : `Filtered exclusively for ${currentStaff.name}`}
              </span>
            </div>

            {filteredConsignments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                  <Package className="h-6 w-6" />
                </div>
                <h4 className="font-heading text-base font-bold text-foreground">
                  No consignments found
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {currentStaff.role === 'staff'
                    ? 'No collections are currently assigned to your unit. The Operations Controller will assign jobs to your runsheet as they arrive.'
                    : 'No bookings match your current filter or search criteria.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-1">
                {filteredConsignments.map((item) => {
                  const isAssignedToMarcus = item.assigned_to === 'courier_1'
                  const isAssignedToAmara = item.assigned_to === 'courier_2'
                  const isUnassigned = !item.assigned_to
                  const isDelivered = item.status === 'delivered'
                  const assignedStaff = getStaffById(item.assigned_to)

                  return (
                    <div
                      key={item.reference}
                      className={cn(
                        'rounded-2xl border bg-card p-5 md:p-6 shadow-sm transition-all space-y-4',
                        isUnassigned
                          ? 'border-amber-400/50 bg-amber-500/[0.02]'
                          : isDelivered
                          ? 'border-border/60 opacity-80'
                          : 'border-border hover:border-foreground/20'
                      )}
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-foreground bg-secondary px-2.5 py-1 rounded-lg">
                            {item.reference}
                          </span>

                          <span
                            className={cn(
                              'rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider',
                              item.status === 'delivered'
                                ? 'bg-emerald-600/15 text-emerald-600'
                                : item.status === 'dispatched'
                                ? 'bg-primary/10 text-primary'
                                : item.status === 'verifying'
                                ? 'bg-blue-600/15 text-blue-600'
                                : 'bg-amber-500/15 text-amber-600'
                            )}
                          >
                            {item.status}
                          </span>

                          {/* Handling Category Badges */}
                          {item.categories?.includes('cold_chain') && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[0.65rem] font-bold text-cyan-600">
                              <ThermometerSnowflake className="h-3 w-3" /> 2°C–8°C Cold Chain
                            </span>
                          )}
                          {item.categories?.includes('controlled_drugs') && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[0.65rem] font-bold text-purple-600">
                              <ShieldCheck className="h-3 w-3" /> Controlled Drug (ID Req)
                            </span>
                          )}

                          <span className="text-xs text-muted-foreground">
                            {item.package_count || '1 parcel'}
                          </span>
                        </div>

                        {/* Assignment Badge / Pill */}
                        <div className="flex items-center gap-2">
                          {isUnassigned ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-600">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Unassigned Pool
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                              <UserCheck className="h-3.5 w-3.5 text-[#0d9488]" />
                              {item.assigned_name || assignedStaff?.name || 'Staff Courier'}
                            </span>
                          )}

                          <button
                            onClick={() => setLabelModalItem(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                            title="Print physical 4x6 / thermal barcode sticker"
                          >
                            <Printer className="h-3.5 w-3.5 text-[#0d9488]" />
                            Print Sticker
                          </button>

                          <button
                            onClick={() => copyTrackingLink(item.reference)}
                            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
                            title="Copy customer tracking URL"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Consignment Stop Details (Pickup vs Dropoff) */}
                      <div className="grid gap-4 sm:grid-cols-2 text-xs">
                        {/* Dispensary Pickup */}
                        <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="font-bold uppercase tracking-wider text-[0.65rem] flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-[#0d9488]" /> 1. Dispensary Collection
                            </span>
                            {item.pharmacy_phone && (
                              <a
                                href={`tel:${item.pharmacy_phone.replace(/\s+/g, '')}`}
                                className="font-semibold text-[#0d9488] hover:underline flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" /> {item.pharmacy_phone}
                              </a>
                            )}
                          </div>
                          <p className="font-bold text-foreground text-sm">
                            {item.pharmacy_name || 'Community Pharmacy Partner'}
                          </p>
                          <p className="text-muted-foreground">
                            {item.pickup_address || `${item.town || 'Birmingham'}, UK`}
                          </p>
                          {item.pickup_address && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.pickup_address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-accent hover:underline pt-1"
                            >
                              <Navigation className="h-3 w-3" /> Directions to Pharmacy
                            </a>
                          )}
                        </div>

                        {/* Recipient Dropoff */}
                        <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="font-bold uppercase tracking-wider text-[0.65rem] flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-accent" /> 2. Patient Delivery
                            </span>
                            {item.recipient_phone && (
                              <a
                                href={`tel:${item.recipient_phone.replace(/\s+/g, '')}`}
                                className="font-semibold text-accent hover:underline flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" /> {item.recipient_phone}
                              </a>
                            )}
                          </div>
                          <p className="font-bold text-foreground text-sm">
                            {item.recipient_name || 'Recipient / Patient'}
                          </p>
                          <p className="text-muted-foreground">
                            {item.delivery_address || `${item.town || 'Birmingham'}, UK`}
                          </p>
                          {item.delivery_address && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.delivery_address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-accent hover:underline pt-1"
                            >
                              <Navigation className="h-3 w-3" /> Directions to Patient
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Route Distance, Collection Time & Live ETA Bar */}
                      <div className="rounded-xl border border-border/70 bg-gradient-to-r from-secondary/40 to-background p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                          <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                            <Clock3 className="h-3.5 w-3.5 text-[#0d9488]" />
                            {item.status === 'delivered'
                              ? `Delivered: ${item.delivery_time ? new Date(item.delivery_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Confirmed'}`
                              : item.status === 'dispatched'
                              ? `ETA: ${item.estimated_delivery_window || 'En route'}`
                              : `Est. Window: ${item.estimated_delivery_window || 'Standard round'}`}
                          </span>

                          <span className="text-muted-foreground flex items-center gap-1">
                            <Navigation className="h-3 w-3 text-accent" />
                            <strong>{item.distance_miles ? `${item.distance_miles} miles` : 'Direct route'}</strong> (~{item.transit_duration_mins || 15} mins transit)
                          </span>

                          {item.collection_time && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Package className="h-3 w-3 text-[#0d9488]" />
                              Collected: <strong>{new Date(item.collection_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</strong>
                            </span>
                          )}
                        </div>

                        <span className="text-[0.68rem] text-muted-foreground font-mono">
                          Updated: {new Date(item.updated_date || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Courier / Dispatch Note */}
                      {item.note && (
                        <div className="rounded-xl bg-background border border-border/60 px-3.5 py-2 text-xs text-muted-foreground flex items-center gap-2">
                          <Clock3 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>
                            <strong>Latest Note:</strong> {item.note}
                          </span>
                        </div>
                      )}

                      {/* Action Bar based on Role */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
                        {/* ADMIN CONTROLS: Assign & Forward to Staff */}
                        {currentStaff.role === 'admin' ? (
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs font-semibold text-muted-foreground">
                              Assign Courier:
                            </span>
                            <select
                              value={item.assigned_to || ''}
                              onChange={(e) => handleAssignCourier(item.reference, e.target.value)}
                              className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
                            >
                              <option value="">⚠️ Unassigned Pool</option>
                              {couriers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.unit ? c.unit.split('—')[0] : c.badge})
                                </option>
                              ))}
                            </select>

                            {/* Forward / Share Slip to Courier */}
                            <button
                              onClick={() => copyDispatchSlip(item)}
                              className="inline-flex items-center gap-1 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
                              title="Copy structured dispatch run sheet"
                            >
                              <Copy className="h-3 w-3" />
                              {copiedSlipRef === item.reference ? 'Copied slip!' : 'Copy Run Sheet'}
                            </button>

                            <button
                              onClick={() => openWhatsAppSlip(item)}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600/15 border border-emerald-600/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/25 transition-colors"
                              title="Send dispatch assignment to staff courier"
                            >
                              <Share2 className="h-3 w-3" />
                              WhatsApp Staff
                            </button>

                            {/* Admin Field Scan Handover */}
                            {item.status !== 'delivered' && (
                              <button
                                onClick={() => setScanModalItem(item)}
                                className="inline-flex items-center gap-1 rounded-xl border border-emerald-600/40 bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20 transition-colors"
                                title="Scan parcel sticker to verify and record POD"
                              >
                                <Scan className="h-3 w-3" />
                                Scan & Deliver
                              </button>
                            )}
                          </div>
                        ) : (
                          /* STAFF COURIER CONTROLS: Anti-misdelivery Scan & POD Handover */
                          <div className="flex flex-wrap items-center gap-2">
                            {item.status !== 'delivered' ? (
                              <>
                                {item.status !== 'dispatched' ? (
                                  <button
                                    onClick={() => {
                                      const now = new Date()
                                      const text = getStatusTextForLevel('dispatched', item, currentStaff)
                                      handleStatusSubmit(
                                        item,
                                        'dispatched',
                                        text,
                                        { collection_time: now.toISOString() }
                                      )
                                    }}
                                    disabled={updateLoading}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                                  >
                                    <Package className="h-3.5 w-3.5" />
                                    Mark Collected from Pharmacy
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setScanModalItem(item)}
                                    disabled={updateLoading}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                                  >
                                    <Scan className="h-4 w-4" />
                                    Scan Barcode to Deliver
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/10 border border-emerald-600/20 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Delivered & Signed</span>
                                {item.pod_evidence && (
                                  <span className="font-normal text-[0.68rem] text-muted-foreground ml-1">
                                    (Barcode Verified POD)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status Updater Modal / Dropdown Opener */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item)
                              const currentLevel = item.status || 'dispatched'
                              setUpdateStatus(currentLevel)
                              setUpdateNote(getStatusTextForLevel(currentLevel, item, currentStaff))
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d9488] hover:underline"
                          >
                            Update Notes & Status →
                          </button>
                        </div>
                      </div>

                      {/* INLINE STATUS & NOTES EDITOR (When selected) */}
                      {selectedItem?.reference === item.reference && (
                        <div className="rounded-2xl border-2 border-[#0d9488]/30 bg-secondary/40 p-4 space-y-3 mt-3 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Send className="h-3.5 w-3.5 text-[#0d9488]" />
                              Update Status & Trigger Email Notifications
                            </span>
                            <button
                              onClick={() => setSelectedItem(null)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-1">
                              <label className="text-[0.7rem] font-semibold text-foreground/80">
                                Consignment Status Level
                              </label>
                              <select
                                value={updateStatus}
                                onChange={(e) => handleStatusLevelChange(e.target.value, item)}
                                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <span className="text-[0.65rem] text-[#0d9488] block">
                                ✓ Level-aligned text pre-filled
                              </span>
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[0.7rem] font-semibold text-foreground/80">
                                  Status Note (Pre-aligned to status & fully editable)
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setUpdateNote(getStatusTextForLevel(updateStatus, item, currentStaff))}
                                  className="text-[0.65rem] text-[#0d9488] font-semibold hover:underline"
                                >
                                  Reset to level default
                                </button>
                              </div>
                              <textarea
                                rows={2}
                                value={updateNote}
                                onChange={(e) => setUpdateNote(e.target.value)}
                                placeholder="Status message to pharmacy and patient..."
                                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
                              />

                              {/* Quick tags */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="text-[0.65rem] text-muted-foreground">Quick additions:</span>
                                {[
                                  '+ Cold-chain 2°C–8°C logged',
                                  '+ Photo ID verified',
                                  '+ Handed to named patient',
                                  '+ Handed to spouse with consent',
                                  '+ Doorbell answered promptly',
                                ].map((chip) => (
                                  <button
                                    key={chip}
                                    type="button"
                                    onClick={() => {
                                      const addition = chip.replace(/^\+\s*/, '')
                                      setUpdateNote((prev) => (prev ? `${prev.trim()} ${addition}.` : `${addition}.`))
                                    }}
                                    className="rounded-full border border-border bg-card px-2 py-0.5 text-[0.65rem] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                                  >
                                    {chip}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={updateNotifyEmails}
                                onChange={(e) => setUpdateNotifyEmails(e.target.checked)}
                                className="rounded text-[#0d9488] focus:ring-[#0d9488]"
                              />
                              Send email update to pharmacy ({item.pharmacy_email || 'recorded'}) and recipient
                            </label>

                            <button
                              onClick={() => handleStatusSubmit()}
                              disabled={updateLoading}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0d9488] px-4 text-xs font-bold text-white hover:bg-[#0d9488]/90 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              {updateLoading ? (
                                <>
                                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving…
                                </>
                              ) : (
                                'Save & Send Notifications'
                              )}
                            </button>
                          </div>

                          {updateSuccess && (
                            <p className="text-xs font-bold text-accent">{updateSuccess}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Anti-Misdelivery: Printable Sticker Label Modal */}
      {labelModalItem && (
        <ParcelLabelModal
          item={labelModalItem}
          isOpen={Boolean(labelModalItem)}
          onClose={() => setLabelModalItem(null)}
        />
      )}

      {/* Doorstep Scan-to-Match & POD Verification Modal */}
      {scanModalItem && (
        <DeliveryScanModal
          item={scanModalItem}
          isOpen={Boolean(scanModalItem)}
          onClose={() => setScanModalItem(null)}
          onConfirmDelivery={handleConfirmVerifiedDelivery}
          currentStaff={currentStaff}
        />
      )}

      {/* Floating Staff Internal Communications & Dispatch Radio */}
      <StaffChatWidget currentStaff={currentStaff} />
    </>
  )
}
