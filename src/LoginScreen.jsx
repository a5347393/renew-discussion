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

  return (
    <div style={{
      fontFamily: '"Noto Sans TC", -apple-system, system-ui, sans-serif',
      maxWidth: 720, margin: "0 auto", minHeight: "100vh",
      background: "#F5F5F3", display: "flex", flexDirection: "column",
    }}>
      <div style={{ background: GREEN, padding: "28px 20px 32px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#6FD4AA", marginBottom: 4 }}>
          老宅延壽機能復新計畫
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>專案管理後台</div>
        <div style={{ fontSize: 12, color: "#A8E6CC", marginTop: 4 }}>業主・技師・設計師 共用</div>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "40px 24px" }}>
        <form onSubmit={login} style={{ width: "100%", maxWidth: 360 }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "28px 24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #EDEDEA",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#222", marginBottom: 22 }}>登入</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>Email</div>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={inp} autoComplete="email" autoFocus
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>密碼</div>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inp} autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                fontSize: 12, color: "#A32D2D", background: "#FCEBEB",
                border: "1px solid #A32D2D33", borderRadius: 8,
                padding: "8px 12px", marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              style={{
                width: "100%", padding: "11px", borderRadius: 10, border: "none",
                background: email.trim() && password.trim() ? GREEN : "#ccc",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: email.trim() && password.trim() ? "pointer" : "default",
                fontFamily: "inherit", transition: "background .15s",
              }}>
              {loading ? "登入中…" : "登入"}
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#aaa" }}>
            帳號由管理員設定，如需協助請聯繫業主
          </div>
        </form>
      </div>
    </div>
  );
}
