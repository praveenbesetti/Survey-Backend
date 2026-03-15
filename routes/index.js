import express from 'express';
import Village from './villagesRoute.js';
import District from './district.js';
import Mandal from './mandalRoute.js';
import Auth from './authRouter.js';
import SurveyForm from './surveyFormRoute.js';
import surveyData from './surveyDataRoute.js';
import webAuth from './loginrouter.js';
import State from './stateRoute.js'
const router = express.Router();

router.use('/auth', Auth);
router.use('/districts', District);
router.use('/mandals', Mandal);
router.use('/villages', Village);
router.use('/surveys', SurveyForm);
router.use('/survey-data', surveyData);
router.use('/states',State);
router.use('/web-auth',webAuth)
export default router;