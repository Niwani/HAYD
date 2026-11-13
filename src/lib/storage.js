const STORAGE_KEYS = {
  REQUESTS: 'hayd_delivery_requests',
  TRACK_STATUS: 'hayd_track_statuses_v2',
  CONTACTS: 'hayd_contact_messages',
}

// Initial demo tracking consignments representing active operations:
// 1 assigned to Courier 1 (Marcus), 1 assigned to Courier 2 (Amara), 1 unassigned awaiting controller
const DEMO_STATUSES = [
  {
    reference: 'HAYD-8F2K9Q',
    status: 'dispatched',
    town: 'Birmingham',
    pharmacy_name: 'St Mary Dispensary Partner',
    pharmacy_email: 'dispensary@stmarypharmacy.co.uk',
    pharmacy_phone: '0121 445 1102',
    pickup_address: '142 High Street, Harborne, Birmingham, B17 9PT',
    recipient_name: 'Arthur Pendelton',
    recipient_email: 'arthur.p@example.com',
    recipient_phone: '07891 223344',
    delivery_address: '28 Moor Pool Avenue, Harborne, B17 9HN',
    assigned_to: 'courier_1',
    assigned_name: 'Marcus Vance (Unit 1)',
    assigned_at: new Date(Date.now() - 3600000).toISOString(),
    categories: ['cold_chain'],
    package_count: '2 parcels (2°C–8°C)',
    note: 'Courier Marcus collected from dispensary. Cold-chain carrier validated at 4.2°C. En route to recipient.',
    updated_date: new Date(Date.now() - 1800000).toISOString(),
    created_date: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    reference: 'HAYD-4K9P2X',
    status: 'verifying',
    town: 'Birmingham',
    pharmacy_name: 'Edgbaston Medical Dispensary',
    pharmacy_email: 'orders@edgbastondispensary.nhs.uk',
    pharmacy_phone: '0121 667 9820',
    pickup_address: '22 Highfield Road, Edgbaston, Birmingham, B15 3DP',
    recipient_name: 'Evelyn Shaw',
    recipient_email: 'evelyn.shaw@example.com',
    recipient_phone: '07700 900123',
    delivery_address: '5 Westfield Road, Edgbaston, Birmingham, B15 3QJ',
    assigned_to: 'courier_2',
    assigned_name: 'Amara Okafor (Unit 2)',
    assigned_at: new Date(Date.now() - 1800000).toISOString(),
    categories: ['controlled_drugs'],
    package_count: '1 tamper-evident pack',
    note: 'Assigned to Amara Okafor (Unit 2). Courier arriving at counter for pharmacist handover & verification.',
    updated_date: new Date(Date.now() - 900000).toISOString(),
    created_date: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    reference: 'HAYD-7W3N1B',
    status: 'received',
    town: 'Solihull',
    pharmacy_name: 'Solihull Central Pharmacy',
    pharmacy_email: 'team@solihullcentralrx.co.uk',
    pharmacy_phone: '0121 705 4488',
    pickup_address: '88 Poplar Road, Solihull, B91 3AL',
    recipient_name: 'David & Mary Clarke',
    recipient_email: 'd.clarke@example.com',
    recipient_phone: '07700 900456',
    delivery_address: '14 Blossomfield Road, Solihull, B91 1LD',
    assigned_to: null,
    assigned_name: null,
    assigned_at: null,
    categories: ['ambient'],
    package_count: '3 boxes (Repeat MDS pack)',
    note: 'Online booking logged. Awaiting controller dispatch assignment to available courier.',
    updated_date: new Date(Date.now() - 600000).toISOString(),
    created_date: new Date(Date.now() - 600000).toISOString(),
  },
]

function getStore(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage errors
  }
}

export const storageClient = {
  integrations: {
    Core: {
      async UploadPrivateFile({ file }) {
        await new Promise((r) => setTimeout(r, 200))
        return {
          file_uri: file ? `local://prescriptions/${encodeURIComponent(file.name)}` : '',
        }
      },
    },
  },
  entities: {
    DeliveryRequest: {
      async create(data) {
        await new Promise((r) => setTimeout(r, 300))
        const items = getStore(STORAGE_KEYS.REQUESTS, [])
        const record = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          ...data,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        }
        items.unshift(record)
        setStore(STORAGE_KEYS.REQUESTS, items)
        return record
      },
      async list() {
        return getStore(STORAGE_KEYS.REQUESTS, [])
      },
    },
    TrackStatus: {
      async create(data) {
        const items = getStore(STORAGE_KEYS.TRACK_STATUS, DEMO_STATUSES)
        const normalizedRef = (data.reference || '').trim().toUpperCase()

        const existingIndex = items.findIndex(
          (i) => i.reference?.toUpperCase() === normalizedRef
        )

        const record = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          assigned_to: null,
          assigned_name: null,
          assigned_at: null,
          categories: ['ambient'],
          ...data,
          reference: normalizedRef,
          created_date: data.created_date || new Date().toISOString(),
          updated_date: new Date().toISOString(),
        }

        if (existingIndex >= 0) {
          items[existingIndex] = { ...items[existingIndex], ...record }
        } else {
          items.unshift(record)
        }

        setStore(STORAGE_KEYS.TRACK_STATUS, items)
        return record
      },
      async update(reference, patch) {
        const items = getStore(STORAGE_KEYS.TRACK_STATUS, DEMO_STATUSES)
        const normalizedRef = (reference || '').trim().toUpperCase()
        const existingIndex = items.findIndex(
          (i) => i.reference?.toUpperCase() === normalizedRef
        )

        if (existingIndex >= 0) {
          items[existingIndex] = {
            ...items[existingIndex],
            ...patch,
            updated_date: new Date().toISOString(),
          }
          setStore(STORAGE_KEYS.TRACK_STATUS, items)
          return items[existingIndex]
        } else {
          return this.create({ reference: normalizedRef, ...patch })
        }
      },
      async assign(reference, { staffId, staffName, note }) {
        const items = getStore(STORAGE_KEYS.TRACK_STATUS, DEMO_STATUSES)
        const normalizedRef = (reference || '').trim().toUpperCase()
        const existingIndex = items.findIndex(
          (i) => i.reference?.toUpperCase() === normalizedRef
        )

        const assignmentNote =
          note ||
          (staffId
            ? `Assigned to ${staffName || staffId} for collection & delivery.`
            : 'Unassigned. Returned to dispatch pool.')

        const patch = {
          assigned_to: staffId || null,
          assigned_name: staffName || null,
          assigned_at: staffId ? new Date().toISOString() : null,
          note: assignmentNote,
          updated_date: new Date().toISOString(),
        }

        if (existingIndex >= 0) {
          items[existingIndex] = { ...items[existingIndex], ...patch }
          setStore(STORAGE_KEYS.TRACK_STATUS, items)
          return items[existingIndex]
        }
        return null
      },
      async list() {
        return getStore(STORAGE_KEYS.TRACK_STATUS, DEMO_STATUSES)
      },
      async listForUser(currentUser) {
        const all = getStore(STORAGE_KEYS.TRACK_STATUS, DEMO_STATUSES)
        if (!currentUser) return []
        // Admin sees all consignments
        if (currentUser.role === 'admin') {
          return all
        }
        // Staff couriers only see consignments assigned to them
        return all.filter((item) => item.assigned_to === currentUser.id)
      },
      async filter({ reference }) {
        await new Promise((r) => setTimeout(r, 200))
        const items = getStore(STORAGE_KEYS.TRACK_STATUS, DEMO_STATUSES)
        const normalized = (reference || '').trim().toUpperCase()
        const matches = items.filter((item) => item.reference?.toUpperCase() === normalized)

        if (matches.length > 0) {
          return matches
        }

        // If it's a valid HAYD reference format but not yet saved locally:
        if (/^HAYD-[A-Z0-9]{5,8}$/.test(normalized)) {
          return [
            {
              reference: normalized,
              status: 'received',
              town: 'Active Route',
              note: 'Delivery booked and logged in dispatch system. Awaiting scheduled collection from pharmacy counter.',
              updated_date: new Date().toISOString(),
            },
          ]
        }

        return []
      },
    },
    ContactMessage: {
      async create(data) {
        await new Promise((r) => setTimeout(r, 300))
        const items = getStore(STORAGE_KEYS.CONTACTS, [])
        const record = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          ...data,
          created_date: new Date().toISOString(),
        }
        items.unshift(record)
        setStore(STORAGE_KEYS.CONTACTS, items)
        return record
      },
    },
  },
}
