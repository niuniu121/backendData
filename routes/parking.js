// routes/parking.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// 远程 sensors 数据
router.get('/sensors', async (req, res) => {
    try {
        const url = "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/records?limit=100";
        const response = await axios.get(url);
        res.json(response.data.results); // 只返回前100条
    } catch (error) {
        console.error("Error fetching sensors:", error.message);
        res.status(500).json({ error: "Failed to fetch sensor data" });
    }
});

// 远程 bays 数据
router.get('/bays', async (req, res) => {
    try {
        const url = "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bays/records?limit=100";
        const response = await axios.get(url);
        res.json(response.data.results); // 只返回前100条
    } catch (error) {
        console.error("Error fetching bays:", error.message);
        res.status(500).json({ error: "Failed to fetch bays data" });
    }
});

// 添加段数据接口
router.get('/segments', async (req, res) => {
    try {
        const url = "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/parking-zones-linked-to-street-segments/records?limit=100";
        const response = await axios.get(url);
        res.json(response.data.results); // 返回前100条
    } catch (error) {
        console.error("Error fetching street segments:", error.message);
        res.status(500).json({ error: "Failed to fetch street segment data" });
    }
});

module.exports = router;
