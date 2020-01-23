import { Sequelize } from 'sequelize'

import AdminRequest from './admin_request'

export default function adminRequestModels(sequelize: Sequelize): any {
  const adminRequest = AdminRequest(sequelize)

  return {
    adminRequest,
  }
}
