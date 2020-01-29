import * as _ from 'lodash'
import { CronScheduleMap, CronTask } from './interfaces'

// Returns list of crons in format suitable for node-cron
export function generateCronList(taskList: CronTask[], cronSchedules: CronScheduleMap): any[] {
  return _.compact(
    _.map(taskList, task => {
      const schedule = cronSchedules[task.name]
      if (!schedule) {
        throw new Error('Unable to find schedule for: ' + task.name)
      }
      if (schedule.active) {
        return {
          name: task.name,
          cronTime: schedule.cron,
          timeZone: schedule.timezone,
          task: task.task,
        }
      }
      return false
    }),
  )
}
