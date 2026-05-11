import sgMail from '@sendgrid/mail'
import { env } from '../config/env'
import { logger } from '../config/logger'

sgMail.setApiKey(env.SENDGRID_API_KEY)

interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
  templateId?: string
  dynamicTemplateData?: Record<string, unknown>
}

export async function sendEmail(options: EmailOptions) {
  try {
    await sgMail.send({
      from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME },
      to: options.to,
      subject: options.subject,
      text: options.text ?? "",
      html: options.html,
      templateId: options.templateId,
      dynamicTemplateData: options.dynamicTemplateData,
    })
    logger.info(`Email sent to ${options.to}: ${options.subject}`)
  } catch (err) {
    logger.error('SendGrid email error', err)
    throw new Error('Failed to send email')
  }
}


export async function sendBroadcastEmail(
  to: string,
  title: string,
  body: string
) {
  await sendEmail({ to, subject: title, html: `<p>${body}</p>` })
}
