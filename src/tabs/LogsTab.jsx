import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, orderBy, query, serverTimestamp, arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  STAGES, TAGS, TAG_STYLES, GREEN, GREEN_LIGHT,
  inp, today, TagPill, Avatar, relativeTime,
} from "../shared";

export function LogsTab({ role }) {
  const [logs, setLogs] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ date: today(), stage: "初步評估", author: role, tag: "其他", content: "" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [replyingId, setReplyingId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySaving, setReplySaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "logs"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  useEffect(() =>
    onSnapshot(collection(db, "members"), snap =>
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    ), []);

  const roleMembers = members.filter(m => m.role === role);
  const defaultAuthor = roleMembers.length === 1 ? roleMembers[0].name : role;

  useEffect(() => {
    if (!formOpen || editId) return;
    setForm(p => ({ ...p, author: defaultAuthor }));
  }, [role, members.length]);

  // 從 log.role 或 members 查詢作者身份（舊記錄無 role 欄位）
  const getAuthorRole = (log) =>
    log.role || members.find(m => m.name === log.author)?.role || null;

  const openForm = (log = null) => {
    setEditId(log?.id || null);
    setForm(log
      ? { date: log.date, stage: log.stage, author: log.author, tag: log.tag, content: log.content }
      : { date: today(), stage: "初步評估", author: defaultAuthor, tag: "其他", content: "" }
    );
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "logs", editId), { ...form, updatedAt: serverTimestamp() });
      } else {
        // 新增時存入當前身份 role，供頭像顯示使用
        await addDoc(collection(db, "logs"), {
          ...form, role, replies: [], createdAt: serverTimestamp(),
        });
      }
      setFormOpen(false); setEditId(null);
    } finally { setSaving(false); }
  };

  const del = async (id) => { if (confirm("確定刪除？")) await deleteDoc(doc(db, "logs", id)); };

  const submitReply = async (logId) => {
    if (!replyContent.trim()) return;
    setReplySaving(true);
    try {
      const reply = {
        author: defaultAuthor,
        content: replyContent.trim(),
        date: today(),
        createdAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, "logs", logId), { replies: arrayUnion(reply) });
      setReplyingId(null);
      setReplyContent("");
    } finally { setReplySaving(false); }
  };

  const renderAuthorField = () => {
    if (editId) {
      return <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} style={inp} />;
    }
    if (roleMembers.length > 1) {
      return (
        <select value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
          {roleMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
        </select>
      );
    }
    return (
      <div style={{ ...inp, background: "#f5f5f3", color: "#444", display: "flex", alignItems: "center" }}>
        {form.author}
      </div>
    );
  };

  const stageCounts = STAGES.reduce((a, s) => ({ ...a, [s]: logs.filter(l => l.stage === s).length }), {});
  const filtered = logs.filter(l =>
    (filter === "全部" || l.stage === filter) &&
    (!search || l.content?.includes(search) || l.author?.includes(search))
  );

  return (
    <div>
      {/* 新增/編輯表單 */}
      {formOpen && (
        <div style={{ background: "#fff", border: "1px solid #EDEDEA", borderRadius: 12, padding: 18, marginBottom: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: 2, marginBottom: 14 }}>
            {editId ? "編輯記錄" : "新增討論記錄"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>日期</div>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>階段</div>
              <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>發言人</div>
              {renderAuthorField()}
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>標籤</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {TAGS.map(t => {
                  const s = TAG_STYLES[t]; const on = form.tag === t;
                  return (
                    <button key={t} onClick={() => setForm(p => ({ ...p, tag: t }))}
                      style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, border: `1.5px solid ${on ? s.color : "#e8e8e4"}`, background: on ? s.bg : "#fff", color: on ? s.color : "#888", cursor: "pointer", fontFamily: "inherit", fontWeight: on ? 700 : 400 }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 內容輸入 + 字數計數器 */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              rows={4}
              placeholder="記錄討論重點、決定事項…"
              style={{ ...inp, resize: "vertical", lineHeight: 1.7, paddingBottom: 24 }}
            />
            <span style={{
              position: "absolute", right: 10, bottom: 8,
              fontSize: 10, color: form.content.length > 400 ? "#A32D2D" : "#ccc",
            }}>
              {form.content.length}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => { setFormOpen(false); setEditId(null); }}
              style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e8e8e4", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>
              取消
            </button>
            <button onClick={save} disabled={!form.content.trim() || saving}
              style={{ fontSize: 13, padding: "8px 20px", borderRadius: 8, border: "none", background: form.content.trim() ? GREEN : "#ccc", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
              {saving ? "儲存中…" : editId ? "更新" : "儲存"}
            </button>
          </div>
        </div>
      )}

      {/* 階段篩選 */}
      <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}>
        {["全部", ...STAGES].map(s => {
          const cnt = s === "全部" ? logs.length : stageCounts[s];
          const active = filter === s; const has = s !== "全部" && cnt > 0;
          return (
            <button key={s} onClick={() => setFilter(s)}
              style={{ fontSize: 11, padding: "4px 11px", borderRadius: 20, border: `1.5px solid ${active ? GREEN : has ? "#0A664433" : "#e8e8e4"}`, background: active ? GREEN : has ? GREEN_LIGHT : "#fff", color: active ? "#fff" : has ? GREEN : "#aaa", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, fontWeight: active ? 700 : 400 }}>
              {s}{cnt > 0 ? ` (${cnt})` : ""}
            </button>
          );
        })}
      </div>

      {/* 搜尋 */}
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
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#bbb", fontSize: 13 }}>尚無記錄</div>
      )}

      {/* 討論卡片 */}
      {filtered.map(log => {
        const ts = TAG_STYLES[log.tag] || TAG_STYLES["其他"];
        const replies = log.replies || [];
        const hasReplies = replies.length > 0;
        const isReplying = replyingId === log.id;
        const authorRole = getAuthorRole(log);

        return (
          <div key={log.id} style={{
            background: "#fff",
            border: "1px solid #EDEDEA",
            borderLeft: `4px solid ${ts.color}`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 10,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            {/* 卡片頭部：頭像 + 發言人 + 標籤 + 時間 */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <Avatar name={log.author} role={authorRole} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{log.author}</span>
                  <TagPill tag={log.tag} />
                  <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>{log.stage}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#bbb" }}>{relativeTime(log.date)}</span>
                </div>
              </div>
            </div>

            {/* 正文 */}
            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.8, whiteSpace: "pre-wrap", paddingLeft: 44 }}>
              {log.content}
            </div>

            {/* 回復串 */}
            {hasReplies && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #F0F0EE", paddingLeft: 44 }}>
                {replies.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: i < replies.length - 1 ? 10 : 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#F0EFE8", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {(r.author || "?").slice(0, 1)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>{r.author}</span>
                        <span style={{ fontSize: 10, color: "#bbb" }}>{relativeTime(r.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#444", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{r.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 回復輸入框 */}
            {isReplying && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F0F0EE" }}>
                <div style={{ position: "relative", marginBottom: 8 }}>
                  <textarea
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    rows={2}
                    placeholder="輸入回復…"
                    style={{ ...inp, resize: "vertical", fontSize: 12, paddingBottom: 22 }}
                    autoFocus
                  />
                  <span style={{ position: "absolute", right: 10, bottom: 7, fontSize: 10, color: "#ccc" }}>
                    {replyContent.length}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                  <button onClick={() => { setReplyingId(null); setReplyContent(""); }}
                    style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>
                    取消
                  </button>
                  <button onClick={() => submitReply(log.id)} disabled={!replyContent.trim() || replySaving}
                    style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "none", background: replyContent.trim() ? GREEN : "#ccc", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                    {replySaving ? "送出中…" : "送出"}
                  </button>
                </div>
              </div>
            )}

            {/* 操作列 */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginTop: 10 }}>
              {/* 有回復時：顯示說明文字，鎖定編輯/刪除 */}
              {hasReplies && (
                <span style={{ fontSize: 10, color: "#bbb", marginRight: "auto" }}>已有回復，原文不可修改</span>
              )}
              {!isReplying && (
                <button onClick={() => { setReplyingId(log.id); setReplyContent(""); }}
                  style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
                  回復
                </button>
              )}
              {!hasReplies && (
                <>
                  <button onClick={() => openForm(log)}
                    style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
                    編輯
                  </button>
                  <button onClick={() => del(log.id)}
                    style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#A32D2D", cursor: "pointer", fontFamily: "inherit" }}>
                    刪除
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {!formOpen && (
        <button onClick={() => openForm()}
          style={{ width: "100%", padding: 13, borderRadius: 10, border: `1.5px dashed ${GREEN}`, background: "transparent", color: GREEN, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
          + 新增討論記錄
        </button>
      )}
    </div>
  );
}
