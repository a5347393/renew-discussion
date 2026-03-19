import { useState, useEffect } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PROJECT_FIELDS, GREEN, inp } from "../shared";

export function ProjectTab() {
  const [project, setProject] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => onSnapshot(doc(db, "project", "main"), snap => {
    if (snap.exists()) { setProject(snap.data()); setForm(snap.data()); }
    else setEditing(true);
  }), []);

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "project", "main"), { ...form, updatedAt: serverTimestamp() });
      setEditing(false);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#444" }}>專案基本資料</span>
        {!editing && project && (
          <button onClick={() => setEditing(true)} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${GREEN}`, background: "transparent", color: GREEN, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
            編輯
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ background: "#fff", border: "1px solid #EDEDEA", borderRadius: 12, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px", marginBottom: 14 }}>
            {PROJECT_FIELDS.map(f => (
              <div key={f.key} style={{ gridColumn: f.full ? "1/-1" : undefined }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{f.label}</div>
                {f.full
                  ? <textarea value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={2} placeholder={f.ph} style={{ ...inp, resize: "vertical" }} />
                  : <input value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} style={inp} />}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {project && (
              <button onClick={() => setEditing(false)} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e8e8e4", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>取消</button>
            )}
            <button onClick={save} disabled={saving}
              style={{ fontSize: 13, padding: "8px 20px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
              {saving ? "儲存中…" : "儲存"}
            </button>
          </div>
        </div>
      ) : project ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {PROJECT_FIELDS.filter(f => project[f.key]).map(f => (
            <div key={f.key} style={{ background: "#fff", border: "1px solid #EDEDEA", borderRadius: 10, padding: "13px 14px", gridColumn: f.full ? "1/-1" : undefined, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{project[f.key]}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 40, color: "#bbb", fontSize: 13 }}>尚未填寫專案資料</div>
      )}
    </div>
  );
}
