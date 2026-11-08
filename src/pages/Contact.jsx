import React, { useState } from 'react'
import { Phone, Mail, Clock3, ShieldAlert, Check, LoaderCircle, MapPin } from 'lucide-react'
import { PageHero } from '@/components/SharedSections'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { storageClient } from '@/lib/storage'
import { cn } from '@/lib/utils'

const ENQUIRY_TYPES = [
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'patient', label: 'Patient or carer' },
  { id: 'existing_delivery', label: 'An existing collection' },
  { id: 'other', label: 'Something else' },
]

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    enquiry_type: 'pharmacy',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Please add your name.'
    if (!form.email.trim()) errs.email = 'We need an email to reply to.'
    if (!form.message.trim()) errs.message = 'Tell us a little about your enquiry.'
    setErrors(errs)

    if (Object.keys(errs).length === 0) {
      setLoading(true)
      setServerError('')
      try {
        await storageClient.entities.ContactMessage.create(form)
        setSent(true)
      } catch {
        setServerError('We could not send that just now. Please call dispatch on 07761 734423.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="A real person, on the first ring"
        intro="Partnerships and dispatch answer between 8am and 8pm, Monday to Saturday. Partner pharmacies can ask for the onboarding pack — for anything urgent, call rather than write."
      />

      <section className="bg-background py-14 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="space-y-4">
            <a
              href="tel:+447761734423"
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Phone className="h-4 w-4 text-accent" strokeWidth={1.7} />
              </span>
              <span>
                <span className="label-caps block text-muted-foreground">Dispatch</span>
                <span className="mt-1.5 block font-heading text-lg font-semibold text-foreground">
                  07761 734423
                </span>
                <span className="mt-1 block text-[0.8rem] text-muted-foreground">
                  Fastest route for same-day and urgent requests.
                </span>
              </span>
            </a>

            <a
              href="mailto:healthatyourdoor.co@gmail.com"
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Mail className="h-4 w-4 text-accent" strokeWidth={1.7} />
              </span>
              <span>
                <span className="label-caps block text-muted-foreground">Email</span>
                <span className="mt-1.5 block font-heading text-lg font-semibold text-foreground">
                  healthatyourdoor.co@gmail.com
                </span>
                <span className="mt-1 block text-[0.8rem] text-muted-foreground">
                  Partner pharmacies: ask for the onboarding pack.
                </span>
              </span>
            </a>

            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <MapPin className="h-4 w-4 text-accent" strokeWidth={1.7} />
              </span>
              <span>
                <span className="label-caps block text-muted-foreground">Office</span>
                <span className="mt-1.5 block text-sm font-medium text-foreground">
                  Osbourne Suite, 2.08 Imperial and Whitehall
                </span>
                <span className="mt-0.5 block text-sm text-foreground/80">
                  23 Colmore Row, Birmingham, B3 2BS
                </span>
              </span>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Clock3 className="h-4 w-4 text-accent" strokeWidth={1.7} />
              </span>
              <span>
                <span className="label-caps block text-muted-foreground">Hours</span>
                <span className="mt-1.5 block text-sm font-medium text-foreground">
                  Monday–Saturday, 8am–8pm
                </span>
                <span className="mt-1 block text-[0.8rem] text-muted-foreground">
                  Same-day cut-off is 4pm. Sunday: urgent deliveries by arrangement.
                </span>
              </span>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-[hsl(var(--signal))]/8 p-5">
              <ShieldAlert
                className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--signal))]"
                strokeWidth={1.8}
              />
              <p className="text-[0.8rem] leading-relaxed text-foreground/75">
                <span className="font-semibold text-foreground">Medical emergency?</span> Call 999.
                HAYD does not provide medical advice — for anything clinical, contact your GP,
                pharmacist or NHS 111.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 md:p-9">
            {sent ? (
              <div className="flex h-full flex-col justify-center py-10 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/12">
                  <Check className="h-5 w-5 text-accent" strokeWidth={2.4} />
                </span>
                <h2 className="mt-5 font-heading text-xl font-semibold tracking-[-0.02em] text-foreground">
                  Message sent
                </h2>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Dispatch will reply within one working hour. For anything time-critical, please
                  call 07761 734423.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="font-heading text-lg font-semibold tracking-[-0.015em] text-foreground">
                    Send a message
                  </h2>
                  <p className="mt-1.5 text-[0.85rem] text-muted-foreground">
                    We reply within one working hour.
                  </p>
                </div>

                <div>
                  <p className="text-[0.75rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                    I am…
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {ENQUIRY_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => update({ enquiry_type: type.id })}
                        className={cn(
                          'rounded-full border px-3.5 py-2 text-[0.78rem] font-medium transition-colors',
                          form.enquiry_type === type.id
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground'
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[0.8rem] text-foreground/70">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => update({ name: e.target.value })}
                      className="h-11 bg-background"
                      placeholder="Your name"
                    />
                    {errors.name && (
                      <p className="text-[0.7rem] font-medium text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[0.8rem] text-foreground/70">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => update({ phone: e.target.value })}
                      className="h-11 bg-background"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[0.8rem] text-foreground/70">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update({ email: e.target.value })}
                    className="h-11 bg-background"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-[0.7rem] font-medium text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-[0.8rem] text-foreground/70">
                    Message
                  </Label>
                  <textarea
                    id="message"
                    rows={5}
                    value={form.message}
                    onChange={(e) => update({ message: e.target.value })}
                    placeholder="Tell us about the prescription, the delivery or the partnership you have in mind."
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {errors.message && (
                    <p className="text-[0.7rem] font-medium text-destructive">{errors.message}</p>
                  )}
                </div>

                {serverError && (
                  <p className="rounded-xl bg-destructive/8 px-4 py-3 text-xs font-medium text-destructive">
                    {serverError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading && <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />}
                  {loading ? 'Sending…' : 'Send message'}
                </button>

                <p className="text-center text-[0.7rem] leading-relaxed text-muted-foreground">
                  Please do not include clinical details in this form — send those with your
                  prescription.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

