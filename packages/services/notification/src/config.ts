interface NotificationConfig {
  activeEnvironments: string[]
  notificationEnv: string
  fromEmail: string
  notificationSubjectPrefix: string
  mandrillApi: string
}

const notificationSubjectPrefix = process.env.MAILER_PREFIX ? `${process.env.MAILER_PREFIX}: ` : ''

const config: NotificationConfig = {
  activeEnvironments: ['uat', 'integration', 'production', 'development'],
  fromEmail: process.env.NOTIFICATION_FROM_EMAIL || 'no-reply@kinesis.money',
  mandrillApi: process.env.MANDRILL_API || '5U8lA1W0NPMIqwMsOYEbJg', // Test key
  notificationEnv: process.env.NOTIFICATION_ENV || 'development',
  notificationSubjectPrefix,
}

export default config
