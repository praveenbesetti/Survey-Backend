import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ExcelJS from 'exceljs';
import { District } from '../model/DistrictSchema.js';
import { Mandal } from '../model/MandalSchema.js';
import { Village } from '../model/VillageSchema.js';

export const setupCompleteHierarchy = async () => {
    const xlsxFilePath = path.resolve('data.xlsx');

    if (!fs.existsSync(xlsxFilePath)) {
        console.error(`❌ XLSX File NOT found at: ${xlsxFilePath}`);
        return;
    }

    const uniqueDistricts = new Set();
    const uniqueMandals = new Map();
    const villagesToProcess = [];

    console.log("🛠️ Step 1: Reading XLSX and building hierarchy maps...");

    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(xlsxFilePath);
    
    for await (const worksheetReader of workbookReader) {
        for await (const row of worksheetReader) {
            if (row.number === 1) continue; // Skip header

            const district_name = row.getCell(3).value?.toString()?.trim();
            const mandal_name = row.getCell(4).value?.toString()?.trim();
            const village_name = row.getCell(5).value?.toString()?.trim();

            if (!district_name || !mandal_name || !village_name) continue;

            uniqueDistricts.add(district_name);

            const mandalKey = `${district_name}|${mandal_name}`;
            if (!uniqueMandals.has(mandalKey)) {
                uniqueMandals.set(mandalKey, {
                    mandalName: mandal_name,
                    districtName: district_name
                });
            }

            // Temporarily store village data to link after Mandals are synced
            villagesToProcess.push({ district_name, mandal_name, village_name });
        }
    }

    // --- Step 2: Sync Districts with Unique Auth ---
    console.log("📂 Syncing Districts...");
    const districtLookup = {};
    for (const dName of uniqueDistricts) {
        const doc = await District.findOneAndUpdate(
            { name: dName },
            { $setOnInsert: { name: dName, state: "Andhra Pradesh" } },
            { upsert: true, returnDocument: 'after', lean: true }
        );
        districtLookup[dName] = doc._id;
    }

    // --- Step 3: Sync Mandals with Unique Credentials ---
    console.log("👤 Syncing Mandals with unique credentials...");
    const mandalLookup = {};
    for (const [key, details] of uniqueMandals) {
        const cleanMandal = details.mandalName.toLowerCase().replace(/\s+/g, '');
        const mSuffix = crypto.randomBytes(2).toString('hex');
        
        const mDoc = await Mandal.findOneAndUpdate(
            { name: details.mandalName, districtId: districtLookup[details.districtName] },
            { 
                $setOnInsert: { 
                    name: details.mandalName,
                    districtId: districtLookup[details.districtName],
                    username: `agent_${cleanMandal}_${mSuffix}`,
                    password: crypto.randomBytes(4).toString('hex'), // Unique 8-char pass
                } 
            },
            { upsert: true, returnDocument: 'after', lean: true }
        );
        mandalLookup[key] = mDoc._id;
    }

    // --- Step 4: Bulk Push Villages with Unique Credentials (10L+ optimized) ---
    console.log("🚀 Pushing Villages with unique subagent credentials...");
    const BATCH_SIZE = 5000;
    
    for (let i = 0; i < villagesToProcess.length; i += BATCH_SIZE) {
        const chunk = villagesToProcess.slice(i, i + BATCH_SIZE).map(v => {
            const villageClean = v.village_name.toLowerCase().replace(/\s+/g, '');
            const vSuffix = crypto.randomBytes(2).toString('hex');
            
            return {
                name: v.village_name,
                mandalId: mandalLookup[`${v.district_name}|${v.mandal_name}`],
                subagents: [{
                    username: `sub_${villageClean}_${vSuffix}`,
                    password: crypto.randomBytes(4).toString('hex'),
                    token: crypto.randomBytes(3).toString('hex').toUpperCase(),
                    count: 0,
                    isAuthorized: false
                }]
            };
        });

        try {
            await Village.insertMany(chunk, { ordered: false });
            console.log(`📊 Progress: ${Math.min(i + BATCH_SIZE, villagesToProcess.length)} / ${villagesToProcess.length} villages inserted.`);
        } catch (err) {
            console.error("Batch insertion error:", err.message);
        }
    }

    console.log("🏆 COMPLETE: All levels synced with unique credentials!");
    process.exit(0);
};