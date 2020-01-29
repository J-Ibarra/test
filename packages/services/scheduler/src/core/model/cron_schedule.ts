import * as Sequelize from 'sequelize'
import { CronSchedule } from '../interfaces'

export interface CronScheduleInstance extends Sequelize.Instance<CronSchedule>, CronSchedule {}

export default function (sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'cron_schedule',
  }

  const cronSchedule = sequelize.define<CronScheduleInstance, CronSchedule>('cronSchedule', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    timezone: {
      type: Sequelize.STRING,
      allowNull: false
    },
    cron: {
      type: Sequelize.STRING,
      allowNull: false
    },
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    }
  }, options)

  return cronSchedule
}
