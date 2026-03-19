import { useState, useEffect } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PROGRESS_ITEMS, STATUS_OPTS, STATUS_COLORS, GREEN, GREEN_LIGHT, inp } from "../shared";

export function ProgressTab() {
  const [progress, setProgress] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => onSnapshot(doc(db, "progress", "main"), snap => {
    if (snap.exists()) setProgress(snap.data());
  }), []);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 1800); };

  const update = async (id, field, value) => {
    const updated = { ...progress, [id]: { ...progress[id], [field]: value } };
    setProgress(updated);
    setSaving(true);
    try {
      await setDoc(doc(db, "progress", "main"), { ...updated, updatedAt: serverTimestamp() });
      showToast("已更新");
    } finally { setSaving(false); }
  };

  const doneCount = PROGRESS_ITEMS.filter(i => progress[i.id]?.status === "已完成").length;

  return (
    <div>
      {/* 進度摘要卡 */}
      <div style={{ background: "#fff", border: "1px solid #EDEDEA", borderRadius: 12, padding: "16px 18px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#444" }}>補助申請進度</span>
          <span style={{ fontSize: 13, color: GREEN, fontWeight: 700 }}>{doneCount} / {PROGRESS_ITEMS.length} 完成</span>
        </div>
        <div style={{ height: 6, background: "#F0EFE8", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${(doneCount / PROGRESS_ITEMS.length) * 100}%`,
            background: GREEN,
            borderRadius: 4,
            transition: "width .4s ease",
          }} />
        </div>
      </div>

      {/* 垂直 Timeline */}
      <div>
        {PROGRESS_ITEMS.map((item, idx) => {
          const st = progress[item.id]?.status || "未開始";
          const note = progress[item.id]?.note || "";
          const date = progress[item.id]?.date || "";
          const sc = STATUS_COLORS[st];
          const isDone = st === "已完成";
          const isActive = st === "進行中";
          const isLast = idx === PROGRESS_ITEMS.length - 1;

          return (
            <div key={item.id} style={{ display: "flex" }}>
              {/* 左側：圓圈 + 連線 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: isDone ? GREEN : isActive ? GREEN_LIGHT : "#F5F5F3",
                  border: `2px solid ${isDone ? GREEN : isActive ? GREEN : "#DDDDD8"}`,
                  color: isDone ? "#fff" : isActive ? GREEN : "#BBB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                  transition: "all .2s",
                  marginTop: 4,
                }}>
                  {isDone ? "✓" : idx + 1}
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 20,
                    background: isDone ? GREEN : "#EDEDEA",
                    margin: "4px 0 0",
                  }} />
                )}
              </div>

              {/* 右側：內容卡片 */}
              <div style={{ flex: 1, paddingLeft: 12, paddingBottom: isLast ? 4 : 16 }}>
                <div style={{ background: "#fff", border: "1px solid #EDEDEA", borderRadius: 10, padding: "12px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111", flex: 1 }}>{item.label}</span>
                    <select value={st} onChange={e => update(item.id, "status", e.target.value)}
                      style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, border: `1.5px solid ${sc.color}33`, background: sc.bg, color: sc.color, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, outline: "none" }}>
                      {STATUS_OPTS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                    <input value={note} onChange={e => update(item.id, "note", e.target.value)} placeholder="補充說明、待辦…" style={{ ...inp, fontSize: 12 }} />
                    <input type="date" value={date} onChange={e => update(item.id, "date", e.target.value)} style={{ ...inp, width: 130, fontSize: 12 }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: GREEN, color: "#fff", padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
