export interface CronSchedule {
  id?: number
  name: string
  timezone: string
  cron: string
  active: boolean
}

export type CronScheduleMap = Record<CronSchedule['name'], Pick<CronSchedule, 'active' | 'cron' | 'timezone'>>

export interface CronTask {
  name: string
  task: () => any
}
