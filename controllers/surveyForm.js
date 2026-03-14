import crypto from 'crypto';
import { Village } from '../models/VillageSchema.js';
import {Survey} from '../models/SurveySchema.js';

function generateRandomLetters(length) {
    return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

export const submitSurveyForm = async (req, res) => {
    try {
        const { village, mandalId, surveyorId } = req.body;

        req.body.surveyId = `${generateRandomLetters(3)}-${crypto.randomInt(100000000, 999999999)}`;
        const survey = new Survey(req.body);
        await survey.save();

        const updatedVillage = await Village.findOneAndUpdate(
            { 
                name: { $regex: new RegExp(`^${village.trim()}$`, "i") }, 
                mandalId,
                "subagents.surveyorId": surveyorId 
            },
            { 
                $inc: { "subagents.$.count": 1 }    
            },
            { new: true }
        );

        if (!updatedVillage) {
            return res.status(404).json({ error: "Surveyor not found in this village" });
        }

        // Find the specific agent's new count to send back to the frontend
        const agentData = updatedVillage.subagents.find(a => a.surveyorId === surveyorId);

        res.status(201).json({
            message: "Survey saved and agent count updated",
            surveyId: survey.surveyId,
            agentName: agentData?.name,
            agentCount: agentData?.count || 0
        });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
};