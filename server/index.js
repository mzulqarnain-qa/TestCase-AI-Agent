require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function resolveApiKey(requestKey) {
  const fromRequest = requestKey?.trim();
  if (fromRequest) return fromRequest;

  const fromEnv = process.env.OPENAI_API_KEY?.trim();
  if (fromEnv && fromEnv !== "YOUR_OPENAI_API_KEY_HERE") return fromEnv;

  return null;
}

function createOpenAIClient(apiKey) {
  return new OpenAI({ apiKey });
}

const FEATURE_TYPE_RULES = {
  "FUNCTIONAL UI": `
- Write ONLY Functional UI test cases (screens, buttons, forms, navigation, validation messages, UI states).
- Do NOT include API-only, database-only, or integration-layer test cases unless the UI directly exposes them.
- Steps must describe user actions on the interface and visible outcomes.`,
  API: `
- Write ONLY API test cases (endpoints, HTTP methods, request/response bodies, status codes, headers, auth tokens).
- Do NOT include UI click paths or visual verification unless required by the API contract.
- Include request payloads, expected response schemas, and error responses where relevant.`,
  DATABASE: `
- Write ONLY database test cases (tables, constraints, CRUD, queries, stored procedures, data integrity, migrations).
- Do NOT include UI flows or HTTP client steps unless they are only to trigger DB verification.
- Focus on data setup, SQL or ORM operations, and expected DB state.`,
  INTEGRATION: `
- Write ONLY integration test cases (interaction between systems, services, queues, third parties).
- Cover handoffs, message formats, sync/async behavior, and failure across boundaries.
- Do NOT write isolated single-layer UI-only or DB-only cases unless they prove an integration point.`,
};

const TESTING_TYPE_RULES = {
  "End2End Testing": `
- Analyze the full user story and write complete flows from start to finish.
- Each test case should chain realistic steps across the journey (setup → action → verification → outcome).
- Cover the happy path and meaningful alternates; depth is expected.`,
  "Smoke Testing": `
- Write high-level, general test cases to confirm main functionality only.
- Do NOT go in-depth: no exhaustive edge cases, negative matrices, or minor UI variations.
- Keep steps short; verify the feature works at a basic level.`,
  "Regression Testing": `
- Write test cases suited for regression: stable, repeatable checks on existing behavior.
- Prioritize areas impacted by the user story and critical paths that must not break.
- Balance coverage with clarity; include key positive and high-risk negative checks.`,
};

function buildPrompt(body) {
  const {
    featureType,
    testingType,
    numOfTC,
    title,
    description,
    acceptanceCriteria,
    preCondition,
    reusableSteps,
    testCaseFormat,
  } = body;

  const featureRules =
    FEATURE_TYPE_RULES[featureType] || "Follow the selected feature type strictly.";
  const testingRules =
    TESTING_TYPE_RULES[testingType] || "Follow the selected testing type strictly.";

  return `You are an expert QA engineer. Generate test cases that strictly obey every rule below.

## MANDATORY COUNT
- Generate exactly ${numOfTC} test case(s)—no more, no less.

## MANDATORY SEPARATOR (between every test case)
Before EACH test case (including the first), output this exact line on its own:
---------------------------------------

Then a blank line, then the test case content using the format below.
Example structure for 2 test cases:

---------------------------------------

Title:
Pre Conditions:
Description:
Steps & Actions:

Step:
Action:

---------------------------------------

Title:
Pre Conditions:
Description:
Steps & Actions:

Step:
Action:

## Feature Type: ${featureType}
${featureRules}

## Testing Type: ${testingType}
${testingRules}

## User Story
Title: ${title}
Pre Conditions: ${preCondition || "None specified"}
Description: ${description}
Acceptance Criteria: ${acceptanceCriteria}

## Reusable Steps
When a test case uses the same flow as below, insert those steps (Action and Expected Result) without rewriting them differently.
${reusableSteps || "None provided"}

## Test Case Format (use this structure for EVERY test case)
${testCaseFormat}

## Output rules
1. Output exactly ${numOfTC} test cases—nothing else (no intro, no summary, no "Test Case 1" labels).
2. Put the separator line --------------------------------------- on its own line immediately before each test case.
3. Every test case must use the Test Case Format fields in order: Title, Pre Conditions, Description, Steps & Actions, then Step/Action blocks.
4. Every test case must align with Feature Type "${featureType}" only—never mix other feature types.
5. Depth and flow must match Testing Type "${testingType}" only.
6. Map test cases to the acceptance criteria and user story description.
7. Use Reusable Steps verbatim where the flow matches.
8. Under "Steps & Actions", use the Step / Action pattern from the format; add Expected Result per step when the format or reusable steps imply it.
9. Do not invent requirements not present in the user story unless needed for ${testingType} coverage within ${featureType} scope.`;
}

function buildSystemMessage(body) {
  const { featureType, testingType, numOfTC } = body;
  return `You generate manual test cases for QA teams. You MUST:
- Produce exactly ${numOfTC} test cases, never more or fewer.
- Before each test case, output exactly: ---------------------------------------
- Then each test case with Title, Pre Conditions, Description, Steps & Actions, Step/Action blocks.
- Scope ALL content to Feature Type: ${featureType} only.
- Apply Testing Type: ${testingType} rules for depth and flow.
- Follow the user's Test Case Format template exactly for each test case.
- Never ignore Num of TC, Feature Type, or Testing Type constraints.`;
}

app.post("/api/generate", async (req, res) => {
  try {
    const {
      featureType,
      testingType,
      numOfTC,
      title,
      description,
      acceptanceCriteria,
      testCaseFormat,
      apiKey: requestApiKey,
    } = req.body;

    if (!featureType || !testingType) {
      return res.status(400).json({
        error: "Feature Type and Testing Type are required.",
      });
    }

    const count = parseInt(numOfTC, 10);
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      return res.status(400).json({
        error: "Num of TC must be a whole number between 1 and 50.",
      });
    }

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        error: "User Story Title and Description are required.",
      });
    }

    if (!acceptanceCriteria?.trim()) {
      return res.status(400).json({
        error: "Acceptance Criteria is required.",
      });
    }

    if (!testCaseFormat?.trim()) {
      return res.status(400).json({
        error: "Test Case Format is required.",
      });
    }

    const apiKey = resolveApiKey(requestApiKey);
    if (!apiKey) {
      return res.status(400).json({
        error: "Enter API Key is required to generate test cases.",
      });
    }

    const openai = createOpenAIClient(apiKey);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: buildSystemMessage({ ...req.body, numOfTC: count }),
        },
        {
          role: "user",
          content: buildPrompt({ ...req.body, numOfTC: count }),
        },
      ],
      temperature: 0.3,
      max_tokens: Math.min(16384, 1200 * count + 800),
    });

    const testCases =
      completion.choices[0]?.message?.content?.trim() ||
      "No test cases were generated.";

    res.json({ testCases });
  } catch (err) {
    console.error("Generate error:", err);
    const message =
      err?.error?.message || err?.message || "Failed to generate test cases.";
    res.status(500).json({ error: message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Test Case Generator API running on http://localhost:${PORT}`);
});
