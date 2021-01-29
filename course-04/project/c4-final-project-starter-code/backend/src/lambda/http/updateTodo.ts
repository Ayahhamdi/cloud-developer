import 'source-map-support/register'

import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'

import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE
const todoIdIndex = process.env.TODO_ID_INDEX

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  try{
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  const userId = getUserId(event)
  const result = await updateSelectedTodo(userId, todoId, updatedTodo)

  return {
    statusCode: 200,
    headers:{
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
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

async function updateSelectedTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest) {

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
    await docClient.update({
        TableName: todosTable,
        Key: key,
        ExpressionAttributeNames: {"#N": "name"},
        UpdateExpression: "set #N=:name, dueDate=:dueDate, done=:done",
        ExpressionAttributeValues:{
        ":name":updatedTodo.name,
        ":dueDate":updatedTodo.dueDate,
        ":done":updatedTodo.done
    },
    ReturnValues:"UPDATED_NEW"
    }).promise()
  }
  return result
}


