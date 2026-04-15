import mongoose from 'mongoose';

const ownershipRecordSchema = new mongoose.Schema({
  ownerName: { type: String, required: true },
  transferDate: { type: Date, required: true },
  transferType: { type: String, enum: ['sale', 'inheritance', 'gift', 'other'], default: 'sale' },
  documentRef: String
}, { _id: true });

const loanRecordSchema = new mongoose.Schema({
  lender: String,
  amount: Number,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
}, { _id: true });

const disputeRecordSchema = new mongoose.Schema({
  filedDate: Date,
  type: String,
  status: { type: String, enum: ['pending', 'resolved', 'active'], default: 'pending' },
  description: String
}, { _id: true });

const propertySchema = new mongoose.Schema({
  surveyNumber: { type: String, required: true, unique: true },
  ownerName: { type: String, required: true },
  area: Number,
  location: String,
  district: String,
  village: String,
  landType: String,
  ownershipHistory: [ownershipRecordSchema],
  loans: [loanRecordSchema],
  disputes: [disputeRecordSchema],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export default mongoose.model('Property', propertySchema);
