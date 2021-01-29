import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { getUserId } from '../utils'

import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE
const todoIdIndex = process.env.TODO_ID_INDEX

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.TODOS_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  try{
    const todoId = event.pathParameters.todoId

    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const userId = getUserId(event)
    const uploadedUrl = await getUploadUrl(todoId)
    const result = await updateTodobyTodoId(userId, todoId)

    return {
      statusCode: 201,
      headers:{
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        uploadUrl: uploadedUrl,
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

async function getUploadUrl(todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })
}

async function updateTodobyTodoId(userId: string, todoId: string) {
  
  const attachmentUrl: string = 'https://' + bucketName + '.s3.amazonaws.com/' + todoId
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
        UpdateExpression: "set attachmentUrl = :attachmentUrl",
        ExpressionAttributeValues:{
        ":attachmentUrl":attachmentUrl
    },
    ReturnValues:"UPDATED_NEW"
    }).promise()
  }
  return result
}
