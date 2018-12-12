const express = require('express');
const { join } = require('path');
const fs = require('fs');
const app = express();

const path = join('..', 'app');

app.use(express.static(join(__dirname, path)));

app.get('/*', function(req, res) {
  let file = join(__dirname, path, req.url);
  if (!fs.existsSync(file)) {
    file = join(__dirname, path, 'index.html');
  }
  res.sendFile(file);
});

app.listen(5000);
