// const axios = require("axios");

// const GROQ_API_KEY = process.env.GROQ_API_KEY;
// const GROQ_MODEL = "llama-3.3-70b-versatile";

// async function callAI(prompt) {
//   if (!GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY in .env");

//   const body = {
//     model: GROQ_MODEL,
//     messages: [
//       {
//         role: "system",
//         content: "You are an expert competitive programming problem setter."
//       },
//       {
//         role: "user",
//         content: prompt
//       }
//     ],
//     temperature: 0.2
//   };

//   try {
//     const resp = await axios.post(
//       "https://api.groq.com/openai/v1/chat/completions",
//       body,
//       {
//         headers: {
//           Authorization: `Bearer ${GROQ_API_KEY}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     return resp.data.choices?.[0]?.message?.content || "";
//   } catch (err) {
//     console.error("AI CALL ERROR:", err.response?.data || err.message);
//     throw new Error(
//       "AI call failed: " +
//         (err.response?.data?.error?.message || err.message)
//     );
//   }
// }

// async function generateFullQuestionPackage(seed = "") {
//   const prompt = `
// Generate a complete coding interview problem package in STRICT JSON ONLY.

// JSON FIELDS REQUIRED:
// - title (string)
// - description (string)
// - examples (array of objects: { input, output })
// - constraints (string)
// - difficulty (easy|medium|hard)
// - topic (string)

// - generatorLanguage ("python")
// - generatorVersion ("3.10.0" or "*")
// - generatorScript (code that prints ONE random valid input; NO explanation)

// - solutionLanguage ("python")
// - solutionVersion ("3.10.0" or "*")
// - referenceSolution (correct solution reading stdin, printing ONLY output)
// - bruteForceSolution (slow but ALWAYS correct solution for verification)

// RULES:
// - Output STRICT JSON only. No text outside the JSON.
// - The generatorScript must print exactly ONE test input.
// - The referenceSolution must exactly solve the problem.
// - bruteForceSolution must be simple, clear, and 100% correct.

// SEED: ${seed}
// `;

//   const raw = await callAI(prompt); // <-- FIXED variable name

//   try {
//     const start = raw.indexOf("{");
//     const end = raw.lastIndexOf("}");
//     if (start === -1 || end === -1) {
//       throw new Error("AI did not return any JSON object.");
//     }
    
//     const jsonText = raw.slice(start, end + 1).trim();
//     return JSON.parse(jsonText);
    
//   } catch (err) {
//     console.error("JSON PARSE ERROR:\n", raw);
//     throw new Error("AI returned invalid JSON: " + err.message);
//   }
// }

// module.exports = {
//   callAI,
//   generateFullQuestionPackage
// };
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
        temperature: 1.5,
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
