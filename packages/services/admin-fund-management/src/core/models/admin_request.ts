import * as Sequelize from 'sequelize'
import { AdminRequest, AdminRequestStatus, AdminRequestType } from '@abx-service-clients/admin-fund-management'

export interface AdminRequestInstance extends Sequelize.Instance<AdminRequest>, AdminRequest {}

export default function(sequelize: Sequelize.Sequelize) {
  const adminRequest = sequelize.define<AdminRequestInstance, AdminRequest>('admin_request', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    client: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    hin: {
      type: Sequelize.STRING,
    },
    type: {
      type: Sequelize.ENUM,
      values: Object.keys(AdminRequestType),
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
    },
    asset: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    amount: {
      type: Sequelize.NUMERIC,
      allowNull: false,
      get(this: AdminRequestInstance) {
        return parseFloat(this.getDataValue('amount')) || 0
      },
    },
    fee: {
      type: Sequelize.NUMERIC,
      allowNull: false,
      get(this: AdminRequestInstance) {
        return parseFloat(this.getDataValue('fee')) || 0
      },
    },
    admin: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM,
      values: Object.keys(AdminRequestStatus),
      allowNull: false,
    },
    tradingPlatformName: {
      type: Sequelize.STRING,
    },
    globalTransactionId: {
      type: Sequelize.STRING,
      unique: true,
    },
  })

  return { adminRequest }
}
