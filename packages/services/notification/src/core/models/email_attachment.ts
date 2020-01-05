import * as Sequelize from 'sequelize'
import { EmailAttachment } from '@abx-types/notification'
import { EmailInstance } from './email'

export interface EmailAttachmentInstance extends Sequelize.Instance<EmailAttachment>, EmailAttachment {
  getEmail: Sequelize.BelongsToGetAssociationMixin<EmailInstance>
}

export default function emailAttachmentModel(sequelize: Sequelize.Sequelize) {
  return sequelize.define<EmailAttachmentInstance, EmailAttachment>('emailAttachment', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    emailId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'email',
        key: 'id',
      }
    }
  }, {
    tableName: 'email_attachment',
  })
}
