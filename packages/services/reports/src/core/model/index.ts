import * as Sequelize from 'sequelize'
import StoredReports from './stored_reports'

export default function (sequelize: Sequelize.Sequelize) {
  const storedReportsModel = StoredReports(sequelize)

  return {
    StoredReports: storedReportsModel,
  }
}
