import { useState } from "react";
import { createPortal } from "react-dom";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { GREEN } from "./shared";

const TAG_COLOR = {
  "決定事項": "#0A6647",
  "待處理": "#C05621",
  "問題": "#A32D2D",
  "一般": "#555",
  "其他": "#555",
};

export function PdfExportButton({ logs }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const openReport = async () => {
    setLoading(true);
    try {
      const [projSnap, membersSnap] = await Promise.all([
        getDoc(doc(db, "project", "main")),
        getDocs(collection(db, "members")),
      ]);
      const project = projSnap.exists() ? projSnap.data() : {};
      const members = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReport({ project, members });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const close = () => setReport(null);

  return (
    <>
      <button onClick={openReport} disabled={loading} className="btn-press"
        style={{
          fontSize: 12, padding: "4px 12px", borderRadius: 20,
          border: "1.5px solid #e8e8e4", background: "#fff",
          color: "#555", cursor: loading ? "default" : "pointer",
          fontFamily: "inherit",
        }}>
        {loading ? "載入中…" : "匯出 PDF"}
      </button>

      {report && createPortal(
        <PdfOverlay logs={logs} report={report} onClose={close} />,
        document.body
      )}
    </>
  );
}

function PdfOverlay({ logs, report, onClose }) {
  const { project, members } = report;
  const now = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div className="pdf-overlay" style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(0,0,0,0.6)",
      display: "flex", flexDirection: "column",
      fontFamily: '"Noto Sans TC", -apple-system, sans-serif',
    }}>
      {/* Toolbar */}
      <div className="pdf-no-print" style={{
        background: "#1c1c1e", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", flexShrink: 0, gap: 12,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>PDF 預覽 — 老宅延壽專案報告</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => window.print()} className="btn-press"
            style={{ fontSize: 12, padding: "7px 18px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            列印 / 儲存 PDF
          </button>
          <button onClick={onClose} className="btn-press"
            style={{ fontSize: 12, padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit" }}>
            關閉
          </button>
        </div>
      </div>

      {/* Scrollable preview */}
      <div className="pdf-overlay-inner" style={{ flex: 1, overflow: "auto", padding: "24px 16px", display: "flex", justifyContent: "center" }}>
        <div style={{
          background: "#fff", width: "100%", maxWidth: 760,
          padding: "36px 44px", borderRadius: 4,
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
        }}>

          {/* Report header */}
          <div style={{ borderBottom: "2.5px solid #0A6647", paddingBottom: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 9, color: "#bbb", letterSpacing: 4, textTransform: "uppercase", marginBottom: 8 }}>
              Project Management Report
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0A6647", letterSpacing: -0.5, marginBottom: 8 }}>
              老宅延壽機能復新計畫
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {project.address && <div style={{ fontSize: 12, color: "#555" }}>地址：{project.address}</div>}
              {project.owner && <div style={{ fontSize: 12, color: "#555" }}>業主：{project.owner}</div>}
              {project.budget && <div style={{ fontSize: 12, color: "#555" }}>預算：{project.budget}</div>}
              {project.startDate && <div style={{ fontSize: 12, color: "#555" }}>開始日期：{project.startDate}</div>}
            </div>
            <div style={{ fontSize: 11, color: "#bbb", marginTop: 12 }}>
              匯出日期：{now} &nbsp;·&nbsp; 共 {logs.length} 筆討論記錄 &nbsp;·&nbsp; {members.length} 位成員
            </div>
          </div>

          {/* Members */}
          {members.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <SectionTitle>成員名單</SectionTitle>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#F5F5F2" }}>
                    <Th>姓名</Th><Th>身份</Th><Th>電話</Th><Th>Email</Th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} style={{ borderTop: "1px solid #EDEDEA" }}>
                      <Td bold>{m.name}</Td>
                      <Td>{m.role}</Td>
                      <Td>{m.phone || "—"}</Td>
                      <Td>{m.email || "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Discussion logs */}
          <div>
            <SectionTitle>討論記錄</SectionTitle>
            {logs.length === 0 && (
              <div style={{ fontSize: 12, color: "#bbb", padding: "20px 0" }}>尚無討論記錄</div>
            )}
            {logs.map(log => {
              const tagColor = TAG_COLOR[log.tag] || "#666";
              return (
                <div key={log.id} style={{
                  marginBottom: 12, padding: "12px 14px",
                  border: "1px solid #E8E8E4", borderLeft: `3px solid ${tagColor}`,
                  borderRadius: 6, pageBreakInside: "avoid",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                    <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#888", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, color: "#333" }}>{log.date}</span>
                      <span>{log.stage}</span>
                      <span style={{ fontWeight: 600, color: "#444" }}>{log.author}</span>
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: tagColor + "18", color: tagColor, fontWeight: 700 }}>
                      {log.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.8, color: "#222", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {log.content}
                  </div>
                  {log.replies?.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #EDEDEA" }}>
                      {log.replies.map((r, j) => (
                        <div key={j} style={{ fontSize: 12, color: "#555", marginBottom: 4, display: "flex", gap: 6 }}>
                          <span style={{ fontWeight: 700, color: "#333", flexShrink: 0 }}>{r.author}：</span>
                          <span>{r.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #EDEDEA", fontSize: 10, color: "#ccc", textAlign: "center" }}>
            老宅延壽機能復新計畫 — 業主・技師・設計師 共用協作平台
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 12, paddingLeft: 10, borderLeft: "3px solid #0A6647", letterSpacing: 0.3 }}>
      {children}
    </div>
  );
}

function Th({ children }) {
  return <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "#666", fontSize: 11 }}>{children}</th>;
}

function Td({ children, bold }) {
  return <td style={{ padding: "7px 10px", color: bold ? "#222" : "#555", fontWeight: bold ? 600 : 400, fontSize: 12 }}>{children}</td>;
}
