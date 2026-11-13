import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  X,
  Send,
  Users,
  User,
  Radio,
  Eye,
  Shield,
  Clock,
  Sparkles,
  Phone,
  Check,
  CheckCheck,
  Minimize2,
  Maximize2,
  ChevronDown,
} from 'lucide-react'
import { STAFF_ACCOUNTS, getAvailableCouriers, getStaffById } from '@/lib/staffAuth'
import { cn } from '@/lib/utils'
import haydIconNavy from '@/assets/hayd-icon-navy.png'

const STAFF_CHAT_STORAGE_KEY = 'hayd_staff_comms_messages_v1'

const SEED_MESSAGES = [
  // 1. All-Staff Group Channel
  {
    id: 'm1',
    channel_id: 'all-staff',
    sender_id: 'admin',
    sender_name: 'Operations Controller',
    sender_badge: '👑 Admin',
    text: 'Good morning Marcus and Amara. Solihull & Harborne cut-off rounds are active. Calibrated thermal boxes verified for Unit 1 and Unit 2.',
    timestamp: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: 'm2',
    channel_id: 'all-staff',
    sender_id: 'courier_1',
    sender_name: 'Marcus Vance',
    sender_badge: '🚚 Unit 1',
    text: 'Morning Controller. Unit 1 van prepped. Calibrated cold-chain box verified at 3.9°C. Starting first dispensary pickup.',
    timestamp: new Date(Date.now() - 4800000).toISOString(),
  },
  {
    id: 'm3',
    channel_id: 'all-staff',
    sender_id: 'courier_2',
    sender_name: 'Amara Okafor',
    sender_badge: '⚡ Unit 2',
    text: 'Unit 2 stat bike online. Standing by for rapid stat calls and Controlled Drug urgent transfers.',
    timestamp: new Date(Date.now() - 4200000).toISOString(),
  },

  // 2. Admin <-> Marcus Vance
  {
    id: 'm4',
    channel_id: 'admin_courier_1',
    sender_id: 'admin',
    sender_name: 'Operations Controller',
    sender_badge: '👑 Admin',
    text: 'Marcus, St Mary Pharmacy (HAYD-8F2K9Q) has a cold-chain pack ready. Please confirm custody logger before departure.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'm5',
    channel_id: 'admin_courier_1',
    sender_id: 'courier_1',
    sender_name: 'Marcus Vance',
    sender_badge: '🚚 Unit 1',
    text: 'Collected from pharmacist counter. Calibrated logger reads 4.2°C. Heading towards Harborne Moor Pool for doorstep delivery.',
    timestamp: new Date(Date.now() - 2400000).toISOString(),
  },

  // 3. Admin <-> Amara Okafor
  {
    id: 'm6',
    channel_id: 'admin_courier_2',
    sender_id: 'admin',
    sender_name: 'Operations Controller',
    sender_badge: '👑 Admin',
    text: 'Amara, Edgbaston Medical has an urgent Schedule 2 CD item. Ensure named photo ID check upon doorstep handover.',
    timestamp: new Date(Date.now() - 2800000).toISOString(),
  },
  {
    id: 'm7',
    channel_id: 'admin_courier_2',
    sender_id: 'courier_2',
    sender_name: 'Amara Okafor',
    sender_badge: '⚡ Unit 2',
    text: 'Understood Controller. Custody register ready for pharmacist countersign and patient verification.',
    timestamp: new Date(Date.now() - 2100000).toISOString(),
  },

  // 4. Courier-to-Courier (Marcus <-> Amara) — Visible to both AND to Admin in Omniscience Mode!
  {
    id: 'm8',
    channel_id: 'courier_1_courier_2',
    sender_id: 'courier_1',
    sender_name: 'Marcus Vance',
    sender_badge: '🚚 Unit 1',
    text: 'Amara, avoid Bristol Road near Selly Oak — major utility roadworks causing 15 min delays.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'm9',
    channel_id: 'courier_1_courier_2',
    sender_id: 'courier_2',
    sender_name: 'Amara Okafor',
    sender_badge: '⚡ Unit 2',
    text: 'Thanks Marcus! Routing via Harborne Road instead for the Edgbaston run.',
    timestamp: new Date(Date.now() - 1500000).toISOString(),
  },
]

function getStoredMessages() {
  try {
    const raw = localStorage.getItem(STAFF_CHAT_STORAGE_KEY)
    if (!raw) return SEED_MESSAGES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : SEED_MESSAGES
  } catch {
    return SEED_MESSAGES
  }
}

function saveMessages(messages) {
  try {
    localStorage.setItem(STAFF_CHAT_STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // ignore
  }
}

export function StaffChatWidget({ currentStaff }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeChannelId, setActiveChannelId] = useState('all-staff')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef(null)

  // Load messages from localStorage on mount and on storage events
  useEffect(() => {
    setMessages(getStoredMessages())

    const handleStorageChange = (e) => {
      if (e.key === STAFF_CHAT_STORAGE_KEY) {
        setMessages(getStoredMessages())
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Auto-scroll to bottom of active thread
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeChannelId, isOpen])

  if (!currentStaff) return null

  // -------------------------------------------------------------
  // BUILD CHAT CHANNELS LIST BASED ON LOGGED-IN STAFF ROLE
  // -------------------------------------------------------------
  const couriers = getAvailableCouriers()
  const channels = []

  // 1. Group Channel (Always visible to all staff)
  channels.push({
    id: 'all-staff',
    type: 'group',
    title: '#all-staff (Team Dispatch Radio)',
    shortTitle: '#all-staff',
    icon: Radio,
    description: 'Broadcast channel for all field units and dispatch controller.',
    badge: 'Team Radio',
  })

  // 2. Direct Channels based on role
  if (currentStaff.role === 'admin') {
    // ADMIN SEES ALL THREADS!
    channels.push({
      id: 'admin_courier_1',
      type: 'direct',
      title: 'Marcus Vance (Unit 1)',
      shortTitle: 'Marcus (Unit 1)',
      icon: User,
      partner: getStaffById('courier_1'),
      badge: 'Direct Chat',
    })
    channels.push({
      id: 'admin_courier_2',
      type: 'direct',
      title: 'Amara Okafor (Unit 2)',
      shortTitle: 'Amara (Unit 2)',
      icon: User,
      partner: getStaffById('courier_2'),
      badge: 'Direct Chat',
    })
    // ADMIN OMNISCIENCE: Can supervise courier-to-courier channel
    channels.push({
      id: 'courier_1_courier_2',
      type: 'supervisory',
      title: '👁️ Marcus ↔ Amara (Supervisory View)',
      shortTitle: 'Marcus ↔ Amara',
      icon: Eye,
      description: 'Admin supervisory oversight of field courier-to-courier communications.',
      badge: 'Supervisor Audit',
    })
  } else if (currentStaff.id === 'courier_1') {
    // MARCUS SEES: Admin and Amara
    channels.push({
      id: 'admin_courier_1',
      type: 'direct',
      title: 'Operations Controller (Admin)',
      shortTitle: 'Operations Admin',
      icon: Shield,
      partner: getStaffById('admin'),
      badge: 'Controller Desk',
    })
    channels.push({
      id: 'courier_1_courier_2',
      type: 'direct',
      title: 'Amara Okafor (Unit 2 Rapid Stat)',
      shortTitle: 'Amara (Unit 2)',
      icon: User,
      partner: getStaffById('courier_2'),
      badge: 'Field Courier',
    })
  } else if (currentStaff.id === 'courier_2') {
    // AMARA SEES: Admin and Marcus
    channels.push({
      id: 'admin_courier_2',
      type: 'direct',
      title: 'Operations Controller (Admin)',
      shortTitle: 'Operations Admin',
      icon: Shield,
      partner: getStaffById('admin'),
      badge: 'Controller Desk',
    })
    channels.push({
      id: 'courier_1_courier_2',
      type: 'direct',
      title: 'Marcus Vance (Unit 1 Van)',
      shortTitle: 'Marcus (Unit 1)',
      icon: User,
      partner: getStaffById('courier_1'),
      badge: 'Field Courier',
    })
  }

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0]

  // Filter messages for active thread
  const activeMessages = messages.filter((m) => m.channel_id === activeChannel.id)

  const handleSendMessage = (customText = null) => {
    const textToSend = (customText || input).trim()
    if (!textToSend) return

    const newMsg = {
      id: `m_${Date.now()}`,
      channel_id: activeChannel.id,
      sender_id: currentStaff.id,
      sender_name: currentStaff.name,
      sender_badge: currentStaff.badge,
      text: textToSend,
      timestamp: new Date().toISOString(),
    }

    const updated = [...messages, newMsg]
    setMessages(updated)
    saveMessages(updated)
    setInput('')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* ========================================================= */}
      {/* LAUNCHER PILL BUTTON */}
      {/* ========================================================= */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 rounded-full bg-[#08162E] px-4 py-3 text-white shadow-2xl transition-all hover:bg-primary hover:scale-[1.03] active:scale-95 border border-white/20"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
            <Radio className="h-4 w-4 text-[#0d9488] animate-pulse" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0d9488] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#0d9488]" />
            </span>
          </div>

          <div className="text-left pr-1">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-xs font-bold text-white">
                Dispatch Radio & Comms
              </span>
            </div>
            <span className="block text-[0.65rem] text-white/70">
              {currentStaff.role === 'admin' ? '👑 All staff channels active' : `🚚 ${currentStaff.name}`}
            </span>
          </div>
        </button>
      )}

      {/* ========================================================= */}
      {/* CHAT DRAWER / WINDOW */}
      {/* ========================================================= */}
      {isOpen && (
        <div className="flex flex-col h-[540px] w-[380px] sm:w-[480px] rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Main Top Header */}
          <div className="flex items-center justify-between border-b border-border bg-[#08162E] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 p-1">
                <img src={haydIconNavy} alt="HAYD" className="h-full w-full invert object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading text-xs font-bold text-white">
                    HAYD Internal Comms & Dispatch Radio
                  </h3>
                  <span className="h-2 w-2 rounded-full bg-[#0d9488]" />
                </div>
                <p className="text-[0.68rem] text-white/70">
                  Active user: <strong className="text-white">{currentStaff.name}</strong> ({currentStaff.badge})
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* CHANNEL / THREAD SELECTOR TABS */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-secondary/40 px-3 py-2 text-xs scrollbar-none">
            {channels.map((chan) => {
              const Icon = chan.icon
              const isSelected = chan.id === activeChannel.id
              const isSupervisory = chan.type === 'supervisory'

              return (
                <button
                  key={chan.id}
                  onClick={() => setActiveChannelId(chan.id)}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-[0.72rem] font-semibold transition-all shrink-0',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isSupervisory
                      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{chan.shortTitle}</span>
                </button>
              )
            })}
          </div>

          {/* Channel Info Banner */}
          <div className="flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-1.5 text-[0.68rem] text-muted-foreground">
            <span className="font-semibold text-foreground truncate">
              {activeChannel.title}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.62rem] font-bold text-accent">
              {activeChannel.badge}
            </span>
          </div>

          {/* Supervisory Notice if Admin in Courier thread */}
          {activeChannel.type === 'supervisory' && (
            <div className="border-b border-purple-500/20 bg-purple-500/10 px-4 py-2 text-[0.68rem] text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span>
                <strong>Admin Omniscience Mode:</strong> You are monitoring private courier comms between Marcus and Amara.
              </span>
            </div>
          )}

          {/* ========================================================= */}
          {/* MESSAGES STREAM */}
          {/* ========================================================= */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
            {activeMessages.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-1">
                <MessageSquare className="h-6 w-6 mx-auto opacity-40" />
                <p className="font-semibold text-xs text-foreground">No messages in this thread yet</p>
                <p className="text-[0.68rem]">Send a message to start communicating with field units.</p>
              </div>
            ) : (
              activeMessages.map((msg) => {
                const isMe = msg.sender_id === currentStaff.id
                const isSenderAdmin = msg.sender_id === 'admin'
                const isSenderMarcus = msg.sender_id === 'courier_1'
                const isSenderAmara = msg.sender_id === 'courier_2'

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col',
                      isMe ? 'items-end' : 'items-start'
                    )}
                  >
                    {/* Sender Label */}
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[0.65rem] text-muted-foreground">
                      <span className="font-bold text-foreground">{msg.sender_name}</span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.2 text-[0.6rem] font-semibold',
                          isSenderAdmin
                            ? 'bg-blue-600/15 text-blue-600'
                            : isSenderMarcus
                            ? 'bg-emerald-600/15 text-emerald-600'
                            : 'bg-teal-600/15 text-teal-600'
                        )}
                      >
                        {msg.sender_badge}
                      </span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Bubble */}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm',
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-xs'
                          : 'bg-secondary/80 text-foreground border border-border/70 rounded-bl-xs'
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Operational Phrases */}
          <div className="border-t border-border/60 bg-secondary/30 px-3 py-1.5 flex flex-wrap items-center gap-1 text-[0.65rem]">
            <span className="text-muted-foreground font-semibold">Quick radio:</span>
            {[
              '📍 Arrived at counter',
              '🧊 Cold-chain 3.9°C verified',
              '⏱️ En route, ETA 15 mins',
              '✍️ Doorstep signed & complete',
              '⚠️ Heavy traffic on route',
            ].map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => handleSendMessage(phrase)}
                className="rounded-full border border-border bg-card px-2 py-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${activeChannel.shortTitle}…`}
              className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

