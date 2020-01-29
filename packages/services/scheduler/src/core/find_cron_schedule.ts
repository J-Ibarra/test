import * as _ from 'lodash'
import { getModel } from '@abx-utils/db-connection-utils'
import { CronSchedule, CronScheduleMap } from './interfaces'

// Returns hash of the cron name as the key and the actual cron as the value.
export async function findCronSchedule() {
  const crons = await getModel<CronSchedule>('cronSchedule').findAll({})
  return crons
    .map(c => c.get())
    .reduce(
      (acc, { active, cron, name, timezone }) => ({
        ...acc,
        [name]: {
          active,
          cron,
          timezone,
        },
      }),
      {},
    ) as CronScheduleMap
}
