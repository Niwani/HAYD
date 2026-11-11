import emailjs from '@emailjs/browser'

// EmailJS Configuration
// These values can be set in an .env file or updated here directly.
export const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  // Template for sending notification to healthatyourdoor.co@gmail.com
  ADMIN_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
  // Optional: Template for auto-reply back to the client
  AUTOREPLY_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID || '',
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
}

/**
 * Send contact email via EmailJS
 * @param {Object} data { name, email, phone, enquiry_type, message }
 */
export async function sendContactEmail(data) {
  const { SERVICE_ID, ADMIN_TEMPLATE_ID, AUTOREPLY_TEMPLATE_ID, PUBLIC_KEY } = EMAILJS_CONFIG

  if (!SERVICE_ID || !ADMIN_TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn(
      'EmailJS credentials not configured yet. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY.'
    )
    return { status: 200, text: 'Simulated success (configure keys in .env to send real emails)' }
  }

  const templateParams = {
    name: data.name,
    from_name: data.name,
    reply_to: data.email,
    email: data.email,
    phone: data.phone || 'Not provided',
    enquiry_type: data.enquiry_type || 'General enquiry',
    message: data.message,
    sent_at: new Date().toLocaleString('en-GB'),
  }

  // 1. Send notification to the company email (healthatyourdoor.co@gmail.com)
  const response = await emailjs.send(SERVICE_ID, ADMIN_TEMPLATE_ID, templateParams, PUBLIC_KEY)

  // 2. If an auto-reply template is configured, send acknowledgment back to the user
  if (AUTOREPLY_TEMPLATE_ID) {
    try {
      const autoReplyParams = {
        to_name: data.name,
        name: data.name,
        to_email: data.email,
        email: data.email,
        user_email: data.email,
        client_email: data.email,
        reply_to: 'healthatyourdoor.co@gmail.com',
        from_name: 'HAYD',
        message: data.message,
        message_preview: data.message.length > 150 ? data.message.slice(0, 150) + '...' : data.message,
      }
      await emailjs.send(SERVICE_ID, AUTOREPLY_TEMPLATE_ID, autoReplyParams, PUBLIC_KEY)
    } catch (autoErr) {
      console.error('Auto-reply email failed to send:', autoErr)
    }
  }

  return response
}

/**
 * Send collection booking details via EmailJS
 * @param {Object} data
 */
export async function sendCollectionBookingEmail(data) {
  const { SERVICE_ID, ADMIN_TEMPLATE_ID, AUTOREPLY_TEMPLATE_ID, PUBLIC_KEY } = EMAILJS_CONFIG

  if (!SERVICE_ID || !ADMIN_TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS not configured for booking.')
    return { status: 200, text: 'Simulated success' }
  }

  const bookingSummary = `
PHARMACY PRESCRIPTION COLLECTION BOOKING
-------------------------------------------
Reference / Tracking Code: ${data.reference}
Direct Tracking Link: https://thehayd.uk/track?ref=${data.reference}

DISPENSARY DETAILS:
• Pharmacy Name: ${data.pharmacy_name}
• Contact Name: ${data.contact_person || 'Dispensary Team'}
• Phone: ${data.phone}
• Email: ${data.email}
• Address: ${data.pickup_address || 'Dispensary counter'}

DELIVERY DESTINATION:
• Patient / Recipient: ${data.patient_name}
• Address: ${data.address_line1}${data.address_line2 ? ', ' + data.address_line2 : ''}, ${data.town}, ${data.postcode}
• Recipient Phone: ${data.recipient_phone || 'Not provided'}

MEDICINES & HANDLING:
• Categories: ${Array.isArray(data.categories) ? data.categories.join(', ') : 'Standard Prescription'}
• Total Bags/Packages: ${data.package_count || 1}
• Dispensary Notes: ${data.prescription_notes || 'None'}

TIMING:
• Collection Window: ${data.window_label || data.window_type}
• Scheduled Date/Slot: ${data.scheduled_date || ''} ${data.time_slot || ''}
• Additional Instructions: ${data.notes || 'None'}
`.trim()

  const adminParams = {
    name: data.pharmacy_name,
    from_name: `${data.pharmacy_name} [Booking ${data.reference}]`,
    reply_to: data.email,
    email: data.email,
    phone: data.phone,
    enquiry_type: `Collection Booking: ${data.reference}`,
    message: bookingSummary,
    sent_at: new Date().toLocaleString('en-GB'),
  }

  // 1. Alert dispatch
  const response = await emailjs.send(SERVICE_ID, ADMIN_TEMPLATE_ID, adminParams, PUBLIC_KEY)

  // 2. Auto-reply confirmation to pharmacy
  if (AUTOREPLY_TEMPLATE_ID && data.email) {
    try {
      const autoReplyParams = {
        to_name: data.pharmacy_name,
        name: data.pharmacy_name,
        to_email: data.email,
        email: data.email,
        user_email: data.email,
        client_email: data.email,
        reply_to: 'healthatyourdoor.co@gmail.com',
        from_name: 'HAYD Dispatch',
        message: `Your prescription collection request has been logged successfully under reference ${data.reference}.\n\nCourier pickup is scheduled for ${data.pharmacy_name}.\nYou can track the live delivery progress at:\nhttps://thehayd.uk/track?ref=${data.reference}`,
        message_preview: `Booking Confirmation: ${data.reference} — Scheduled for ${data.pharmacy_name}`,
      }
      await emailjs.send(SERVICE_ID, AUTOREPLY_TEMPLATE_ID, autoReplyParams, PUBLIC_KEY)
    } catch (err) {
      console.warn('Booking confirmation email failed:', err)
    }
  }

  return response
}
