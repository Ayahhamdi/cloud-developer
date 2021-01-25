import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils'

import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'

import * as middy from 'middy'

import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const todosTable = process.env.TODOS_TABLE;
const bucketName = process.env.TODOS_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export const handler: APIGatewayProxyHandler = middy (async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  const newTodoRequest: CreateTodoRequest = JSON.parse(event.body)

  // TODO: Implement creating a new TODO item
  const userId = getUserId(event)
  const todoId = uuid.v4()
  const newItem = await createTodo(todoId, newTodoRequest, userId)
  const url = getUploadUrl(todoId)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      newItem: newItem,
      uploadUrl: url
    })
  }
})

/*handler.use(
  cors({
    credentials: true
  })
)*/

async function createTodo(todoId: string, newTodo: CreateTodoRequest, userId: string) {
  const createdAt = new Date().toISOString();

  const newItem = {
    userId : userId,
    todoId: todoId,
    createdAt : createdAt,
    name : newTodo.name,
    dueDate: newTodo.dueDate,
    done: false,
    attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
  }

  await docClient
    .put({
      TableName: todosTable,
      Item: newItem
    })
    .promise()

  return newItem
}

function getUploadUrl(todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })
}