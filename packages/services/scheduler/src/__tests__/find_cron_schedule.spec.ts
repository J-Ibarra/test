import { expect } from 'chai'
import { getModel, truncateTables } from '@abx-utils/db-connection-utils'
import { CronSchedule, findCronSchedule } from '../core'

describe('find_cron_schedule', () => {
  before(function*() {
    yield truncateTables()

    yield getModel<CronSchedule>('cronSchedule').bulkCreate([
      {
        name: 'randomReport',
        timezone: 'Australia/Sydney',
        active: false,
        cron: 'sampleRandomCron',
      },
      {
        name: 'testReport',
        timezone: 'Australia/Sydney',
        active: true,
        cron: 'sampleTestCron',
      },
    ])
  })

  it('returns a hash of the name of the cron and the cron itself', function*() {
    const cronSchedule = yield findCronSchedule()

    expect(cronSchedule).to.eql({
      randomReport: {
        cron: 'sampleRandomCron',
        active: false,
        timezone: 'Australia/Sydney',
      },
      testReport: {
        cron: 'sampleTestCron',
        active: true,
        timezone: 'Australia/Sydney',
      },
    })
  })
})
