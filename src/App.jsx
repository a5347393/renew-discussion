import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
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

const BG = "#EBEBЕ8"; // page background — sync with tab active color

export default function App() {
  const [tab, setTab] = useState("logs");
  const [role, setRole] = useState(ROLES[0]);
  const [user, setUser] = useState(undefined);
  const [appError, setAppError] = useState("");
  const [projectData, setProjectData] = useState(null);

  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);

  // 拉取專案資料顯示於 Header
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "project", "main"), snap => {
      if (snap.exists()) setProjectData(snap.data());
    });
  }, [user]);

  const showError = (msg) => {
    setAppError(msg);
    setTimeout(() => setAppError(""), 3500);
  };

  if (user === undefined) {
    return (
      <div style={{ fontFamily: '"Noto Sans TC", sans-serif', maxWidth: 720, margin: "0 auto", minHeight: "100vh", background: "#F5F5F3", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div className="spinner" />
        <div style={{ color: "#aaa", fontSize: 13 }}>載入中…</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const tabBg = "#F2F1EE";

  return (
    <div className="app-root" style={{ fontFamily: '"Noto Sans TC", -apple-system, system-ui, sans-serif', background: tabBg }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(150deg, #0d8a60 0%, #0A6647 45%, #074d34 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* 右上角裝飾光暈 */}
        <div style={{ position: "absolute", top: -40, right: -30, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 65%)", pointerEvents: "none" }} />
        {/* 左下角輔助光 */}
        <div style={{ position: "absolute", bottom: -20, left: 20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ padding: "18px 20px 0", position: "relative" }}>
          {/* 頭部資訊列 */}
          <div className="header-meta">
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 品牌標籤 */}
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 4, color: "rgba(255,255,255,0.38)", marginBottom: 6, textTransform: "uppercase" }}>
                Project Management
              </div>
              {/* 專案名稱 */}
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: -0.4, lineHeight: 1.15, marginBottom: 4 }}>
                老宅延壽機能復新計畫
              </div>
              {/* 動態地址 / 業主（有填才顯示） */}
              {(projectData?.address || projectData?.owner) ? (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.48)", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {projectData.address && <span>{projectData.address}</span>}
                  {projectData.address && projectData.owner && <span style={{ opacity: 0.4 }}>·</span>}
                  {projectData.owner && <span>{projectData.owner} 業主</span>}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>前往「專案資料」填寫基本資訊</div>
              )}
            </div>

            {/* 角色切換 + 登出 */}
            <div className="header-controls">
              {ROLES.map(r => (
                <button key={r} onClick={() => setRole(r)} className="btn-press"
                  style={{
                    fontSize: 11, padding: "4px 11px", borderRadius: 20,
                    border: `1.5px solid ${role === r ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.22)"}`,
                    background: role === r ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.07)",
                    color: role === r ? GREEN : "rgba(255,255,255,0.78)",
                    cursor: "pointer", fontFamily: "inherit",
                    fontWeight: role === r ? 700 : 400,
                    transition: "all .15s", whiteSpace: "nowrap",
                  }}>
                  {r}
                </button>
              ))}
              <button onClick={() => signOut(auth)} className="btn-press"
                style={{
                  fontSize: 10, padding: "4px 9px", borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "transparent", color: "rgba(255,255,255,0.3)",
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                登出
              </button>
            </div>
          </div>

          {/* Tab 導覽 */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.18)", borderRadius: "10px 10px 0 0", padding: "4px 4px 0" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className="btn-press"
                style={{
                  flex: 1, padding: "9px 6px", border: "none",
                  borderRadius: tab === t.id ? "8px 8px 0 0" : 8,
                  background: tab === t.id ? tabBg : "transparent",
                  color: tab === t.id ? GREEN : "rgba(255,255,255,0.58)",
                  fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all .18s", whiteSpace: "nowrap",
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab 內容 */}
      <div key={tab} className="tab-pane tab-content-area">
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
          boxShadow: "0 4px 8px rgba(163,45,45,0.2), 0 16px 32px rgba(163,45,45,0.25)",
          letterSpacing: 0.3,
        }}>
          {appError}
        </div>
      )}
    </div>
  );
}
