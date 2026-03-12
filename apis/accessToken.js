// 4. SUBAGENT: Create Access Token
router.post('/token/request', async (req, res) => {
    try {
        const { subagentUsername, villageId, mandalId } = req.body;
        
        // Generate a clean 6-character alphanumeric token
        const tokenValue = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newToken = await Token.create({
            subagentUsername,
            villageId,
            mandalId,
            tokenValue,
            isValid: false // Pending approval
        });

        res.json({ token: tokenValue, message: "Token generated. Share with Agent." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. AGENT: Approve Token (Update Status to True)
router.patch('/token/approve', async (req, res) => {
    try {
        const { tokenValue, mandalId } = req.body;

        // Ensure Agent can only approve tokens for THEIR Mandal
        const token = await Token.findOneAndUpdate(
            { tokenValue, mandalId }, 
            { isValid: true },
            { new: true }
        );

        if (!token) return res.status(404).json({ error: "Token not found or expired" });
        res.json({ success: true, message: "Subagent access verified" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. SUBAGENT: Check if Approved
router.get('/token/status/:tokenValue', async (req, res) => {
    const token = await Token.findOne({ tokenValue: req.params.tokenValue }).lean();
    if (!token) return res.status(404).json({ error: "Expired" });
    
    res.json({ isValid: token.isValid });
});