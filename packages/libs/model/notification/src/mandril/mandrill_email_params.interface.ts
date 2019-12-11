import { MandrillEmail } from '.'

import { FormattedTemplateContent } from '../email/formatted_template_content.interface'
import { EmailTemplates } from '../email'

export interface MandrillEmailParams {
  message: MandrillEmail
  templateName: EmailTemplates
  templateContent: FormattedTemplateContent[]
}
