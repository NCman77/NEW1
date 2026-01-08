import express from 'express';
import rateLimit from 'express-rate-limit';

// 引入後端專用配置和算法
import { GAME_CONFIG } from '../game_config.js';
import { algoStat } from '../algo/algo_stat.js';
import { algoPattern } from '../algo/algo_pattern.js';
import { algoBalance } from '../algo/algo_balance.js';
import { algoAI } from '../algo/algo_ai.js';

const router = express.Router();

// 速率限制
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 分鐘
    max: parseInt(process.env.RATE_LIMIT_MAX) || 60, // 最多 60 次請求
    message: { error: '請求過於頻繁，請稍後再試' }
});

router.use(limiter);

// ==================== 核心預測 API ====================

/**
 * POST /api/predict
 * 執行預測算法
 */
router.post('/predict', async (req, res) => {
    try {
        const {
            game,
            school,
            mode,
            subMode,
            userData,
            historyData,
            excludeNumbers,
            setIndex = 0,
            seed
        } = req.body;

        // 輸入驗證
        if (!game || !school || !mode) {
            return res.status(400).json({
                error: '缺少必要參數',
                required: ['game', 'school', 'mode']
            });
        }

        // 取得遊戲定義
        const gameDef = GAME_CONFIG.GAMES[game];
        if (!gameDef) {
            return res.status(400).json({
                error: '無效的遊戲類型',
                game,
                available: Object.keys(GAME_CONFIG.GAMES)
            });
        }

        // 準備參數
        const params = {
            data: historyData || [],
            gameDef,
            subModeId: subMode,
            excludeNumbers: excludeNumbers || [],
            random: (mode === 'random'),
            mode: mode,
            setIndex: setIndex,
            packMode: mode.startsWith('pack') ? mode : null,
            targetCount: 5,
            seed: seed,
            userData: userData
        };

        let result;

        // 根據學派呼叫對應的算法
        switch (school) {
            case 'balance':
                result = algoBalance(params);
                break;
            case 'stat':
                result = algoStat(params);
                break;
            case 'pattern':
                result = algoPattern(params);
                break;
            case 'ai':
                result = algoAI(params);
                break;
            default:
                return res.status(400).json({
                    error: '不支援的學派',
                    school,
                    available: ['balance', 'stat', 'pattern', 'ai']
                });
        }

        // 如果是包牌模式且回傳陣列
        if (Array.isArray(result)) {
            return res.json({
                success: true,
                tickets: result,
                metadata: {
                    game,
                    school,
                    mode,
                    count: result.length,
                    timestamp: new Date().toISOString(),
                    version: '2.0.0'
                }
            });
        }

        // 單注模式
        res.json({
            success: true,
            ...result,
            metadata: {
                ...result.metadata,
                game,
                school,
                mode,
                timestamp: new Date().toISOString(),
                version: '2.0.0'
            }
        });

    } catch (error) {
        console.error('[API ERROR] /predict:', error);
        res.status(500).json({
            success: false,
            error: '預測執行失敗',
            message: process.env.NODE_ENV !== 'production' ? error.message : '伺服器錯誤'
        });
    }
});

/**
 * POST /api/pack
 * 執行包牌算法
 * 
 * Request Body: 同 /predict
 * 
 * Response:
 * {
 *   tickets: array,        // 包牌組合
 *   metadata: object,
 *   analysis: object?
 * }
 */
router.post('/pack', async (req, res) => {
    try {
        const { game, school, subMode, userData, historyData } = req.body;

        if (!game || !school) {
            return res.status(400).json({
                error: '缺少必要參數',
                required: ['game', 'school']
            });
        }

        // TODO: 整合包牌算法

        const result = {
            tickets: [],
            metadata: {
                game,
                school,
                mode: 'pack',
                subMode,
                timestamp: new Date().toISOString()
            },
            _status: 'mock_data'
        };

        res.json(result);

    } catch (error) {
        console.error('[API ERROR] /pack:', error);
        res.status(500).json({
            error: '包牌執行失敗',
            message: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
});

// ==================== 歷史資料 API ====================

/**
 * GET /api/history/:game
 * 取得歷史開獎資料
 */
router.get('/history/:game', (req, res) => {
    try {
        const { game } = req.params;
        const { limit = 100, year, month } = req.query;

        // TODO: 讀取歷史資料檔案
        // 目前回傳模擬資料

        res.json({
            game,
            data: [],
            count: 0,
            filters: { limit, year, month },
            _status: 'mock_data'
        });

    } catch (error) {
        console.error('[API ERROR] /history:', error);
        res.status(500).json({ error: '取得歷史資料失敗' });
    }
});

/**
 * GET /api/stats/:game
 * 取得統計資料（熱門號碼、冷門號碼等）
 */
router.get('/stats/:game', (req, res) => {
    try {
        const { game } = req.params;
        const { period = 30 } = req.query;

        // TODO: 計算統計資料

        res.json({
            game,
            period,
            hot: [],
            cold: [],
            _status: 'mock_data'
        });

    } catch (error) {
        console.error('[API ERROR] /stats:', error);
        res.status(500).json({ error: '取得統計資料失敗' });
    }
});

// ==================== 測試端點 ====================

/**
 * GET /api/test
 * API 測試端點
 */
router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API 運作正常',
        timestamp: new Date().toISOString(),
        endpoints: [
            'POST /api/predict',
            'POST /api/pack',
            'GET /api/history/:game',
            'GET /api/stats/:game'
        ]
    });
});

export default router;
