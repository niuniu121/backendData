// routes/population.js
const express = require('express');
const path = require('path');
const XLSX = require('xlsx');

const router = express.Router();

function resolveFilePath() {
    const rootTry = path.join(__dirname, '..', '32180DS0001_2001-21.xlsx');
    const dataTry = path.join(__dirname, '..', 'data', '32180DS0001_2001-21.xlsx');
    return { rootTry, dataTry };
}

function pickSheet(workbook) {
    if (workbook.Sheets['Table 5']) return 'Table 5';
    const found = workbook.SheetNames.find(n => String(n).toLowerCase().includes('table 5'));
    return found || workbook.SheetNames[5] || workbook.SheetNames[0];
}

function toNumber(raw) {
    if (raw == null) return null;
    if (typeof raw === 'number') return raw;
    const n = Number(String(raw).replace(/[, ]/g, ''));
    return Number.isFinite(n) ? n : null;
}

// ---- 核心：更鲁棒的表头探测 ----
function loadTable5() {
    const { rootTry, dataTry } = resolveFilePath();

    let wb;
    try { wb = XLSX.readFile(rootTry); } catch { wb = XLSX.readFile(dataTry); }

    const sheetName = pickSheet(wb);
    const sheet = wb.Sheets[sheetName];
    if (!sheet) throw new Error(`Sheet not found. Available: ${wb.SheetNames.join(', ')}`);

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: null });

    // 1) 找到包含 "S/T name" 的行与列
    const stRowIdx = rows.findIndex(r => Array.isArray(r) && r.some(v => String(v ?? '').trim() === 'S/T name'));
    if (stRowIdx === -1) throw new Error('Cannot locate "S/T name" row');
    const stNameIdx = rows[stRowIdx].findIndex(v => String(v ?? '').trim() === 'S/T name');

    // 2) 在更大的窗口里扫描“4位年份”，兼容合并单元格/两层表头
    //   扫描从第0行到 stRowIdx+10 行(防止年份散落到上一两行/下一两行)
    const scanTop = Math.min(rows.length, Math.max(stRowIdx + 10, 25));
    const years = [];
    const yearCols = [];

    const yearSet = new Set(
        Array.from({ length: 2021 - 2001 + 1 }, (_, i) => String(2001 + i))
    );

    // 遍历列
    const maxCols = Math.max(...rows.slice(0, scanTop).map(r => (Array.isArray(r) ? r.length : 0)));
    for (let c = stNameIdx + 1; c < maxCols; c++) {
        let foundYear = null;
        for (let r = 0; r < scanTop; r++) {
            const cell = rows[r]?.[c];
            const s = String(cell ?? '').trim();
            if (yearSet.has(s)) { foundYear = s; break; }
        }
        if (foundYear) {
            years.push(foundYear);
            yearCols.push(c);
        }
    }

    // 保留 2001..2021 并按数字排序避免顺序乱
    const filtered = years
        .map((y, i) => ({ y, c: yearCols[i] }))
        .filter(x => Number(x.y) >= 2001 && Number(x.y) <= 2021)
        .sort((a, b) => Number(a.y) - Number(b.y));

    if (!filtered.length) {
        throw new Error('No year columns detected around header rows');
    }

    const finalYears = filtered.map(x => x.y);
    const finalCols = filtered.map(x => x.c);

    // 3) 数据行：从 “S/T name” 行的下一行开始，直到空行
    const dataRows = rows.slice(stRowIdx + 1).filter(r => r && r[stNameIdx]);

    return {
        sheetName,
        years: finalYears,
        stNameIdx,
        yearCols: finalCols,
        dataRows
    };
}


function buildTrend(row, years, yearCols) {
    return years.map((y, i) => ({
        year: y,
        population: toNumber(row[yearCols[i]])
    }));
}

// 诊断
router.get('/diag', (req, res) => {
    try {
        const { rootTry, dataTry } = resolveFilePath();
        let wb; let usedPath;
        try { wb = XLSX.readFile(rootTry); usedPath = rootTry; }
        catch { wb = XLSX.readFile(dataTry); usedPath = dataTry; }
        const picked = pickSheet(wb);
        res.json({ usedPath, sheetNames: wb.SheetNames, pickedSheet: picked });
    } catch (e) {
        res.status(500).json({ error: String(e.message || e) });
    }
});

// /api/population/trend?region=Victoria
router.get('/trend', (req, res) => {
    try {
        const region = (req.query.region || 'Victoria').trim();
        const { sheetName, years, stNameIdx, yearCols, dataRows } = loadTable5();

        const row = dataRows.find(r => String(r[stNameIdx]).trim().toLowerCase() === region.toLowerCase());
        if (!row) return res.status(404).json({ error: `Region not found in "${sheetName}": ${region}` });

        const trend = buildTrend(row, years, yearCols);
        res.json({ region, sheet: sheetName, trend });
    } catch (err) {
        console.error('[population/trend] error:', err);
        res.status(500).json({ error: 'Failed to read Table 5' });
    }
});

module.exports = router;
