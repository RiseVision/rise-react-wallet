import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

export default function serve() {
  const app = express();
  const path = join('..', 'app');

  app.use(express.static(join(__dirname, path)));

  app.get('/*', (req, res) => {
    let file = join(__dirname, path, req.url);
    if (!fs.existsSync(file)) {
      file = join(__dirname, path, 'index.html');
    }
    res.sendFile(file);
  });

  app.listen(5000);
}
