import { expect } from 'chai'
import { CronScheduleMap, CronTask, generateCronList } from '../core'

describe('generate cron list', () => {
  it('returns a hash of the name of the cron and the cron itself', function*() {
    const sampleCronSchedule: CronScheduleMap = {
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
    }
    const sampleTaskList: CronTask[] = [
      {
        name: 'randomReport',
        task: () => true,
      },
      {
        name: 'testReport',
        task: () => true,
      },
    ]
    const cronList = generateCronList(sampleTaskList, sampleCronSchedule)
    expect(cronList.length).to.eql(1)
    expect(cronList[0].cronTime).to.eql('sampleTestCron')
  })

  it('throws an error if there is not a cron schedule associated with a task', function*() {
    const sampleCronSchedule = {
      randomReport: {
        cron: 'sampleRandomCron',
        active: false,
        timezone: 'Australia/Sydney',
      },
    }
    const sampleTaskList = [
      {
        name: 'randomReport',
        task: () => true,
      },
      {
        name: 'testReport',
        task: () => true,
      },
    ]
    try {
      generateCronList(sampleTaskList, sampleCronSchedule)
      throw new Error('There should have been an error thrown')
    } catch (e) {
      expect(e.message).to.eql('Unable to find schedule for: testReport')
    }
  })
})
