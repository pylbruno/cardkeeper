# CardKeeper 部署說明

請依照以下步驟操作，大約 10 分鐘完成。

## 步驟一：安裝 Node.js
前往 https://nodejs.org 下載並安裝「LTS」版本。

## 步驟二：解壓縮這個資料夾
將 cardkeeper.zip 解壓縮到你想要的位置。

## 步驟三：安裝套件
打開終端機（Terminal / 命令提示字元），輸入：
```
cd cardkeeper
npm install
```

## 步驟四：測試（選用）
```
npm run dev
```
用瀏覽器開啟 http://localhost:5173 確認正常運作。

## 步驟五：部署到 Vercel
1. 前往 https://vercel.com 免費註冊帳號
2. 點擊「Add New → Project」
3. 選擇「Import Third-Party Git Repository」
   （或直接用 Vercel CLI：npm i -g vercel → vercel）
4. 更簡單的方式：把整個資料夾拖曳到 https://vercel.com/new 上傳
5. 部署完成後會得到網址，例如 https://cardkeeper-xxx.vercel.app

## 步驟六：加入 iPhone 主畫面
1. 用 Safari 開啟你的 Vercel 網址
2. 點下方「分享」按鈕（方塊加箭頭圖示）
3. 點「加入主畫面」
4. 完成！像 App 一樣使用

## 注意
- AI 刷卡優惠搜尋功能需要 Anthropic API Key
- 在 Vercel 專案設定 → Environment Variables 加入：
  VITE_ANTHROPIC_KEY=你的API金鑰
