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
    note: 'Courier collected from dispensary (2–8°C carrier verified) and is en route to your door.',
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
        await new Promise((r) => setTimeout(r, 300))
        return {
          file_uri: file ? `local://prescriptions/${encodeURIComponent(file.name)}` : '',
        }
      },
    },
  },
  entities: {
    DeliveryRequest: {
      async create(data) {
        await new Promise((r) => setTimeout(r, 400))
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
        const record = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          ...data,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        }
        items.unshift(record)
        setStore(STORAGE_KEYS.TRACK_STATUS, items)
        return record
      },
      async filter({ reference }) {
        await new Promise((r) => setTimeout(r, 350))
        const items = getStore(STORAGE_KEYS.TRACK_STATUS, DEMO_STATUSES)
        const normalized = (reference || '').trim().toUpperCase()
        return items.filter((item) => item.reference?.toUpperCase() === normalized)
      },
    },
    ContactMessage: {
      async create(data) {
        await new Promise((r) => setTimeout(r, 400))
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

