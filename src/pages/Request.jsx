import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  X,
  Zap,
  Clock3,
  CalendarDays,
  Repeat2,
  Lock,
  ShieldCheck,
  Phone,
  Copy,
  LoaderCircle,
} from 'lucide-react'
import { PageHero } from '@/components/SharedSections'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { storageClient } from '@/lib/storage'
import { cn } from '@/lib/utils'

const STEPS = ['Collection', 'Details', 'Timing', 'Review']
const MAX_FILE_MB = 10

const TIMING_OPTIONS = [
  { id: 'asap', icon: Zap, title: 'As soon as possible', body: 'Within four hours, today.' },
  { id: 'today', icon: Clock3, title: 'Today, in a slot', body: 'Pick a window that suits you.' },
  { id: 'scheduled', icon: CalendarDays, title: 'Choose a date', body: 'Up to 30 days ahead.' },
  { id: 'repeat', icon: Repeat2, title: 'Repeat delivery', body: 'Same day, every cycle.' },
]

const TIME_SLOTS = [
  '09:00 – 12:00',
  '12:00 – 15:00',
  '15:00 – 18:00',
  '18:00 – 20:00',
]

const REPEAT_FREQUENCIES = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'fortnightly', label: 'Fortnightly' },
  { id: 'monthly', label: 'Monthly' },
]

const TIMING_LABELS = {
  asap: 'As soon as possible (within 4 hours)',
  today: 'Today, in a chosen slot',
  scheduled: 'Scheduled date',
  repeat: 'Repeat delivery',
}

const INITIAL_FORM = {
  patient_name: '',
  requester_name: '',
  phone: '',
  email: '',
  address_line1: '',
  address_line2: '',
  town: '',
  postcode: '',
  pharmacy_name: '',
  prescription_notes: '',
  window_type: 'asap',
  scheduled_date: '',
  time_slot: '',
  repeat_frequency: 'monthly',
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

function FormInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  required,
  error,
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="text-[0.8rem] text-foreground/70">
        {label} {required && <span className="text-accent">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 bg-card"
      />
      {error && <p className="text-[0.7rem] font-medium text-destructive">{error}</p>}
    </div>
  )
}

function StepPaperwork({ form, update, file, setFile, error }) {
  const [fileError, setFileError] = useState('')

  const handleFile = (f) => {
    if (f) {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        setFileError(`That file is over ${MAX_FILE_MB} MB. Try a smaller photo or a PDF.`)
        setFile(null)
        return
      }
      setFileError('')
      setFile(f)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.015em] text-foreground">
          Start with the paperwork
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Attach the prescription so the courier knows exactly what is being collected. A clear
          photo is enough — PDFs work too.
        </p>
      </div>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFile(e.dataTransfer.files?.[0])
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/40 px-6 py-12 text-center transition-colors hover:border-accent/60 hover:bg-accent/5"
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {file ? (
          <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left">
            <FileText className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.7} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <button
              type="button"
              aria-label="Remove file"
              onClick={(e) => {
                e.preventDefault()
                setFile(null)
              }}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm">
              <Upload className="h-5 w-5 text-accent" strokeWidth={1.6} />
            </span>
            <span className="mt-4 text-sm font-medium text-foreground">
              Drop the prescription here, or browse
            </span>
            <span className="mt-1.5 text-xs text-muted-foreground">
              JPG, PNG or PDF · up to {MAX_FILE_MB} MB · stored privately
            </span>
          </>
        )}
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pharmacy" className="text-[0.8rem] text-foreground/70">
            Which pharmacy holds it? <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="pharmacy"
            value={form.pharmacy_name}
            onChange={(e) => update({ pharmacy_name: e.target.value })}
            placeholder="e.g. Well Pharmacy, Church Street"
            className="h-11 bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prescription_notes" className="text-[0.8rem] text-foreground/70">
            Anything we should know?
          </Label>
          <Input
            id="prescription_notes"
            value={form.prescription_notes}
            onChange={(e) => update({ prescription_notes: e.target.value })}
            placeholder="e.g. Refrigerated item"
            className="h-11 bg-card"
          />
        </div>
      </div>

      {!file && (
        <p className="rounded-xl bg-secondary/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          No prescription to hand? Continue without one — dispatch will contact you to arrange
          collection from your pharmacy before the delivery goes ahead.
        </p>
      )}

      {fileError && <p className="text-xs font-medium text-destructive">{fileError}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}

function StepDetails({ form, update, errors }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.015em] text-foreground">
          Who is it for, and where?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We only pass these details to the pharmacist checking the order, and to the courier on the
          route.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput
          id="patient_name"
          label="Patient’s full name"
          required
          value={form.patient_name}
          onChange={(val) => update({ patient_name: val })}
          placeholder="As written on the prescription"
          error={errors.patient_name}
        />
        <FormInput
          id="requester_name"
          label="Your name (if different)"
          value={form.requester_name}
          onChange={(val) => update({ requester_name: val })}
          placeholder="You, or the person ordering"
        />
        <FormInput
          id="phone"
          label="Mobile number"
          required
          type="tel"
          value={form.phone}
          onChange={(val) => update({ phone: val })}
          placeholder="For arrival calls and updates"
          error={errors.phone}
        />
        <FormInput
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(val) => update({ email: val })}
          placeholder="For the delivery receipt"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-6">
        <FormInput
          id="address_line1"
          label="Address line 1"
          required
          className="sm:col-span-6"
          value={form.address_line1}
          onChange={(val) => update({ address_line1: val })}
          placeholder="House number and street"
          error={errors.address_line1}
        />
        <FormInput
          id="address_line2"
          label="Address line 2"
          className="sm:col-span-6"
          value={form.address_line2}
          onChange={(val) => update({ address_line2: val })}
          placeholder="Flat, building or access notes"
        />
        <FormInput
          id="town"
          label="Town or city"
          className="sm:col-span-3"
          value={form.town}
          onChange={(val) => update({ town: val })}
          placeholder="e.g. Birmingham"
        />
        <FormInput
          id="postcode"
          label="Postcode"
          required
          className="sm:col-span-3"
          value={form.postcode}
          onChange={(val) => update({ postcode: val.toUpperCase() })}
          placeholder="e.g. B3 2BS"
          error={errors.postcode}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-[0.8rem] text-foreground/70">
          Delivery notes
        </Label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Buzzer code, safe place, who may sign, or call ahead instructions."
          className="w-full rounded-xl border border-input bg-card px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </div>
    </div>
  )
}

function StepTiming({ form, update, errors }) {
  const showSlots = form.window_type === 'today' || form.window_type === 'scheduled'

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.015em] text-foreground">
          When should it arrive?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Requests confirmed before 4pm are delivered the same day.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {TIMING_OPTIONS.map(({ id, icon: Icon, title, body }) => {
          const selected = form.window_type === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => update({ window_type: id })}
              className={cn(
                'flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200',
                selected
                  ? 'border-primary bg-primary text-primary-foreground shadow-lift'
                  : 'border-border bg-card hover:border-foreground/25'
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={1.7} />
              <span>
                <span className="block font-heading text-[0.95rem] font-semibold tracking-[-0.01em]">
                  {title}
                </span>
                <span
                  className={cn(
                    'mt-1 block text-[0.8rem]',
                    selected ? 'text-white/60' : 'text-muted-foreground'
                  )}
                >
                  {body}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {errors.window_type && (
        <p className="text-xs font-medium text-destructive">{errors.window_type}</p>
      )}

      {form.window_type === 'scheduled' && (
        <div className="space-y-2">
          <Label htmlFor="date" className="text-[0.8rem] font-medium text-foreground/70">
            Preferred date
          </Label>
          <Input
            id="date"
            type="date"
            value={form.scheduled_date}
            onChange={(e) => update({ scheduled_date: e.target.value })}
            className="h-11 max-w-xs bg-card"
          />
          {errors.scheduled_date && (
            <p className="text-xs font-medium text-destructive">{errors.scheduled_date}</p>
          )}
        </div>
      )}

      {showSlots && (
        <div>
          <p className="text-[0.8rem] font-medium text-foreground/70">Preferred window</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => update({ time_slot: slot })}
                className={cn(
                  'rounded-full border px-4 py-2.5 text-[0.8rem] font-medium transition-colors',
                  form.time_slot === slot
                    ? 'border-accent bg-accent/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground'
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {form.window_type === 'repeat' && (
        <div>
          <p className="text-[0.8rem] font-medium text-foreground/70">How often?</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {REPEAT_FREQUENCIES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => update({ repeat_frequency: id })}
                className={cn(
                  'rounded-full border px-4 py-2.5 text-[0.8rem] font-medium transition-colors',
                  form.repeat_frequency === id
                    ? 'border-accent bg-accent/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.repeat_frequency && (
            <p className="mt-2 text-xs font-medium text-destructive">{errors.repeat_frequency}</p>
          )}
        </div>
      )}
    </div>
  )
}

function StepReview({ form, file, consent, setConsent, errors }) {
  const summaryRows = [
    ['Patient', form.patient_name],
    ['Requested by', form.requester_name || '—'],
    ['Contact', [form.phone, form.email].filter(Boolean).join(' · ') || '—'],
    [
      'Deliver to',
      [form.address_line1, form.address_line2, form.town, form.postcode]
        .filter(Boolean)
        .join(', '),
    ],
    ['Pharmacy', form.pharmacy_name || 'To be confirmed with dispatch'],
    [
      'Timing',
      [
        TIMING_LABELS[form.window_type],
        form.window_type === 'scheduled' ? form.scheduled_date : '',
        form.time_slot,
        form.window_type === 'repeat' ? form.repeat_frequency : '',
      ]
        .filter(Boolean)
        .join(' · '),
    ],
    ['Notes', form.notes || '—'],
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.015em] text-foreground">
          Check everything is right
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A pharmacist reviews the request before any medicine leaves the pharmacy.
        </p>
      </div>

      <dl className="divide-y divide-border rounded-2xl border border-border bg-card">
        {summaryRows.map(([label, val]) => (
          <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="text-[0.75rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {label}
            </dt>
            <dd className="text-sm leading-relaxed text-foreground">{val || '—'}</dd>
          </div>
        ))}
        <div className="flex items-center gap-3 px-5 py-4">
          <dt className="text-[0.75rem] font-medium uppercase tracking-[0.1em] text-muted-foreground sm:min-w-[9rem]">
            Prescription
          </dt>
          <dd className="flex items-center gap-2 text-sm text-foreground">
            <FileText className="h-4 w-4 text-accent" strokeWidth={1.7} />
            {file ? file.name : 'Not uploaded — dispatch will arrange collection'}
          </dd>
        </div>
      </dl>

      <div className="flex items-start gap-3 rounded-2xl bg-secondary/60 p-5">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={setConsent}
          className="mt-0.5"
        />
        <label
          htmlFor="consent"
          className="cursor-pointer text-[0.8rem] leading-relaxed text-muted-foreground"
        >
          I confirm this request is for a valid UK prescription held for the named patient, and I
          consent to HAYD processing these details to arrange and deliver it.
        </label>
      </div>
      {errors.consent && (
        <p className="text-xs font-medium text-destructive">{errors.consent}</p>
      )}
    </div>
  )
}

function ConfirmationScreen({ reference, onReset }) {
  const [copied, setCopied] = useState(false)

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/12">
        <Check className="h-5 w-5 text-accent" strokeWidth={2.4} />
      </span>
      <h2 className="mt-6 text-[clamp(1.6rem,3vw,2.15rem)] font-semibold leading-tight tracking-[-0.03em] text-foreground">
        Request received
      </h2>
      <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
        Dispatch will confirm your delivery window by phone or text shortly. Keep this reference
        safe — it is the only thing you need to track the delivery.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl bg-primary px-5 py-4">
        <span className="font-mono text-lg tracking-[0.14em] text-white">{reference}</span>
        <button
          type="button"
          onClick={copyRef}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/25 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:border-white hover:bg-white/10"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          to="/track"
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Track this delivery
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Send another request
        </button>
      </div>
    </div>
  )
}

export default function Request() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL_FORM)
  const [file, setFile] = useState(null)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [reference, setReference] = useState('')

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const validateCurrentStep = () => {
    const errs = {}
    if (step === 1) {
      if (!form.patient_name.trim()) errs.patient_name = 'Please add the patient’s name.'
      if (!form.phone.trim()) errs.phone = 'We need a number to arrange delivery.'
      if (!form.address_line1.trim()) errs.address_line1 = 'Please add the delivery address.'
      if (!form.postcode.trim()) errs.postcode = 'Please add the postcode.'
    }
    if (step === 2) {
      if (!form.window_type) errs.window_type = 'Choose a delivery window.'
      if (form.window_type === 'scheduled' && !form.scheduled_date)
        errs.scheduled_date = 'Pick the date you would like it delivered.'
      if (form.window_type === 'repeat' && !form.repeat_frequency)
        errs.repeat_frequency = 'Choose how often it should repeat.'
    }
    if (step === 3 && !consent) {
      errs.consent = 'Please confirm before sending.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return
    setLoading(true)
    setSubmitError('')
    const ref = generateReference()

    try {
      let fileUri = ''
      if (file) {
        const uploadRes = await storageClient.integrations.Core.UploadPrivateFile({ file })
        fileUri = uploadRes?.file_uri || ''
      }

      await storageClient.entities.DeliveryRequest.create({
        reference: ref,
        patient_name: form.patient_name,
        requester_name: form.requester_name,
        phone: form.phone,
        email: form.email,
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        town: form.town,
        postcode: form.postcode,
        pharmacy_name: form.pharmacy_name,
        prescription_file: fileUri,
        prescription_notes: form.prescription_notes,
        window_type: form.window_type,
        scheduled_date: form.window_type === 'scheduled' ? form.scheduled_date : '',
        time_slot: form.time_slot,
        repeat_frequency: form.window_type === 'repeat' ? form.repeat_frequency : '',
        notes: form.notes,
        consent: true,
        status: 'received',
      })

      await storageClient.entities.TrackStatus.create({
        reference: ref,
        status: 'received',
        town: form.town,
        note: 'Request received. A pharmacist is checking your prescription.',
      })

      setReference(ref)
    } catch {
      setSubmitError(
        'Something went wrong sending your request. Please try again, or call dispatch on 07761 734423.'
      )
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setFile(null)
    setConsent(false)
    setErrors({})
    setReference('')
    setStep(0)
  }

  return (
    <>
      <PageHero
        eyebrow="Book a collection"
        title="A confirmed collection in four steps"
        intro="For pharmacies and the patients they look after. Tell us what is moving, where it is collected and when it needs to arrive — dispatch confirms the window, usually within fifteen minutes."
      />

      <section className="bg-background py-14 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.55fr_1fr] lg:gap-16">
          <div>
            {reference ? (
              <ConfirmationScreen reference={reference} onReset={resetForm} />
            ) : (
              <div className="rounded-3xl border border-border bg-card p-6 md:p-10">
                <StepBar currentStep={step} />

                <div className="mt-10">
                  {step === 0 && (
                    <StepPaperwork
                      form={form}
                      update={update}
                      file={file}
                      setFile={setFile}
                      error={errors.prescription}
                    />
                  )}
                  {step === 1 && <StepDetails form={form} update={update} errors={errors} />}
                  {step === 2 && <StepTiming form={form} update={update} errors={errors} />}
                  {step === 3 && (
                    <StepReview
                      form={form}
                      file={file}
                      consent={consent}
                      setConsent={setConsent}
                      errors={errors}
                    />
                  )}
                </div>

                {submitError && (
                  <p className="mt-6 rounded-xl bg-destructive/8 px-4 py-3 text-xs font-medium text-destructive">
                    {submitError}
                  </p>
                )}

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
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      {loading && <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />}
                      {loading ? 'Sending…' : 'Send request'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-heading text-[0.95rem] font-semibold text-foreground">
                What happens next
              </h3>
              <ul className="mt-4 space-y-3.5 text-[0.85rem] leading-relaxed text-muted-foreground">
                <li>We confirm your window by text or phone — usually within 15 minutes.</li>
                <li>A pharmacist verifies the prescription at the counter.</li>
                <li>Your courier collects, signs the chain of custody and calls before arrival.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2.5 text-foreground">
                <Lock className="h-4 w-4 text-accent" strokeWidth={1.7} />
                <span className="text-[0.85rem] font-semibold">Your data stays private</span>
              </div>
              <p className="mt-3 text-[0.8rem] leading-relaxed text-muted-foreground">
                Prescriptions are stored privately and deleted after delivery plus the retention
                period. Only the pharmacist and assigned courier can open them.
              </p>
              <div className="mt-4 flex items-center gap-2.5 text-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={1.7} />
                <span className="text-[0.85rem] font-semibold">Insured, tracked, signed for</span>
              </div>
            </div>

            <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
              <h3 className="font-heading text-[0.95rem] font-semibold">Need it within the hour?</h3>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-white/60">
                For urgent or controlled prescriptions, call dispatch so we can assign a courier
                before you submit.
              </p>
              <a
                href="tel:+447761734423"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white"
              >
                <Phone className="h-4 w-4" strokeWidth={1.8} />
                07761 734423
              </a>
            </div>

            <p className="text-[0.75rem] leading-relaxed text-muted-foreground">
              Already submitted?{' '}
              <Link to="/track" className="font-medium text-foreground underline underline-offset-4">
                Track your delivery
              </Link>{' '}
              with your HAYD reference.
            </p>
          </aside>
        </div>
      </section>
    </>
  )
}

