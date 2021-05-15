import { exec as execCb } from 'child_process';
import dotenv from 'dotenv-safe';
import express from 'express';
import prettyMs from 'pretty-ms';
import util from 'util';

dotenv.config();

const { promisify } = util;
const execAwait = promisify(execCb);

const exec = async path => {
  try {
    const { stdout, stderr } = await execAwait(`./simple.sh "${path}"`);
    const parts = (stdout || '').replace(/[\r\n]+/, '').split('/');

    if ((stderr || '').trim()) {
      return { path, error: stderr };
    }

    return { path, encoded: parts[parts.length - 1] };
  } catch (e) {
    return { path, error: e };
  }
};

const getPathArray = path => (Array.isArray(path) ? path : [path]);

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  return next();
});

app.use((req,_res,next) => {
  req.start = new Date();
  return next();
});

app.get('/', async (req, res, next) => {
  const { p: path } = req.query;

  if (!path) {
    res.locals.error =  `querystring 'p' was not provided` ;

    return next()
  }

  const paths = getPathArray(path);

  const promises = paths.map(exec);

  const results = await Promise.all(promises);

  if (results.find(result => result.error)) {
    res.status(500);
  }

  res.locals.results = results;

  return next()
});

const isValidBody = paths => Array.isArray(paths) && paths.length > 0 && !paths.find(p => typeof p !== 'string');

app.post('/', async (req, res, next) => {
  const paths = req.body;

  // eslint-disable-next-line no-console
  console.log(paths);

  if (!isValidBody(paths)) {
    return res.status(400).json({ error: `No paths were provided` });
  }

  const promises = paths.map(exec);

  const results = await Promise.all(promises);

  if (results.find(result => result.error)) {
    res.status(500);
  }

  res.locals.results = results;

  return next();
});


app.use((req,res) => {
  const { start } = req;
  const now = new Date();
  const duration =prettyMs(now.getTime() - start.getTime());

  return res.json({ results: res.locals, duration, timestamp: new Date() });
});

const { PORT = 3000 } = process.env; // eslint-disable-line no-process-env

// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`App listening on port http://localhost:${PORT}`));
