import { fileURLToPath } from 'url';
import { readdir } from 'node:fs/promises';
import path from 'path';
import { Worker, isMainThread } from 'node:worker_threads';
import { Matrices } from './enums/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const commentsFileNames: string[] = await readdir(Matrices.FilePath);

  commentsFileNames.forEach((filename) => {
    if (isMainThread) {
      const worker = new Worker(`${__dirname}/commentsFileProcessing.js`);

      worker.postMessage(filename);
      worker.on('error', (err) => {
        console.error(err);
      });
      worker.on('message', (data) => {
        data[filename].forEach((commentResult: string) => {
          console.log(commentResult);
        });
      });
    }
  });
} catch (error: any) {
  console.error(error);
}
