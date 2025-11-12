// TODO: Replace with OpenAI / rule-based analyzer
async function analyzeMedicalReport(text, mode='allopathy') {
  return {
    mode,
    summary: `Stub analysis for mode=${mode}`,
    riskScore: 0.12,
    notes: ["Replace with real analysis logic or LLM call"]
  };
}
module.exports = { analyzeMedicalReport };
