import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { TRANSACTION_TABLE, CARD_CONSTRAINT_TABLE } from '../shared-components/models'

export class TransactionNewFeeColumn1517769699959 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumns(TRANSACTION_TABLE, [
      new TableColumn({
        name: 'fee',
        type: 'numeric',
        default: 0,
      }),
    ])

    await queryRunner.query(`INSERT INTO ${CARD_CONSTRAINT_TABLE} VALUES (3, 'withdrawalFee', 1.5)`)
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn(TRANSACTION_TABLE, 'fee')
  }
}
