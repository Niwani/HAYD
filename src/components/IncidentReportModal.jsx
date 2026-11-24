import React, { useState } from 'react'
import {
  AlertTriangle,
  FileText,
  X,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Phone,
  Clock,
  User,
  Check,
  Send,
  LoaderCircle,
} from 'lucide-react'
import { storageClient } from '@/lib/storage'
import { cn } from '@/lib/utils'

const INCIDENT_TYPES = [
  {
    id: 'temp_excursion',
    label: 'Cold-Chain Temperature Excursion (<2°C or >8°C)',
    badge: 'Cold Chain',
    color: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/30',
  },
  {
    id: 'damaged_bag',
    label: 'Damaged / Compromised / Leaking Prescription Package',
    badge: 'Packaging',
    color: 'text-amber-600 bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 'missed_vulnerable',
    label: 'Missed Vulnerable / High-Risk Patient (Welfare Concern)',
    badge: 'Clinical Welfare',
    color: 'text-rose-600 bg-rose-500/10 border-rose-500/30',
  },
  {
    id: 'cd_id_failed',
    label: 'Controlled Drug: Failed Photo ID / Doorstep Handover Refusal',
    badge: 'Controlled Drug',
    color: 'text-purple-600 bg-purple-500/10 border-purple-500/30',
  },
  {
    id: 'cd_returned',
    label: 'Controlled Drug: Returned to Pharmacy Safe Custody',
    badge: 'CD Chain of Custody',
    color: 'text-purple-600 bg-purple-500/10 border-purple-500/30',
  },
  {
    id: 'vehicle_delay',
    label: 'Vehicle Breakdown / Cold Box Equipment Failure',
    badge: 'Equipment / Fleet',
    color: 'text-orange-600 bg-orange-500/10 border-orange-500/30',
  },
  {
    id: 'other',
    label: 'Other Operational or Clinical Logistics Incident',
    badge: 'General',
    color: 'text-neutral-600 bg-neutral-500/10 border-neutral-500/30',
  },
]

export function IncidentReportModal({
  isOpen,
  onClose,
  currentStaff,
  initialData = {},
  onReportCreated,
}) {
  const [incidentType, setIncidentType] = useState(initialData.type || 'temp_excursion')
  const [severity, setSeverity] = useState('medium') // low | medium | high | critical
  const [consignmentRef, setConsignmentRef] = useState(initialData.reference || '')
  const [pharmacyName, setPharmacyName] = useState(initialData.pharmacy_name || 'St Mary Dispensary Partner')
  const [recipientName, setRecipientName] = useState(initialData.recipient_name || '')
  const [description, setDescription] = useState(initialData.desc || '')
  const [actionQuarantined, setActionQuarantined] = useState(true)
  const [actionPharmacistNotified, setActionPharmacistNotified] = useState(true)
  const [actionReturnedToDispensary, setActionReturnedToDispensary] = useState(false)
  const [actionWelfareContacted, setActionWelfareContacted] = useState(false)
  const [pharmacistName, setPharmacistName] = useState('Duty Responsible Pharmacist')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdIncidentId, setCreatedIncidentId] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const actions = []
    if (actionQuarantined) actions.push('Prescriptions quarantined in calibrated 2°C–8°C carrier')
    if (actionPharmacistNotified) actions.push(`Responsible Pharmacist (${pharmacistName}) notified by phone`)
    if (actionReturnedToDispensary) actions.push('Consignment returned to dispensary counter with signed receipt')
    if (actionWelfareContacted) actions.push('Dispensary welfare officer / GP surgery alerted')

    try {
      const record = await storageClient.entities.IncidentReport.create({
        incident_type: incidentType,
        severity,
        consignment_reference: consignmentRef || null,
        pharmacy_name: pharmacyName,
        recipient_name: recipientName || null,
        description,
        immediate_action_taken: actions.join(' • '),
        pharmacist_name: pharmacistName,
        driver_id: currentStaff?.id || 'courier_1',
        driver_name: currentStaff?.name || 'Marcus Vance',
      })

      setCreatedIncidentId(record.id)
      if (onReportCreated) onReportCreated(record)
      setTimeout(() => {
        setCreatedIncidentId('')
        onClose()
      }, 2500)
    } catch (err) {
      console.error('Failed to log incident report:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-card border border-border shadow-2xl p-6 md:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold text-foreground">
                  Regulated Incident & Excursion Report
                </h3>
                <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[0.65rem] font-bold text-destructive">
                  MHRA / GDP SOP-09
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Replaces printed incident paper sheets with a structured digital audit entry.
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

        {/* Success Confirmation Banner */}
        {createdIncidentId ? (
          <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 p-6 text-center space-y-2 animate-in zoom-in-95">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <h4 className="font-heading text-base font-bold text-emerald-800 dark:text-emerald-300">
              Incident Report {createdIncidentId} Filed Successfully
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Logged in digital compliance register and escalated to the Responsible Pharmacist.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-[0.7rem] font-semibold text-foreground/80">
                Incident / Excursion Classification
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold text-foreground focus:ring-1 focus:ring-destructive"
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Pill Selector */}
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-semibold text-foreground/80">
                Severity Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'low', label: 'Low', desc: 'Minor operational note' },
                  { id: 'medium', label: 'Medium', desc: 'Pharmacy contact needed' },
                  { id: 'high', label: 'High', desc: 'Quarantine / Recall' },
                  { id: 'critical', label: 'Critical', desc: 'Regulatory alert' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id)}
                    className={cn(
                      'rounded-xl border p-2 text-center transition-all',
                      severity === s.id
                        ? s.id === 'critical'
                          ? 'border-destructive bg-destructive text-destructive-foreground font-bold shadow-sm'
                          : s.id === 'high'
                          ? 'border-orange-500 bg-orange-500 text-white font-bold shadow-sm'
                          : 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    <span className="block text-xs">{s.label}</span>
                    <span className="text-[0.6rem] opacity-80 block truncate">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Consignment and Pharmacy Context */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[0.7rem] font-semibold text-foreground/80">
                  Consignment Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HAYD-8F2K9Q"
                  value={consignmentRef}
                  onChange={(e) => setConsignmentRef(e.target.value.toUpperCase())}
                  className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono font-bold text-foreground focus:ring-1 focus:ring-destructive"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[0.7rem] font-semibold text-foreground/80">
                  Associated Pharmacy / Dispensary
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St Mary Dispensary Partner"
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-destructive"
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1">
              <label className="text-[0.7rem] font-semibold text-foreground/80">
                Detailed Incident Description & Circumstances
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exactly what occurred (e.g. temperature breach reading, patient refusal reason, damage observation, odometer/time details)..."
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground leading-relaxed focus:ring-1 focus:ring-destructive"
              />
            </div>

            {/* Immediate Action Taken Checkboxes */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5 space-y-2">
              <span className="font-bold uppercase tracking-wider text-[0.65rem] text-muted-foreground block">
                Immediate Actions Taken by Driver:
              </span>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={actionQuarantined}
                  onChange={(e) => setActionQuarantined(e.target.checked)}
                  className="rounded text-destructive focus:ring-destructive"
                />
                <span>Prescriptions placed in calibrated quarantine carrier</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={actionPharmacistNotified}
                  onChange={(e) => setActionPharmacistNotified(e.target.checked)}
                  className="rounded text-destructive focus:ring-destructive"
                />
                <span>Dispensary Responsible Pharmacist alerted immediately by telephone</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={actionReturnedToDispensary}
                  onChange={(e) => setActionReturnedToDispensary(e.target.checked)}
                  className="rounded text-destructive focus:ring-destructive"
                />
                <span>Consignment returned directly to dispensary safe / quarantine</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={actionWelfareContacted}
                  onChange={(e) => setActionWelfareContacted(e.target.checked)}
                  className="rounded text-destructive focus:ring-destructive"
                />
                <span>Vulnerable patient welfare concern escalated to clinical team</span>
              </label>
            </div>

            {/* Responsible Pharmacist Contact */}
            <div className="space-y-1">
              <label className="text-[0.7rem] font-semibold text-foreground/80">
                Responsible Pharmacist Escalated To
              </label>
              <input
                type="text"
                value={pharmacistName}
                onChange={(e) => setPharmacistName(e.target.value)}
                placeholder="e.g. Helen Davies (GPhC #2049182)"
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-destructive"
              />
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
                disabled={isSubmitting || !description}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-6 py-2.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40 transition-colors shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Submitting Report…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Submit Regulatory Incident Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default IncidentReportModal

