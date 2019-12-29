export * from './epicurus'
import { sequelize } from '../../sequelize-setup'

import setupEventModel from './exchange_event.model'

setupEventModel(sequelize)

export * from './message_schema'
