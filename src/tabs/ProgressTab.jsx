import { useState, useEffect } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PROGRESS_ITEMS, STATUS_OPTS, STATUS_COLORS, GREEN, GREEN_LIGHT, inp } from "../shared";

export function ProgressTab({ onError }) {
  const [progress, setProgress] = useState({});
  const [projectData, setProjectData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => onSnapshot(doc(db, "progress", "main"),
    snap => { if (snap.exists()) setProgress(snap.data()); },
    () => onError("讀取進度失敗")
  ), []);

  useEffect(() => onSnapshot(doc(db, "project", "main"),
    snap => { if (snap.exists()) setProjectData(snap.data()); },
    () => {}
  ), []);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 1800); };

  const update = async (id, field, value) => {
    const updated = { ...progress, [id]: { ...progress[id], [field]: value } };
    setProgress(updated);
    setSaving(true);
    try {
      await setDoc(doc(db, "progress", "main"), { ...updated, updatedAt: serverTimestamp() });
      showToast("已更新");
    } catch {
      onError("更新失敗，請重試");
    } finally { setSaving(false); }
  };

  const printReport = () => {
    const doneCount = PROGRESS_ITEMS.filter(i => progress[i.id]?.status === "已完成").length;
    const rows = PROGRESS_ITEMS.map((item, idx) => {
      const st = progress[item.id]?.status || "未開始";
      const note = progress[item.id]?.note || "—";
      const date = progress[item.id]?.date || "—";
      const statusColor = { 已完成: "#0A6647", 進行中: "#185FA5", 待確認: "#9C4B00", 未開始: "#888" }[st] || "#888";
      return `<tr>
        <td style="text-align:center">${idx + 1}</td>
        <td>${item.label}</td>
        <td style="color:${statusColor};font-weight:600">${st}</td>
        <td>${date}</td>
        <td>${note}</td>
      </tr>`;
    }).join("");

    const projectInfo = projectData ? `
      <table class="info-table">
        <tr><th>業主</th><td>${projectData.owner || "—"}</td><th>電話</th><td>${projectData.owner_phone || "—"}</td></tr>
        <tr><th>地址</th><td colspan="3">${projectData.address || "—"}</td></tr>
        <tr><th>屋齡</th><td>${projectData.age ? projectData.age + " 年" : "—"}</td><th>樓層</th><td>${projectData.floors ? projectData.floors + " 層" : "—"}</td></tr>
        <tr><th>建坪</th><td>${projectData.area ? projectData.area + " ㎡" : "—"}</td><th>預計完工</th><td>${projectData.target_date || "—"}</td></tr>
      </table>` : "";

    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Noto Sans TC", sans-serif; color: #222; padding: 32px 40px; font-size: 13px; }
  .header { border-bottom: 3px solid #0A6647; padding-bottom: 12px; margin-bottom: 20px; }
  .title { font-size: 22px; font-weight: 700; color: #0A6647; }
  .subtitle { font-size: 12px; color: #888; margin-top: 4px; }
  .section-title { font-size: 12px; font-weight: 700; color: #888; letter-spacing: 2px; margin: 20px 0 10px; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  .info-table th { background: #F5F5F3; color: #555; font-weight: 600; padding: 7px 10px; text-align: left; width: 80px; border: 1px solid #E0E0DC; }
  .info-table td { padding: 7px 10px; border: 1px solid #E0E0DC; }
  .progress-table { width: 100%; border-collapse: collapse; }
  .progress-table th { background: #0A6647; color: #fff; padding: 9px 10px; text-align: left; font-weight: 600; }
  .progress-table td { padding: 9px 10px; border-bottom: 1px solid #EDEDEA; vertical-align: top; }
  .progress-table tr:nth-child(even) td { background: #F9F9F7; }
  .summary { display: inline-block; background: #E8F7F1; color: #0A6647; padding: 4px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; margin-bottom: 16px; }
  @media print { body { padding: 16px 24px; } }
</style>
</head>
<body>
<div class="header">
  <div class="title">老宅延壽機能復新計畫</div>
  <div class="subtitle">補助申請進度報告 &nbsp;·&nbsp; 列印日期：${new Date().toLocaleDateString("zh-TW")}</div>
</div>
${projectData ? `<div class="section-title">專案資料</div>${projectInfo}` : ""}
<div class="section-title">申請進度</div>
<div class="summary">${doneCount} / ${PROGRESS_ITEMS.length} 項完成</div>
<table class="progress-table">
  <thead><tr><th style="width:36px">#</th><th>項目</th><th style="width:80px">狀態</th><th style="width:100px">日期</th><th>備註</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const doneCount = PROGRESS_ITEMS.filter(i => progress[i.id]?.status === "已完成").length;
  const pct = Math.round((doneCount / PROGRESS_ITEMS.length) * 100);

  return (
    <div>
      {/* 進度摘要 */}
      <div style={{ background: "#fff", border: "1px solid #EDEDEA", borderRadius: 12, padding: "16px 18px", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#444" }}>補助申請進度</span>
            <span style={{ fontSize: 12, color: GREEN, fontWeight: 700, marginLeft: 12 }}>{doneCount} / {PROGRESS_ITEMS.length} 完成 ({pct}%)</span>
          </div>
          <button onClick={printReport} className="btn-press"
            style={{ fontSize: 11, padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${GREEN}`, background: "transparent", color: GREEN, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            列印報告
          </button>
        </div>
        <div style={{ height: 7, background: "#F0EFE8", borderRadius: 4, overflow: "hidden" }}>
          <div className="progress-bar-fill" style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, #0A6647, #1A9B6E)`, borderRadius: 4, transition: "width .6s cubic-bezier(.25,.46,.45,.94)" }} />
        </div>
      </div>

      {/* Timeline */}
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
              {/* 時間軸 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36, flexShrink: 0 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: isDone ? GREEN : isActive ? GREEN_LIGHT : "#F5F5F3",
                  border: `2px solid ${isDone ? GREEN : isActive ? GREEN : "#DDDDD8"}`,
                  color: isDone ? "#fff" : isActive ? GREEN : "#BBB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                  transition: "all .3s ease", marginTop: 4,
                  boxShadow: isDone ? "0 2px 8px rgba(10,102,71,0.25)" : "none",
                }}>
                  {isDone ? "✓" : idx + 1}
                </div>
                {!isLast && (
                  <div style={{ width: 2, flex: 1, minHeight: 20, background: isDone ? `linear-gradient(to bottom, ${GREEN}, #d4d4d0)` : "#EDEDEA", margin: "4px 0 0", transition: "background .3s" }} />
                )}
              </div>

              <div style={{ flex: 1, paddingLeft: 12, paddingBottom: isLast ? 4 : 16 }}>
                <div className="card-hover" style={{ background: "#fff", border: `1px solid ${isDone ? "#C8ECDF" : "#EDEDEA"}`, borderRadius: 10, padding: "12px 14px", boxShadow: isDone ? "0 1px 4px rgba(10,102,71,0.08)" : "0 1px 3px rgba(0,0,0,0.04)", transition: "border-color .2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: isDone ? GREEN : "#111", flex: 1, transition: "color .2s" }}>{item.label}</span>
                    <select value={st} onChange={e => update(item.id, "status", e.target.value)} className="btn-press"
                      style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, border: `1.5px solid ${sc.color}33`, background: sc.bg, color: sc.color, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, outline: "none", transition: "all .15s" }}>
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
        <div className="anim-toast" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: GREEN, color: "#fff", padding: "9px 22px", borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 999, boxShadow: "0 4px 16px rgba(10,102,71,0.3)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
