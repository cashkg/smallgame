/**
 * SudokuEngine - 數獨競技場核心引擎
 */
class SudokuEngine {
    constructor() {
        this.base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    }

    // --- 1. 種子碼封裝與解析 ---
    generateGameCode(boardSeed, difficulty, holeSeed) {
        let code = 0n;
        code |= BigInt(boardSeed) << 55n;
        code |= BigInt(difficulty) << 48n;
        code |= BigInt(holeSeed) << 16n;
        const checksum = (boardSeed + difficulty + holeSeed) % 65535;
        code |= BigInt(checksum);
        return this.toBase64(code);
    }

    parseGameCode(base64Str) {
        try {
            const bigIntVal = this.fromBase64(base64Str);
            const checksum = Number(bigIntVal & 0xFFFFn);
            const holeSeed = Number((bigIntVal >> 16n) & 0xFFFFFFFFn);
            const difficulty = Number((bigIntVal >> 48n) & 0x7Fn);
            const boardSeed = Number(bigIntVal >> 55n);
            const calcChecksum = (boardSeed + difficulty + holeSeed) % 65535;
            if (checksum !== calcChecksum) return null;
            return { boardSeed, difficulty, holeSeed };
        } catch (e) { return null; }
    }

    toBase64(bigInt) {
        let str = "";
        while (bigInt > 0n) {
            str = this.base64Chars[Number(bigInt % 64n)] + str;
            bigInt /= 64n;
        }
        return str || "0";
    }

    fromBase64(str) {
        let val = 0n;
        for (let i = 0; i < str.length; i++) {
            val = val * 64n + BigInt(this.base64Chars.indexOf(str[i]));
        }
        return val;
    }

    // --- 2. 隨機數生成器 ---
    pseudoRandom(seed) {
        let s = seed;
        return () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    // --- 3. 盤面生成 ---
    generateBoard(boardSeed) {
        const rand = this.pseudoRandom(boardSeed);
        let board = [];
        const baseRow = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const shift = [0, 3, 6, 1, 4, 7, 2, 5, 8];
        for(let r=0; r<9; r++) {
            let row = [];
            for(let c=0; c<9; c++) row.push(baseRow[(c + shift[r]) % 9]);
            board.push(row);
        }
        const map = [1,2,3,4,5,6,7,8,9].sort(() => rand() - 0.5);
        for(let r=0; r<9; r++) for(let c=0; c<9; c++) board[r][c] = map[board[r][c]-1];
        for(let b=0; b<3; b++) {
            const start = b * 3;
            const rows = [0,1,2].sort(() => rand() - 0.5); 
            const tempBlock = [board[start], board[start+1], board[start+2]];
            board[start] = tempBlock[rows[0]];
            board[start+1] = tempBlock[rows[1]];
            board[start+2] = tempBlock[rows[2]];
        }
        board = this.transpose(board);
        for(let b=0; b<3; b++) { 
            const start = b * 3;
            const cols = [0,1,2].sort(() => rand() - 0.5);
            const tempBlock = [board[start], board[start+1], board[start+2]];
            board[start] = tempBlock[cols[0]];
            board[start+1] = tempBlock[cols[1]];
            board[start+2] = tempBlock[cols[2]];
        }
        return this.transpose(board);
    }

    // 取得指定宮(Block)內的數字量
    getBlockCount(board, r, c) {
        let count = 0;
        const rStart = Math.floor(r / 3) * 3;
        const cStart = Math.floor(c / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[rStart + i][cStart + j] !== 0) count++;
            }
        }
        return count;
    }

    generatePuzzle(fullBoard, holeCount, holeSeed) {
        const rand = this.pseudoRandom(holeSeed);
        let puzzle = JSON.parse(JSON.stringify(fullBoard));
        let attempts = holeCount;
        let positions = [];
        for(let r=0; r<9; r++) for(let c=0; c<9; c++) positions.push({r,c});
        positions.sort(() => rand() - 0.5);

        for (let i = 0; i < positions.length; i++) {
            if (attempts <= 0) break;
            let {r, c} = positions[i];
            // 保底機制：若該宮只剩 2 個數字，就不再挖空
            if (this.getBlockCount(puzzle, r, c) > 2) {
                puzzle[r][c] = 0;
                attempts--;
            }
        }
        return puzzle;
    }

    transpose(matrix) {
        return matrix[0].map((col, i) => matrix.map(row => row[i]));
    }
}