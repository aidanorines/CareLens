# CareLens

## Team Members

- [Jorge Martinez-Lopez](https://github.com/jorgemar723)

- [Abid Ahnaf Khan](https://github.com/ajv163)

- [Aidan Orines](https://github.com/aidanorines)

- [Sabid Mahmud](https://github.com/sabidmahmud01)

---

## Problem Statement

Healthcare providers often rely on fragmented and complex patient data distributed across multiple systems. This makes it difficult to quickly identify high-risk patients, prioritize care, and respond to emerging health concerns in a timely manner.

Without clear, centralized insights, clinicians must manually interpret vitals, conditions, and medical history, increasing the likelihood of delayed interventions and overlooked risk factors.

---

## Solution Description

CareLens is a healthcare analytics dashboard designed to transform patient data into actionable insights. It aggregates key clinical information and applies a rule-based risk analysis engine to evaluate patient health in real time.

The system processes patient vitals, conditions, and encounter history to generate:

- Risk scores categorized as Low, Moderate, or High
- Key risk flags highlighting potential clinical concerns
- AI-assisted summaries that provide a clear, human-readable overview of patient risk

By simplifying complex patient data into intuitive insights, CareLens helps clinicians quickly identify high-risk individuals and make more informed, timely decisions.

While the current implementation uses synthetic data for demonstration purposes, the system is designed to support future integration with real-world healthcare data standards such as FHIR.

---

## Tech Stack

Frontend:
- React
- TypeScript
- Vite

Backend:
- Node.js
- Express

Data & Logic:
- In-memory synthetic patient data
- Custom risk scoring engine
- Summary generation logic

Prototype / Future Work:
- Flask (Python)
- SQLite (for persistence)

---

## Setup Instructions

### Backend
```
cd projects/carelens/backend
npm install
node server.js
```

#### Backend runs on:
```
http://localhost:3001
```

## Frontend

```
cd projects/carelens/frontend
npm install
npm run dev
```

## Open the URL shown in the terminal:
```
http://localhost:5173
```

## Notes

* Uses synthetic patient data only
* Not intended for real clinical decision-making
* Built within a 36-hour hackathon sprint
