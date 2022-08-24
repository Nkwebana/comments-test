import { readFileSync } from 'node:fs';
import { parentPort } from 'node:worker_threads';
import { exit } from 'node:process';
import { Matrices } from './enums/index.js';

class Comments {
  totalMetricOccurrence = 0;
  listOfComments: string[];

  constructor(listOfComments: string[]) {
    this.listOfComments = listOfComments;
  }

  commentProcessing(metric: string): number {
    this.totalMetricOccurrence = 0;

    this.listOfComments.forEach((comment) => {
      if (comment.toLocaleLowerCase().includes(metric)) {
        this.totalMetricOccurrence++;
      }
    });

    return this.totalMetricOccurrence;
  }
}

class CommentCharacters extends Comments {
  commentProcessing() {
    this.totalMetricOccurrence = 0;

    this.listOfComments.forEach((comment) => {
      const commentWithoutSpaces = comment.replaceAll(' ', '');

      if (commentWithoutSpaces.length < 15) {
        this.totalMetricOccurrence++;
      }
    });

    return this.totalMetricOccurrence;
  }
}

class CommentSpam extends Comments {
  commentProcessing() {
    this.totalMetricOccurrence = 0;

    this.listOfComments.forEach((comment) => {
      if (
        new RegExp(
          '([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?'
        ).test(comment)
      ) {
        {
          this.totalMetricOccurrence++;
        }
      }
    });

    return this.totalMetricOccurrence;
  }
}

function handleCommentProcessing(
  commentsInstance: Comments,
  metric = ''
): number {
  return commentsInstance.commentProcessing(metric);
}

try {
  const commentsFileResults: any = {};

  parentPort?.on('message', (filename) => {
    commentsFileResults[filename] = [];

    const comments = readFileSync(`${Matrices.FilePath}${filename}`, {
      encoding: 'utf8',
    });
    const splittedCommentsByLine = comments.split('\n');
    const commentsInstance = new Comments(splittedCommentsByLine);
    const commentCharactersInstance = new CommentCharacters(
      splittedCommentsByLine
    );
    const commentSpamInstance = new CommentSpam(splittedCommentsByLine);

    commentsFileResults[filename].push(
      '',
      '====================================',
      `FILE NAME: ${filename}`,
      '===================================='
    );
    commentsFileResults[filename].push(
      `SHORTER_THAN_15: ${handleCommentProcessing(commentCharactersInstance)}`
    );
    commentsFileResults[filename].push(
      `MOVER_MENTIONS: ${handleCommentProcessing(
        commentsInstance,
        Matrices.Mover
      )}`
    );
    commentsFileResults[filename].push(
      `SHAKER_MENTIONS: ${handleCommentProcessing(
        commentsInstance,
        Matrices.Shaker
      )} `
    );
    commentsFileResults[filename].push(
      `QUESTIONS: ${handleCommentProcessing(
        commentsInstance,
        Matrices.QuestionsMark
      )}`
    );
    commentsFileResults[filename].push(
      `SPAM: ${handleCommentProcessing(commentSpamInstance)}`
    );

    parentPort?.postMessage(commentsFileResults);
    exit(0);
  });
} catch (error: any) {
  console.error('An error occurred while processing comment file: ', error);
}
