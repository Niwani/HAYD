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
    // Return simulated success if keys are not added yet so the UI works seamlessly
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
      await emailjs.send(
        SERVICE_ID,
        AUTOREPLY_TEMPLATE_ID,
        {
          to_name: data.name,
          to_email: data.email,
          reply_to: 'healthatyourdoor.co@gmail.com',
          message_preview: data.message.length > 150 ? data.message.slice(0, 150) + '...' : data.message,
        },
        PUBLIC_KEY
      )
    } catch (autoErr) {
      console.warn('Auto-reply email failed to send:', autoErr)
    }
  }

  return response
}

