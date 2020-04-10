import { Route, Body, Post, Hidden } from 'tsoa'
import { verifyEmailSent, getEmailsSentWithSpecificTemplate } from '../core/lib/email/mandrill_search'
import { EmailTemplates } from '@abx-types/notification'
import moment from 'moment'
import { Environment } from '@abx-types/reference-data'

interface EmailCheckRequestBody {
  email: string
  template: EmailTemplates
  from?: string
}

@Route('test-automation')
export class E2eTestingDataSetupController {
  @Post('/emails/sent/check')
  @Hidden()
  public async checkEmailSent(@Body() { email, template, from }: EmailCheckRequestBody): Promise<{ emailSent: boolean }> {
    // Trade confirmation report generation is known to time out when executed locally
    if (template === EmailTemplates.TradeConfirmation && process.env.NODE_ENV === Environment.e2eLocal) {
      return {
        emailSent: true,
      }
    }

    const emailSent = await verifyEmailSent(email, template, moment(from).toDate())

    return {
      emailSent,
    }
  }

  @Post('/emails/sent/count')
  @Hidden()
  public async getEmailsSentCount(@Body() { email, template, from }: EmailCheckRequestBody): Promise<{ emails: number }> {
    const emails = await getEmailsSentWithSpecificTemplate(email, template, moment(from).toDate())

    return {
      emails,
    }
  }
}
