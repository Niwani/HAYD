import React from 'react'
import { PageHero } from '@/components/SharedSections'

const TERMS_SECTIONS = [
  {
    title: 'What HAYD is',
    body: 'HAYD is a prescription collection and delivery service. We are not a pharmacy and we do not provide medical advice. All clinical decisions, dispensing and labelling are carried out by a registered pharmacy.',
  },
  {
    title: 'Eligibility',
    body: 'You may request a delivery if you hold a valid UK prescription for the named patient, or if you are acting on that patient’s behalf with their consent. You must be 18 or over to place a request.',
  },
  {
    title: 'Placing a request',
    body: 'A request is an offer, not a confirmed booking. Dispatch confirms the delivery window by phone or text. A delivery is confirmed only once you receive a reference and a window.',
  },
  {
    title: 'Delivery windows',
    body: 'Same-day deliveries are aimed at four hours from confirmation. Traffic, pharmacy delays and severe weather can affect this. We contact you if a route slips and offer the next available window.',
  },
  {
    title: 'Handover',
    body: 'Medicines are handed to a person at the delivery address. We may ask for a signature, photo proof of delivery or photo ID, and for controlled medicines the named patient must sign. Medicines are never left unattended.',
  },
  {
    title: 'If nobody is available',
    body: 'The courier will call on arrival and wait briefly. If there is no answer, we attempt one redelivery free of charge. After that the medicine returns to the pharmacy and a return fee may apply.',
  },
  {
    title: 'Controlled and refrigerated medicines',
    body: 'Some items need additional checks and must be arranged by phone. Refrigerated items travel in insulated carriers with a temperature logger; if the cold chain cannot be maintained, we do not deliver and the item returns to the pharmacy.',
  },
  {
    title: 'Fees',
    body: 'The delivery fee is confirmed before dispatch. We do not charge until the window is agreed. Pharmacies and account customers are invoiced monthly under a separate agreement.',
  },
  {
    title: 'Cancellation',
    body: 'You can cancel free of charge before a courier collects the prescription. After collection, a fee covering the route may apply.',
  },
  {
    title: 'Liability',
    body: 'We hold goods-in-transit insurance for the value of the goods in our care. We are not liable for clinical outcomes, dispensing errors or losses caused by information supplied incorrectly at the time of request.',
  },
]

export default function Terms() {
  return (
    <>
      <PageHero
        eyebrow="Terms"
        title="Service terms"
        intro="The practical rules of using HAYD — written to be read once, not skimmed by a lawyer."
      />

      <section className="bg-background py-14 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
              Last updated 5 November 2026. These terms apply to every delivery requested through
              this website. Questions? Email{' '}
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
            {TERMS_SECTIONS.map((sec, idx) => (
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

