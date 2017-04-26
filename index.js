var express = require('express')
var graphqlHTTP = require('express-graphql')
var { buildSchema } = require('graphql')

var request = require('request')

var asyncLoop = require('node-async-loop')

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type User {
    username: String
    name: String
    url: String
    followers: [User]
    following: [User]
  }
  type Query {
    profile(username: String!): User
  }
`)

var github = 'http://api.github.com/users/'
class User {
  constructor(username, callback) {
    this.username = username

    var user = this

    // query the Github API:
    console.log('GET REQUEST: '+ github+this.username)
    request.get(
      {
        url: github+this.username,
        headers: {'User-Agent':'request'}
      }
      , function (err, response, body) {

        if (err) {
          return callback(err)
        }
        var profile = JSON.parse(body)
        user.followers_url = profile.followers_url
        user.following_url = profile.following_url
        user.name = profile.name
        user.url = profile.html_url

        callback(null)
      }
    )
  }

  followers() {

    var user = this

    return new Promise( (fulfill, reject) => {
      console.log('GET REQUEST: '+ user.followers_url.replace('https', 'http'))
      request.get(
        {
          url: user.followers_url.replace('https', 'http'),
          headers: {'User-Agent':'request'}
        }
        , function (err, response, body) {

          if (err) {
            return reject(err)
          }

          var followers_profiles = JSON.parse(body)
          var followers = []

          asyncLoop(followers_profiles, function (follower, next) {
            var new_follower = new User(follower.login, function(err) {

              if (err) {
                return next(err)
              }

              followers.push(new_follower)

              return next()
            })
          }, function (err) {
            if (err) {
              return reject(err)
            }

            return fulfill(followers)
          })

        }

      )
    })
  }


}

// The root provides a resolver function for each API endpoint
var root = {
  profile: ({username}) => {
    return new Promise( (fulfill) => {

      var user = new User(username, function(err) {

        if (err) {
          return reject(err)
        }

        fulfill(user)

      })

    })
  },
}

var app = express()
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}))
app.listen(4000)
console.log('Running a GraphQL API server at localhost:4000/graphql')
