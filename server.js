require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS 设置（确保允许前端端口）
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

// 解析 JSON 请求体
app.use(express.json());

// 路由注册
app.use('/api/population', require('./routes/population'));
app.use('/api/auth', require(path.join(__dirname, 'routes', 'auth')));
app.use('/api/parking', require(path.join(__dirname, 'routes', 'parking')));
app.get('/health', (req, res) => res.status(200).json({ ok: true }));


// 404 处理
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// MongoDB 连接与启动服务
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log(' MongoDB connected');
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error(' MongoDB connection failed:', err);
        // 即使 MongoDB 连接失败，也照常启动后端服务
        app.listen(PORT, () => {
            console.log(`  Server running (no DB) on http://localhost:${PORT}`);
        });
    });
