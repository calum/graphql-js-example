# GraphQL example application using GitHub's API

## How to run
  0. Download and install Node.js
      * [Using a packet manager (apt, yum, brew, ...)](https://nodejs.org/en/download/package-manager/)
      * [Windows & Mac/Linux without package manager](https://nodejs.org/en/download/)
  1. Using the terminal, clone this repo and cd into the directory
  2. ```$ npm install```
  3. ```$ npm start```
  4. The app should be running at http://localhost:4000/graphql

_Note: due to the GitHub API rate limit you can only make 60 requests per hour_

### Example query
To test the app is working correctly try the following query:
```js
query{
  profile(username:"Bob"){
    name
    username
    following{
      name
    }
  }
}
```

![gif](/extra/query_example.gif)

## How it works
The application is built using [GraphQL](https://www.npmjs.com/package/graphql) and [express-graphql](https://www.npmjs.com/package/express-graphql). The documentation for GraphQL is really good and you should read the following pages if you get stuck:
  * [Getting Started](http://graphql.org/graphql-js/)
  * [Running an Express GraphQL Server](http://graphql.org/graphql-js/running-an-express-graphql-server/)
  * [Object Types](http://graphql.org/graphql-js/object-types/)
  * [Basic Types](http://graphql.org/graphql-js/basic-types/)

Each page should take around 10-15 minutes to read through.

This app also does a lot with Promises. If you are unfamiliar with these then spending some time reading the documentation would be very beneficial. Promises are used to keep track of asynchronous functions.
  * [Promises](https://www.promisejs.org/)

The NPM module [request](https://www.npmjs.com/package/request) is used to make the HTTP GET requests to the GitHub API.


## Want to learn more?
Here are some tasks you can try which will help your understanding of GraphQL.

  1. Add a User field for `created_at` which will show the date as a string of when the profile was created. _[EASY]_
  2. Add a User field for `followers` and also add a instance method in the User class to resolve this field. This should resolve to a field similar to the `following` field. _[HARD]_
  3. Add a new Object Type for repositories and add a field for `repos` to the User object. See the GitHub API for repos [here](https://developer.github.com/v3/repos/). You will need to do this with `https` which may not work behind a proxy. _Hint: try ```curl https://api.github.com/users/facebook/repos```_ _[VERY HARD]_
