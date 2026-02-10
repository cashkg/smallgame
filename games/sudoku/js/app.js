/**
 * 數獨競技場 - 邏輯修正版
 */

// --- 核心判斷邏輯 (只要邏輯正確即過關) ---
function checkWin() {
    // 1. 檢查是否填滿
    if (gameState.board.flat().includes(0)) return;

    // 2. 檢查每一行、列、宮是否符合規範 (1-9不重複)
    for (let i = 0; i < 9; i++) {
        if (!isRegionValid(getRegion('row', i)) ||
            !isRegionValid(getRegion('col', i)) ||
            !isRegionValid(getRegion('block', i))) {
            return; // 有衝突，不判定過關
        }
    }

    // 3. 通過邏輯檢查，判定過關
    clearInterval(gameState.timerInterval);
    alert("恭喜！邏輯完全正確，挑戰成功！");
    showResult();
}

function isRegionValid(cells) {
    const nums = cells.filter(n => n !== 0);
    return new Set(nums).size === nums.length && nums.length === 9;
}

function getRegion(type, index) {
    let res = [];
    if (type === 'row') res = gameState.board[index];
    if (type === 'col') res = gameState.board.map(r => r[index]);
    if (type === 'block') {
        const rStart = Math.floor(index / 3) * 3;
        const cStart = (index % 3) * 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                res.push(gameState.board[rStart + r][cStart + c]);
            }
        }
    }
    return res;
}

// --- 點擊格子處理 ---
function selectCell(r, c) {
    gameState.selectedCell = { r, c };
    const selectedVal = gameState.board[r][c];

    // 清除所有高亮
    document.querySelectorAll('.cell').forEach(el => {
        el.classList.remove('selected', 'same-num');
    });

    // 1. 高亮選中格子
    const cellEl = document.getElementById(`cell-${r}-${c}`);
    cellEl.classList.add('selected');

    // 2. 高亮相同數字 (點數字時)
    if (selectedVal !== 0) {
        document.querySelectorAll('.cell').forEach(el => {
            if (el.innerText === selectedVal.toString()) {
                el.classList.add('same-num');
            }
        });
    }

    // 3. 更新鍵盤建議 (點空格時，只亮起合法的數字)
    updateKeyboardSuggestions(r, c);
}

function updateKeyboardSuggestions(r, c) {
    const btns = document.querySelectorAll('.numpad button');
    if (gameState.board[r][c] !== 0) {
        btns.forEach(b => b.style.boxShadow = "none");
        return;
    }

    const invalidNums = new Set([
        ...getRegion('row', r),
        ...getRegion('col', c),
        ...getRegion('block', Math.floor(r / 3) * 3 + Math.floor(c / 3))
    ]);

    btns.forEach((btn, i) => {
        const num = i + 1;
        if (!invalidNums.has(num)) {
            btn.style.boxShadow = "0 0 10px #4A90E2 inset"; // 合法數字發光
        } else {
            btn.style.boxShadow = "none";
        }
    });
}

// --- 難度選擇框修正 ---
function selectDifficulty(val) {
    gameState.difficulty = val;
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.includes(val.toString())) {
            btn.classList.add('active');
        }
    });
    updatePreview();
}
