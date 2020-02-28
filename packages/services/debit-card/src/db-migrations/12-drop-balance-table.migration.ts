import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'
import { DEBIT_CARD_TABLE } from '../shared-components/models'

export class DropBalanceTable1517769699969 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('balance')
    await queryRunner.addColumns(DEBIT_CARD_TABLE, [
      new TableColumn({
        name: 'balance',
        type: 'numeric',
        default: '0',
      }),
    ])
  }

  async down(): Promise<any> {
    return Promise.resolve()
  }
}
