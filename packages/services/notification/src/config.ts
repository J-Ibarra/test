import { Environment } from '@abx-types/reference-data'

interface NotificationConfig {
  activeEnvironments: string[]
  fromEmail: string
  notificationSubjectPrefix: string
  mandrillApi: string
}

const notificationSubjectPrefix = process.env.MAILER_PREFIX ? `${process.env.MAILER_PREFIX}: ` : ''

const config: NotificationConfig = {
  activeEnvironments: [
    Environment.uat,
    Environment.integration,
    Environment.production,
    Environment.development,
    Environment.staging,
    Environment.e2eAws,
    Environment.e2eLocal,
  ],
  fromEmail: process.env.NOTIFICATION_FROM_EMAIL || 'no-reply@kinesis.money',
  mandrillApi: process.env.MANDRILL_API || '5U8lA1W0NPMIqwMsOYEbJg', // Test key
  notificationSubjectPrefix,
}

export default config
