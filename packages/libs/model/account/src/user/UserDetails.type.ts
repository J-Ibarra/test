import { User } from './User.interface'
export type UserDetails = Pick<User, 'firstName' | 'lastName' | 'email'>
