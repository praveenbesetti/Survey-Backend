import express from 'express';
import { District } from '../../model/DistrictSchema.js';
import { Mandal } from '../../model/MandalSchema.js';
import { Village } from '../../model/VillageSchema.js';

const router = express.Router();

export const initSurveyRoutes = (app) => {

    // 1. Get All Districts
    router.get('/districts', async (req, res) => {
        try {
            const districts = await District.find({}, 'name').sort({ name: 1 }).lean();
            res.json(districts);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 2. Get Mandals by District ID
    router.get('/mandals/:districtId', async (req, res) => {
        try {
            const mandals = await Mandal.find({ districtId: req.params.districtId }, 'name')
                .sort({ name: 1 })
                .lean();
            res.json(mandals);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 3. Get Agent Details (Mandal Head)
    router.get('/agent/:mandalId', async (req, res) => {
        try {
            const agent = await Mandal.findById(req.params.mandalId, 'name username agentPhone')
                .lean();
            res.json(agent);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    router.get('/Villages/:mandalId', async (req, res) => {
        try {
            console.log("Fetching villages for Mandal ID:", req.params.mandalId);

            // 1. Use .find() to get all documents that match the mandalId
            // We only select the 'name' field
            const villages = await Village.find({ mandalId: req.params.mandalId }, 'name').lean();

            if (!villages || villages.length === 0) {
                console.log("No villages found for this Mandal.");
                return res.status(200).json([]);
            }

            const villageNamesOnly = villages.map(v => v.name);

            res.json(villageNamesOnly);
        } catch (err) {
            console.error("Error fetching villages:", err.message);
            res.status(500).json({ error: err.message });
        }
    });



    // 4. Get Subagents & Villages by Mandal ID (For Agent Table)
    router.get('/subagents/:mandalId', async (req, res) => {
        try {
            const villages = await Village.find({ mandalId: req.params.mandalId }, 'name subagents')
                .sort({ name: 1 })
                .lean();

            const subagentList = villages.map(v => ({
                villageName: v.name,
                villageId: v._id,
                details: v.subagents
            }));
            console.log("Subagent List:", subagentList);
            res.json(subagentList);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/survey/submit', async (req, res) => {
        try {
            const { role, mandalId, village, username, password, token } = req.body;

            // 1. AGENT VALIDATION (Check Mandal DB)
            if (role === 'agent') {
                const mandal = await Mandal.findById(mandalId).lean();

                if (!mandal) {
                    return res.status(404).json({ error: "Mandal not found." });
                }

                // Compare exactly: Username and Password
                if (mandal.username !== username || mandal.password !== password) {
                    return res.status(401).json({ error: "Invalid Agent credentials." });
                }

                const { username: _, password: __, ...safeMandalData } = mandal;

                return res.status(200).json({
                    success: true,
                    message: "Agent Authenticated",
                    data: {
                        ...safeMandalData,
                        mandalId: safeMandalData._id // <--- Explicitly add this line
                    }
                });
            }

            // 2. SUB-AGENT VALIDATION (Check Village DB)
            else if (role === 'subagent') {
                // Use .populate to get Mandal and District info
                const villageDoc = await Village.findOne({
                    name: village,
                    mandalId: mandalId
                })
                    .populate({
                        path: 'mandalId',
                        select: 'name districtId', // Only get Mandal name and District link
                        populate: {
                            path: 'districtId',
                            select: 'name' // Only get District name
                        }
                    })
                    .lean();

                if (!villageDoc) {
                    return res.status(404).json({ error: "Village not found." });
                }

                // Look through subagents array for exact match
                const validSubAgent = villageDoc.subagents.find(sa =>
                    sa.username === username &&
                    sa.password === password &&
                    sa.token === token
                );

                if (!validSubAgent) {
                    return res.status(401).json({ error: "Sub-Agent validation failed." });
                }

                // --- SECURITY & DATA FORMATTING ---
                const { subagents, ...rest } = villageDoc;

                const safeVillageData = {
                    _id: rest._id,
                    villageName: rest.name,
                    mandalName: rest.mandalId?.name || "N/A",
                    districtName: rest.mandalId?.districtId?.name || "N/A",
                    mandalId: rest.mandalId?._id
                };

                return res.status(200).json({
                    success: true,
                    message: "Sub-Agent Authenticated",
                    data: safeVillageData
                });
            }

            res.status(400).json({ error: "Invalid role specified." });

        } catch (err) {
            console.error("Auth Error:", err.message);
            res.status(500).json({ error: "Internal server error." });
        }
    });
    // Mount all routes under /api
    app.use('/api', router);
};