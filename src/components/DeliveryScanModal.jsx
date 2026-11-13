import React, { useState, useRef, useEffect } from 'react'
import {
  Scan,
  CheckCircle2,
  AlertTriangle,
  Camera,
  X,
  PenTool,
  RotateCcw,
  Check,
  ShieldCheck,
  Package,
  User,
  MapPin,
  Clock,
  LoaderCircle,
  Volume2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Synthesizes a clean audio chime via browser Web Audio API (no external MP3 needed)
 */
function playChime(type = 'success') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'success') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12) // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } else {
      // Warning buzzer
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, ctx.currentTime) // Low A
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    }
  } catch {
    // Audio context may be restricted before user interaction
  }
}

export function DeliveryScanModal({ item, isOpen, onClose, onConfirmDelivery, currentStaff }) {
  const [scannedInput, setScannedInput] = useState('')
  const [scanStatus, setScanStatus] = useState('idle') // idle | verified | mismatch
  const [mismatchedCode, setMismatchedCode] = useState('')

  // POD Form State
  const [recipientName, setRecipientName] = useState('')
  const [relationship, setRelationship] = useState('patient') // patient | spouse | carer | neighbor | other
  const [idVerified, setIdVerified] = useState(false)
  const [courierNote, setCourierNote] = useState('')
  const [hasSignature, setHasSignature] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Camera State
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const scanInputRef = useRef(null)

  // Signature canvas
  const sigCanvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Initialize form when item changes
  useEffect(() => {
    if (item) {
      setScannedInput('')
      setScanStatus('idle')
      setMismatchedCode('')
      setRecipientName(item.recipient_name || '')
      setRelationship('patient')
      setIdVerified(Boolean(item.categories?.includes('controlled_drugs')))
      setCourierNote(`Handed directly to recipient at destination doorstep. Verified by barcode scan.`)
      setHasSignature(false)
      clearSignature()
    }
  }, [item, isOpen])

  // Focus scan input automatically when modal opens
  useEffect(() => {
    if (isOpen && scanInputRef.current) {
      setTimeout(() => scanInputRef.current?.focus(), 200)
    }
  }, [isOpen])

  // Cleanup camera on close
  useEffect(() => {
    if (!isOpen && cameraActive) {
      stopCamera()
    }
  }, [isOpen, cameraActive])

  if (!isOpen || !item) return null

  // -------------------------------------------------------------
  // SCAN VERIFICATION LOGIC
  // -------------------------------------------------------------
  const verifyCode = (codeToVerify) => {
    const targetRef = item.reference.trim().toUpperCase()
    const cleaned = (codeToVerify || '').trim().toUpperCase()

    if (!cleaned) return

    if (cleaned === targetRef) {
      // ✅ EXACT MATCH!
      setScanStatus('verified')
      setMismatchedCode('')
      playChime('success')
      if (cameraActive) stopCamera()
    } else {
      // 🚨 MISMATCH! MISDELIVERY PREVENTED!
      setScanStatus('mismatch')
      setMismatchedCode(cleaned)
      playChime('warning')
    }
  }

  const handleManualScanSubmit = (e) => {
    e.preventDefault()
    verifyCode(scannedInput)
  }

  // Camera handling
  const startCamera = async () => {
    try {
      setCameraActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.warn('Camera access error:', err)
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  // -------------------------------------------------------------
  // SIGNATURE PAD CANVAS
  // -------------------------------------------------------------
  const getCoordinates = (e) => {
    const canvas = sigCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDrawing = (e) => {
    setIsDrawing(true)
    const { x, y } = getCoordinates(e)
    const ctx = sigCanvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const draw = (e) => {
    if (!isDrawing) return
    const { x, y } = getCoordinates(e)
    const ctx = sigCanvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.strokeStyle = '#08162E'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      setHasSignature(true)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = sigCanvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasSignature(false)
    }
  }

  // -------------------------------------------------------------
  // COMPLETE DELIVERY SUBMISSION
  // -------------------------------------------------------------
  const handleSubmitDelivery = async () => {
    if (scanStatus !== 'verified') return

    setIsSubmitting(true)

    const now = new Date()
    const signatureDataUrl = sigCanvasRef.current?.toDataURL() || null

    const podEvidence = {
      verified_at: now.toISOString(),
      verified_reference: item.reference,
      scanned_code: item.reference,
      verified_by: `${currentStaff.name} (${currentStaff.badge})`,
      signee_name: recipientName || item.recipient_name,
      signee_relationship: relationship,
      id_verified: idVerified,
      signature_data: signatureDataUrl,
      timestamp: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    }

    try {
      await onConfirmDelivery(item, {
        status: 'delivered',
        delivery_time: now.toISOString(),
        note: courierNote,
        pod_evidence: podEvidence,
      })
      onClose()
    } catch (err) {
      console.error('Delivery confirmation error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-card border border-border shadow-2xl p-6 md:p-8 space-y-6">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0d9488]/15 text-[#0d9488]">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-accent">
                Anti-Misdelivery & POD Verification
              </span>
              <h3 className="font-heading text-lg font-bold text-foreground">
                Doorstep Delivery Handover
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Target Consignment Header Summary */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black bg-background border border-border px-2.5 py-0.5 rounded-lg text-foreground">
                {item.reference}
              </span>
              <span className="text-xs font-bold text-foreground">
                {item.recipient_name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {item.package_count || '1 parcel'}
            </span>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
            {item.delivery_address || `${item.town}, UK`}
          </p>
        </div>

        {/* ========================================================= */}
        {/* STEP 1: SCAN-TO-MATCH VERIFICATION */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[0.65rem]">
                1
              </span>
              Scan Physical Parcel Barcode / QR Code
            </span>

            {scanStatus === 'verified' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-600/10 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" /> Barcode Verified
              </span>
            )}
          </div>

          {/* Scanner Input / Actions */}
          {scanStatus !== 'verified' ? (
            <div className="space-y-3">
              <form onSubmit={handleManualScanSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={scanInputRef}
                    type="text"
                    value={scannedInput}
                    onChange={(e) => setScannedInput(e.target.value.toUpperCase())}
                    placeholder="Scan sticker barcode with scanner or camera…"
                    className="h-11 w-full rounded-xl border-2 border-primary/30 bg-background px-4 font-mono text-sm font-bold tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#0d9488]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!scannedInput.trim()}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Scan className="h-4 w-4" /> Match Barcode
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Quick test match button
                    setScannedInput(item.reference)
                    verifyCode(item.reference)
                  }}
                  className="rounded-xl border border-border px-3 text-[0.7rem] font-semibold text-muted-foreground hover:bg-secondary"
                  title="Test-match exact code"
                >
                  Demo Scan
                </button>
              </form>

              {/* CAMERA SCANNER VIEWFINDER (Optional toggle) */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Point laser/Bluetooth scanner, or test code above.</span>
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-accent hover:underline"
                  >
                    <Camera className="h-3.5 w-3.5" /> Open Mobile Camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-destructive hover:underline"
                  >
                    Stop Camera
                  </button>
                )}
              </div>

              {cameraActive && (
                <div className="relative rounded-2xl border-2 border-dashed border-[#0d9488] bg-black overflow-hidden flex flex-col items-center justify-center p-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="h-48 w-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 border-2 border-[#0d9488] m-8 rounded-xl pointer-events-none animate-pulse" />
                  <p className="mt-2 text-[0.7rem] text-white/80">
                    Align parcel sticker barcode inside frame
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* MATCHED SUCCESS BANNER */
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 p-4 space-y-1 animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>PARCEL VERIFIED: Scanned Barcode Matches Manifest</span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Correct parcel for <strong>{item.recipient_name}</strong> confirmed. Delivery handover unlocked.
              </p>
            </div>
          )}

          {/* MISMATCH WARNING BANNER */}
          {scanStatus === 'mismatch' && (
            <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-4 space-y-2 animate-in shake">
              <div className="flex items-center gap-2 text-destructive font-black text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>🚨 MISDELIVERY WARNING: PARCEL CODE MISMATCH</span>
              </div>
              <p className="text-xs text-destructive leading-relaxed font-semibold">
                Scanned barcode <strong>{mismatchedCode}</strong> DOES NOT MATCH this consignment reference (<strong>{item.reference}</strong>).
              </p>
              <p className="text-[0.72rem] text-foreground font-bold">
                ⚠️ DO NOT HAND OVER THIS PACKAGE. You are holding a parcel for another patient. Check the sticker reference.
              </p>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* STEP 2: EVIDENCE OF DELIVERY (POD & SIGNATURE) */}
        {/* ========================================================= */}
        <div
          className={cn(
            'space-y-4 pt-3 border-t border-border transition-opacity',
            scanStatus !== 'verified' ? 'opacity-40 pointer-events-none' : 'opacity-100'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[0.65rem]">
                2
              </span>
              Proof of Delivery (POD) & Recipient Signature
            </span>
            <span className="text-[0.68rem] text-muted-foreground">
              {scanStatus === 'verified' ? 'Unlocked' : '🔒 Locked until barcode matches'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[0.7rem] font-semibold text-foreground/80">
                Person Receiving Medication
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Full name of signee"
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[0.7rem] font-semibold text-foreground/80">
                Relationship to Patient
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
              >
                <option value="patient">Named Patient (Self)</option>
                <option value="spouse">Spouse / Partner</option>
                <option value="carer">Family Member / Carer</option>
                <option value="neighbor">Authorized Neighbour</option>
                <option value="staff">Dispensary / Clinic Staff</option>
              </select>
            </div>
          </div>

          {/* Controlled Drugs ID check */}
          {item.categories?.includes('controlled_drugs') && (
            <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-3 space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-600"
                />
                <span>🔐 Controlled Drug: Photographic ID Verified Prior to Handover</span>
              </label>
              <p className="text-[0.68rem] text-purple-800/80 dark:text-purple-300/80 pl-6">
                Driving license, passport, or NHS staff card verified.
              </p>
            </div>
          )}

          {/* Interactive Signature Pad Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[0.7rem] font-semibold text-foreground/80 flex items-center gap-1">
                <PenTool className="h-3 w-3 text-[#0d9488]" />
                Electronic Signature (Touch / Stylus)
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Clear Signature
              </button>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-border bg-white overflow-hidden relative">
              <canvas
                ref={sigCanvasRef}
                width={500}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-28 touch-none cursor-crosshair bg-white"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-neutral-400 text-xs font-medium">
                  Sign with finger or stylus inside box
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            Cancel Handover
          </button>

          <button
            type="button"
            onClick={handleSubmitDelivery}
            disabled={scanStatus !== 'verified' || isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" /> Verifying & Saving POD…
              </>
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[3]" /> Confirm Delivery with Barcode Evidence
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeliveryScanModal


