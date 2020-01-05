import { EmailAttachmentType } from './email_attachment.type'
import { Email } from './email.interface'

export interface EmailAttachment {
  content: string
  email?: Email
  emailId?: number
  id?: number
  name: string
  type: EmailAttachmentType
}
