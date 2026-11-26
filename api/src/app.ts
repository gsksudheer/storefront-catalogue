import express, { type Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './shared/middleware.js';

export interface AppModules {
  catalogue: { router: Router };
  enquiry: { router: Router };
}

export interface AppOptions {
  corsOrigin: string;
  trustProxy?: number;
}

/** Builds the HTTP app from already-wired modules. No I/O here, so tests can use it directly. */
export function createApp(modules: AppModules, options: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', options.trustProxy ?? 0);
  app.use(helmet());
  app.use(cors({ origin: options.corsOrigin }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/catalogue', modules.catalogue.router);
  app.use('/api/enquiries', modules.enquiry.router);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
