import util from 'util';
import { exec as execCb } from 'child_process';
import express from 'express';
import dotenv from 'dotenv-safe';

dotenv.config();

const { promisify } = util;
const execAwait = promisify(execCb);

const exec = async path => {
  try {
    const { stdout, stderr } = await execAwait(`./simple.sh "${path}"`);
    const parts = (stdout || '').replace(/[\r\n]+/, '').split('/');

    console.log(JSON.stringify({ stdout, stderr }, null, 2));

    return { path, encoded: parts[parts.length - 1] };
  } catch (e) {
    return { path, error: e };
  }
};

const getPathArray = path => (Array.isArray(path) ? path : [path]);

const app = express();

app.use(express.json());
// app.use(express.urlencoded());

app.get('/', async (req, res) => {
  const { p: path } = req.query;

  if (!path) {
    return res.status(400).json({ error: `querystring 'p' was not provided` });
  }

  const paths = getPathArray(path);

  const promises = paths.map(exec);

  const results = await Promise.all(promises);

  if (results.find(result => result.error)) {
    res.status(500);
  }

  return res.json({ timestamp: new Date(), results });
});

const isValidBody = paths => Array.isArray(paths) && paths.length > 0 && !paths.find(p => typeof p !== 'string');

app.post('/', async (req, res) => {
  const paths = req.body;

  if (!isValidBody(paths)) {
    return res.status(400).json({ error: `No paths were provided` });
  }

  const promises = paths.map(exec);

  const results = await Promise.all(promises);

  if (results.find(result => result.error)) {
    res.status(500);
  }

  return res.json({ timestamp: new Date(), results });
});

const { PORT = 3000 } = process.env; // eslint-disable-line no-process-env

// eslint-disable-next-line no-console
app.listen(PORT, () => console.log('Example app listening on port http://localhost:3000'));
