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
 * Standard Code 39 barcode encoding table (ISO/IEC 16388)
 * 9 elements per char: 5 bars, 4 spaces. 1 = wide, 0 = narrow.
 */
const CODE39_MAP = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
}

/**
 * Renders an ISO-compliant Code 39 barcode using pure vector SVG rects.
 * SVG fills are guaranteed to print dark black without relying on browser CSS background settings.
 */
function VectorCode39Barcode({ code }) {
  const clean = (code || 'HAYD-000000').toUpperCase().replace(/[^0-9A-Z\-\. \$\/\+\%]/g, '')
  const full = `*${clean}*`

  const narrow = 1.6
  const wide = 3.6
  const gap = 1.6
  const barHeight = 44

  const rects = []
  let currentX = 8 // Left quiet zone

  for (let i = 0; i < full.length; i++) {
    const ch = full[i]
    const pattern = CODE39_MAP[ch] || CODE39_MAP['-']

    for (let b = 0; b < pattern.length; b++) {
      const bit = pattern[b]
      const isBar = (b % 2 === 0)
      const width = (bit === '1') ? wide : narrow

      if (isBar) {
        rects.push(
          <rect
            key={`${i}-${b}`}
            x={currentX}
            y="0"
            width={width}
            height={barHeight}
            fill="#000000"
          />
        )
      }
      currentX += width
    }
    // Inter-character narrow space gap
    currentX += gap
  }

  currentX += 8 // Right quiet zone
  const totalWidth = Math.ceil(currentX)

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <svg
        viewBox={`0 0 ${totalWidth} ${barHeight}`}
        style={{
          width: '100%',
          maxWidth: '250px',
          height: '44px',
          shapeRendering: 'crispEdges',
          display: 'block',
        }}
      >
        {rects}
      </svg>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          color: '#000000',
          marginTop: '3px',
          display: 'block',
        }}
      >
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
    QRCode.toDataURL(
      item.reference, // Encode exact tracking code for fast scanner matching
      {
        width: 160,
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

  /**
   * Hidden Iframe Print Engine:
   * Isolates ONLY the sticker element into an independent iframe.
   * Eliminates all background app bleed-through, modal overlays, and 3-page repetitions.
   */
  const handlePrint = () => {
    const printElem = document.getElementById('hayd-printable-sticker')
    if (!printElem) return

    // Clean up any stale iframe
    const oldFrame = document.getElementById('hayd-print-frame')
    if (oldFrame) {
      oldFrame.remove()
    }

    const iframe = document.createElement('iframe')
    iframe.id = 'hayd-print-frame'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.visibility = 'hidden'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>HAYD-Sticker-${item.reference}</title>
          <style>
            @page {
              size: auto;
              margin: 4mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .print-page-wrapper {
              width: 100%;
              max-width: 360px;
              margin: 0 auto;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
            }
            svg {
              shape-rendering: crispEdges !important;
            }
          </style>
        </head>
        <body>
          <div class="print-page-wrapper">
            ${printElem.outerHTML}
          </div>
        </body>
      </html>
    `)
    doc.close()

    setTimeout(() => {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      } catch (err) {
        console.error('Iframe print error, falling back to window.print():', err)
        window.print()
      }
    }, 250)
  }

  const isColdChain = item.categories?.includes('cold_chain')
  const isControlledDrug = item.categories?.includes('controlled_drugs')
  const dateStr = new Date(item.created_date || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto animate-in fade-in">
      {/* Fallback CSS if user presses Ctrl+P while modal is mounted */}
      <style>{`
        @media print {
          body > *:not(#hayd-print-frame) {
            display: none !important;
          }
        }
      `}</style>

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
                Single-page 4"x6" / thermal printable sticker for doorstep scan verification.
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

        {/* PRINTABLE LABEL PREVIEW (Single 1-page container styled for 4x6 / thermal printers) */}
        <div className="flex justify-center bg-secondary/40 p-4 rounded-2xl overflow-x-auto">
          <div
            id="hayd-printable-sticker"
            ref={printRef}
            style={{
              width: '360px',
              maxWidth: '100%',
              backgroundColor: '#ffffff',
              color: '#000000',
              padding: '14px',
              border: '2px solid #000000',
              borderRadius: '8px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '11px',
              lineHeight: '1.3',
              boxSizing: 'border-box',
            }}
          >
            {/* Header: Company & Classification */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'between',
                borderBottom: '2px solid #000000',
                paddingBottom: '8px',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    backgroundColor: '#08162E',
                    padding: '3px',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={haydIconNavy}
                    alt="HAYD"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'brightness(0) invert(1)',
                    }}
                  />
                </div>
                <div>
                  <h1
                    style={{
                      margin: 0,
                      fontWeight: 900,
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      color: '#000000',
                    }}
                  >
                    HAYD PHARMA TRANSIT
                  </h1>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#444444',
                    }}
                  >
                    REGULATED PRESCRIPTION COURIER
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 900,
                    fontSize: '13px',
                    display: 'block',
                    color: '#000000',
                  }}
                >
                  {item.reference}
                </span>
                <span style={{ fontSize: '9px', color: '#555555' }}>{dateStr}</span>
              </div>
            </div>

            {/* Regulatory Warning Badge */}
            <div
              style={{
                border: '1.5px solid #000000',
                backgroundColor: '#f5f5f5',
                padding: '6px 8px',
                borderRadius: '5px',
                textAlign: 'center',
                marginBottom: '8px',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 900,
                  fontSize: '10px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                ⚠️ CONFIDENTIAL PRESCRIPTION MEDICINES
              </p>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '8.5px',
                  fontWeight: 600,
                  color: '#333333',
                }}
              >
                HAND-TO-HAND DELIVERY ONLY • DO NOT LEAVE UNATTENDED
              </p>
            </div>

            {/* Special Temperature / CD Tier Badges */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {isColdChain && (
                <div
                  style={{
                    flex: 1,
                    border: '1.5px solid #000000',
                    backgroundColor: '#e0f7fa',
                    padding: '5px',
                    borderRadius: '4px',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: '9.5px',
                      display: 'block',
                      color: '#006064',
                      textTransform: 'uppercase',
                    }}
                  >
                    🧊 2°C–8°C COLD CHAIN
                  </span>
                  <span style={{ fontSize: '8px', fontWeight: 700, color: '#004d40' }}>
                    CALIBRATED THERMAL PACK
                  </span>
                </div>
              )}

              {isControlledDrug && (
                <div
                  style={{
                    flex: 1,
                    border: '1.5px solid #000000',
                    backgroundColor: '#f3e5f5',
                    padding: '5px',
                    borderRadius: '4px',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: '9.5px',
                      display: 'block',
                      color: '#4a148c',
                      textTransform: 'uppercase',
                    }}
                  >
                    🔐 CONTROLLED DRUG
                  </span>
                  <span style={{ fontSize: '8px', fontWeight: 700, color: '#311b92' }}>
                    PHOTO ID & SIGNATURE REQ
                  </span>
                </div>
              )}

              {!isColdChain && !isControlledDrug && (
                <div
                  style={{
                    flex: 1,
                    border: '1px solid #000000',
                    backgroundColor: '#fafafa',
                    padding: '5px',
                    borderRadius: '4px',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '9.5px',
                      display: 'block',
                      textTransform: 'uppercase',
                    }}
                  >
                    STANDARD AMBIENT DOSAGE
                  </span>
                </div>
              )}
            </div>

            {/* Recipient Delivery Box */}
            <div
              style={{
                border: '1.5px solid #000000',
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '8.5px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#555555',
                  display: 'block',
                  marginBottom: '2px',
                }}
              >
                DELIVER TO (RECIPIENT):
              </span>
              <p
                style={{
                  margin: '0 0 2px 0',
                  fontWeight: 900,
                  fontSize: '13px',
                  color: '#000000',
                  lineHeight: '1.2',
                }}
              >
                {item.recipient_name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: '10.5px',
                  color: '#222222',
                  lineHeight: '1.3',
                }}
              >
                {item.delivery_address || `${item.town}, UK`}
              </p>
              {item.recipient_phone && (
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '9px',
                    color: '#555555',
                    fontFamily: 'monospace',
                  }}
                >
                  Tel: {item.recipient_phone}
                </p>
              )}
            </div>

            {/* Dispensary Pickup Box */}
            <div
              style={{
                border: '1px solid #777777',
                padding: '6px 8px',
                borderRadius: '5px',
                marginBottom: '10px',
                backgroundColor: '#ffffff',
              }}
            >
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#666666',
                  display: 'block',
                }}
              >
                DISPENSED BY (PHARMACY):
              </span>
              <p
                style={{
                  margin: '1px 0 0 0',
                  fontWeight: 700,
                  fontSize: '10.5px',
                  color: '#000000',
                }}
              >
                {item.pharmacy_name}
              </p>
              <p style={{ margin: 0, fontSize: '9px', color: '#555555' }}>
                {item.pickup_address}
              </p>
            </div>

            {/* Barcode & QR Code Section */}
            <div
              style={{
                borderTop: '2px solid #000000',
                paddingTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '6px',
              }}
            >
              {/* Crisp Vector Code 39 Barcode */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <VectorCode39Barcode code={item.reference} />
              </div>

              {/* Scannable 2D QR Code */}
              {qrDataUrl && (
                <div
                  style={{
                    border: '1.5px solid #000000',
                    padding: '3px',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    flexShrink: 0,
                    textAlign: 'center',
                  }}
                >
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    style={{
                      width: '68px',
                      height: '68px',
                      display: 'block',
                      objectFit: 'contain',
                    }}
                  />
                  <span
                    style={{
                      display: 'block',
                      fontSize: '7px',
                      fontWeight: 900,
                      letterSpacing: '-0.3px',
                      marginTop: '2px',
                      color: '#000000',
                    }}
                  >
                    SCAN TO VERIFY
                  </span>
                </div>
              )}
            </div>

            {/* Footer Verification Notice */}
            <div
              style={{
                textAlign: 'center',
                paddingTop: '4px',
                borderTop: '1px solid #cccccc',
                fontSize: '8px',
                color: '#555555',
              }}
            >
              Assigned: {item.assigned_name || 'HAYD Courier'} • Parcels: {item.package_count || '1'} • 07761 734423
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Compatible with Zebra, Brother, Dymo 4"x6" thermal rolls and desktop A4/A6 sticky sheets.
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
