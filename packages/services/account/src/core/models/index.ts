import * as Sequelize from 'sequelize'

import Account from './account'
import BankDetails from './bank-details'
import Salesforce from './salesforceReferenceTable'
import Session from './session'
import Token from './token'
import User from './user'

export default function accountModels(sequelize: Sequelize.Sequelize) {
  const userModel = User(sequelize)
  const accountModel = Account(sequelize)
  const sessionModel = Session(sequelize)
  const tokenModel = Token(sequelize)
  const salesforce = Salesforce(sequelize)
  const bankDetails = BankDetails(sequelize)

  accountModel.hasMany(userModel)
  userModel.belongsTo(accountModel)
  tokenModel.belongsTo(accountModel)
  salesforce.belongsTo(accountModel)
  bankDetails.belongsTo(accountModel)

  return {
    account: accountModel,
    user: userModel,
    session: sessionModel,
    token: tokenModel,
    salesforce,
    bankDetails,
  }
}
