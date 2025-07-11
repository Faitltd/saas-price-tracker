import nodemailer from 'nodemailer'
import twilio from 'twilio'
import { WebClient } from '@slack/web-api'
import { prisma } from '@/lib/prisma'
import { NotificationType, NotificationStatus } from '@prisma/client'

interface NotificationPayload {
  userId: string
  title: string
  message: string
  type: NotificationType
  data?: any
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter | null = null
  private twilioClient: any = null
  private slackClient: WebClient | null = null

  constructor() {
    this.initializeServices()
  }

  private initializeServices() {
    // Initialize email service
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    }

    // Initialize Twilio for SMS
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )
    }

    // Initialize Slack client
    if (process.env.SLACK_BOT_TOKEN) {
      this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN)
    }
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data || {},
          status: NotificationStatus.PENDING
        }
      })

      // Get user preferences
      const userPreferences = await prisma.userPreference.findUnique({
        where: { userId: payload.userId },
        include: { user: true }
      })

      if (!userPreferences) {
        console.warn(`No preferences found for user ${payload.userId}`)
        return
      }

      // Send notifications based on user preferences
      const promises: Promise<void>[] = []

      if (userPreferences.emailNotifications && payload.type === NotificationType.EMAIL) {
        promises.push(this.sendEmail(userPreferences.user.email, payload))
      }

      if (userPreferences.smsNotifications && payload.type === NotificationType.SMS && userPreferences.phoneNumber) {
        promises.push(this.sendSMS(userPreferences.phoneNumber, payload))
      }

      if (userPreferences.slackNotifications && payload.type === NotificationType.SLACK && userPreferences.slackWebhookUrl) {
        promises.push(this.sendSlackMessage(userPreferences.slackWebhookUrl, payload))
      }

      // Execute all notifications
      await Promise.allSettled(promises)

      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date()
        }
      })

    } catch (error) {
      console.error('Notification sending failed:', error)
      throw error
    }
  }

  private async sendEmail(email: string, payload: NotificationPayload): Promise<void> {
    if (!this.emailTransporter) {
      throw new Error('Email service not configured')
    }

    const mailOptions = {
      from: `${process.env.FROM_NAME || 'SaaS Price Tracker'} <${process.env.FROM_EMAIL || 'noreply@localhost'}>`,
      to: email,
      subject: payload.title,
      html: this.generateEmailHTML(payload),
      text: payload.message
    }

    await this.emailTransporter.sendMail(mailOptions)
    console.log(`📧 Email sent to ${email}`)
  }

  private async sendSMS(phoneNumber: string, payload: NotificationPayload): Promise<void> {
    if (!this.twilioClient) {
      throw new Error('SMS service not configured')
    }

    await this.twilioClient.messages.create({
      body: `${payload.title}\n\n${payload.message}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    })

    console.log(`📱 SMS sent to ${phoneNumber}`)
  }

  private async sendSlackMessage(webhookUrl: string, payload: NotificationPayload): Promise<void> {
    const slackPayload = {
      text: payload.title,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${payload.title}*\n${payload.message}`
          }
        }
      ]
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload)
    })

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`)
    }

    console.log('💬 Slack message sent')
  }

  private generateEmailHTML(payload: NotificationPayload): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${payload.title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SaaS Price Tracker</h1>
        </div>
        <div class="content">
            <h2>${payload.title}</h2>
            <p>${payload.message}</p>
            ${payload.data?.actionUrl ? `<p><a href="${payload.data.actionUrl}" class="button">Take Action</a></p>` : ''}
        </div>
        <div class="footer">
            <p>You're receiving this because you have notifications enabled for SaaS Price Tracker.</p>
            <p><a href="${process.env.APP_URL}/settings">Manage your notification preferences</a></p>
        </div>
    </div>
</body>
</html>
`
  }

  async sendPriceAlert(userId: string, alertData: any): Promise<void> {
    const { productName, planName, oldPrice, newPrice, changePercent } = alertData
    
    const title = `Price Alert: ${productName}`
    const message = `The price for ${productName} ${planName} has changed from $${oldPrice} to $${newPrice} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%)`

    await this.sendNotification({
      userId,
      title,
      message,
      type: NotificationType.EMAIL,
      data: alertData
    })
  }

  async sendDealAlert(userId: string, dealData: any): Promise<void> {
    const { productName, dealTitle, discountPercent, validUntil } = dealData
    
    const title = `Deal Alert: ${productName}`
    const message = `${dealTitle} - Save ${discountPercent}%! Valid until ${validUntil}`

    await this.sendNotification({
      userId,
      title,
      message,
      type: NotificationType.EMAIL,
      data: dealData
    })
  }

  async sendRenewalReminder(userId: string, subscriptionData: any): Promise<void> {
    const { productName, planName, renewalDate, amount } = subscriptionData
    
    const title = `Renewal Reminder: ${productName}`
    const message = `Your ${productName} ${planName} subscription ($${amount}) will renew on ${renewalDate}`

    await this.sendNotification({
      userId,
      title,
      message,
      type: NotificationType.EMAIL,
      data: subscriptionData
    })
  }
}
