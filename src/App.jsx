import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { ROLES, GREEN } from "./shared";
import { LoginScreen } from "./LoginScreen";
import { LogsTab } from "./tabs/LogsTab";
import { MembersTab } from "./tabs/MembersTab";
import { ProjectTab } from "./tabs/ProjectTab";
import { ProgressTab } from "./tabs/ProgressTab";

const TABS = [
  { id: "logs", label: "討論記錄" },
  { id: "members", label: "成員管理" },
  { id: "project", label: "專案資料" },
  { id: "progress", label: "申請進度" },
];

export default function App() {
  const [tab, setTab] = useState("logs");
  const [role, setRole] = useState(ROLES[0]);
  const [user, setUser] = useState(undefined); // undefined = 載入中
  const [appError, setAppError] = useState("");

  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);

  const showError = (msg) => {
    setAppError(msg);
    setTimeout(() => setAppError(""), 3500);
  };

  // 載入中
  if (user === undefined) {
    return (
      <div style={{
        fontFamily: '"Noto Sans TC", sans-serif',
        maxWidth: 720, margin: "0 auto", minHeight: "100vh",
        background: "#F5F5F3", display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
      }}>
        <div className="spinner" />
        <div style={{ color: "#aaa", fontSize: 13 }}>載入中…</div>
      </div>
    );
  }

  // 未登入
  if (!user) return <LoginScreen />;

  return (
    <div style={{ fontFamily: '"Noto Sans TC", -apple-system, system-ui, sans-serif', maxWidth: 720, margin: "0 auto", minHeight: "100vh", background: "#F5F5F3" }}>
      {/* Header */}
      <div style={{ background: GREEN, padding: "14px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#6FD4AA", marginBottom: 3 }}>老宅延壽機能復新計畫</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>專案管理後台</div>
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center", paddingTop: 4, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {ROLES.map(r => (
              <button key={r} onClick={() => setRole(r)} className="btn-press"
                style={{
                  fontSize: 12, padding: "5px 12px", borderRadius: 20,
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  background: role === r ? "rgba(255,255,255,0.95)" : "transparent",
                  color: role === r ? GREEN : "rgba(255,255,255,0.85)",
                  cursor: "pointer", fontFamily: "inherit",
                  fontWeight: role === r ? 700 : 400,
                  transition: "all .15s", whiteSpace: "nowrap",
                }}>
                {r}
              </button>
            ))}
            {/* 登出按鈕 */}
            <button onClick={() => signOut(auth)} className="btn-press"
              style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent", color: "rgba(255,255,255,0.5)",
                cursor: "pointer", fontFamily: "inherit",
              }}>
              登出
            </button>
          </div>
        </div>

        {/* Segment tab */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", borderRadius: "10px 10px 0 0", padding: "4px 4px 0" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="btn-press"
              style={{
                flex: 1, padding: "9px 6px", border: "none",
                borderRadius: tab === t.id ? "8px 8px 0 0" : 8,
                background: tab === t.id ? "#F5F5F3" : "transparent",
                color: tab === t.id ? GREEN : "rgba(255,255,255,0.65)",
                fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all .18s", whiteSpace: "nowrap",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 內容 — key 觸發切換動畫 */}
      <div key={tab} className="tab-pane" style={{ padding: "18px 16px 36px" }}>
        {tab === "logs" && <LogsTab role={role} onError={showError} />}
        {tab === "members" && <MembersTab onError={showError} />}
        {tab === "project" && <ProjectTab onError={showError} />}
        {tab === "progress" && <ProgressTab onError={showError} />}
      </div>

      {/* 全域錯誤 Toast */}
      {appError && (
        <div className="anim-toast" style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "#A32D2D", color: "#fff", padding: "11px 24px",
          borderRadius: 12, fontSize: 13, fontWeight: 700,
          zIndex: 9999, maxWidth: "88%", textAlign: "center",
          boxShadow: "0 6px 24px rgba(163,45,45,0.35)",
          letterSpacing: 0.3,
        }}>
          {appError}
        </div>
      )}
    </div>
  );
}
