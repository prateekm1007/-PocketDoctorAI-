// TODO: Replace with AWS Textract or Tesseract call
async function extractTextFromS3(bucket, key) {
  // Placeholder: return fake OCR text referencing object key
  return `FAKE_OCR: text extracted from s3://${bucket}/${key}`;
}
module.exports = { extractTextFromS3 };
