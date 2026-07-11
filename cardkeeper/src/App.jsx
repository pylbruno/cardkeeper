import { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, getDocs, writeBatch,
} from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase.js";

// ── Data ──────────────────────────────────────────────────────────────────────
const BANKS = {
  "凱基銀行": { color: "#005BAA", accent: "#0078D4", cards: ["幣享卡","誠品聯名卡","凱基無限卡","雙幣哩程卡","魔BUY卡","凱基人壽卡","丁丁聯名卡"] },
  "遠東銀行": { color: "#003D7C", accent: "#0055A8", cards: ["Happy Go卡","Happy Go御璽卡","Happy Go鈦金卡","Happy Go白金卡","現金回饋卡","無限卡","商務卡"] },
  "新光銀行": { color: "#C8102E", accent: "#E8303E", cards: ["skm聯名卡（SOGO）","gogoro聯名卡","現金回饋卡","白金卡","無限卡","數位生活卡"] },
  "華南銀行": { color: "#007A3D", accent: "#009E50", cards: ["悠活卡","現金回饋卡","白金卡","無限卡","momo聯名卡","悠遊聯名卡"] },
  "台灣銀行": { color: "#004B87", accent: "#0060AA", cards: ["勁享卡","台銀卡","鈦金卡","商務白金卡","悠遊聯名卡"] },
  "合作金庫": { color: "#006B3C", accent: "#008B4E", cards: ["現金回饋卡","合庫 GO 卡","農金卡","悠遊白金卡","無限卡","icash聯名卡","長榮聯名卡"] },
  "第一銀行": { color: "#00529B", accent: "#0070CC", cards: ["樂活卡","i網購卡","現金回饋卡","白金卡","無限卡","悠遊聯名卡","iLEO聯名卡"] },
  "兆豐銀行": { color: "#005B9A", accent: "#007DC5", cards: ["MegaLite卡","現金回饋白金卡","VISA白金卡","VISA商務白金卡","MasterCard商務世界卡","悠遊聯名卡","VISA金融卡（Debit）"] },
  "星展銀行": { color: "#E60028", accent: "#FF1A3E", cards: ["eco永續卡","飛行世界卡","Everyday白金卡","旅遊白金卡","Live Fresh卡","Vantage無限卡","女神聯名卡","商務白金卡"] },
  "匯豐銀行": { color: "#DB0011", accent: "#FF3347", cards: ["旅人無限卡","旅人御璽卡","旅人輕旅卡","匯鑽卡","現金回饋御璽卡","Live+現金回饋卡"] },
  "渣打銀行": { color: "#1D5C2E", accent: "#1E8449", cards: ["現金回饋御璽卡","The Shopping Card","優先理財無限卡","亞洲萬里通卡","MANHATTAN鈦金卡"] },
  "聯邦銀行": { color: "#522398", accent: "#7B3FC4", cards: ["幸福M卡","吉鶴卡","賴點卡（LINE Pay聯名）","綠卡","鑽金卡","Catch卡","LINE Bank聯名卡","全國加油聯名卡","微風悠遊聯名卡"] },
  "玉山銀行": { color: "#00853E", accent: "#00A651", cards: ["Unicard","U Bear卡","Pi拍錢包信用卡","Only卡","熊本熊卡","數位e卡","Only商務卡"] },
  "台新銀行": { color: "#C8001A", accent: "#FF4D6A", cards: ["Richart卡（@GoGo）","Richart卡（FlyGo）","Richart卡（玫瑰Giving）","Richart卡（太陽）","Richart卡（玫瑰）","街口豬富卡","台灣大哥大聯名卡","gogoro聯名卡"] },
  "國泰世華": { color: "#006BA6", accent: "#00A3E0", cards: ["CUBE卡","蝦皮購物聯名卡","長榮航空聯名卡","亞洲萬里通聯名卡（世界卡）","亞洲萬里通聯名卡（白金卡）","亞洲萬里通聯名卡（里享卡）","商務鈦金卡","BEST現金回饋卡","悠遊聯名卡"] },
  "中國信託": { color: "#003087", accent: "#0057B8", cards: ["LINE Pay卡","uniopen聯名卡","ALL ME卡","foodpanda聯名卡","和泰聯名卡","中油聯名卡","Agoda聯名卡","中華航空哩程聯名卡","ANA哩程聯名卡","SOGO聯名卡","Taipei 101聯名卡","LOVE卡","JCB白金卡","大學生卡"] },
  "富邦銀行": { color: "#E85B10", accent: "#FF7F3F", cards: ["J卡","鑽保卡","富利生活系列卡","Costco聯名卡","悍將勇士聯名卡","momo卡","Open Possible聯名卡（台灣大哥大）","尊御世界卡","台茂聯名卡","采盟聯名卡","福華聯名卡"] },
  "永豐銀行": { color: "#00457C", accent: "#0070C0", cards: ["DAWHO現金回饋卡","SPORT卡","DAWAY卡","現金回饋Green卡","幣倍卡","現金回饋JCB卡","保倍卡","永傳世界卡","永富世界卡","夢行卡","Me Card","鈦豐卡","財富無限卡","MITSUI OUTLET PARK聯名卡","55688聯名卡","美麗華聯名卡"] },
  "花旗銀行": { color: "#003B70", accent: "#0057A8", cards: ["現金回饋卡","Prestige卡","Premier Miles卡","PrimeCash卡"] },
};

const CARD_GRADIENT = {
  "凱基銀行":  "linear-gradient(135deg, #003E7A 0%, #0060BB 100%)",
  "遠東銀行":  "linear-gradient(135deg, #002A56 0%, #004888 100%)",
  "新光銀行":  "linear-gradient(135deg, #8B0018 0%, #C8102E 100%)",
  "華南銀行":  "linear-gradient(135deg, #005428 0%, #008844 100%)",
  "台灣銀行":  "linear-gradient(135deg, #003368 0%, #00529B 100%)",
  "合作金庫":  "linear-gradient(135deg, #004828 0%, #007040 100%)",
  "第一銀行":  "linear-gradient(135deg, #003B6E 0%, #0060B0 100%)",
  "兆豐銀行":  "linear-gradient(135deg, #003F6E 0%, #006AB0 100%)",
  "星展銀行":  "linear-gradient(135deg, #9C001C 0%, #E60028 100%)",
  "匯豐銀行":  "linear-gradient(135deg, #8B0008 0%, #DB0011 100%)",
  "渣打銀行":  "linear-gradient(135deg, #0F3D1E 0%, #1E8449 100%)",
  "聯邦銀行":  "linear-gradient(135deg, #3A1870 0%, #7B3FC4 100%)",
  "玉山銀行":  "linear-gradient(135deg, #005C2B 0%, #00A651 100%)",
  "台新銀行":  "linear-gradient(135deg, #A8001A 0%, #E83050 100%)",
  "國泰世華":  "linear-gradient(135deg, #006BA6 0%, #00A3E0 100%)",
  "中國信託":  "linear-gradient(135deg, #003087 0%, #0057B8 100%)",
  "富邦銀行":  "linear-gradient(135deg, #C04A0A 0%, #FF7F3F 100%)",
  "永豐銀行":  "linear-gradient(135deg, #003460 0%, #0070C0 100%)",
  "花旗銀行":  "linear-gradient(135deg, #002B52 0%, #004A8F 100%)",
};

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const LS_KEY = "cardkeeper_cards_v1";

// ── Notification ──────────────────────────────────────────────────────────────
function fireNotification(cardName, isAutoDebit) {
  if ("Notification" in window && Notification.permission === "granted") {
    if (isAutoDebit) {
      new Notification("💳 自動扣款提醒", { body: `${cardName} 扣款日要到囉！請確認帳戶餘額是否足夠！`, icon: "/icon-192.png" });
    } else {
      new Notification("💳 信用卡繳費提醒", { body: `${cardName} 的繳款截止日到囉！請記得繳費！`, icon: "/icon-192.png" });
    }
  }
}

// Schedule daily checks at 17:00 (day before) and 12:00 (same day)
function scheduleReminders(cards) {
  const now = new Date();
  cards.filter(c => !c.autoDebit || c.autoDebitNotify).forEach(card => {
    const pay = parseInt(card.payDay);
    const name = card.customName || `${card.bank} ${card.cardType}`;
    [0, 1].forEach(daysBefore => {
      const hour = daysBefore === 1 ? 17 : 12;
      let target = new Date(now.getFullYear(), now.getMonth(), pay - daysBefore, hour, 0, 0);
      if (target <= now) target.setMonth(target.getMonth() + 1);
      const ms = target - now;
      if (ms > 0 && ms < 48 * 3600 * 1000) {
        setTimeout(() => fireNotification(name, card.autoDebit), ms);
      }
    });
  });
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 46, height: 26, borderRadius: 13, flexShrink: 0, cursor: "pointer",
      background: value ? "linear-gradient(135deg,#2B7A78,#17A589)" : "#D8EAEA",
      position: "relative", transition: "background .2s",
    }}>
      <div style={{
        position: "absolute", top: 3, left: value ? 23 : 3, width: 20, height: 20,
        borderRadius: "50%", background: "#fff", transition: "left .2s",
        boxShadow: "0 1px 4px rgba(0,0,0,.2)",
      }} />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#4A7C7B", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const inp = { width: "100%", boxSizing: "border-box", background: "#fff", border: "1.5px solid rgba(43,122,120,.2)", borderRadius: 10, padding: "10px 14px", fontSize: 15, color: "#1A4A49", outline: "none" };
const sel = { ...inp, appearance: "none", cursor: "pointer" };

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#F0F9F9", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "0 0 40px", boxShadow: "0 -8px 40px rgba(0,0,0,.15)", animation: "slideUp .28s cubic-bezier(.32,1.2,.6,1)" }}>
        <div style={{ padding: "20px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(43,122,120,.1)" }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#1A4A49" }}>{title}</div>
          <button onClick={onClose} style={{ background: "rgba(43,122,120,.1)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#2B7A78" }}>×</button>
        </div>
        <div style={{ padding: "16px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function CardVisual({ card }) {
  const gradient = CARD_GRADIENT[card.bank] || "linear-gradient(135deg,#2B7A78,#17A589)";
  const name = card.customName || `${card.bank} ${card.cardType}`;
  return (
    <div style={{ background: gradient, borderRadius: 20, padding: "28px 28px 22px", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,.22)", width: "100%", boxSizing: "border-box" }}>
      <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
      <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
      <div style={{ position: "absolute", top: 10, right: 28, fontSize: 28, opacity: .3 }}>VISA</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, opacity: .75, letterSpacing: 1 }}>{card.bank}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{name}</div>
        </div>
        {card.autoDebit && <div style={{ background: "rgba(255,255,255,.2)", borderRadius: 20, padding: "4px 10px", fontSize: 11 }}>自動扣繳</div>}
      </div>
      <div style={{ margin: "18px 0 14px", letterSpacing: "3px", fontSize: 15, opacity: .9 }}>•••• •••• •••• ••••</div>
      <div style={{ display: "flex", gap: 20, fontSize: 12, flexWrap: "wrap" }}>
        <div><div style={{ opacity: .65, marginBottom: 2 }}>結帳日</div><div style={{ fontWeight: 600 }}>每月 {card.billingDay} 日</div></div>
        <div><div style={{ opacity: .65, marginBottom: 2 }}>繳款截止</div><div style={{ fontWeight: 600 }}>每月 {card.payDay} 日</div></div>
        <div><div style={{ opacity: .65, marginBottom: 2 }}>額度</div><div style={{ fontWeight: 600 }}>NT${Number(card.limit).toLocaleString()}</div></div>
        {card.showExpiry && card.expiry && <div><div style={{ opacity: .65, marginBottom: 2 }}>有效期限</div><div style={{ fontWeight: 600 }}>{card.expiry}</div></div>}
      </div>
    </div>
  );
}

function CardForm({ initial, onSave, onCancel }) {
  const empty = { customName: "", bank: "", cardType: "", limit: "", billingDay: "", payDay: "", autoDebit: false, autoDebitNotify: false, showExpiry: false, expiry: "" };
  const [form, setForm] = useState(initial || empty);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const bankCards = form.bank ? BANKS[form.bank]?.cards || [] : [];
  const valid = form.bank && form.cardType && form.limit && form.billingDay && form.payDay;
  return (
    <div>
      <Field label="自訂卡片名稱（選填）">
        <input style={inp} placeholder="例如：我的主力刷卡卡" value={form.customName} onChange={e => set("customName", e.target.value)} />
      </Field>
      <Field label="發卡銀行 *">
        <select style={sel} value={form.bank} onChange={e => { set("bank", e.target.value); set("cardType", ""); }}>
          <option value="">請選擇銀行</option>
          {Object.keys(BANKS).map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </Field>
      <Field label="信用卡種類 *">
        <select style={sel} value={form.cardType} onChange={e => set("cardType", e.target.value)} disabled={!form.bank}>
          <option value="">請選擇卡片</option>
          {bankCards.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="信用額度（NT$） *">
        <input style={inp} type="number" placeholder="例如 100000" value={form.limit} onChange={e => set("limit", e.target.value)} />
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="每月結帳日 *">
            <select style={sel} value={form.billingDay} onChange={e => set("billingDay", e.target.value)}>
              <option value="">選擇日期</option>
              {DAYS.map(d => <option key={d} value={d}>每月 {d} 日</option>)}
            </select>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="繳款截止日 *">
            <select style={sel} value={form.payDay} onChange={e => set("payDay", e.target.value)}>
              <option value="">選擇日期</option>
              {DAYS.map(d => <option key={d} value={d}>每月 {d} 日</option>)}
            </select>
          </Field>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1.5px solid rgba(43,122,120,.2)", borderRadius: form.autoDebit ? "14px 14px 0 0" : 14, padding: "14px 16px", marginBottom: form.autoDebit ? 0 : 16 }}>
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <div>
            <div style={{ fontWeight: 600, color: "#1A4A49", fontSize: 14 }}>銀行自動扣繳</div>
            <div style={{ fontSize: 12, color: "#6B9A9A", marginTop: 2 }}>帳單到期時自動從帳戶扣款</div>
          </div>
          <Toggle value={form.autoDebit} onChange={v => set("autoDebit", v)} />
        </label>
      </div>
      {form.autoDebit && (
        <div style={{ background: "rgba(43,122,120,.04)", border: "1.5px solid rgba(43,122,120,.2)", borderTop: "1px dashed rgba(43,122,120,.15)", borderRadius: "0 0 14px 14px", padding: "14px 16px", marginBottom: 16 }}>
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div>
              <div style={{ fontWeight: 600, color: "#1A4A49", fontSize: 13 }}>🔔 餘額確認提醒</div>
              <div style={{ fontSize: 11, color: "#6B9A9A", marginTop: 2 }}>扣款前一天17:00及當天12:00提醒確認餘額</div>
            </div>
            <Toggle value={form.autoDebitNotify} onChange={v => set("autoDebitNotify", v)} />
          </label>
        </div>
      )}
      <div style={{ background: "#fff", border: "1.5px solid rgba(43,122,120,.2)", borderRadius: 14, padding: "14px 16px", marginBottom: form.showExpiry ? 0 : 16 }}>
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <div style={{ fontWeight: 600, color: "#1A4A49", fontSize: 14 }}>顯示有效期限</div>
          <Toggle value={form.showExpiry} onChange={v => set("showExpiry", v)} />
        </label>
      </div>
      {form.showExpiry && (
        <div style={{ background: "#fff", border: "1.5px solid rgba(43,122,120,.2)", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "12px 16px", marginBottom: 16 }}>
          <input style={{ ...inp, border: "1.5px solid rgba(43,122,120,.15)" }} placeholder="MM/YY，例如 08/27" value={form.expiry} onChange={e => set("expiry", e.target.value)} />
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "13px", borderRadius: 14, border: "1.5px solid rgba(43,122,120,.25)", background: "transparent", color: "#2B7A78", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>取消</button>
        <button onClick={() => valid && onSave(form)} style={{ flex: 2, padding: "13px", borderRadius: 14, border: "none", background: valid ? "linear-gradient(135deg,#2B7A78,#17A589)" : "#C8DEDD", color: "#fff", fontWeight: 700, fontSize: 15, cursor: valid ? "pointer" : "not-allowed" }}>儲存</button>
      </div>
    </div>
  );
}

// ── Login screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, loggingIn }) {
  return (
    <div style={{ fontFamily: "'PingFang TC','Noto Sans TC',sans-serif", background: "linear-gradient(160deg,#2B7A78 0%,#17A589 100%)", minHeight: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>💳</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -.5 }}>CardKeeper</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,.85)", marginTop: 8, marginBottom: 36, textAlign: "center" }}>登入後，你的信用卡資料會安全地同步到雲端</div>
      <button onClick={onLogin} disabled={loggingIn} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "none", borderRadius: 16, padding: "14px 28px", fontSize: 16, fontWeight: 700, color: "#1A4A49", cursor: loggingIn ? "wait" : "pointer", boxShadow: "0 8px 30px rgba(0,0,0,.2)", fontFamily: "inherit" }}>
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        {loggingIn ? "登入中…" : "使用 Google 登入"}
      </button>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
let seq = Date.now();
const mkId = () => `c_${seq++}`;

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [cards, setCards] = useState([]);
  const [tab, setTab] = useState("cards");
  const [showAdd, setShowAdd] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [detailCard, setDetailCard] = useState(null);
  const [toast, setToast] = useState(null);
  const [notifGranted, setNotifGranted] = useState(false);

  // Watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  // Subscribe to this user's cards in Firestore.
  // First login: if the collection is empty, migrate any cards left in localStorage.
  useEffect(() => {
    if (!user) { setCards([]); return; }
    const cardsCol = collection(db, "users", user.uid, "cards");
    let unsub = null;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(cardsCol);
        if (snap.empty) {
          const local = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
          if (Array.isArray(local) && local.length) {
            const batch = writeBatch(db);
            local.forEach((c, i) => {
              const { id, ...data } = c;
              batch.set(doc(cardsCol, id || mkId()), { ...data, createdAt: Date.now() + i });
            });
            await batch.commit();
          }
        }
      } catch (e) {
        console.error("讀取雲端資料失敗", e);
      }
      if (cancelled) return;
      unsub = onSnapshot(query(cardsCol, orderBy("createdAt")), s => {
        setCards(s.docs.map(d => ({ id: d.id, ...d.data() })));
      }, e => console.error("即時同步失敗", e));
    })();
    return () => { cancelled = true; if (unsub) unsub(); };
  }, [user]);

  const login = async () => {
    setLoggingIn(true);
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") console.error("登入失敗", e); }
    finally { setLoggingIn(false); }
  };
  const logout = () => signOut(auth);

  // Check notification permission and schedule reminders
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") setNotifGranted(true);
  }, []);
  useEffect(() => { scheduleReminders(cards); }, [cards]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const requestNotif = async () => {
    if ("Notification" in window) {
      const p = await Notification.requestPermission();
      if (p === "granted") { setNotifGranted(true); showToast("✅ 已開啟通知提醒"); }
    }
  };

  const cardDoc = id => doc(db, "users", user.uid, "cards", id);

  const addCard = async form => {
    setShowAdd(false);
    try {
      await setDoc(cardDoc(mkId()), { ...form, createdAt: Date.now() });
      showToast("✅ 信用卡已新增");
    } catch (e) { console.error(e); showToast("⚠️ 新增失敗，請稍後再試"); }
  };
  const saveEdit = async form => {
    const id = editCard.id;
    if (detailCard?.id === id) setDetailCard(d => ({ ...d, ...form }));
    setEditCard(null);
    try {
      await updateDoc(cardDoc(id), { ...form });
      showToast("✅ 已儲存變更");
    } catch (e) { console.error(e); showToast("⚠️ 儲存失敗，請稍後再試"); }
  };
  const deleteCard = async id => {
    setDetailCard(null); setEditCard(null);
    try {
      await deleteDoc(cardDoc(id));
      showToast("🗑 已刪除卡片");
    } catch (e) { console.error(e); showToast("⚠️ 刪除失敗，請稍後再試"); }
  };

  const today = new Date();
  const upcomingCards = cards
    .filter(c => !c.autoDebit || c.autoDebitNotify)
    .map(c => {
      const pay = parseInt(c.payDay);
      let payDate = new Date(today.getFullYear(), today.getMonth(), pay);
      if (payDate < today) payDate = new Date(today.getFullYear(), today.getMonth() + 1, pay);
      return { ...c, payDate, diff: Math.round((payDate - today) / 86400000) };
    })
    .sort((a, b) => a.diff - b.diff);

  if (authLoading) {
    return (
      <div style={{ fontFamily: "'PingFang TC','Noto Sans TC',sans-serif", background: "#EDF5F5", minHeight: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", color: "#8ABABA", fontSize: 15, fontWeight: 600 }}>
        載入中…
      </div>
    );
  }
  if (!user) return <LoginScreen onLogin={login} loggingIn={loggingIn} />;

  return (
    <div style={{ fontFamily: "'PingFang TC','Noto Sans TC',sans-serif", background: "#EDF5F5", minHeight: "100vh", maxWidth: 430, margin: "0 auto", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0;transform:translateY(8px); } to { opacity:1;transform:translateY(0); } }
        *{-webkit-tap-highlight-color:transparent;}
        ::-webkit-scrollbar{display:none;}
        select,input{font-family:inherit;}
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#2B7A78 0%,#17A589 100%)", padding: "env(safe-area-inset-top,14px) 24px 24px", paddingTop: "max(env(safe-area-inset-top),14px)", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 12, opacity: .75 }}>我的信用卡</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.5 }}>CardKeeper</div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ background: "rgba(255,255,255,.95)", border: "none", borderRadius: 16, width: 52, height: 52, cursor: "pointer", color: "#2B7A78", fontSize: 30, fontWeight: 300, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,.18)", lineHeight: 1 }}>+</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, opacity: .8 }}>共 {cards.length} 張信用卡</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 26, height: 26, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.5)" }} />}
            <span style={{ fontSize: 12, opacity: .9, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName || user.email}</span>
            <button onClick={logout} style={{ background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.35)", borderRadius: 20, padding: "4px 12px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>登出</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid rgba(43,122,120,.1)", position: "sticky", top: 0, zIndex: 10 }}>
        {[["cards", "💳 我的卡片"], ["reminders", "🔔 繳款提醒"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: "14px 0", border: "none", background: "transparent", color: tab === key ? "#2B7A78" : "#8ABABA", fontWeight: tab === key ? 700 : 500, fontSize: 14, cursor: "pointer", borderBottom: tab === key ? "2.5px solid #2B7A78" : "2.5px solid transparent" }}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 120px" }}>

        {tab === "cards" && (
          <div>
            {!notifGranted && (
              <div style={{ background: "linear-gradient(135deg,rgba(43,122,120,.08),rgba(23,165,137,.05))", border: "1.5px solid rgba(43,122,120,.2)", borderRadius: 14, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A4A49" }}>開啟繳款到期通知</div>
                  <div style={{ fontSize: 11, color: "#6B9A9A", marginTop: 2 }}>截止日前一天17:00 & 當天12:00</div>
                </div>
                <button onClick={requestNotif} style={{ background: "linear-gradient(135deg,#2B7A78,#17A589)", border: "none", borderRadius: 20, padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>開啟</button>
              </div>
            )}
            {cards.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8ABABA" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>尚未新增任何信用卡</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>點擊右上角 + 新增</div>
              </div>
            )}
            {cards.map(card => (
              <div key={card.id} style={{ marginBottom: 14, cursor: "pointer", animation: "fadeIn .3s ease" }} onClick={() => setDetailCard(card)}>
                <CardVisual card={card} />
                <div style={{ background: "#fff", borderRadius: "0 0 16px 16px", marginTop: -8, padding: "14px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,.06)" }}>
                  <div style={{ fontSize: 12 }}>
                    {card.autoDebit
                      ? card.autoDebitNotify
                        ? <span style={{ color: "#2B9EA8", fontWeight: 600 }}>✓ 自動扣繳・餘額提醒開啟</span>
                        : <span style={{ color: "#17A589", fontWeight: 600 }}>✓ 自動扣繳</span>
                      : <span style={{ color: "#E67E22", fontWeight: 600 }}>⚠ 需自行繳費</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={e => { e.stopPropagation(); setEditCard(card); }} style={{ background: "rgba(43,122,120,.08)", border: "none", borderRadius: 20, padding: "5px 12px", color: "#2B7A78", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>編輯</button>
                    {(!card.autoDebit || card.autoDebitNotify) && (
                      <button onClick={e => { e.stopPropagation(); fireNotification(card.customName || `${card.bank} ${card.cardType}`, card.autoDebit); showToast("🔔 模擬通知已送出"); }} style={{ background: card.autoDebit ? "rgba(43,158,168,.08)" : "rgba(230,126,34,.08)", border: "none", borderRadius: 20, padding: "5px 12px", color: card.autoDebit ? "#2B9EA8" : "#E67E22", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>測試通知</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "reminders" && (
          <div>
            <div style={{ fontSize: 13, color: "#6B9A9A", marginBottom: 14 }}>顯示需自行繳費及已開啟餘額提醒的卡片，系統將於截止日前一天 17:00 及當天 12:00 發送提醒。</div>
            {upcomingCards.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8ABABA" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>所有卡片皆為自動扣繳</div>
              </div>
            )}
            {upcomingCards.map(card => (
              <div key={card.id} style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,.06)", display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: card.diff <= 1 ? "linear-gradient(135deg,#E74C3C,#C0392B)" : card.diff <= 3 ? "linear-gradient(135deg,#E67E22,#CA6F1E)" : "linear-gradient(135deg,#2B7A78,#17A589)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                  <div style={{ fontSize: 18 }}>{card.diff}</div>
                  <div style={{ fontSize: 10, opacity: .85 }}>天後</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <div style={{ fontWeight: 700, color: "#1A4A49", fontSize: 15 }}>{card.customName || `${card.bank} ${card.cardType}`}</div>
                    {card.autoDebit && <span style={{ background: "rgba(43,158,168,.1)", color: "#2B9EA8", fontSize: 10, fontWeight: 600, borderRadius: 8, padding: "2px 7px" }}>自動扣繳</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B9A9A" }}>
                    {card.autoDebit ? "扣款截止：" : "繳款截止日："}{card.payDate.getMonth() + 1}/{card.payDate.getDate()}
                    {card.diff === 0 && <span style={{ color: "#E74C3C", fontWeight: 700 }}> ⚠ 今天！</span>}
                    {card.diff === 1 && <span style={{ color: "#E67E22", fontWeight: 700 }}> 明天</span>}
                  </div>
                </div>
                <button onClick={() => fireNotification(card.customName || `${card.bank} ${card.cardType}`, card.autoDebit)} style={{ background: "rgba(43,122,120,.08)", border: "none", borderRadius: 20, padding: "6px 12px", color: "#2B7A78", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>🔔 測試</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal show={showAdd} onClose={() => setShowAdd(false)} title="新增信用卡">
        <CardForm onSave={addCard} onCancel={() => setShowAdd(false)} />
      </Modal>
      <Modal show={!!editCard} onClose={() => setEditCard(null)} title="編輯信用卡">
        {editCard && (
          <>
            <CardForm initial={editCard} onSave={saveEdit} onCancel={() => setEditCard(null)} />
            <button onClick={() => { if (window.confirm("確定要刪除這張卡片嗎？")) deleteCard(editCard.id); }} style={{ width: "100%", marginTop: 8, padding: "12px", borderRadius: 14, border: "1.5px solid rgba(231,76,60,.3)", background: "rgba(231,76,60,.05)", color: "#E74C3C", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>🗑 刪除此卡片</button>
          </>
        )}
      </Modal>
      <Modal show={!!detailCard} onClose={() => setDetailCard(null)} title="卡片詳情">
        {detailCard && (
          <div>
            <CardVisual card={detailCard} />
            <div style={{ height: 16 }} />
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["額度", `NT$${Number(detailCard.limit).toLocaleString()}`], ["結帳日", `每月 ${detailCard.billingDay} 日`], ["繳款截止", `每月 ${detailCard.payDay} 日`], ["繳費方式", detailCard.autoDebit ? (detailCard.autoDebitNotify ? "自動扣繳・餘額提醒 ✓" : "自動扣繳 ✓") : "需自行繳費"]].map(([k, v]) => (
                <div key={k}><div style={{ fontSize: 11, color: "#8ABABA", marginBottom: 3 }}>{k}</div><div style={{ fontSize: 14, fontWeight: 700, color: "#1A4A49" }}>{v}</div></div>
              ))}
            </div>
            <button onClick={() => { setDetailCard(null); setEditCard(detailCard); }} style={{ width: "100%", marginTop: 8, padding: "13px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#2B7A78,#17A589)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✏️ 編輯此卡片</button>
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#1A4A49", color: "#fff", borderRadius: 24, padding: "10px 20px", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,.2)", animation: "fadeIn .2s ease", zIndex: 2000, whiteSpace: "nowrap" }}>{toast}</div>
      )}

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid rgba(43,122,120,.1)", padding: "10px 0", paddingBottom: "max(env(safe-area-inset-bottom),10px)", display: "flex", justifyContent: "center", gap: 60 }}>
        {[["cards", "💳", "卡片"], ["reminders", "🔔", "提醒"]].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: tab === key ? "#2B7A78" : "#8ABABA" }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === key ? 700 : 500 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
