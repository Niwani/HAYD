/**
 * Staff Accounts & Role-Based Access Control (RBAC) for HAYD Operations
 * 
 * Configures enterprise roles, permissions matrix, dynamic user management,
 * and session state for:
 * 1. Super Admin / Operations Controller (Full authority)
 * 2. Logistics Dispatcher (Fleet assignments & booking management)
 * 3. GDP Compliance Officer (Clinical audit, temperature logs & incident review)
 * 4. Field Couriers (Restricted to assigned runs, shift temp logs, and POD verification)
 */

export const ROLES = {
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  COMPLIANCE: 'compliance',
  COURIER: 'staff',
}

export const ROLE_METADATA = {
  admin: {
    id: 'admin',
    name: 'Super Admin',
    badge: 'Operations Controller',
    badgeColor: 'bg-blue-600/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    description: 'Full supervisory authority across all manifests, courier assignments, user administration, and GDP regulatory compliance.',
  },
  dispatcher: {
    id: 'dispatcher',
    name: 'Logistics Dispatcher',
    badge: 'Fleet Dispatch Desk',
    badgeColor: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    description: 'Intake booking, courier assignment, live run sheets, ETA updates, and dispatch communications.',
  },
  compliance: {
    id: 'compliance',
    name: 'GDP Compliance Officer',
    badge: 'Clinical Audit Lead',
    badgeColor: 'bg-purple-600/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    description: 'Audits 2°C–8°C cool bag shift logs, excursion investigations, Controlled Drug two-way custody, and Proof of Delivery signatures.',
  },
  staff: {
    id: 'staff',
    name: 'Field Courier',
    badge: 'Delivery Unit',
    badgeColor: 'bg-teal-600/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
    description: 'Restricted field console. Couriers only see dispatches assigned directly to their vehicle or unit.',
  },
}

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  ASSIGN_COURIERS: 'assign_couriers',
  BOOK_DISPATCH: 'book_dispatch',
  MANAGE_CONSIGNMENTS: 'manage_consignments',
  VIEW_ALL_CONSIGNMENTS: 'view_all_consignments',
  VIEW_ASSIGNED_ONLY: 'view_assigned_only',
  AUDIT_COMPLIANCE: 'audit_compliance',
  MANAGE_INCIDENTS: 'manage_incidents',
  VIEW_ENQUIRIES: 'view_enquiries',
  EXPORT_REPORTS: 'export_reports',
}

export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  dispatcher: [
    PERMISSIONS.ASSIGN_COURIERS,
    PERMISSIONS.BOOK_DISPATCH,
    PERMISSIONS.MANAGE_CONSIGNMENTS,
    PERMISSIONS.VIEW_ALL_CONSIGNMENTS,
    PERMISSIONS.MANAGE_INCIDENTS,
    PERMISSIONS.VIEW_ENQUIRIES,
    PERMISSIONS.EXPORT_REPORTS,
  ],
  compliance: [
    PERMISSIONS.VIEW_ALL_CONSIGNMENTS,
    PERMISSIONS.AUDIT_COMPLIANCE,
    PERMISSIONS.MANAGE_INCIDENTS,
    PERMISSIONS.EXPORT_REPORTS,
  ],
  staff: [
    PERMISSIONS.VIEW_ASSIGNED_ONLY,
    PERMISSIONS.MANAGE_INCIDENTS,
  ],
}

export const INITIAL_STAFF_ACCOUNTS = [
  {
    id: 'admin',
    username: 'admin@thehayd.uk',
    aliases: ['admin', 'hayd-admin', 'controller'],
    password: import.meta.env.VITE_ADMIN_PIN || 'admin2026',
    name: 'Dr. James Campbell',
    role: 'admin',
    title: 'Head of Operations & Operations Controller',
    email: 'healthatyourdoor.co@gmail.com',
    phone: '07761 734423',
    badge: 'Operations Controller',
    status: 'active',
    unit: 'Dispatch Central',
    color: 'from-blue-600 to-indigo-700',
    created_at: '2026-01-15T08:00:00Z',
    description: 'Super Admin authority over all dispensary bookings, live fleet, user accounts, and regulatory compliance.',
  },
  {
    id: 'dispatcher_1',
    username: 'dispatcher@thehayd.uk',
    aliases: ['dispatcher', 'sarah', 'desk'],
    password: import.meta.env.VITE_ADMIN_PIN || 'dispatch2026',
    name: 'Sarah Jenkins',
    role: 'dispatcher',
    title: 'Senior Logistics Coordinator',
    email: 'dispatch@thehayd.uk',
    phone: '07761 734424',
    badge: 'Logistics Coordinator',
    status: 'active',
    unit: 'Desk Unit A',
    color: 'from-emerald-600 to-teal-700',
    created_at: '2026-02-01T09:00:00Z',
    description: 'Manages incoming hospital & community dispensary orders, assigns runs to active units, and tracks live drops.',
  },
  {
    id: 'compliance_1',
    username: 'compliance@thehayd.uk',
    aliases: ['compliance', 'tariq', 'audit'],
    password: import.meta.env.VITE_ADMIN_PIN || 'compliance2026',
    name: 'Dr. Tariq Al-Mansoor',
    role: 'compliance',
    title: 'Superintendent Pharmacist & GDP Quality Lead',
    email: 'compliance@thehayd.uk',
    phone: '07761 734425',
    badge: 'GDP Compliance Officer',
    status: 'active',
    unit: 'Quality & Governance',
    color: 'from-purple-600 to-indigo-700',
    created_at: '2026-02-10T09:00:00Z',
    description: 'Audits cold-chain 2°C–8°C shift logs, temperature excursions, Controlled Drug custody signatures, and SOP compliance.',
  },
  {
    id: 'courier_1',
    username: 'courier1@thehayd.uk',
    aliases: ['courier1', 'marcus', 'staff1'],
    password: import.meta.env.VITE_STAFF_PIN || 'staff2026',
    name: 'Marcus Vance',
    role: 'staff',
    unit: 'Unit 1 — Dedicated Van',
    title: 'Senior Field Courier — GDP & Temperature Control',
    email: 'courier1@thehayd.uk',
    phone: '07761 000101',
    badge: 'Courier Unit 1',
    status: 'active',
    vehicle: 'Mercedes Vito Dual-Temp (2°C–8°C / Ambient) — Reg: VK73 HAY',
    color: 'from-teal-600 to-emerald-700',
    created_at: '2026-02-15T08:00:00Z',
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
    status: 'active',
    vehicle: 'Rapid Response Stat Carrier (CD Certified) — Reg: BK24 HYD',
    color: 'from-cyan-600 to-blue-700',
    created_at: '2026-02-20T08:00:00Z',
    description: 'Restricted view. Only sees collections and patient deliveries assigned specifically to Unit 2.',
  },
]

const AUTH_STORAGE_KEY = 'hayd_active_staff_session_v2'
const USERS_STORAGE_KEY = 'hayd_staff_accounts_v2'

/**
 * Retrieve all registered staff accounts from storage (or initialize defaults)
 */
export function getAllStaffAccounts() {
  if (typeof window === 'undefined') return INITIAL_STAFF_ACCOUNTS
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_STAFF_ACCOUNTS))
      return INITIAL_STAFF_ACCOUNTS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_STAFF_ACCOUNTS
  } catch {
    return INITIAL_STAFF_ACCOUNTS
  }
}

/**
 * Save staff accounts array to persistent storage
 */
function saveAllStaffAccounts(accounts) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(accounts))
  } catch (err) {
    console.error('Failed to save staff accounts:', err)
  }
}

/**
 * Check if a user possesses a specific RBAC permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false
  const permissions = ROLE_PERMISSIONS[user.role] || []
  return permissions.includes(permission)
}

/**
 * Create a new staff account (Admin only)
 */
export function createStaffAccount(data) {
  const accounts = getAllStaffAccounts()
  const cleanUsername = data.username.trim().toLowerCase()

  // Ensure unique username
  if (accounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: 'A staff member with this username or email already exists.' }
  }

  const id = data.id || `staff_${Date.now().toString(36)}`
  const newAccount = {
    id,
    username: cleanUsername,
    aliases: [cleanUsername.split('@')[0]],
    password: data.password || 'staff2026',
    name: data.name,
    role: data.role || 'staff',
    title: data.title || (data.role === 'staff' ? 'Field Courier' : 'Operations Staff'),
    unit: data.unit || 'Standard Unit',
    email: data.email || cleanUsername,
    phone: data.phone || '07761 000000',
    badge: data.badge || (data.role === 'staff' ? `Courier ${data.name.split(' ')[0]}` : 'Staff Member'),
    vehicle: data.vehicle || null,
    status: 'active',
    created_at: new Date().toISOString(),
    color: data.role === 'admin' ? 'from-blue-600 to-indigo-700' : 'from-teal-600 to-emerald-700',
    description: data.description || 'HAYD Staff Member.',
  }

  accounts.push(newAccount)
  saveAllStaffAccounts(accounts)
  return { success: true, account: newAccount }
}

/**
 * Update existing staff account
 */
export function updateStaffAccount(id, patch) {
  const accounts = getAllStaffAccounts()
  const index = accounts.findIndex((a) => a.id === id)
  if (index === -1) return { success: false, error: 'Staff account not found.' }

  accounts[index] = {
    ...accounts[index],
    ...patch,
    updated_at: new Date().toISOString(),
  }
  saveAllStaffAccounts(accounts)
  return { success: true, account: accounts[index] }
}

/**
 * Delete / deactivate a staff account
 */
export function deleteStaffAccount(id) {
  if (id === 'admin') {
    return { success: false, error: 'Cannot delete the primary Super Admin account.' }
  }
  const accounts = getAllStaffAccounts()
  const filtered = accounts.filter((a) => a.id !== id)
  saveAllStaffAccounts(filtered)
  return { success: true }
}

/**
 * Authenticates against registered staff accounts.
 * Accepts username, email, or alias + password.
 * Also supports legacy master PIN 'hayd2026' as admin fallback.
 */
export function authenticateStaff(identifier, password) {
  const cleanId = (identifier || '').trim().toLowerCase()
  const cleanPass = (password || '').trim()

  if (!cleanPass) {
    return { success: false, error: 'Please enter your password or staff passcode.' }
  }

  const accounts = getAllStaffAccounts()

  // Master PIN fallback
  if (cleanPass === 'hayd2026' && (!cleanId || cleanId === 'admin')) {
    const admin = accounts.find((a) => a.role === 'admin') || accounts[0]
    setCurrentStaff(admin)
    return { success: true, user: admin }
  }

  // Lookup matched account
  const account = accounts.find((acc) => {
    if (acc.status === 'suspended') return false
    const matchesUser =
      acc.username.toLowerCase() === cleanId ||
      acc.id.toLowerCase() === cleanId ||
      (acc.aliases && acc.aliases.some((alias) => alias.toLowerCase() === cleanId))
    return matchesUser && acc.password === cleanPass
  })

  if (account) {
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
      status: account.status || 'active',
      permissions: ROLE_PERMISSIONS[account.role] || [],
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
 * Get all available staff couriers for assignment dropdown (active couriers only)
 */
export function getAvailableCouriers() {
  const accounts = getAllStaffAccounts()
  return accounts.filter((acc) => acc.role === 'staff' && acc.status !== 'suspended')
}

/**
 * Lookup staff member by ID
 */
export function getStaffById(staffId) {
  const accounts = getAllStaffAccounts()
  return accounts.find((acc) => acc.id === staffId) || null
}

// Backwards compatibility export:
export const STAFF_ACCOUNTS = INITIAL_STAFF_ACCOUNTS
