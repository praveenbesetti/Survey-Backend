import express from 'express';
import { District } from '../models/DistrictSchema.js';
const router = express.Router();


export const getDistrictsByState = async (req, res) => {
    try {
        const { stateId } = req.params;
        const districts = await District.find({ stateId }).sort({ name: 1 });
        res.json({ success: true, data: districts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};










