const axios = require("axios");
const GROQ_API_KEY = process.env.GROQ_API_KEY;

module.exports.generateQuestions = async ({ topic, difficulty, count }) => {
  try {
    const prompt = `
Generate ${count} coding interview questions.

Return strict JSON in this format:

{
  "questions": [
    {
      "title": "",
      "description": "",
      "examples": [
        {"input": "", "output": "", "explanation": ""}
      ],
      "constraints": "",
      "topic": "${topic}",
      "difficulty": "${difficulty}",
      "starterCode": "",
      "testCases": [
        {"input": "", "output": "", "hidden": false}
      ]
    }
  ]
}

NO markdown.
NO backticks.
ONLY valid JSON.
    `;

    const response = await axios.post(
      // use chat completions path with OpenAI-compatible base URL
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 1.5--,
        response_format: { type: "json_object" } // JSON mode
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Safety check: ensure choices exist
    if (
      !response.data ||
      !response.data.choices ||
      !response.data.choices[0] ||
      !response.data.choices[0].message
    ) {
      console.log("Groq returned NO choices. Raw:", response.data);
      return [];
    }

    const raw = response.data.choices[0].message.content;

    console.log("\n=== RAW AI RESPONSE START ===");
    console.log(raw);
    console.log("=== RAW AI RESPONSE END ===\n");

    if (!raw || raw.trim().length === 0) {
      console.log("AI returned EMPTY CONTENT.");
      return [];
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.log("JSON Parse Error:", err.message);
      console.log("RAW TEXT:", raw);
      return [];
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      console.log("Parsed JSON has no 'questions' field:", parsed);
      return [];
    }

    return parsed.questions;
  } catch (error) {
    console.log("\n=== GROQ ERROR ===");
    console.log(error.response?.data || error.message);
    console.log("==================\n");
    return [];
  }
};
