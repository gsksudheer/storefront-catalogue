import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { BadRequest } from '../../shared/errors.js';
import { EnquiryInput } from './enquiry.schemas.js';
import type { EnquiryService } from './enquiry.service.js';

export interface EnquiryRouteOptions {
  rateLimit: { windowMs: number; limit: number };
}

export function enquiryRoutes(service: EnquiryService, options: EnquiryRouteOptions): Router {
  const router = Router();

  // Enquiries trigger an email, so cap them per IP to limit spam / mail-bombing the sales inbox.
  const limiter = rateLimit({
    windowMs: options.rateLimit.windowMs,
    limit: options.rateLimit.limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Too many enquiries. Please try again later.' },
      });
    },
  });

  router.post('/', limiter, async (req, res) => {
    const parsed = EnquiryInput.safeParse(req.body ?? {});
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      throw BadRequest(details[0]?.message ?? 'Invalid enquiry', details);
    }
    const receipt = await service.submit(parsed.data);
    res.status(201).json({ status: 'received', reference: receipt.reference });
  });

  return router;
}
