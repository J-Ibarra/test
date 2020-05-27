import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.user_phone_details
      ADD COLUMN "notificationsPreferences" jsonb default 
      '{
            "Deposit_Completes":
                {
                    "enabled": true,
                    "description": "A deposit completes"
                },
            "Withdraw_Completes":
                {
                    "enabled": true,
                    "description": "A withdraw completes"
                },
            "Wallet_New_Device":
                {
                    "enabled": true,
                    "description": "Wallet in new device"
                },
            "Login_New_Device":
                {
                    "enabled": true,
                    "description": "Login in new device"
                },
            "Login_Failed":
                {
                    "enabled": true,
                    "description": "Login failed"
                },
            "Order_Placed":
                {
                    "enabled": true,
                    "description": "Order is placed"
                },
            "Order_Completely_Fills":
                {
                    "enabled": true,
                    "description": "Order completely fills"
                }
        }' ;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
    return sequelize.query(`
      ALTER TABLE public.user_phone_details
        DROP COLUMN "notificationsPreferences";
    `)
  }