import { useState } from "react";
import "./App.css";

const FEATURE_TYPES = [
  "FUNCTIONAL UI",
  "API",
  "DATABASE",
  "INTEGRATION",
];

const TESTING_TYPES = [
  "End2End Testing",
  "Smoke Testing",
  "Regression Testing",
];

const DEFAULT_REUSABLE_STEPS = `Step:
Action: Login to XTEL web application
Expected Result: User Lands on the HomePage

Step:
Action:
Expected Result:

Step:
Action:
Expected Result:`;

const DEFAULT_FORMAT = `Title:
Pre Conditions:
Description:
Steps & Actions:

Step:
Action:

`;

export default function App() {
  const [featureType, setFeatureType] = useState("");
  const [testingType, setTestingType] = useState("");
  const [testCaseFormat, setTestCaseFormat] = useState(DEFAULT_FORMAT);
  const [reusableSteps, setReusableSteps] = useState(DEFAULT_REUSABLE_STEPS);
  const [numOfTC, setNumOfTC] = useState("5");

  const [title, setTitle] = useState("");
  const [preCondition, setPreCondition] = useState("");
  const [description, setDescription] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");

  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const [testCases, setTestCases] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setTestCases("");

    const count = parseInt(numOfTC, 10);
    if (!featureType || !testingType) {
      setError("Please select Feature Type and Testing Type.");
      return;
    }
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      setError("Num of TC must be a whole number between 1 and 50.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Enter API Key is required to generate test cases.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureType,
          testingType,
          testCaseFormat,
          reusableSteps,
          numOfTC: count,
          title,
          preCondition,
          description,
          acceptanceCriteria,
          apiKey: apiKey.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed.");
      }
      setTestCases(data.testCases);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyOutput() {
    if (testCases) navigator.clipboard.writeText(testCases);
  }

  return (
    <div className="app">
      <div className="glow glow-1" aria-hidden />
      <div className="glow glow-2" aria-hidden />

      <header className="header">
        <h1>TestCase Guru</h1>
      </header>

      <main className="layout">
        <form className="panel form-panel" onSubmit={handleGenerate}>
          <label className="field">
            <span className="label">Feature Type</span>
            <select
              value={featureType}
              onChange={(e) => setFeatureType(e.target.value)}
              required
            >
              <option value="">Select…</option>
              {FEATURE_TYPES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Testing Type</span>
            <select
              value={testingType}
              onChange={(e) => setTestingType(e.target.value)}
              required
            >
              <option value="">Select…</option>
              {TESTING_TYPES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Test Case Format</span>
            <textarea
              value={testCaseFormat}
              onChange={(e) => setTestCaseFormat(e.target.value)}
              rows={10}
              className="mono"
              required
            />
          </label>

          <label className="field">
            <span className="label">Reusable Steps</span>
            <span className="hint">
              Shared steps reused when the same flow appears in multiple test
              cases
            </span>
            <textarea
              value={reusableSteps}
              onChange={(e) => setReusableSteps(e.target.value)}
              rows={12}
              className="mono"
            />
          </label>

          <label className="field field-narrow">
            <span className="label">Num of TC</span>
            <span className="hint">How many test cases the AI should create</span>
            <input
              type="number"
              min={1}
              max={50}
              value={numOfTC}
              onChange={(e) => setNumOfTC(e.target.value)}
              required
            />
          </label>

          <h2 className="block-heading">User Story:</h2>

          <label className="field">
            <span className="label">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="User story title"
              required
            />
          </label>

          <label className="field">
            <span className="label">Pre Conditions</span>
            <textarea
              value={preCondition}
              onChange={(e) => setPreCondition(e.target.value)}
              placeholder="Required system state, data, and access before testing"
              rows={3}
            />
          </label>

          <label className="field">
            <span className="label">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="User story description"
              rows={4}
              required
            />
          </label>

          <label className="field">
            <span className="label">Acceptance Criteria</span>
            <textarea
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              placeholder="Acceptance criteria for this user story"
              rows={5}
              required
            />
          </label>

          <label className="field">
            <span className="label">Enter API Key</span>
            <span className="hint">
              Paste your OpenAI key here while working. Clear this field when
              you are done—it is not saved.
            </span>
            <div className="api-key-wrap">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="api-key-toggle"
                onClick={() => setShowApiKey((v) => !v)}
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden />
                Generating…
              </>
            ) : (
              "Generate Test Cases"
            )}
          </button>
        </form>

        <section className="panel output-panel">
          <div className="output-header">
            <h2 className="block-heading">Generated Test Case:</h2>
            {testCases && (
              <button
                type="button"
                className="btn-secondary"
                onClick={copyOutput}
              >
                Copy
              </button>
            )}
          </div>

          <div className="output-body">
            {loading && (
              <p className="placeholder pulse">AI is writing your test cases…</p>
            )}
            {!loading && !testCases && !error && (
              <p className="placeholder">
                Complete the form above and click Generate. Output appears here.
              </p>
            )}
            {testCases && (
              <pre className="output-content">{testCases}</pre>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        App build by Zulqarnain-qa for the community: If you want to support
        write at{" "}
        <a href="mailto:mzulkarnain231@gmail.com">mzulkarnain231@gmail.com</a>
      </footer>
    </div>
  );
}
