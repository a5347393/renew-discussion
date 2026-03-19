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
    <div style={{ fontFamily: "-apple-system, system-ui, sans-serif", maxWidth: 720, margin: "0 auto", minHeight: "100vh", paddingBottom: 60 }}>
      <div style={{ background: GREEN, padding: "16px 20px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, color: "#6FD4AA", marginBottom: 6 }}>老宅延壽機能復新計畫</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 2 }}>專案管理後台</div>
        <div style={{ fontSize: 12, color: "#A8E6CC", marginBottom: 14 }}>業主・技師・設計師 共用・Firebase 即時同步</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#6FD4AA" }}>身份：</span>
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)}
              style={{ fontSize: 12, padding: "4px 13px", borderRadius: 20, border: "1.5px solid rgba(255,255,255,0.3)", background: role === r ? "#fff" : "transparent", color: role === r ? GREEN : "rgba(255,255,255,0.8)", cursor: "pointer", fontFamily: "inherit", fontWeight: role === r ? 700 : 400, transition: "all .15s" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1.5px solid #e8e8e4", display: "flex", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ fontSize: 13, padding: "13px 18px", border: "none", borderBottom: `2.5px solid ${tab === t.id ? GREEN : "transparent"}`, background: "transparent", color: tab === t.id ? GREEN : "#888", cursor: "pointer", fontFamily: "inherit", fontWeight: tab === t.id ? 700 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "18px 16px" }}>
        {tab === "logs" && <LogsTab role={role} />}
        {tab === "members" && <MembersTab />}
        {tab === "project" && <ProjectTab />}
        {tab === "progress" && <ProgressTab />}
      </div>
    </div>
  );
}
