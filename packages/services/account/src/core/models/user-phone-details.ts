 import * as Sequelize from 'sequelize'

 import { UserPhoneDetails } from '@abx-types/account'

 export interface UserPhoneDetailsInstance extends Sequelize.Instance<UserPhoneDetails>, UserPhoneDetails { }

 export default function (sequelize: Sequelize.Sequelize) {
   return sequelize.define<UserPhoneDetailsInstance, UserPhoneDetails>('user_phone_details', {
     id: {
       type: Sequelize.UUID,
       primaryKey: true,
     },
     userId: {
       type: Sequelize.UUID,
       allowNull: false,
       references: {
         model: 'user',
         key: 'id'
       }
     },
     notificationsToken: {
       type: Sequelize.STRING,
       allowNull: true,
     },
     uuidPhone: {
       type: Sequelize.STRING,
       allowNull: true,
     },
     pinCodeHash: {
       type: Sequelize.STRING,
       allowNull: true,
     },
     notificationsPreferences: {
       type: Sequelize.JSONB,
       allowNull: true,
     },
     verificationCodePhone: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
   })
 }
