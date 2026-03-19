import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, orderBy, query, serverTimestamp, arrayUnion,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  STAGES, TAGS, TAG_STYLES, GREEN, GREEN_LIGHT,
  inp, today, TagPill, Avatar, relativeTime, useConfirm,
} from "../shared";
import { PdfExportButton } from "../PdfExport";

const CLOUDINARY_CLOUD_NAME = "dkyp5jocn";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";

function SkeletonCard() {
  return (
    <div style={{ background: "#fff", border: "1px solid #EDEDEA", borderLeft: "4px solid #e8e8e4", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 12, width: "40%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: "25%" }} />
        </div>
      </div>
      <div style={{ paddingLeft: 44 }}>
        <div className="skeleton" style={{ height: 11, width: "90%", marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 11, width: "75%", marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 11, width: "55%" }} />
      </div>
    </div>
  );
}

export function LogsTab({ role, onError }) {
  const [logs, setLogs] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ date: today(), stage: "初步評估", author: role, tag: "其他", content: "" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState([]); // always URL strings after upload
  const [uploadingCount, setUploadingCount] = useState(0);
  const [replyingId, setReplyingId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySaving, setReplySaving] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [editingReplyContent, setEditingReplyContent] = useState("");
  const [unreadBefore, setUnreadBefore] = useState(null);

  const [confirm, confirmModal] = useConfirm();

  // ── 已讀/未讀：記錄上次瀏覽時間 ──
  useEffect(() => {
    const uid = auth.currentUser?.uid || "guest";
    const key = `renew-last-read-${uid}`;
    const last = localStorage.getItem(key);
    setUnreadBefore(last ? new Date(last) : null);
    // 3 秒後更新「已讀」時間
    const timer = setTimeout(() => {
      localStorage.setItem(key, new Date().toISOString());
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const isNew = (log) => {
    if (!unreadBefore || !log.createdAt) return false;
    const d = log.createdAt?.toDate ? log.createdAt.toDate() : new Date(log.createdAt);
    return d > unreadBefore;
  };

  useEffect(() => {
    const q = query(collection(db, "logs"), orderBy("createdAt", "desc"));
    return onSnapshot(q,
      snap => { setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      () => onError("讀取討論記錄失敗")
    );
  }, []);

  useEffect(() =>
    onSnapshot(collection(db, "members"),
      snap => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    ), []);

  const roleMembers = members.filter(m => m.role === role);
  const defaultAuthor = roleMembers.length === 1 ? roleMembers[0].name : role;

  useEffect(() => {
    if (!formOpen || editId) return;
    setForm(p => ({ ...p, author: defaultAuthor }));
  }, [role, members.length]);

  const getAuthorRole = (log) =>
    log.role || members.find(m => m.name === log.author)?.role || null;

  const openForm = (log = null) => {
    setEditId(log?.id || null);
    setForm(log
      ? { date: log.date, stage: log.stage, author: log.author, tag: log.tag, content: log.content }
      : { date: today(), stage: "初步評估", author: defaultAuthor, tag: "其他", content: "" }
    );
    setPhotos(log?.photos || []);
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setEditId(null); setPhotos([]); };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = "";
    setUploadingCount(c => c + files.length);
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: fd }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || "上傳失敗");
        setPhotos(prev => [...prev, data.secure_url]);
      } catch (err) {
        console.error("Photo upload error:", err);
        onError(`照片上傳失敗：${err.message}`);
      } finally {
        setUploadingCount(c => c - 1);
      }
    }
  };

  const save = async () => {
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "logs", editId), { ...form, photos, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "logs"), { ...form, role, photos, replies: [], createdAt: serverTimestamp() });
      }
      closeForm();
    } catch (err) {
      console.error("Save error:", err);
      onError("儲存失敗，請確認網路連線後重試");
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    const ok = await confirm("此操作無法復原。", { title: "刪除討論記錄", confirmText: "確認刪除" });
    if (!ok) return;
    try { await deleteDoc(doc(db, "logs", id)); }
    catch { onError("刪除失敗，請重試"); }
  };

  const togglePin = async (id, pinned) => {
    try { await updateDoc(doc(db, "logs", id), { pinned: !pinned }); }
    catch { onError("操作失敗，請重試"); }
  };

  const submitReply = async (logId) => {
    if (!replyContent.trim()) return;
    setReplySaving(true);
    try {
      const reply = { author: defaultAuthor, content: replyContent.trim(), date: today(), createdAt: new Date().toISOString() };
      await updateDoc(doc(db, "logs", logId), { replies: arrayUnion(reply) });
      setReplyingId(null); setReplyContent("");
    } catch { onError("回復失敗，請重試"); }
    finally { setReplySaving(false); }
  };

  const saveReplyEdit = async (log) => {
    if (!editingReplyContent.trim()) return;
    const { logId, index } = editingReply;
    try {
      const newReplies = log.replies.map((r, i) =>
        i === index ? { ...r, content: editingReplyContent.trim(), updatedAt: new Date().toISOString() } : r
      );
      await updateDoc(doc(db, "logs", logId), { replies: newReplies });
      setEditingReply(null); setEditingReplyContent("");
    } catch { onError("更新失敗，請重試"); }
  };

  const deleteReply = async (log, index) => {
    const ok = await confirm("確定刪除此回復？");
    if (!ok) return;
    try {
      const newReplies = log.replies.filter((_, i) => i !== index);
      await updateDoc(doc(db, "logs", log.id), { replies: newReplies });
    } catch { onError("刪除回復失敗，請重試"); }
  };

  const handleContentKeyDown = (e, action) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); action(); }
  };

  const renderAuthorField = () => {
    if (editId) return <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} style={inp} />;
    if (roleMembers.length > 1) return (
      <select value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
        {roleMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
      </select>
    );
    return <div style={{ ...inp, background: "#f5f5f3", color: "#444", display: "flex", alignItems: "center" }}>{form.author}</div>;
  };

  const stageCounts = STAGES.reduce((a, s) => ({ ...a, [s]: logs.filter(l => l.stage === s).length }), {});

  const baseFiltered = logs.filter(l =>
    (filter === "全部" || l.stage === filter) &&
    (!search || l.content?.includes(search) || l.author?.includes(search) ||
      l.replies?.some(r => r.content?.includes(search)))
  );
  const pinnedLogs = baseFiltered.filter(l => l.pinned);
  const unpinnedLogs = baseFiltered.filter(l => !l.pinned);
  const newCount = baseFiltered.filter(l => isNew(l)).length;

  const smBtn = (label, onClick, opts = {}) => (
    <button onClick={onClick} className="btn-press" style={{
      fontSize: 11, padding: "4px 11px", borderRadius: 6,
      border: `1px solid ${opts.danger ? "#A32D2D33" : "#e8e8e4"}`,
      background: opts.primary ? GREEN : opts.danger ? "#FFF0F0" : "#f8f8f6",
      color: opts.primary ? "#fff" : opts.danger ? "#A32D2D" : "#555",
      cursor: "pointer", fontFamily: "inherit", fontWeight: opts.primary ? 700 : 400,
      ...opts.style,
    }}>{label}</button>
  );

  const renderCard = (log) => {
    const ts = TAG_STYLES[log.tag] || TAG_STYLES["其他"];
    const replies = log.replies || [];
    const hasReplies = replies.length > 0;
    const isReplying = replyingId === log.id;
    const authorRole = getAuthorRole(log);
    const _isNew = isNew(log);

    return (
      <div key={log.id} className="card-hover anim-fade-in"
        style={{
          background: _isNew ? "#FAFFF8" : "#fff",
          border: `1px solid ${log.pinned ? "#F0E8D8" : _isNew ? "#C8ECDF" : "#EDEDEA"}`,
          borderLeft: `4px solid ${ts.color}`,
          borderRadius: 12, padding: "14px 16px", marginBottom: 10,
          boxShadow: log.pinned
            ? "0 2px 10px rgba(156,75,0,0.07)"
            : _isNew ? "0 2px 8px rgba(10,102,71,0.07)"
            : "0 1px 4px rgba(0,0,0,0.05)",
        }}>

        {/* 卡片頭部 */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
          <Avatar name={log.author} role={authorRole} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{log.author}</span>
              <TagPill tag={log.tag} />
              <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>{log.stage}</span>
              {/* 右側徽章 */}
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                {_isNew && (
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: GREEN_LIGHT, color: GREEN, fontWeight: 700, border: `1px solid ${GREEN}33`, letterSpacing: 0.5 }}>NEW</span>
                )}
                {log.pinned && (
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "#FEF3E6", color: "#9C4B00", fontWeight: 700, border: "1px solid #9C4B0033" }}>釘選</span>
                )}
                <span style={{ fontSize: 11, color: "#bbb" }}>
                  {relativeTime(log.date)}
                  {log.updatedAt && <span style={{ marginLeft: 4 }}>（已編輯）</span>}
                </span>
              </span>
            </div>
            {hasReplies && (
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{replies.length} 則回復</div>
            )}
          </div>
        </div>

        {/* 正文 */}
        <div style={{ fontSize: 13, color: "#333", lineHeight: 1.8, whiteSpace: "pre-wrap", paddingLeft: 44 }}>
          {log.content}
        </div>

        {/* 照片 */}
        {log.photos?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, paddingLeft: 44 }}>
            {log.photos.map((url, i) => {
              const thumb = url.includes("/upload/")
                ? url.replace("/upload/", "/upload/w_144,h_144,c_fill,q_auto/")
                : url;
              return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="photo-wrap">
                  <img src={thumb} alt="" />
                </a>
              );
            })}
          </div>
        )}

        {/* 回復串 */}
        {hasReplies && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #F0F0EE", paddingLeft: 44 }}>
            {replies.map((r, i) => {
              const isEditingThis = editingReply?.logId === log.id && editingReply?.index === i;
              return (
                <div key={i} className="anim-reply" style={{ display: "flex", gap: 8, marginBottom: i < replies.length - 1 ? 12 : 0 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#F0EFE8", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                    {(r.author || "?").slice(0, 1)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#444" }}>{r.author}</span>
                      <span style={{ fontSize: 10, color: "#bbb" }}>{relativeTime(r.createdAt)}</span>
                      {r.updatedAt && <span style={{ fontSize: 10, color: "#ccc" }}>（已編輯）</span>}
                      {!isEditingThis && (
                        <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                          {smBtn("編輯", () => { setEditingReply({ logId: log.id, index: i }); setEditingReplyContent(r.content); })}
                          {smBtn("刪除", () => deleteReply(log, i), { danger: true })}
                        </span>
                      )}
                    </div>

                    {isEditingThis ? (
                      <div className="anim-form-open">
                        <div style={{ position: "relative", marginBottom: 6 }}>
                          <textarea
                            value={editingReplyContent}
                            onChange={e => setEditingReplyContent(e.target.value)}
                            onKeyDown={e => handleContentKeyDown(e, () => saveReplyEdit(log))}
                            rows={2} placeholder="Ctrl+Enter 送出"
                            style={{ ...inp, resize: "vertical", fontSize: 12, paddingBottom: 20 }}
                            autoFocus
                          />
                          <span style={{ position: "absolute", right: 8, bottom: 6, fontSize: 10, color: "#ccc" }}>{editingReplyContent.length}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {smBtn("取消", () => { setEditingReply(null); setEditingReplyContent(""); })}
                          {smBtn("儲存", () => saveReplyEdit(log), { primary: true, style: { opacity: editingReplyContent.trim() ? 1 : 0.5 } })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{r.content}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 回復輸入框 */}
        {isReplying && (
          <div className="anim-form-open" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F0F0EE" }}>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <textarea
                value={replyContent} onChange={e => setReplyContent(e.target.value)}
                onKeyDown={e => handleContentKeyDown(e, () => submitReply(log.id))}
                rows={2} placeholder="輸入回復… (Ctrl+Enter 送出)"
                style={{ ...inp, resize: "vertical", fontSize: 12, paddingBottom: 22 }}
                autoFocus
              />
              <span style={{ position: "absolute", right: 10, bottom: 7, fontSize: 10, color: "#ccc" }}>{replyContent.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
              {smBtn("取消", () => { setReplyingId(null); setReplyContent(""); })}
              {smBtn("送出", () => submitReply(log.id), { primary: true, style: { opacity: replyContent.trim() && !replySaving ? 1 : 0.6 } })}
            </div>
          </div>
        )}

        {/* 操作列 */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginTop: 10 }}>
          {hasReplies && !isReplying && (
            <span style={{ fontSize: 10, color: "#bbb", marginRight: "auto" }}>已有回復，原文不可修改</span>
          )}
          {/* 釘選切換 */}
          {smBtn(log.pinned ? "取消釘選" : "釘選", () => togglePin(log.id, log.pinned), {
            style: log.pinned
              ? { background: "#FEF3E6", color: "#9C4B00", border: "1px solid #9C4B0033" }
              : {},
          })}
          {!isReplying && smBtn("回復", () => { setReplyingId(log.id); setReplyContent(""); })}
          {!hasReplies && smBtn("編輯", () => openForm(log))}
          {!hasReplies && smBtn("刪除", () => del(log.id), { danger: true })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {confirmModal}

      {/* 新增/編輯表單 */}
      {formOpen && (
        <div className="anim-form-open" style={{ background: "#fff", border: "1px solid #EDEDEA", borderRadius: 12, padding: 18, marginBottom: 18, boxShadow: "0 4px 16px rgba(0,0,0,0.09)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: 2, marginBottom: 14 }}>
            {editId ? "編輯記錄" : "新增討論記錄"}
          </div>
          <div className="form-grid-2" style={{ marginBottom: 12 }}>
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
                    <button key={t} onClick={() => setForm(p => ({ ...p, tag: t }))} className="btn-press"
                      style={{
                        fontSize: 11, padding: on ? "3px 9px 3px 6px" : "3px 9px", borderRadius: 20,
                        border: `1.5px solid ${on ? s.color : "#e0e0dc"}`,
                        background: on ? s.bg : "#fafaf8", color: on ? s.color : "#999",
                        cursor: "pointer", fontFamily: "inherit", fontWeight: on ? 700 : 400,
                        display: "flex", alignItems: "center", gap: 4,
                        transition: "border-color .15s, background .15s, color .15s",
                      }}>
                      {on && (
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M2 5.5l2.5 2.5L9 3" stroke={s.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ position: "relative", marginBottom: 10 }}>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              onKeyDown={e => handleContentKeyDown(e, save)}
              rows={4} placeholder="記錄討論重點、決定事項… (Ctrl+Enter 送出)"
              style={{ ...inp, resize: "vertical", lineHeight: 1.7, paddingBottom: 24 }}
            />
            <span style={{ position: "absolute", right: 10, bottom: 8, fontSize: 10, color: form.content.length > 400 ? "#A32D2D" : "#ccc" }}>
              {form.content.length}
            </span>
          </div>

          {/* 照片 */}
          <div style={{ marginBottom: 14 }}>
            <label className="btn-press"
              style={{ display: "inline-block", fontSize: 12, padding: "5px 13px", borderRadius: 20, border: "1.5px solid #e8e8e4", background: "#f8f8f6", color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
              附加照片
              <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} style={{ display: "none" }} />
            </label>
            {(photos.length > 0 || uploadingCount > 0) && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
                {photos.map((url, i) => (
                  <div key={url} style={{ position: "relative" }}>
                    <img src={url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #EDEDEA", display: "block" }} />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} className="btn-press"
                      style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#A32D2D", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                      ×
                    </button>
                  </div>
                ))}
                {uploadingCount > 0 && (
                  <div style={{ width: 64, height: 64, borderRadius: 8, border: "1px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4, background: "#fafaf8" }}>
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    <span style={{ fontSize: 10, color: "#999" }}>{uploadingCount}張</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={closeForm} className="btn-press" style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e8e8e4", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>
              取消
            </button>
            <button onClick={save} disabled={!form.content.trim() || saving || uploadingCount > 0} className="btn-press"
              style={{ fontSize: 13, padding: "8px 20px", borderRadius: 8, border: "none", background: (form.content.trim() && uploadingCount === 0) ? GREEN : "#ccc", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
              {saving ? "儲存中…" : uploadingCount > 0 ? "上傳照片中…" : editId ? "更新" : "儲存"}
            </button>
          </div>
        </div>
      )}

      {/* 篩選 */}
      <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}>
        {["全部", ...STAGES].map(s => {
          const cnt = s === "全部" ? logs.length : stageCounts[s];
          const active = filter === s; const has = s !== "全部" && cnt > 0;
          return (
            <button key={s} onClick={() => setFilter(s)} className="btn-press"
              style={{ fontSize: 11, padding: "4px 11px", borderRadius: 20, border: `1.5px solid ${active ? GREEN : has ? "#0A664433" : "#e8e8e4"}`, background: active ? GREEN : has ? GREEN_LIGHT : "#fff", color: active ? "#fff" : has ? GREEN : "#aaa", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, fontWeight: active ? 700 : 400 }}>
              {s}{cnt > 0 ? ` (${cnt})` : ""}
            </button>
          );
        })}
      </div>

      {/* 搜尋 */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Escape" && setSearch("")}
          placeholder="搜尋內容、發言人或回復…" style={{ ...inp, paddingLeft: 34 }} />
        <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#bbb" }}>⌕</span>
        {search && <button onClick={() => setSearch("")} className="btn-press" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#bbb" }}>×</button>}
      </div>

      {/* 狀態列 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>
            {filter === "全部" ? `共 ${baseFiltered.length} 筆` : `${filter} · ${baseFiltered.length} 筆`}
          </span>
          {newCount > 0 && (
            <span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>{newCount} 則新訊息</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {(filter !== "全部" || search) && (
            <button onClick={() => { setFilter("全部"); setSearch(""); }} className="btn-press"
              style={{ fontSize: 12, color: GREEN, background: "none", border: "none", cursor: "pointer" }}>
              清除篩選
            </button>
          )}
          {logs.length > 0 && <PdfExportButton logs={logs} />}
        </div>
      </div>

      {/* 載入 skeleton */}
      {loading && [1, 2, 3].map(i => <SkeletonCard key={i} />)}

      {!loading && baseFiltered.length === 0 && (
        search ? (
          /* 搜尋無結果 */
          <div className="anim-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px", gap: 10 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <circle cx="22" cy="22" r="14" stroke="#D8D8D4" strokeWidth="1.5" fill="#F5F5F2" />
              <line x1="32" y1="32" x2="46" y2="46" stroke="#D0D0CC" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="17" y1="22" x2="27" y2="22" stroke="#C4C4C0" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#555" }}>找不到相關記錄</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>試試不同的關鍵字</div>
            <button onClick={() => { setSearch(""); setFilter("全部"); }} className="btn-press"
              style={{ fontSize: 12, padding: "6px 18px", borderRadius: 20, border: "1.5px solid #e8e8e4", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
              清除搜尋
            </button>
          </div>
        ) : (
          /* 無記錄 */
          <div className="anim-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", gap: 12 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="14" y="10" width="36" height="46" rx="5" fill="#F5F5F2" stroke="#D8D8D4" strokeWidth="1.5" />
              <rect x="23" y="5" width="18" height="9" rx="3.5" fill="#E0DFD9" />
              <line x1="22" y1="28" x2="42" y2="28" stroke="#C8C8C4" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="22" y1="36" x2="38" y2="36" stroke="#C8C8C4" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="22" y1="44" x2="34" y2="44" stroke="#C8C8C4" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="47" cy="47" r="11" fill="#0A6647" />
              <path d="M43 47l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#444" }}>尚無討論記錄</div>
            <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", lineHeight: 1.7 }}>
              記錄第一筆討論，讓業主、技師、設計師<br />都能即時掌握工程進度
            </div>
            {!formOpen && (
              <button onClick={() => setFormOpen(true)} className="btn-press"
                style={{ fontSize: 13, padding: "9px 24px", borderRadius: 20, border: "none", background: GREEN, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, marginTop: 4, boxShadow: "0 2px 10px rgba(10,102,71,0.3)" }}>
                + 新增第一筆記錄
              </button>
            )}
          </div>
        )
      )}

      {/* 釘選區塊 */}
      {pinnedLogs.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#9C4B00", letterSpacing: 1 }}>釘選記錄</span>
            <div style={{ flex: 1, height: 1, background: "#F0E8D8" }} />
          </div>
          <div className="card-stagger">{pinnedLogs.map(renderCard)}</div>
        </>
      )}

      {/* 一般記錄分隔線 */}
      {pinnedLogs.length > 0 && unpinnedLogs.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 12px" }}>
          <div style={{ flex: 1, height: 1, background: "#EDEDEA" }} />
          <span style={{ fontSize: 10, color: "#bbb" }}>其他討論</span>
          <div style={{ flex: 1, height: 1, background: "#EDEDEA" }} />
        </div>
      )}

      <div className="card-stagger">{unpinnedLogs.map(renderCard)}</div>

      {!formOpen && (
        <button onClick={() => openForm()} className="btn-press"
          style={{ width: "100%", padding: 13, borderRadius: 10, border: `1.5px dashed ${GREEN}`, background: "transparent", color: GREEN, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
          + 新增討論記錄
        </button>
      )}
    </div>
  );
}
