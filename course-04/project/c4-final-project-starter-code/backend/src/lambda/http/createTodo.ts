import 'source-map-support/register'

import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'

import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()

const logger = createLogger('auth')

const todosTable = process.env.TODOS_TABLE;

export const handler : APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  try{
  logger.info('Creating a new Todo item')
  const newTodoRequest: CreateTodoRequest = JSON.parse(event.body)

  // TODO: Implement creating a new TODO item
  const userId = getUserId(event)
  const todoId = uuid.v4()

  const newItem = await createNewTodo(newTodoRequest, userId, todoId)

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

async function createNewTodo(newTodoRequest: CreateTodoRequest, 
            userId: string, todoId:string) {

  const createdAt = new Date().toISOString();

  const newItem = {
    userId : userId,
    todoId: todoId,
    createdAt : createdAt,
    name: newTodoRequest.name,
    dueDate: newTodoRequest.dueDate,
    done: false
  }

  await docClient
    .put({
      TableName: todosTable,
      Item: newItem
    })
    .promise()

  return newItem
}