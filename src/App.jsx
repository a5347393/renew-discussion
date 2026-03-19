import { useState } from "react";
import { ROLES, GREEN } from "./shared";
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

  return (
    <div style={{ fontFamily: '"Noto Sans TC", -apple-system, system-ui, sans-serif', maxWidth: 720, margin: "0 auto", minHeight: "100vh", background: "#F5F5F3" }}>
      {/* Header */}
      <div style={{ background: GREEN, padding: "14px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#6FD4AA", marginBottom: 3 }}>老宅延壽機能復新計畫</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>專案管理後台</div>
          </div>
          {/* Role switcher */}
          <div style={{ display: "flex", gap: 5, alignItems: "center", paddingTop: 4, flexShrink: 0 }}>
            {ROLES.map(r => (
              <button key={r} onClick={() => setRole(r)}
                style={{
                  fontSize: 12, padding: "5px 12px", borderRadius: 20,
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  background: role === r ? "rgba(255,255,255,0.95)" : "transparent",
                  color: role === r ? GREEN : "rgba(255,255,255,0.85)",
                  cursor: "pointer", fontFamily: "inherit",
                  fontWeight: role === r ? 700 : 400,
                  transition: "all .15s",
                  whiteSpace: "nowrap",
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Segment tab — active tab merges into page background */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", borderRadius: "10px 10px 0 0", padding: "4px 4px 0" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: "9px 6px",
                border: "none",
                borderRadius: tab === t.id ? "8px 8px 0 0" : 8,
                background: tab === t.id ? "#F5F5F3" : "transparent",
                color: tab === t.id ? GREEN : "rgba(255,255,255,0.65)",
                fontSize: 12,
                fontWeight: tab === t.id ? 700 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all .15s",
                whiteSpace: "nowrap",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "18px 16px 36px" }}>
        {tab === "logs" && <LogsTab role={role} />}
        {tab === "members" && <MembersTab />}
        {tab === "project" && <ProjectTab />}
        {tab === "progress" && <ProgressTab />}
      </div>
    </div>
  );
}
