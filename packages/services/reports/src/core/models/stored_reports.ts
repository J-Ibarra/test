import * as Sequelize from 'sequelize'

import { StoredReport } from '../interfaces'

export interface StoredReportInstance extends Sequelize.Instance<StoredReport>, StoredReport { }

export default function (sequelize: Sequelize.Sequelize) {
  const storedReport = sequelize.define<StoredReportInstance, StoredReport>('storedReport', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    accountId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'account',
        key: 'id'
      }
    },
    reportType: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    s3Key: {
      type: Sequelize.TEXT,
      allowNull: false,
    }
  }, {
      tableName: 'stored_reports'
    }
  )
  return storedReport
}

