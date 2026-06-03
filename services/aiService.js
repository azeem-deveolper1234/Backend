const https = require("https");

/**
 * Validates if the given symptoms/notes represent a medical emergency using Gemini.
 * Falls back to false if API key is not configured or in case of errors.
 * @param {string} notes
 * @returns {Promise<{isEmergency: boolean, reasoning: string}>}
 */
const checkEmergency = (notes) => {
  return new Promise((resolve) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in .env. Skipping AI check.");
      return resolve({ isEmergency: true, reasoning: "Gemini API key not configured. Bypassing AI validation." });
    }

    if (!notes || notes.trim() === "") {
      return resolve({ isEmergency: false, reasoning: "No notes or reasons provided for emergency." });
    }

    const promptText = `You are a medical triage assistant. Analyze the following patient symptoms/notes and determine if they represent a genuine medical emergency (e.g., chest pain, severe bleeding, difficulty breathing, sudden weakness, unconsciousness, severe burns, anaphylaxis, high fever in infants, etc.) requiring immediate medical attention.
Do not accept trivial reasons like general checkups, routine consultations, minor cuts, mild headaches, standard refilling of medicine, minor cough/cold, or patient convenience.

Patient notes: "${notes}"

Respond strictly in JSON format matching this schema:
{
  "isEmergency": boolean,
  "reasoning": "A brief 1-sentence explanation of why this is or is not an emergency."
}`;

    const data = JSON.stringify({
      contents: [{
        parts: [{
          text: promptText
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      port: 443,
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (
            json.candidates &&
            json.candidates[0] &&
            json.candidates[0].content &&
            json.candidates[0].content.parts &&
            json.candidates[0].content.parts[0]
          ) {
            const textResult = json.candidates[0].content.parts[0].text;
            const parsed = JSON.parse(textResult.trim());
            return resolve({
              isEmergency: !!parsed.isEmergency,
              reasoning: parsed.reasoning || ""
            });
          }
          console.error("Gemini response structure unexpected:", JSON.stringify(json));
          return resolve({ isEmergency: true, reasoning: "Unexpected AI response format; bypassed." });
        } catch (e) {
          console.error("Failed to parse Gemini response:", e, body);
          return resolve({ isEmergency: true, reasoning: "Failed to parse AI response; bypassed." });
        }
      });
    });

    req.on("error", (e) => {
      console.error("Gemini API connection error:", e);
      return resolve({ isEmergency: true, reasoning: "AI connection error; bypassed." });
    });

    req.write(data);
    req.end();
  });
};

module.exports = { checkEmergency };
