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
      background: "#F5F5F3", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(145deg, ${GREEN} 0%, #0e8059 100%)`, padding: "36px 24px 40px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#6FD4AA", marginBottom: 6 }}>
          老宅延壽機能復新計畫
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>專案管理後台</div>
        <div style={{ fontSize: 12, color: "#A8E6CC" }}>業主・技師・設計師 共用協作平台</div>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "36px 24px 48px" }}>
        <form onSubmit={login} style={{ width: "100%", maxWidth: 360 }}>
          <div className="anim-form-open" style={{
            background: "#fff", borderRadius: 16, padding: "28px 24px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.09)", border: "1px solid #EDEDEA",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#222", marginBottom: 24 }}>
              登入
              <div style={{ width: 28, height: 3, background: GREEN, borderRadius: 2, marginTop: 6 }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 600, letterSpacing: 0.5 }}>Email</div>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={inp} autoComplete="email" autoFocus
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 600, letterSpacing: 0.5 }}>密碼</div>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inp} autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="anim-fade-in" style={{
                fontSize: 12, color: "#A32D2D", background: "#FCEBEB",
                border: "1px solid #A32D2D33", borderRadius: 8,
                padding: "9px 12px", marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="btn-press"
              style={{
                width: "100%", padding: "12px", borderRadius: 10, border: "none",
                background: canSubmit ? GREEN : "#ccc",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: canSubmit ? "pointer" : "default",
                fontFamily: "inherit", transition: "background .15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              {loading && <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spinnerRotate .7s linear infinite" }} />}
              {loading ? "登入中…" : "登入"}
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "#aaa", lineHeight: 1.6 }}>
            帳號由管理員設定<br />如需協助請聯繫業主
          </div>
        </form>
      </div>
    </div>
  );
}
