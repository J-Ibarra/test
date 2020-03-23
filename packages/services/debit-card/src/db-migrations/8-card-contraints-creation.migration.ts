import { MigrationInterface, QueryRunner, Table } from 'typeorm'

import { CONTIS_REQUEST_LOG_TABLE } from '../shared-components/models/contis'
import { CARD_CONSTRAINT_TABLE } from '../shared-components/models'

export class CardConstraintsTableCreation1515769696650 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: CARD_CONSTRAINT_TABLE,
        columns: [
          {
            name: 'id',
            type: 'int',
            isGenerated: true,
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'value',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
      false,
      false,
    )

    await queryRunner.query(`INSERT INTO ${CARD_CONSTRAINT_TABLE} VALUES (1, 'minimumTopUpAmount', '50')`)
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(CONTIS_REQUEST_LOG_TABLE)
  }
}
