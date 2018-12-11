const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.static(path.join(__dirname, 'build')));

// TODO path.resolve
app.get('/*', function(req, res) {
  let file = path.join(__dirname, '../app', req.url);
  if (!fs.existsSync(file)) {
    file = path.join(__dirname, '../app', 'index.html');
  }
  res.sendFile(file);
});

app.listen(5000);
