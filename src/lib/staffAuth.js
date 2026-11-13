/**
 * Staff Accounts & Role-Based Access Control for HAYD Operations
 * 
 * Configures:
 * 1. Admin / Controller Account (sees all consignments, assigns couriers)
 * 2. Staff Courier 1 (Marcus Vance - Unit 1 Van)
 * 3. Staff Courier 2 (Amara Okafor - Unit 2 Rapid Stat)
 */

export const STAFF_ACCOUNTS = [
  {
    id: 'admin',
    username: 'admin@thehayd.uk',
    aliases: ['admin', 'hayd-admin', 'controller'],
    password: import.meta.env.VITE_ADMIN_PIN || 'admin2026',
    name: 'Operations Controller',
    role: 'admin',
    title: 'Head of Operations & Dispatch Desk',
    email: 'healthatyourdoor.co@gmail.com',
    phone: '07761 734423',
    badge: 'Operations Admin',
    color: 'from-blue-600 to-indigo-700',
    description: 'Full supervisory authority. Receives all online bookings, monitors live runs, and assigns dispatches to couriers.',
  },
  {
    id: 'courier_1',
    username: 'courier1@thehayd.uk',
    aliases: ['courier1', 'marcus', 'staff1'],
    password: import.meta.env.VITE_STAFF_PIN || 'staff2026',
    name: 'Marcus Vance',
    role: 'staff',
    unit: 'Unit 1 — Dedicated Van',
    title: 'Senior Courier — GDP & Temperature Control',
    email: 'courier1@thehayd.uk',
    phone: '07761 000101',
    badge: 'Courier Unit 1',
    vehicle: 'Mercedes Vito Dual-Temp (2°C–8°C / Ambient)',
    color: 'from-emerald-600 to-teal-700',
    description: 'Restricted view. Only sees collections and patient deliveries assigned specifically to Unit 1.',
  },
  {
    id: 'courier_2',
    username: 'courier2@thehayd.uk',
    aliases: ['courier2', 'amara', 'staff2'],
    password: import.meta.env.VITE_STAFF_PIN || 'staff2026',
    name: 'Amara Okafor',
    role: 'staff',
    unit: 'Unit 2 — Rapid Stat Moto',
    title: 'Rapid Stat Courier — Urgent & Controlled Drugs',
    email: 'courier2@thehayd.uk',
    phone: '07761 000102',
    badge: 'Courier Unit 2',
    vehicle: 'Rapid Response Stat Carrier (CD Certified)',
    color: 'from-teal-600 to-cyan-700',
    description: 'Restricted view. Only sees collections and patient deliveries assigned specifically to Unit 2.',
  },
]

const AUTH_STORAGE_KEY = 'hayd_active_staff_session_v1'

/**
 * Authenticates against defined staff accounts.
 * Accepts username, email, or alias + password.
 * Also supports legacy master PIN 'hayd2026' as admin fallback.
 */
export function authenticateStaff(identifier, password) {
  const cleanId = (identifier || '').trim().toLowerCase()
  const cleanPass = (password || '').trim()

  if (!cleanPass) {
    return { success: false, error: 'Please enter your password or staff passcode.' }
  }

  // Legacy master PIN fallback grants admin
  if (cleanPass === 'hayd2026' && (!cleanId || cleanId === 'admin')) {
    const admin = STAFF_ACCOUNTS[0]
    setCurrentStaff(admin)
    return { success: true, user: admin }
  }

  // Check matched account
  const account = STAFF_ACCOUNTS.find((acc) => {
    const matchesUser =
      acc.username.toLowerCase() === cleanId ||
      acc.id.toLowerCase() === cleanId ||
      acc.aliases.some((alias) => alias.toLowerCase() === cleanId)
    return matchesUser && acc.password === cleanPass
  })

  if (account) {
    // Clone without exposing raw password in session
    const safeUser = {
      id: account.id,
      username: account.username,
      name: account.name,
      role: account.role,
      unit: account.unit || null,
      title: account.title,
      email: account.email,
      phone: account.phone,
      badge: account.badge,
      vehicle: account.vehicle || null,
      color: account.color,
    }
    setCurrentStaff(safeUser)
    return { success: true, user: safeUser }
  }

  return {
    success: false,
    error: 'Invalid staff username or password. Check credentials with the operations manager.',
  }
}

/**
 * Retrieve currently logged-in staff member from session storage
 */
export function getCurrentStaff() {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Persist staff member in session storage
 */
export function setCurrentStaff(user) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  } catch {
    // ignore
  }
}

/**
 * Log out and clear session
 */
export function clearCurrentStaff() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem('hayd_dispatch_auth')
  } catch {
    // ignore
  }
}

/**
 * Get all available staff couriers for assignment dropdown (excluding admin)
 */
export function getAvailableCouriers() {
  return STAFF_ACCOUNTS.filter((acc) => acc.role === 'staff')
}

/**
 * Lookup staff member by ID
 */
export function getStaffById(staffId) {
  return STAFF_ACCOUNTS.find((acc) => acc.id === staffId) || null
}

