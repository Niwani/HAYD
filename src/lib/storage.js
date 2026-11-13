import { calculateDeliveryETA } from './etaCalculator'

const STORAGE_KEYS = {
  REQUESTS: 'hayd_delivery_requests',
  TRACK_STATUS: 'hayd_track_statuses_v3',
  CONTACTS: 'hayd_contact_messages',
}

// Initial demo tracking consignments representing active operations:
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
    collection_time: new Date(Date.now() - 1500000).toISOString(), // Collected 25 mins ago
    delivery_time: null,
    distance_miles: 1.8,
    transit_duration_mins: 14,
    estimated_delivery_time: new Date(Date.now() - 1500000 + 14 * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    estimated_delivery_window: 'Arriving now',
    updated_date: new Date(Date.now() - 1500000).toISOString(),
    created_date: new Date(Date.now() - 7200000).toISOString(),
    history: [
      {
        id: 'h1',
        status: 'received',
        title: 'Booking Received & Scheduled',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        note: 'Collection logged in dispatch system by St Mary Dispensary.',
        updated_by: 'Dispensary Portal',
      },
      {
        id: 'h2',
        status: 'verifying',
        title: 'Pharmacist Counter Verification',
        timestamp: new Date(Date.now() - 4800000).toISOString(),
        note: 'Prescription bagged and verified at pharmacy counter.',
        updated_by: 'Dispensing Pharmacist',
      },
      {
        id: 'h3',
        status: 'dispatched',
        title: 'Courier Collected & En Route',
        timestamp: new Date(Date.now() - 1500000).toISOString(),
        note: 'Collected by Marcus Vance. Validated thermal pack active (4.2°C).',
        updated_by: 'Marcus Vance (Unit 1)',
      },
    ],
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
    collection_time: null,
    delivery_time: null,
    distance_miles: 2.1,
    transit_duration_mins: 15,
    estimated_delivery_time: '15 mins from collection',
    estimated_delivery_window: 'Pending counter collection',
    updated_date: new Date(Date.now() - 900000).toISOString(),
    created_date: new Date(Date.now() - 3600000).toISOString(),
    history: [
      {
        id: 'h4',
        status: 'received',
        title: 'Booking Received & Scheduled',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        note: 'Collection logged in dispatch system.',
        updated_by: 'Dispensary Portal',
      },
      {
        id: 'h5',
        status: 'verifying',
        title: 'Assigned & Counter Verification',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        note: 'Assigned to Amara Okafor. Pharmacist preparing Schedule 2 Controlled Drug packaging.',
        updated_by: 'Operations Controller',
      },
    ],
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
    collection_time: null,
    delivery_time: null,
    distance_miles: 2.8,
    transit_duration_mins: 16,
    estimated_delivery_time: '16 mins from collection',
    estimated_delivery_window: 'Pending assignment',
    updated_date: new Date(Date.now() - 600000).toISOString(),
    created_date: new Date(Date.now() - 600000).toISOString(),
    history: [
      {
        id: 'h6',
        status: 'received',
        title: 'Booking Received & Scheduled',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        note: 'Online booking logged. Awaiting controller dispatch assignment to available courier.',
        updated_by: 'Dispensary Portal',
      },
    ],
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

        const now = new Date().toISOString()
        const pickupAddr = data.pickup_address || `${data.pharmacy_name || 'Dispensary'}, ${data.town || 'Birmingham'}`
        const delivAddr = data.delivery_address || `${data.recipient_name || 'Patient'}, ${data.town || 'Birmingham'}`

        const etaCalc = calculateDeliveryETA({
          pickupAddress: pickupAddr,
          deliveryAddress: delivAddr,
          collectionTime: data.collection_time || null,
          status: data.status || 'received',
          deliveredTime: data.delivery_time || null,
        })

        const initialHistory = data.history || [
          {
            id: `h_${Date.now()}`,
            status: data.status || 'received',
            title: 'Booking Received & Scheduled',
            timestamp: now,
            note: data.note || 'Collection logged in dispatch system.',
            updated_by: data.updated_by || 'Dispensary Portal',
          },
        ]

        const record = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          assigned_to: null,
          assigned_name: null,
          assigned_at: null,
          categories: ['ambient'],
          collection_time: data.collection_time || null,
          delivery_time: data.delivery_time || null,
          distance_miles: etaCalc.distanceMiles,
          transit_duration_mins: etaCalc.transitMinutes,
          estimated_delivery_time: etaCalc.etaTime,
          estimated_delivery_window: etaCalc.windowStr,
          display_status_text: etaCalc.displayStatusText,
          history: initialHistory,
          ...data,
          reference: normalizedRef,
          created_date: data.created_date || now,
          updated_date: now,
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

        const now = new Date().toISOString()
        const existing = existingIndex >= 0 ? items[existingIndex] : {}

        const finalStatus = patch.status || existing.status || 'dispatched'
        const pickupAddr = patch.pickup_address || existing.pickup_address || `${existing.pharmacy_name || 'Dispensary'}, Birmingham`
        const delivAddr = patch.delivery_address || existing.delivery_address || `${existing.recipient_name || 'Patient'}, Birmingham`

        // Check if collection time is being established
        let collectionTime = patch.collection_time !== undefined ? patch.collection_time : existing.collection_time
        if (finalStatus === 'dispatched' && !collectionTime) {
          collectionTime = now
        }

        // Check if delivery time is being established
        let deliveryTime = patch.delivery_time !== undefined ? patch.delivery_time : existing.delivery_time
        if (finalStatus === 'delivered' && !deliveryTime) {
          deliveryTime = now
        }

        // Calculate automatic ETA based on distance and collection time
        const etaCalc = calculateDeliveryETA({
          pickupAddress: pickupAddr,
          deliveryAddress: delivAddr,
          collectionTime,
          status: finalStatus,
          deliveredTime: deliveryTime,
        })

        // Build milestone history event
        const historyList = Array.isArray(existing.history) ? [...existing.history] : []
        if (patch.status || patch.note) {
          historyList.unshift({
            id: `h_${Date.now()}`,
            status: finalStatus,
            title:
              finalStatus === 'delivered'
                ? 'Delivered & Signed at Doorstep'
                : finalStatus === 'dispatched'
                ? 'Courier Collected & En Route'
                : finalStatus === 'verifying'
                ? 'Pharmacist Counter Verification'
                : 'Status Updated',
            timestamp: now,
            note: patch.note || existing.note || '',
            eta_window: etaCalc.windowStr,
            updated_by: patch.updated_by || 'Operations Staff',
          })
        }

        const mergedRecord = {
          ...existing,
          ...patch,
          reference: normalizedRef,
          status: finalStatus,
          collection_time: collectionTime,
          delivery_time: deliveryTime,
          distance_miles: etaCalc.distanceMiles,
          transit_duration_mins: etaCalc.transitMinutes,
          estimated_delivery_time: etaCalc.etaTime,
          estimated_delivery_window: etaCalc.windowStr,
          display_status_text: etaCalc.displayStatusText,
          history: historyList,
          updated_date: now,
        }

        if (existingIndex >= 0) {
          items[existingIndex] = mergedRecord
          setStore(STORAGE_KEYS.TRACK_STATUS, items)
          return items[existingIndex]
        } else {
          return this.create(mergedRecord)
        }
      },

      async assign(reference, { staffId, staffName, note, updated_by = 'Operations Controller' }) {
        const items = getStore(STORAGE_KEYS.TRACK_STATUS, DEMO_STATUSES)
        const normalizedRef = (reference || '').trim().toUpperCase()
        const existingIndex = items.findIndex(
          (i) => i.reference?.toUpperCase() === normalizedRef
        )

        const now = new Date().toISOString()
        const existing = existingIndex >= 0 ? items[existingIndex] : {}

        const assignmentNote =
          note ||
          (staffId
            ? `Assigned to ${staffName || staffId} for collection & delivery.`
            : 'Unassigned. Returned to dispatch pool.')

        const historyList = Array.isArray(existing.history) ? [...existing.history] : []
        historyList.unshift({
          id: `h_${Date.now()}`,
          status: existing.status || 'received',
          title: staffId ? `Assigned to ${staffName || staffId}` : 'Returned to Pool',
          timestamp: now,
          note: assignmentNote,
          updated_by,
        })

        const patch = {
          assigned_to: staffId || null,
          assigned_name: staffName || null,
          assigned_at: staffId ? now : null,
          note: assignmentNote,
          history: historyList,
          updated_date: now,
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
        if (currentUser.role === 'admin') {
          return all
        }
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
          const now = new Date().toISOString()
          return [
            {
              reference: normalized,
              status: 'received',
              town: 'Active Route',
              distance_miles: 3.5,
              transit_duration_mins: 18,
              estimated_delivery_window: 'Pending collection',
              note: 'Delivery booked and logged in dispatch system. Awaiting scheduled collection from pharmacy counter.',
              updated_date: now,
              created_date: now,
              history: [
                {
                  id: 'h_auto',
                  status: 'received',
                  title: 'Booking Received & Scheduled',
                  timestamp: now,
                  note: 'Delivery booked and logged in dispatch system.',
                  updated_by: 'Dispensary Portal',
                },
              ],
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
