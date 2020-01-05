import emailModel from './email'
import emailAttachmentModel from './email_attachment'

export default function emailModels(sequelize): any {
  const Email = emailModel(sequelize)
  const EmailAttachment = emailAttachmentModel(sequelize)

  Email.hasMany(EmailAttachment, {
    as: 'attachments',
  })

  EmailAttachment.belongsTo(Email, { as: 'email', foreignKey: 'emailId' })

  return {
    Email,
    EmailAttachment,
  }
}
