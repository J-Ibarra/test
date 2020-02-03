import { CronJob } from 'cron'
import { noticeError } from 'newrelic'
import { Logger } from '@abx-utils/logging'
import {
  findCronSchedule,
  generateCronList,
  triggerMidPriceOlderThanOneDayCleanup,
  triggerExpiredOrdersCancellation,
  marketOHLCReconciliationTasks,
  publishAccountKycCheck,
} from './core'

const logger = Logger.getInstance('schedular', 'settle_order_match')

export async function bootstrapSchedulerService() {
  const tasks = [
    {
      name: 'orderExpiry',
      task: await triggerExpiredOrdersCancellation(),
    },
    {
      name: 'midPriceCleanup',
      task: triggerMidPriceOlderThanOneDayCleanup as any,
    },
    {
      name: 'accountKycCheck',
      task: publishAccountKycCheck,
    },
    ...marketOHLCReconciliationTasks,
  ]

  const cronSchedule = await findCronSchedule()
  const crons = generateCronList(tasks, cronSchedule)

  crons.forEach(cron => {
    // tslint:disable-next-line:no-unused-expression
    new CronJob(cron.cronTime, cron.task, null, true, cron.timeZone)

    logger.debug(`Scheduled ${cron.name} with cron expression ${cron.cronTime}`)
  })

  process.on('unhandledRejection', error => {
    noticeError(error)
    logger.error(`unhandledRejection inside schedular bootstrap: ${JSON.stringify(error)}`)
  })
}