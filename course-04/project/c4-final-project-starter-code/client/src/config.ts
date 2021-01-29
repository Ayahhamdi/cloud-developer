// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'an7s3g40y2'
export const apiEndpoint = `https://${apiId}.execute-api.ap-south-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'dev-rsnpdg6v.us.auth0.com',            // Auth0 domain - Done
  clientId: 'OHO7m3PuSowokfuM3tWeGqj8pDlx6Eq9',          // Auth0 client id - Done
  callbackUrl: 'http://localhost:3000/callback'
}
