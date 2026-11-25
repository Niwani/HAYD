import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Package,
  Truck,
  Users,
  AlertTriangle,
  FileCheck,
  Search,
  PlusCircle,
  Copy,
  Printer,
  Scan,
  RefreshCw,
  LogOut,
  KeyRound,
  CheckCircle2,
  Clock3,
  MapPin,
  Building2,
  Phone,
  Mail,
  Navigation,
  Share2,
  ThermometerSnowflake,
  RotateCcw,
  UserCheck,
  Check,
  ExternalLink,
  ChevronRight,
  Filter,
  ShieldAlert,
  SlidersHorizontal,
  Lock,
  Unlock,
  Eye,
  UserPlus,
  Send,
  LoaderCircle,
  TrendingUp,
} from 'lucide-react'
import { storageClient } from '@/lib/storage'
import {
  ROLES,
  ROLE_METADATA,
  PERMISSIONS,
  hasPermission,
  getAllStaffAccounts,
  createStaffAccount,
  updateStaffAccount,
  deleteStaffAccount,
  authenticateStaff,
  getCurrentStaff,
  setCurrentStaff,
  clearCurrentStaff,
  getAvailableCouriers,
} from '@/lib/staffAuth'
import { sendStatusUpdateEmail, getTrackingUrl } from '@/lib/email'
import AdminBookingSteps from '@/components/AdminBookingSteps'
import ParcelLabelModal from '@/components/ParcelLabelModal'
import DeliveryScanModal from '@/components/DeliveryScanModal'
import ShiftCoolBagModal from '@/components/ShiftCoolBagModal'
import CdHandoverModal from '@/components/CdHandoverModal'
import IncidentReportModal from '@/components/IncidentReportModal'
import { StaffChatWidget } from '@/components/StaffChatWidget'
import { cn } from '@/lib/utils'
import haydIconNavy from '@/assets/hayd-icon-navy.png'

const TABS = [
  { id: 'dashboard', label: 'Operations Dashboard', icon: TrendingUp },
  { id: 'manifests', label: 'Consignments & Runs', icon: Package },
  { id: 'fleet', label: 'Fleet & Couriers', icon: Truck },
  { id: 'compliance', label: 'GDP & Clinical Audit', icon: ShieldCheck },
  { id: 'users', label: 'Staff & RBAC Accounts', icon: Users, permission: PERMISSIONS.MANAGE_USERS },
  { id: 'enquiries', label: 'Customer Inquiries', icon: Mail, permission: PERMISSIONS.VIEW_ENQUIRIES },
]

export default function Admin() {
  const navigate = useNavigate()

  // Auth state
  const [currentStaff, setCurrentStaffState] = useState(null)
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('dashboard')

  // Operational Data state
  const [consignments, setConsignments] = useState([])
  const [staffAccounts, setStaffAccounts] = useState([])
  const [shiftTempLogs, setShiftTempLogs] = useState([])
  const [incidentReports, setIncidentReports] = useState([])
  const [contactMessages, setContactMessages] = useState([])

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | unassigned | verifying | dispatched | delivered | cancelled
  const [tierFilter, setTierFilter] = useState('all') // all | cold_chain | controlled_drugs | standard
  const [courierFilter, setCourierFilter] = useState('all')

  // Booking Intake Wizard Modal
  const [showBookingWizard, setShowBookingWizard] = useState(false)

  // Consignment Action Modals
  const [labelModalItem, setLabelModalItem] = useState(null)
  const [scanModalItem, setScanModalItem] = useState(null)
  const [cdModalConfig, setCdModalConfig] = useState(null)
  const [showShiftTempModal, setShowShiftTempModal] = useState(false)
  const [incidentModalConfig, setIncidentModalConfig] = useState(null)

  // User Management Modal
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'staff',
    unit: 'Unit 3 — Van',
    phone: '',
    vehicle: '',
    title: '',
  })
  const [userActionSuccess, setUserActionSuccess] = useState('')
  const [userActionError, setUserActionError] = useState('')

  // Copied notifications
  const [copiedRef, setCopiedRef] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // Initial Auth Check
  useEffect(() => {
    const saved = getCurrentStaff()
    if (saved) {
      setCurrentStaffState(saved)
    }
  }, [])

  // Load All System Records
  useEffect(() => {
    if (currentStaff) {
      loadAllData()
    }
  }, [currentStaff])

  const loadAllData = async () => {
    try {
      const items = await storageClient.entities.TrackStatus.list()
      setConsignments(items)

      const users = getAllStaffAccounts()
      setStaffAccounts(users)

      const temps = await storageClient.entities.ShiftTempLog.list()
      setShiftTempLogs(temps)

      const incidents = await storageClient.entities.IncidentReport.list()
      setIncidentReports(incidents)

      const msgs = (await storageClient.entities.ContactMessage?.list?.()) || []
      setContactMessages(msgs)
    } catch (err) {
      console.error('Failed to load admin data:', err)
    }
  }

  // Handle Login
  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault()
    setAuthError('')

    const res = authenticateStaff(loginIdentifier, loginPassword)
    if (res.success) {
      setCurrentStaffState(res.user)
      setLoginIdentifier('')
      setLoginPassword('')
    } else {
      setAuthError(res.error || 'Authentication failed.')
    }
  }

  // Quick One-Click Login for Demo/Testing
  const handleQuickLogin = (username, pass) => {
    const res = authenticateStaff(username, pass)
    if (res.success) {
      setCurrentStaffState(res.user)
      setAuthError('')
    }
  }

  // Handle Logout
  const handleLogout = () => {
    clearCurrentStaff()
    setCurrentStaffState(null)
  }

  // Courier Assignment Action
  const handleAssignCourier = async (ref, staffId) => {
    try {
      const staffMember = staffAccounts.find((s) => s.id === staffId)
      const staffName = staffMember ? `${staffMember.name} (${staffMember.badge})` : null
      const note = staffMember
        ? `Assigned to ${staffMember.name} (${staffMember.unit || 'Courier Desk'}) for collection & delivery.`
        : 'Unassigned. Returned to dispatch pool.'

      const updated = await storageClient.entities.TrackStatus.assign(ref, {
        staffId: staffId || null,
        staffName,
        note,
      })

      if (updated) {
        setActionSuccess(`Assigned ${ref} to ${staffName || 'Pool'}!`)
        setTimeout(() => setActionSuccess(''), 3500)
        await loadAllData()
      }
    } catch (err) {
      console.error('Assignment error:', err)
    }
  }

  // Status Update Action
  const handleStatusUpdate = async (item, status, note, extra = {}) => {
    const now = new Date()
    try {
      await storageClient.entities.TrackStatus.update(item.reference, {
        status,
        note: note || `Status updated to ${status} by ${currentStaff.name}.`,
        updated_by: `${currentStaff.name} (${currentStaff.badge})`,
        updated_date: now.toISOString(),
        ...extra,
      })
      setActionSuccess(`Status updated to ${status}!`)
      setTimeout(() => setActionSuccess(''), 3500)
      await loadAllData()
    } catch (err) {
      console.error('Update status error:', err)
    }
  }

  // Create New Staff User
  const handleCreateUser = (e) => {
    e.preventDefault()
    setUserActionError('')
    setUserActionSuccess('')

    if (!newUserData.name || !newUserData.username || !newUserData.password) {
      setUserActionError('Please fill in all required fields.')
      return
    }

    const res = createStaffAccount(newUserData)
    if (res.success) {
      setUserActionSuccess(`Staff account created for ${newUserData.name}!`)
      setStaffAccounts(getAllStaffAccounts())
      setShowAddUserModal(false)
      setNewUserData({
        name: '',
        username: '',
        password: '',
        role: 'staff',
        unit: 'Unit 3 — Van',
        phone: '',
        vehicle: '',
        title: '',
      })
      setTimeout(() => setUserActionSuccess(''), 4000)
    } else {
      setUserActionError(res.error || 'Failed to create account.')
    }
  }

  // Toggle User Active / Suspended Status
  const handleToggleUserStatus = (account) => {
    if (account.id === 'admin') return
    const newStatus = account.status === 'suspended' ? 'active' : 'suspended'
    updateStaffAccount(account.id, { status: newStatus })
    setStaffAccounts(getAllStaffAccounts())
    setUserActionSuccess(`Account ${account.name} is now ${newStatus}.`)
    setTimeout(() => setUserActionSuccess(''), 3500)
  }

  // Delete User Account
  const handleDeleteUser = (account) => {
    if (account.id === 'admin') return
    if (!window.confirm(`Are you sure you want to remove ${account.name}'s account?`)) return
    const res = deleteStaffAccount(account.id)
    if (res.success) {
      setStaffAccounts(getAllStaffAccounts())
      setUserActionSuccess(`Removed account ${account.name}.`)
      setTimeout(() => setUserActionSuccess(''), 3500)
    }
  }

  // -------------------------------------------------------------
  // VIEW: LOGIN SCREEN (if unauthenticated)
  // -------------------------------------------------------------
  if (!currentStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071120] px-4 py-12 text-slate-100">
        <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0c182c] p-8 md:p-10 shadow-2xl text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-3 shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>

          <div>
            <span className="inline-block rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-widest text-blue-400">
              Restricted Operations Area
            </span>
            <h1 className="mt-2 font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              HAYD Admin Control Center
            </h1>
            <p className="mt-2 text-xs md:text-sm text-slate-400 leading-relaxed">
              Full Role-Based Access Control (RBAC). Super Admin, Fleet Dispatchers, and GDP Compliance Officers.
            </p>
          </div>

          {/* Quick Demo Credentials */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[0.68rem]">
                One-Click Quick Sign-In (Demo Testing)
              </span>
              <span className="text-[0.65rem] text-blue-400 font-semibold">RBAC Profiles</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@thehayd.uk', 'admin2026')}
                className="flex flex-col items-start rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5 text-left hover:border-blue-500 hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span>👑</span>
                  <span>Super Admin</span>
                </div>
                <span className="text-[0.65rem] text-slate-400 mt-1">Full Authority</span>
                <span className="text-[0.6rem] text-blue-400 font-mono mt-0.5">admin@thehayd.uk</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dispatcher@thehayd.uk', 'admin2026')}
                className="flex flex-col items-start rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5 text-left hover:border-emerald-500 hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span>🚚</span>
                  <span>Dispatcher</span>
                </div>
                <span className="text-[0.65rem] text-slate-400 mt-1">Fleet & Booking</span>
                <span className="text-[0.6rem] text-emerald-400 font-mono mt-0.5">dispatcher@thehayd.uk</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('compliance@thehayd.uk', 'admin2026')}
                className="flex flex-col items-start rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5 text-left hover:border-purple-500 hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span>🔬</span>
                  <span>Compliance</span>
                </div>
                <span className="text-[0.65rem] text-slate-400 mt-1">GDP Quality Lead</span>
                <span className="text-[0.6rem] text-purple-400 font-mono mt-0.5">compliance@thehayd.uk</span>
              </button>
            </div>
          </div>

          {/* Form Sign-In */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Staff Email or Username
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. admin@thehayd.uk or dispatcher"
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Passcode / Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password or passcode"
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 font-mono text-sm tracking-wider text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs font-semibold text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white hover:opacity-95 transition-all shadow-lg active:scale-98"
            >
              <KeyRound className="h-4 w-4" />
              Sign In to Admin Console
            </button>
          </form>

          <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Field Courier?</span>
            <Link to="/dispatch" className="text-blue-400 font-semibold hover:underline flex items-center gap-1">
              Go to Courier Driver Console →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // RBAC GUARD: IF A FIELD COURIER ATTEMPTS TO OPEN ADMIN
  // -------------------------------------------------------------
  if (currentStaff.role === 'staff') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center space-y-4 shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Access Restricted (RBAC)
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your account (<strong>{currentStaff.name}</strong>) is registered as a <strong>Field Courier ({currentStaff.unit})</strong>.
            The Admin Control Center is restricted to Operations Controllers, Dispatchers, and Compliance Officers.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/dispatch"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Open Your Courier Run Sheet →
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-foreground py-1"
            >
              Sign out of this session
            </button>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // FILTER CONSIGNMENTS
  // -------------------------------------------------------------
  const filteredConsignments = consignments.filter((item) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matches =
        item.reference?.toLowerCase().includes(q) ||
        item.pharmacy_name?.toLowerCase().includes(q) ||
        item.recipient_name?.toLowerCase().includes(q) ||
        item.delivery_address?.toLowerCase().includes(q) ||
        item.town?.toLowerCase().includes(q)
      if (!matches) return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'unassigned') {
        if (item.assigned_to) return false
      } else if (item.status !== statusFilter) {
        return false
      }
    }

    // Tier filter
    if (tierFilter !== 'all') {
      if (!item.categories?.includes(tierFilter)) return false
    }

    // Courier filter
    if (courierFilter !== 'all') {
      if (item.assigned_to !== courierFilter) return false
    }

    return true
  })

  // KPI Calculations
  const totalCount = consignments.length
  const unassignedCount = consignments.filter((i) => !i.assigned_to).length
  const dispatchedCount = consignments.filter((i) => i.status === 'dispatched').length
  const deliveredCount = consignments.filter((i) => i.status === 'delivered').length
  const coldChainCount = consignments.filter((i) => i.categories?.includes('cold_chain')).length
  const cdCount = consignments.filter((i) => i.categories?.includes('controlled_drugs')).length
  const openIncidentsCount = incidentReports.filter((i) => i.status !== 'resolved').length

  const activeCouriers = staffAccounts.filter((s) => s.role === 'staff')
  const roleMeta = ROLE_METADATA[currentStaff.role] || ROLE_METADATA.admin

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ========================================================= */}
      {/* ADMIN TOP SYSTEM BAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left Brand & Portal Identification */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-2 shadow-md">
                <img src={haydIconNavy} alt="HAYD" className="h-full w-full invert object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-lg font-black tracking-wider text-white">
                    HAYD
                  </span>
                  <span className="rounded bg-blue-500/20 border border-blue-500/40 px-1.5 py-0.2 text-[0.6rem] font-black uppercase tracking-widest text-blue-400">
                    CONTROL
                  </span>
                </div>
                <p className="text-[0.65rem] text-slate-400 font-medium">
                  Enterprise Operations & RBAC Portal
                </p>
              </div>
            </Link>

            <span className="hidden md:inline-block h-6 w-px bg-slate-800 mx-2" />

            {/* Quick Live Mode Indicator */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[0.72rem] text-slate-300 font-mono">
                Fleet Engine Online • {dispatchedCount} active drops
              </span>
            </div>
          </div>

          {/* Right User Identity & Global Actions */}
          <div className="flex items-center gap-3">
            {/* Courier View Switcher */}
            <Link
              to="/dispatch"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              title="Open the mobile-focused field courier runsheet view"
            >
              <Truck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Courier View</span>
            </Link>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 text-xs font-bold">
                {currentStaff.name.charAt(0)}
              </div>
              <div className="text-left text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white leading-none">
                    {currentStaff.name.split(' ')[0]}
                  </span>
                  <span className={cn('rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase', roleMeta.badgeColor)}>
                    {roleMeta.name}
                  </span>
                </div>
                <span className="text-[0.65rem] text-slate-400 leading-none">
                  {currentStaff.badge}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon
            // RBAC permission check
            if (tab.permission && !hasPermission(currentStaff, tab.permission)) {
              return null
            }
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3.5 py-2 font-bold whitespace-nowrap transition-all text-xs',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'manifests' && unassignedCount > 0 && (
                  <span className="rounded-full bg-amber-500/20 text-amber-400 px-1.5 py-0.2 text-[0.65rem]">
                    {unassignedCount}
                  </span>
                )}
                {tab.id === 'compliance' && openIncidentsCount > 0 && (
                  <span className="rounded-full bg-red-500/20 text-red-400 px-1.5 py-0.2 text-[0.65rem]">
                    {openIncidentsCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </header>

      {/* Global Success / Alert Banner */}
      {actionSuccess && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* MAIN ADMIN WORKSPACE CONTENT */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: OPERATIONS DASHBOARD (OVERVIEW) */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div
                onClick={() => {
                  setActiveTab('manifests')
                  setStatusFilter('all')
                }}
                className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all"
              >
                <span className="text-[0.65rem] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Bookings
                </span>
                <p className="mt-1 font-heading text-2xl font-black text-white">{totalCount}</p>
              </div>

              <div
                onClick={() => {
                  setActiveTab('manifests')
                  setStatusFilter('unassigned')
                }}
                className={cn(
                  'cursor-pointer rounded-2xl border p-4 transition-all',
                  unassignedCount > 0
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                )}
              >
                <span className="text-[0.65rem] uppercase font-bold text-amber-400 block tracking-wider flex items-center justify-between">
                  Needs Courier
                  {unassignedCount > 0 && <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />}
                </span>
                <p className="mt-1 font-heading text-2xl font-black text-amber-400">
                  {unassignedCount}
                </p>
              </div>

              <div
                onClick={() => {
                  setActiveTab('manifests')
                  setStatusFilter('dispatched')
                }}
                className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all"
              >
                <span className="text-[0.65rem] uppercase font-bold text-blue-400 block tracking-wider">
                  Out for Delivery
                </span>
                <p className="mt-1 font-heading text-2xl font-black text-blue-400">{dispatchedCount}</p>
              </div>

              <div
                onClick={() => {
                  setActiveTab('manifests')
                  setStatusFilter('delivered')
                }}
                className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all"
              >
                <span className="text-[0.65rem] uppercase font-bold text-emerald-400 block tracking-wider">
                  Delivered Today
                </span>
                <p className="mt-1 font-heading text-2xl font-black text-emerald-400">{deliveredCount}</p>
              </div>

              <div
                onClick={() => {
                  setActiveTab('compliance')
                }}
                className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all"
              >
                <span className="text-[0.65rem] uppercase font-bold text-cyan-400 block tracking-wider">
                  2°C–8°C Cold Chain
                </span>
                <p className="mt-1 font-heading text-2xl font-black text-cyan-400">{coldChainCount}</p>
              </div>

              <div
                onClick={() => {
                  setActiveTab('compliance')
                }}
                className={cn(
                  'cursor-pointer rounded-2xl border p-4 transition-all',
                  openIncidentsCount > 0
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                )}
              >
                <span className="text-[0.65rem] uppercase font-bold text-red-400 block tracking-wider flex items-center justify-between">
                  Open Incidents
                  {openIncidentsCount > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />}
                </span>
                <p className="mt-1 font-heading text-2xl font-black text-red-400">
                  {openIncidentsCount}
                </p>
              </div>
            </div>

            {/* Quick Actions & Dispensary Wizard Bar */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 p-6 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-heading text-lg md:text-xl font-bold text-white">
                    Operations Controller Desk
                  </h2>
                  <p className="text-xs text-slate-400">
                    Direct dispatcher controls for intake bookings, courier assignment, and regulatory audit compliance.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {hasPermission(currentStaff, PERMISSIONS.BOOK_DISPATCH) && (
                    <button
                      onClick={() => setShowBookingWizard(!showBookingWizard)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-md active:scale-95"
                    >
                      <PlusCircle className="h-4 w-4" />
                      {showBookingWizard ? 'Close Booking Steps' : '4-Step Dispensary Booking'}
                    </button>
                  )}

                  <button
                    onClick={() => setShowShiftTempModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all"
                  >
                    <ThermometerSnowflake className="h-4 w-4 text-cyan-400" />
                    Shift Cool Bag Check
                  </button>

                  <button
                    onClick={() => setIncidentModalConfig({ isOpen: true, data: {} })}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Report Incident
                  </button>
                </div>
              </div>

              {/* Collapsible 4-Step Booking Component */}
              {showBookingWizard && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <AdminBookingSteps
                    currentStaff={currentStaff}
                    onBookingCreated={(newRecord) => {
                      loadAllData()
                      setShowBookingWizard(false)
                      setActionSuccess(`Booking ${newRecord.reference} logged and scheduled!`)
                      setTimeout(() => setActionSuccess(''), 4000)
                    }}
                    onCancel={() => setShowBookingWizard(false)}
                  />
                </div>
              )}
            </div>

            {/* Quick Urgent Attention Runs (Unassigned or Incidents) */}
            {unassignedCount > 0 && (
              <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs">
                      ⚠️
                    </span>
                    <h3 className="font-heading text-sm font-bold text-amber-400 uppercase tracking-wider">
                      Action Required: {unassignedCount} Consignments Awaiting Courier Assignment
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('manifests')
                      setStatusFilter('unassigned')
                    }}
                    className="text-xs text-amber-400 font-semibold hover:underline"
                  >
                    View in Manifest Manager →
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {consignments
                    .filter((c) => !c.assigned_to)
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.reference}
                        className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-lg">
                            {item.reference}
                          </span>
                          <span className="text-[0.68rem] text-slate-400">
                            {item.town || 'Birmingham'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{item.pharmacy_name}</p>
                          <p className="text-slate-400">➔ {item.recipient_name}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <select
                            onChange={(e) => handleAssignCourier(item.reference, e.target.value)}
                            defaultValue=""
                            className="h-8 rounded-xl border border-slate-700 bg-slate-800 px-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="" disabled>
                              Assign Courier…
                            </option>
                            {activeCouriers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.unit.split('—')[0]})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setLabelModalItem(item)}
                            className="p-1.5 text-slate-400 hover:text-white"
                            title="Print sticker label"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CONSIGNMENTS & MANIFEST MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'manifests' && (
          <div className="space-y-5 animate-in fade-in">
            {/* Filter & Search Toolbar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[260px] max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search reference, patient, pharmacy, address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses ({consignments.length})</option>
                    <option value="unassigned">⚠️ Needs Assignment ({unassignedCount})</option>
                    <option value="received">Received / Scheduled</option>
                    <option value="verifying">Pharmacist Verification</option>
                    <option value="dispatched">Out for Delivery</option>
                    <option value="delivered">Delivered Today</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* Category Tier Filter */}
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Handling Tiers</option>
                    <option value="cold_chain">🧊 2°C–8°C Cold Chain</option>
                    <option value="controlled_drugs">🔐 Schedule 2/3 Controlled Drugs</option>
                  </select>

                  {/* Courier Unit Filter */}
                  <select
                    value={courierFilter}
                    onChange={(e) => setCourierFilter(e.target.value)}
                    className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Units / Couriers</option>
                    {activeCouriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.unit.split('—')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Consignments List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing <strong>{filteredConsignments.length}</strong> consignments
                </span>
                <span>Sorted by latest scheduled round</span>
              </div>

              {filteredConsignments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
                  <Package className="h-8 w-8 text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">No consignments match your filter</p>
                  <button
                    onClick={() => {
                      setStatusFilter('all')
                      setTierFilter('all')
                      setCourierFilter('all')
                      setSearchQuery('')
                    }}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredConsignments.map((item) => {
                    const isUnassigned = !item.assigned_to
                    const isDelivered = item.status === 'delivered'
                    const assignedCourier = staffAccounts.find((s) => s.id === item.assigned_to)

                    return (
                      <div
                        key={item.reference}
                        className={cn(
                          'rounded-2xl border bg-slate-900/90 p-5 md:p-6 shadow-sm space-y-4 transition-all',
                          isUnassigned
                            ? 'border-amber-500/40 bg-amber-500/[0.02]'
                            : isDelivered
                            ? 'border-slate-800/60 opacity-80'
                            : 'border-slate-800 hover:border-slate-700'
                        )}
                      >
                        {/* Top Reference & Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono text-sm font-black text-white bg-slate-800 px-3 py-1 rounded-lg">
                              {item.reference}
                            </span>

                            <span
                              className={cn(
                                'rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider',
                                item.status === 'delivered'
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : item.status === 'dispatched'
                                  ? 'bg-blue-500/15 text-blue-400'
                                  : item.status === 'verifying'
                                  ? 'bg-purple-500/15 text-purple-400'
                                  : 'bg-amber-500/15 text-amber-400'
                              )}
                            >
                              {item.status}
                            </span>

                            {item.categories?.includes('cold_chain') && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[0.65rem] font-bold text-cyan-400">
                                <ThermometerSnowflake className="h-3 w-3" /> 2°C–8°C Cold Chain
                              </span>
                            )}

                            {item.categories?.includes('controlled_drugs') && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[0.65rem] font-bold text-purple-300">
                                <ShieldCheck className="h-3 w-3" /> Schedule 2/3 CD (ID Req)
                              </span>
                            )}

                            <span className="text-xs text-slate-400">
                              {item.package_count || '1 parcel'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setLabelModalItem(item)}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                              title="Print 4x6 / thermal barcode sticker"
                            >
                              <Printer className="h-3.5 w-3.5 text-blue-400" />
                              Print Sticker
                            </button>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(getTrackingUrl(item.reference))
                                setCopiedRef(item.reference)
                                setTimeout(() => setCopiedRef(''), 2500)
                              }}
                              className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:text-white"
                              title="Copy tracking link"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Stop Details Grid */}
                        <div className="grid gap-4 sm:grid-cols-2 text-xs">
                          {/* Dispensary Pickup */}
                          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-bold uppercase tracking-wider text-[0.65rem] flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5 text-emerald-400" /> 1. Dispensary Pickup
                              </span>
                              {item.pharmacy_phone && (
                                <a
                                  href={`tel:${item.pharmacy_phone}`}
                                  className="text-emerald-400 font-semibold hover:underline"
                                >
                                  {item.pharmacy_phone}
                                </a>
                              )}
                            </div>
                            <p className="font-bold text-white text-sm">
                              {item.pharmacy_name || 'Community Pharmacy Partner'}
                            </p>
                            <p className="text-slate-400">
                              {item.pickup_address || `${item.town || 'Birmingham'}, UK`}
                            </p>
                          </div>

                          {/* Recipient Dropoff */}
                          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-bold uppercase tracking-wider text-[0.65rem] flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-blue-400" /> 2. Patient Doorstep
                              </span>
                              {item.recipient_phone && (
                                <a
                                  href={`tel:${item.recipient_phone}`}
                                  className="text-blue-400 font-semibold hover:underline"
                                >
                                  {item.recipient_phone}
                                </a>
                              )}
                            </div>
                            <p className="font-bold text-white text-sm">
                              {item.recipient_name || 'Patient'}
                            </p>
                            <p className="text-slate-400">
                              {item.delivery_address || `${item.town || 'Birmingham'}, UK`}
                            </p>
                          </div>
                        </div>

                        {/* Route Distance, Collection & ETA metrics */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="font-bold text-white flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5 text-blue-400" />
                              {item.status === 'delivered'
                                ? `Delivered: ${new Date(item.delivery_time || item.updated_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                                : `ETA: ${item.estimated_delivery_window || 'Standard round'}`}
                            </span>

                            <span className="text-slate-400">
                              <strong>{item.distance_miles || 2.4} miles</strong> (~{item.transit_duration_mins || 15} mins)
                            </span>

                            {item.collection_time && (
                              <span className="text-slate-400">
                                Collected:{' '}
                                <strong>
                                  {new Date(item.collection_time).toLocaleTimeString('en-GB', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </strong>
                              </span>
                            )}
                          </div>

                          <span className="text-[0.68rem] text-slate-500 font-mono">
                            Updated: {new Date(item.updated_date || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* CD Handover & Return Receipts if present */}
                        {item.cd_dispensary_handover && (
                          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-300 flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-purple-400" />
                              Pharmacist CD Handover Signed by {item.cd_dispensary_handover.pharmacist_name} ({item.cd_dispensary_handover.pharmacist_gphc})
                            </span>
                            <span className="text-[0.68rem] opacity-75 font-mono">
                              Tamper seal intact • {new Date(item.cd_dispensary_handover.collected_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}

                        {item.cd_dispensary_return && (
                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold flex items-center gap-1.5">
                              <AlertTriangle className="h-4 w-4 text-amber-400" />
                              Returned to Dispensary Safe — Received by Pharmacist {item.cd_dispensary_return.receiving_pharmacist}
                            </span>
                            <span className="text-[0.68rem] opacity-75">
                              Reason: {item.cd_dispensary_return.return_reason}
                            </span>
                          </div>
                        )}

                        {/* POD Evidence View if Delivered */}
                        {item.pod_evidence && (
                          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4" />
                                Electronic Proof of Delivery (POD) Certified
                              </span>
                              <span className="text-[0.68rem] text-emerald-300/80 font-mono">
                                Barcode verified at {item.pod_evidence.timestamp}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[0.72rem] text-slate-300">
                              <div>
                                <span className="text-slate-400 block text-[0.65rem]">Signee</span>
                                <strong>{item.pod_evidence.signee_name}</strong> ({item.pod_evidence.signee_relationship})
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[0.65rem]">Verified Courier</span>
                                <strong>{item.pod_evidence.verified_by}</strong>
                              </div>
                              {item.pod_evidence.id_verified && (
                                <div>
                                  <span className="text-slate-400 block text-[0.65rem]">Photo ID Verified</span>
                                  <strong className="text-purple-400 uppercase">
                                    {item.pod_evidence.id_type || 'Driving Licence'}
                                  </strong>
                                </div>
                              )}
                            </div>

                            {item.pod_evidence.signature_data && (
                              <div className="pt-1 flex items-center gap-3">
                                <span className="text-[0.68rem] text-slate-400">Doorstep Signature:</span>
                                <div className="bg-white rounded px-2 py-1 max-w-[140px]">
                                  <img
                                    src={item.pod_evidence.signature_data}
                                    alt="POD Signature"
                                    className="h-8 w-auto object-contain"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Controls Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                          {/* Assignment & Status Controls */}
                          <div className="flex flex-wrap items-center gap-2">
                            {hasPermission(currentStaff, PERMISSIONS.ASSIGN_COURIERS) && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 text-xs font-semibold">Assign:</span>
                                <select
                                  value={item.assigned_to || ''}
                                  onChange={(e) => handleAssignCourier(item.reference, e.target.value)}
                                  className="h-8 rounded-xl border border-slate-700 bg-slate-800 px-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">⚠️ Unassigned Pool</option>
                                  {activeCouriers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name} ({c.unit.split('—')[0]})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Scan-to-Deliver Shortcut */}
                            {item.status !== 'delivered' && (
                              <button
                                onClick={() => setScanModalItem(item)}
                                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                              >
                                <Scan className="h-3.5 w-3.5" />
                                Scan & Deliver
                              </button>
                            )}

                            {/* CD Specific Handover / Return */}
                            {item.categories?.includes('controlled_drugs') && item.status !== 'delivered' && (
                              <button
                                onClick={() =>
                                  setCdModalConfig({
                                    item,
                                    mode: item.status === 'dispatched' ? 'return' : 'collect',
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {item.status === 'dispatched' ? 'Return to CD Safe' : 'CD Handover Sign-Off'}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setIncidentModalConfig({
                                  isOpen: true,
                                  data: {
                                    reference: item.reference,
                                    pharmacy_name: item.pharmacy_name,
                                    recipient_name: item.recipient_name,
                                  },
                                })
                              }
                              className="inline-flex items-center gap-1 text-[0.72rem] text-red-400 hover:underline font-semibold"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" /> Report Issue
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: FLEET & ACTIVE COURIERS */}
        {/* ========================================================= */}
        {activeTab === 'fleet' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-white">
                  Active Fleet Units & Couriers ({activeCouriers.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time status, vehicle specifications, temperature calibration certification, and active drop counts.
                </p>
              </div>

              {hasPermission(currentStaff, PERMISSIONS.MANAGE_USERS) && (
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <UserPlus className="h-4 w-4" /> Add Courier Unit
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {activeCouriers.map((courier) => {
                const courierDrops = consignments.filter((c) => c.assigned_to === courier.id)
                const activeDrops = courierDrops.filter((c) => c.status !== 'delivered' && c.status !== 'cancelled')
                const deliveredToday = courierDrops.filter((c) => c.status === 'delivered')

                return (
                  <div
                    key={courier.id}
                    className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-lg shadow-md">
                          🚚
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-heading text-base font-bold text-white">
                              {courier.name}
                            </h4>
                            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-400">
                              Active On Route
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium">{courier.unit}</p>
                          <p className="text-[0.7rem] text-slate-500 font-mono">{courier.vehicle}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[0.65rem] text-slate-400 uppercase font-bold block">Active Runs</span>
                        <span className="font-heading text-2xl font-black text-blue-400">
                          {activeDrops.length}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-slate-950 p-2.5">
                        <span className="text-slate-400 block text-[0.65rem]">Completed</span>
                        <span className="font-bold text-emerald-400 text-sm">{deliveredToday.length}</span>
                      </div>
                      <div className="rounded-xl bg-slate-950 p-2.5">
                        <span className="text-slate-400 block text-[0.65rem]">Cold-Chain</span>
                        <span className="font-bold text-cyan-400 text-sm">
                          {activeDrops.filter((c) => c.categories?.includes('cold_chain')).length}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-950 p-2.5">
                        <span className="text-slate-400 block text-[0.65rem]">CD Drops</span>
                        <span className="font-bold text-purple-400 text-sm">
                          {activeDrops.filter((c) => c.categories?.includes('controlled_drugs')).length}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <a
                        href={`tel:${courier.phone}`}
                        className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-semibold"
                      >
                        <Phone className="h-3.5 w-3.5 text-emerald-400" />
                        {courier.phone}
                      </a>

                      <button
                        onClick={() => {
                          setActiveTab('manifests')
                          setCourierFilter(courier.id)
                        }}
                        className="text-blue-400 hover:underline font-bold"
                      >
                        View Unit Manifest →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: GDP & CLINICAL COMPLIANCE AUDIT CENTRE */}
        {/* ========================================================= */}
        {activeTab === 'compliance' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Compliance Action Header */}
            <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-purple-500/10 p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-heading text-lg font-bold text-white">
                    MHRA & GDP Regulatory Compliance Registers
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Paperless audit records: 2°C–8°C shift cool bag verifications, Controlled Drug two-way chains of custody, and incident escalations.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowShiftTempModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 transition-colors shadow-sm"
                >
                  <ThermometerSnowflake className="h-4 w-4" /> Record Shift Check
                </button>
                <button
                  onClick={() => setIncidentModalConfig({ isOpen: true, data: {} })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-sm"
                >
                  <AlertTriangle className="h-4 w-4" /> File Incident Report
                </button>
              </div>
            </div>

            {/* Cold-Chain 2°C–8°C Temperature Register */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                    <ThermometerSnowflake className="h-4 w-4 text-cyan-400" />
                    Cold-Chain Shift Log Register (2°C–8°C)
                  </h4>
                  <span className="text-[0.68rem] text-slate-400">
                    1 entry per driver shift replaces paper sheets under SOP-07.
                  </span>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  {shiftTempLogs.length} shifts audited
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-[0.68rem] font-bold uppercase text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Driver & Unit</th>
                      <th className="py-2.5 px-3">Cool Box / Logger</th>
                      <th className="py-2.5 px-3">Pre-Departure</th>
                      <th className="py-2.5 px-3">Min / Max Readings</th>
                      <th className="py-2.5 px-3">Excursion Status</th>
                      <th className="py-2.5 px-3">Shift Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {shiftTempLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-white">{log.shift_date}</td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-white block">{log.driver_name}</span>
                          <span className="text-[0.68rem] text-slate-500 font-mono">{log.driver_unit}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">{log.cool_box_id}</td>
                        <td className="py-3 px-3 font-bold text-cyan-400">{log.pre_departure_temp}°C</td>
                        <td className="py-3 px-3 font-mono">
                          {log.end_shift_min_temp != null
                            ? `${log.end_shift_min_temp}°C – ${log.end_shift_max_temp}°C`
                            : 'En route'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase',
                              log.excursion_occurred
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            )}
                          >
                            {log.excursion_occurred ? '⚠️ Excursion' : '✓ Zero Excursions'}
                          </span>
                        </td>
                        <td className="py-3 px-3 uppercase text-[0.68rem] font-bold">
                          {log.status === 'completed' ? (
                            <span className="text-emerald-400">Completed & Signed</span>
                          ) : (
                            <span className="text-blue-400">Active Shift</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Regulated Incident & Excursion Register */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    Regulated Incident & Escalation Register
                  </h4>
                  <span className="text-[0.68rem] text-slate-400">
                    SOP-09 incident investigations, containment actions, and clinical resolution notes.
                  </span>
                </div>
                <span className="text-xs font-mono text-red-400">
                  {incidentReports.length} incidents logged
                </span>
              </div>

              <div className="space-y-3">
                {incidentReports.map((inc) => (
                  <div
                    key={inc.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-white bg-slate-800 px-2.5 py-0.5 rounded">
                          {inc.id}
                        </span>
                        <span className="text-slate-300 font-bold capitalize">
                          {inc.incident_type.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={cn(
                            'rounded px-2 py-0.2 text-[0.65rem] font-bold uppercase',
                            inc.severity === 'critical'
                              ? 'bg-red-500/20 text-red-400'
                              : inc.severity === 'high'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-blue-500/20 text-blue-400'
                          )}
                        >
                          {inc.severity}
                        </span>
                      </div>

                      <span className="text-[0.68rem] text-slate-500 font-mono">
                        {new Date(inc.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed">{inc.description}</p>

                    {inc.immediate_action_taken && (
                      <div className="rounded-xl bg-slate-900 p-2.5 text-[0.72rem] text-slate-400">
                        <strong className="text-slate-300">Action Taken:</strong> {inc.immediate_action_taken}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[0.68rem] text-slate-400 pt-1">
                      <span>Reported by: <strong>{inc.driver_name}</strong></span>
                      <span>Escalated to: <strong>{inc.pharmacist_name}</strong></span>
                      <span className="uppercase font-bold text-emerald-400">Status: {inc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: STAFF & RBAC USER MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'users' && hasPermission(currentStaff, PERMISSIONS.MANAGE_USERS) && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-heading text-base font-bold text-white">
                  Staff Accounts & Role-Based Access Control (RBAC)
                </h3>
                <p className="text-xs text-slate-400">
                  Manage operational roles, assign delivery vehicles, reset credentials, and enforce permissions.
                </p>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md"
              >
                <UserPlus className="h-4 w-4" />
                Create New Staff Account
              </button>
            </div>

            {userActionSuccess && (
              <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{userActionSuccess}</span>
              </div>
            )}

            {/* Users Table */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950 text-[0.68rem] font-bold uppercase text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Role & RBAC Authority</th>
                      <th className="py-3 px-4">Assigned Unit / Vehicle</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {staffAccounts.map((account) => {
                      const meta = ROLE_METADATA[account.role] || ROLE_METADATA.staff
                      const isSelf = account.id === currentStaff.id
                      const isSuperAdmin = account.id === 'admin'

                      return (
                        <tr key={account.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 font-bold text-xs">
                                {account.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{account.name}</span>
                                <span className="text-[0.68rem] text-slate-400 font-mono">
                                  {account.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={cn('rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold uppercase', meta.badgeColor)}>
                              {meta.name}
                            </span>
                            <span className="text-[0.68rem] text-slate-500 block mt-0.5">
                              {account.title}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-200 block">{account.unit || 'Central Desk'}</span>
                            <span className="text-[0.65rem] text-slate-500 font-mono truncate max-w-[200px] block">
                              {account.vehicle || 'N/A'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-300">{account.phone}</td>

                          <td className="py-3.5 px-4">
                            <span
                              className={cn(
                                'rounded px-2 py-0.5 text-[0.65rem] font-bold uppercase',
                                account.status === 'suspended'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              )}
                            >
                              {account.status || 'Active'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(account)}
                                  className="text-[0.7rem] text-slate-400 hover:text-white font-medium"
                                >
                                  {account.status === 'suspended' ? 'Activate' : 'Suspend'}
                                </button>
                              )}

                              {!isSuperAdmin && !isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(account)}
                                  className="text-[0.7rem] text-red-400 hover:text-red-300 font-medium"
                                >
                                  Remove
                                </button>
                              )}

                              {isSelf && (
                                <span className="text-[0.68rem] text-slate-500 italic">Current User</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RBAC Role & Permission Matrix Reference */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h4 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                Active RBAC Permissions Matrix
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                {Object.entries(ROLE_METADATA).map(([key, role]) => (
                  <div key={key} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <span className={cn('rounded px-2 py-0.5 text-[0.65rem] font-bold uppercase', role.badgeColor)}>
                      {role.name}
                    </span>
                    <p className="text-[0.72rem] text-slate-400 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: CUSTOMER & DISPENSARY INQUIRIES */}
        {/* ========================================================= */}
        {activeTab === 'enquiries' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="font-heading text-base font-bold text-white">
                Customer & Dispensary Inquiries ({contactMessages.length})
              </h3>
              <p className="text-xs text-slate-400">
                Inquiries and support requests submitted via the public portal contact form.
              </p>
            </div>

            {contactMessages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-500">
                No new web inquiries recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {contactMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-white text-sm">{msg.name}</span>
                      <span className="text-[0.68rem] text-slate-500 font-mono">
                        {new Date(msg.created_date || Date.now()).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <p className="text-slate-300">{msg.message}</p>
                    <div className="flex items-center gap-4 text-slate-400 text-[0.72rem] pt-1">
                      {msg.email && <span>Email: {msg.email}</span>}
                      {msg.phone && <span>Phone: {msg.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: CREATE NEW STAFF ACCOUNT */}
      {/* ========================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-white">
                    Create New Staff Account
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add courier driver, dispatcher, or compliance officer.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {userActionError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                {userActionError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    placeholder="e.g. David Adeyemi"
                    className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-slate-300">Role & Access Level</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="staff">Field Courier (Assigned Runs Only)</option>
                    <option value="dispatcher">Logistics Dispatcher (Fleet & Bookings)</option>
                    <option value="compliance">GDP Compliance Officer (Clinical Audit)</option>
                    <option value="admin">Super Admin (Full Supervisory Authority)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-slate-300">Staff Username or Email</label>
                  <input
                    type="text"
                    required
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    placeholder="e.g. courier3@thehayd.uk"
                    className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-slate-300">Initial Password / PIN</label>
                  <input
                    type="password"
                    required
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="e.g. staff2026"
                    className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-slate-300">Unit Name</label>
                  <input
                    type="text"
                    value={newUserData.unit}
                    onChange={(e) => setNewUserData({ ...newUserData, unit: e.target.value })}
                    placeholder="e.g. Unit 3 — Electric Transit"
                    className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[0.7rem] font-semibold text-slate-300">Contact Phone</label>
                  <input
                    type="tel"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    placeholder="e.g. 07761 000103"
                    className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[0.7rem] font-semibold text-slate-300">Vehicle / Equipment Details</label>
                <input
                  type="text"
                  value={newUserData.vehicle}
                  onChange={(e) => setNewUserData({ ...newUserData, vehicle: e.target.value })}
                  placeholder="e.g. Ford Transit Dual-Temp (2°C–8°C / Ambient) — Reg: HY26 ADM"
                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Check className="h-4 w-4" /> Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS HOOKS */}
      {/* ========================================================= */}
      {labelModalItem && (
        <ParcelLabelModal
          item={labelModalItem}
          isOpen={Boolean(labelModalItem)}
          onClose={() => setLabelModalItem(null)}
        />
      )}

      {scanModalItem && (
        <DeliveryScanModal
          item={scanModalItem}
          isOpen={Boolean(scanModalItem)}
          onClose={() => setScanModalItem(null)}
          onConfirmDelivery={async (targetItem, updateData) => {
            await handleStatusUpdate(targetItem, updateData.status, updateData.note, {
              delivery_time: updateData.delivery_time,
              pod_evidence: updateData.pod_evidence,
            })
          }}
          currentStaff={currentStaff}
        />
      )}

      {showShiftTempModal && (
        <ShiftCoolBagModal
          isOpen={showShiftTempModal}
          onClose={() => setShowShiftTempModal(false)}
          currentStaff={currentStaff}
          onOpenIncidentModal={(data) => setIncidentModalConfig({ isOpen: true, data })}
        />
      )}

      {cdModalConfig && (
        <CdHandoverModal
          isOpen={Boolean(cdModalConfig)}
          onClose={() => setCdModalConfig(null)}
          item={cdModalConfig?.item}
          defaultMode={cdModalConfig?.mode}
          currentStaff={currentStaff}
          onConfirmHandover={async (targetItem, updateData) => {
            await handleStatusUpdate(targetItem, updateData.status, updateData.note, {
              collection_time: updateData.collection_time,
              cd_dispensary_handover: updateData.cd_dispensary_handover,
              cd_dispensary_return: updateData.cd_dispensary_return,
            })
          }}
        />
      )}

      {incidentModalConfig && (
        <IncidentReportModal
          isOpen={Boolean(incidentModalConfig?.isOpen)}
          onClose={() => setIncidentModalConfig(null)}
          currentStaff={currentStaff}
          initialData={incidentModalConfig?.data || {}}
          onReportCreated={() => {
            loadAllData()
          }}
        />
      )}

      {/* Internal Staff Chat & Radio */}
      <StaffChatWidget currentStaff={currentStaff} />
    </div>
  )
}
