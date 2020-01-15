import * as Sequelize from 'sequelize'

import { PersonalBankDetails } from '@abx-types/account'

export interface PersonalBankDetailsInstance
  extends Sequelize.Instance<PersonalBankDetails>,
    PersonalBankDetails {}

export default function(sequelize: Sequelize.Sequelize) {
  return sequelize.define<PersonalBankDetailsInstance, PersonalBankDetails>('bank_details', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      autoIncrement: true,
    },
    accountHolderName: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    bankName: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    iban: {
      type: Sequelize.TEXT,
    },
    bankSwiftCode: {
      type: Sequelize.TEXT,
    },
    routingCode: {
      type: Sequelize.TEXT,
    },
    abaNumber: {
      type: Sequelize.TEXT,
    },
    accountNumber: {
      type: Sequelize.TEXT,
    },
    bankAddress: {
      type: Sequelize.TEXT,
    },
    notes: {
      type: Sequelize.TEXT,
    },
    accountId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'account',
        key: 'id',
      },
    },
  })
}
