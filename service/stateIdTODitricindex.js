import { State } from '../models/stateSchema.js'
import { District } from '../models/DistrictSchema.js';

export const migrateAndhraPradeshData = async () => {
    try {
        console.log("--- Starting State & District Migration ---");

        // 1. Add (or Find) Andhra Pradesh in the State collection
        // upsert: true ensures we don't create duplicates if you run this twice
        const stateDoc = await State.findOneAndUpdate(
            { name: "Andhra Pradesh" },
            { name: "Andhra Pradesh", stateCode: "AP" },
            { upsert: true, new: true }
        );

        const stateId = stateDoc._id;
        console.log(`✅ State ID for Andhra Pradesh: ${stateId}`);

        // 2. Update all existing Districts to point to this stateId
        // We filter for districts that don't have a stateId yet
        const result = await District.updateMany(
            { stateId: { $exists: false } }, 
            { $set: { stateId: stateId } }
        );

        console.log(`✅ Migration complete. Updated ${result.modifiedCount} districts.`);
        
        return { success: true, stateId };
    } catch (error) {
        console.error("❌ Migration Error:", error.message);
        throw error;
    }
};