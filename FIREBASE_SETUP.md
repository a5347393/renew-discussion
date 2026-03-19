# Firebase 安全設定（上線前必做）

## 1. 啟用 Email/Password 登入

Firebase Console → Authentication → Sign-in method → Email/Password → 啟用

## 2. 新增使用者帳號

Firebase Console → Authentication → Users → 新增使用者

建議建立：
- 業主帳號：owner@yourproject.com
- 技師帳號：engineer@yourproject.com
- 設計師帳號：designer@yourproject.com

密碼自行設定，告知各成員。

## 3. 啟用 Firebase Storage

Firebase Console → Storage → 開始使用（選 production mode）

## 4. 更新 Firestore 安全規則

Firebase Console → Firestore Database → 規則 → 貼上以下內容：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 5. 更新 Storage 安全規則

Firebase Console → Storage → 規則 → 貼上以下內容：

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /discussions/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

## 6. 新增 GitHub Pages 網域到授權清單

Firebase Console → Authentication → Settings → 授權網域 → 新增：
`a5347393.github.io`

---

完成後：只有登入帳號的成員才能新增/編輯/刪除資料。
