import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import {TodoItem} from '../models/TodoItem' 
import {TodoUpdate} from '../models/TodoUpdate'   

export class TodosAccess {

    constructor(
     private readonly docClient: DocumentClient = createDynamoDBClient(), 
     private readonly todosTable  = process.env.TODOS_TABLE,
     private readonly todoIdIndex = process.env.TODO_ID_INDEX) {
     }

    // Create a new Todo function should take TodoItem and return TodoItem
    async createNewTodo(newItem: TodoItem) : Promise<TodoItem> {
        
        await this.docClient
            .put({
            TableName: this.todosTable,
            Item: newItem
            })
            .promise()
        
        return newItem as TodoItem
    }

    // Delete a Todo function should take TodoItem and return TodoItem
    async deleteTodo(userId: string, todoId: string){

        const result = await this.docClient.query({
          TableName: this.todosTable,
          IndexName: this.todoIdIndex,
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
          await this.docClient.delete({
              TableName: this.todosTable,
              Key: key
          }).promise()
        }
        return result
    }

    // Generate Uploaded URL functions  
    async updateTodobyTodoId(userId: string, todoId: string, attachmentUrl: string){
    
    const result = await this.docClient.query({
        TableName: this.todosTable,
        IndexName: this.todoIdIndex,
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
        await this.docClient.update({
            TableName: this.todosTable,
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

    // Get All Todos
    async getTodosPerUser(userId: string): Promise<TodoItem[]>{
    const result = await this.docClient.query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
        ':userId': userId
        },
        ScanIndexForward: false
    }).promise()
    
    const items = result.Items

    return items as TodoItem[]
    }

    // Update TodoItem
    async updateTodo(userId: string, todoId: string, updatedTodo: TodoUpdate){

    const result = await this.docClient.query({
        TableName: this.todosTable,
        IndexName: this.todoIdIndex,
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
        await this.docClient.update({
            TableName: this.todosTable,
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
    

}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
      console.log('Creating a local DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    }
  
    return new XAWS.DynamoDB.DocumentClient()
  }
