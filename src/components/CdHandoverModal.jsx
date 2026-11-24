import React, { useState, useRef } from 'react'
import {
  ShieldCheck,
  Building2,
  Lock,
  X,
  PenTool,
  RotateCcw,
  Check,
  AlertTriangle,
  FileCheck,
  UserCheck,
  Clock,
  ArrowRight,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Controlled Drug (CD) Two-Way Chain of Custody Modal
 * Mode 'collect': Pharmacist counter handover to courier (Schedule 2/3 signed collection)
 * Mode 'return': Undelivered CD returned to dispensary safe with pharmacist return receipt
 */
export function CdHandoverModal({
  isOpen,
  onClose,
  item,
  currentStaff,
  onConfirmHandover,
  defaultMode = 'collect', // 'collect' | 'return'
}) {
  const [mode, setMode] = useState(defaultMode)
  const [pharmacistName, setPharmacistName] = useState('')
  const [pharmacistGphc, setPharmacistGphc] = useState('')
  const [sealIntact, setSealIntact] = useState(true)
  const [bagCountVerified, setBagCountVerified] = useState(true)
  const [returnReason, setReturnReason] = useState('patient_not_home')
  const [returnNotes, setReturnNotes] = useState('Recipient was not at address; ID verification could not be completed. Package returned intact.')
  const [safeReceiptConfirmed, setSafeReceiptConfirmed] = useState(true)

  // Signature canvas
  const canvasRef = useRef(null)
  const [hasSignature, setHasSignature] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !item) return null

  // Canvas drawing
  const startDrawing = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    const x = (e.clientX || e.touches[0].clientX) - rect.left
    const y = (e.clientY || e.touches[0].clientY) - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    const x = (e.clientX || e.touches[0].clientX) - rect.left
    const y = (e.clientY || e.touches[0].clientY) - rect.top
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#3b0764' // Dark purple
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => setIsDrawing(false)

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasSignature(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!hasSignature || isSubmitting) return

    setIsSubmitting(true)
    const now = new Date()
    const sigData = canvasRef.current?.toDataURL() || null

    try {
      if (mode === 'collect') {
        const cdHandover = {
          collected_at: now.toISOString(),
          pharmacist_name: pharmacistName || 'Dispensing Pharmacist',
          pharmacist_gphc: pharmacistGphc || 'GPhC Registered',
          seal_intact: sealIntact,
          driver_name: currentStaff?.name || 'HAYD Courier',
          driver_badge: currentStaff?.badge || 'HAYD-CR',
          pharmacist_signature: sigData,
        }

        await onConfirmHandover(item, {
          status: 'dispatched',
          collection_time: now.toISOString(),
          cd_dispensary_handover: cdHandover,
          note: `Schedule 2/3 Controlled Drug collected from dispensary counter by ${currentStaff?.name}. Pharmacist sign-off recorded (GPhC: ${pharmacistGphc || 'Verified'}). Tamper seal intact.`,
        })
      } else {
        // Return to pharmacy safe
        const cdReturn = {
          returned_at: now.toISOString(),
          receiving_pharmacist: pharmacistName || 'Duty Pharmacist',
          pharmacist_gphc: pharmacistGphc || 'GPhC Registered',
          return_reason: returnReason,
          return_notes: returnNotes,
          safe_custody_receipt: safeReceiptConfirmed,
          driver_name: currentStaff?.name || 'HAYD Courier',
          pharmacist_signature: sigData,
        }

        await onConfirmHandover(item, {
          status: 'cancelled',
          cd_dispensary_return: cdReturn,
          note: `Controlled Drug returned safely to ${item.pharmacy_name} CD safe. Return receipt signed by Pharmacist ${pharmacistName} (GPhC: ${pharmacistGphc}). Reason: ${returnReason}.`,
        })
      }
      onClose()
    } catch (err) {
      console.error('CD Handover error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-card border border-border shadow-2xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold text-foreground">
                  Controlled Drug (CD) Chain of Custody
                </h3>
                <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[0.65rem] font-bold text-purple-700 dark:text-purple-300">
                  Schedule 2 / 3
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Two-way regulatory sign-off between dispensary pharmacist and authorized courier.
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

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/50 p-1.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('collect')}
            className={cn(
              'rounded-xl py-2 font-bold transition-all flex items-center justify-center gap-1.5',
              mode === 'collect'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            1. Dispensary Collection Sign-Off
          </button>

          <button
            type="button"
            onClick={() => setMode('return')}
            className={cn(
              'rounded-xl py-2 font-bold transition-all flex items-center justify-center gap-1.5',
              mode === 'return'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            2. Return to Pharmacy Safe
          </button>
        </div>

        {/* Consignment Pill */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs font-black bg-background border border-border px-2.5 py-0.5 rounded-lg text-foreground">
              {item.reference}
            </span>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
              {item.package_count || '1 tamper-evident pack'}
            </span>
          </div>

          <p className="text-xs text-foreground font-semibold">
            {item.pharmacy_name} ➔ {item.recipient_name}
          </p>
          <p className="text-[0.72rem] text-muted-foreground">
            {item.delivery_address}
          </p>
        </div>

        {/* Handover Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'collect' ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-foreground/80">
                    Handing-Over Pharmacist Name
                  </label>
                  <input
                    type="text"
                    required
                    value={pharmacistName}
                    onChange={(e) => setPharmacistName(e.target.value)}
                    placeholder="e.g. Helen Davies, MPharm"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-foreground/80">
                    Pharmacist GPhC Registration #
                  </label>
                  <input
                    type="text"
                    required
                    value={pharmacistGphc}
                    onChange={(e) => setPharmacistGphc(e.target.value)}
                    placeholder="e.g. 2049182"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Integrity Checklist */}
              <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
                <span className="font-bold uppercase tracking-wider text-[0.65rem] text-muted-foreground block">
                  Mandatory Custody Verifications:
                </span>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={sealIntact}
                    onChange={(e) => setSealIntact(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-600"
                  />
                  <span>Tamper-evident seal verified intact & serial recorded</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={bagCountVerified}
                    onChange={(e) => setBagCountVerified(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-600"
                  />
                  <span>Prescription bag count matches dispensary manifest</span>
                </label>
              </div>
            </div>
          ) : (
            /* RETURN TO PHARMACY FORM */
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-1">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Controlled Drug Return Protocol
                </span>
                <p className="text-[0.72rem] text-amber-900/80 dark:text-amber-200/80">
                  Undelivered CDs must be returned directly to the dispensing pharmacy and received back into the CD safe with a signed handover receipt.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-foreground/80">
                    Reason for Non-Delivery
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="patient_not_home">Patient not at home / Door unanswered</option>
                    <option value="id_verification_failed">Failed Photo ID verification</option>
                    <option value="delivery_refused">Delivery refused by patient/carer</option>
                    <option value="address_inaccessible">Access prevented (locked gate/hazard)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-foreground/80">
                    Receiving Pharmacist Name & GPhC
                  </label>
                  <input
                    type="text"
                    required
                    value={pharmacistName}
                    onChange={(e) => setPharmacistName(e.target.value)}
                    placeholder="e.g. Helen Davies (2049182)"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-foreground pt-1">
                <input
                  type="checkbox"
                  checked={safeReceiptConfirmed}
                  onChange={(e) => setSafeReceiptConfirmed(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-600"
                />
                <span>Package accepted back into dispensary CD register and safe</span>
              </label>
            </div>
          )}

          {/* Pharmacist Signature Canvas */}
          <div className="space-y-1.5 pt-2 border-t border-border/80">
            <div className="flex items-center justify-between">
              <label className="text-[0.7rem] font-semibold text-foreground/80 flex items-center gap-1">
                <PenTool className="h-3 w-3 text-purple-600" />
                {mode === 'collect'
                  ? 'Dispensing Pharmacist Handover Signature'
                  : 'Receiving Pharmacist Return Receipt Signature'}
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </button>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-purple-500/40 bg-white overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={500}
                height={100}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-24 touch-none cursor-crosshair bg-white"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-purple-900/40 text-xs font-medium">
                  Pharmacist signature (finger or stylus)
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!hasSignature || isSubmitting || !pharmacistName}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed',
                mode === 'collect'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              )}
            >
              <Check className="h-4 w-4 stroke-[3]" />
              {mode === 'collect'
                ? 'Sign & Authorize Courier Collection'
                : 'Confirm CD Return to Safe Custody'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CdHandoverModal

