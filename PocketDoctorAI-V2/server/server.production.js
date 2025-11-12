
/*********************************************************************
 * PocketDoctor AI - Production Server (V2)
 *********************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const multer = require('multer');
const Sentry = require('@sentry/node');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const { generalLimiter, uploadLimiter, analysisLimiter } = require('./middleware/rateLimiter');
const { pdfValidatorMiddleware } = require('./middleware/pdfValidator');
const { requestIdMiddleware, auditMedicalOperation, auditErrorMiddleware } = require('./middleware/requestLogger');
const { smartUpload, streamToS3, cleanupTempFiles } = require('./middleware/smartUpload');

const { extractTextFromS3 } = require('./utils/ocr');
const { analyzeMedicalReport } = require('./utils/analyzer');

const app = express();

// Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: process.env.SENTRY_SAMPLE_RATE ? Number(process.env.SENTRY_SAMPLE_RATE) : 0.2
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Core middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(process.env.NODE_ENV === 'production' ? morgan('combined') : morgan('dev'));
app.use(requestIdMiddleware);

// Rate limiting (global)
app.use(generalLimiter);

// Health
app.get('/health', (req, res) => {
  const mu = process.memoryUsage();
  res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    memoryMB: {
      rss: Math.round(mu.rss / 1024 / 1024),
      heapUsed: Math.round(mu.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mu.heapTotal / 1024 / 1024),
    }
  });
});

// AWS S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

// Upload (disk fallback + PDF validation + rate limit)
const upload = smartUpload.single('file');

app.post('/upload',
  uploadLimiter,
  (req, res, next) => upload(req, res, (err) => err ? next(err) : next()),
  pdfValidatorMiddleware({ maxPages: 50, maxSizeMB: 10 }),
  auditMedicalOperation('UPLOAD'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const bucket = process.env.S3_BUCKET_NAME;
      if (!bucket) throw new Error('S3_BUCKET_NAME not configured');

      const key = `reports/${Date.now()}-${(req.file.originalname||'file').replace(/[^a-zA-Z0-9_.-]/g,'_')}`;
      // stream to S3 from temp file path
      await streamToS3(req.file.path, bucket, key, req.file.mimetype);
      const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      res.json({ bucket, key, url, pdfInfo: req.pdfMetadata || null });
    } catch (e) {
      Sentry.captureException(e);
      res.status(500).json({ error: e.message });
    }
  },
  cleanupTempFiles
);

// OCR
app.post('/ocr', auditMedicalOperation('OCR'), async (req, res) => {
  try {
    const { bucket, key } = req.body || {};
    if (!bucket || !key) return res.status(400).json({ error: 'Missing bucket or key' });
    const text = await extractTextFromS3(bucket, key);
    res.json({ text });
  } catch (e) {
    Sentry.captureException(e);
    res.status(500).json({ error: e.message });
  }
});

// Analyze
app.post('/analyze', analysisLimiter, auditMedicalOperation('ANALYZE'), async (req, res) => {
  try {
    const { text, mode } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });
    const m = mode || process.env.DEFAULT_ANALYSIS_MODE || 'allopathy';
    const analysis = await analyzeMedicalReport(text, m);
    res.json({ analysis, mode: m });
  } catch (e) {
    Sentry.captureException(e);
    res.status(500).json({ error: e.message });
  }
});

// Combined report
app.post('/report', analysisLimiter, auditMedicalOperation('REPORT'), async (req, res) => {
  try {
    const { bucket, key, mode } = req.body || {};
    if (!bucket || !key) return res.status(400).json({ error: 'Missing bucket or key' });
    const text = await extractTextFromS3(bucket, key);
    const m = mode || process.env.DEFAULT_ANALYSIS_MODE || 'allopathy';
    const analysis = await analyzeMedicalReport(text, m);
    res.json({ ocr: { text }, analysis, createdAt: new Date().toISOString() });
  } catch (e) {
    Sentry.captureException(e);
    res.status(500).json({ error: e.message });
  }
});

// Sentry error handler & global error audit
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use(auditErrorMiddleware);

// Global error handler
app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Max 10MB.' });
  }
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Error') });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ PocketDoctor V2 API running on :${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('⏸️  SIGTERM received. Graceful shutdown...');
  server.close(() => process.exit(0));
});
