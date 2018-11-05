const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', function(req, res) {
  let file = path.join(__dirname, '../build', req.url);
  if (!fs.existsSync(file)) {
    file = path.join(__dirname, '../build', 'index.html');
  }
  res.sendFile(file);
});

app.listen(5000);
