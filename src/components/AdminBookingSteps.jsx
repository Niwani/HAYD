import React, { useState } from 'react'
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Clock3,
  CalendarDays,
  Repeat2,
  Zap,
  Building2,
  MapPin,
  Package,
  ThermometerSnowflake,
  ShieldCheck,
  Phone,
  Copy,
  PlusCircle,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  Share2,
  UserCheck,
  Navigation,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { storageClient } from '@/lib/storage'
import { getAvailableCouriers, getStaffById } from '@/lib/staffAuth'
import { sendCollectionBookingEmail, getTrackingUrl } from '@/lib/email'
import { calculateDeliveryETA } from '@/lib/etaCalculator'
import { cn } from '@/lib/utils'

const STEPS = ['Dispensary', 'Recipient', 'Medicines & Timing', 'Review & Assign']

const TIMING_OPTIONS = [
  { id: 'asap', icon: Zap, title: 'Urgent same-day', body: 'Within four hours, today.' },
  { id: 'today', icon: Clock3, title: 'Today’s cut-off round', body: 'Collected before 4pm.' },
  { id: 'scheduled', icon: CalendarDays, title: 'Specific date & slot', body: 'Book up to 14 days ahead.' },
  { id: 'repeat', icon: Repeat2, title: 'Repeat scheduled round', body: 'Regular daily or weekly cycle.' },
]

const TIME_SLOTS = [
  '09:00 – 12:00',
  '12:00 – 15:00',
  '15:00 – 18:00',
  '18:00 – 20:00',
]

const HANDLING_CATEGORIES = [
  { id: 'ambient', label: 'Standard Ambient (Solid dose, blister packs, liquids)' },
  { id: 'cold_chain', label: 'Cold-Chain 2°C–8°C (Insulins, eye drops, biologics)' },
  { id: 'controlled_drugs', label: 'Controlled Drugs (Schedule 2/3 - ID & named signature)' },
  { id: 'urgent_palliative', label: 'Urgent / Palliative / Hospital Discharge' },
]

const INITIAL_FORM = {
  // Pharmacy / Dispensary
  pharmacy_name: '',
  contact_person: '',
  phone: '',
  email: '',
  pickup_address: '',

  // Recipient / Patient
  patient_name: '',
  recipient_phone: '',
  recipient_email: '',
  address_line1: '',
  address_line2: '',
  town: 'Birmingham',
  postcode: '',
  delivery_notes: '',

  // Medicines & Handling
  categories: ['ambient'],
  package_count: '1',
  rx_reference: '',
  prescription_notes: '',

  // Timing
  window_type: 'asap',
  scheduled_date: '',
  time_slot: '',
  notes: '',

  // Admin Assignment
  assigned_to: '',
  admin_notes: '',
  send_notifications: true,
}

function generateReference() {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return `HAYD-${Array.from(bytes, (b) => chars[b % chars.length]).join('')}`
}

function StepBar({ currentStep }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {STEPS.map((label, idx) => {
        const isDone = idx < currentStep
        const isCurrent = idx === currentStep
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-[0.7rem] font-bold transition-all',
                isDone && 'border-[#0d9488] bg-[#0d9488] text-white',
                isCurrent && 'border-primary bg-primary text-primary-foreground ring-2 ring-primary/20',
                !isDone && !isCurrent && 'border-border bg-card text-muted-foreground'
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : idx + 1}
            </span>
            <span
              className={cn(
                'text-xs font-semibold tracking-tight',
                isCurrent ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function FormInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  error,
  helper,
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('h-10 bg-background text-xs', error && 'border-destructive focus-visible:ring-destructive')}
      />
      {helper && <p className="text-[0.68rem] text-muted-foreground">{helper}</p>}
      {error && <p className="text-[0.68rem] font-semibold text-destructive">{error}</p>}
    </div>
  )
}

export default function AdminBookingSteps({ onBookingCreated, onCancel, currentStaff }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [createdReference, setCreatedReference] = useState('')
  const [createdItem, setCreatedItem] = useState(null)
  const [copiedRef, setCopiedRef] = useState(false)
  const [copiedSlip, setCopiedSlip] = useState(false)

  const couriers = getAvailableCouriers()

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const toggleCategory = (catId) => {
    setForm((prev) => {
      const exists = prev.categories.includes(catId)
      const updated = exists ? prev.categories.filter((c) => c !== catId) : [...prev.categories, catId]
      return { ...prev, categories: updated.length ? updated : ['ambient'] }
    })
  }

  const validateCurrentStep = () => {
    const errs = {}
    if (step === 0) {
      if (!form.pharmacy_name.trim()) errs.pharmacy_name = 'Dispensary / Pharmacy name is required.'
      if (!form.phone.trim()) errs.phone = 'Dispensary phone number is required.'
      if (!form.email.trim()) errs.email = 'Dispensary email is required for tracking & POD.'
      if (!form.pickup_address.trim()) errs.pickup_address = 'Pickup address is required.'
    } else if (step === 1) {
      if (!form.patient_name.trim()) errs.patient_name = 'Recipient or patient name is required.'
      if (!form.recipient_email?.trim()) errs.recipient_email = 'Recipient email is required for delivery alerts.'
      if (!form.address_line1.trim()) errs.address_line1 = 'Delivery address is required.'
      if (!form.postcode.trim()) errs.postcode = 'Postcode is required.'
    } else if (step === 2) {
      if (!form.package_count || Number(form.package_count) < 1) {
        errs.package_count = 'Please specify at least 1 package.'
      }
      if (form.window_type === 'scheduled' && !form.scheduled_date) {
        errs.scheduled_date = 'Please pick a collection date.'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setErrors({})

    const ref = generateReference()
    const now = new Date()

    const assignedStaff = form.assigned_to ? getStaffById(form.assigned_to) : null
    const assignedName = assignedStaff ? `${assignedStaff.name} (${assignedStaff.badge})` : null

    const fullPickup = form.pickup_address
    const fullDelivery = `${form.address_line1}${form.address_line2 ? ', ' + form.address_line2 : ''}, ${form.town}, ${form.postcode}`

    // Compute route distance & dynamic ETA
    const etaInfo = calculateDeliveryETA({
      pickupAddress: fullPickup,
      deliveryAddress: fullDelivery,
      collectionTime: null,
      status: 'received',
    })

    const initialHistory = [
      {
        id: `h_${Date.now()}`,
        status: 'received',
        title: form.assigned_to ? `Booking Logged & Assigned to ${assignedStaff?.name}` : 'Booking Received & Scheduled',
        timestamp: now.toISOString(),
        note: form.admin_notes || (form.assigned_to ? `Created by Operations Admin and assigned to ${assignedStaff?.name}.` : 'Created by Operations Admin in unassigned pool.'),
        updated_by: `${currentStaff?.name || 'Operations Controller'} (Admin)`,
      },
    ]

    try {
      const bookingData = {
        reference: ref,
        pharmacy_name: form.pharmacy_name,
        contact_person: form.contact_person,
        phone: form.phone,
        email: form.email,
        pickup_address: fullPickup,
        patient_name: form.patient_name,
        recipient_phone: form.recipient_phone,
        recipient_email: form.recipient_email,
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        town: form.town,
        postcode: form.postcode,
        delivery_notes: form.delivery_notes,
        categories: form.categories,
        package_count: form.package_count,
        rx_reference: form.rx_reference,
        prescription_notes: form.prescription_notes,
        window_type: form.window_type,
        scheduled_date: form.scheduled_date,
        time_slot: form.time_slot,
        notes: form.notes,
        status: 'received',
        assigned_to: form.assigned_to || null,
        assigned_name: assignedName,
        assigned_at: form.assigned_to ? now.toISOString() : null,
      }

      // 1. Save to local storage
      await storageClient.entities.DeliveryRequest.create(bookingData)
      const record = await storageClient.entities.TrackStatus.create({
        reference: ref,
        status: 'received',
        assigned_to: form.assigned_to || null,
        assigned_name: assignedName,
        assigned_at: form.assigned_to ? now.toISOString() : null,
        town: form.town,
        recipient_name: form.patient_name,
        recipient_email: form.recipient_email,
        recipient_phone: form.recipient_phone,
        pharmacy_name: form.pharmacy_name,
        pharmacy_email: form.email,
        pharmacy_phone: form.phone,
        pickup_address: fullPickup,
        delivery_address: fullDelivery,
        categories: form.categories,
        package_count: `${form.package_count} package(s)`,
        distance_miles: etaInfo.distanceMiles,
        transit_duration_mins: etaInfo.transitMinutes,
        estimated_delivery_window: etaInfo.windowStr,
        note: form.admin_notes || (form.assigned_to ? `Assigned to ${assignedStaff?.name}. Awaiting scheduled collection from dispensary.` : 'Logged in dispatch system. Awaiting courier allocation.'),
        history: initialHistory,
      })

      // 2. Send email notification if toggled
      if (form.send_notifications) {
        try {
          await sendCollectionBookingEmail(bookingData)
        } catch (emailErr) {
          console.warn('Booking email dispatch skipped/throttled:', emailErr)
        }
      }

      setCreatedReference(ref)
      setCreatedItem(record)
      if (onBookingCreated) {
        onBookingCreated(record)
      }
    } catch (err) {
      console.error('Admin manual booking creation error:', err)
      setErrors({ submit: 'Could not create consignment. Please verify the input fields.' })
    } finally {
      setLoading(false)
    }
  }

  const copyRefCode = () => {
    if (!createdReference) return
    navigator.clipboard.writeText(createdReference)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2500)
  }

  const copySlip = () => {
    if (!createdItem) return
    const text = `*HAYD DISPATCH MANIFEST*
Ref: ${createdItem.reference}
Assigned to: ${createdItem.assigned_name || 'Unassigned Pool'}

*1. PICKUP (Dispensary)*
${createdItem.pharmacy_name}
Address: ${createdItem.pickup_address}
Phone: ${createdItem.pharmacy_phone || 'Call Dispatch'}

*2. DELIVERY (Patient Doorstep)*
Recipient: ${createdItem.recipient_name}
Address: ${createdItem.delivery_address}
Phone: ${createdItem.recipient_phone || 'N/A'}

*Route & Timing:*
• Distance: ${createdItem.distance_miles || 'Direct'} miles (~${createdItem.transit_duration_mins || 15} mins transit)
• Estimated Delivery Window: ${createdItem.estimated_delivery_window || 'Standard round'}
• Packages: ${createdItem.package_count}

*Live Tracker:* ${getTrackingUrl(createdItem.reference)}`

    navigator.clipboard.writeText(text)
    setCopiedSlip(true)
    setTimeout(() => setCopiedSlip(false), 2500)
  }

  // -------------------------------------------------------------
  // SUCCESS SCREEN
  // -------------------------------------------------------------
  if (createdReference && createdItem) {
    return (
      <div className="rounded-3xl border-2 border-[#0d9488]/40 bg-card p-6 md:p-8 shadow-xl animate-in fade-in space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/15 text-emerald-600">
              <Check className="h-6 w-6 stroke-[3]" />
            </span>
            <div>
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#0d9488]">
                Booking Confirmed & Dispatched
              </span>
              <h3 className="font-heading text-xl font-bold text-foreground">
                Consignment {createdReference} Activated
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCreatedReference('')
                setCreatedItem(null)
                setForm(INITIAL_FORM)
                setStep(0)
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <PlusCircle className="h-4 w-4" /> Book Another Consignment
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Back to Dispatch Deck
            </button>
          </div>
        </div>

        {/* Reference & Allocation Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-1">
            <span className="text-[0.68rem] uppercase font-bold text-muted-foreground block">
              Tracking Reference
            </span>
            <div className="font-mono text-xl font-extrabold text-foreground">{createdReference}</div>
            <button
              onClick={copyRefCode}
              className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-accent hover:underline pt-1"
            >
              <Copy className="h-3 w-3" />
              {copiedRef ? 'Copied to clipboard!' : 'Copy reference code'}
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-1">
            <span className="text-[0.68rem] uppercase font-bold text-muted-foreground block">
              Assigned Field Staff
            </span>
            <div className="font-heading text-base font-bold text-foreground flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-[#0d9488]" />
              {createdItem.assigned_name || '⚠️ Unassigned (In Pool)'}
            </div>
            <p className="text-[0.72rem] text-muted-foreground">
              {createdItem.assigned_to ? 'Appears on courier’s mobile runsheet' : 'Requires allocation by controller'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-1">
            <span className="text-[0.68rem] uppercase font-bold text-muted-foreground block">
              Route & Dynamic ETA
            </span>
            <div className="font-heading text-base font-bold text-[#0d9488]">
              {createdItem.distance_miles} miles (~{createdItem.transit_duration_mins} mins)
            </div>
            <p className="text-[0.72rem] text-muted-foreground">
              Est. Window: {createdItem.estimated_delivery_window}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={copySlip}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedSlip ? 'Slip Copied!' : 'Copy Structured Courier Run Sheet'}
          </button>

          <a
            href={getTrackingUrl(createdReference)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-accent hover:bg-secondary transition-colors"
          >
            <Navigation className="h-3.5 w-3.5" /> Open Public Tracking Page
          </a>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // STEPPED FORM WORKFLOW (4 STEPS IDENTICAL TO WEBSITE)
  // -------------------------------------------------------------
  return (
    <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 md:p-8 shadow-xl space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-accent">
            Operations Console — Manual Intake
          </span>
          <h3 className="font-heading text-lg md:text-xl font-bold text-foreground">
            Dispensary Collection Booking
          </h3>
          <p className="text-xs text-muted-foreground">
            Follow the 4-step dispensary protocol for phone, clinic, or urgent unscheduled collection intakes.
          </p>
        </div>

        <button
          onClick={onCancel}
          className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          Cancel & Close
        </button>
      </div>

      {/* Step Bar */}
      <div className="border-b border-border/60 pb-4">
        <StepBar currentStep={step} />
      </div>

      {/* ========================================================= */}
      {/* STEP 1: DISPENSARY DETAILS */}
      {/* ========================================================= */}
      {step === 0 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Building2 className="h-4 w-4 text-[#0d9488]" /> Step 1: Dispensary & Collection Counter
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the dispensing pharmacy where our courier will arrive for the medicine handover.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <FormInput
              id="admin_pharmacy_name"
              label="Pharmacy / Dispensary Name"
              required
              value={form.pharmacy_name}
              onChange={(v) => update({ pharmacy_name: v })}
              placeholder="e.g. Well Pharmacy, Church Street"
              error={errors.pharmacy_name}
            />

            <FormInput
              id="admin_contact_person"
              label="Dispensary Contact / Pharmacist"
              value={form.contact_person}
              onChange={(v) => update({ contact_person: v })}
              placeholder="e.g. Lead Pharmacist / Counter Manager"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              id="admin_phone"
              label="Counter Phone Number"
              required
              type="tel"
              value={form.phone}
              onChange={(v) => update({ phone: v })}
              placeholder="e.g. 0121 445 1102"
              error={errors.phone}
            />

            <FormInput
              id="admin_email"
              label="Dispensary Email (receives manifest receipts & POD)"
              required
              type="email"
              value={form.email}
              onChange={(v) => update({ email: v })}
              placeholder="e.g. dispensary@pharmacy.co.uk"
              error={errors.email}
            />
          </div>

          <FormInput
            id="admin_pickup_address"
            label="Dispensary Collection Address & Postcode"
            required
            value={form.pickup_address}
            onChange={(v) => update({ pickup_address: v })}
            placeholder="e.g. 142 High Street, Harborne, Birmingham, B17 9PT"
            helper="Full postal address where courier collects from the counter."
            error={errors.pickup_address}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 2: RECIPIENT DETAILS */}
      {/* ========================================================= */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <MapPin className="h-4 w-4 text-accent" /> Step 2: Recipient / Patient Details
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the patient or clinic destination where medicines will be delivered hand-to-hand.
          </p>

          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            <FormInput
              id="admin_patient_name"
              label="Recipient / Patient Full Name"
              required
              value={form.patient_name}
              onChange={(v) => update({ patient_name: v })}
              placeholder="e.g. Arthur Pendelton"
              error={errors.patient_name}
            />

            <FormInput
              id="admin_recipient_phone"
              label="Recipient Phone (call ahead)"
              type="tel"
              value={form.recipient_phone}
              onChange={(v) => update({ recipient_phone: v })}
              placeholder="e.g. 07891 223344"
            />

            <FormInput
              id="admin_recipient_email"
              label="Recipient Email (receives live tracking link)"
              required
              type="email"
              value={form.recipient_email}
              onChange={(v) => update({ recipient_email: v })}
              placeholder="e.g. patient@example.com"
              error={errors.recipient_email}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              id="admin_address_line1"
              label="Delivery Address Line 1"
              required
              value={form.address_line1}
              onChange={(v) => update({ address_line1: v })}
              placeholder="e.g. 28 Moor Pool Avenue"
              error={errors.address_line1}
            />

            <FormInput
              id="admin_address_line2"
              label="Address Line 2 (Optional)"
              value={form.address_line2}
              onChange={(v) => update({ address_line2: v })}
              placeholder="e.g. Flat 4B or Estate"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              id="admin_town"
              label="Town / City"
              value={form.town}
              onChange={(v) => update({ town: v })}
              placeholder="e.g. Birmingham or Solihull"
            />

            <FormInput
              id="admin_postcode"
              label="Postcode"
              required
              value={form.postcode}
              onChange={(v) => update({ postcode: v.toUpperCase() })}
              placeholder="e.g. B17 9HN"
              error={errors.postcode}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin_delivery_notes" className="text-xs font-semibold text-foreground/80">
              Access & Delivery Notes (Gate codes, intercom, safe door instructions)
            </Label>
            <input
              id="admin_delivery_notes"
              type="text"
              value={form.delivery_notes}
              onChange={(e) => update({ delivery_notes: e.target.value })}
              placeholder="e.g. Ring buzzer 4B, patient has limited mobility, knock firmly"
              className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs text-foreground"
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 3: MEDICINES & TIMING */}
      {/* ========================================================= */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Package className="h-4 w-4 text-[#0d9488]" /> Step 3: Handling Classification & Timing Window
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select temperature tiers, regulatory handling, and required collection slot.
            </p>
          </div>

          {/* Handling Categories Checkboxes */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider">
              Handling & Compliance Categories (Select all that apply)
            </Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {HANDLING_CATEGORIES.map((cat) => {
                const checked = form.categories.includes(cat.id)
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all',
                      checked
                        ? 'border-[#0d9488] bg-[#0d9488]/10 text-foreground font-semibold'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleCategory(cat.id)}
                      className="data-[state=checked]:bg-[#0d9488] data-[state=checked]:border-[#0d9488]"
                    />
                    <span className="text-xs leading-snug">{cat.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              id="admin_package_count"
              label="Package / Parcel Count"
              type="number"
              required
              value={form.package_count}
              onChange={(v) => update({ package_count: v })}
              placeholder="1"
              error={errors.package_count}
            />

            <FormInput
              id="admin_rx_reference"
              label="Rx / PMR Reference (Optional)"
              value={form.rx_reference}
              onChange={(v) => update({ rx_reference: v })}
              placeholder="e.g. RX-2026-9921"
            />
          </div>

          {/* Timing Options */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider">
              Collection Window
            </Label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TIMING_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const selected = form.window_type === opt.id
                return (
                  <div
                    key={opt.id}
                    onClick={() => update({ window_type: opt.id })}
                    className={cn(
                      'flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all',
                      selected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border bg-secondary/30 hover:bg-secondary/60'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', selected ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="text-xs font-bold text-foreground">{opt.title}</span>
                    </div>
                    <p className="mt-2 text-[0.7rem] text-muted-foreground leading-relaxed">{opt.body}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {form.window_type === 'scheduled' && (
            <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-border bg-secondary/40 p-4">
              <FormInput
                id="admin_scheduled_date"
                label="Scheduled Collection Date"
                type="date"
                required
                value={form.scheduled_date}
                onChange={(v) => update({ scheduled_date: v })}
                error={errors.scheduled_date}
              />

              <div className="space-y-1.5">
                <Label htmlFor="admin_time_slot" className="text-xs font-semibold text-foreground/80">
                  Target Time Slot
                </Label>
                <select
                  id="admin_time_slot"
                  value={form.time_slot}
                  onChange={(e) => update({ time_slot: e.target.value })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
                >
                  <option value="">Select window</option>
                  {TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 4: REVIEW & DISPATCH ASSIGNMENT (ADMIN EXCLUSIVE) */}
      {/* ========================================================= */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <UserCheck className="h-4 w-4 text-[#0d9488]" /> Step 4: Review Details & Assign Courier
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review all manifest details and allocate directly to an active field courier.
            </p>
          </div>

          {/* Manifest Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground font-bold uppercase tracking-wider text-[0.65rem]">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-[#0d9488]" /> Dispensary Pickup
                </span>
                <span>{form.phone}</span>
              </div>
              <p className="font-bold text-sm text-foreground">{form.pharmacy_name}</p>
              <p className="text-muted-foreground">{form.pickup_address}</p>
              <p className="text-muted-foreground">{form.email}</p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground font-bold uppercase tracking-wider text-[0.65rem]">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-accent" /> Recipient Doorstep
                </span>
                <span>{form.recipient_phone || 'No phone'}</span>
              </div>
              <p className="font-bold text-sm text-foreground">{form.patient_name}</p>
              <p className="text-muted-foreground">
                {form.address_line1}, {form.town}, {form.postcode}
              </p>
              <p className="text-muted-foreground">{form.recipient_email}</p>
            </div>
          </div>

          {/* Medicines & Route Estimates */}
          <div className="rounded-2xl border border-border bg-background p-4 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-foreground">
                Medicines: {form.package_count} package(s) ({form.categories.join(', ')})
              </span>
              <span className="font-mono text-muted-foreground">
                Timing: {TIMING_OPTIONS.find((t) => t.id === form.window_type)?.title || form.window_type}
              </span>
            </div>
            {form.delivery_notes && (
              <p className="text-muted-foreground">
                <strong>Delivery Instructions:</strong> {form.delivery_notes}
              </p>
            )}
          </div>

          {/* ADMIN COURIER ASSIGNMENT PANEL */}
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h4 className="font-heading text-sm font-bold text-foreground">
                Admin Dispatch Allocation
              </h4>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="admin_assigned_to" className="text-xs font-semibold text-foreground/80">
                  Assign Immediately to Courier:
                </Label>
                <select
                  id="admin_assigned_to"
                  value={form.assigned_to}
                  onChange={(e) => update({ assigned_to: e.target.value })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
                >
                  <option value="">⚠️ Leave in Unassigned Pool (Controller allocation)</option>
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.badge} ({c.vehicle ? c.vehicle.split('(')[0] : 'Van'})
                    </option>
                  ))}
                </select>
                <p className="text-[0.68rem] text-muted-foreground">
                  If selected, the consignment immediately appears on the courier’s mobile runsheet.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin_custom_notes" className="text-xs font-semibold text-foreground/80">
                  Internal Controller Note:
                </Label>
                <input
                  id="admin_custom_notes"
                  type="text"
                  value={form.admin_notes}
                  onChange={(e) => update({ admin_notes: e.target.value })}
                  placeholder="e.g. Phone order from Dr Patel. Urgent priority."
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs text-foreground"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <label className="flex items-center gap-2 text-xs text-foreground/80 cursor-pointer">
                <Checkbox
                  checked={form.send_notifications}
                  onCheckedChange={(checked) => update({ send_notifications: Boolean(checked) })}
                  className="data-[state=checked]:bg-[#0d9488] data-[state=checked]:border-[#0d9488]"
                />
                <span>
                  Automatically send manifest confirmation emails to dispensary (<strong>{form.email || 'counter'}</strong>) and recipient (<strong>{form.recipient_email || 'patient'}</strong>).
                </span>
              </label>
            </div>
          </div>

          {errors.submit && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Next Step <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0d9488] px-7 py-2.5 text-xs font-bold text-white hover:bg-[#0d9488]/90 disabled:opacity-50 transition-colors shadow-md"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" /> Generating Manifest & Dispatching…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Confirm Booking & Activate Consignment
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
