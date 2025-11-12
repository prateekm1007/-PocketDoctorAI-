const { v4: uuidv4 } = require('uuid');
const { auditLog } = require('./requestLoggerHelpers');

function requestIdMiddleware(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  req.startTime = Date.now();
  console.log(`➡️  [${req.id}] ${req.method} ${req.url}`);
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const ok = res.statusCode >= 200 && res.statusCode < 400;
    const emoji = ok ? '✅' : '❌';
    console.log(`${emoji} [${req.id}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
}

function auditMedicalOperation(operationType) {
  return async (req, res, next) => {
    const base = {
      requestId: req.id,
      operationType,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      fileType: req.file?.mimetype,
      fileSize: req.file?.size,
      at: new Date().toISOString()
    };
    await auditLog(`${operationType}_STARTED`, base);
    const original = res.json.bind(res);
    res.json = (data) => {
      auditLog(`${operationType}_COMPLETED`, { ...base, statusCode: res.statusCode });
      return original(data);
    };
    next();
  };
}

function auditErrorMiddleware(err, req, res, next) {
  auditLog('ERROR_OCCURRED', {
    requestId: req?.id,
    url: req?.url,
    method: req?.method,
    error: err?.message?.slice(0, 300)
  });
  next(err);
}

module.exports = { requestIdMiddleware, auditMedicalOperation, auditErrorMiddleware };
