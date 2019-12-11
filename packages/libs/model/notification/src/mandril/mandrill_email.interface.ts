import { MandrillEmailAttachment, MandrillRecipients } from '.';

export interface MandrillEmail {
    attachments?: MandrillEmailAttachment[]
    from_email: string
    from_name?: string
    subject: string
    to: MandrillRecipients[]
  }