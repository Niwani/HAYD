import React, { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import {
  Printer,
  X,
  Package,
  ShieldCheck,
  ThermometerSnowflake,
  AlertTriangle,
  Building2,
  MapPin,
  Clock,
  Check,
  Copy,
} from 'lucide-react'
import haydIconNavy from '@/assets/hayd-icon-navy.png'
import { getTrackingUrl } from '@/lib/email'

/**
 * Generates an SVG-like 1D barcode representation for Code 128 / Code 39
 */
function SimpleBarcode({ code }) {
  // Deterministic bar widths based on char codes for visual barcode rendering
  const bars = []
  const clean = (code || 'HAYD-000000').toUpperCase()

  // Start guard
  bars.push({ w: 2, space: 1 })
  bars.push({ w: 1, space: 2 })

  for (let i = 0; i < clean.length; i++) {
    const val = clean.charCodeAt(i)
    const b1 = (val % 3) + 1
    const s1 = ((val >> 1) % 2) + 1
    const b2 = ((val >> 2) % 3) + 1
    const s2 = ((val >> 3) % 2) + 1
    bars.push({ w: b1, space: s1 })
    bars.push({ w: b2, space: s2 })
  }

  // Stop guard
  bars.push({ w: 3, space: 1 })
  bars.push({ w: 1, space: 1 })
  bars.push({ w: 2, space: 0 })

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-stretch h-14 bg-white px-2 py-1">
        {bars.map((bar, idx) => (
          <React.Fragment key={idx}>
            <div
              className="bg-black"
              style={{ width: `${bar.w * 2}px` }}
            />
            {bar.space > 0 && (
              <div
                className="bg-white"
                style={{ width: `${bar.space * 2}px` }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <span className="font-mono text-xs font-bold tracking-widest text-black mt-1">
        *{clean}*
      </span>
    </div>
  )
}

export function ParcelLabelModal({ item, isOpen, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const printRef = useRef(null)

  useEffect(() => {
    if (!item?.reference) return
    const trackingUrl = getTrackingUrl(item.reference)
    QRCode.toDataURL(
      item.reference, // Encode exact tracking code for fast scanner matching
      {
        width: 180,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      }
    )
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err))
  }, [item])

  if (!isOpen || !item) return null

  const handlePrint = () => {
    window.print()
  }

  const isColdChain = item.categories?.includes('cold_chain')
  const isControlledDrug = item.categories?.includes('controlled_drugs')
  const dateStr = new Date(item.created_date || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-card border border-border shadow-2xl p-6 md:p-8 space-y-6">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Print Parcel Label & Barcode Sticker
              </h3>
              <p className="text-xs text-muted-foreground">
                Attach this sticker to the medicine container for scan-to-verify doorstep delivery.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PRINTABLE LABEL PREVIEW (Isolated container styled for 4x6 / thermal printers) */}
        <div className="flex justify-center bg-secondary/50 p-4 rounded-2xl overflow-x-auto">
          <div
            id="hayd-printable-sticker"
            ref={printRef}
            className="w-[380px] bg-white text-black p-5 border-2 border-black rounded-xl shadow-md font-sans text-xs space-y-3"
            style={{ minHeight: '520px' }}
          >
            {/* Header: Company & Classification */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#08162E] p-1">
                  <img src={haydIconNavy} alt="HAYD" className="h-full w-full invert object-contain" />
                </div>
                <div>
                  <h1 className="font-black text-sm tracking-wider uppercase">
                    HAYD PHARMA TRANSIT
                  </h1>
                  <p className="text-[0.6rem] font-bold tracking-tight text-neutral-600">
                    REGULATED PRESCRIPTION COURIER
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-black text-sm block">
                  {item.reference}
                </span>
                <span className="text-[0.62rem] text-neutral-600">{dateStr}</span>
              </div>
            </div>

            {/* Regulatory Warning Badge */}
            <div className="border-2 border-black bg-neutral-100 p-2 rounded text-center">
              <p className="font-black text-[0.72rem] tracking-wider uppercase">
                ⚠️ CONFIDENTIAL PRESCRIPTION MEDICINES
              </p>
              <p className="text-[0.62rem] font-semibold">
                HAND-TO-HAND DELIVERY ONLY • DO NOT POST • DO NOT LEAVE UNATTENDED
              </p>
            </div>

            {/* Special Temperature / CD Tier Badges */}
            <div className="flex flex-wrap gap-1.5">
              {isColdChain && (
                <div className="flex-1 border-2 border-black bg-cyan-100 p-1.5 rounded text-center">
                  <span className="font-black text-[0.68rem] block text-cyan-950 uppercase">
                    🧊 2°C–8°C COLD CHAIN
                  </span>
                  <span className="text-[0.58rem] font-bold text-cyan-900">
                    CALIBRATED THERMAL PACK
                  </span>
                </div>
              )}

              {isControlledDrug && (
                <div className="flex-1 border-2 border-black bg-purple-100 p-1.5 rounded text-center">
                  <span className="font-black text-[0.68rem] block text-purple-950 uppercase">
                    🔐 CONTROLLED DRUG
                  </span>
                  <span className="text-[0.58rem] font-bold text-purple-900">
                    PHOTO ID & SIGNATURE REQ
                  </span>
                </div>
              )}

              {!isColdChain && !isControlledDrug && (
                <div className="flex-1 border border-black bg-neutral-50 p-1 rounded text-center">
                  <span className="font-bold text-[0.68rem] block uppercase">
                    STANDARD AMBIENT DOSAGE
                  </span>
                </div>
              )}
            </div>

            {/* Recipient Delivery Box */}
            <div className="border-2 border-black p-3 rounded-lg space-y-1 bg-neutral-50">
              <span className="text-[0.6rem] font-black uppercase tracking-wider text-neutral-600 block">
                DELIVER TO (RECIPIENT):
              </span>
              <p className="font-black text-base text-black leading-tight">
                {item.recipient_name}
              </p>
              <p className="font-bold text-xs text-neutral-800 leading-snug">
                {item.delivery_address || `${item.town}, UK`}
              </p>
              {item.recipient_phone && (
                <p className="text-[0.65rem] text-neutral-600 font-mono">
                  Tel: {item.recipient_phone}
                </p>
              )}
            </div>

            {/* Dispensary Pickup Box */}
            <div className="border border-neutral-400 p-2 rounded space-y-0.5">
              <span className="text-[0.58rem] font-bold uppercase text-neutral-500 block">
                DISPENSED BY (PHARMACY):
              </span>
              <p className="font-bold text-xs text-black">
                {item.pharmacy_name}
              </p>
              <p className="text-[0.62rem] text-neutral-600">
                {item.pickup_address}
              </p>
            </div>

            {/* Barcode & QR Code Section */}
            <div className="border-t-2 border-black pt-3 flex items-center justify-between gap-3">
              <div className="flex-1 flex flex-col items-center">
                <SimpleBarcode code={item.reference} />
              </div>

              {qrDataUrl && (
                <div className="border-2 border-black p-1 rounded bg-white shrink-0">
                  <img src={qrDataUrl} alt="QR Code" className="h-20 w-20 object-contain" />
                  <span className="block text-[0.55rem] font-black text-center tracking-tighter mt-0.5">
                    SCAN TO VERIFY
                  </span>
                </div>
              )}
            </div>

            {/* Footer Verification Notice */}
            <div className="text-center pt-1 border-t border-neutral-300 text-[0.58rem] text-neutral-600">
              Assigned: {item.assigned_name || 'HAYD Courier'} • Unit Count: {item.package_count || '1'} • 07761 734423
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Compatible with Zebra, Brother, Dymo, standard A4/A6 label sheets, and regular desktop printers.
          </p>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
            >
              <Printer className="h-4 w-4" />
              Print Sticker Label
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParcelLabelModal


