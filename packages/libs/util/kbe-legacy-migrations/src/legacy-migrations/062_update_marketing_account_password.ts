import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    UPDATE public.user SET "passwordHash"='$2a$10$J5pSusmvXHAHb5KNeDLlxuMHfXCxHgWD/Nf987at4OwiKkE3ARBI2' WHERE email='marketing@abx.com';
    `)
}

export async function down() {
  // Not needed
}
