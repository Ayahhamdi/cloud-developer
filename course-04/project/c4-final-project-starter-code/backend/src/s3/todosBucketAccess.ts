import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'


const XAWS = AWSXRay.captureAWS(AWS)


export class TodosBucketAccess {

  constructor(
    private readonly s3 = createS3Object(),
    private readonly bucketName = process.env.TODOS_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION){

    }

   // Generate Uploaded URL functions
   async getUploadUrl(todoId: string) {
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: this.urlExpiration
    })
  }

  async getAttachmentURL(todoId: string){
    const attachmentUrl: string = 'https://' + this.bucketName + '.s3.amazonaws.com/' + todoId 
    return attachmentUrl
  }
  
}

function createS3Object() {
  return new XAWS.S3({
    signatureVersion: 'v4'
  })
} 
  