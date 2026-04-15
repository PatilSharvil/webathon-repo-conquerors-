import express from 'express';
import Property from '../models/Property.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { surveyNumber, location, district } = req.query;
    const query = {};
    if (surveyNumber) query.surveyNumber = { $regex: surveyNumber, $options: 'i' };
    if (location) query.location = { $regex: location, $options: 'i' };
    if (district) query.district = { $regex: district, $options: 'i' };
    
    const properties = await Property.find(query);
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const property = await Property.create(req.body);
    res.status(201).json(property);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
