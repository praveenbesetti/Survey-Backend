import { FetchStates } from "../controllers/stateController.js";
import express from 'express'

const router=express.Router();

router.get('/',FetchStates)

export default router;