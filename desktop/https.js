const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync('ssl/server.key'),
  cert: fs.readFileSync('ssl/server.crt'),
  ca: fs.readFileSync('ssl/rootCA.crt'),
  requestCert: true,
  rejectUnauthorized: false
};

https
  .createServer(options, function(req, res) {
    let file = path.join(__dirname, 'app', req.url);
    if (!fs.existsSync(file) || !fs.lstatSync(file).isFile()) {
      file = path.join(__dirname, 'app', 'index.html');
    }
    fs.createReadStream(file).pipe(res);
  })
  .listen(5000);
