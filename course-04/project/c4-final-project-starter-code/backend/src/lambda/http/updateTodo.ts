import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'

import * as AWS  from 'aws-sdk'

import * as middy from 'middy'

import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE;

export const handler: APIGatewayProxyHandler = middy( async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  const userId = getUserId(event)
  const updatedItem = await updateTodo(todoId, updatedTodo, userId)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      updatedItem: updatedItem
    })
  }
})

async function updateTodo(todoId: string, updatedTodo: UpdateTodoRequest, userId: string) {

  const result = await docClient.update({
    TableName: todosTable,
    IndexName: todoId,
    UpdateExpression:{
      'name' : ':name',
      'dueDate' : ':dueDate',
      'set done' : ':done'
    },
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':name': updatedTodo.name,
      ':dueDate': updatedTodo.dueDate,
      ':done': updatedTodo.done
    }
  })
  .promise()

  return result
}

