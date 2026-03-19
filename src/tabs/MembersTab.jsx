import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { SPECIALTIES, ROLE_COLORS, GREEN, GREEN_LIGHT, inp } from "../shared";

export function MembersTab({ onError }) {
  const [members, setMembers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "技師", phone: "", email: "", specialty: [], note: "" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() =>
    onSnapshot(collection(db, "members"), snap =>
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    ), []);

  const openForm = (m = null) => {
    setEditId(m?.id || null);
    setForm(m
      ? { name: m.name || "", role: m.role || "技師", phone: m.phone || "", email: m.email || "", specialty: m.specialty || [], note: m.note || "" }
      : { name: "", role: "技師", phone: "", email: "", specialty: [], note: "" }
    );
    setFormOpen(true);
  };

  const toggleSpec = s => setForm(p => ({
    ...p,
    specialty: p.specialty.includes(s) ? p.specialty.filter(x => x !== s) : [...p.specialty, s],
  }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) await updateDoc(doc(db, "members", editId), { ...form, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, "members"), { ...form, createdAt: serverTimestamp() });
      setFormOpen(false); setEditId(null);
    } catch {
      onError("儲存失敗，請重試");
    } finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm("確定刪除此成員？")) return;
    try { await deleteDoc(doc(db, "members", id)); }
    catch { onError("刪除失敗，請重試"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#444" }}>成員名單 ({members.length})</span>
        {!formOpen && (
          <button onClick={() => openForm()} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${GREEN}`, background: "transparent", color: GREEN, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
            + 新增
          </button>
        )}
      </div>

      {formOpen && (
        <div className="anim-form-open" style={{ background: "#fff", border: "1px solid #EDEDEA", borderRadius: 12, padding: 18, marginBottom: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.09)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: 2, marginBottom: 14 }}>{editId ? "編輯成員" : "新增成員"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>姓名</div>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="王大明" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>身份</div>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                <option>技師</option><option>設計師</option><option>業主</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>電話</div>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="0912-345-678" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Email</div>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="example@mail.com" style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>專長</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SPECIALTIES.map(s => {
                const on = form.specialty.includes(s);
                return (
                  <button key={s} onClick={() => toggleSpec(s)}
                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${on ? GREEN : "#e8e8e4"}`, background: on ? GREEN_LIGHT : "#fff", color: on ? GREEN : "#888", cursor: "pointer", fontFamily: "inherit", fontWeight: on ? 700 : 400 }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} rows={2} placeholder="執照號碼、負責區域…" style={{ ...inp, resize: "vertical", marginBottom: 12 }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => { setFormOpen(false); setEditId(null); }} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e8e8e4", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>取消</button>
            <button onClick={save} disabled={!form.name.trim() || saving}
              style={{ fontSize: 13, padding: "8px 20px", borderRadius: 8, border: "none", background: form.name.trim() ? GREEN : "#ccc", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
              {saving ? "儲存中…" : editId ? "更新" : "儲存"}
            </button>
          </div>
        </div>
      )}

      {members.length === 0 && !formOpen && <div style={{ textAlign: "center", padding: 40, color: "#bbb", fontSize: 13 }}>尚無成員</div>}

      {members.map(m => {
        const rc = ROLE_COLORS[m.role] || ROLE_COLORS["技師"];
        return (
          <div key={m.id} className="card-hover anim-fade-in" style={{ background: "#fff", border: "1px solid #EDEDEA", borderLeft: `4px solid ${rc.color}`, borderRadius: 12, padding: "16px 16px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: rc.bg, color: rc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                {(m.name || "?").slice(0, 1)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{m.name}</span>
                  <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 20, background: rc.bg, color: rc.color, fontWeight: 600 }}>{m.role}</span>
                </div>
                {(m.phone || m.email) && (
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {m.phone && <span>📞 {m.phone}</span>}
                    {m.email && <span>✉ {m.email}</span>}
                  </div>
                )}
                {m.specialty?.length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                    {m.specialty.map(s => (
                      <span key={s} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: GREEN_LIGHT, color: GREEN, border: `1px solid ${GREEN}33` }}>{s}</span>
                    ))}
                  </div>
                )}
                {m.note && <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>{m.note}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => openForm(m)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#555", cursor: "pointer", fontFamily: "inherit" }}>編輯</button>
                <button onClick={() => del(m.id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#A32D2D", cursor: "pointer", fontFamily: "inherit" }}>刪除</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
