import 'source-map-support/register'

import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { getUserId } from '../utils'

import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE
const todoIdIndex = process.env.TODO_ID_INDEX

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  try {
  // TODO: Remove a TODO item by id
  const userId = getUserId(event)

  const result = await deleteSelectedTodo (userId, todoId)
  
  return {
    statusCode: 200,
    headers:{
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      items: result
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

async function deleteSelectedTodo(userId: string, todoId: string){

  const result = await docClient.query({
    TableName: todosTable,
    IndexName: todoIdIndex,
    KeyConditionExpression: 'userId = :userId and todoId = :todoId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':todoId': todoId
    },
    ProjectionExpression: 'userId, createdAt'
  }).promise()
  
  if (result.$response.data && result.$response.data.Items) {
    const key = {
        userId: result.$response.data.Items[0]['userId'],
        createdAt: result.$response.data.Items[0]['createdAt']
    }
    await docClient.delete({
        TableName: todosTable,
        Key: key
    }).promise()
  }
  return result
}

