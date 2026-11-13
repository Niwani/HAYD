/**
 * HAYD Pharmaceutical Logistics ETA & Distance Calculator
 * 
 * Computes:
 * 1. Road distance (miles) between pharmacy dispensary and patient doorstep
 * 2. Transit time (minutes) accounting for urban traffic and regulated handover
 * 3. Exact Estimated Delivery Time (ETA) based on time of collection
 * 4. Delivery time window (e.g. 10:35 – 10:55 AM)
 */

// Centroids for Birmingham & West Midlands Outward Postcodes
const POSTCODE_CENTROIDS = {
  // Birmingham Central & Inner Districts
  B1: { lat: 52.4800, lon: -1.9025 },
  B2: { lat: 52.4790, lon: -1.8990 },
  B3: { lat: 52.4830, lon: -1.9020 },
  B4: { lat: 52.4850, lon: -1.8900 },
  B5: { lat: 52.4720, lon: -1.8900 },
  B6: { lat: 52.5020, lon: -1.8820 }, // Aston
  B7: { lat: 52.4920, lon: -1.8700 }, // Nechells
  B8: { lat: 52.4930, lon: -1.8420 }, // Saltley / Washwood Heath
  B9: { lat: 52.4750, lon: -1.8600 }, // Bordesley Green
  B10: { lat: 52.4680, lon: -1.8520 }, // Small Heath
  B11: { lat: 52.4550, lon: -1.8540 }, // Sparkhill
  B12: { lat: 52.4640, lon: -1.8840 }, // Balsall Heath
  B13: { lat: 52.4460, lon: -1.8860 }, // Moseley
  B14: { lat: 52.4330, lon: -1.8920 }, // Kings Heath
  B15: { lat: 52.4630, lon: -1.9210 }, // Edgbaston
  B16: { lat: 52.4750, lon: -1.9320 }, // Ladywood / Edgbaston
  B17: { lat: 52.4570, lon: -1.9680 }, // Harborne
  B18: { lat: 52.4920, lon: -1.9240 }, // Winson Green / Hockley
  B19: { lat: 52.4980, lon: -1.9050 }, // Lozells
  B20: { lat: 52.5150, lon: -1.9120 }, // Handsworth Wood
  B21: { lat: 52.5040, lon: -1.9350 }, // Handsworth
  B23: { lat: 52.5280, lon: -1.8380 }, // Erdington
  B24: { lat: 52.5180, lon: -1.8210 }, // Erdington East
  B25: { lat: 52.4610, lon: -1.8150 }, // Yardley
  B26: { lat: 52.4520, lon: -1.7850 }, // Sheldon
  B27: { lat: 52.4410, lon: -1.8210 }, // Acocks Green
  B28: { lat: 52.4320, lon: -1.8480 }, // Hall Green
  B29: { lat: 52.4380, lon: -1.9420 }, // Selly Oak
  B30: { lat: 52.4280, lon: -1.9300 }, // Bournville
  B31: { lat: 52.4120, lon: -1.9680 }, // Northfield
  B32: { lat: 52.4410, lon: -1.9980 }, // Bartley Green / Woodgate
  B33: { lat: 52.4820, lon: -1.7920 }, // Kitts Green
  B34: { lat: 52.5010, lon: -1.7750 }, // Shard End
  B36: { lat: 52.5020, lon: -1.7580 }, // Castle Bromwich
  B37: { lat: 52.4780, lon: -1.7280 }, // Chelmsley Wood
  B38: { lat: 52.4020, lon: -1.9280 }, // Kings Norton
  B42: { lat: 52.5310, lon: -1.9120 }, // Perry Barr
  B43: { lat: 52.5410, lon: -1.9420 }, // Great Barr
  B44: { lat: 52.5450, lon: -1.8890 }, // Kingstanding
  B45: { lat: 52.3850, lon: -2.0010 }, // Rednal / Rubery

  // Sutton Coldfield
  B72: { lat: 52.5620, lon: -1.8230 },
  B73: { lat: 52.5450, lon: -1.8450 },
  B74: { lat: 52.5850, lon: -1.8380 },
  B75: { lat: 52.5880, lon: -1.8020 },

  // Solihull
  B90: { lat: 52.3980, lon: -1.8150 }, // Shirley
  B91: { lat: 52.4130, lon: -1.7780 }, // Solihull Central
  B92: { lat: 52.4380, lon: -1.7650 }, // Olton / Elmdon
  B93: { lat: 52.3780, lon: -1.7450 }, // Knowle / Dorridge
  B94: { lat: 52.3480, lon: -1.7820 }, // Hockley Heath

  // Surrounding West Midlands Hubs
  WS1: { lat: 52.5860, lon: -1.9820 }, // Walsall Central
  WS2: { lat: 52.5920, lon: -2.0050 },
  WV1: { lat: 52.5870, lon: -2.1280 }, // Wolverhampton
  DY1: { lat: 52.5110, lon: -2.0830 }, // Dudley
  DY5: { lat: 52.4850, lon: -2.1250 }, // Brierley Hill
  CV1: { lat: 52.4080, lon: -1.5100 }, // Coventry Central
}

/**
 * Extracts outward code (e.g. 'B17', 'B91', 'WS1') or full postcode from address string
 */
export function extractPostcode(address) {
  if (!address || typeof address !== 'string') return null
  const cleaned = address.toUpperCase().trim()

  // Match full UK postcode (e.g. B17 9PT, B91 3AL)
  const fullMatch = cleaned.match(/\b([A-Z]{1,2}[0-9][A-Z0-9]?)\s*([0-9][A-Z]{2})\b/i)
  if (fullMatch) {
    return {
      full: `${fullMatch[1].toUpperCase()} ${fullMatch[2].toUpperCase()}`,
      outward: fullMatch[1].toUpperCase(),
    }
  }

  // Match outward code only (e.g. B17, B91)
  const outwardMatch = cleaned.match(/\b([A-Z]{1,2}[0-9]{1,2})\b/i)
  if (outwardMatch) {
    return {
      full: outwardMatch[1].toUpperCase(),
      outward: outwardMatch[1].toUpperCase(),
    }
  }

  return null
}

/**
 * Calculate Haversine straight-line distance in statute miles
 */
function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8 // Radius of the earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Estimates road distance in miles between pickup and delivery
 */
export function calculateRoadDistance(pickupAddress, deliveryAddress) {
  const p1 = extractPostcode(pickupAddress)
  const p2 = extractPostcode(deliveryAddress)

  // 1. Both outward postcodes found in our centroid map
  if (p1?.outward && p2?.outward) {
    const c1 = POSTCODE_CENTROIDS[p1.outward]
    const c2 = POSTCODE_CENTROIDS[p2.outward]

    if (c1 && c2) {
      if (p1.outward === p2.outward) {
        // Same postcode district (e.g. B17 to B17)
        return 1.8
      }
      const crowMiles = haversineMiles(c1.lat, c1.lon, c2.lat, c2.lon)
      // Multiply by urban road winding factor (~1.28 in Birmingham)
      const roadMiles = Math.max(1.5, Math.round(crowMiles * 1.28 * 10) / 10)
      return roadMiles
    }
  }

  // 2. Fallback heuristic based on town matching
  const t1 = (pickupAddress || '').toLowerCase()
  const t2 = (deliveryAddress || '').toLowerCase()

  if (t1.includes('solihull') && t2.includes('solihull')) return 2.8
  if (t1.includes('harborne') && t2.includes('harborne')) return 1.6
  if (t1.includes('edgbaston') && t2.includes('edgbaston')) return 2.1
  if ((t1.includes('birmingham') || t1.includes('harborne')) && t2.includes('solihull')) return 9.4
  if (t1.includes('birmingham') && t2.includes('sutton coldfield')) return 8.2
  if (t1.includes('birmingham') && t2.includes('coventry')) return 19.5
  if (t1.includes('birmingham') && t2.includes('walsall')) return 10.2

  // Standard intra-city default
  return 4.2
}

/**
 * Estimates transit duration in minutes
 * Speed assumptions: Average 22 mph in urban traffic + 8 mins handover & custody checks
 */
export function calculateTransitMinutes(distanceMiles) {
  const drivingMinutes = (distanceMiles / 22) * 60
  const handoverBuffer = 8 // Parking, recipient ring, custody verification
  return Math.max(12, Math.round(drivingMinutes + handoverBuffer))
}

/**
 * Computes Estimated Time of Delivery (ETA) & Window
 * 
 * @param {Object} params
 * @param {string} params.pickupAddress - Dispensary address
 * @param {string} params.deliveryAddress - Patient / recipient address
 * @param {string|Date} params.collectionTime - ISO string or Date of courier collection
 * @param {string} params.status - 'received' | 'verifying' | 'dispatched' | 'delivered'
 * @param {string|Date} params.deliveredTime - Actual delivered time if already delivered
 */
export function calculateDeliveryETA({
  pickupAddress,
  deliveryAddress,
  collectionTime = null,
  status = 'dispatched',
  deliveredTime = null,
}) {
  const distanceMiles = calculateRoadDistance(pickupAddress, deliveryAddress)
  const transitMinutes = calculateTransitMinutes(distanceMiles)

  // Reference timestamp for collection
  const collectDate = collectionTime ? new Date(collectionTime) : new Date()

  // Base ETA = collection time + transit duration
  const etaDate = new Date(collectDate.getTime() + transitMinutes * 60 * 1000)

  // Window = [ETA - 5 mins, ETA + 15 mins]
  const windowStartDate = new Date(etaDate.getTime() - 5 * 60 * 1000)
  const windowEndDate = new Date(etaDate.getTime() + 15 * 60 * 1000)

  const formatTime = (d) =>
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (d) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  const etaTimeStr = formatTime(etaDate)
  const windowStr = `${formatTime(windowStartDate)} – ${formatTime(windowEndDate)}`

  // Remaining minutes from now
  const now = new Date()
  const remainingMins = Math.round((etaDate.getTime() - now.getTime()) / 60000)

  let displayStatusText = ''
  if (status === 'delivered') {
    const delivDate = deliveredTime ? new Date(deliveredTime) : new Date()
    displayStatusText = `Delivered at ${formatTime(delivDate)} on ${formatDate(delivDate)}`
  } else if (status === 'dispatched') {
    if (remainingMins > 0) {
      displayStatusText = `Estimated ${windowStr} (in ~${remainingMins} mins)`
    } else {
      displayStatusText = `Arriving now (${windowStr})`
    }
  } else if (status === 'verifying') {
    displayStatusText = `Est. ${windowStr} (upon courier collection)`
  } else {
    displayStatusText = `Est. ${windowStr} (awaiting dispatch)`
  }

  return {
    distanceMiles,
    transitMinutes,
    etaDate: etaDate.toISOString(),
    etaTime: etaTimeStr,
    windowStr,
    collectionTimeFormatted: collectionTime ? formatTime(collectDate) : null,
    collectionDateFormatted: collectionTime ? formatDate(collectDate) : null,
    displayStatusText,
    remainingMins,
  }
}

