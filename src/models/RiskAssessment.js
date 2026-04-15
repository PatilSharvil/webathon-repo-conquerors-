import mongoose from 'mongoose';

const riskFactorSchema = new mongoose.Schema({
  type: String,
  severity: { type: String, enum: ['low', 'medium', 'high'] },
  description: String,
  evidence: [String]
}, { _id: false });

const temporalRiskPointSchema = new mongoose.Schema({
  date: Date,
  event: String,
  riskDelta: Number,
  cumulativeScore: Number
}, { _id: false });

const riskAssessmentSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  score: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
  factors: [riskFactorSchema],
  insights: [String],
  temporalData: [temporalRiskPointSchema],
  explanation: String
}, { timestamps: true });

export default mongoose.model('RiskAssessment', riskAssessmentSchema);
