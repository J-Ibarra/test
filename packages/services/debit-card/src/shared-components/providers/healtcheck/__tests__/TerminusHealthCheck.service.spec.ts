import { TerminusHealthCheckService } from '../TerminusHealthCheck.service'

describe('TerminusHealthCheckService', () => {
  it('createTerminusOptions', () => {
    const endpoints = new TerminusHealthCheckService(
      {} as any,
    ).createTerminusOptions().endpoints

    expect(endpoints).toHaveLength(1)
    expect(endpoints[0].url).toEqual('/api/debit-cards/healthcheck')
  })
})
