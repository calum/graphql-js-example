var express = require('express')
var graphqlHTTP = require('express-graphql')
var { buildSchema } = require('graphql')

var request = require('request')

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

var github = 'http://api.github.com/users/'
class User {
  constructor(username) {
    this.username = username

    var user_element_url = github+this.username
    var thisUser = this

    return new Promise( (fulfill, reject) => {
      // query the Github API:
      console.log('GET REQUEST: '+ user_element_url)
      request.get({url: user_element_url, headers: {'User-Agent':'request'}}, function (err, response, body) {

        if (err) {
          return reject(err)
        }

        var profile = JSON.parse(body)
        thisUser.following_url = profile.following_url
        console.log(thisUser.following_url)
        thisUser.following_count = profile.following
        thisUser.name = profile.name
        thisUser.url = profile.html_url

        fulfill(thisUser)
      })
    })
  }

  following() {
    console.log(this.following_url)
    var collection_url = this.following_url.replace('https', 'http').replace('{/other_user}','')
    var following_count = this.following_count

    return new Promise( (fulfill, reject) => {
      console.log('GET REQUEST: '+ collection_url)
      request.get({url: collection_url,headers: {'User-Agent':'request'}}, function (err, response, body) {

        if (err) {
          return reject(err)
        }

        var following_profiles = JSON.parse(body)
        var following = []

        var promises = []

        following_profiles.forEach( function (profile) {

          var new_promise = new Promise( (fulfill,reject) => {
            new User(profile.login).then( (new_profile) => {

              following.push(new_profile)
              return fulfill()

            })
          })

          promises.push(new_promise)

        })

        Promise.all(promises).then( () => {
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

var app = express()
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
app.listen(4000)
console.log('Running a GraphQL API server at localhost:4000/graphql')
