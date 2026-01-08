/**
 * game_config.js - 後端專用（ES Module）
 * 簡化版：只包含算法需要的基本參數
 * 不包含 UI 文字、規則說明等前端專用內容
 */

export const GAME_CONFIG = {
    GAMES: {
        '大樂透': {
            type: 'lotto',
            range: 49,
            count: 6,
            special: true,
            drawDays: [2, 5]
        },
        '威力彩': {
            type: 'power',
            range: 38,
            count: 6,
            zone2: 8,
            drawDays: [1, 4]
        },
        '今彩539': {
            type: 'lotto',
            range: 39,
            count: 5,
            special: false,
            drawDays: [1, 2, 3, 4, 5, 6]
        },
        '3星彩': {
            type: 'digit',
            range: 9,
            count: 3,
            drawDays: [1, 2, 3, 4, 5, 6],
            subModes: null
        },
        '4星彩': {
            type: 'digit',
            range: 9,
            count: 4,
            drawDays: [1, 2, 3, 4, 5, 6],
            subModes: null
        }
    }
};

