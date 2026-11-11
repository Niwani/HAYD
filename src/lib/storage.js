const STORAGE_KEYS = {
  REQUESTS: 'hayd_delivery_requests',
  TRACK_STATUS: 'hayd_track_statuses',
  CONTACTS: 'hayd_contact_messages',
}

// Initial demo tracking reference so visitors can test tracking immediately
const DEMO_STATUSES = [
  {
    reference: 'HAYD-8F2K9Q',
    status: 'dispatched',
    town: 'Birmingham',
    recipient_name: 'St Mary Dispensary Partner',
    note: 'Courier collected from dispensary (2–8°C carrier verified) and is en route to recipient.',
    updated_date: new Date().toISOString(),
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
        
        // Check if exists, update instead of duplicating
        const existingIndex = items.findIndex(
          (i) => i.reference?.toUpperCase() === normalizedRef
        )

        const record = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          ...data,
          reference: normalizedRef,
          created_date: new Date().toISOString(),
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
          // If not in store yet, create it with patch
          return this.create({ reference: normalizedRef, ...patch })
        }
      },
      async list() {
        return getStore(STORAGE_KEYS.TRACK_STATUS, DEMO_STATUSES)
      },
      async filter({ reference }) {
        await new Promise((r) => setTimeout(r, 250))
        const items = getStore(STORAGE_KEYS.TRACK_STATUS, DEMO_STATUSES)
        const normalized = (reference || '').trim().toUpperCase()
        const matches = items.filter((item) => item.reference?.toUpperCase() === normalized)
        
        if (matches.length > 0) {
          return matches
        }

        // If it's a valid HAYD reference format (e.g. HAYD-XXXXXX) but not yet saved in this local browser:
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
