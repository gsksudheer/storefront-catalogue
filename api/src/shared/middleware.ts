import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from './errors.js';
import { logger } from './logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
};

/** Client errors raised by Express/body-parser (malformed JSON, payload too large). */
const BODY_PARSER_ERRORS: Record<string, { code: string; message: string }> = {
  'entity.parse.failed': { code: 'INVALID_JSON', message: 'Request body is not valid JSON' },
  'entity.too.large': { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' },
};

/** Single place that turns errors into the API's JSON error shape. Never leaks stack traces. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  const known = BODY_PARSER_ERRORS[err?.type];
  if (known && typeof err.status === 'number') {
    res.status(err.status).json({ error: known });
    return;
  }
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
