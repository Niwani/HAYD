import React, { useState, useEffect, useRef } from 'react'
import {
  ThermometerSnowflake,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  Plus,
  PenTool,
  RotateCcw,
  Check,
  FileText,
  Calendar,
  Truck,
  ArrowRight,
} from 'lucide-react'
import { storageClient } from '@/lib/storage'
import { cn } from '@/lib/utils'

export function ShiftCoolBagModal({ isOpen, onClose, currentStaff, onOpenIncidentModal }) {
  const [logs, setLogs] = useState([])
  const [activeLog, setActiveLog] = useState(null)
  const [viewMode, setViewMode] = useState('active') // 'active' | 'new' | 'history'

  // New or update form state
  const [coolBoxId, setCoolBoxId] = useState('HAYD-CB-04 (TempMate Data Logger #8812)')
  const [preDepartureTemp, setPreDepartureTemp] = useState('3.8')
  const [midShiftTemp, setMidShiftTemp] = useState('')
  const [endMinTemp, setEndMinTemp] = useState('')
  const [endMaxTemp, setEndMaxTemp] = useState('')
  const [notes, setNotes] = useState('Pre-departure calibration check passed. Ice packs conditioned 45 mins prior to loading.')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')

  // Signature canvas
  const canvasRef = useRef(null)
  const [hasSignature, setHasSignature] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadLogs()
    }
  }, [isOpen, currentStaff])

  const loadLogs = async () => {
    try {
      const all = await storageClient.entities.ShiftTempLog.list()
      setLogs(all)
      if (currentStaff) {
        const active = await storageClient.entities.ShiftTempLog.getActiveForDriver(currentStaff.id)
        if (active) {
          setActiveLog(active)
          setCoolBoxId(active.cool_box_id || '')
          setPreDepartureTemp(active.pre_departure_temp?.toString() || '3.8')
          setMidShiftTemp(active.mid_shift_temp?.toString() || '')
          setEndMinTemp(active.end_shift_min_temp?.toString() || '')
          setEndMaxTemp(active.end_shift_max_temp?.toString() || '')
          setNotes(active.notes || '')
          setViewMode('active')
        } else {
          setActiveLog(null)
          setViewMode(all.length > 0 ? 'new' : 'new')
        }
      }
    } catch (err) {
      console.error('Failed to load shift temp logs:', err)
    }
  }

  // Signature drawing logic
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
    ctx.strokeStyle = '#08162e'
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

  if (!isOpen) return null

  // Helpers to test if temp is in valid 2C-8C range
  const isTempValid = (t) => {
    if (t === '' || t === null || isNaN(Number(t))) return true
    const n = Number(t)
    return n >= 2.0 && n <= 8.0
  }

  const hasAnyExcursion =
    (preDepartureTemp !== '' && !isTempValid(preDepartureTemp)) ||
    (midShiftTemp !== '' && !isTempValid(midShiftTemp)) ||
    (endMinTemp !== '' && Number(endMinTemp) < 2.0) ||
    (endMaxTemp !== '' && Number(endMaxTemp) > 8.0)

  // Handle Save Pre-Departure Check
  const handleStartShift = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const pre = Number(preDepartureTemp)
      const newRecord = await storageClient.entities.ShiftTempLog.create({
        driver_id: currentStaff?.id || 'courier_1',
        driver_name: currentStaff?.name || 'Marcus Vance',
        driver_unit: currentStaff?.unit || 'Unit 1',
        cool_box_id: coolBoxId,
        pre_departure_temp: isNaN(pre) ? 3.8 : pre,
        pre_departure_time: new Date().toISOString(),
        pre_departure_verified: true,
        notes,
        status: 'active',
      })
      setActiveLog(newRecord)
      setViewMode('active')
      setSaveSuccess('Shift cool bag pre-departure check logged successfully!')
      setTimeout(() => setSaveSuccess(''), 4000)
      loadLogs()
    } catch (err) {
      console.error('Error starting shift cool bag log:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle End-of-Shift Min/Max Complete
  const handleCompleteShift = async () => {
    if (!activeLog) return
    setIsSubmitting(true)
    try {
      const min = endMinTemp !== '' ? Number(endMinTemp) : 2.8
      const max = endMaxTemp !== '' ? Number(endMaxTemp) : 5.2
      const mid = midShiftTemp !== '' ? Number(midShiftTemp) : null
      const sigData = canvasRef.current?.toDataURL() || null

      const patch = {
        end_shift_min_temp: min,
        end_shift_max_temp: max,
        mid_shift_temp: mid,
        end_shift_time: new Date().toISOString(),
        status: 'completed',
        signoff_signature: sigData,
        notes: notes + (hasAnyExcursion ? ' [EXCURSION RECORDED]' : ' [Audit Complete: Zero Excursions]'),
      }

      await storageClient.entities.ShiftTempLog.update(activeLog.id, patch)
      setSaveSuccess('Shift cool bag verification signed off and archived for GDP audit!')
      setTimeout(() => setSaveSuccess(''), 4000)
      loadLogs()
    } catch (err) {
      console.error('Error completing shift log:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-card border border-border shadow-2xl p-6 md:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-600">
              <ThermometerSnowflake className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base md:text-lg font-bold text-foreground">
                  Cold-Chain Temperature Log (2°C–8°C)
                </h3>
                <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[0.65rem] font-bold text-cyan-700 dark:text-cyan-400">
                  GDP Regulated
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                One digital log per driver shift replaces paper sheets with continuous audit compliance.
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

        {/* View Mode Switcher */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('active')}
              className={cn(
                'rounded-xl px-3 py-1.5 font-bold transition-all',
                viewMode === 'active'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              )}
            >
              Today's Active Shift Check
            </button>
            <button
              onClick={() => setViewMode('new')}
              className={cn(
                'rounded-xl px-3 py-1.5 font-bold transition-all',
                viewMode === 'new'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              )}
            >
              Start New Shift Log
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={cn(
                'rounded-xl px-3 py-1.5 font-bold transition-all',
                viewMode === 'history'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              )}
            >
              Audit History ({logs.length})
            </button>
          </div>

          {currentStaff && (
            <span className="text-[0.68rem] text-muted-foreground font-mono">
              Driver: <strong>{currentStaff.name}</strong>
            </span>
          )}
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: ACTIVE DRIVER SHIFT LOG */}
        {/* ========================================================= */}
        {viewMode === 'active' && activeLog && (
          <div className="space-y-5 animate-in fade-in">
            {/* Shift Banner */}
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-background to-secondary/30 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[0.65rem] uppercase font-bold tracking-wider text-cyan-700 dark:text-cyan-400">
                    Live Active Shift
                  </span>
                  <p className="font-bold text-foreground text-sm">
                    {activeLog.driver_unit} — {activeLog.driver_name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold bg-background px-2.5 py-1 rounded-lg border border-border block">
                    {activeLog.cool_box_id}
                  </span>
                  <span className="text-[0.65rem] text-muted-foreground">
                    Shift Date: {activeLog.shift_date}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage 1: Pre-Departure Reading */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-white text-[0.65rem] font-black">
                    1
                  </span>
                  Pre-Departure Calibration & Temperature
                </span>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  <Check className="h-3 w-3 stroke-[3]" /> Verified Before Vehicle Left
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-xl bg-secondary/40 p-3">
                  <span className="text-muted-foreground block text-[0.68rem]">
                    Recorded Pre-Departure Temp
                  </span>
                  <span className="font-heading text-lg font-black text-foreground">
                    {activeLog.pre_departure_temp}°C
                  </span>
                  <span className="text-[0.65rem] text-emerald-600 font-semibold block mt-0.5">
                    ✓ Valid 2°C–8°C Cold Chain Range
                  </span>
                </div>

                <div className="rounded-xl bg-secondary/40 p-3">
                  <span className="text-muted-foreground block text-[0.68rem]">
                    Departure Time
                  </span>
                  <span className="font-heading text-sm font-bold text-foreground">
                    {new Date(activeLog.pre_departure_time).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-[0.65rem] text-muted-foreground block mt-0.5">
                    Ice packs calibrated & sealed
                  </span>
                </div>
              </div>
            </div>

            {/* Stage 2: End-of-Shift Min/Max Data Logger Check */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-white text-[0.65rem] font-black">
                    2
                  </span>
                  End-of-Shift Min / Max Temperature Check
                </span>
                <span className="text-[0.68rem] text-muted-foreground">
                  Read directly from cool box data logger
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                At the end of your delivery round or shift, read the logger minimum and maximum temperatures to verify no excursion occurred during transit.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-foreground/80">
                    Mid-Shift Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 4.2"
                    value={midShiftTemp}
                    onChange={(e) => setMidShiftTemp(e.target.value)}
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono text-foreground focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-[0.65rem] text-muted-foreground block">Optional spot check</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-foreground/80">
                    Shift Minimum Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 2.9"
                    value={endMinTemp}
                    onChange={(e) => setEndMinTemp(e.target.value)}
                    className={cn(
                      'h-9 w-full rounded-xl border bg-background px-3 text-xs font-bold font-mono focus:ring-1',
                      endMinTemp !== '' && Number(endMinTemp) < 2.0
                        ? 'border-destructive text-destructive'
                        : 'border-input text-foreground focus:ring-cyan-500'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[0.65rem] block',
                      endMinTemp !== '' && Number(endMinTemp) < 2.0
                        ? 'text-destructive font-bold'
                        : 'text-muted-foreground'
                    )}
                  >
                    Must be ≥ 2.0°C (No freezing)
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-foreground/80">
                    Shift Maximum Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 5.1"
                    value={endMaxTemp}
                    onChange={(e) => setEndMaxTemp(e.target.value)}
                    className={cn(
                      'h-9 w-full rounded-xl border bg-background px-3 text-xs font-bold font-mono focus:ring-1',
                      endMaxTemp !== '' && Number(endMaxTemp) > 8.0
                        ? 'border-destructive text-destructive'
                        : 'border-input text-foreground focus:ring-cyan-500'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[0.65rem] block',
                      endMaxTemp !== '' && Number(endMaxTemp) > 8.0
                        ? 'text-destructive font-bold'
                        : 'text-muted-foreground'
                    )}
                  >
                    Must be ≤ 8.0°C (No warming)
                  </span>
                </div>
              </div>

              {/* Excursion Warning Banner if values breach 2-8 */}
              {hasAnyExcursion ? (
                <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-4 space-y-2 animate-in zoom-in-95">
                  <div className="flex items-center gap-2 text-destructive font-bold text-xs">
                    <AlertTriangle className="h-4 w-4" />
                    <span>⚠️ TEMPERATURE EXCURSION DETECTED (&lt;2.0°C or &gt;8.0°C)</span>
                  </div>
                  <p className="text-xs text-destructive leading-relaxed">
                    Under GDP guidelines, this breach must be logged and escalated to the Responsible Pharmacist immediately before affected medications are released.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      if (onOpenIncidentModal) {
                        onOpenIncidentModal({
                          type: 'temp_excursion',
                          desc: `Cool bag ${activeLog.cool_box_id} temperature breach: Min ${endMinTemp}°C / Max ${endMaxTemp}°C during round.`,
                        })
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-3.5 py-1.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Open Regulated Incident Report Form →
                  </button>
                </div>
              ) : (
                endMinTemp &&
                endMaxTemp && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>✓ Compliant Cold Chain: Entire shift remained strictly within 2°C–8°C limit.</span>
                  </div>
                )
              )}

              {/* Driver Sign-Off Pad */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-[0.7rem] font-semibold text-foreground/80 flex items-center gap-1">
                    <PenTool className="h-3 w-3 text-cyan-600" />
                    Driver End-of-Shift Audit Signature
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" /> Clear
                  </button>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-border bg-white overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={90}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-20 touch-none cursor-crosshair bg-white"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-neutral-400 text-xs font-medium">
                      Sign here to certify min/max logger readings
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[0.68rem] text-muted-foreground">
                  Saved directly to MHRA audit database.
                </span>

                <button
                  type="button"
                  onClick={handleCompleteShift}
                  disabled={isSubmitting || !endMinTemp || !endMaxTemp}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-40 transition-colors shadow-sm"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  Sign Off & Complete Shift Log
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: START NEW SHIFT FORM (If no active log or starting) */}
        {/* ========================================================= */}
        {(viewMode === 'new' || (!activeLog && viewMode === 'active')) && (
          <form onSubmit={handleStartShift} className="space-y-4 animate-in fade-in">
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-2">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                Pre-Departure Cold-Chain Check
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Before collecting 2°C–8°C pharmaceuticals from dispensary fridges, confirm the calibrated cool box is within the regulatory target.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="space-y-1">
                <label className="text-[0.7rem] font-semibold text-foreground/80">
                  Cool Bag / Logger Asset ID
                </label>
                <input
                  type="text"
                  value={coolBoxId}
                  onChange={(e) => setCoolBoxId(e.target.value)}
                  placeholder="e.g. HAYD-CB-04 (Logger #8812)"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[0.7rem] font-semibold text-foreground/80">
                  Pre-Departure Temp (°C) — Must be 2.0°C–8.0°C
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={preDepartureTemp}
                  onChange={(e) => setPreDepartureTemp(e.target.value)}
                  placeholder="e.g. 3.8"
                  className={cn(
                    'h-10 w-full rounded-xl border bg-background px-3 text-xs font-bold font-mono focus:ring-1',
                    !isTempValid(preDepartureTemp)
                      ? 'border-destructive text-destructive'
                      : 'border-input text-foreground focus:ring-cyan-500'
                  )}
                  required
                />
                {!isTempValid(preDepartureTemp) && (
                  <span className="text-[0.65rem] text-destructive font-bold block">
                    ⚠️ Pre-departure temperature must be between 2.0°C and 8.0°C!
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[0.7rem] font-semibold text-foreground/80">
                Preparation & Conditioning Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ice packs conditioned, thermal separator in place..."
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !isTempValid(preDepartureTemp)}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-40 transition-colors shadow-sm"
              >
                <ThermometerSnowflake className="h-4 w-4" />
                Certify & Start Shift Check
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: AUDIT HISTORY */}
        {/* ========================================================= */}
        {viewMode === 'history' && (
          <div className="space-y-3 max-h-96 overflow-y-auto animate-in fade-in">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No past shift temperature logs recorded yet.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{log.shift_date}</span>
                      <span className="text-muted-foreground">• {log.driver_name}</span>
                      <span className="text-muted-foreground font-mono">({log.driver_unit})</span>
                    </div>

                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase',
                        log.excursion_occurred
                          ? 'bg-destructive/15 text-destructive'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      )}
                    >
                      {log.excursion_occurred ? '⚠️ Excursion' : '✓ Zero Excursions (Compliant)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[0.72rem]">
                    <div className="rounded-lg bg-background p-2">
                      <span className="text-muted-foreground block text-[0.62rem]">Asset ID</span>
                      <span className="font-bold truncate block">{log.cool_box_id}</span>
                    </div>

                    <div className="rounded-lg bg-background p-2">
                      <span className="text-muted-foreground block text-[0.62rem]">Pre-Departure</span>
                      <span className="font-bold text-foreground">{log.pre_departure_temp}°C</span>
                    </div>

                    <div className="rounded-lg bg-background p-2">
                      <span className="text-muted-foreground block text-[0.62rem]">Shift Min Temp</span>
                      <span className="font-bold text-foreground">
                        {log.end_shift_min_temp != null ? `${log.end_shift_min_temp}°C` : 'En route'}
                      </span>
                    </div>

                    <div className="rounded-lg bg-background p-2">
                      <span className="text-muted-foreground block text-[0.62rem]">Shift Max Temp</span>
                      <span className="font-bold text-foreground">
                        {log.end_shift_max_temp != null ? `${log.end_shift_max_temp}°C` : 'En route'}
                      </span>
                    </div>
                  </div>

                  {log.notes && (
                    <p className="text-[0.68rem] text-muted-foreground italic">
                      Note: {log.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ShiftCoolBagModal

