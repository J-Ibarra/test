import * as Sequelize from 'sequelize'
import { SalesforceReferenceTable } from '@abx-types/account'

export interface SalesforceDBInstance extends Sequelize.Instance<SalesforceReferenceTable> {}

export default function(sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'salesforce',
  }

  const salesforce = sequelize.define(
    'salesforce',
    {
      accountId: {
        type: Sequelize.UUID,
        references: {
          model: 'account',
          key: 'id',
        },
      },
      salesforceAccountId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      salesforcePlatformCredentialId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    options,
  )

  return salesforce
}
