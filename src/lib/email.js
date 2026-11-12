import emailjs from '@emailjs/browser'

// EmailJS Configuration
// These values can be set in an .env file or updated here directly.
export const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  // Template for sending notification to healthatyourdoor.co@gmail.com
  ADMIN_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
  // Template for confirmation back to the pharmacy and recipient
  AUTOREPLY_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID || '',
  RECIPIENT_TEMPLATE_ID:
    import.meta.env.VITE_EMAILJS_RECIPIENT_TEMPLATE_ID ||
    import.meta.env.VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID ||
    '',
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
    subject: `New Enquiry from ${data.name} (${data.enquiry_type || 'General'})`,
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
        subject: 'Thank you for contacting HAYD',
        to_name: data.name,
        name: data.name,
        to_email: data.email,
        email: data.email,
        user_email: data.email,
        client_email: data.email,
        reply_to: 'healthatyourdoor.co@gmail.com',
        from_name: 'HAYD',
        message: `Thank you for contacting HAYD (Health At Your Door).\n\nWe have successfully received your enquiry. Our team is reviewing your message and will get back to you promptly.\n\nIf your enquiry is urgent, please call dispatch on 07761 734423.`,
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
 * 1. Alert to Dispatch (healthatyourdoor.co@gmail.com)
 * 2. Confirmation to Pharmacy (data.email)
 * 3. Delivery & Tracking Notice to Recipient (data.recipient_email)
 * @param {Object} data
 */
export async function sendCollectionBookingEmail(data) {
  const { SERVICE_ID, ADMIN_TEMPLATE_ID, AUTOREPLY_TEMPLATE_ID, RECIPIENT_TEMPLATE_ID, PUBLIC_KEY } =
    EMAILJS_CONFIG

  if (!SERVICE_ID || !ADMIN_TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS not configured for booking.')
    return { status: 200, text: 'Simulated success' }
  }

  const trackingUrl = `https://thehayd.uk/track?ref=${data.reference}`

  // -------------------------------------------------------------
  // 1. DISPATCH ALERT (Sent to healthatyourdoor.co@gmail.com)
  // -------------------------------------------------------------
  const bookingSummary = `
PHARMACY PRESCRIPTION COLLECTION BOOKING
-------------------------------------------
Reference / Tracking Code: ${data.reference}
Direct Tracking Link: ${trackingUrl}

DISPENSARY DETAILS:
• Pharmacy Name: ${data.pharmacy_name}
• Contact Person: ${data.contact_person || 'Dispensary Team'}
• Dispensary Phone: ${data.phone}
• Dispensary Email: ${data.email}
• Collection Address: ${data.pickup_address}

DELIVERY DESTINATION:
• Patient / Recipient: ${data.patient_name}
• Recipient Phone: ${data.recipient_phone || 'Not provided'}
• Recipient Email: ${data.recipient_email || 'Not provided'}
• Address: ${data.address_line1}${data.address_line2 ? ', ' + data.address_line2 : ''}, ${data.town}, ${data.postcode}
• Doorstep Notes: ${data.delivery_notes || 'None'}

MEDICINES & HANDLING:
• Categories: ${Array.isArray(data.categories) ? data.categories.join(' · ') : 'Standard Ambient'}
• Total Sealed Bags: ${data.package_count || 1}
• Dispensary Rx Reference: ${data.rx_reference || 'N/A'}

COLLECTION TIMING:
• Window: ${data.window_type} ${data.scheduled_date ? '(' + data.scheduled_date + ')' : ''} ${data.time_slot || ''}
`.trim()

  const adminParams = {
    subject: `New Collection Booking: ${data.reference} (${data.pharmacy_name})`,
    name: data.pharmacy_name,
    from_name: `${data.pharmacy_name} [Booking ${data.reference}]`,
    reply_to: data.email,
    email: data.email,
    phone: data.phone,
    enquiry_type: `Collection Booking: ${data.reference}`,
    message: bookingSummary,
    sent_at: new Date().toLocaleString('en-GB'),
  }

  // 1. Send alert to dispatch
  const response = await emailjs.send(SERVICE_ID, ADMIN_TEMPLATE_ID, adminParams, PUBLIC_KEY)

  // -------------------------------------------------------------
  // 2. PHARMACY CONFIRMATION EMAIL (Sent to pharmacy dispensary)
  // -------------------------------------------------------------
  if (AUTOREPLY_TEMPLATE_ID && data.email) {
    try {
      // 600ms pause to ensure clean sequencing
      await new Promise((r) => setTimeout(r, 600))

      const pharmacyMessage = `
Dear ${data.pharmacy_name} Dispensary Team,

Your prescription collection booking has been logged successfully in the HAYD dispatch system.

COLLECTION DETAILS:
• Manifest / Tracking Reference: ${data.reference}
• Collection Location: ${data.pickup_address}
• Delivering To: ${data.patient_name} (${data.town})
• Number of Packages: ${data.package_count} bag(s)
• Classification: ${Array.isArray(data.categories) ? data.categories.join(' · ') : 'Standard Ambient'}

LIVE MANIFEST TRACKING:
You can track courier assignment and proof of delivery in real time:
${trackingUrl}

Our uniformed, DBS-checked courier will arrive with a validated thermal carrier at your counter for handover against this reference. An electronic proof of delivery (POD) with signature will be logged upon arrival at the patient's door.

Thank you for partnering with HAYD.
`.trim()

      const pharmacyParams = {
        subject: `Collection Confirmed: ${data.reference} — ${data.pharmacy_name}`,
        to_name: data.pharmacy_name,
        name: data.pharmacy_name,
        to_email: data.email,
        email: data.email,
        user_email: data.email,
        client_email: data.email,
        reply_to: 'healthatyourdoor.co@gmail.com',
        from_name: 'HAYD Dispatch',
        pharmacy_name: data.pharmacy_name,
        tracking_code: data.reference,
        tracking_link: trackingUrl,
        message: pharmacyMessage,
        message_preview: `Collection Confirmed: ${data.reference} for ${data.pharmacy_name}`,
      }

      await emailjs.send(SERVICE_ID, AUTOREPLY_TEMPLATE_ID, pharmacyParams, PUBLIC_KEY)
      console.log('Pharmacy confirmation email sent successfully to', data.email)
    } catch (err) {
      console.error('Pharmacy confirmation email failed:', err)
    }
  }

  // -------------------------------------------------------------
  // 3. RECIPIENT / PATIENT EMAIL (Sent to the customer)
  // -------------------------------------------------------------
  const recipientTarget = (data.recipient_email || '').trim()
  if (RECIPIENT_TEMPLATE_ID && recipientTarget) {
    try {
      // 600ms pause to ensure clean sequencing
      await new Promise((r) => setTimeout(r, 600))

      const recipientMessage = `
Dear ${data.patient_name},

Your prescription order from ${data.pharmacy_name} has been scheduled for delivery to your address by HAYD (Health At Your Door).

DELIVERY SUMMARY:
• Dispensing Pharmacy: ${data.pharmacy_name}
• Delivery Address: ${data.address_line1}, ${data.town}, ${data.postcode}
• Tracking Reference: ${data.reference}

TRACK YOUR DELIVERY LIVE:
You can check the real-time status of your courier here:
${trackingUrl}

IMPORTANT DELIVERY NOTICE:
• Our courier delivers directly to your door in plain, tamper-evident packaging.
• For safety and regulatory standards, prescription medicines are never left unattended and may require a signature.

CLINICAL QUERIES:
If you have any questions regarding your prescribed medication, dosage, or instructions, please contact ${data.pharmacy_name} directly.

For delivery arrival updates, you can contact HAYD dispatch on 07761 734423.
`.trim()

      const recipientParams = {
        subject: `Your prescription from ${data.pharmacy_name} is on its way (Ref: ${data.reference})`,
        to_name: data.patient_name,
        name: data.patient_name,
        to_email: recipientTarget,
        email: recipientTarget,
        user_email: recipientTarget,
        client_email: recipientTarget,
        reply_to: data.email || 'healthatyourdoor.co@gmail.com',
        from_name: `HAYD (Delivering for ${data.pharmacy_name})`,
        pharmacy_name: data.pharmacy_name,
        recipient_name: data.patient_name,
        tracking_code: data.reference,
        tracking_link: trackingUrl,
        message: recipientMessage,
        message_preview: `Your prescription from ${data.pharmacy_name} is scheduled for delivery (Ref: ${data.reference})`,
      }

      await emailjs.send(SERVICE_ID, RECIPIENT_TEMPLATE_ID, recipientParams, PUBLIC_KEY)
      console.log('Recipient notification email sent successfully to', recipientTarget)
    } catch (err) {
      console.error('Recipient notification email failed:', err)
    }
  }

  return response
}
