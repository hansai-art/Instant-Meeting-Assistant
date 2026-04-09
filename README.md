# 即時會議助理

## 專案說明

即時會議助理是一套 Progressive Web App（PWA），可在會議進行中即時擷取音訊、產生逐字稿，並搭配 AI 產出摘要、重點整理與協作建議。你可以把它當成會議側錄、即時筆記與問答助手，在瀏覽器中直接使用，也能安裝成接近原生 App 的體驗。

## 技術組成

- 前端：React、TypeScript、Next.js、Tailwind CSS、Shadcn/UI
- 後端：Node.js
- API：Deepgram（即時語音轉寫）、Google Generative AI（AI 回應生成）
- PWA：Service Worker、Web App Manifest

## 安裝與啟動

### 環境需求

- Node.js 20 以上
- pnpm（也可改用 npm / yarn，但專案預設使用 pnpm）
- API 金鑰：
  - Deepgram API Key
  - Google Generative AI API Key

### 安裝步驟

1. 下載專案：

   ```bash
   git clone https://github.com/hansai-art/Instant-Meeting-Assistant.git
   cd Instant-Meeting-Assistant
   ```

2. 安裝相依套件：

   ```bash
   pnpm install
   ```

3. 建立 `.env.local`：

   ```env
   DEEPGRAM_API_KEY=your_deepgram_api_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
   ```

4. 啟動開發伺服器：

   ```bash
   pnpm dev
   ```

5. 在瀏覽器開啟 `http://localhost:3000`

## 頁面詳細教學

### 1. 首頁總覽

首頁主要分成四個區塊：

- **會議背景與需求說明**：輸入議程、角色、目標、限制與你想請 AI 協助的方向。
- **即時逐字稿**：開始擷取音訊後，會顯示附帶時間戳記的逐字稿內容。
- **模式切換與 AI 回應**：可在摘要模式與協作模式間切換，再請 AI 產出內容。
- **右上角 AI 問答框**：用來快速追問細節、補充觀念或索取建議。

### 2. 建議操作流程

1. 先在「會議背景與需求說明」填入本次討論的脈絡。
2. 點擊「開始擷取會議音訊」並選擇正確的頁面或系統音訊來源。
3. 確認右下角狀態顯示已連線，等待逐字稿開始更新。
4. 視需求切換為「摘要模式」或「協作模式」。
5. 點擊「產生回應」取得 AI 內容。
6. 若內容值得保留，按下「儲存到紀錄」以便稍後回顧。

### 3. 模式說明

- **摘要模式**：適合快速整理討論重點、待辦事項、決策結論與會後摘要。
- **協作模式**：適合需要即時建議、回覆草稿、追問方向或下一步行動方案時使用。

### 4. AI 問答框教學

右上角浮動的 AI 問答框提供快速追問能力：

1. 直接輸入問題。
2. 按 Enter 或送出按鈕取得回答。
3. 可拖曳標題列改變位置。
4. 可收合面板，避免遮住主要畫面。
5. 若想清除目前回答，可按 `Esc`。

### 5. 紀錄區說明

每次儲存後，內容會保留在頁面下方的紀錄區。你可以：

- 快速重看先前產生的摘要或建議
- 用來整理會議結論
- 視需要刪除不再使用的紀錄

## 快捷鍵

為了讓會議中操作更快速，首頁支援以下快捷鍵：

- `K`：聚焦右上角 AI 問答輸入框
- `S`：切換到摘要模式
- `C`：切換到協作模式
- `Enter`：在沒有聚焦輸入框時送出主表單
- `Esc`：清除 AI 問答框目前回答

> 注意：當游標位於輸入框或多行文字框內時，快捷鍵會自動停用，避免影響正常輸入。

## API 路由

- `POST /api/completion`：產生 AI 回應
- `POST /api/deepgram`：建立 Deepgram 臨時金鑰

## 參與貢獻

歡迎提交 Issue 或 Pull Request。若要參與開發，請參考 `CONTRIBUTING.md`。

## 授權

本專案採用儲存庫內 `LICENSE` 所列授權條款。
