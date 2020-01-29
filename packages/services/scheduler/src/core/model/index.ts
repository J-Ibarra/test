import CronSchedule from './cron_schedule'

export default function (sequelize) {
  // Instantiation of each model with the database instance
  const CronScheduleModel = CronSchedule(sequelize)

  // Return each instance of the model under its model name
  return {
    CronSchedule: CronScheduleModel
  }
}
