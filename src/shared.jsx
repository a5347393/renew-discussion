export const STAGES = ["初步評估", "設計規劃", "申請送件", "施工中", "驗收完成"];
export const TAGS = ["結構", "預算", "設計", "施工", "法規", "其他"];
export const ROLES = ["業主", "技師", "設計師"];
export const SPECIALTIES = ["結構安全", "防水隔熱", "水電管線", "室內設計", "無障礙設施", "申請流程"];

export const GREEN = "#0A6647";
export const GREEN_LIGHT = "#E8F7F1";

export const TAG_STYLES = {
  結構: { bg: "#FEF3E6", color: "#9C4B00", border: "#9C4B0033" },
  預算: { bg: "#E8F7F1", color: "#0A6647", border: "#0A664433" },
  設計: { bg: "#F2EEFF", color: "#5B2FA0", border: "#5B2FA033" },
  施工: { bg: "#EBF4FF", color: "#185FA5", border: "#185FA533" },
  法規: { bg: "#FCEBEB", color: "#A32D2D", border: "#A32D2D33" },
  其他: { bg: "#F1EFE8", color: "#5F5E5A", border: "#5F5E5A33" },
};

export const ROLE_COLORS = {
  技師: { bg: "#EBF4FF", color: "#185FA5" },
  設計師: { bg: "#F2EEFF", color: "#5B2FA0" },
  業主: { bg: GREEN_LIGHT, color: GREEN },
};

export const STATUS_OPTS = ["未開始", "進行中", "已完成", "待確認"];
export const STATUS_COLORS = {
  未開始: { bg: "#F1EFE8", color: "#888" },
  進行中: { bg: "#EBF4FF", color: "#185FA5" },
  已完成: { bg: GREEN_LIGHT, color: GREEN },
  待確認: { bg: "#FEF3E6", color: "#9C4B00" },
};

export const PROGRESS_ITEMS = [
  { id: "eval", label: "結構安全性能評估" },
  { id: "apply_city", label: "向地方政府申請" },
  { id: "review", label: "地方政府審查核准" },
  { id: "construction", label: "施工（1年內完工）" },
  { id: "submit_docs", label: "送審理備查" },
  { id: "claim", label: "向地方政府請款" },
];

export const PROJECT_FIELDS = [
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

export const inp = {
  width: "100%", border: "1.5px solid #e8e8e4", borderRadius: 8,
  padding: "8px 11px", fontSize: 13, fontFamily: "inherit",
  background: "#fff", color: "#111", outline: "none", boxSizing: "border-box",
};

export function today() { return new Date().toISOString().slice(0, 10); }

export function TagPill({ tag }) {
  const s = TAG_STYLES[tag] || TAG_STYLES["其他"];
  return (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {tag}
    </span>
  );
}
