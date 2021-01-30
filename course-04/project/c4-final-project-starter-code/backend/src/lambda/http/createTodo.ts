import 'source-map-support/register'

import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createTodo } from '../../businessLogic/todo'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createLogger } from '../../utils/logger'

import * as uuid from 'uuid'

import { getUserId } from '../utils'

const logger = createLogger('auth')


export const handler : APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  // TODO: Implement creating a new TODO item Done
  try{
  logger.info('Creating a new Todo item')
  const newTodoRequest: CreateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event)
  const todoId = uuid.v4()
  const newItem = await createTodo(userId, todoId, newTodoRequest)

  return {
    statusCode: 201,
    headers:{
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item :{
        ...newItem,
      }
    })
  }
} catch(e){
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({e})
    }
  }
}
