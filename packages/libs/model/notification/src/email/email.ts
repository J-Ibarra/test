import * as Sequelize from 'sequelize'
import { Email, NotificationStatus } from '.'
import { EmailAttachmentInstance } from './email_attachment'

export interface EmailInstance extends Sequelize.Instance<Email>, Email {
  getAttachments: Sequelize.HasManyGetAssociationsMixin<EmailAttachmentInstance>
}

export default function emailModel(sequelize: Sequelize.Sequelize) {
  return sequelize.define<EmailInstance, Email>('email', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    to: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    cc: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    bcc: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    fromName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    templateContent: {
      type: Sequelize.JSON,
      allowNull: false,
    },
    templateName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    subject: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    notificationStatus: {
      type: Sequelize.STRING,
      defaultValue: NotificationStatus.created,
    },
    mandrillResult: {
      type: Sequelize.JSON,
      allowNull: true,
    }
  })
}
