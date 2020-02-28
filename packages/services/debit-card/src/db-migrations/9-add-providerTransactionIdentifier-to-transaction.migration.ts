import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { TRANSACTION_TABLE } from '../shared-components/models'

export class TransactionNewColumns1515769694459 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumns(TRANSACTION_TABLE, [
      new TableColumn({
        name: 'provider_transaction_identifier',
        type: 'numeric',
      }),
    ])
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn(TRANSACTION_TABLE, 'passport_number')
  }
}
