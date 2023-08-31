// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    diets: {
      id: string
      session_id?: string
      name: string
      description: string
      date: string
      isDiet: boolean
      created_at: string
    }
  }
}
