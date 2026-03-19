import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { GREEN, inp } from "./shared";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError("帳號或密碼錯誤，請確認後重試");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email.trim() && password.trim();

  return (
    <div style={{
      fontFamily: '"Noto Sans TC", -apple-system, system-ui, sans-serif',
      maxWidth: 720, margin: "0 auto", minHeight: "100vh",
      background: "#F2F1EE", display: "flex", flexDirection: "column",
    }}>
      {/* Header — same gradient as main app */}
      <div style={{
        background: "linear-gradient(150deg, #0d8a60 0%, #0A6647 45%, #074d34 100%)",
        padding: "40px 24px 48px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -30, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 65%)", pointerEvents: "none" }} />

        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 4, color: "rgba(255,255,255,0.38)", marginBottom: 8, textTransform: "uppercase" }}>
          Project Management
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: -0.4, lineHeight: 1.15, marginBottom: 6 }}>
          老宅延壽機能復新計畫
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>業主・技師・設計師 共用協作平台</div>
      </div>

      {/* Login card */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "36px 24px 48px" }}>
        <form onSubmit={login} style={{ width: "100%", maxWidth: 360 }}>
          <div className="anim-form-open" style={{
            background: "#fff", borderRadius: 16, padding: "28px 24px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.08)",
            border: "1px solid #E8E8E4",
          }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111", letterSpacing: -0.2 }}>登入</div>
              <div style={{ width: 24, height: 2.5, background: GREEN, borderRadius: 2, marginTop: 7 }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 600, letterSpacing: 0.4 }}>Email</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" style={inp} autoComplete="email" autoFocus />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 600, letterSpacing: 0.4 }}>密碼</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" style={inp} autoComplete="current-password" />
            </div>

            {error && (
              <div className="anim-fade-in" style={{
                fontSize: 12, color: "#A32D2D", background: "#FFF4F4",
                border: "1px solid rgba(163,45,45,0.15)", borderRadius: 8,
                padding: "9px 12px", marginBottom: 16, lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !canSubmit} className="btn-press"
              style={{
                width: "100%", padding: "12px", borderRadius: 10, border: "none",
                background: canSubmit
                  ? "linear-gradient(135deg, #0d8a60, #0A6647)"
                  : "#D4D4D0",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: canSubmit ? "pointer" : "default",
                fontFamily: "inherit",
                boxShadow: canSubmit ? "0 2px 8px rgba(10,102,71,0.3)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "box-shadow .15s, background .15s",
              }}>
              {loading && (
                <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spinnerRotate .7s linear infinite" }} />
              )}
              {loading ? "登入中…" : "登入"}
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#aaa", lineHeight: 1.7 }}>
            帳號由管理員設定<br />如需協助請聯繫業主
          </div>
        </form>
      </div>
    </div>
  );
}
