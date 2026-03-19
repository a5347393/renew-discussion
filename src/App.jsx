import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, orderBy, query, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Constants ────────────────────────────────────────────────
const STAGES = ["初步評估", "設計規劃", "申請送件", "施工中", "驗收完成"];
const TAGS = ["結構", "預算", "設計", "施工", "法規", "其他"];
const ROLES = ["業主", "王技師", "李設計師"];

const TAG_STYLES = {
  結構: { bg: "#FEF3E6", color: "#9C4B00", border: "#9C4B0044" },
  預算: { bg: "#E8F7F1", color: "#0A6647", border: "#0A664444" },
  設計: { bg: "#F2EEFF", color: "#5B2FA0", border: "#5B2FA044" },
  施工: { bg: "#EBF4FF", color: "#185FA5", border: "#185FA544" },
  法規: { bg: "#FCEBEB", color: "#A32D2D", border: "#A32D2D44" },
  其他: { bg: "#F1EFE8", color: "#5F5E5A", border: "#5F5E5A44" },
};

const EMPTY_FORM = { date: "", stage: "初步評估", author: "", tag: "其他", content: "" };

// ── Helpers ──────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function TagPill({ tag, small }) {
  const s = TAG_STYLES[tag] || TAG_STYLES["其他"];
  return (
    <span style={{
      fontSize: small ? 10 : 11, padding: small ? "1px 7px" : "2px 9px",
      borderRadius: 20, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>{tag}</span>
  );
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(ROLES[0]);
  const [filter, setFilter] = useState("全部");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, date: today(), author: ROLES[0] });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState("");
  const [search, setSearch] = useState("");

  // ── Firebase realtime listener
  useEffect(() => {
    const q = query(collection(db, "logs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Notify helper
  const showNotify = (msg) => {
    setNotify(msg);
    setTimeout(() => setNotify(""), 2200);
  };

  // ── Role switch
  const switchRole = (r) => {
    setRole(r);
    setForm(p => ({ ...p, author: r }));
  };

  // ── Form open/close
  const openForm = (log = null) => {
    if (log) {
      setEditId(log.id);
      setForm({ date: log.date, stage: log.stage, author: log.author, tag: log.tag, content: log.content });
    } else {
      setEditId(null);
      setForm({ ...EMPTY_FORM, date: today(), author: role });
    }
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditId(null); };

  // ── Save
  const saveLog = async () => {
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "logs", editId), {
          date: form.date, stage: form.stage,
          author: form.author, tag: form.tag, content: form.content,
          updatedAt: serverTimestamp(),
        });
        showNotify("記錄已更新");
      } else {
        await addDoc(collection(db, "logs"), {
          ...form, createdAt: serverTimestamp(),
        });
        showNotify("記錄已儲存");
      }
      closeForm();
    } catch (e) {
      console.error(e);
      showNotify("儲存失敗，請重試");
    } finally { setSaving(false); }
  };

  // ── Delete
  const deleteLog = async (id) => {
    if (!confirm("確定刪除這筆記錄？")) return;
    await deleteDoc(doc(db, "logs", id));
    showNotify("已刪除");
  };

  // ── Filter + search
  const filtered = logs.filter(l => {
    const stageOk = filter === "全部" || l.stage === filter;
    const searchOk = !search || l.content?.includes(search) || l.author?.includes(search);
    return stageOk && searchOk;
  });

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = logs.filter(l => l.stage === s).length;
    return acc;
  }, {});

  // ── Styles
  const inp = {
    width: "100%", border: "1.5px solid #e8e8e4", borderRadius: 8,
    padding: "8px 11px", fontSize: 13, fontFamily: "inherit",
    background: "#fff", color: "#111", outline: "none",
  };

  return (
    <div style={{ fontFamily: "-apple-system, system-ui, sans-serif", maxWidth: 720, margin: "0 auto", minHeight: "100vh", paddingBottom: 60 }}>

      {/* ── Header */}
      <div style={{ background: "#0A6647", padding: "16px 20px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, color: "#6FD4AA", marginBottom: 6 }}>老宅延壽機能復新計畫</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>專案討論記錄</div>
            <div style={{ fontSize: 12, color: "#A8E6CC", marginTop: 2 }}>業主・技師・設計師 共用後台・即時同步</div>
          </div>
          <button onClick={() => formOpen ? closeForm() : openForm()}
            style={{ background: formOpen ? "rgba(255,255,255,0.15)" : "#fff", color: formOpen ? "#fff" : "#0A6647", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {formOpen ? "✕ 取消" : "+ 新增記錄"}
          </button>
        </div>

        {/* Role selector */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#6FD4AA" }}>目前身份：</span>
          {ROLES.map(r => (
            <button key={r} onClick={() => switchRole(r)}
              style={{ fontSize: 12, padding: "5px 14px", borderRadius: 20, border: "1.5px solid rgba(255,255,255,0.3)", background: role === r ? "#fff" : "transparent", color: role === r ? "#0A6647" : "rgba(255,255,255,0.75)", cursor: "pointer", fontFamily: "inherit", fontWeight: role === r ? 700 : 400, transition: "all .15s" }}>
              {r}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#6FD4AA" }}>
            {loading ? "連線中…" : `${logs.length} 筆記錄`}
          </span>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>

        {/* ── New / Edit form */}
        {formOpen && (
          <div style={{ background: "#fff", border: "1.5px solid #0A664444", borderRadius: 12, padding: 18, marginBottom: 18, boxShadow: "0 2px 16px #0A664318" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0A6647", letterSpacing: 2, marginBottom: 16 }}>
              {editId ? "編輯記錄" : "新增討論記錄"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 500 }}>日期</div>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 500 }}>階段</div>
                <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 500 }}>發言人</div>
                <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                  placeholder="姓名或角色" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 500 }}>標籤</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TAGS.map(t => {
                    const s = TAG_STYLES[t];
                    const on = form.tag === t;
                    return (
                      <button key={t} onClick={() => setForm(p => ({ ...p, tag: t }))}
                        style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${on ? s.color : "#e8e8e4"}`, background: on ? s.bg : "#fff", color: on ? s.color : "#888", cursor: "pointer", fontFamily: "inherit", fontWeight: on ? 700 : 400, transition: "all .12s" }}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 500 }}>記錄內容</div>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={5} placeholder="記錄討論重點、決定事項、待確認問題、附圖說明…"
                style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={closeForm}
                style={{ fontSize: 13, padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e8e8e4", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>
                取消
              </button>
              <button onClick={saveLog} disabled={!form.content.trim() || saving}
                style={{ fontSize: 13, padding: "9px 22px", borderRadius: 8, border: "none", background: form.content.trim() && !saving ? "#0A6647" : "#ccc", color: "#fff", cursor: form.content.trim() && !saving ? "pointer" : "default", fontFamily: "inherit", fontWeight: 700 }}>
                {saving ? "儲存中…" : editId ? "更新記錄" : "儲存記錄"}
              </button>
            </div>
          </div>
        )}

        {/* ── Stage chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
          {["全部", ...STAGES].map(s => {
            const cnt = s === "全部" ? logs.length : stageCounts[s];
            const active = filter === s;
            const has = s !== "全部" && cnt > 0;
            return (
              <button key={s} onClick={() => setFilter(s)}
                style={{ fontSize: 12, padding: "5px 13px", borderRadius: 20, border: `1.5px solid ${active ? "#0A6647" : has ? "#0A664444" : "#e8e8e4"}`, background: active ? "#0A6647" : has ? "#E8F7F1" : "#fff", color: active ? "#fff" : has ? "#0A6647" : "#aaa", cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 700 : 400, whiteSpace: "nowrap", flexShrink: 0, transition: "all .15s" }}>
                {s}{cnt > 0 ? ` (${cnt})` : ""}
              </button>
            );
          })}
        </div>

        {/* ── Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜尋記錄內容或發言人…"
            style={{ ...inp, paddingLeft: 36 }} />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#bbb" }}>⌕</span>
          {search && <button onClick={() => setSearch("")}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#bbb", fontFamily: "inherit" }}>×</button>}
        </div>

        {/* ── Filter info */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#888" }}>
            {filter === "全部" ? `共 ${filtered.length} 筆` : `${filter} · ${filtered.length} 筆`}
            {search ? ` · 搜尋「${search}」` : ""}
          </span>
          {(filter !== "全部" || search) && (
            <button onClick={() => { setFilter("全部"); setSearch(""); }} style={{ fontSize: 12, color: "#0A6647", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>清除篩選 ×</button>
          )}
        </div>

        {/* ── Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa", fontSize: 13 }}>連接 Firebase 中…</div>
        )}

        {/* ── Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb", fontSize: 13 }}>
            {search ? `找不到「${search}」的相關記錄` : "尚無記錄，點「+ 新增記錄」開始"}
          </div>
        )}

        {/* ── Log cards */}
        {filtered.map(log => {
          const ts = TAG_STYLES[log.tag] || TAG_STYLES["其他"];
          return (
            <div key={log.id} style={{ background: "#fff", border: "1.5px solid #e8e8e4", borderRadius: 12, padding: "14px 16px", marginBottom: 10, transition: "border-color .15s", borderLeft: `4px solid ${ts.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0A6647" }}>{log.stage}</span>
                <TagPill tag={log.tag} small />
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#bbb" }}>{log.date}</span>
              </div>

              {log.author && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "#f5f5f3", color: "#666" }}>{log.author}</span>
                </div>
              )}

              <div style={{ fontSize: 13, color: "#222", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{log.content}</div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button onClick={() => openForm(log)}
                  style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#555", cursor: "pointer", fontFamily: "inherit", transition: "all .12s" }}>
                  編輯
                </button>
                <button onClick={() => deleteLog(log.id)}
                  style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#555", cursor: "pointer", fontFamily: "inherit", transition: "all .12s" }}>
                  刪除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Toast notify */}
      {notify && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#0A6647", color: "#fff", padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 999, boxShadow: "0 4px 16px #0005" }}>
          {notify}
        </div>
      )}
    </div>
  );
}
