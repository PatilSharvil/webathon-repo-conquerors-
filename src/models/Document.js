import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  fileName: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'text', 'image'], required: true },
  filePath: String,
  extractedContent: {
    ownerNames: [String],
    dates: [Date],
    legalClauses: [String],
    riskIndicators: [String],
    summary: String
  },
  analysisStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Document', documentSchema);
