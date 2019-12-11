import { EmailInstance } from './email';
import { EmailAttachmentType } from './email_attachment.type';


export interface EmailAttachment {
    content: string
    email?: EmailInstance
    emailId?: number
    id?: number
    name: string
    type: EmailAttachmentType
  }