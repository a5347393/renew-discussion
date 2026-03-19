import { useState, useEffect } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PROGRESS_ITEMS, STATUS_OPTS, STATUS_COLORS, GREEN, inp } from "../shared";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#444" }}>補助申請進度</span>
        <span style={{ fontSize: 12, color: GREEN, fontWeight: 700 }}>{doneCount}/{PROGRESS_ITEMS.length} 完成</span>
      </div>
      <div style={{ height: 6, background: "#e8e8e4", borderRadius: 4, overflow: "hidden", marginBottom: 18 }}>
        <div style={{ height: "100%", width: `${(doneCount / PROGRESS_ITEMS.length) * 100}%`, background: GREEN, borderRadius: 4, transition: "width .3s" }} />
      </div>

      {PROGRESS_ITEMS.map((item, idx) => {
        const st = progress[item.id]?.status || "未開始";
        const note = progress[item.id]?.note || "";
        const date = progress[item.id]?.date || "";
        const sc = STATUS_COLORS[st];
        return (
          <div key={item.id} style={{ background: "#fff", border: "1.5px solid #e8e8e4", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: st === "已完成" ? GREEN : "#e8e8e4", color: st === "已完成" ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {st === "已完成" ? "✓" : idx + 1}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#111", flex: 1 }}>{item.label}</span>
              <select value={st} onChange={e => update(item.id, "status", e.target.value)}
                style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${sc.color}33`, background: sc.bg, color: sc.color, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, outline: "none" }}>
                {STATUS_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <input value={note} onChange={e => update(item.id, "note", e.target.value)} placeholder="補充說明、待辦…" style={{ ...inp, fontSize: 12 }} />
              <input type="date" value={date} onChange={e => update(item.id, "date", e.target.value)} style={{ ...inp, width: 140, fontSize: 12 }} />
            </div>
          </div>
        );
      })}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: GREEN, color: "#fff", padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
