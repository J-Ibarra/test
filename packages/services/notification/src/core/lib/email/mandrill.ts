import { Mandrill } from 'mandrill-api'

import { getOperationsEmail } from '@abx-service-clients/reference-data'
import config from '../../../config'
import {
  Email,
  emailType,
  FormattedTemplateContent,
  MandrillEmail,
  MandrillEmailAttachment,
  MandrillEmailParams,
  MandrillRecipients,
  MandrillResponse,
  NotificationStatus,
  EmailTemplates,
} from '@abx-types/notification'

const mandrillClient = new Mandrill(config.mandrillApi)

export async function sendEmail(email: Email) {
  const mandrillEmail = toMandrillEmail(email)

  const mandrillResult = await sendToMandrill(mandrillEmail)
  const notificationStatus = getNotificationStatus(mandrillResult)

  return {
    mandrillResult,
    notificationStatus,
  }
}

export async function sendNotificationToOps(subject: string, text: string, html?: string) {
  return new Promise(async (resolve, reject) => {
    const isActiveEnvironment = config.activeEnvironments.includes(config.notificationEnv)
    const operationsEmail = await getOperationsEmail()

    if (isActiveEnvironment) {
      mandrillClient.messages.send(
        {
          message: {
            html: html || text,
            text,
            to: [
              {
                email: operationsEmail,
                type: 'to',
              },
            ],
            from_email: config.fromEmail,
            from_name: 'KBE API',
            merge_language: 'mailchimp',
            global_merge_vars: [],
            subject,
          },
        },
        resolve,
        reject,
      )
    } else {
      resolve([{ status: 'local' }])
    }
  })
}

function sendToMandrill({ templateName, templateContent, message }: MandrillEmailParams): Promise<MandrillResponse> {
  return new Promise((resolve, reject) => {
    const isActiveEnvironment = config.activeEnvironments.includes(config.notificationEnv)

    if (isActiveEnvironment) {
      const templateConfig = {
        template_name: templateName,
        template_content: [],
        message: {
          ...message,
          merge_language: 'mailchimp',
          global_merge_vars: templateContent,
        },
      }

      mandrillClient.messages.sendTemplate(templateConfig, resolve as any, reject)
    } else {
      resolve([{ status: 'local' }])
    }
  })
}

function toMandrillEmail(email: Email): MandrillEmailParams {
  return {
    message: formatMandrillMessage(email),
    templateContent: formatTemplateContent(email),
    templateName: email.templateName as EmailTemplates,
  }
}

function getNotificationStatus(response: MandrillResponse): NotificationStatus {
  const [{ status }] = response

  return ['queued', 'sent'].includes(status) ? NotificationStatus.sent : NotificationStatus.failed
}

function formatMandrillMessage(email: Email): MandrillEmail {
  const attachments = formatAttachments(email)
  const to = formatRecipients(email)

  return {
    attachments,
    from_email: config.fromEmail,
    from_name: email.fromName || undefined,
    subject: config.notificationSubjectPrefix.concat(email.subject),
    to,
  }
}

function formatTemplateContent({ templateContent }: Email): FormattedTemplateContent[] {
  return Object.entries(templateContent).map(([name, content]) => ({
    name: name.toUpperCase(),
    content,
  }))
}

function formatRecipients({ bcc, cc, to }: Email): MandrillRecipients[] {
  return [
    {
      email: to,
      type: emailType.to,
    },
    {
      email: cc!,
      type: emailType.cc,
    },
    {
      email: bcc!,
      type: emailType.bcc,
    },
  ].filter(({ email }) => !!email)
}

function formatAttachments({ attachments = [] }: Email): MandrillEmailAttachment[] {
  return attachments.map(({ content, name, type }) => ({
    type,
    name,
    content,
  }))
}
