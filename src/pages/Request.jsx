import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Clock3,
  CalendarDays,
  Repeat2,
  Zap,
  Lock,
  ShieldCheck,
  Phone,
  Copy,
  LoaderCircle,
  Building2,
  MapPin,
  Package,
  ThermometerSnowflake,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { PageHero } from '@/components/SharedSections'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { storageClient } from '@/lib/storage'
import { sendCollectionBookingEmail } from '@/lib/email'
import { cn } from '@/lib/utils'

const STEPS = ['Dispensary', 'Recipient', 'Medicines & Timing', 'Review']

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
          <li key={label} className="flex items-center gap-2.5">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-[0.7rem] font-semibold transition-colors',
                isDone && 'border-accent bg-accent text-accent-foreground',
                isCurrent && 'border-primary bg-primary text-primary-foreground',
                !isDone && !isCurrent && 'border-border bg-card text-muted-foreground'
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : idx + 1}
            </span>
            <span
              className={cn(
                'text-[0.78rem] font-medium tracking-[0.02em]',
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

function FormInput({ id, label, value, onChange, placeholder, required = false, type = 'text', error, helper }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[0.8rem] text-foreground/75">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('h-11 bg-background', error && 'border-destructive focus-visible:ring-destructive')}
      />
      {helper && <p className="text-[0.72rem] text-muted-foreground">{helper}</p>}
      {error && <p className="text-[0.7rem] font-medium text-destructive">{error}</p>}
    </div>
  )
}

export default function Request() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reference, setReference] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [copied, setCopied] = useState(false)

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
      if (!form.pharmacy_name.trim()) errs.pharmacy_name = 'Please provide the pharmacy name.'
      if (!form.phone.trim()) errs.phone = 'Dispensary phone number is required.'
      if (!form.email.trim()) errs.email = 'Email address is required for manifest & tracking.'
      if (!form.pickup_address.trim()) errs.pickup_address = 'Please specify the dispensary collection address.'
    } else if (step === 1) {
      if (!form.patient_name.trim()) errs.patient_name = 'Recipient or patient name is required.'
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

  const handleSubmit = async () => {
    if (!consent) {
      setErrors({ consent: 'Please confirm the medicines are packaged and ready for collection.' })
      return
    }

    setLoading(true)
    setSubmitError('')

    const ref = generateReference()

    try {
      const bookingData = {
        reference: ref,
        pharmacy_name: form.pharmacy_name,
        contact_person: form.contact_person,
        phone: form.phone,
        email: form.email,
        pickup_address: form.pickup_address,
        patient_name: form.patient_name,
        recipient_phone: form.recipient_phone,
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
      }

      // 1. Save to local store
      await storageClient.entities.DeliveryRequest.create(bookingData)
      await storageClient.entities.TrackStatus.create({
        reference: ref,
        status: 'received',
        town: form.town,
        recipient_name: form.patient_name,
        pharmacy_name: form.pharmacy_name,
        note: `Collection logged for ${form.pharmacy_name}. Dispatching courier to collect from dispensary.`,
      })

      // 2. Send email notification to healthatyourdoor.co@gmail.com and confirmation to pharmacy
      await sendCollectionBookingEmail(bookingData)

      setReference(ref)
    } catch (err) {
      console.error('Booking submission error:', err)
      setSubmitError('Something went wrong logging your booking. Please try again or call dispatch on 07761 734423.')
    } finally {
      setLoading(false)
    }
  }

  const copyRef = () => {
    if (!reference) return
    navigator.clipboard.writeText(reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setConsent(false)
    setErrors({})
    setReference('')
    setStep(0)
  }

  return (
    <>
      <PageHero
        eyebrow="Dispensary Portal"
        title="Book a prescription collection"
        intro="For community pharmacies, clinics, and healthcare partners. Book a single urgent script or a multi-bag afternoon round — confirmed with full chain of custody."
      />

      <section className="bg-background py-14 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.55fr_1fr] lg:gap-16">
          <div>
            {reference ? (
              <div className="rounded-3xl border border-border bg-card p-8 md:p-12 text-center animate-in fade-in">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Check className="h-7 w-7" strokeWidth={2.4} />
                </span>

                <h2 className="mt-5 font-heading text-2xl font-bold tracking-tight text-foreground">
                  Collection confirmed & logged
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Your request has been dispatched to our operations team. A courier is assigned according to your selected window.
                </p>

                {/* Reference Card */}
                <div className="my-8 mx-auto max-w-sm rounded-2xl border border-border bg-secondary/50 p-6 text-center">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tracking & Manifest Reference
                  </span>
                  <div className="mt-2 font-mono text-2xl font-extrabold tracking-widest text-foreground">
                    {reference}
                  </div>
                  <button
                    onClick={copyRef}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-secondary transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Copied to clipboard!' : 'Copy reference code'}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to={`/track?ref=${reference}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Track this delivery live
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={resetForm}
                    className="w-full sm:w-auto rounded-full border border-border px-6 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    Book another collection
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-card p-6 md:p-10 shadow-sm">
                <StepBar currentStep={step} />

                <div className="mt-9">
                  {/* Step 0: Pharmacy Dispensary */}
                  {step === 0 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                          Pharmacy dispensary details
                        </h2>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          Where our courier will collect the medicines manifest.
                        </p>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormInput
                          id="pharmacy_name"
                          label="Pharmacy / Branch Name"
                          required
                          value={form.pharmacy_name}
                          onChange={(val) => update({ pharmacy_name: val })}
                          placeholder="e.g. Well Pharmacy, Church St"
                          error={errors.pharmacy_name}
                        />

                        <FormInput
                          id="contact_person"
                          label="Contact Person / Dispenser"
                          value={form.contact_person}
                          onChange={(val) => update({ contact_person: val })}
                          placeholder="e.g. Sarah Jenkins (Pharmacist)"
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormInput
                          id="phone"
                          label="Dispensary Phone"
                          type="tel"
                          required
                          value={form.phone}
                          onChange={(val) => update({ phone: val })}
                          placeholder="0121 496 0123"
                          error={errors.phone}
                        />

                        <FormInput
                          id="email"
                          label="Pharmacy Email"
                          type="email"
                          required
                          value={form.email}
                          onChange={(val) => update({ email: val })}
                          placeholder="dispensary@pharmacy.co.uk"
                          helper="Electronic manifest and POD will be emailed here."
                          error={errors.email}
                        />
                      </div>

                      <FormInput
                        id="pickup_address"
                        label="Dispensary Collection Address & Postcode"
                        required
                        value={form.pickup_address}
                        onChange={(val) => update({ pickup_address: val })}
                        placeholder="e.g. 14 High Street, Birmingham, B2 4XJ"
                        error={errors.pickup_address}
                      />
                    </div>
                  )}

                  {/* Step 1: Recipient / Patient */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                          Delivery recipient & destination
                        </h2>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          Who the medicines will be delivered to and signed by.
                        </p>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormInput
                          id="patient_name"
                          label="Recipient / Patient Full Name"
                          required
                          value={form.patient_name}
                          onChange={(val) => update({ patient_name: val })}
                          placeholder="e.g. Robert Hughes"
                          error={errors.patient_name}
                        />

                        <FormInput
                          id="recipient_phone"
                          label="Recipient Contact Phone"
                          type="tel"
                          value={form.recipient_phone}
                          onChange={(val) => update({ recipient_phone: val })}
                          placeholder="Mobile for delivery arrival SMS/call"
                        />
                      </div>

                      <div className="space-y-4">
                        <FormInput
                          id="address_line1"
                          label="Delivery Address (Line 1)"
                          required
                          value={form.address_line1}
                          onChange={(val) => update({ address_line1: val })}
                          placeholder="House number and street"
                          error={errors.address_line1}
                        />

                        <div className="grid gap-5 sm:grid-cols-3">
                          <FormInput
                            id="address_line2"
                            label="Address Line 2"
                            value={form.address_line2}
                            onChange={(val) => update({ address_line2: val })}
                            placeholder="Apartment, suite, etc."
                          />

                          <FormInput
                            id="town"
                            label="Town / City"
                            required
                            value={form.town}
                            onChange={(val) => update({ town: val })}
                            placeholder="Birmingham"
                          />

                          <FormInput
                            id="postcode"
                            label="Postcode"
                            required
                            value={form.postcode}
                            onChange={(val) => update({ postcode: val })}
                            placeholder="e.g. B15 2TH"
                            error={errors.postcode}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="delivery_notes" className="text-[0.8rem] text-foreground/75">
                          Doorstep / Access Instructions
                        </Label>
                        <Input
                          id="delivery_notes"
                          value={form.delivery_notes}
                          onChange={(e) => update({ delivery_notes: e.target.value })}
                          placeholder="e.g. Elderly patient, ring doorbell twice, side entrance flat"
                          className="h-11 bg-background"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Medicines & Timing */}
                  {step === 2 && (
                    <div className="space-y-7">
                      <div>
                        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                          Prescription handling & timing
                        </h2>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          Select the required compliance and transport standards.
                        </p>
                      </div>

                      {/* Handling Categories */}
                      <div className="space-y-3">
                        <Label className="text-[0.8rem] text-foreground/80 font-semibold uppercase tracking-wider">
                          Medicine Categories (Select all that apply)
                        </Label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {HANDLING_CATEGORIES.map((cat) => {
                            const isSelected = form.categories.includes(cat.id)
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                className={cn(
                                  'flex items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                                  isSelected
                                    ? 'border-accent bg-accent/8 text-foreground'
                                    : 'border-border bg-card text-muted-foreground hover:border-foreground/20'
                                )}
                              >
                                <span
                                  className={cn(
                                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                                    isSelected
                                      ? 'border-accent bg-accent text-accent-foreground'
                                      : 'border-muted-foreground/40'
                                  )}
                                >
                                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                </span>
                                <span className="text-xs font-medium leading-relaxed">{cat.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormInput
                          id="package_count"
                          label="Total Number of Sealed Bags"
                          type="number"
                          required
                          value={form.package_count}
                          onChange={(val) => update({ package_count: val })}
                          placeholder="1"
                          error={errors.package_count}
                        />

                        <FormInput
                          id="rx_reference"
                          label="Dispensary Rx / Bag Reference"
                          value={form.rx_reference}
                          onChange={(val) => update({ rx_reference: val })}
                          placeholder="e.g. Rx #88219 (Optional)"
                          helper="Printed on your manifest for cross-reconciliation."
                        />
                      </div>

                      {/* Timing options */}
                      <div className="space-y-3 pt-2">
                        <Label className="text-[0.8rem] text-foreground/80 font-semibold uppercase tracking-wider">
                          Collection Timing
                        </Label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {TIMING_OPTIONS.map(({ id, icon: Icon, title, body }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => update({ window_type: id })}
                              className={cn(
                                'flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all',
                                form.window_type === id
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                  : 'border-border bg-card hover:border-foreground/20'
                              )}
                            >
                              <Icon className="mt-0.5 h-4 w-4 text-accent shrink-0" strokeWidth={1.8} />
                              <div>
                                <div className="text-xs font-semibold text-foreground">{title}</div>
                                <div className="text-[0.75rem] text-muted-foreground mt-0.5">{body}</div>
                              </div>
                            </button>
                          ))}
                        </div>

                        {form.window_type === 'scheduled' && (
                          <div className="grid gap-4 sm:grid-cols-2 pt-2">
                            <FormInput
                              id="scheduled_date"
                              type="date"
                              label="Date"
                              required
                              value={form.scheduled_date}
                              onChange={(val) => update({ scheduled_date: val })}
                              error={errors.scheduled_date}
                            />
                            <div className="space-y-2">
                              <Label className="text-[0.8rem] text-foreground/75">Time Slot</Label>
                              <select
                                value={form.time_slot}
                                onChange={(e) => update({ time_slot: e.target.value })}
                                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="">Select a window</option>
                                {TIME_SLOTS.map((slot) => (
                                  <option key={slot} value={slot}>
                                    {slot}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                          Review collection manifest
                        </h2>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          Please verify the collection and delivery handover details.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary/30 p-5 space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-4 border-b border-border/60 pb-3">
                          <div>
                            <span className="text-muted-foreground uppercase font-semibold text-[0.65rem] tracking-wider block">
                              Collecting From
                            </span>
                            <span className="font-bold text-foreground mt-0.5 block">{form.pharmacy_name}</span>
                            <span className="text-muted-foreground block">{form.pickup_address}</span>
                            <span className="text-muted-foreground block">{form.phone}</span>
                          </div>

                          <div>
                            <span className="text-muted-foreground uppercase font-semibold text-[0.65rem] tracking-wider block">
                              Delivering To
                            </span>
                            <span className="font-bold text-foreground mt-0.5 block">{form.patient_name}</span>
                            <span className="text-muted-foreground block">
                              {form.address_line1}, {form.town}, {form.postcode}
                            </span>
                            {form.recipient_phone && (
                              <span className="text-muted-foreground block">{form.recipient_phone}</span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-muted-foreground uppercase font-semibold text-[0.65rem] tracking-wider block">
                              Classification & Packages
                            </span>
                            <span className="font-medium text-foreground mt-0.5 block">
                              {form.package_count} package(s)
                            </span>
                            <span className="text-accent font-semibold block mt-0.5">
                              {form.categories.join(' · ')}
                            </span>
                          </div>

                          <div>
                            <span className="text-muted-foreground uppercase font-semibold text-[0.65rem] tracking-wider block">
                              Window
                            </span>
                            <span className="font-medium text-foreground mt-0.5 block">
                              {TIMING_OPTIONS.find((t) => t.id === form.window_type)?.title || form.window_type}
                            </span>
                            {form.scheduled_date && (
                              <span className="text-muted-foreground block">
                                {form.scheduled_date} {form.time_slot}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Confirmation Checkbox */}
                      <div className="rounded-2xl border border-border bg-card p-5">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            checked={consent}
                            onCheckedChange={(val) => {
                              setConsent(Boolean(val))
                              setErrors({})
                            }}
                            className="mt-0.5"
                          />
                          <span className="text-xs leading-relaxed text-foreground/85 select-none">
                            <strong>Dispensary Declaration:</strong> I confirm that these prescription items have undergone clinical check, are securely packaged with tamper-evident sealing, and are ready for handover at our counter.
                          </span>
                        </label>
                        {errors.consent && (
                          <p className="mt-2 text-xs font-semibold text-destructive">{errors.consent}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {submitError && (
                  <p className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
                    {submitError}
                  </p>
                )}

                {/* Footer Buttons */}
                <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({})
                      setStep((s) => Math.max(s - 1, 0))
                    }}
                    disabled={step === 0}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                    Back
                  </button>

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (validateCurrentStep()) setStep((s) => Math.min(s + 1, 3))
                      }}
                      className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 shadow-sm"
                    >
                      {loading && <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />}
                      {loading ? 'Logging collection…' : 'Confirm & book collection'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar info */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-heading text-[0.95rem] font-semibold text-foreground">
                Dispensary pickup workflow
              </h3>
              <ul className="mt-4 space-y-3.5 text-[0.825rem] leading-relaxed text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[0.7rem] font-bold">1</span>
                  <span>Collection logged & unique <strong>HAYD-XXXXXX</strong> manifest reference issued.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[0.7rem] font-bold">2</span>
                  <span>Courier arrives with validated thermal carrier & handheld scanner for handover.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[0.7rem] font-bold">3</span>
                  <span>Medicines delivered to patient door; signature & POD returned to your pharmacy.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2.5 text-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={1.8} />
                <span className="text-[0.85rem] font-semibold">Regulatory Standards Guaranteed</span>
              </div>
              <p className="mt-3 text-[0.8rem] leading-relaxed text-muted-foreground">
                MHRA-compliant processes, 2°C–8°C continuous thermal validation, DBS-checked uniformed couriers, and zero subcontracting on regulated lines.
              </p>
            </div>

            <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
              <h3 className="font-heading text-[0.95rem] font-semibold">Need an urgent courier within 1 hour?</h3>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-white/70">
                For time-critical hospital discharges or palliative care deliveries, call dispatch directly:
              </p>
              <a
                href="tel:+447761734423"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-white/90"
              >
                <Phone className="h-4 w-4" strokeWidth={2} />
                07761 734423
              </a>
            </div>

            <p className="text-[0.75rem] leading-relaxed text-muted-foreground">
              Already booked?{' '}
              <Link to="/track" className="font-semibold text-foreground underline underline-offset-4">
                Track delivery status
              </Link>{' '}
              using your reference code.
            </p>
          </aside>
        </div>
      </section>
    </>
  )
}
