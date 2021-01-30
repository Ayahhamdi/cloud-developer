import { TodosAccess } from '../dataLayer/todosAccess'
import { TodosBucketAccess } from '../s3/todosBucketAccess'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todosAccess = new TodosAccess()
const todosBucketAccess = new TodosBucketAccess()

export async function createTodo(userId: string, todoId: string, newTodoRequest: CreateTodoRequest): Promise<TodoItem> {

    const createdAt = new Date().toISOString();
    const newItem : TodoItem = {
        userId : userId,
        todoId: todoId,
        createdAt : createdAt,
        name: newTodoRequest.name,
        dueDate: newTodoRequest.dueDate,
        done: false
    }
    return todosAccess.createNewTodo(newItem)
}

export async function deleteTodo(userId: string, todoId: string){
    return todosAccess.deleteTodo(userId, todoId)
}

export async function generateUploadURL (userId: string, todoId: string){
    const uploadedURL = await todosBucketAccess.getUploadUrl(todoId)
    const attachmentUrl = await todosBucketAccess.getAttachmentURL(todoId)
    const result = await todosAccess.updateTodobyTodoId(userId, todoId, attachmentUrl)
    return [result, uploadedURL]
}

export async function getTodosPerUser(userId: string){
    return todosAccess.getTodosPerUser(userId)
}

export async function updateTodo (userId: string, todoId: string, updatedTodoRequest: UpdateTodoRequest){
    const todoUpdate : TodoUpdate = {
        name: updatedTodoRequest.name,
        dueDate: updatedTodoRequest.dueDate,
        done: updatedTodoRequest.done

    }
    return todosAccess.updateTodo(userId, todoId, todoUpdate)
}