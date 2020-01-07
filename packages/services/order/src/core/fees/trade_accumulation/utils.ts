import moment from 'moment'

export function extractMonthAndYearFromDate(date: Date): { month: number; year: number } {
  const dateMoment = moment(date)

  return {
    month: dateMoment.month(),
    year: dateMoment.year(),
  }
}
