const pdfParse = require('pdf-parse');

async function validatePDF(buffer, options = {}) {
  const { maxPages = 50, maxSizeMB = 10, allowEncrypted = false } = options;
  try {
    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return { valid: false, error: `PDF too large: ${sizeMB.toFixed(1)}MB`, code: 'PDF_TOO_LARGE' };
    }
    const data = await pdfParse(buffer, { max: 1 });
    if (data.numpages > maxPages) return { valid: false, error: `Too many pages: ${data.numpages}`, code: 'PDF_TOO_MANY_PAGES' };
    if (data.info?.IsEncrypted && !allowEncrypted) return { valid: false, error: 'Encrypted PDFs not supported', code: 'PDF_ENCRYPTED' };
    return { valid: true, metadata: { pages: data.numpages, sizeMB: sizeMB.toFixed(2), encrypted: !!data.info?.IsEncrypted } };
  } catch (e) {
    return { valid: false, error: 'Invalid or corrupted PDF', code: 'PDF_VALIDATION_ERROR', details: e.message };
  }
}

function pdfValidatorMiddleware(options = {}) {
  return async (req, res, next) => {
    if (req.file && req.file.mimetype === 'application/pdf') {
      const fs = require('fs');
      const buffer = fs.readFileSync(req.file.path);
      const validation = await validatePDF(buffer, options);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error, code: validation.code });
      }
      req.pdfMetadata = validation.metadata;
    }
    next();
  };
}

module.exports = { validatePDF, pdfValidatorMiddleware };
