const ANIMAL_TYPES = [ // 建立至少十二種不依賴外部圖片的動物資料
  { key: "cat", name: "貓", color: "#f4a261" }, // 定義貓的資料
  { key: "dog", name: "狗", color: "#b08968" }, // 定義狗的資料
  { key: "rabbit", name: "兔子", color: "#f2c6de" }, // 定義兔子的資料
  { key: "elephant", name: "大象", color: "#9aa6b2" }, // 定義大象的資料
  { key: "lion", name: "獅子", color: "#e9c46a" }, // 定義獅子的資料
  { key: "panda", name: "熊貓", color: "#dfe7e8" }, // 定義熊貓的資料
  { key: "penguin", name: "企鵝", color: "#bde0fe" }, // 定義企鵝的資料
  { key: "giraffe", name: "長頸鹿", color: "#f6d365" }, // 定義長頸鹿的資料
  { key: "fox", name: "狐狸", color: "#f28c28" }, // 定義狐狸的資料
  { key: "frog", name: "青蛙", color: "#90be6d" }, // 定義青蛙的資料
  { key: "monkey", name: "猴子", color: "#a98467" }, // 定義猴子的資料
  { key: "tiger", name: "老虎", color: "#f4a261" } // 定義老虎的資料
]; // 完成動物資料表
const UI = { ink: "#18324a", navy: "#102a43", blue: "#1769aa", green: "#a7c957", red: "#e63946", gold: "#ffca3a", white: "#ffffff" }; // 集中管理介面色彩
const INSTRUCTION = "玩法：按住下方動物名稱，拖到上方對應插圖下方的格子；拖到已有名稱的格子會互換，也可以拖回下方。未按按鈕前不顯示對錯。"; // 設定完整玩法說明
const SCENE_TIME = 7200; // 設定自然背景場景的停留時間
const TRANSITION_TIME = 1900; // 設定自然背景的平滑漸變時間
const SCENE_NAMES = ["forest", "grassland", "snowfield", "desert", "rainforest", "coast"]; // 定義六種動物主題自然場景
let quiz = null; // 儲存目前測驗狀態
let layoutData = null; // 儲存響應式版面資料
let dragging = null; // 儲存目前被拖曳的名稱
let beganAt = 0; // 儲存本回合開始時間
let confetti = []; // 儲存高分彩帶粒子
let currentScene = 0; // 儲存目前自然場景索引
let nextScene = 1; // 儲存下一個自然場景索引
let sceneBlend = 0; // 儲存場景交叉淡化進度
let sceneStartedAt = 0; // 儲存目前場景開始時間

function setup() { // 初始化畫布、頁面樣式與測驗資料
  document.documentElement.style.margin = "0"; // 移除 html 預設外距
  document.documentElement.style.padding = "0"; // 移除 html 預設內距
  document.documentElement.style.overflow = "hidden"; // 防止 html 產生捲軸
  document.body.style.margin = "0"; // 移除 body 預設外距
  document.body.style.padding = "0"; // 移除 body 預設內距
  document.body.style.overflow = "hidden"; // 防止 body 產生捲軸
  document.body.style.width = "100vw"; // 讓 body 寬度貼齊視窗
  document.body.style.height = "100vh"; // 讓 body 高度貼齊視窗
  pixelDensity(Math.min(2, window.devicePixelRatio || 1)); // 設定清晰且不過度耗能的像素密度
  const canvasElement = createCanvas(windowWidth, windowHeight); // 建立滿版 p5.js Canvas
  canvasElement.position(0, 0); // 將畫布貼齊視窗左上角
  canvasElement.style("display", "block"); // 移除畫布行內空白
  canvasElement.style("position", "fixed"); // 讓畫布固定在視窗內
  canvasElement.style("left", "0px"); // 設定畫布左側位置
  canvasElement.style("top", "0px"); // 設定畫布頂端位置
  canvasElement.style("z-index", "0"); // 將畫布置於最底層
  canvasElement.style("touch-action", "none"); // 防止手機瀏覽器攔截拖曳手勢
  canvasElement.elt.setAttribute("aria-label", "動物辨識連連看互動畫布"); // 設定畫布無障礙描述
  textFont("Noto Sans TC, Microsoft JhengHei, sans-serif"); // 設定繁體中文字型與備援字型
  textAlign(CENTER, CENTER); // 設定文字預設置中
  textWrap(WORD); // 啟用 p5.js 文字換行
  quiz = createQuiz(); // 建立第一回合六題資料
  beganAt = millis(); // 記錄第一回合作答起始時間
  currentScene = 0; // 初始化目前自然場景
  nextScene = 1; // 初始化下一個自然場景
  sceneBlend = 0; // 初始化場景漸變進度
  sceneStartedAt = millis(); // 記錄場景開始時間
  document.addEventListener("fullscreenchange", handleFullscreenChange); // 監聽瀏覽器全螢幕狀態
  refreshCanvasSize(); // 建立初始響應式版面
} // 完成初始化

function draw() { // 每一幀繪製完整遊戲畫面
  updateSceneTransition(); // 更新自然場景的平滑漸變
  drawBackground(); // 繪製動物主題自然背景
  drawHeader(); // 繪製標題與玩法說明
  drawCards(); // 繪製上方六張動物圖卡
  drawTray(); // 繪製下方六個動物名稱標籤
  drawButtons(); // 繪製三個主要功能按鈕
  drawResultPanel(); // 交卷後繪製成績面板
  if (dragging !== null) drawDraggingLabel(); // 拖曳中繪製跟隨指標的名稱
  if (quiz !== null && quiz.submitted && quiz.score > 60) drawConfetti(); // 高於百分之六十時繪製彩帶
} // 完成每幀繪製

function windowResized() { // 處理視窗縮放、手機旋轉與全螢幕變化
  resizeCanvas(windowWidth, windowHeight); // 讓畫布覆蓋最新視窗尺寸
  refreshCanvasSize(); // 重新計算所有互動位置
} // 完成視窗尺寸處理

function mousePressed() { // 處理滑鼠按下與按鈕點擊
  if (quiz === null || layoutData === null) return false; // 尚未初始化時停止操作
  const buttonName = hitButton(mouseX, mouseY); // 判斷滑鼠是否命中功能按鈕
  if (buttonName === "fullscreen") { toggleBrowserFullscreen(); return false; } // 點擊全螢幕按鈕時切換模式
  if (buttonName === "reset") { resetQuiz(); return false; } // 重新出題按鈕永遠保持可用
  if (buttonName === "answer" && !quiz.showAnswer && !quiz.submitted) { quiz.showAnswer = true; dragging = null; return false; } // 查看答案後顯示正誤並鎖定拖曳
  if (buttonName === "submit" && !quiz.submitted) { submitQuiz(); return false; } // 點擊交卷按鈕後計算成績
  if (quiz.showAnswer || quiz.submitted) return false; // 查看答案或交卷後禁止拖曳
  const slotIndex = hitSlot(mouseX, mouseY); // 判斷是否按到已有名稱的答案格
  if (slotIndex >= 0 && quiz.slots[slotIndex] !== null) { startDrag(quiz.slots[slotIndex], "slot", slotIndex); return false; } // 從答案格取出名稱開始拖曳
  const labelIndex = hitTrayLabel(mouseX, mouseY); // 判斷是否按到下方未放置名稱
  if (labelIndex >= 0) startDrag(labelIndex, "tray", -1); // 從名稱區開始拖曳
  return false; // 阻止瀏覽器預設選取行為
} // 完成滑鼠按下處理

function mouseDragged() { // 處理滑鼠拖曳移動
  if (dragging !== null && quiz !== null && !quiz.showAnswer && !quiz.submitted) { dragging.x = mouseX; dragging.y = mouseY; } // 更新拖曳名稱座標
  return false; // 阻止瀏覽器預設拖曳行為
} // 完成滑鼠拖曳處理

function mouseReleased() { // 處理滑鼠放開與名稱放置
  if (dragging === null) return false; // 沒有拖曳資料時停止處理
  const dropX = mouseX; // 保存放開時的水平座標
  const dropY = mouseY; // 保存放開時的垂直座標
  const slotIndex = hitSlot(dropX, dropY); // 找出放開時命中的答案格
  if (slotIndex >= 0) dropInSlot(slotIndex); // 放入答案格或執行互換
  else if (inTrayArea(dropX, dropY)) returnToTray(); // 放到名稱區時讓名稱回到下方
  else restoreDrag(); // 放到其他位置時復原原本位置
  dragging = null; // 清除拖曳暫存資料
  return false; // 阻止瀏覽器預設放開行為
} // 完成滑鼠放開處理

function touchStarted() { // 處理觸控按下事件
  return mousePressed(); // 共用滑鼠按下邏輯
} // 完成觸控按下處理

function touchMoved() { // 處理觸控移動事件
  return mouseDragged(); // 共用滑鼠拖曳邏輯
} // 完成觸控移動處理

function touchEnded() { // 處理觸控結束事件
  return mouseReleased(); // 共用滑鼠放開邏輯
} // 完成觸控結束處理

function createQuiz() { // 建立一回合新的六題動物測驗
  const selected = shuffleArray(ANIMAL_TYPES).slice(0, 6); // 從十二種動物隨機抽出六種
  const cards = selected.map((item) => ({ key: item.key, name: item.name, color: item.color })); // 建立六張動物圖卡資料
  const labels = shuffleArray(cards.map((card) => ({ key: card.key, name: card.name, color: card.color }))); // 打亂六個名稱標籤順序
  return { cards: cards, labels: labels, slots: [null, null, null, null, null, null], showAnswer: false, submitted: false, correct: 0, score: 0, elapsed: 0 }; // 回傳完整測驗狀態
} // 完成新測驗建立

function resetQuiz() { // 重新出題並解鎖整個測驗
  quiz = createQuiz(); // 建立新的隨機題目
  beganAt = millis(); // 重新記錄作答開始時間
  dragging = null; // 清除殘留拖曳狀態
  confetti = []; // 清除上一回合彩帶
  refreshCanvasSize(); // 重新計算版面
} // 完成重新出題

function getLayoutMetrics() { // 計算不裁切且適合手機平板桌面的版面尺寸
  const viewportW = windowWidth; // 讀取視窗寬度
  const viewportH = windowHeight; // 讀取視窗高度
  const submittedExtra = quiz !== null && quiz.submitted ? 100 : 0; // 為交卷後成績面板預留空間
  const scale = constrain(Math.min(viewportW / 960, viewportH / (690 + submittedExtra)), 0.32, 1.08); // 依視窗大小計算共同縮放比例
  const margin = Math.max(8, Math.min(28, viewportW * 0.025)); // 計算安全左右邊距
  const gap = Math.max(4, Math.min(13, 7 + scale * 3)); // 計算卡片與控制項間距
  const cardColumns = viewportW >= 1120 ? 6 : 3; // 桌面寬版六欄、其他尺寸三欄
  const cardRows = Math.ceil(6 / cardColumns); // 計算動物卡片列數
  const headerH = Math.max(88, Math.min(122, 94 + scale * 18)); // 為標題與玩法說明保留高度
  const cardW = (viewportW - margin * 2 - gap * (cardColumns - 1)) / cardColumns; // 平均分配動物卡片寬度
  const cardH = Math.max(66, Math.min(164, 112 + scale * 42)); // 計算卡片高度並保留向量插圖空間
  const cardsBottom = headerH + cardRows * cardH + (cardRows - 1) * gap; // 計算卡片區底部
  const trayColumns = viewportW >= 760 ? 6 : 3; // 桌面名稱六欄、手機平板名稱三欄
  const trayRows = Math.ceil(6 / trayColumns); // 計算名稱列數
  const trayH = Math.max(30, Math.min(50, 34 + scale * 12)); // 計算名稱標籤高度
  const trayY = cardsBottom + Math.max(16, 22 * scale); // 設定名稱區起點
  const trayW = (viewportW - margin * 2 - gap * (trayColumns - 1)) / trayColumns; // 平均分配名稱標籤寬度
  const buttonColumns = viewportW >= 820 ? 3 : viewportW >= 300 ? 2 : 1; // 主要按鈕依寬度排列成三欄或兩欄
  const buttonRows = Math.ceil(3 / buttonColumns); // 計算三個主要按鈕的列數
  const buttonGap = Math.max(5, Math.min(13, 9 + scale * 3)); // 計算按鈕間距
  const buttonH = Math.max(30, Math.min(52, 35 + scale * 13)); // 計算按鈕高度
  const buttonY = trayY + trayRows * trayH + (trayRows - 1) * gap + Math.max(18, 24 * scale); // 計算主要按鈕起點
  const buttonW = buttonColumns === 1 ? Math.min(360, viewportW - margin * 2) : (viewportW - margin * 2 - buttonGap * (buttonColumns - 1)) / buttonColumns; // 平均分配主要按鈕寬度
  const buttonsBottom = buttonY + buttonRows * buttonH + (buttonRows - 1) * buttonGap; // 計算主要按鈕區底部
  const resultY = buttonsBottom + Math.max(9, 14 * scale); // 計算成績面板起點
  const resultH = quiz !== null && quiz.submitted ? Math.max(62, Math.min(116, 72 + scale * 28)) : 0; // 交卷後設定成績面板高度
  return { margin: margin, gap: gap, scale: scale, cardColumns: cardColumns, cardRows: cardRows, headerH: headerH, cardW: cardW, cardH: cardH, cardsBottom: cardsBottom, trayColumns: trayColumns, trayRows: trayRows, trayH: trayH, trayY: trayY, trayW: trayW, buttonColumns: buttonColumns, buttonRows: buttonRows, buttonGap: buttonGap, buttonH: buttonH, buttonY: buttonY, buttonW: buttonW, buttonsBottom: buttonsBottom, resultY: resultY, resultH: resultH }; // 回傳所有版面尺寸
} // 完成版面尺寸計算

function calculateLayout() { // 建立卡片、標籤、按鈕與全螢幕的互動矩形
  const metrics = getLayoutMetrics(); // 讀取目前響應式版面尺寸
  const cards = []; // 建立六張動物卡片位置陣列
  const tray = []; // 建立六個名稱標籤位置陣列
  const buttons = []; // 建立三個主要按鈕位置陣列
  for (let i = 0; i < 6; i += 1) { const col = i % metrics.cardColumns; const row = Math.floor(i / metrics.cardColumns); cards.push({ x: metrics.margin + col * (metrics.cardW + metrics.gap), y: metrics.headerH + row * (metrics.cardH + metrics.gap), w: metrics.cardW, h: metrics.cardH }); } // 逐一建立平均排列的動物卡片
  for (let i = 0; i < 6; i += 1) { const col = i % metrics.trayColumns; const row = Math.floor(i / metrics.trayColumns); tray.push({ x: metrics.margin + col * (metrics.trayW + metrics.gap), y: metrics.trayY + row * (metrics.trayH + metrics.gap), w: metrics.trayW, h: metrics.trayH }); } // 逐一建立名稱標籤矩形
  for (let i = 0; i < 3; i += 1) { const col = i % metrics.buttonColumns; const row = Math.floor(i / metrics.buttonColumns); const x = metrics.buttonColumns === 1 ? (width - metrics.buttonW) / 2 : metrics.margin + col * (metrics.buttonW + metrics.buttonGap); const y = metrics.buttonY + row * (metrics.buttonH + metrics.buttonGap); buttons.push({ x: x, y: y, w: metrics.buttonW, h: metrics.buttonH }); } // 逐一建立主要按鈕矩形
  const fullscreenW = Math.max(96, Math.min(158, width * 0.19)); // 計算全螢幕按鈕寬度
  const fullscreenH = Math.max(32, Math.min(44, 34 + metrics.scale * 9)); // 計算全螢幕按鈕高度
  const fullscreenButton = { x: width - metrics.margin - fullscreenW, y: 10, w: fullscreenW, h: fullscreenH }; // 建立標題區全螢幕按鈕
  return { metrics: metrics, cards: cards, tray: tray, buttons: buttons, fullscreenButton: fullscreenButton, resultY: metrics.resultY }; // 回傳全部互動版面
} // 完成互動版面建立

function refreshCanvasSize() { // 重新計算滿版畫布內的互動位置
  layoutData = calculateLayout(); // 依目前視窗尺寸更新布局
} // 完成畫布尺寸更新

function drawHeader() { // 繪製標題、玩法說明與全螢幕按鈕
  const margin = layoutData.metrics.margin; // 讀取左右安全邊距
  const scale = layoutData.metrics.scale; // 讀取響應式縮放比例
  const titleSize = Math.max(21, Math.min(43, 39 * scale + 5)); // 計算標題字體大小
  const boxY = Math.max(48, Math.min(66, 55 + scale * 5)); // 設定玩法說明底板位置
  const boxH = Math.max(29, layoutData.metrics.headerH - boxY - 7); // 設定玩法說明底板高度
  noStroke(); // 移除標題外框
  fill(UI.navy); // 使用深色繪製標題
  textAlign(LEFT, TOP); // 設定標題左上對齊
  textSize(titleSize); // 套用標題字體大小
  text("動物辨識連連看", margin, 10); // 繪製動物主題標題
  drawFullscreenButton(layoutData.fullscreenButton); // 繪製全螢幕或退出全螢幕按鈕
  fill(255, 255, 255, 238); // 使用半透明白色繪製說明底板
  rect(margin, boxY, width - margin * 2, boxH, 11); // 繪製玩法說明圓角底板
  fill(UI.ink); // 設定說明文字顏色
  textSize(Math.max(9, Math.min(14, 12 + scale * 3))); // 設定說明文字大小
  const lines = wrapChineseText(INSTRUCTION, width - margin * 2 - 18); // 依畫面寬度切割玩法說明
  text(lines.join("\n"), margin + 9, boxY + 5, width - margin * 2 - 18, boxH - 8); // 繪製完整玩法說明
  textAlign(CENTER, CENTER); // 還原文字預設置中對齊
} // 完成標題與玩法說明繪製

function wrapChineseText(value, maxWidth) { // 將繁體中文說明依像素寬度換行
  const lines = []; // 建立文字行陣列
  let current = ""; // 儲存目前組合中的文字行
  for (const character of value) { // 逐字處理中文與標點
    const candidate = current + character; // 組合下一個字元
    if (current !== "" && textWidth(candidate) > maxWidth) { lines.push(current); current = character; } else { current = candidate; } // 超過寬度時換行
  } // 完成逐字換行
  if (current !== "") lines.push(current); // 將最後一行加入陣列
  return lines; // 回傳可繪製的文字行
} // 完成中文換行

function drawCards() { // 繪製六張動物圖卡與名稱放置格
  quiz.cards.forEach((card, index) => drawCard(card, layoutData.cards[index], index)); // 逐一繪製每張動物圖卡
} // 完成六張卡片繪製

function drawCard(card, box, index) { // 繪製單張純 Canvas 動物插圖卡片
  push(); // 保存卡片繪圖狀態
  drawingContext.shadowColor = "rgba(16,42,67,0.22)"; // 設定卡片陰影色彩
  drawingContext.shadowBlur = 13; // 設定卡片陰影模糊程度
  noStroke(); // 移除卡片外框
  fill(255, 255, 255, 247); // 使用近乎不透明白色繪製卡片
  rect(box.x, box.y, box.w, box.h, 15); // 繪製卡片圓角底板
  drawingContext.shadowBlur = 0; // 清除陰影避免影響其他圖形
  const imageBox = { x: box.x + 7, y: box.y + 7, w: box.w - 14, h: box.h - Math.max(42, box.h * 0.28) }; // 計算向量插圖區域
  drawAnimalArt(card.key, imageBox, card.color); // 使用 p5.js Canvas 繪製動物向量插圖
  const slot = getSlotBox(box); // 取得卡片下方名稱放置格
  const labelId = quiz.slots[index]; // 讀取目前答案格內的名稱索引
  const correct = labelId !== null && quiz.labels[labelId].key === card.key; // 計算本題目前配對狀態
  const slotColor = quiz.showAnswer ? (correct ? UI.green : UI.red) : "#f7fbfd"; // 只有查看答案後才套用正誤底色
  fill(slotColor); // 填入名稱格背景色
  stroke(23, 50, 74, 105); // 設定名稱格邊框色彩
  strokeWeight(2); // 設定名稱格邊框寬度
  rect(slot.x, slot.y, slot.w, slot.h, 9); // 繪製名稱放置格
  noStroke(); // 移除名稱文字外框
  fill(UI.ink); // 設定名稱文字顏色
  textSize(Math.max(10, Math.min(18, box.w * 0.085))); // 依卡片寬度設定名稱字體
  const slotText = labelId === null ? (box.w < 125 ? "放名稱" : "拖名稱到這裡") : quiz.labels[labelId].name; // 組合空格提示或已放置名稱
  text(slotText, slot.x + slot.w / 2, slot.y + slot.h / 2); // 繪製名稱格文字
  if (quiz.showAnswer) drawCorrectMark(correct, box); // 查看答案或交卷後繪製正誤提示
  pop(); // 還原卡片繪圖狀態
} // 完成單張動物卡片繪製

function getSlotBox(cardBox) { // 計算卡片底部名稱放置格位置
  const slotH = Math.max(24, Math.min(37, cardBox.h * 0.23)); // 依卡片高度計算名稱格高度
  return { x: cardBox.x + 6, y: cardBox.y + cardBox.h - slotH - 7, w: cardBox.w - 12, h: slotH }; // 回傳名稱格互動矩形
} // 完成名稱格位置計算

function drawAnimalArt(key, box, baseColor) { // 繪製具有底色的純 Canvas 動物插圖區
  const backgrounds = { cat: "#fff0d5", dog: "#f5e1c8", rabbit: "#fbe4ef", elephant: "#e5edf1", lion: "#fff0b8", panda: "#eaf5f4", penguin: "#dcefff", giraffe: "#fff1bf", fox: "#ffe1c2", frog: "#dcf4c7", monkey: "#eed7bd", tiger: "#ffe0a6" }; // 定義每種動物的插圖底色
  noStroke(); // 移除插圖區外框
  fill(backgrounds[key] || "#e8f3e8"); // 填入動物插圖柔和背景
  rect(box.x, box.y, box.w, box.h, 11); // 繪製插圖區圓角底板
  push(); // 保存動物插圖狀態
  translate(box.x + box.w / 2, box.y + box.h * 0.49); // 將動物原點移到插圖中央
  const size = Math.min(box.w, box.h) * 0.95; // 依插圖區尺寸計算動物大小
  if (key === "cat") drawCat(size, baseColor); // 繪製貓向量插圖
  else if (key === "dog") drawDog(size, baseColor); // 繪製狗向量插圖
  else if (key === "rabbit") drawRabbit(size, baseColor); // 繪製兔子向量插圖
  else if (key === "elephant") drawElephant(size, baseColor); // 繪製大象向量插圖
  else if (key === "lion") drawLion(size, baseColor); // 繪製獅子向量插圖
  else if (key === "panda") drawPanda(size, baseColor); // 繪製熊貓向量插圖
  else if (key === "penguin") drawPenguin(size, baseColor); // 繪製企鵝向量插圖
  else if (key === "giraffe") drawGiraffe(size, baseColor); // 繪製長頸鹿向量插圖
  else if (key === "fox") drawFox(size, baseColor); // 繪製狐狸向量插圖
  else if (key === "frog") drawFrog(size, baseColor); // 繪製青蛙向量插圖
  else if (key === "monkey") drawMonkey(size, baseColor); // 繪製猴子向量插圖
  else drawTiger(size, baseColor); // 繪製老虎向量插圖
  pop(); // 還原動物插圖座標狀態
} // 完成動物插圖區繪製

function drawFaceEyes(size, eyeY, eyeGap) { // 繪製通用動物眼睛
  noStroke(); // 移除眼睛外框
  fill("#18324a"); // 設定眼睛顏色
  ellipse(-eyeGap, eyeY, size * 0.09, size * 0.12); // 繪製左眼
  ellipse(eyeGap, eyeY, size * 0.09, size * 0.12); // 繪製右眼
  fill(255); // 設定眼睛亮點顏色
  ellipse(-eyeGap + size * 0.015, eyeY - size * 0.02, size * 0.025, size * 0.03); // 繪製左眼亮點
  ellipse(eyeGap + size * 0.015, eyeY - size * 0.02, size * 0.025, size * 0.03); // 繪製右眼亮點
} // 完成通用眼睛

function drawCat(size, colorValue) { // 繪製貓咪向量插圖
  noStroke(); // 移除貓咪外框
  fill(colorValue); // 填入貓咪毛色
  triangle(-size * 0.42, -size * 0.27, -size * 0.27, -size * 0.61, -size * 0.03, -size * 0.34); // 繪製左耳
  triangle(size * 0.42, -size * 0.27, size * 0.27, -size * 0.61, size * 0.03, -size * 0.34); // 繪製右耳
  ellipse(0, 0, size * 0.78, size * 0.68); // 繪製貓咪臉部
  fill("#f7b2c4"); // 設定貓耳內與鼻子顏色
  triangle(-size * 0.31, -size * 0.38, -size * 0.27, -size * 0.52, -size * 0.16, -size * 0.38); // 繪製左耳內側
  triangle(size * 0.31, -size * 0.38, size * 0.27, -size * 0.52, size * 0.16, -size * 0.38); // 繪製右耳內側
  drawFaceEyes(size, -size * 0.08, size * 0.16); // 繪製貓咪眼睛
  fill("#e76f91"); // 設定貓咪鼻子顏色
  triangle(-size * 0.045, size * 0.08, size * 0.045, size * 0.08, 0, size * 0.16); // 繪製貓咪鼻子
  stroke("#8d5524"); // 設定貓咪鬍鬚顏色
  strokeWeight(Math.max(1, size * 0.025)); // 設定鬍鬚線寬
  line(-size * 0.15, size * 0.13, -size * 0.46, size * 0.08); // 繪製左上鬍鬚
  line(-size * 0.15, size * 0.2, -size * 0.46, size * 0.23); // 繪製左下鬍鬚
  line(size * 0.15, size * 0.13, size * 0.46, size * 0.08); // 繪製右上鬍鬚
  line(size * 0.15, size * 0.2, size * 0.46, size * 0.23); // 繪製右下鬍鬚
} // 完成貓咪插圖

function drawDog(size, colorValue) { // 繪製狗狗向量插圖
  noStroke(); // 移除狗狗外框
  fill("#754f35"); // 設定狗狗耳朵顏色
  ellipse(-size * 0.36, -size * 0.08, size * 0.28, size * 0.62); // 繪製左垂耳
  ellipse(size * 0.36, -size * 0.08, size * 0.28, size * 0.62); // 繪製右垂耳
  fill(colorValue); // 填入狗狗臉部毛色
  ellipse(0, 0, size * 0.78, size * 0.72); // 繪製狗狗臉部
  fill("#f4d8b4"); // 設定狗狗嘴部顏色
  ellipse(0, size * 0.19, size * 0.38, size * 0.26); // 繪製狗狗嘴部
  drawFaceEyes(size, -size * 0.08, size * 0.16); // 繪製狗狗眼睛
  fill("#30231d"); // 設定狗狗鼻子顏色
  ellipse(0, size * 0.12, size * 0.13, size * 0.1); // 繪製狗狗鼻子
  stroke("#30231d"); // 設定狗狗嘴線色彩
  strokeWeight(Math.max(1, size * 0.025)); // 設定狗狗嘴線寬度
  line(0, size * 0.16, 0, size * 0.25); // 繪製狗狗鼻下線
  arc(-size * 0.08, size * 0.22, size * 0.16, size * 0.12, 0, PI); // 繪製左側嘴角
  arc(size * 0.08, size * 0.22, size * 0.16, size * 0.12, 0, PI); // 繪製右側嘴角
} // 完成狗狗插圖

function drawRabbit(size, colorValue) { // 繪製兔子向量插圖
  noStroke(); // 移除兔子外框
  fill(colorValue); // 填入兔子毛色
  ellipse(-size * 0.2, -size * 0.56, size * 0.2, size * 0.58); // 繪製左長耳
  ellipse(size * 0.2, -size * 0.56, size * 0.2, size * 0.58); // 繪製右長耳
  fill("#efa8c6"); // 設定兔子耳朵內側顏色
  ellipse(-size * 0.2, -size * 0.56, size * 0.09, size * 0.39); // 繪製左耳內側
  ellipse(size * 0.2, -size * 0.56, size * 0.09, size * 0.39); // 繪製右耳內側
  fill(colorValue); // 恢復兔子臉部毛色
  ellipse(0, size * 0.02, size * 0.78, size * 0.66); // 繪製兔子臉部
  drawFaceEyes(size, -size * 0.06, size * 0.16); // 繪製兔子眼睛
  fill("#e76f91"); // 設定兔子鼻子顏色
  triangle(-size * 0.05, size * 0.1, size * 0.05, size * 0.1, 0, size * 0.18); // 繪製兔子鼻子
  noFill(); // 將兔子嘴巴設為線條
  stroke("#8d5524"); // 設定兔子嘴線色彩
  strokeWeight(Math.max(1, size * 0.022)); // 設定兔子嘴線寬度
  arc(-size * 0.07, size * 0.19, size * 0.14, size * 0.12, 0, PI); // 繪製左嘴角
  arc(size * 0.07, size * 0.19, size * 0.14, size * 0.12, 0, PI); // 繪製右嘴角
} // 完成兔子插圖

function drawElephant(size, colorValue) { // 繪製大象向量插圖
  noStroke(); // 移除大象外框
  fill(colorValue); // 填入大象灰色
  ellipse(-size * 0.35, -size * 0.02, size * 0.32, size * 0.58); // 繪製左大耳朵
  ellipse(size * 0.35, -size * 0.02, size * 0.32, size * 0.58); // 繪製右大耳朵
  fill("#b8c2cc"); // 設定耳朵內側顏色
  ellipse(-size * 0.35, -size * 0.02, size * 0.18, size * 0.38); // 繪製左耳內側
  ellipse(size * 0.35, -size * 0.02, size * 0.18, size * 0.38); // 繪製右耳內側
  fill(colorValue); // 恢復大象臉部顏色
  ellipse(0, -size * 0.02, size * 0.72, size * 0.7); // 繪製大象臉部
  drawFaceEyes(size, -size * 0.12, size * 0.16); // 繪製大象眼睛
  stroke(colorValue); // 設定象鼻顏色
  strokeWeight(Math.max(7, size * 0.13)); // 設定象鼻線寬
  noFill(); // 將象鼻設定為線條
  arc(0, size * 0.12, size * 0.3, size * 0.48, 0, PI); // 繪製彎曲象鼻
  noStroke(); // 移除象鼻外框
} // 完成大象插圖

function drawLion(size, colorValue) { // 繪製獅子向量插圖
  noStroke(); // 移除獅子外框
  fill("#c8872f"); // 設定獅子鬃毛顏色
  ellipse(0, 0, size * 0.95, size * 0.9); // 繪製獅子鬃毛
  fill(colorValue); // 填入獅子臉部毛色
  ellipse(0, size * 0.02, size * 0.64, size * 0.63); // 繪製獅子臉部
  drawFaceEyes(size, -size * 0.08, size * 0.14); // 繪製獅子眼睛
  fill("#704214"); // 設定獅子鼻子顏色
  triangle(-size * 0.05, size * 0.1, size * 0.05, size * 0.1, 0, size * 0.17); // 繪製獅子鼻子
  stroke("#704214"); // 設定獅子嘴巴色彩
  strokeWeight(Math.max(1, size * 0.025)); // 設定獅子嘴巴線寬
  line(0, size * 0.16, 0, size * 0.26); // 繪製獅子鼻下線
  arc(-size * 0.08, size * 0.23, size * 0.15, size * 0.12, 0, PI); // 繪製左嘴角
  arc(size * 0.08, size * 0.23, size * 0.15, size * 0.12, 0, PI); // 繪製右嘴角
} // 完成獅子插圖

function drawPanda(size, colorValue) { // 繪製熊貓向量插圖
  noStroke(); // 移除熊貓外框
  fill("#20252b"); // 設定熊貓黑色耳朵
  ellipse(-size * 0.28, -size * 0.32, size * 0.25, size * 0.25); // 繪製左耳
  ellipse(size * 0.28, -size * 0.32, size * 0.25, size * 0.25); // 繪製右耳
  fill(colorValue); // 填入熊貓臉部白色
  ellipse(0, 0, size * 0.82, size * 0.75); // 繪製熊貓臉部
  fill("#20252b"); // 設定熊貓眼罩顏色
  ellipse(-size * 0.18, -size * 0.08, size * 0.22, size * 0.3); // 繪製左眼罩
  ellipse(size * 0.18, -size * 0.08, size * 0.22, size * 0.3); // 繪製右眼罩
  fill("#ffffff"); // 設定熊貓眼睛亮色
  ellipse(-size * 0.18, -size * 0.08, size * 0.08, size * 0.1); // 繪製左眼
  ellipse(size * 0.18, -size * 0.08, size * 0.08, size * 0.1); // 繪製右眼
  fill("#20252b"); // 設定熊貓鼻子顏色
  ellipse(0, size * 0.14, size * 0.12, size * 0.09); // 繪製熊貓鼻子
} // 完成熊貓插圖

function drawPenguin(size, colorValue) { // 繪製企鵝向量插圖
  noStroke(); // 移除企鵝外框
  fill("#25364d"); // 設定企鵝身體深色
  ellipse(0, size * 0.04, size * 0.66, size * 0.9); // 繪製企鵝身體
  fill(colorValue); // 填入企鵝肚子淺色
  ellipse(0, size * 0.13, size * 0.42, size * 0.61); // 繪製企鵝肚子
  fill("#f2c14e"); // 設定企鵝嘴巴與腳色彩
  triangle(-size * 0.08, -size * 0.18, size * 0.08, -size * 0.18, 0, -size * 0.05); // 繪製企鵝嘴巴
  ellipse(-size * 0.15, size * 0.48, size * 0.18, size * 0.08); // 繪製左腳
  ellipse(size * 0.15, size * 0.48, size * 0.18, size * 0.08); // 繪製右腳
  drawFaceEyes(size, -size * 0.28, size * 0.13); // 繪製企鵝眼睛
} // 完成企鵝插圖

function drawGiraffe(size, colorValue) { // 繪製長頸鹿向量插圖
  noStroke(); // 移除長頸鹿外框
  fill(colorValue); // 填入長頸鹿黃色
  rect(-size * 0.16, -size * 0.62, size * 0.32, size * 0.72, size * 0.08); // 繪製長頸鹿長脖子
  fill("#8c5a2b"); // 設定長頸鹿斑紋顏色
  ellipse(-size * 0.08, -size * 0.43, size * 0.1, size * 0.12); // 繪製脖子左斑紋
  ellipse(size * 0.08, -size * 0.2, size * 0.1, size * 0.13); // 繪製脖子右斑紋
  ellipse(-size * 0.08, -size * 0.05, size * 0.09, size * 0.12); // 繪製脖子下斑紋
  fill(colorValue); // 恢復長頸鹿臉部黃色
  ellipse(0, -size * 0.69, size * 0.56, size * 0.4); // 繪製長頸鹿頭部
  stroke("#8c5a2b"); // 設定長頸鹿角線色彩
  strokeWeight(Math.max(2, size * 0.025)); // 設定長頸鹿角線寬
  line(-size * 0.16, -size * 0.84, -size * 0.19, -size * 0.98); // 繪製左角
  line(size * 0.16, -size * 0.84, size * 0.19, -size * 0.98); // 繪製右角
  noStroke(); // 移除臉部外框
  fill("#8c5a2b"); // 設定臉部斑紋色彩
  ellipse(-size * 0.17, -size * 0.71, size * 0.1, size * 0.1); // 繪製左臉斑紋
  ellipse(size * 0.15, -size * 0.63, size * 0.1, size * 0.1); // 繪製右臉斑紋
  drawFaceEyes(size, -size * 0.73, size * 0.14); // 繪製長頸鹿眼睛
  fill("#704214"); // 設定長頸鹿鼻子色彩
  ellipse(0, -size * 0.58, size * 0.14, size * 0.07); // 繪製長頸鹿鼻子
} // 完成長頸鹿插圖

function drawFox(size, colorValue) { // 繪製狐狸向量插圖
  noStroke(); // 移除狐狸外框
  fill(colorValue); // 填入狐狸橘色
  triangle(-size * 0.43, -size * 0.2, -size * 0.28, -size * 0.64, -size * 0.04, -size * 0.35); // 繪製左耳
  triangle(size * 0.43, -size * 0.2, size * 0.28, -size * 0.64, size * 0.04, -size * 0.35); // 繪製右耳
  ellipse(0, 0, size * 0.78, size * 0.72); // 繪製狐狸臉部
  fill("#fff4df"); // 設定狐狸臉部白色區域
  triangle(-size * 0.3, size * 0.03, 0, size * 0.38, size * 0.3, size * 0.03); // 繪製狐狸白色口鼻
  drawFaceEyes(size, -size * 0.11, size * 0.16); // 繪製狐狸眼睛
  fill("#30231d"); // 設定狐狸鼻子色彩
  triangle(-size * 0.06, size * 0.18, size * 0.06, size * 0.18, 0, size * 0.25); // 繪製狐狸鼻子
} // 完成狐狸插圖

function drawFrog(size, colorValue) { // 繪製青蛙向量插圖
  noStroke(); // 移除青蛙外框
  fill(colorValue); // 填入青蛙綠色
  ellipse(-size * 0.24, -size * 0.29, size * 0.3, size * 0.3); // 繪製左眼球
  ellipse(size * 0.24, -size * 0.29, size * 0.3, size * 0.3); // 繪製右眼球
  ellipse(0, size * 0.05, size * 0.82, size * 0.62); // 繪製青蛙臉部
  fill("#f7fff2"); // 設定青蛙眼白
  ellipse(-size * 0.24, -size * 0.3, size * 0.14, size * 0.14); // 繪製左眼白
  ellipse(size * 0.24, -size * 0.3, size * 0.14, size * 0.14); // 繪製右眼白
  fill("#18324a"); // 設定青蛙瞳孔色彩
  ellipse(-size * 0.24, -size * 0.3, size * 0.06, size * 0.08); // 繪製左瞳孔
  ellipse(size * 0.24, -size * 0.3, size * 0.06, size * 0.08); // 繪製右瞳孔
  noFill(); // 將青蛙嘴巴設定為線條
  stroke("#27632a"); // 設定青蛙嘴巴色彩
  strokeWeight(Math.max(2, size * 0.025)); // 設定青蛙嘴巴線寬
  arc(0, size * 0.08, size * 0.45, size * 0.24, 0, PI); // 繪製青蛙微笑
} // 完成青蛙插圖

function drawMonkey(size, colorValue) { // 繪製猴子向量插圖
  noStroke(); // 移除猴子外框
  fill("#d7a77d"); // 設定猴子耳朵內側顏色
  ellipse(-size * 0.42, -size * 0.02, size * 0.3, size * 0.38); // 繪製左耳
  ellipse(size * 0.42, -size * 0.02, size * 0.3, size * 0.38); // 繪製右耳
  fill(colorValue); // 填入猴子臉部棕色
  ellipse(0, -size * 0.02, size * 0.78, size * 0.72); // 繪製猴子頭部
  fill("#f0c9a0"); // 設定猴子嘴部淺色
  ellipse(0, size * 0.17, size * 0.45, size * 0.31); // 繪製猴子嘴部
  drawFaceEyes(size, -size * 0.1, size * 0.16); // 繪製猴子眼睛
  fill("#5a3825"); // 設定猴子鼻子色彩
  ellipse(0, size * 0.1, size * 0.1, size * 0.08); // 繪製猴子鼻子
  noFill(); // 將猴子嘴巴設定為線條
  stroke("#5a3825"); // 設定猴子嘴線色彩
  strokeWeight(Math.max(1, size * 0.022)); // 設定猴子嘴線寬度
  arc(0, size * 0.2, size * 0.2, size * 0.12, 0, PI); // 繪製猴子嘴巴
} // 完成猴子插圖

function drawTiger(size, colorValue) { // 繪製老虎向量插圖
  noStroke(); // 移除老虎外框
  fill(colorValue); // 填入老虎橘色
  triangle(-size * 0.42, -size * 0.25, -size * 0.3, -size * 0.58, -size * 0.08, -size * 0.35); // 繪製左耳
  triangle(size * 0.42, -size * 0.25, size * 0.3, -size * 0.58, size * 0.08, -size * 0.35); // 繪製右耳
  ellipse(0, 0, size * 0.8, size * 0.72); // 繪製老虎臉部
  fill("#3d2b1f"); // 設定老虎條紋色彩
  triangle(-size * 0.22, -size * 0.35, -size * 0.13, -size * 0.1, -size * 0.06, -size * 0.35); // 繪製左額條紋
  triangle(size * 0.22, -size * 0.35, size * 0.13, -size * 0.1, size * 0.06, -size * 0.35); // 繪製右額條紋
  triangle(-size * 0.36, size * 0.02, -size * 0.2, size * 0.05, -size * 0.32, size * 0.17); // 繪製左臉條紋
  triangle(size * 0.36, size * 0.02, size * 0.2, size * 0.05, size * 0.32, size * 0.17); // 繪製右臉條紋
  drawFaceEyes(size, -size * 0.1, size * 0.16); // 繪製老虎眼睛
  fill("#e76f91"); // 設定老虎鼻子顏色
  triangle(-size * 0.05, size * 0.11, size * 0.05, size * 0.11, 0, size * 0.19); // 繪製老虎鼻子
} // 完成老虎插圖

function drawCorrectMark(correct, box) { // 繪製查看答案後的正誤提示
  fill(correct ? "#386641" : "#9d1c2b"); // 使用與答案底色相配的深色文字
  textSize(Math.max(10, Math.min(15, box.w * 0.07))); // 依卡片寬度設定提示字體
  text(correct ? "✓ 正確" : "✕ 錯誤", box.x + box.w / 2, box.y + 14); // 在卡片上方顯示正誤
} // 完成正誤提示繪製

function drawTray() { // 繪製下方六個可拖曳動物名稱標籤
  const trayTop = layoutData.tray[0].y; // 讀取名稱區起點
  noStroke(); // 移除區域標題外框
  fill(UI.navy); // 設定區域標題色彩
  textAlign(LEFT, CENTER); // 設定區域標題左對齊
  textSize(Math.max(12, Math.min(17, 13 + layoutData.metrics.scale * 3))); // 設定區域標題大小
  text("可拖曳的動物名稱", layoutData.metrics.margin, trayTop - 17); // 繪製名稱區標題
  textAlign(CENTER, CENTER); // 還原文字預設置中
  quiz.labels.forEach((label, index) => { if (!isPlaced(index) && (dragging === null || dragging.labelId !== index)) drawLabel(label, layoutData.tray[index], false); }); // 只繪製尚未放入答案格的名稱
} // 完成名稱區繪製

function drawLabel(label, box, active) { // 繪製單一動物名稱標籤
  fill(active ? "#fff1b8" : "#ffffff"); // 設定一般或拖曳中的標籤底色
  stroke(active ? UI.gold : "rgba(24,50,74,0.30)"); // 設定標籤邊框色彩
  strokeWeight(2); // 設定標籤邊框寬度
  rect(box.x, box.y, box.w, box.h, 11); // 繪製圓角名稱標籤
  noStroke(); // 移除文字外框
  fill(UI.ink); // 設定名稱文字色彩
  textSize(Math.max(13, Math.min(20, box.w * 0.11))); // 依標籤寬度調整文字大小
  text(label.name, box.x + box.w / 2, box.y + box.h / 2); // 繪製動物名稱
} // 完成單一名稱標籤繪製

function drawDraggingLabel() { // 繪製跟隨滑鼠或手指的名稱標籤
  const label = quiz.labels[dragging.labelId]; // 讀取目前拖曳的名稱
  const dragW = Math.min(220, width - layoutData.metrics.margin * 2); // 計算拖曳標籤最大寬度
  const dragH = Math.max(36, Math.min(54, 40 + layoutData.metrics.scale * 10)); // 計算拖曳標籤高度
  const box = { x: dragging.x - dragW / 2, y: dragging.y - dragH / 2, w: dragW, h: dragH }; // 建立拖曳中的標籤矩形
  drawLabel(label, box, true); // 使用高亮樣式繪製拖曳標籤
} // 完成拖曳標籤繪製

function drawButtons() { // 繪製查看答案、交卷與重新出題按鈕
  drawButton(layoutData.buttons[0], "點我看答案", quiz.showAnswer || quiz.submitted, "answer"); // 繪製查看答案按鈕
  drawButton(layoutData.buttons[1], quiz.submitted ? "已交卷看成績" : "交卷看成績", quiz.submitted, "submit"); // 繪製交卷按鈕
  drawButton(layoutData.buttons[2], "重新出題", false, "reset"); // 繪製重新出題按鈕
} // 完成主要按鈕繪製

function drawButton(box, label, disabled, kind) { // 繪製單一畫布功能按鈕
  const buttonColor = kind === "reset" ? "#5c677d" : kind === "submit" ? UI.blue : "#386641"; // 依按鈕用途選擇底色
  const fontSize = Math.max(11, Math.min(18, box.w * 0.075)); // 依按鈕寬度計算文字大小
  fill(disabled ? "rgba(24,50,74,0.44)" : buttonColor); // 鎖定按鈕使用半透明深色
  noStroke(); // 移除按鈕外框
  rect(box.x, box.y, box.w, box.h, 10); // 繪製圓角功能按鈕
  fill(UI.white); // 設定按鈕文字為白色
  textSize(fontSize); // 套用按鈕文字大小
  text(label, box.x + box.w / 2, box.y + box.h / 2); // 繪製按鈕文字
} // 完成單一按鈕繪製

function drawResultPanel() { // 繪製交卷後分數、用時與每題結果
  if (!quiz.submitted) return; // 未交卷前不顯示成績內容
  const margin = layoutData.metrics.margin; // 讀取成績面板左右邊距
  const panelY = layoutData.resultY; // 讀取成績面板垂直位置
  const panelW = width - margin * 2; // 計算成績面板寬度
  const panelH = layoutData.metrics.resultH; // 讀取成績面板高度
  fill(255, 255, 255, 242); // 使用高可讀性白色面板
  noStroke(); // 移除成績面板外框
  rect(margin, panelY, panelW, panelH, 14); // 繪製成績面板
  fill(UI.navy); // 設定成績主文字顏色
  textSize(Math.max(12, Math.min(21, panelH * 0.18))); // 設定成績標題大小
  text("成績：" + quiz.score + "%　答對 " + quiz.correct + "/6　用時 " + formatTime(quiz.elapsed), width / 2, panelY + panelH * 0.23); // 顯示分數答對題數與用時
  fill(quiz.score > 60 ? "#386641" : "#9d1c2b"); // 依成績選擇鼓勵文字色彩
  textSize(Math.max(11, Math.min(18, panelH * 0.15))); // 設定鼓勵文字大小
  text(quiz.score > 60 ? "太棒了！彩帶正在為你慶祝！" : "繼續努力！", width / 2, panelY + panelH * 0.5); // 顯示鼓勵文字
  const resultText = quiz.cards.map((card, index) => { const labelId = quiz.slots[index]; const correct = labelId !== null && quiz.labels[labelId].key === card.key; return (index + 1) + (correct ? "✓" : "✕"); }).join("　"); // 組合六題逐題對錯文字
  fill(UI.ink); // 設定逐題結果文字顏色
  textSize(Math.max(10, Math.min(16, panelH * 0.13))); // 設定逐題結果文字大小
  text("每題結果：" + resultText, width / 2, panelY + panelH * 0.78); // 顯示每一題對錯
} // 完成交卷結果繪製

function startDrag(labelId, source, sourceSlot) { // 開始拖曳指定名稱
  if (!Number.isInteger(labelId) || labelId < 0 || labelId >= quiz.labels.length) return; // 驗證名稱索引安全性
  if (source === "slot") quiz.slots[sourceSlot] = null; // 從答案格取出時先清空來源格
  dragging = { labelId: labelId, source: source, sourceSlot: sourceSlot, x: mouseX, y: mouseY }; // 儲存拖曳來源與座標
} // 完成拖曳開始

function dropInSlot(targetSlot) { // 將拖曳中的名稱放入目標答案格
  if (dragging === null || targetSlot < 0 || targetSlot >= 6) return; // 驗證拖曳資料與目標格
  const oldLabel = quiz.slots[targetSlot]; // 讀取目標格原本名稱
  if (oldLabel !== null && dragging.source === "slot" && dragging.sourceSlot !== targetSlot) quiz.slots[dragging.sourceSlot] = oldLabel; // 從格子到格子時執行互換
  quiz.slots[targetSlot] = dragging.labelId; // 將拖曳名稱放入目標格
} // 完成名稱放入答案格

function returnToTray() { // 將名稱拖回下方名稱區
  if (dragging !== null && dragging.source === "slot") quiz.slots[dragging.sourceSlot] = null; // 從答案格拖回時保持來源格清空
} // 完成拖回名稱區

function restoreDrag() { // 將未成功放置的名稱復原
  if (dragging !== null && dragging.source === "slot") quiz.slots[dragging.sourceSlot] = dragging.labelId; // 從答案格拖出失敗時放回原格
} // 完成拖曳復原

function isPlaced(labelId) { // 判斷名稱是否已放入任一答案格
  return quiz.slots.indexOf(labelId) >= 0; // 回傳名稱放置狀態
} // 完成名稱放置判斷

function hitSlot(x, y) { // 判斷座標命中的名稱放置格索引
  for (let i = 0; i < layoutData.cards.length; i += 1) { if (inside(x, y, getSlotBox(layoutData.cards[i]))) return i; } // 逐一檢查六個名稱格
  return -1; // 沒有命中時回傳無效索引
} // 完成名稱格命中測試

function hitTrayLabel(x, y) { // 判斷座標命中的下方名稱標籤索引
  for (let i = 0; i < layoutData.tray.length; i += 1) { if (!isPlaced(i) && inside(x, y, layoutData.tray[i])) return i; } // 逐一檢查尚未放置的標籤
  return -1; // 沒有命中時回傳無效索引
} // 完成名稱標籤命中測試

function inTrayArea(x, y) { // 判斷座標是否落在下方名稱區
  const first = layoutData.tray[0]; // 取得名稱區第一格
  const last = layoutData.tray[layoutData.tray.length - 1]; // 取得名稱區最後一格
  return x >= first.x - 16 && x <= width - layoutData.metrics.margin + 16 && y >= first.y - 24 && y <= last.y + last.h + 24; // 回傳名稱區範圍結果
} // 完成名稱區判斷

function hitButton(x, y) { // 判斷座標命中的三個主要按鈕與全螢幕按鈕
  if (inside(x, y, layoutData.fullscreenButton)) return "fullscreen"; // 命中全螢幕按鈕時回傳全螢幕
  if (inside(x, y, layoutData.buttons[0])) return "answer"; // 命中查看答案按鈕時回傳答案
  if (inside(x, y, layoutData.buttons[1])) return "submit"; // 命中交卷按鈕時回傳交卷
  if (inside(x, y, layoutData.buttons[2])) return "reset"; // 命中重新出題按鈕時回傳重設
  return ""; // 沒有命中按鈕時回傳空字串
} // 完成功能按鈕命中測試

function inside(x, y, box) { // 判斷座標是否位於矩形內
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h; // 回傳矩形碰撞結果
} // 完成矩形碰撞判斷

function isBrowserFullscreen() { // 讀取目前瀏覽器是否處於全螢幕模式
  return document.fullscreenElement !== null || (typeof fullscreen === "function" && fullscreen()); // 同時支援原生 API 與 p5.js 狀態
} // 完成全螢幕狀態判斷

function toggleBrowserFullscreen() { // 切換真正的瀏覽器全螢幕模式
  fullscreen(!fullscreen()); // 使用 p5.js API 切換全螢幕
} // 完成全螢幕切換

function handleFullscreenChange() { // 處理瀏覽器全螢幕狀態改變
  resizeCanvas(windowWidth, windowHeight); // 讓全螢幕切換後畫布立即更新
  refreshCanvasSize(); // 重新計算全螢幕後的版面
} // 完成全螢幕事件處理

function drawFullscreenButton(box) { // 繪製全螢幕或退出全螢幕按鈕
  if (box === undefined || box === null) return; // 版面尚未建立時略過繪製
  const label = isBrowserFullscreen() ? "退出全螢幕" : "全螢幕"; // 依目前狀態決定按鈕文字
  fill("rgba(138,90,0,0.94)"); // 使用高對比金棕色繪製按鈕
  noStroke(); // 移除按鈕外框
  rect(box.x, box.y, box.w, box.h, 10); // 繪製全螢幕圓角按鈕
  fill(UI.white); // 使用白色繪製按鈕文字
  textAlign(CENTER, CENTER); // 設定按鈕文字置中
  textSize(Math.max(11, Math.min(16, box.w * 0.1))); // 依按鈕寬度調整字體
  text(label, box.x + box.w / 2, box.y + box.h / 2); // 繪製全螢幕按鈕文字
} // 完成全螢幕按鈕繪製

function submitQuiz() { // 計算交卷成績並鎖定測驗
  if (quiz.submitted) return; // 已交卷時不重複計算
  quiz.correct = 0; // 將答對題數歸零
  quiz.cards.forEach((card, index) => { const labelId = quiz.slots[index]; if (labelId !== null && quiz.labels[labelId].key === card.key) quiz.correct += 1; }); // 逐題比對動物答案
  quiz.score = Math.round(quiz.correct / 6 * 100); // 將答對題數換算成百分比
  quiz.elapsed = Math.max(0, Math.floor((millis() - beganAt) / 1000)); // 計算作答秒數
  quiz.showAnswer = true; // 交卷後顯示每格正誤顏色
  quiz.submitted = true; // 交卷後鎖定拖曳
  if (quiz.score > 60) createConfetti(); // 分數高於百分之六十時建立彩帶
  refreshCanvasSize(); // 為成績面板重新配置版面
} // 完成交卷計算

function formatTime(seconds) { // 將秒數格式化為分鐘與秒數
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0"); // 回傳零補齊時間文字
} // 完成時間格式化

function createConfetti() { // 建立高分彩帶粒子
  confetti = []; // 清空舊彩帶資料
  const colors = ["#e63946", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"]; // 定義彩帶色彩
  for (let i = 0; i < 100; i += 1) confetti.push({ x: Math.random() * width, y: -Math.random() * height, speed: 1.4 + Math.random() * 3.2, size: 5 + Math.random() * 7, phase: Math.random() * TWO_PI, color: colors[i % colors.length] }); // 建立隨機彩帶粒子
} // 完成彩帶建立

function drawConfetti() { // 更新並繪製高分彩帶
  noStroke(); // 移除彩帶外框
  confetti.forEach((piece) => { piece.y += piece.speed; piece.x += Math.sin(frameCount * 0.03 + piece.phase) * 0.8; fill(piece.color); push(); translate(piece.x, piece.y); rotate(frameCount * 0.04 + piece.phase); rect(0, 0, piece.size, piece.size * 0.48, 2); pop(); if (piece.y > height + 20) { piece.y = -20; piece.x = Math.random() * width; } }); // 更新位置並循環繪製彩帶
} // 完成彩帶繪製

function updateSceneTransition() { // 更新自然背景的交叉淡化狀態
  const elapsed = millis() - sceneStartedAt; // 計算目前場景持續時間
  if (elapsed < SCENE_TIME) { sceneBlend = 0; return; } // 停留時間未結束時保持目前場景
  sceneBlend = constrain((elapsed - SCENE_TIME) / TRANSITION_TIME, 0, 1); // 計算下一場景的淡入進度
  if (sceneBlend >= 1) { currentScene = nextScene; nextScene = (currentScene + 1) % SCENE_NAMES.length; sceneBlend = 0; sceneStartedAt = millis(); } // 漸變完成後切換場景索引
} // 完成場景漸變更新

function drawBackground() { // 繪製目前與下一個自然場景的平滑交叉背景
  drawScene(currentScene, 1); // 以完整透明度繪製目前場景
  if (sceneBlend > 0) drawScene(nextScene, sceneBlend); // 以漸進透明度繪製下一場景
  noStroke(); // 移除背景覆蓋層外框
  fill(255, 255, 255, 70); // 加上半透明白色提高前景可讀性
  rect(0, 0, width, height); // 覆蓋整個背景畫面
} // 完成背景交叉淡化

function drawScene(sceneIndex, alphaValue) { // 以指定透明度繪製單一自然場景
  const sceneName = SCENE_NAMES[sceneIndex] || "forest"; // 取得安全的場景名稱
  push(); // 保存背景繪圖狀態
  drawingContext.globalAlpha = alphaValue; // 套用場景交叉淡化透明度
  drawSceneGradient(sceneName); // 繪製自然場景天空漸層
  if (sceneName === "forest") drawForestScene(); // 繪製森林場景裝飾
  if (sceneName === "grassland") drawGrasslandScene(); // 繪製草原場景裝飾
  if (sceneName === "snowfield") drawSnowfieldScene(); // 繪製雪地場景裝飾
  if (sceneName === "desert") drawDesertScene(); // 繪製沙漠場景裝飾
  if (sceneName === "rainforest") drawRainforestScene(); // 繪製雨林場景裝飾
  if (sceneName === "coast") drawCoastScene(); // 繪製海岸場景裝飾
  drawingContext.globalAlpha = 1; // 還原透明度避免影響前景
  pop(); // 還原背景繪圖狀態
} // 完成單一自然場景繪製

function drawSceneGradient(sceneName) { // 繪製六種自然場景的天空漸層
  const palettes = { forest: ["#8ed1b2", "#e8d99b"], grassland: ["#7ec8e3", "#f5d58b"], snowfield: ["#a9d9f0", "#f7fbff"], desert: ["#f6b26b", "#f9df9a"], rainforest: ["#3a9d78", "#b7d968"], coast: ["#62c4dc", "#f7d794"] }; // 定義各自然場景天空色組
  const palette = palettes[sceneName] || palettes.forest; // 取得指定場景色組
  noStroke(); // 移除天空色帶外框
  for (let y = 0; y < height; y += 12) { fill(lerpColor(color(palette[0]), color(palette[1]), y / height)); rect(0, y, width, 12); } // 以水平色帶繪製垂直漸層
} // 完成自然場景天空漸層

function drawForestScene() { // 繪製森林背景場景
  noStroke(); // 移除森林裝飾外框
  fill("#5a9b62"); // 設定森林地面顏色
  rect(0, height * 0.68, width, height * 0.32); // 繪製森林地面
  fill("#39734a"); // 設定遠方樹冠顏色
  for (let x = -40; x < width + 80; x += 100) ellipse(x, height * 0.65, 180, 130); // 繪製遠方樹冠
  fill("#6f4e37"); // 設定樹幹顏色
  for (let x = 30; x < width; x += 170) rect(x, height * 0.45, 28, height * 0.32, 8); // 繪製森林樹幹
  fill("#2f6b3d"); // 設定近景樹冠顏色
  for (let x = 0; x < width + 80; x += 170) ellipse(x, height * 0.45, 190, 145); // 繪製近景樹冠
  drawSunGlow(width * 0.86, height * 0.16, 45); // 繪製森林陽光
} // 完成森林背景

function drawGrasslandScene() { // 繪製草原背景場景
  noStroke(); // 移除草原裝飾外框
  fill("#76a84f"); // 設定草原地面顏色
  rect(0, height * 0.68, width, height * 0.32); // 繪製草原地面
  fill("#b5c96b"); // 設定遠方草坡顏色
  ellipse(width * 0.18, height * 0.74, width * 0.8, height * 0.32); // 繪製左側草坡
  ellipse(width * 0.8, height * 0.75, width * 0.9, height * 0.35); // 繪製右側草坡
  fill("#e4c35b"); // 設定小花色彩
  for (let i = 0; i < 22; i += 1) ellipse((i * 83) % width, height * 0.78 + (i % 4) * 13, 5, 5); // 繪製草地小花
  drawSunGlow(width * 0.84, height * 0.15, 48); // 繪製草原陽光
  drawSoftCloud(width * 0.18, height * 0.17, 1.1, 115); // 繪製草原雲朵
} // 完成草原背景

function drawSnowfieldScene() { // 繪製雪地背景場景
  noStroke(); // 移除雪地裝飾外框
  fill("#eaf7ff"); // 設定雪地前景顏色
  rect(0, height * 0.62, width, height * 0.38); // 繪製雪地
  fill("#c4e4f2"); // 設定雪山顏色
  triangle(0, height * 0.68, width * 0.27, height * 0.28, width * 0.55, height * 0.68); // 繪製左側雪山
  triangle(width * 0.38, height * 0.68, width * 0.7, height * 0.24, width, height * 0.68); // 繪製右側雪山
  fill(255, 255, 255, 210); // 設定雪花顏色
  for (let i = 0; i < 34; i += 1) ellipse((i * 97 + frameCount * 0.35) % width, (i * 61 + frameCount * 0.55) % height, 5, 5); // 繪製飄落雪花
} // 完成雪地背景

function drawDesertScene() { // 繪製沙漠背景場景
  noStroke(); // 移除沙漠裝飾外框
  fill("#d99b55"); // 設定沙漠地面顏色
  rect(0, height * 0.67, width, height * 0.33); // 繪製沙地
  fill("#e9b96e"); // 設定沙丘顏色
  ellipse(width * 0.2, height * 0.78, width * 0.8, height * 0.3); // 繪製左側沙丘
  ellipse(width * 0.82, height * 0.8, width * 0.85, height * 0.33); // 繪製右側沙丘
  fill("#3d8b58"); // 設定仙人掌顏色
  rect(width * 0.11, height * 0.43, 18, height * 0.28, 8); // 繪製仙人掌主幹
  rect(width * 0.06, height * 0.53, 55, 13, 7); // 繪製仙人掌左側手臂
  rect(width * 0.28, height * 0.55, 14, height * 0.18, 7); // 繪製仙人掌右側主幹
  drawSunGlow(width * 0.83, height * 0.16, 52); // 繪製沙漠烈日
} // 完成沙漠背景

function drawRainforestScene() { // 繪製雨林背景場景
  noStroke(); // 移除雨林裝飾外框
  fill("#287a50"); // 設定雨林地面顏色
  rect(0, height * 0.66, width, height * 0.34); // 繪製雨林地面
  fill("#155d3b"); // 設定遠方雨林樹冠顏色
  for (let x = -40; x < width + 60; x += 120) ellipse(x, height * 0.45, 180, 220); // 繪製雨林樹冠
  stroke("#9bd36a"); // 設定藤蔓色彩
  strokeWeight(7); // 設定藤蔓線寬
  noFill(); // 將藤蔓設為線條
  for (let x = 20; x < width; x += 120) arc(x, height * 0.35, 85, height * 0.7, 0, HALF_PI); // 繪製垂掛藤蔓
  noStroke(); // 移除雨滴外框
  fill(225, 250, 240, 100); // 設定雨林光點色彩
  for (let i = 0; i < 26; i += 1) ellipse((i * 79) % width, (i * 53) % (height * 0.75), 8, 8); // 繪製雨林光點
} // 完成雨林背景

function drawCoastScene() { // 繪製海岸背景場景
  noStroke(); // 移除海岸裝飾外框
  fill("#45a9bd"); // 設定海水顏色
  rect(0, height * 0.57, width, height * 0.43); // 繪製海面
  fill("#f7e4ae"); // 設定沙灘顏色
  rect(0, height * 0.78, width, height * 0.22); // 繪製沙灘
  stroke(255, 255, 255, 180); // 設定浪花顏色
  strokeWeight(5); // 設定浪花線寬
  noFill(); // 將浪花設為線條
  for (let y = height * 0.63; y < height * 0.77; y += 30) arc(width * 0.45, y, width * 0.7, 28, PI, TWO_PI); // 繪製海浪
  noStroke(); // 移除海岸裝飾外框
  fill("#4d8c4a"); // 設定棕櫚樹色彩
  rect(width * 0.8, height * 0.27, 18, height * 0.5, 8); // 繪製棕櫚樹樹幹
  ellipse(width * 0.81, height * 0.25, 170, 42); // 繪製棕櫚樹葉
  drawSunGlow(width * 0.18, height * 0.16, 50); // 繪製海岸陽光
} // 完成海岸背景

function drawSunGlow(x, y, size) { // 繪製柔和太陽與光暈
  noStroke(); // 移除太陽外框
  fill(255, 220, 100, 50); // 設定太陽光暈色彩
  ellipse(x, y, size * 2.4, size * 2.4); // 繪製太陽光暈
  fill(255, 213, 79, 180); // 設定太陽本體色彩
  ellipse(x, y, size, size); // 繪製太陽本體
} // 完成太陽光暈

function drawSoftCloud(x, y, scaleValue, alphaValue) { // 繪製半透明自然雲朵
  noStroke(); // 移除雲朵外框
  fill(255, 255, 255, alphaValue); // 設定雲朵透明色彩
  ellipse(x, y, 100 * scaleValue, 42 * scaleValue); // 繪製雲朵底部
  ellipse(x - 36 * scaleValue, y + 2 * scaleValue, 58 * scaleValue, 38 * scaleValue); // 繪製雲朵左側
  ellipse(x + 31 * scaleValue, y - 8 * scaleValue, 67 * scaleValue, 54 * scaleValue); // 繪製雲朵右側
  ellipse(x + 3 * scaleValue, y - 23 * scaleValue, 70 * scaleValue, 62 * scaleValue); // 繪製雲朵中央
} // 完成自然雲朵

function shuffleArray(source) { // 建立不修改來源的隨機陣列
  const result = source.slice(); // 複製來源資料
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); const temporary = result[i]; result[i] = result[j]; result[j] = temporary; } // 使用 Fisher-Yates 演算法打亂資料
  return result; // 回傳隨機排列結果
} // 完成隨機排列
