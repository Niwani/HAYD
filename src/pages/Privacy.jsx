import React from 'react'
import { PageHero } from '@/components/SharedSections'

const PRIVACY_SECTIONS = [
  {
    title: 'Who we are',
    body: 'HAYD (“Health At Your Door”) is a prescription collection and delivery service registered in England and Wales. We act as a logistics provider: we do not dispense, prescribe or give clinical advice.',
  },
  {
    title: 'What we collect',
    body: 'To arrange a delivery we collect the patient name, your contact details, the delivery address, the pharmacy holding the prescription, and the prescription itself. We also keep a record of each delivery, including handover time and signature.',
  },
  {
    title: 'How prescriptions are stored',
    body: 'Uploaded prescriptions are held in private storage with access limited to the pharmacist verifying the request and the courier assigned to the delivery. Files are deleted once the delivery is complete and the pharmacy’s retention period has passed.',
  },
  {
    title: 'Why we process it',
    body: 'We process your details to verify the prescription, deliver it to the correct address, contact you about the delivery, and keep the records required for medical logistics. We do not sell data or use it for advertising.',
  },
  {
    title: 'Who we share it with',
    body: 'The pharmacy fulfilling the prescription, the courier on your route, and — where required by law — the relevant regulatory authority. Couriers see the delivery address, contact number and the handling requirements of the parcel, not your clinical history.',
  },
  {
    title: 'How long we keep it',
    body: 'Delivery records are kept for the period required by our insurers and pharmacy partners. Contact enquiries are kept for twelve months. You can ask us to delete anything that is not legally required sooner.',
  },
  {
    title: 'Your rights',
    body: 'Under UK GDPR you can request a copy of your data, ask us to correct or delete it, or object to processing. Email healthatyourdoor.co@gmail.com and we will respond within one month. You can also complain to the Information Commissioner’s Office.',
  },
  {
    title: 'Cookies',
    body: 'This website uses only the storage needed to keep the site working. We do not set advertising cookies.',
  },
]

export default function Privacy() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="Privacy notice"
        intro="Prescription data is among the most sensitive information you can share. Here is exactly what we hold, why, and for how long."
      />

      <section className="bg-background py-14 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
              Last updated 5 November 2026. Questions about this notice? Email{' '}
              <a
                href="mailto:healthatyourdoor.co@gmail.com"
                className="font-medium text-foreground underline underline-offset-4"
              >
                healthatyourdoor.co@gmail.com
              </a>
              .
            </p>
          </div>

          <div className="space-y-10">
            {PRIVACY_SECTIONS.map((sec, idx) => (
              <article key={sec.title}>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[0.7rem] tracking-[0.16em] text-accent">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-heading text-lg font-semibold tracking-[-0.015em] text-foreground">
                    {sec.title}
                  </h2>
                </div>
                <p className="mt-3 pl-9 text-[0.925rem] leading-relaxed text-muted-foreground">
                  {sec.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

