/** Defines the properties required to establish db connection. */
export interface DbConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  /** Used for defining a different path for integration tests. */
  customEntitiesLocation?: string[] | null
  /** Used for defining a different path for integration tests. */
  customMigrationsLocation?: string | null
  /** Speeds up development/testing. */
  keepConnectionAlive?: boolean
}
