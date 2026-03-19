# 老宅延壽機能復新計畫 — 專案討論記錄

> 業主・技師・設計師 共用後台，Firebase 即時同步

🌐 **線上使用：[a5347393.github.io/renew-discussion](https://a5347393.github.io/renew-discussion/)**

---

## 功能

- 新增 / 編輯 / 刪除討論記錄
- 依專案階段篩選（初步評估 / 設計規劃 / 申請送件 / 施工中 / 驗收完成）
- 記錄標籤（結構 / 預算 / 設計 / 施工 / 法規 / 其他）
- 搜尋內容或發言人
- 身份切換（業主 / 技師 / 設計師），新增時自動帶入
- Firebase Firestore 即時同步，多人同時操作
- 手機電腦皆支援

## 技術

- React 18 + Vite 5
- Firebase Firestore（即時資料庫）
- GitHub Actions 自動部署

## 本地開發

```bash
npm install
npm run dev
```
