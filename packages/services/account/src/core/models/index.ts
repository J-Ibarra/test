import * as Sequelize from 'sequelize'

import Account from './account'
import BankDetails from './bank-details'
import Salesforce from './salesforceReferenceTable'
import Session from './session'
import Token from './token'
import User from './user'
import UserPhoneDetails from './user-phone-details'

export default function accountModels(sequelize: Sequelize.Sequelize) {
  const userModel = User(sequelize)
  const userPhoneDetailsModel = UserPhoneDetails(sequelize)
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
  userPhoneDetailsModel.belongsTo(userModel)

  return {
    account: accountModel,
    user: userModel,
    session: sessionModel,
    token: tokenModel,
    salesforce,
    bankDetails,
    userPhoneDetails: userPhoneDetailsModel
  }
}
