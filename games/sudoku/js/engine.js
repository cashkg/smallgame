/**
 * SudokuEngine - 數獨競技場核心引擎
 * 負責：128-bit 種子封裝、Base64 編碼/解碼、盤面生成、唯一解挖空
 */
class SudokuEngine {
    constructor() {
        this.base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    }

    // --- 1. 種子碼封裝與解析 (128-bit Logic) ---

    // 將各項參數封裝成一個 Base64 字串
    generateGameCode(boardSeed, difficulty, holeSeed) {
        // 使用 BigInt 處理 128 位元
        // 結構分配:
        // [BoardSeed (73 bits)] + [Difficulty (7 bits)] + [HoleSeed (32 bits)] + [Checksum (16 bits)]
        
        let code = 0n;
        code |= BigInt(boardSeed) << 55n; // 預留空間給後面的參數
        code |= BigInt(difficulty) << 48n;
        code |= BigInt(holeSeed) << 16n;
        
        // 簡易 Checksum (防止手改)
        const checksum = (boardSeed + difficulty + holeSeed) % 65535;
        code |= BigInt(checksum);

        return this.toBase64(code);
    }

    // 解析 Base64 字串回參數
    parseGameCode(base64Str) {
        try {
            const bigIntVal = this.fromBase64(base64Str);
            
            const checksum = Number(bigIntVal & 0xFFFFn);
            const holeSeed = Number((bigIntVal >> 16n) & 0xFFFFFFFFn);
            const difficulty = Number((bigIntVal >> 48n) & 0x7Fn);
            const boardSeed = Number(bigIntVal >> 55n);

            // 驗證 Checksum
            const calcChecksum = (boardSeed + difficulty + holeSeed) % 65535;
            if (checksum !== calcChecksum) {
                console.warn("Checksum mismatch! Code might be tampered.");
                return null;
            }

            return { boardSeed, difficulty, holeSeed };
        } catch (e) {
            console.error("Invalid Code", e);
            return null;
        }
    }

    // BigInt 轉 Base64
    toBase64(bigInt) {
        let str = "";
        while (bigInt > 0n) {
            str = this.base64Chars[Number(bigInt % 64n)] + str;
            bigInt /= 64n;
        }
        return str || "0";
    }

    // Base64 轉 BigInt
    fromBase64(str) {
        let val = 0n;
        for (let i = 0; i < str.length; i++) {
            val = val * 64n + BigInt(this.base64Chars.indexOf(str[i]));
        }
        return val;
    }

    // --- 2. 隨機數生成器 (PRNG) ---
    // 確保同一組種子在任何手機上跑出來的亂數序都一樣
    pseudoRandom(seed) {
        let s = seed;
        return () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    // --- 3. 盤面生成 (Core Algo) ---
    
    generateBoard(boardSeed) {
        const rand = this.pseudoRandom(boardSeed);
        
        // 3-1. 建立基礎盤 (Canonical Base)
        let board = [];
        const baseRow = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // 透過位移產生基礎合法數獨
        const shift = [0, 3, 6, 1, 4, 7, 2, 5, 8];
        
        for(let r=0; r<9; r++) {
            let row = [];
            for(let c=0; c<9; c++) {
                row.push(baseRow[(c + shift[r]) % 9]);
            }
            board.push(row);
        }

        // 3-2. 洗牌 (Shuffling) - 保持數獨合法性
        // A. 數字對調 (Mapping 1-9)
        const map = [1,2,3,4,5,6,7,8,9].sort(() => rand() - 0.5);
        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                board[r][c] = map[board[r][c]-1];
            }
        }

        // B. 行交換 (Rows within block)
        for(let b=0; b<3; b++) { // 每一個大橫區塊
            const start = b * 3;
            // 該區塊內的 3 行隨機互換
            const rows = [0,1,2].sort(() => rand() - 0.5); 
            const tempBlock = [board[start], board[start+1], board[start+2]];
            board[start] = tempBlock[rows[0]];
            board[start+1] = tempBlock[rows[1]];
            board[start+2] = tempBlock[rows[2]];
        }
        
        // C. 列交換 (Columns within block) - 轉置矩陣做行交換再轉回來即可
        board = this.transpose(board);
        for(let b=0; b<3; b++) { 
            const start = b * 3;
            const cols = [0,1,2].sort(() => rand() - 0.5);
            const tempBlock = [board[start], board[start+1], board[start+2]];
            board[start] = tempBlock[cols[0]];
            board[start+1] = tempBlock[cols[1]];
            board[start+2] = tempBlock[cols[2]];
        }
        board = this.transpose(board);

        return board;
    }

    // 產生挖空後的題目
    generatePuzzle(fullBoard, holeCount, holeSeed) {
        const rand = this.pseudoRandom(holeSeed);
        
        // 複製一份
        let puzzle = JSON.parse(JSON.stringify(fullBoard));
        let attempts = holeCount;
        
        // 產生所有格子的座標並亂序
        let positions = [];
        for(let r=0; r<9; r++) for(let c=0; c<9; c++) positions.push({r,c});
        positions.sort(() => rand() - 0.5);

        // 依序挖洞
        for (let i = 0; i < positions.length; i++) {
            if (attempts <= 0) break;
            
            let {r, c} = positions[i];
            let backup = puzzle[r][c];
            puzzle[r][c] = 0; // 挖空
            
            // TODO: 在這裡加入「唯一解檢查」(Solver Check)
            // 為了效能演示，這裡暫時假設挖空，實際專案要加上 Solver 檢查
            // 如果導致多解，則還原 puzzle[r][c] = backup;
            
            attempts--;
        }
        
        return puzzle;
    }

    transpose(matrix) {
        return matrix[0].map((col, i) => matrix.map(row => row[i]));
    }
}
