import React, { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock3,
  ShieldCheck,
  Package,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { storageClient } from '@/lib/storage'
import haydIconNavy from '@/assets/hayd-icon-navy.png'

const QUICK_PROMPTS = [
  'What are your collection cut-offs?',
  'How much do you charge?',
  'Do you deliver to patient homes?',
  'How are cold-chain & CDs handled?',
  'What happens if a patient is not home?',
]

/**
 * Intelligent, asynchronous knowledge base for HAYD Pharmacy Logistics
 */
async function resolveBotResponse(userMsg) {
  const q = userMsg.toLowerCase().trim()

  // 1. Direct Reference Lookup (e.g. HAYD-XXXXXX)
  const refMatch = userMsg.match(/HAYD-[A-Z0-9]{5,8}/i)
  if (refMatch) {
    const targetRef = refMatch[0].toUpperCase()
    try {
      const records = await storageClient.entities.TrackStatus.filter({ reference: targetRef })
      const list = Array.isArray(records) ? records : records?.items || []
      if (list.length > 0) {
        const item = list[0]
        const statusMap = {
          received: 'Request received & scheduled for collection',
          verifying: 'Pharmacist verification at counter',
          dispatched: 'Out for delivery (Courier collected)',
          delivered: 'Delivered & signed for at doorstep',
          cancelled: 'Delivery cancelled',
        }
        const statusText = statusMap[item.status] || item.status

        const etaLine = item.status === 'delivered'
          ? `• **Delivered At:** ${item.delivery_time ? new Date(item.delivery_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Confirmed'}`
          : `• **Estimated Delivery:** ${item.estimated_delivery_window || 'Standard delivery round'}`

        const collectLine = item.collection_time
          ? `• **Collection Time:** ${new Date(item.collection_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : null

        const distLine = item.distance_miles
          ? `• **Route Distance:** ${item.distance_miles} miles (~${item.transit_duration_mins || 15} mins transit)`
          : null

        const details = [
          `• **Status:** ${statusText}`,
          etaLine,
          collectLine,
          distLine,
          `• **Destination:** ${item.recipient_name || 'Patient'} (${item.town || 'Active route'})`,
          `• **Dispensary:** ${item.pharmacy_name || 'Partner pharmacy'}`,
          `• **Latest Note:** ${item.note || 'Collection logged in system'}`,
          `• **Last Updated:** ${new Date(item.updated_date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        ].filter(Boolean).join('\n')

        return {
          text: `Found active consignment **${item.reference}**:\n\n${details}`,
          cta: { text: 'View live map & timeline on tracking page', to: `/track?ref=${item.reference}` },
        }
      }
    } catch {
      // fallback to standard response
    }
  }

  // 2. Greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)\b/i.test(q)) {
    return {
      text: "Hello! Welcome to **HAYD (Health At Your Door)**.\n\nI am your live dispatch assistant. I can help you with:\n• **Booking a prescription collection**\n• **Checking collection cut-offs & operating hours**\n• **Live tracking** (type your HAYD-XXXXXX reference)\n• **Pricing & per-drop rates**\n• **Cold-chain & Controlled Drug compliance**\n\nHow can I help your pharmacy or organisation today?",
      cta: { text: 'Book a collection', to: '/request' },
    }
  }

  // 3. Pricing / Cost / How much
  if (q.includes('price') || q.includes('pricing') || q.includes('cost') || q.includes('how much') || q.includes('charge') || q.includes('rate') || q.includes('fee')) {
    return {
      text: "We offer transparent, competitive per-drop pricing designed specifically for community pharmacies:\n\n• **Scheduled Daily Rounds:** Flat per-delivery rate based on your pharmacy's delivery radius and daily volume.\n• **Urgent / Same-Day Discharges:** Fast point-to-point courier dispatch within 4 hours.\n• **Regulatory Handling Included:** 2°C–8°C thermal cold-chain pouches and Controlled Drugs security at no extra hidden fees.\n• **No Lock-in Contracts:** We work flexibly with single counters up to multi-branch groups.\n\nFor an instant quote based on your postcode cluster, call dispatch directly on **07761 734423** or send an enquiry.",
      cta: { text: 'Request rates for your pharmacy', to: '/contact' },
    }
  }

  // 4. Cut-offs, Hours & Same-day Timing
  if (q.includes('cut-off') || q.includes('cutoff') || q.includes('hours') || q.includes('time') || q.includes('same-day') || q.includes('same day') || q.includes('today') || q.includes('weekend') || q.includes('sunday')) {
    return {
      text: "Our core collection schedule and operating hours:\n\n• **Same-Day Cut-Off:** **4:00 PM** (prescriptions booked before 4pm are delivered within 4 hours the same day).\n• **Operating Hours:** Monday–Saturday, **8:00 AM – 8:00 PM**.\n• **Sunday Deliveries:** Urgent palliative runs and hospital discharge collections supported by special arrangement.\n• **Scheduled Rounds:** You can set 1, 2, or 3 fixed daily pickup times to fit your dispensary checking bench.",
      cta: { text: 'Book a collection now', to: '/request' },
    }
  }

  // 5. Patient / Home Deliveries
  if (q.includes('home') || q.includes('house') || q.includes('door') || q.includes('residential') || q.includes('care home') || q.includes('deliver to patient')) {
    return {
      text: "Yes! HAYD delivers prescription medicines directly to **patients' homes, care homes, and workplaces** on behalf of partner pharmacies.\n\n• Every item is handed directly to a person at the doorstep.\n• Digital signatures, timestamps, and geostamped proof of delivery (POD) are returned to your pharmacy the same evening.\n• Medicines are **never left unattended**, on porches, or thrown over gates.",
      cta: { text: 'Book a patient delivery', to: '/request' },
    }
  }

  // 6. What happens if recipient / patient is not home
  if (q.includes('not home') || q.includes('not in') || q.includes('nobody home') || q.includes('absent') || q.includes('missed') || q.includes('unattended')) {
    return {
      text: "We follow strict MHRA pharmaceutical safety standards:\n\n• Prescription medicines are **never left on doorsteps or thrown over gates**.\n• If no adult is available to receive and sign for the medication, our courier calls the recipient contact phone and leaves a discreet calling card.\n• If unreached, the item is safely retained in temperature-controlled custody and **returned to your pharmacy counter** with an unbroken audit trail.",
      cta: { text: 'Speak to dispatch', href: 'tel:+447761734423' },
    }
  }

  // 7. Controlled Drugs (CDs)
  if (q.includes('cd') || q.includes('controlled') || q.includes('schedule 2') || q.includes('schedule 3') || q.includes('morphine') || q.includes('methadone') || q.includes('temazepam')) {
    return {
      text: "We handle Schedule 2 & 3 Controlled Drugs with strict, audit-ready chain of custody:\n\n• **Named Couriers:** Transported exclusively by vetted, uniformed couriers (never subcontracted).\n• **Tamper-Evident Bagging:** Numbered and checked against your counter manifest.\n• **Doorstep Verification:** Recipient photo ID and physical signature required upon handover.\n• **Inspection-Ready:** Manifest records and signed PODs are retained and audit-ready for your superintendent.",
      cta: { text: 'Explore regulated services', to: '/services' },
    }
  }

  // 8. Cold-Chain & Thermal (2°C–8°C)
  if (q.includes('cold') || q.includes('fridge') || q.includes('temperature') || q.includes('2-8') || q.includes('2°c') || q.includes('insulin') || q.includes('vaccine') || q.includes('biologic')) {
    return {
      text: "Our cold-chain transport complies fully with MHRA Good Distribution Practice (GDP):\n\n• **Validated 2°C–8°C Thermal Carriers:** Medical-grade insulated pouches and calibrated thermal packs.\n• **Continuous Integrity:** Protects temperature-sensitive vaccines, insulins, eye drops, and biologics.\n• **Direct Manifest Entry:** Fridge lines are identified on your manifest and prioritized on routes to avoid excursions.",
      cta: { text: 'View cold-chain standards', to: '/services' },
    }
  }

  // 9. Couriers & DBS Vetting
  if (q.includes('dbs') || q.includes('vet') || q.includes('driver') || q.includes('courier') || q.includes('uniform') || q.includes('training') || q.includes('trust')) {
    return {
      text: "All HAYD couriers are directly employed and trained to medical standards:\n\n• **Enhanced DBS checked** prior to their first route.\n• **Trained in Good Distribution Practice (GDP)** and patient confidentiality (UK GDPR).\n• Fully uniformed with **photo identification badges**.\n• We **never subcontract** drivers on regulated prescription routes.",
    }
  }

  // 10. Coverage & Locations
  if (q.includes('where') || q.includes('area') || q.includes('location') || q.includes('birmingham') || q.includes('solihull') || q.includes('postcode') || q.includes('midlands') || q.includes('london')) {
    return {
      text: "HAYD is headquartered at **23 Colmore Row, Birmingham (B3 2BS)**.\n\n• **Primary Coverage:** All Birmingham postcodes, Solihull, and the surrounding West Midlands metropolitan area.\n• **Regional & National:** Expanding pharmacy collection routes across major UK metropolitan centres.\n\nTo confirm immediate collection availability for your pharmacy's postcode, call dispatch on **07761 734423**.",
      cta: { text: 'Contact dispatch', href: 'tel:+447761734423' },
    }
  }

  // 11. How to Book or Arrange Collections
  if (q.includes('book') || q.includes('arrange') || q.includes('order') || q.includes('collection') || q.includes('pickup') || q.includes('send') || q.includes('start')) {
    return {
      text: "Arranging a collection is quick and done directly on this website:\n\n1. **Book Online:** Go to [Book a Collection](/request) and enter your dispensary pickup and recipient details.\n2. **Instant Reference Issued:** You immediately receive a unique **HAYD-XXXXXX** code with live tracking.\n3. **Courier Dispatched:** A uniformed courier arrives at your counter with a validated thermal carrier for handover.\n4. **Phone Orders:** You can also call dispatch directly on **07761 734423**.",
      cta: { text: 'Book a collection now', to: '/request' },
    }
  }

  // 12. Cancellations or Route Changes
  if (q.includes('cancel') || q.includes('change') || q.includes('amend') || q.includes('wrong address') || q.includes('modify')) {
    return {
      text: "If you need to update an address, change delivery instructions, or cancel a booked round:\n\n• **Call dispatch immediately:** [07761 734423](tel:+447761734423)\n• Quote your **HAYD-XXXXXX** reference code.\n\nOur operations team communicates directly with the assigned courier to reroute or cancel the collection in real time.",
      cta: { text: 'Call dispatch: 07761 734423', href: 'tel:+447761734423' },
    }
  }

  // 13. Tracking General Questions
  if (q.includes('track') || q.includes('pod') || q.includes('proof') || q.includes('where is')) {
    return {
      text: "You can track any delivery in real time:\n\n• **Quick Search:** Enter your **HAYD-XXXXXX** reference on our [Tracking Page](/track) or type the code directly into this chat!\n• **Electronic POD:** View live courier custody, doorstep signature, and delivery timestamp the moment it's handed over.",
      cta: { text: 'Open tracking page', to: '/track' },
    }
  }

  // 14. Emergency & Medical Disclaimer
  if (q.includes('medical') || q.includes('advice') || q.includes('doctor') || q.includes('sick') || q.includes('ill') || q.includes('pain') || q.includes('emergency')) {
    return {
      text: "⚠️ **Important Clinical Notice:**\nHAYD is a regulated transport partner, not a clinical prescriber. We cannot offer medical advice, dosage guidance, or clinical diagnoses.\n\n• **Life-threatening emergencies:** Call **999** immediately.\n• **Urgent medical queries:** Contact **NHS 111** or your GP.\n• **Medication & dosage queries:** Contact your dispensing pharmacy directly.",
    }
  }

  // 15. Contact / Speak to a Person
  if (q.includes('phone') || q.includes('call') || q.includes('contact') || q.includes('number') || q.includes('email') || q.includes('dispatch') || q.includes('talk') || q.includes('speak') || q.includes('person') || q.includes('human')) {
    return {
      text: "You can reach our live dispatch and operations desk immediately:\n\n• **Dispatch Phone:** [07761 734423](tel:+447761734423) *(Fastest for same-day requests)*\n• **Email:** [healthatyourdoor.co@gmail.com](mailto:healthatyourdoor.co@gmail.com)\n• **Head Office:** Osbourne Suite, 2.08 Imperial and Whitehall, 23 Colmore Row, Birmingham, B3 2BS\n\nStaffed Monday–Saturday, 8:00 AM to 8:00 PM.",
      cta: { text: 'Call dispatch now', href: 'tel:+447761734423' },
    }
  }

  // Default helpful overview
  return {
    text: "Thank you for reaching out to HAYD.\n\nWe provide MHRA-guided, GDP-aligned transport for community pharmacies and clinics — handling scheduled repeat rounds, 2°C–8°C cold-chain, Controlled Drugs, and urgent same-day collections.\n\nHow can I help you today? You can ask about:\n• **Collection cut-offs & delivery times**\n• **Pricing & per-drop rates**\n• **How to book a collection**\n• **Live tracking** *(just enter your HAYD-XXXXXX reference)*",
    cta: { text: 'Book a collection', to: '/request' },
  }
}

/**
 * Parses markdown-like strings: **bold**, [link](/url), and bullets into clean React elements
 */
function FormattedMessage({ text }) {
  if (!text) return null

  // Split lines
  const lines = text.split('\n')

  return (
    <div className="space-y-2 text-[0.825rem] leading-relaxed">
      {lines.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} className="h-1" />

        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-')
        const cleanLine = isBullet ? line.trim().replace(/^[•-]\s*/, '') : line

        // Parse bold & markdown links
        const parts = []
        let remaining = cleanLine
        let keyIdx = 0

        while (remaining.length > 0) {
          // Check for link [text](url)
          const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
          // Check for bold **text**
          const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)

          let firstMatch = null
          let matchType = null

          if (linkMatch && boldMatch) {
            if (linkMatch.index < boldMatch.index) {
              firstMatch = linkMatch
              matchType = 'link'
            } else {
              firstMatch = boldMatch
              matchType = 'bold'
            }
          } else if (linkMatch) {
            firstMatch = linkMatch
            matchType = 'link'
          } else if (boldMatch) {
            firstMatch = boldMatch
            matchType = 'bold'
          }

          if (!firstMatch) {
            parts.push(<span key={keyIdx++}>{remaining}</span>)
            break
          }

          if (firstMatch.index > 0) {
            parts.push(<span key={keyIdx++}>{remaining.slice(0, firstMatch.index)}</span>)
          }

          if (matchType === 'bold') {
            parts.push(
              <strong key={keyIdx++} className="font-semibold text-foreground">
                {firstMatch[1]}
              </strong>
            )
            remaining = remaining.slice(firstMatch.index + firstMatch[0].length)
          } else if (matchType === 'link') {
            const linkText = firstMatch[1]
            const linkUrl = firstMatch[2]
            if (linkUrl.startsWith('http') || linkUrl.startsWith('tel:') || linkUrl.startsWith('mailto:')) {
              parts.push(
                <a
                  key={keyIdx++}
                  href={linkUrl}
                  target={linkUrl.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  className="font-semibold text-[#0d9488] hover:underline"
                >
                  {linkText}
                </a>
              )
            } else {
              parts.push(
                <Link
                  key={keyIdx++}
                  to={linkUrl}
                  className="font-semibold text-[#0d9488] hover:underline"
                >
                  {linkText}
                </Link>
              )
            }
            remaining = remaining.slice(firstMatch.index + firstMatch[0].length)
          }
        }

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-2 pl-1">
              <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-[#0d9488]" />
              <div className="flex-1">{parts}</div>
            </div>
          )
        }

        return <div key={lIdx}>{parts}</div>
      })}
    </div>
  )
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I'm the **HAYD Dispatch Assistant**.\n\nHow can I support your pharmacy or healthcare organisation today? You can ask about **collection cut-offs**, **per-drop rates**, **booking a round**, or enter a **HAYD-XXXXXX tracking code**.",
      time: 'Just now',
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, isTyping])

  const handleSend = async (userText = null) => {
    const textToSend = typeof userText === 'string' ? userText : input
    if (!textToSend || !textToSend.trim()) return

    const userMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    if (typeof userText !== 'string') setInput('')
    setIsTyping(true)

    try {
      const response = await resolveBotResponse(userMessage.text)
      // Realistic brief typing delay
      setTimeout(() => {
        const botMessage = {
          id: String(Date.now() + 1),
          sender: 'bot',
          text: response.text,
          cta: response.cta,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, botMessage])
        setIsTyping(false)
      }, 500)
    } catch {
      setIsTyping(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open HAYD AI Assistant"
          className="group relative flex items-center gap-3 rounded-full bg-[#08162E] px-4 py-3.5 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#0c1f3d] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0d9488] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#0d9488]" />
          </span>
          <MessageSquare className="h-5 w-5 text-white transition-transform group-hover:rotate-6" />
          <span className="text-sm font-semibold tracking-tight">HAYD Dispatch AI</span>
          <span className="hidden items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-medium text-white/80 sm:flex">
            <Sparkles className="h-2.5 w-2.5 text-[#0d9488]" /> 24/7 Support
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex h-[560px] max-h-[85vh] w-[360px] sm:w-[395px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-[#08162E] px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 p-1">
                <img src={haydIconNavy} alt="HAYD logo" className="h-6 w-6 invert object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-bold tracking-tight text-white">
                    HAYD Dispatch Assistant
                  </h3>
                  <span className="flex h-2 w-2 rounded-full bg-[#0d9488]" />
                </div>
                <p className="text-[0.7rem] text-white/70">Regulated Pharmaceutical Logistics</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Contact Header Bar */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2 text-[0.72rem] text-muted-foreground">
            <span>Direct dispatch desk:</span>
            <a
              href="tel:+447761734423"
              className="inline-flex items-center gap-1 font-semibold text-[#0d9488] hover:underline"
            >
              <Phone className="h-3 w-3" /> 07761 734423
            </a>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex gap-2.5',
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {m.sender === 'bot' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#08162E] text-white">
                    <Bot className="h-3.5 w-3.5 text-[#0d9488]" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[86%] rounded-2xl px-4 py-2.5 leading-relaxed',
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-xs'
                      : 'bg-secondary/70 text-foreground border border-border/60 rounded-bl-xs'
                  )}
                >
                  <FormattedMessage text={m.text} />

                  {m.cta && (
                    <div className="mt-3 border-t border-border/50 pt-2">
                      {m.cta.to ? (
                        <Link
                          to={m.cta.to}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:underline"
                        >
                          {m.cta.text}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <a
                          href={m.cta.href}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:underline"
                        >
                          {m.cta.text}
                          <ArrowRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      'mt-1.5 text-[0.625rem]',
                      m.sender === 'user' ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'
                    )}
                  >
                    {m.time}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#08162E] text-white">
                  <Bot className="h-3.5 w-3.5 text-[#0d9488]" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-secondary/70 px-3.5 py-2 text-xs">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="border-t border-border/60 bg-background/50 px-3.5 py-2">
              <p className="mb-1.5 text-[0.68rem] font-semibold text-muted-foreground">
                Suggested questions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-[0.72rem] font-medium text-foreground/85 transition-colors hover:border-foreground/30 hover:bg-secondary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or enter HAYD-XXXXXX to track…"
              className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
