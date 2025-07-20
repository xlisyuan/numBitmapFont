const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const imgLoader = document.getElementById("imgLoader");
const charTable = document.getElementById("charTable");
const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");
const mousePos = document.getElementById("mousePos");
const charSettingsInput = document.getElementById("charSettingsInput");
const charSettingsOutput = document.getElementById("charSettingsOutput");
// const yOffsetInput = document.getElementById("yOffset"); // 移除 yOffset 相關引用
// const fontSizeInput = document.getElementById("fontSize"); // 移除 fontSize 相關引用

// 新增縮放相關 DOM 元素
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomLevelDisplay = document.getElementById("zoomLevelDisplay");

const chars = [];
let selectedCharIndex = -1;
let image = new Image();

// 新增一個全域變數來儲存顯示的縮放比例
let displayScaleFactor = 1;

// 定義縮放步長和限制
const ZOOM_STEP_FACTOR = 1.1; // 每次縮放 10%
const MIN_ZOOM = 0.1; // 最小縮放比例 10%
const MAX_ZOOM = 5.0; // 最大縮放比例 500%

// 更新 canvas 顯示及內容的統一函數
function updateCanvasDisplay() {
    if (!image.src) return; // 如果沒有圖片，則不執行

    // 設定 canvas 的顯示寬度與高度（乘以縮放比例）
    canvas.width = image.width * displayScaleFactor;
    canvas.height = image.height * displayScaleFactor;

    // 清除並重新繪製 canvas 內容
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 繪製圖片，並指定繪製尺寸為 canvas 的實際尺寸
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    drawRulers();
    drawAllBoxes(); // 繪製字元框時會用到 displayScaleFactor
}

// 更新縮放比例顯示文字
function updateZoomLevelDisplay() {
    zoomLevelDisplay.innerText = `縮放: ${Math.round(displayScaleFactor * 100)}%`;
}

imgLoader.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (ev) {
    image.src = ev.target.result;
    image.onload = () => {
      // 圖片載入時，根據視窗大小進行初始縮放，讓圖片能大致顯示在螢幕上
      // 這裡可以定義一個初始的最大顯示寬高，或者使用視窗的可用空間
      const initialMaxDisplayWidth = window.innerWidth * 0.9; // 例如，視窗寬度的 90%
      const initialMaxDisplayHeight = window.innerHeight * 0.7; // 例如，視窗高度的 70%

      displayScaleFactor = 1; // 預設縮放為 100%

      if (image.width > initialMaxDisplayWidth || image.height > initialMaxDisplayHeight) {
          const scaleX = initialMaxDisplayWidth / image.width;
          const scaleY = initialMaxDisplayHeight / image.height;
          displayScaleFactor = Math.min(scaleX, scaleY); // 取較小的比例以確保圖片完全顯示
      }

      updateCanvasDisplay(); // 更新畫面
      updateZoomLevelDisplay(); // 更新縮放比例顯示
      updateCharSettingsOutput(); // 圖片載入後也更新一次輸出

      // 調整預覽畫布的寬度，讓它能容納預覽文字。高度可以固定或也隨之調整。
      previewCanvas.width = Math.max(800, image.width * displayScaleFactor); // 預覽畫布也根據縮放比例調整
    };
  };
  reader.readAsDataURL(file);
});

canvas.addEventListener("mousemove", (e) => {
  if (!image.src) return; // 無圖片時不更新座標
  const rect = canvas.getBoundingClientRect();
  // 將滑鼠在 canvas 上的顯示座標，轉換回原始圖片的座標
  const x = Math.floor((e.clientX - rect.left) / displayScaleFactor);
  const y = Math.floor((e.clientY - rect.top) / displayScaleFactor);
  mousePos.innerText = `座標: (${x}, ${y})`;

  // 當滑鼠移動時，如果輸入框是空的，可以自動填入原始座標
  if (document.getElementById("x").value === "" || document.getElementById("y").value === "") {
    document.getElementById("x").value = x;
    document.getElementById("y").value = y;
  }
});

// 縮放按鈕事件監聽器
zoomInBtn.addEventListener("click", () => {
    if (!image.src) return; // 無圖片時不縮放
    displayScaleFactor *= ZOOM_STEP_FACTOR;
    if (displayScaleFactor > MAX_ZOOM) displayScaleFactor = MAX_ZOOM;
    updateCanvasDisplay();
    updateZoomLevelDisplay();
});

zoomOutBtn.addEventListener("click", () => {
    if (!image.src) return; // 無圖片時不縮放
    displayScaleFactor /= ZOOM_STEP_FACTOR;
    if (displayScaleFactor < MIN_ZOOM) displayScaleFactor = MIN_ZOOM;
    updateCanvasDisplay();
    updateZoomLevelDisplay();
});


function drawRulers() {
  ctx.save();
  ctx.strokeStyle = "#ddd";
  ctx.fillStyle = "#aaa";
  ctx.lineWidth = 1;
  ctx.font = "10px sans-serif";

  // 根據縮放比例繪製尺標
  for (let i = 0; i < image.width; i += 50) { // 這裡仍以原始圖片的 50px 為單位
    ctx.beginPath();
    ctx.moveTo(i * displayScaleFactor, 0); // 轉換為顯示座標
    ctx.lineTo(i * displayScaleFactor, 5);
    ctx.stroke();
    ctx.fillText(i, i * displayScaleFactor + 2, 12); // 顯示原始座標值
  }

  for (let j = 0; j < image.height; j += 50) { // 這裡仍以原始圖片的 50px 為單位
    ctx.beginPath();
    ctx.moveTo(0, j * displayScaleFactor); // 轉換為顯示座標
    ctx.lineTo(5, j * displayScaleFactor);
    ctx.stroke();
    ctx.fillText(j, 6, j * displayScaleFactor + 10); // 顯示原始座標值
  }
  ctx.restore();
}

function drawAllBoxes() {
  for (let c of chars) {
    ctx.strokeStyle = "red";
    // 繪製字元框時，將原始座標和尺寸乘以縮放比例
    ctx.strokeRect(c.x * displayScaleFactor, c.y * displayScaleFactor, c.w * displayScaleFactor, c.h * displayScaleFactor);
  }
}

function refreshCharTable() {
  const rows = charTable.querySelectorAll("tr");
  for (let i = rows.length - 1; i > 0; i--) rows[i].remove();

  chars.forEach((c, index) => {
    // 移除 yOffset 的顯示列
    const row = document.createElement("tr");
    row.innerHTML = `<td>${c.char}</td><td>${c.x}</td><td>${c.y}</td><td>${c.w}</td><td>${c.h}</td>`;
    row.style.cursor = "pointer";
    row.addEventListener("click", () => {
      document.getElementById("charId").value = c.char;
      document.getElementById("x").value = c.x;
      document.getElementById("y").value = c.y;
      document.getElementById("w").value = c.w;
      document.getElementById("h").value = c.h;
      // yOffsetInput.value = c.yOffset || 0; // 移除 yOffset 相關
      selectedCharIndex = index;
    });
    charTable.appendChild(row);
  });
  updateCharSettingsOutput(); // 每次表格更新時，也更新輸出框
}

function updateCharSettingsOutput() {
    // 移除 yOffset 輸出
    const outputLines = chars.map(c => `${c.char},${c.x},${c.y},${c.w},${c.h}`);
    charSettingsOutput.value = outputLines.join('\n');
}

document.getElementById("previewChar").addEventListener("click", () => {
  const x = parseInt(document.getElementById("x").value);
  const y = parseInt(document.getElementById("y").value);
  const w = parseInt(document.getElementById("w").value);
  const h = parseInt(document.getElementById("h").value);
  // const yOffset = parseInt(yOffsetInput.value); // 移除 yOffset 相關

  if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) return; // 移除 yOffset 檢查

  // 預覽單個字元時，重新繪製整個 canvas 以顯示新框選
  updateCanvasDisplay();
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  // 預覽單個字元框時，也將其繪製尺寸乘以縮放比例
  ctx.strokeRect(x * displayScaleFactor, y * displayScaleFactor, w * displayScaleFactor, h * displayScaleFactor);
});

document.getElementById("addChar").addEventListener("click", () => {
  const char = document.getElementById("charId").value;
  const x = parseInt(document.getElementById("x").value);
  const y = parseInt(document.getElementById("y").value);
  const w = parseInt(document.getElementById("w").value);
  const h = parseInt(document.getElementById("h").value);
  // const yOffset = parseInt(yOffsetInput.value); // 移除 yOffset 相關

  if (!char || isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) { // 移除 yOffset 檢查
    alert("請填寫完整的字元資訊 (char, x, y, w, h)。");
    return;
  }

  // 移除 yOffset 屬性
  const newCharData = { char, x, y, w, h };

  // 檢查是否已有相同字元（依 char 比對）
  const existingIndex = chars.findIndex(c => c.char === char);

  if (existingIndex !== -1) {
    chars[existingIndex] = newCharData; // 直接取代
  } else if (selectedCharIndex >= 0 && chars[selectedCharIndex] && chars[selectedCharIndex].char === char) {
    chars[selectedCharIndex] = newCharData;
  } else {
    chars.push(newCharData); // 加入新字元
    selectedCharIndex = chars.length - 1; // 新增後選中新加入的
  }

  updateCanvasDisplay(); // 更新畫面
  refreshCharTable();
});

document.getElementById("deleteChar").addEventListener("click", () => {
  if (selectedCharIndex >= 0) {
    chars.splice(selectedCharIndex, 1);
    selectedCharIndex = -1;
    document.getElementById("charId").value = ""; // 刪除後清空輸入框
    document.getElementById("x").value = "";
    document.getElementById("y").value = "";
    document.getElementById("w").value = "";
    document.getElementById("h").value = "";
    // yOffsetInput.value = ""; // 移除 yOffset 相關
    updateCanvasDisplay(); // 更新畫面
    refreshCharTable();
  } else {
      alert("請先從表格中選取要刪除的字元。");
  }
});

document.getElementById("importChars").addEventListener("click", () => {
    const input = charSettingsInput.value.trim();
    if (!input) {
        alert("請在批量字元設定框中貼入要匯入的資料。");
        return;
    }

    const lines = input.split('\n');
    let importedCount = 0;
    let updatedCount = 0;

    lines.forEach(line => {
        const parts = line.split(',');
        // 變為 5 個部分 (char, x, y, w, h)
        if (parts.length === 5) {
            const char = parts[0].trim();
            const x = parseInt(parts[1].trim());
            const y = parseInt(parts[2].trim());
            const w = parseInt(parts[3].trim());
            const h = parseInt(parts[4].trim());
            // const yOffset = parseInt(parts[5].trim()); // 移除 yOffset 相關

            if (char && !isNaN(x) && !isNaN(y) && !isNaN(w) && !isNaN(h)) { // 移除 yOffset 檢查
                // 移除 yOffset 屬性
                const newCharData = { char, x, y, w, h };

                const existingIndex = chars.findIndex(c => c.char === char);
                if (existingIndex !== -1) {
                    chars[existingIndex] = newCharData;
                    updatedCount++;
                } else {
                    chars.push(newCharData);
                    importedCount++;
                }
            }
        }
    });

    if (importedCount > 0 || updatedCount > 0) {
        alert(`已匯入 ${importedCount} 個新字元，更新 ${updatedCount} 個現有字元。`);
        updateCanvasDisplay(); // 更新畫面
        refreshCharTable();
    } else {
        alert("沒有有效的字元資料被匯入或更新。請確認格式是否為 'Char,X,Y,W,H'。"); // 移除 yOffset 提示
    }
});


document.getElementById("exportFNT").addEventListener("click", () => {
  const lineHeight = parseInt(document.getElementById("lineHeight").value);
  const fileName = document.getElementById("fileName").value; // 修正為 string
  // 匯出 FNT 檔時，scaleW 和 scaleH 應該是原始圖片的尺寸 (image.width, image.height)
  // 而不是 canvas.width / canvas.height (因為 canvas 尺寸會隨縮放改變)
  const scaleW = image.width;
  const scaleH = image.height;

  const lines = [
    // fontSize 現在與 lineHeight 相同
    `info face="BitmapFont" size=${lineHeight} bold=0 italic=0 charset="" unicode=1 stretchH=100 smooth=1 aa=1 padding=0,0,0,0 spacing=1,1`,
    `common lineHeight=${lineHeight} base=${lineHeight} scaleW=${scaleW} scaleH=${scaleH} pages=1 packed=0`,
    `page id=0 file="${fileName}.png"`,
    `chars count=${chars.length}`
  ];

  for (let c of chars) {
    const id = c.char.charCodeAt(0);
    // 移除 yOffset
    lines.push(`char id=${id} x=${c.x} y=${c.y} width=${c.w} height=${c.h} xoffset=0 yoffset=0 xadvance=${c.w} page=0 chnl=0`);
  }

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName}.fnt`;
  a.click();
});

document.getElementById("previewBtn").addEventListener("click", () => {
  const text = document.getElementById("previewText").value;
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  let x = 10, y = 50;
  // 預覽文字也使用 lineHeight
  const lineHeight = parseInt(document.getElementById("lineHeight").value);

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const data = chars.find(c => c.char === ch);
    if (!data) continue;
    previewCtx.drawImage(
      image,
      data.x, data.y, data.w, data.h,
      x, y, data.w, data.h // 移除 yOffset 相關
    );
    x += data.w; // 這裡簡單地使用 width 作為 xadvance
  }
});

// 初始化時呼叫一次，確保輸出框內容正確和縮放顯示
refreshCharTable();
updateZoomLevelDisplay(); // 確保一開始顯示正確的縮放比例