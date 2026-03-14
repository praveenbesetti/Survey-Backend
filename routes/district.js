import express from 'express';
import { getDistrictsByState } from '../controllers/districController.js';

const router = express.Router();
router.get('/state/:stateId', getDistrictsByState);
export default router;