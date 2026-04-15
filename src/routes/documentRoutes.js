import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import Document from '../models/Document.js';

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './src/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const doc = await Document.create({
      propertyId: req.body.propertyId || null,
      fileName: req.file.originalname,
      fileType: req.file.mimetype.includes('pdf') ? 'pdf' : 'text',
      filePath: req.file.path,
      analysisStatus: 'processing'
    });

    // Extract and analyze content
    let extractedText = '';
    if (req.file.mimetype.includes('pdf')) {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else {
      extractedText = fs.readFileSync(req.file.path, 'utf8');
    }

    // Use Ollama to extract structured data
    let extractedContent = { ownerNames: [], dates: [], legalClauses: [], riskIndicators: [], summary: '' };
    try {
      const ollamaResponse = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
        model: process.env.OLLAMA_MODEL || 'llama3.2',
        prompt: `Extract from this property document and return ONLY valid JSON with keys: ownerNames (array), dates (array as strings), legalClauses (array), riskIndicators (array), summary (string). Text: ${extractedText.substring(0, 3000)}`,
        stream: false
      });
      
      extractedContent = JSON.parse(ollamaResponse.data.response.replace(/```json\n?|\n?```/g, '').trim());
    } catch (ollamaError) {
      extractedContent.summary = extractedText.substring(0, 500);
      console.log('Ollama extraction failed, using raw text');
    }

    doc.extractedContent = extractedContent;
    doc.analysisStatus = 'completed';
    await doc.save();

    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
