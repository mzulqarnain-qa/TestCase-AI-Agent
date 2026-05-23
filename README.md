# TestCase Guru

AI-powered app that generates test cases from user story descriptions, acceptance criteria, and your custom format template.

Built by [Zulqarnain-qa](https://github.com/mzulqarnain-qa) for the QA community.

## Features

Form fields (in order): **Feature Type**, **Testing Type**, **Test Case Format**, **Reusable Steps**, **Num of TC**, **User Story** (Title, Pre Conditions, Description, Acceptance Criteria), **Generated Test Case**

- **Num of TC** — AI generates exactly that many test cases
- **Feature Type** — AI scopes output only to that layer (UI, API, DB, Integration)
- **Testing Type** — End2End (full flows), Smoke (main functionality only), Regression
- Reusable steps use Step / Action / Expected Result blocks
- Dark, clean UI with live output panel

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. (Optional) Copy `.env.example` to `.env` if you prefer a server-side key instead of the UI field.

3. Run both API and frontend:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Usage

1. Select feature and testing types.
2. Fill in the user story and optional pre-conditions.
3. Add reusable steps (e.g. login flow) if the same steps apply to many cases.
4. Customize the test case format template or keep the default.
5. Paste your key in **Enter API Key** (last field). Use **Show** / **Hide** to toggle visibility. Clear the field when you are done.
6. Click **Generate Test Cases** and copy the result from the right panel.

## Project structure

```
TestCase-AI-Agent/
  client/          React + Vite UI
  server/          Express API + OpenAI
  .env.example     API key placeholder
```
