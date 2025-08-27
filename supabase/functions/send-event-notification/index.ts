// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleOptions, withCorsJson } from '../_shared/cors.ts'

type NotificationEvent = 
  | 'appointment_booking'
  | 'new_appointment_notification'
  | 'appointment_update'
  | 'contact_message_notification'
  | 'contact_message';

interface NotificationData {
  event: NotificationEvent;
  recipientEmail: string;
  recipientName?: string;
  data: any;
  adminEmails?: string[]; // When empty or missing, we'll fetch staff+admin from profiles
}

// CORS handled via shared helper

// Brand palette
const COLORS = {
  primary: '#467c37',  // green
  navy: '#1a365d',
  gold: '#d4af37',
  text: '#2d3748',     // charcoal
  subtext: '#4a5568',  // slateGray
  light: '#f7fafc',
  border: '#e2e8f0',
}

const baseUrl = 'https://ogetto-otachi-law-firm.web.app'

function formatDayAndDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = d.toLocaleDateString('en-US', { weekday: 'long' })
    const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    return `${day}, ${date}`
  } catch {
    return dateStr
  }
}

function bookingConfirmationTemplate(name: string, data: any) {
  return {
    subject: 'Appointment Booking Confirmation - Ogetto, Otachi & Company Advocates',
    html: `
    <div style="font-family: 'Open Sans', Arial, sans-serif; max-width: 680px; margin:0 auto; color:${COLORS.text};">
      <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.navy} 100%); padding:28px 24px; color:#fff; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:22px; letter-spacing:0.3px;">Appointment Booking Confirmation</h1>
        <p style="margin:6px 0 0; opacity:.9">Thank you, ${name || 'there'}. We have received your request.</p>
      </div>
      <div style="background:#fff; border:1px solid ${COLORS.border}; border-top:0; border-radius:0 0 12px 12px; padding:24px;">
        <p style="margin:0 0 16px">Here are your appointment details:</p>
        <div style="background:${COLORS.light}; border:1px solid ${COLORS.border}; border-left:4px solid ${COLORS.gold}; border-radius:8px; padding:16px;">
          <p style="margin:0 0 6px"><strong>Name:</strong> ${data.client_name}</p>
          <p style="margin:0 0 6px"><strong>Email:</strong> ${data.client_email}</p>
          <p style="margin:0 0 6px"><strong>Practice Area:</strong> ${data.practice_area}</p>
          <p style="margin:0 0 6px"><strong>Preferred Date:</strong> ${formatDayAndDate(data.preferred_date)}</p>
          <p style="margin:0 0 6px"><strong>Preferred Time:</strong> ${data.preferred_time}</p>
          <p style="margin:0 "><strong>Appointment Type:</strong> ${data.appointment_type}</p>
        </div>
        <p style="margin:16px 0 0; color:${COLORS.subtext}">Our team will contact you within 24 hours to confirm your appointment.</p>
      </div>
      <div style="text-align:center; margin-top:18px; color:${COLORS.subtext}; font-size:12px;">© Ogetto, Otachi & Company Advocates</div>
    </div>
    `,
    text: `Dear ${name || 'there'},\n\nThank you for booking an appointment.\n\nName: ${data.client_name}\nEmail: ${data.client_email}\nPractice Area: ${data.practice_area}\nPreferred Date: ${formatDayAndDate(data.preferred_date)}\nPreferred Time: ${data.preferred_time}\nAppointment Type: ${data.appointment_type}\n\nWe will contact you within 24 hours to confirm your appointment.`,
  }
}

function contactClientTemplate(name: string, data: any) {
      return {
    subject: 'We received your message — Ogetto, Otachi & Company Advocates',
    html: `
    <div style="font-family: 'Open Sans', Arial, sans-serif; max-width: 680px; margin:0 auto; color:${COLORS.text};">
      <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.navy} 100%); padding:28px 24px; color:#fff; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:22px; letter-spacing:0.3px; color:#fff;">Thank you for contacting us</h1>
        <p style="margin:6px 0 0; opacity:.9">Hello ${name || 'there'}, we’ve received your message and will get back to you shortly.</p>
            </div>
      <div style="background:#fff; border:1px solid ${COLORS.border}; border-top:0; border-radius:0 0 12px 12px; padding:24px;">
        <p style="margin:0 0 16px">Here is a copy of your message for your records:</p>
        <div style="background:${COLORS.light}; border:1px solid ${COLORS.border}; border-left:4px solid ${COLORS.gold}; border-radius:8px; padding:16px;">
          <p style="margin:0 0 6px"><strong>Name:</strong> ${data.senderName || name}</p>
          <p style="margin:0 0 6px"><strong>Email:</strong> ${data.senderEmail || data.email || ''}</p>
          <p style="margin:0 0 6px"><strong>Subject:</strong> ${data.subject || '—'}</p>
          <p style="margin:12px 0 0"><strong>Message:</strong></p>
          <p style="margin:6px 0 0; white-space:pre-line">${pickMessage(data)}</p>
              </div>
        <p style="margin:16px 0 0; color:${COLORS.subtext}">Our team aims to respond within one business day.</p>
            </div>
      <div style="text-align:center; margin-top:18px; color:${COLORS.subtext}; font-size:12px;">© Ogetto, Otachi & Company Advocates</div>
          </div>
    `,
    text: `Hello ${name || 'there'},\n\nWe’ve received your message and will get back to you shortly.\n\nSubject: ${data.subject || '—'}\n\n${pickMessage(data)}`,
  }
}

function staffNotificationTemplate(name: string, data: any) {
  // Say "staff" instead of "admin" and use brand palette
      return {
    subject: `New Appointment Request from ${data.client_name} — Staff Notification`,
    html: `
    <div style="font-family: 'Open Sans', Arial, sans-serif; max-width: 680px; margin:0 auto; color:${COLORS.text};">
      <div style="background: linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.primary} 100%); padding:28px 24px; color:#fff; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:22px; letter-spacing:0.3px;">New Appointment — Staff Notification</h1>
        <p style="margin:6px 0 0; opacity:.9">Hello ${name || 'Staff Member'}, a new client request has been received.</p>
            </div>
      <div style="background:#fff; border:1px solid ${COLORS.border}; border-top:0; border-radius:0 0 12px 12px; padding:24px;">
        <div style="background:${COLORS.light}; border:1px solid ${COLORS.border}; border-left:4px solid ${COLORS.primary}; border-radius:8px; padding:16px;">
          <p style="margin:0 0 6px"><strong>Client Name:</strong> ${data.client_name}</p>
          <p style="margin:0 0 6px"><strong>Client Email:</strong> ${data.client_email}</p>
          <p style="margin:0 0 6px"><strong>Practice Area:</strong> ${data.practice_area}</p>
          <p style="margin:0 0 6px"><strong>Preferred Date:</strong> ${formatDayAndDate(data.preferred_date)}</p>
          <p style="margin:0 0 6px"><strong>Preferred Time:</strong> ${data.preferred_time}</p>
          <p style="margin:0 "><strong>Appointment Type:</strong> ${data.appointment_type}</p>
          ${data.message ? `<p style="margin:12px 0 0"><strong>Client Message:</strong></p><p style="margin:6px 0 0; white-space:pre-line">${data.message}</p>` : ''}
                </div>
        <div style="margin-top:18px; padding:16px; background:rgba(212,175,55,0.08); border:1px solid ${COLORS.gold}; border-radius:8px;">
          <h3 style="margin:0 0 8px; color:${COLORS.navy}">Action Required</h3>
          <p style="margin:0; color:${COLORS.subtext}">Please log into your staff dashboard to view details and proceed with assignment.</p>
              </div>
        <div style="text-align:center; margin-top:20px;">
          <a href="${data.dashboard_url || 'https://ogetto-otachi-law-firm.web.app/login'}" style="display:inline-block; background:${COLORS.gold}; color:${COLORS.navy}; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">Open Staff Dashboard</a>
            </div>
          </div>
      <div style="text-align:center; margin-top:18px; color:${COLORS.subtext}; font-size:12px;">© Ogetto, Otachi & Company Advocates</div>
            </div>
    `,
    text: `Dear ${name || 'Staff Member'},\n\nNew appointment request received.\n\nClient: ${data.client_name}\nEmail: ${data.client_email}\nPractice Area: ${data.practice_area}\nPreferred Date: ${formatDayAndDate(data.preferred_date)}\nPreferred Time: ${data.preferred_time}\nType: ${data.appointment_type}${data.message ? `\nMessage: ${data.message}` : ''}\n\nPlease log into the staff dashboard to view details and proceed with assignment.`,
  }
}

function adminNotificationTemplate(name: string, data: any) {
  // Distinct admin copy and CTA
      return {
    subject: `New Appointment Request from ${data.client_name} — Admin Notification`,
    html: `
    <div style="font-family: 'Open Sans', Arial, sans-serif; max-width: 680px; margin:0 auto; color:${COLORS.text};">
      <div style="background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.navy} 100%); padding:28px 24px; color:#fff; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:22px; letter-spacing:0.3px;">New Appointment — Admin Notification</h1>
        <p style="margin:6px 0 0; opacity:.9">Hello ${name || 'Administrator'}, a new client appointment request has been submitted.</p>
            </div>
      <div style="background:#fff; border:1px solid ${COLORS.border}; border-top:0; border-radius:0 0 12px 12px; padding:24px;">
        <div style="background:${COLORS.light}; border:1px solid ${COLORS.border}; border-left:4px solid ${COLORS.gold}; border-radius:8px; padding:16px;">
          <p style="margin:0 0 6px"><strong>Client Name:</strong> ${data.client_name}</p>
          <p style="margin:0 0 6px"><strong>Client Email:</strong> ${data.client_email}</p>
          <p style="margin:0 0 6px"><strong>Practice Area:</strong> ${data.practice_area}</p>
          <p style="margin:0 0 6px"><strong>Preferred Date:</strong> ${formatDayAndDate(data.preferred_date)}</p>
          <p style="margin:0 0 6px"><strong>Preferred Time:</strong> ${data.preferred_time}</p>
          <p style="margin:0 "><strong>Appointment Type:</strong> ${data.appointment_type}</p>
          ${data.message ? `<p style="margin:12px 0 0"><strong>Client Message:</strong></p><p style="margin:6px 0 0; white-space:pre-line">${data.message}</p>` : ''}
              </div>
        <div style="margin-top:18px; padding:16px; background:rgba(26,54,93,0.06); border:1px solid ${COLORS.navy}; border-radius:8px;">
          <h3 style="margin:0 0 8px; color:${COLORS.navy}">Admin Actions</h3>
          <ul style="margin:0; padding-left:18px; color:${COLORS.subtext}">
            <li>Review the request details</li>
            <li>Ensure staffing capacity and assignment rules</li>
            <li>Monitor SLA for confirmation communications</li>
          </ul>
            </div>
        <div style="text-align:center; margin-top:20px;">
          <a href="${data.admin_dashboard_url || 'https://ogetto-otachi-law-firm.web.app/login'}" style="display:inline-block; background:${COLORS.navy}; color:#fff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">Open Admin Dashboard</a>
            </div>
          </div>
      <div style="text-align:center; margin-top:18px; color:${COLORS.subtext}; font-size:12px;">© Ogetto, Otachi & Company Advocates</div>
            </div>
    `,
    text: `Dear ${name || 'Administrator'},\n\nNew appointment request received.\n\nClient: ${data.client_name}\nEmail: ${data.client_email}\nPractice Area: ${data.practice_area}\nPreferred Date: ${formatDayAndDate(data.preferred_date)}\nPreferred Time: ${data.preferred_time}\nType: ${data.appointment_type}${data.message ? `\nMessage: ${data.message}` : ''}\n\nPlease log into the admin dashboard to review and ensure timely processing.`,
  }
}

function pickMessage(data: any): string {
  console.log('🔍 pickMessage data:', JSON.stringify(data, null, 2))
  const candidates = [
    data?.message,
    data?.text,
    data?.body,
    data?.content,
    data?.message_text,
    data?.msg,
    data?.bodyText,
    data?.contactMessage,
    data?.contact_message,
  ]
  console.log('🔍 pickMessage candidates:', candidates)
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) {
      console.log('✅ pickMessage found:', c)
      return c
    }
  }
  console.log('❌ pickMessage no valid message found, returning —')
  return '—'
}

function getLastName(fullName?: string, fallback?: string): string {
  if (typeof fullName !== 'string' || fullName.trim().length === 0) return fallback || ''
  const parts = fullName.trim().split(/\s+/)
  const last = parts[parts.length - 1]
  return last || (fallback || '')
}

function contactStaffTemplate(name: string, data: any) {
  return {
    subject: `New Contact Message — Staff Notification`,
    html: `
    <div style="font-family: 'Open Sans', Arial, sans-serif; max-width: 680px; margin:0 auto; color:${COLORS.text};">
      <div style="background: linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.primary} 100%); padding:28px 24px; color:#fff; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:22px; letter-spacing:0.3px;">New Contact Message</h1>
        <p style="margin:6px 0 0; opacity:.9">Hello ${name || 'Staff Member'}, a potential client has sent a message.</p>
      </div>
      <div style="background:#fff; border:1px solid ${COLORS.border}; border-top:0; border-radius:0 0 12px 12px; padding:24px;">
        <div style="background:${COLORS.light}; border:1px solid ${COLORS.border}; border-left:4px solid ${COLORS.primary}; border-radius:8px; padding:16px;">
          <p style="margin:0 0 6px"><strong>Name:</strong> ${data.senderName}</p>
          <p style="margin:0 0 6px"><strong>Email:</strong> ${data.senderEmail}</p>
          <p style="margin:0 0 6px"><strong>Phone:</strong> ${data.senderPhone || 'Not provided'}</p>
          <p style="margin:0 0 6px"><strong>Subject:</strong> ${data.subject || '—'}</p>
          <p style="margin:12px 0 0"><strong>Message:</strong></p>
          <p style="margin:6px 0 0; white-space:pre-line">${pickMessage(data)}</p>
        </div>
        <div style="margin-top:18px; padding:16px; background:rgba(212,175,55,0.08); border:1px solid ${COLORS.gold}; border-radius:8px;">
          <p style="margin:0; color:${COLORS.subtext}">Please follow up within the SLA.</p>
        </div>
      </div>
      <div style="text-align:center; margin-top:18px; color:${COLORS.subtext}; font-size:12px;">© Ogetto, Otachi & Company Advocates</div>
    </div>
    `,
    text: `New contact message.\n\nName: ${data.senderName}\nEmail: ${data.senderEmail}\nPhone: ${data.senderPhone || 'Not provided'}\nSubject: ${data.subject || '—'}\n\n${pickMessage(data)}`,
  }
}

function contactAdminTemplate(name: string, data: any) {
  return {
    subject: `New Contact Message — Admin Notification`,
    html: `
    <div style="font-family: 'Open Sans', Arial, sans-serif; max-width: 680px; margin:0 auto; color:${COLORS.text};">
      <div style="background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.navy} 100%); padding:28px 24px; color:#fff; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:22px; letter-spacing:0.3px;">New Contact Message</h1>
        <p style="margin:6px 0 0; opacity:.9">Hello ${name || 'Administrator'}, a potential client has sent a message.</p>
      </div>
      <div style="background:#fff; border:1px solid ${COLORS.border}; border-top:0; border-radius:0 0 12px 12px; padding:24px;">
        <div style="background:${COLORS.light}; border:1px solid ${COLORS.border}; border-left:4px solid ${COLORS.gold}; border-radius:8px; padding:16px;">
          <p style="margin:0 0 6px"><strong>Name:</strong> ${data.senderName}</p>
          <p style="margin:0 0 6px"><strong>Email:</strong> ${data.senderEmail}</p>
          <p style="margin:0 0 6px"><strong>Phone:</strong> ${data.senderPhone || 'Not provided'}</p>
          <p style="margin:0 0 6px"><strong>Subject:</strong> ${data.subject || '—'}</p>
          <p style="margin:12px 0 0"><strong>Message:</strong></p>
          <p style="margin:6px 0 0; white-space:pre-line">${pickMessage(data)}</p>
        </div>
        <div style="margin-top:18px; padding:16px; background:rgba(26,54,93,0.06); border:1px solid ${COLORS.navy}; border-radius:8px;">
          <h3 style="margin:0 0 8px; color:${COLORS.navy}">Admin Actions</h3>
          <ul style="margin:0; padding-left:18px; color:${COLORS.subtext}">
            <li>Ensure timely response and assignment</li>
            <li>Track SLA compliance</li>
          </ul>
        </div>
      </div>
      <div style="text-align:center; margin-top:18px; color:${COLORS.subtext}; font-size:12px;">© Ogetto, Otachi & Company Advocates</div>
    </div>
    `,
    text: `New contact message.\n\nName: ${data.senderName}\nEmail: ${data.senderEmail}\nPhone: ${data.senderPhone || 'Not provided'}\nSubject: ${data.subject || '—'}\n\n${pickMessage(data)}`,
  }
}

async function sendMail({ to, subject, text, html }: { to: string, subject: string, text: string, html: string }) {
  const mailjetApiKey = Deno.env.get('MAILJET_API_KEY')
  const mailjetApiSecret = Deno.env.get('MAILJET_API_SECRET')
  const senderEmail = Deno.env.get('MAILJET_SENDER_EMAIL') || 'support@anydayessay.com'
  const senderName = Deno.env.get('MAILJET_SENDER_NAME') || 'Ogetto, Otachi & Company Advocates'

  if (!mailjetApiKey || !mailjetApiSecret) {
    console.log('⚠️ Mailjet credentials missing; log only', { to, subject })
    return true
  }

  const payload = {
    Messages: [
      {
        From: { Email: senderEmail, Name: senderName },
        To: [{ Email: to, Name: to }],
        Subject: subject,
        TextPart: text,
        HTMLPart: html,
      },
    ],
  }

  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${mailjetApiKey}:${mailjetApiSecret}`)}`,
    },
    body: JSON.stringify(payload),
  })
  const result = await res.json()
  if (!res.ok || result?.Messages?.[0]?.Status !== 'success') {
    console.error('❌ Mailjet error:', result)
    return false
  }
  return true
}

serve(async (req) => {
  const opt = handleOptions(req)
  if (opt) return opt

  try {
    const { event, recipientEmail, recipientName, data, adminEmails = [] } = (await req.json()) as NotificationData

    if (!event || !recipientEmail || !data) {
      return withCorsJson({ success: false, error: 'Missing required fields' }, 400, req)
    }

    // Always notify the person booking (client)
    if (event === 'appointment_booking') {
      const t = bookingConfirmationTemplate(recipientName || data.client_name, data)
      await sendMail({ to: recipientEmail, subject: t.subject, text: t.text, html: t.html })
    }

    // Build recipients with roles (staff + admin)
    type Recipient = { email: string; role: 'staff' | 'admin'; full_name?: string }
    let recipients: Recipient[] = []

    const buildFromProfiles = (profiles: Array<{ email: string; role: string; full_name?: string }>) => {
      const seen = new Set<string>()
      for (const p of profiles) {
        const email = (p.email || '').toLowerCase()
        if (!email || seen.has(email)) continue
        if (p.role === 'staff' || p.role === 'admin') {
          recipients.push({ email, role: p.role, full_name: p.full_name })
          seen.add(email)
        }
      }
    }

    // If explicit list provided, fetch roles for those emails
    if (Array.isArray(adminEmails) && adminEmails.length > 0) {
      try {
        const url = Deno.env.get('SUPABASE_URL')
        const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (url && key) {
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
          const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
          const { data: profiles, error } = await sb
            .from('profiles')
            .select('email, role, full_name')
            .in('email', adminEmails)
          if (!error && profiles?.length) buildFromProfiles(profiles as any)
        }
      } catch (e) {
        console.warn('⚠️ Could not fetch staff/admin profiles:', e?.message)
      }
    } else {
      // No explicit list; pull all staff + admin
      try {
        const url = Deno.env.get('SUPABASE_URL')
        const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (url && key) {
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
          const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
          const { data: profiles, error } = await sb
            .from('profiles')
            .select('email, role, full_name')
            .or('role.eq.admin,role.eq.staff')
          if (!error && profiles?.length) buildFromProfiles(profiles as any)
        }
      } catch (e) {
        console.warn('⚠️ Could not fetch staff/admin profiles:', e?.message)
      }
    }

    // Send staff notification for new requests/updates
    if (event === 'appointment_booking' || event === 'new_appointment_notification' || event === 'appointment_update') {
      const staffTpl = (name: string) => staffNotificationTemplate(name || 'Staff', { ...data, dashboard_url: data.dashboard_url || `${baseUrl}/login` })
      const adminTpl = (name: string) => adminNotificationTemplate(name || 'Administrator', { ...data, admin_dashboard_url: data.admin_dashboard_url || `${baseUrl}/login` })

      const tasks: Promise<any>[] = []
      for (const r of recipients) {
        const lastName = getLastName(r.full_name, r.role === 'admin' ? 'Administrator' : 'Staff')
        const tpl = r.role === 'admin' ? adminTpl(lastName) : staffTpl(lastName)
        tasks.push(sendMail({ to: r.email, subject: tpl.subject, text: tpl.text, html: tpl.html }))
      }
      const results = await Promise.allSettled(tasks)
      const ok = results.filter(r => r.status === 'fulfilled' && (r as any).value === true).length
      return withCorsJson({ success: ok > 0, sent: ok, attempted: recipients.length, admins: recipients.filter(r=>r.role==='admin').length, staff: recipients.filter(r=>r.role==='staff').length }, 200, req)
    }

    // Contact message notifications to client (sender)
    if (event === 'contact_message') {
      const t = contactClientTemplate(recipientName || data.senderName, data)
      const sent = await sendMail({ to: recipientEmail, subject: t.subject, text: t.text, html: t.html })
      return withCorsJson({ success: !!sent, sent: sent ? 1 : 0 }, 200, req)
    }

    // Contact message notifications to staff/admin
    if (event === 'contact_message_notification' || event === 'contact_message') {
      const staffTpl = (name: string) => contactStaffTemplate(name, data)
      const adminTpl = (name: string) => contactAdminTemplate(name, data)

      const tasks: Promise<any>[] = []
      for (const r of recipients) {
        const lastName = getLastName(r.full_name, r.role === 'admin' ? 'Administrator' : 'Staff') || (r.role === 'admin' ? 'Administrator' : 'Staff')
        const tpl = r.role === 'admin' ? adminTpl(lastName) : staffTpl(lastName)
        tasks.push(sendMail({ to: r.email, subject: tpl.subject, text: tpl.text, html: tpl.html }))
      }
      const results = await Promise.allSettled(tasks)
      const ok = results.filter(r => r.status === 'fulfilled' && (r as any).value === true).length
      return withCorsJson({ success: ok > 0, sent: ok, attempted: recipients.length, admins: recipients.filter(r=>r.role==='admin').length, staff: recipients.filter(r=>r.role==='staff').length }, 200, req)
    }

    return withCorsJson({ success: true }, 200, req)
  } catch (error) {
    console.error('❌ send-event-notification error:', error)
    return withCorsJson({ success: false, error: 'Internal server error' }, 500, req)
  }
})


