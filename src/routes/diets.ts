import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function dailyDietRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const diets = await knex('diets').where('session_id', sessionId).select()

      return { diets }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getDietParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getDietParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const diet = await knex('diets')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      return { diet }
    },
  )

  app.get(
    '/metrics',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const metricsBD = await knex('diets').where('session_id', sessionId)

      let count = 0
      let sequence = 0
      let bestSequence = 0

      for (const diet of metricsBD) {
        if (diet.isDiet == true) {
          sequence += 1
        }
        if (diet.isDiet == false) {
          count = count < sequence ? sequence : count
          bestSequence = count < sequence ? sequence : count
          sequence = 0
        }
      }

      const metrics = {
        meals: metricsBD.length,
        dietMeals: metricsBD.filter((diet) => diet.isDiet == true).length,
        offDietMeals: metricsBD.filter((diet) => diet.isDiet == false).length,
        sequenceOfMealsInTheDiet: bestSequence,
      }

      return { metrics }
    },
  )

  app.post('/', async (request, reply) => {
    const createDietBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.string(),
      isDiet: z.boolean(),
    })

    const { name, description, date, isDiet } = createDietBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('diets').insert({
      id: randomUUID(),
      name,
      description,
      date,
      isDiet,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getDietParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getDietParamsSchema.parse(request.params)

      const updateDietBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        date: z.string(),
        isDiet: z.boolean(),
      })

      const { name, description, date, isDiet } = updateDietBodySchema.parse(
        request.body,
      )

      const { sessionId } = request.cookies

      await knex('diets')
        .where({
          session_id: sessionId,
          id,
        })
        .update({
          name,
          description,
          date,
          isDiet,
        })

      return reply.status(204).send()
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getDietParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getDietParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      await knex('diets')
        .where({
          session_id: sessionId,
          id,
        })
        .delete()

      return reply.status(204).send()
    },
  )
}
