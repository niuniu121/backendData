require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- CORS（支持本地 + Cloudflare Pages） ---------------- */
const LOCAL_ORIGIN = process.env.LOCAL_ORIGIN || 'http://localhost:5173';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || ''; // 例如 https://parkingarea-8ay.pages.dev

const ALLOW_ORIGINS = [LOCAL_ORIGIN, CLIENT_ORIGIN].filter(Boolean);

app.use(
    cors({
        origin: (origin, cb) => {
            // 无 origin（如 curl/健康检查）直接放行；其余必须在白名单里
            if (!origin || ALLOW_ORIGINS.includes(origin)) return cb(null, true);
            return cb(new Error(`CORS blocked: ${origin}`));
        },
        credentials: true,
    })
);


/* ---------------- 常规中间件 ---------------- */
app.use(express.json());

/* ---------------- 路由注册 ---------------- */
app.use('/api/population', require('./routes/population'));
app.use('/api/auth', require(path.join(__dirname, 'routes', 'auth')));
app.use('/api/parking', require(path.join(__dirname, 'routes', 'parking')));

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

/* ---------------- 404 ---------------- */
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

/* ---------------- 全局错误处理 ---------------- */
app.use((err, req, res, _next) => {
    console.error('Unhandled Error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error' });
});

/* ---------------- 启动服务（带可选的 Mongo 连接） ---------------- */
const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

const uri = process.env.MONGO_URI;
if (!uri) {
    console.warn('MONGO_URI not set, starting server without DB…');
    startServer();
} else {
    mongoose
        .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('MongoDB connected');
            startServer();
        })
        .catch((err) => {
            console.error('MongoDB connection failed:', err?.message || err);
            console.warn('Starting server without DB…');
            startServer();
        });
}
