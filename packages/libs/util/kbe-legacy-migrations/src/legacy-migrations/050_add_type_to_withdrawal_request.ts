import { Sequelize } from 'sequelize'

// Setting the state to complete here after the withdrawal_state update
// This will be safe for production as we don't have data there
export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.withdrawal_request DROP COLUMN state;
    DROP TYPE withdrawal_state;
    
    CREATE TYPE withdrawal_state AS enum(
      'cancelled', 'completed', 'holdingsTransactionCompleted', 'pending'
    );
    CREATE TYPE withdrawal_request_type AS enum(
      'withdrawal', 'fee'
    );
  
    ALTER TABLE public.withdrawal_request ADD COLUMN type withdrawal_request_type NOT NULL;
    ALTER TABLE public.withdrawal_request ADD COLUMN state withdrawal_state NOT NULL;

    UPDATE public.withdrawal_request SET state='completed';
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.withdrawal_request
        DROP COLUMN type;

  `)
}
