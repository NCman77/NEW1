/**
 * 台彩全能分析儀 - 後端 API 伺服器
 * V2.0 前後端分離架構
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';

// ES Module 中取得當前目錄
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中介層設定 ====================

// 安全性增強
app.use(helmet({
    contentSecurityPolicy: false, // 前端有內嵌 script，需要關閉或調整
}));

// CORS 設定
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// 回應壓縮
app.use(compression());

// 解析 JSON 請求body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 請求日誌（簡易版）
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// ==================== 靜態檔案服務 ====================
// 伺服前端檔案（public 資料夾）
app.use(express.static(path.join(__dirname, '../public')));

// ==================== API 路由 ====================
app.use('/api', apiRoutes);

// ==================== 健康檢查端點 ====================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.0.0'
    });
});

// ==================== 404 處理 ====================
app.use((req, res, next) => {
    // 如果是 API 請求，回傳 JSON 錯誤
    if (req.path.startsWith('/api')) {
        res.status(404).json({
            error: 'API endpoint not found',
            path: req.path
        });
    } else {
        // 其他請求回傳前端首頁（SPA 路由支援）
        res.sendFile(path.join(__dirname, '../public/index.html'));
    }
});

// ==================== 錯誤處理 ====================
app.use((err, req, res, next) => {
    console.error('[ERROR]', err);

    // 不暴露內部錯誤細節
    const isDev = process.env.NODE_ENV !== 'production';

    res.status(err.status || 500).json({
        error: isDev ? err.message : 'Internal server error',
        ...(isDev && { stack: err.stack })
    });
});

// ==================== 啟動伺服器 ====================
app.listen(PORT, () => {
    console.log('========================================');
    console.log('  台彩全能分析儀 API 伺服器');
    console.log('========================================');
    console.log(`🚀 伺服器啟動於: http://localhost:${PORT}`);
    console.log(`📝 環境模式: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS 來源: ${corsOptions.origin}`);
    console.log('========================================\n');
});

// 優雅關閉
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信號，正在關閉伺服器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n收到 SIGINT 信號，正在關閉伺服器...');
    process.exit(0);
});
