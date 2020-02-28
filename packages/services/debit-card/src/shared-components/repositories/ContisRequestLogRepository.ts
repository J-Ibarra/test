import { EntityRepository, Repository, EntityManager } from 'typeorm'

import { ContisRequestDetails, ContisRequestLog } from '../models/contis'

@EntityRepository(ContisRequestLog)
export class ContisRequestLogRepository extends Repository<ContisRequestLog> {
  saveContisRequestLog(
    contisRequestDetails: ContisRequestDetails,
    entityManager: EntityManager = this.manager,
  ): Promise<Partial<ContisRequestLog>> {
    return entityManager.save(ContisRequestLog, {
      ...contisRequestDetails,
    })
  }
}
