import { EntityRepository, Repository, EntityManager } from 'typeorm'
import { CardConstraint } from '../models/config/CardConstraint.entity'

@EntityRepository(CardConstraint)
export class CardConstraintRepository extends Repository<CardConstraint> {
  getAllCardConstraints(
    entityManager: EntityManager = this.manager,
  ): Promise<CardConstraint[]> {
    return entityManager.find(CardConstraint)
  }
}
