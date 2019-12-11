import { EmailAttachment } from './email_attachment.interface';
import { NotificationStatus } from './notification_status.enum';
import { TradeConfirmationTemplateContent } from './trade_confirmation_template_content.interface';
import { EmailRequiredTemplateContent } from './email_required_template_content.interface';

type TemplateName = string
type TemplateContent = Record<string, string> | TradeConfirmationTemplateContent | EmailRequiredTemplateContent

export interface Email {
    attachments?: EmailAttachment[]
    bcc?: string
    cc?: string
    fromName?: string
    id?: number
    mandrillResult?: {}
    notificationStatus?: NotificationStatus
    subject: string
    templateContent: TemplateContent
    templateName: TemplateName
    to: string
  }