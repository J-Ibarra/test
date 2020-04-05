import { EmailTemplates } from '@abx-types/notification'
import { Mandrill } from 'mandrill-api'
import moment from 'moment'
import config from '../../../config'
import { Logger } from '@abx-utils/logging'

interface SearchResultResponse {
  template: string
  email: string
}

const mandrillClient = new Mandrill(config.mandrillApi)
const logger = Logger.getInstance('notification', 'mandrill')

export async function verifyEmailSent(email: string, template: EmailTemplates, from: Date = moment().toDate()): Promise<boolean> {
  const emails = await getEmailsSent(email, template, from)

  return emails.length > 0
}

export async function getEmailsSentWithSpecificTemplate(
  email: string,
  templateName: EmailTemplates,
  from: Date = moment().toDate(),
): Promise<number> {
  const emails = await getEmailsSent(email, templateName, from)

  return emails.length
}

function getEmailsSent(email: string, template: EmailTemplates, from: Date): Promise<SearchResultResponse[]> {
  return new Promise((resolve, reject) => {
    mandrillClient.messages.search(
      {
        query: `${email}`,
        date_from: moment(from).format(),
      },
      (messages: SearchResultResponse[]) => {
        return resolve(
          messages.filter(
            ({ template: emailSentTemplateName }) =>
              emailSentTemplateName ===
              template
                .split(' ')
                .join('-')
                .toLowerCase(),
          ),
        )
      },
      err => {
        logger.error(`An error has ocurred while fetching emails for ${email}`)
        reject(err)
      },
    )
  })
}
