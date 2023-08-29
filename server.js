// server.js
// where your node app starts

// init project
const express = require("express");
const port = 3000;
const app = express();
const path = require('path')


app.get("/", function (request, response) {
  response.send(`
  <!DOCTYPE html>
  <html>
  <head>
      <title></title>
      <style>
      body {
        margin: 0;
      }
      </style>
  </head>
  <body>
  <h1>Hello. 
  <li>
  <a href="/app">Default App</a>
  </li>
  
  </h1>

  </body>
  </html>
`);
});


app.get("/:appName", function (request, response) {
  const appName = request.params.appName;
  app.use('/public', express.static("./src/public"));
  app.use('/static', express.static('./src/static'))
  app.use('/modules', express.static('./src/modules'))
  app.use('/utils', express.static('./src/utils'))
  app.use('/data', express.static('./src/data'))
  app.use(express.static(__dirname));
  response.send(`
  <!DOCTYPE html>
  <html>
  <head>
      <title>${appName}</title>
      <style>
      body {
        margin: 0;
      }
      </style>
  </head>
  <body>
      <script type="module" src="/public/${appName}/${appName}.js"></script>
  </body>
  </html>
`);
});



var server = app.listen(process.env.PORT || port, listen);

// This call back just tells us that the server has started
function listen() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://' + host + ':' + port);
    console.log('App listening at http://localhost:'+ port);
}
