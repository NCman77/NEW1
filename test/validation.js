/**
 * 前後端分離改造 - 自動化驗證腳本
 * 用途：驗證改造後的 API 輸出與原版本一致
 */

// 讀取測試資料
const fs = require('fs');
const path = require('path');

// 顏色輸出函式
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 載入測試資料
function loadTestData() {
    const dataPath = path.join(__dirname, 'test-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
}

// 驗證號碼範圍
function validateNumberRange(numbers, min, max, label) {
    const errors = [];
    
    if (!Array.isArray(numbers)) {
        errors.push(`${label}: 不是陣列`);
        return errors;
    }
    
    numbers.forEach((num, idx) => {
        if (typeof num !== 'number' || !Number.isInteger(num)) {
            errors.push(`${label}[${idx}]: ${num} 不是整數`);
        } else if (num < min || num > max) {
            errors.push(`${label}[${idx}]: ${num} 超出範圍 [${min}, ${max}]`);
        }
    });
    
    return errors;
}

// 驗證無重複號碼
function validateNoDuplicates(numbers, label) {
    const unique = new Set(numbers);
    if (unique.size !== numbers.length) {
        return [`${label}: 發現重複號碼`];
    }
    return [];
}

// 驗證輸出結構
function validateOutput(result, expected, testName) {
    const errors = [];
    
    log(`\n▶ 驗證測試案例: ${testName}`, 'cyan');
    
    // 基本結構檢查
    if (!result) {
        errors.push('結果為 null 或 undefined');
        return errors;
    }
    
    // 根據遊戲類型驗證
    if (expected.numbersCount) {
        // 單區遊戲（大樂透、今彩539）
        if (!result.numbers) {
            errors.push('缺少 numbers 欄位');
        } else {
            // 檢查號碼數量
            if (result.numbers.length !== expected.numbersCount) {
                errors.push(`號碼數量錯誤: 預期 ${expected.numbersCount}, 實際 ${result.numbers.length}`);
            }
            
            // 檢查號碼範圍
            const rangeErrors = validateNumberRange(
                result.numbers,
                expected.range.min,
                expected.range.max,
                '主號碼'
            );
            errors.push(...rangeErrors);
            
            // 檢查無重複
            const dupErrors = validateNoDuplicates(result.numbers, '主號碼');
            errors.push(...dupErrors);
        }
    }
    
    if (expected.mainNumbersCount) {
        // 雙區遊戲（威力彩）
        if (!result.numbers) {
            errors.push('缺少 numbers 欄位');
        } else {
            if (result.numbers.length !== expected.mainNumbersCount) {
                errors.push(`主號碼數量錯誤: 預期 ${expected.mainNumbersCount}, 實際 ${result.numbers.length}`);
            }
            
            const rangeErrors = validateNumberRange(
                result.numbers,
                expected.mainRange.min,
                expected.mainRange.max,
                '主號碼'
            );
            errors.push(...rangeErrors);
            
            const dupErrors = validateNoDuplicates(result.numbers, '主號碼');
            errors.push(...dupErrors);
        }
        
        if (!result.zone2) {
            errors.push('缺少 zone2 欄位');
        } else {
            if (!Array.isArray(result.zone2)) {
                errors.push('zone2 不是陣列');
            } else if (result.zone2.length !== expected.zone2NumbersCount) {
                errors.push(`第二區號碼數量錯誤: 預期 ${expected.zone2NumbersCount}, 實際 ${result.zone2.length}`);
            } else {
                const zone2Errors = validateNumberRange(
                    result.zone2,
                    expected.zone2Range.min,
                    expected.zone2Range.max,
                    '第二區號碼'
                );
                errors.push(...zone2Errors);
            }
        }
    }
    
    // 包牌模式驗證
    if (expected.hasTickets) {
        if (!result.tickets) {
            errors.push('缺少 tickets 欄位');
        } else {
            if (!Array.isArray(result.tickets)) {
                errors.push('tickets 不是陣列');
            } else if (result.tickets.length < expected.minTickets) {
                errors.push(`票數不足: 預期至少 ${expected.minTickets}, 實際 ${result.tickets.length}`);
            } else {
                // 驗證每張票的格式
                result.tickets.forEach((ticket, idx) => {
                    if (!ticket.numbers) {
                        errors.push(`tickets[${idx}]: 缺少 numbers 欄位`);
                    } else if (ticket.numbers.length !== expected.ticketFormat.numbersCount) {
                        errors.push(`tickets[${idx}]: 號碼數量錯誤 (${ticket.numbers.length})`);
                    }
                });
            }
        }
    }
    
    // Metadata 檢查
    if (expected.hasMetadata && !result.metadata) {
        errors.push('缺少 metadata 欄位');
    }
    
    return errors;
}

// 主要測試函式
async function runTests() {
    log('\n========================================', 'blue');
    log('  前後端分離改造 - 自動化驗證測試', 'blue');
    log('========================================\n', 'blue');
    
    const testData = loadTestData();
    log(`已載入 ${testData.testCases.length} 個測試案例\n`, 'cyan');
    
    let passedCount = 0;
    let failedCount = 0;
    const failedTests = [];
    
    // 注意：目前這個腳本只驗證輸出格式
    // 實際的算法執行需要在瀏覽器環境或整合後端後進行
    
    log('⚠️  階段性說明:', 'yellow');
    log('此腳本目前用於：', 'yellow');
    log('  1. 驗證測試資料格式正確', 'yellow');
    log('  2. 提供驗證邏輯範本', 'yellow');
    log('  3. 後續會整合實際的 API 呼叫\n', 'yellow');
    
    // 驗證測試資料格式
    testData.testCases.forEach((testCase, idx) => {
        const required = ['name', 'game', 'school', 'mode', 'expectedOutput'];
        const missing = required.filter(field => !testCase[field]);
        
        if (missing.length > 0) {
            log(`✗ 測試案例 ${idx + 1}: ${testCase.name || '未命名'}`, 'red');
            log(`  缺少必要欄位: ${missing.join(', ')}`, 'red');
            failedCount++;
            failedTests.push(testCase.name || `案例 ${idx + 1}`);
        } else {
            log(`✓ 測試案例 ${idx + 1}: ${testCase.name}`, 'green');
            passedCount++;
        }
    });
    
    // 總結
    log('\n========================================', 'blue');
    log('測試結果總結', 'blue');
    log('========================================', 'blue');
    log(`通過: ${passedCount}`, 'green');
    log(`失敗: ${failedCount}`, failedCount > 0 ? 'red' : 'green');
    
    if (failedTests.length > 0) {
        log('\n失敗的測試:', 'red');
        failedTests.forEach(name => log(`  - ${name}`, 'red'));
    }
    
    log('\n');
    
    return failedCount === 0;
}

// 匯出驗證函式（供其他模組使用）
module.exports = {
    validateOutput,
    validateNumberRange,
    validateNoDuplicates,
    runTests
};

// 如果直接執行此腳本
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}
