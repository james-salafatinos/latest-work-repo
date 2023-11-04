// server.js
// where your node app starts

// init project
const express = require("express");
const port = 3000;
const app = express();
const fs = require('fs');
const path = require('path');

app.get("/", function (request, response) {
  const srcPath = path.join(__dirname, 'src', 'public');
  fs.readdir(srcPath, { withFileTypes: true }, (err, entries) => {
    if (err) {
      console.error('Error reading src/public directory:', err);
      response.status(500).send('Internal Server Error');
      return;
    }

    const folders = entries.filter(entry => entry.isDirectory());
    const linksHtml = folders.map(folder => `
      <li>
        <a href="/${folder.name}">${folder.name}</a>
      </li>
    `).join('');

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
    <h1>Hello.</h1>
    <ul>
      ${linksHtml}
    </ul>
    </body>
    </html>
    `);
  });
});

app.get("/:appName", function (request, response) {
  const appName = request.params.appName;
  app.use("/public", express.static("./src/public"));
  app.use("/static", express.static("./src/static"));
  app.use("/modules", express.static("./src/modules"));
  app.use("/utils", express.static("./src/utils"));
  app.use("/data", express.static("./src/data"));
  app.use(express.static(__dirname));
  response.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>${appName}</title>
    <style>
      body, html {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
      }
      #container {
        display: flex;
        height: 100vh;
        transition: all 0.3s ease;
      }
      #markdown {
        flex: 2;
        overflow: auto;
        transition: all 0.3s ease;
        transform: translateX(0);
        background: linear-gradient(45deg, rgba(63,94,251,1) 0%, rgba(252,70,107,1) 100%);
        padding-top: 60px;  /* Add space at the top */
        padding-left: 10px;  /* Add space at the top */
      }
      #threejs {
        flex: 4;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      #menu-btn {
        position: absolute;
        z-index: 1;
        left: 0;
        top: 0;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        color: white;
        background: linear-gradient(45deg, rgba(63,94,251,1) 0%, rgba(252,70,107,1) 100%);
        overflow: hidden; /* This is important because the pseudo-element will be a child of the button */
      }
      
      #menu-btn:before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, rgba(252,70,107,1) 0%, rgba(63,94,251,1) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: inherit; /* To maintain the rounded corners */
      }
      
      #menu-btn:hover:before {
        opacity: 1;
      }
      .hide-sidebar #markdown {
        display: none;
      }
      
      .hide-sidebar #threejs {
        flex: 5;
      }
    </style>
    <script src="
    https://cdn.jsdelivr.net/npm/ccapture.js-npmfixed@1.1.0/build/CCapture.all.min.js
    "></script>
    <script>
</script>
    <script>
    // Configure MathJax settings
    MathJax = {
      tex: {
        inlineMath: [
          ['$', '$'],
          ['\\(', '\\)']
        ]
      }
    }
    addEventListener('zero-md-rendered', () => MathJax.typeset())
  </script>
  <!-- Load MathJax library -->
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
  <!-- Load zero-md -->
  <script
    type="module"
    src="https://cdn.jsdelivr.net/gh/zerodevx/zero-md@2/dist/zero-md.min.js"
  ></script>
  </head>
  <body>
    <button id="menu-btn">☰</button>  <!-- Changed text to a "hamburger" icon -->
    <div id="container">
      <div id="markdown">
        <zero-md src="/public/${appName}/notes.md" no-shadow></zero-md>
      </div>
      <div id="threejs">
        <!-- Three.js will attach its renderer here -->
      </div>
    </div>
   
    <script type="module" src="/public/${appName}/App.js"></script>
    <script>
    // Toggle sidebar
    const menuBtn = document.getElementById('menu-btn');
    const container = document.getElementById('container');
    container.classList.toggle('hide-sidebar');
    setTimeout(() => window.dispatchEvent(new Event('resize')), 1);
    menuBtn.addEventListener('click', () => {
      container.classList.toggle('hide-sidebar');
      setTimeout(() => window.dispatchEvent(new Event('resize')), 1);
    });
  </script>

  </body>
  </html>
`);
});

var server = app.listen(process.env.PORT || port, listen);

// This call back just tells us that the server has started
function listen() {
  var host = server.address().address;
  var port = server.address().port;
  console.log("App listening at http://" + host + ":" + port);
  console.log("App listening at http://localhost:" + port);
}
