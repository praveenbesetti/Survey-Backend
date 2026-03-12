const express = require('express');
const router = express.Router();
const { District, Mandal, Village, Token } = require('./models'); // Your schema file
const bcrypt = require('bcrypt');

// 1. Bulk Insert Districts
router.post('/districts/bulk', async (req, res) => {
    try {
        // req.body: [{ name: "Vizag" }, { name: "Guntur" }]
        const docs = await District.insertMany(req.body);
        res.status(201).json({ count: docs.length, message: "Districts Added" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Insert Mandal (With Hashed Password for Agent)
router.post('/mandal', async (req, res) => {
    try {
        const { name, districtId, username, password, agentPhone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const mandal = new Mandal({
            name,
            districtId,
            username,
            password: hashedPassword,
            agentPhone
        });
        await mandal.save();
        res.status(201).json(mandal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Bulk Insert Villages (Optimized for 10L+ records)
router.post('/villages/bulk', async (req, res) => {
    try {
        // req.body: [{ name: "Village A", mandalId: "...", subagents: [...] }]
        // We use insertMany because it is faster than multiple .save() calls
        const result = await Village.insertMany(req.body, { ordered: false });
        res.status(201).json({ message: `${result.length} villages inserted` });
    } catch (err) {
        res.status(500).json({ error: "Bulk insert failed", details: err.message });
    }
});