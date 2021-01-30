import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { generateUploadURL } from '../../businessLogic/todo'

import { getUserId } from '../utils'

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  try{
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    let [result, uploadedUrl] = await generateUploadURL(userId, todoId)


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