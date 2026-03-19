import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, orderBy, query, serverTimestamp, setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const STAGES = ["初步評估", "設計規劃", "申請送件", "施工中", "驗收完成"];
const TAGS = ["結構", "預算", "設計", "施工", "法規", "其他"];
const ROLES = ["業主", "技師", "設計師"];
const SPECIALTIES = ["結構安全", "防水隔熱", "水電管線", "室內設計", "無障礙設施", "申請流程"];
const GREEN = "#0A6647";
const GREEN_LIGHT = "#E8F7F1";

const TAG_STYLES = {
  結構: { bg: "#FEF3E6", color: "#9C4B00", border: "#9C4B0033" },
  預算: { bg: "#E8F7F1", color: "#0A6647", border: "#0A664433" },
  設計: { bg: "#F2EEFF", color: "#5B2FA0", border: "#5B2FA033" },
  施工: { bg: "#EBF4FF", color: "#185FA5", border: "#185FA533" },
  法規: { bg: "#FCEBEB", color: "#A32D2D", border: "#A32D2D33" },
  其他: { bg: "#F1EFE8", color: "#5F5E5A", border: "#5F5E5A33" },
};

const PROGRESS_ITEMS = [
  { id: "eval", label: "結構安全性能評估" },
  { id: "apply_city", label: "向地方政府申請" },
  { id: "review", label: "地方政府審查核准" },
  { id: "construction", label: "施工（1年內完工）" },
  { id: "submit_docs", label: "送審理備查" },
  { id: "claim", label: "向地方政府請款" },
];

const STATUS_OPTS = ["未開始", "進行中", "已完成", "待確認"];
const STATUS_COLORS = {
  未開始: { bg: "#F1EFE8", color: "#888" },
  進行中: { bg: "#EBF4FF", color: "#185FA5" },
  已完成: { bg: GREEN_LIGHT, color: GREEN },
  待確認: { bg: "#FEF3E6", color: "#9C4B00" },
};

const ROLE_COLORS = {
  技師: { bg: "#EBF4FF", color: "#185FA5" },
  設計師: { bg: "#F2EEFF", color: "#5B2FA0" },
  業主: { bg: GREEN_LIGHT, color: GREEN },
};

const PROJECT_FIELDS = [
  { key: "owner", label: "業主姓名", ph: "姓名" },
  { key: "owner_phone", label: "業主電話", ph: "0912-345-678" },
  { key: "address", label: "房屋地址", ph: "縣市區路段號" },
  { key: "age", label: "屋齡（年）", ph: "35" },
  { key: "floors", label: "樓層數", ph: "3" },
  { key: "area", label: "建坪（㎡）", ph: "120" },
  { key: "budget", label: "整體預算（萬）", ph: "200" },
  { key: "id_no", label: "建號／地號", ph: "地籍資訊" },
  { key: "target_date", label: "預計完工", ph: "2026-06" },
  { key: "note", label: "其他備註", ph: "特殊狀況…", full: true },
];

function today() { return new Date().toISOString().slice(0, 10); }

const inp = {
  width: "100%", border: "1.5px solid #e8e8e4", borderRadius: 8,
  padding: "8px 11px", fontSize: 13, fontFamily: "inherit",
  background: "#fff", color: "#111", outline: "none",
};

function TagPill({ tag }) {
  const s = TAG_STYLES[tag] || TAG_STYLES["其他"];
  return <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{tag}</span>;
}

// ── 討論記錄 ──────────────────────────────────────────────────
function LogsTab({ role }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ date: today(), stage: "初步評估", author: role, tag: "其他", content: "" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "logs"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => { setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
  }, []);

  useEffect(() => { setForm(p => ({ ...p, author: role })); }, [role]);

  const openForm = (log = null) => {
    setEditId(log?.id || null);
    setForm(log ? { date: log.date, stage: log.stage, author: log.author, tag: log.tag, content: log.content }
      : { date: today(), stage: "初步評估", author: role, tag: "其他", content: "" });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      if (editId) await updateDoc(doc(db, "logs", editId), { ...form, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, "logs"), { ...form, createdAt: serverTimestamp() });
      setFormOpen(false); setEditId(null);
    } finally { setSaving(false); }
  };

  const del = async (id) => { if (confirm("確定刪除？")) await deleteDoc(doc(db, "logs", id)); };

  const stageCounts = STAGES.reduce((a, s) => ({ ...a, [s]: logs.filter(l => l.stage === s).length }), {});
  const filtered = logs.filter(l => (filter === "全部" || l.stage === filter) && (!search || l.content?.includes(search) || l.author?.includes(search)));

  return (
    <div>
      {formOpen && (
        <div style={{ background: "#fff", border: "1.5px solid #0A664433", borderRadius: 12, padding: 18, marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: 2, marginBottom: 14 }}>{editId ? "編輯記錄" : "新增討論記錄"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px", marginBottom: 12 }}>
            <div><div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>日期</div><input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} /></div>
            <div><div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>階段</div>
              <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>發言人</div><input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} style={inp} /></div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>標籤</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {TAGS.map(t => { const s = TAG_STYLES[t]; const on = form.tag === t; return <button key={t} onClick={() => setForm(p => ({ ...p, tag: t }))} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, border: `1.5px solid ${on ? s.color : "#e8e8e4"}`, background: on ? s.bg : "#fff", color: on ? s.color : "#888", cursor: "pointer", fontFamily: "inherit", fontWeight: on ? 700 : 400 }}>{t}</button>; })}
              </div>
            </div>
          </div>
          <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={4} placeholder="記錄討論重點、決定事項…" style={{ ...inp, resize: "vertical", lineHeight: 1.7, marginBottom: 12 }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => { setFormOpen(false); setEditId(null); }} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e8e8e4", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>取消</button>
            <button onClick={save} disabled={!form.content.trim() || saving} style={{ fontSize: 13, padding: "8px 20px", borderRadius: 8, border: "none", background: form.content.trim() ? GREEN : "#ccc", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>{saving ? "儲存中…" : editId ? "更新" : "儲存"}</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}>
        {["全部", ...STAGES].map(s => { const cnt = s === "全部" ? logs.length : stageCounts[s]; const active = filter === s; const has = s !== "全部" && cnt > 0; return <button key={s} onClick={() => setFilter(s)} style={{ fontSize: 11, padding: "4px 11px", borderRadius: 20, border: `1.5px solid ${active ? GREEN : has ? "#0A664433" : "#e8e8e4"}`, background: active ? GREEN : has ? GREEN_LIGHT : "#fff", color: active ? "#fff" : has ? GREEN : "#aaa", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, fontWeight: active ? 700 : 400 }}>{s}{cnt > 0 ? ` (${cnt})` : ""}</button>; })}
      </div>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋內容或發言人…" style={{ ...inp, paddingLeft: 34 }} />
        <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#bbb" }}>⌕</span>
        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#bbb" }}>×</button>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "#888" }}>{filter === "全部" ? `共 ${filtered.length} 筆` : `${filter} · ${filtered.length} 筆`}</span>
        {(filter !== "全部" || search) && <button onClick={() => { setFilter("全部"); setSearch(""); }} style={{ fontSize: 12, color: GREEN, background: "none", border: "none", cursor: "pointer" }}>清除 ×</button>}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>載入中…</div>}
      {!loading && filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#bbb", fontSize: 13 }}>尚無記錄</div>}

      {filtered.map(log => { const ts = TAG_STYLES[log.tag] || TAG_STYLES["其他"]; return (
        <div key={log.id} style={{ background: "#fff", border: "1.5px solid #e8e8e4", borderLeft: `4px solid ${ts.color}`, borderRadius: 12, padding: "13px 15px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 7 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>{log.stage}</span>
            <TagPill tag={log.tag} />
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#bbb" }}>{log.date}</span>
          </div>
          {log.author && <span style={{ fontSize: 11, padding: "1px 9px", borderRadius: 20, background: "#f5f5f3", color: "#666", display: "inline-block", marginBottom: 8 }}>{log.author}</span>}
          <div style={{ fontSize: 13, color: "#222", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{log.content}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 10 }}>
            <button onClick={() => openForm(log)} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#555", cursor: "pointer", fontFamily: "inherit" }}>編輯</button>
            <button onClick={() => del(log.id)} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#A32D2D", cursor: "pointer", fontFamily: "inherit" }}>刪除</button>
          </div>
        </div>
      ); })}

      {!formOpen && <button onClick={() => openForm()} style={{ width: "100%", padding: 12, borderRadius: 10, border: `1.5px dashed ${GREEN}`, background: "transparent", color: GREEN, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>+ 新增討論記錄</button>}
    </div>
  );
}

// ── 成員管理 ──────────────────────────────────────────────────
function MembersTab() {
  const [members, setMembers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "技師", phone: "", email: "", specialty: [], note: "" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => onSnapshot(collection(db, "members"), snap => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))), []);

  const openForm = (m = null) => {
    setEditId(m?.id || null);
    setForm(m ? { name: m.name || "", role: m.role || "技師", phone: m.phone || "", email: m.email || "", specialty: m.specialty || [], note: m.note || "" }
      : { name: "", role: "技師", phone: "", email: "", specialty: [], note: "" });
    setFormOpen(true);
  };

  const toggleSpec = s => setForm(p => ({ ...p, specialty: p.specialty.includes(s) ? p.specialty.filter(x => x !== s) : [...p.specialty, s] }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) await updateDoc(doc(db, "members", editId), { ...form, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, "members"), { ...form, createdAt: serverTimestamp() });
      setFormOpen(false); setEditId(null);
    } finally { setSaving(false); }
  };

  const del = async id => { if (confirm("確定刪除此成員？")) await deleteDoc(doc(db, "members", id)); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#444" }}>成員名單 ({members.length})</span>
        {!formOpen && <button onClick={() => openForm()} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${GREEN}`, background: "transparent", color: GREEN, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>+ 新增</button>}
      </div>

      {formOpen && (
        <div style={{ background: "#fff", border: "1.5px solid #0A664433", borderRadius: 12, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: 2, marginBottom: 14 }}>{editId ? "編輯成員" : "新增成員"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px", marginBottom: 12 }}>
            <div><div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>姓名</div><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="王大明" style={inp} /></div>
            <div><div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>身份</div>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                <option>技師</option><option>設計師</option><option>業主</option>
              </select>
            </div>
            <div><div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>電話</div><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="0912-345-678" style={inp} /></div>
            <div><div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Email</div><input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="example@mail.com" style={inp} /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>專長</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SPECIALTIES.map(s => { const on = form.specialty.includes(s); return <button key={s} onClick={() => toggleSpec(s)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${on ? GREEN : "#e8e8e4"}`, background: on ? GREEN_LIGHT : "#fff", color: on ? GREEN : "#888", cursor: "pointer", fontFamily: "inherit", fontWeight: on ? 700 : 400 }}>{s}</button>; })}
            </div>
          </div>
          <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} rows={2} placeholder="執照號碼、負責區域…" style={{ ...inp, resize: "vertical", marginBottom: 12 }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => { setFormOpen(false); setEditId(null); }} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e8e8e4", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>取消</button>
            <button onClick={save} disabled={!form.name.trim() || saving} style={{ fontSize: 13, padding: "8px 20px", borderRadius: 8, border: "none", background: form.name.trim() ? GREEN : "#ccc", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>{saving ? "儲存中…" : editId ? "更新" : "儲存"}</button>
          </div>
        </div>
      )}

      {members.length === 0 && !formOpen && <div style={{ textAlign: "center", padding: 40, color: "#bbb", fontSize: 13 }}>尚無成員</div>}

      {members.map(m => { const rc = ROLE_COLORS[m.role] || ROLE_COLORS["技師"]; return (
        <div key={m.id} style={{ background: "#fff", border: "1.5px solid #e8e8e4", borderLeft: `4px solid ${rc.color}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: rc.bg, color: rc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{(m.name || "?").slice(0, 1)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{m.name}</span>
                <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 20, background: rc.bg, color: rc.color, fontWeight: 600 }}>{m.role}</span>
              </div>
              {(m.phone || m.email) && <div style={{ fontSize: 12, color: "#666", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>{m.phone && <span>📞 {m.phone}</span>}{m.email && <span>✉ {m.email}</span>}</div>}
              {m.specialty?.length > 0 && <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>{m.specialty.map(s => <span key={s} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: GREEN_LIGHT, color: GREEN, border: `1px solid ${GREEN}33` }}>{s}</span>)}</div>}
              {m.note && <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>{m.note}</div>}
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => openForm(m)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#555", cursor: "pointer", fontFamily: "inherit" }}>編輯</button>
              <button onClick={() => del(m.id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#A32D2D", cursor: "pointer", fontFamily: "inherit" }}>刪除</button>
            </div>
          </div>
        </div>
      ); })}
    </div>
  );
}

// ── 專案資料 ──────────────────────────────────────────────────
function ProjectTab() {
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
    try { await setDoc(doc(db, "project", "main"), { ...form, updatedAt: serverTimestamp() }); setEditing(false); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#444" }}>專案基本資料</span>
        {!editing && project && <button onClick={() => setEditing(true)} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${GREEN}`, background: "transparent", color: GREEN, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>編輯</button>}
      </div>

      {editing ? (
        <div style={{ background: "#fff", border: "1.5px solid #0A664433", borderRadius: 12, padding: 18 }}>
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
            {project && <button onClick={() => setEditing(false)} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e8e8e4", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>取消</button>}
            <button onClick={save} disabled={saving} style={{ fontSize: 13, padding: "8px 20px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>{saving ? "儲存中…" : "儲存"}</button>
          </div>
        </div>
      ) : project ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {PROJECT_FIELDS.filter(f => project[f.key]).map(f => (
            <div key={f.key} style={{ background: "#fff", border: "1.5px solid #e8e8e4", borderRadius: 10, padding: "12px 14px", gridColumn: f.full ? "1/-1" : undefined }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{project[f.key]}</div>
            </div>
          ))}
        </div>
      ) : <div style={{ textAlign: "center", padding: 40, color: "#bbb", fontSize: 13 }}>尚未填寫專案資料</div>}
    </div>
  );
}

// ── 申請進度 ──────────────────────────────────────────────────
function ProgressTab() {
  const [progress, setProgress] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => onSnapshot(doc(db, "progress", "main"), snap => { if (snap.exists()) setProgress(snap.data()); }), []);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 1800); };

  const update = async (id, field, value) => {
    const updated = { ...progress, [id]: { ...progress[id], [field]: value } };
    setProgress(updated);
    setSaving(true);
    try { await setDoc(doc(db, "progress", "main"), { ...updated, updatedAt: serverTimestamp() }); showToast("已更新"); }
    finally { setSaving(false); }
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
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: st === "已完成" ? GREEN : "#e8e8e4", color: st === "已完成" ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{st === "已完成" ? "✓" : idx + 1}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#111", flex: 1 }}>{item.label}</span>
              <select value={st} onChange={e => update(item.id, "status", e.target.value)} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${sc.color}33`, background: sc.bg, color: sc.color, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, outline: "none" }}>
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
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: GREEN, color: "#fff", padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 999 }}>{toast}</div>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
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
            <button key={r} onClick={() => setRole(r)} style={{ fontSize: 12, padding: "4px 13px", borderRadius: 20, border: "1.5px solid rgba(255,255,255,0.3)", background: role === r ? "#fff" : "transparent", color: role === r ? GREEN : "rgba(255,255,255,0.8)", cursor: "pointer", fontFamily: "inherit", fontWeight: role === r ? 700 : 400, transition: "all .15s" }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1.5px solid #e8e8e4", display: "flex", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ fontSize: 13, padding: "13px 18px", border: "none", borderBottom: `2.5px solid ${tab === t.id ? GREEN : "transparent"}`, background: "transparent", color: tab === t.id ? GREEN : "#888", cursor: "pointer", fontFamily: "inherit", fontWeight: tab === t.id ? 700 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>{t.label}</button>
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
