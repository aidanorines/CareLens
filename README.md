# CareLens

## Team Members
- Jorge Martinez-Lopez (jorgemar723)
- Abid Ahnaf Khan
- Aidan Orines
- Sabid Mahmud

---

## Problem Statement

Healthcare providers often face fragmented patient data across multiple systems, making it difficult to quickly assess risk and prioritize care. This can lead to delayed interventions and increased risk for patients with complex conditions.

---

## Solution Description

CareLens is a lightweight healthcare analytics dashboard that aggregates patient data and provides real-time risk assessments. The system analyzes patient vitals, conditions, and medical history to generate:

- Risk scores (Low, Moderate, High)
- Key risk flags
- AI-assisted summaries of patient health status

This helps clinicians quickly understand patient risk and make more informed decisions.

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
