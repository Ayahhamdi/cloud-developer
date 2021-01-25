import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getUserId } from '../utils'

import * as AWS  from 'aws-sdk'

import * as middy from 'middy'


import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE;

export const handler: APIGatewayProxyHandler = middy( async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  // TODO: Remove a TODO item by id
  const userId = getUserId(event)
  const deleted = await docClient.delete({
      TableName: todosTable,
      IndexName: todoId,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
    }
  })
  .promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deleted
    })
  }
})

/*handler.use(
  cors({
    credentials: true
  })
)*/
