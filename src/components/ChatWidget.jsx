import React, { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Phone,
  ArrowRight,
  Minimize2,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import haydIconNavy from '@/assets/hayd-icon-navy.png'

const QUICK_PROMPTS = [
  'What are your collection cut-offs?',
  'How do I arrange a pharmacy collection?',
  'How are cold-chain items & CDs handled?',
  'What is the direct dispatch phone number?',
]

// Intelligent knowledge base for HAYD B2B pharmacy logistics
function getBotResponse(userMsg) {
  const q = userMsg.toLowerCase().trim()

  if (q.includes('cut-off') || q.includes('cut off') || q.includes('hours') || q.includes('time') || q.includes('same-day') || q.includes('same day') || q.includes('late')) {
    return {
      text: "Our core cut-off times and operating hours:\n\n• **Same-day cut-off:** 4:00 PM (delivered typically within 4 hours)\n• **Operating hours:** Monday–Saturday, 8:00 AM – 8:00 PM\n• **Sundays:** Urgent collections and hospital discharges by arrangement\n\nCollections booked after 4:00 PM are routed on the first morning collection round unless an urgent slot is arranged.",
      cta: { text: 'Book a collection', to: '/request' }
    }
  }

  if (q.includes('account') || q.includes('open') || q.includes('start') || q.includes('arrange') || q.includes('book') || q.includes('partner') || q.includes('pricing') || q.includes('cost') || q.includes('quote')) {
    return {
      text: "Getting started with HAYD is simple and done directly through this website:\n\n1. **Book Online:** Submit your collection details anytime via our [Book a Collection](/request) page or send an enquiry on our [Contact page](/contact).\n2. **Call or Email Us:** Call our dispatch team directly on [07761 734423](tel:+447761734423) or email [healthatyourdoor.co@gmail.com](mailto:healthatyourdoor.co@gmail.com).\n3. **Flexible Setup:** We agree your daily pickup times and start collections right away — no complicated onboarding paperwork or lock-in contracts.",
      cta: { text: 'Book a collection', to: '/request' }
    }
  }

  if (q.includes('cold') || q.includes('fridge') || q.includes('temperature') || q.includes('cd') || q.includes('controlled') || q.includes('drugs') || q.includes('schedule')) {
    return {
      text: "We provide dedicated compliance for high-integrity lines:\n\n• **Cold-Chain (2°C–8°C):** Validated thermal transport pouches with temperature logging, keeping vaccines, insulins, and biologics within strict regulatory limits.\n• **Controlled Drugs (CD Schedule 2 & 3):** Moved on secure, dedicated routes with named courier chain of custody, tamper-evident seals, and photo/ID-verified recipient signatures.\n\nAll prescription categories are consolidated on your single reconciled manifest.",
      cta: { text: 'Explore our services', to: '/services' }
    }
  }

  if (q.includes('phone') || q.includes('call') || q.includes('urgent') || q.includes('contact') || q.includes('number') || q.includes('dispatch') || q.includes('talk to a human') || q.includes('speak')) {
    return {
      text: "You can reach our live dispatch and operations team immediately:\n\n• **Dispatch Phone:** [07761 734423](tel:+447761734423)\n• **Email:** [healthatyourdoor.co@gmail.com](mailto:healthatyourdoor.co@gmail.com)\n• **Office:** Osbourne Suite, 2.08 Imperial and Whitehall, 23 Colmore Row, Birmingham, B3 2BS\n\nDispatch is staffed Monday to Saturday, 8am to 8pm.",
      cta: { text: 'Call dispatch now', href: 'tel:+447761734423' }
    }
  }

  if (q.includes('track') || q.includes('pod') || q.includes('proof') || q.includes('signature') || q.includes('manifest') || q.includes('where is')) {
    return {
      text: "Every consignment includes complete audit traceability:\n\n• **Real-Time Tracking:** Enter your HAYD consignment or prescription reference on our tracking page.\n• **Proof of Delivery (POD):** Geo-stamped delivery logs and digital signatures are returned against your manifest the same day.\n• **Auditing:** All manifest records are archived and inspection-ready.",
      cta: { text: 'Track a consignment', to: '/track' }
    }
  }

  if (q.includes('where') || q.includes('area') || q.includes('coverage') || q.includes('location') || q.includes('birmingham') || q.includes('london')) {
    return {
      text: "HAYD operates throughout the West Midlands (headquartered at 23 Colmore Row, Birmingham) with dedicated route coverage expanding across major UK metropolitan centres.\n\nContact dispatch to confirm the exact collection slots and delivery postcodes available for your pharmacy.",
      cta: { text: 'Check coverage with dispatch', to: '/contact' }
    }
  }

  if (q.includes('medical') || q.includes('advice') || q.includes('doctor') || q.includes('ill') || q.includes('emergency') || q.includes('sick')) {
    return {
      text: "⚠️ **Important Clinical Notice:**\nHAYD is a regulated pharmaceutical transport logistics partner, not a prescriber. We do not provide clinical or medical advice.\n\n• For medical emergencies, call **999** immediately.\n• For urgent clinical guidance, contact your GP or call **NHS 111**."
    }
  }

  // Default helpful overview
  return {
    text: "Thank you for reaching out to HAYD.\n\nWe provide MHRA-guided, GDP-aligned transport for community pharmacies, clinics, and healthcare organisations — covering scheduled repeat delivery rounds, cold-chain (2–8°C), and urgent same-day collections.\n\nWould you like assistance with **cut-off times**, **booking a collection**, **tracking a delivery**, or **speaking directly with dispatch**?",
    cta: { text: 'Contact operations', to: '/contact' }
  }
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I'm the **HAYD Dispatch Assistant**. How can I support your pharmacy or healthcare organisation today?",
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

  const handleSend = (userText = null) => {
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

    // Simulate natural response latency
    setTimeout(() => {
      const response = getBotResponse(userMessage.text)
      const botMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: response.text,
        cta: response.cta,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 600)
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
            <Sparkles className="h-2.5 w-2.5 text-[#0d9488]" /> 24/7 Help
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex h-[540px] max-h-[82vh] w-[360px] sm:w-[390px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-[#08162E] px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 p-1">
                <img src={haydIconNavy} alt="HAYD logo" className="h-6 w-6 invert object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-bold tracking-tight text-white">
                    HAYD Dispatch AI
                  </h3>
                  <span className="flex h-2 w-2 rounded-full bg-[#0d9488]" />
                </div>
                <p className="text-[0.7rem] text-white/70">Operational & Onboarding Support</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Contact Banner */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2 text-[0.72rem] text-muted-foreground">
            <span>Need immediate dispatch?</span>
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
                    'max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed',
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-xs'
                      : 'bg-secondary/70 text-foreground border border-border/60 rounded-bl-xs'
                  )}
                >
                  <div className="whitespace-pre-line text-[0.825rem]">
                    {m.text}
                  </div>

                  {m.cta && (
                    <div className="mt-3 border-t border-border/40 pt-2">
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
                      'mt-1 text-[0.625rem]',
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
            <div className="border-t border-border/60 bg-background/50 px-3 py-2">
              <p className="mb-1.5 text-[0.68rem] font-medium text-muted-foreground">
                Suggested questions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-[0.72rem] text-foreground/80 transition-colors hover:border-foreground/30 hover:bg-secondary"
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
              placeholder="Ask about cut-offs, accounts, routes…"
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

