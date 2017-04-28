var express = require('express')
var graphqlHTTP = require('express-graphql')
var { buildSchema } = require('graphql')
var request = require('request')
var github = 'http://api.github.com/users/'

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type User {
    username: String
    name: String
    url: String
    following: [User]
  }
  type Query {
    profile(username: String!): User
  }
`)

// The class for a User type. The resolvers are instance methods
class User {
  /**
  * The constructor is called whenever the GraphQL Query profile(username)
  * is called
  * It resolves the fields: username, name, url
  **/
  constructor(username) {

    // Set the username
    this.username = username

    // Create the url needed to fetch this users data from GitHub
    var user_element_url = github+this.username

    // Save the context for this user so we can use it in the Promise below
    var thisUser = this

    // return a Promise so that GraphQL waits for the response from GitHub
    // before resolving the fields
    return new Promise( (fulfill, reject) => {
      // query the Github API:
      console.log('GET REQUEST: '+ user_element_url)

      // The GitHub API requires the User-Agent header be set
      request.get({url: user_element_url, headers: {'User-Agent':'request'}}, (err, response, body) => {

        if (err) {
          // We reject the Promsie if there is an error
          return reject(err)
        }

        // Parse the JSON response and save the required data to the User object
        var profile = JSON.parse(body)

        // The name and url are provided
        thisUser.name = profile.name
        thisUser.url = profile.html_url

        // the following_url is required by the following() method
        thisUser.following_url = profile.following_url

        // we can now fulfill the Promise and return the User object
        fulfill(thisUser)
      })
    })
  }

  /**
  * The following method is called whenever the
  * User field 'following' is asked for
  **/
  following() {

    // Set the url for fetching the list of profiles this user is following
    // replace https with http, and remove the '{/other_user}' from the end of the url
    var collection_url = this.following_url.replace('https', 'http').replace('{/other_user}','')

    // return a Promise so that GraphQL waits for each HTTP request to complete
    // before resolving
    return new Promise( (fulfill, reject) => {

      console.log('GET REQUEST: '+ collection_url)
      request.get({url: collection_url,headers: {'User-Agent':'request'}}, (err, response, body) => {

        if (err) {
          return reject(err)
        }

        var following_profiles = JSON.parse(body)
        var following = []

        var promises = []

        // create a Promise for each following profile
        following_profiles.forEach( function (profile) {

          // create a Promise to resolve each following profile
          var new_promise = new Promise( (fulfill,reject) => {
            new User(profile.login).then( (new_profile) => {

              following.push(new_profile)
              return fulfill()

            })
          })

          // Add each promise to the promises array
          promises.push(new_promise)

        })

        // Run all promises simultaneously
        Promise.all(promises).then( () => {
          // After all promises have finished, return the following array
          return fulfill(following)
        })

      })
    })
  }

}

// The root provides a resolver function for each API endpoint
var root = {
  profile: ({username}) => {
    return  new User(username)
  }
}

// Start the HTTP server using Express
var app = express()

// Use the graphqlHTTP middleware
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
  formatError: error => ({
    message: error.message,
    locations: error.locations,
    stack: error.stack,
    path: error.path
  })
}))

// Listen on port 4000
app.listen(4000, () => {
  console.log('Running a GraphQL API server at localhost:4000/graphql')

  // Get the GitHub rate limit and log to the console
  request.get({ url: 'http://api.github.com/rate_limit', headers: {'User-Agent':'request'}}, (err, response, body) => {
    body = JSON.parse(body)
    var resetTime = new Date(body.rate.reset*1000 - Date.now())
    console.log('GitHub API Requests:')
    console.log(' - limit: ' + body.rate.limit)
    console.log(' - remaining: ' + body.rate.remaining)
    console.log(' - resets in: ' + (resetTime.getMinutes()) + ' minutes ')
  })
})
