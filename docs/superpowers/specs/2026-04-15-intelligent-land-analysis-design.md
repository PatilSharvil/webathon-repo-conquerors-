# Intelligent Land Analysis System - Design Spec

## Overview

Transform a static land record viewer into an intelligent, explainable, AI-assisted decision system for property evaluation.

## Architecture: Modular Monolith (Approach A)

Single Node.js/Express backend with 5 isolated service modules, React frontend, MongoDB local database, and Ollama local LLM.

## Service Boundaries

| Service | Responsibility | Dependencies |
|---------|---------------|--------------|
| Risk Engine | Trust scores, fraud detection, risk insights | MongoDB |
| Semantic Search | NLP property queries, intent classification | Ollama, MongoDB |
| Document Intelligence | PDF/text parsing, entity extraction | Ollama, MongoDB |
| Temporal Analyzer | Time-based risk visualization data | MongoDB |
| Explainability | Reasoning layer wrapping all outputs | All services |

## Data Models

### Property
```typescript
interface Property {
  _id: string;
  surveyNumber: string;
  ownerName: string;
  area: number;
  location: string;
  ownershipHistory: OwnershipRecord[];
  loans: LoanRecord[];
  disputes: DisputeRecord[];
  createdAt: Date;
  updatedAt: Date;
}

interface OwnershipRecord {
  ownerName: string;
  transferDate: Date;
  transferType: 'sale' | 'inheritance' | 'gift' | 'other';
  documentRef: string;
}

interface LoanRecord {
  lender: string;
  amount: number;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'closed';
}

interface DisputeRecord {
  filedDate: Date;
  type: string;
  status: 'pending' | 'resolved' | 'active';
  description: string;
}
```

### RiskAssessment
```typescript
interface RiskAssessment {
  propertyId: string;
  score: number;           // 0-100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: RiskFactor[];
  insights: string[];
  temporalData: TemporalRiskPoint[];
  assessedAt: Date;
}

interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence: string[];
}

interface TemporalRiskPoint {
  date: Date;
  event: string;
  riskDelta: number;
  cumulativeScore: number;
}
```

### Document
```typescript
interface Document {
  _id: string;
  propertyId?: string;
  fileName: string;
  fileType: 'pdf' | 'text' | 'image';
  extractedContent: ExtractedData;
  uploadedAt: Date;
}

interface ExtractedData {
  ownerNames: string[];
  dates: Date[];
  legalClauses: string[];
  riskIndicators: string[];
  summary: string;
}
```

## API Endpoints

```
GET    /api/properties/:id              - Get property details
GET    /api/properties                  - List/search properties
POST   /api/risk/assess/:propertyId     - Assess property risk
GET    /api/risk/:propertyId            - Get risk assessment
POST   /api/search/semantic             - Semantic property search
POST   /api/documents/upload            - Upload property document
GET    /api/documents/:id               - Get document analysis
GET    /api/temporal/:propertyId        - Get temporal risk timeline
GET    /api/explain/:assessmentId       - Get explanation for assessment
```

## Tech Stack

- **Backend:** Node.js 20+, Express, TypeScript
- **Frontend:** React 18, TypeScript, Tailwind CSS, Recharts
- **Database:** MongoDB (local), Mongoose ODM
- **AI:** Ollama (local LLM via HTTP API)
- **Document Parsing:** pdf-parse, mammoth (for .docx)
- **Testing:** Vitest, Supertest
- **Build:** Vite (frontend), esbuild (backend)

## Design Principles

- Explainability > Complexity
- Trust > Automation
- Insight > Raw Data
- Local-first > Cloud dependency
