/* TỶ GIÁ VCB — bảng tỷ giá bán của Vietcombank, ngày hiệu lực và lịch sử (T1-01).
   Dữ liệu nằm ở state.settings[0].fxRates = { source, rateType, history: [...] }.
   Mỗi phần tử history: { date, mode, by, at, vcbTime, rates: { USD: 26050, VND: 1, ... } }.
   Số trong rates là số VND cho 1 đơn vị ngoại tệ (giá bán). history xếp mới nhất lên đầu. */

const fxHistoryLimit = 800;

/* Tiền hiển thị chung cho giá tour/báo giá (T1-02). Dữ liệu vẫn lưu bằng VND. */
const fxDisplayCurrency = "USD";

const fxPinnedCurrencies = [
  "USD",
  "EUR",
  "CAD",
  "VND",
];

const fxCurrencyNames = {
  USD: "Đô la Mỹ",
  EUR: "Euro",
  CAD: "Đô la Canada",
  VND: "Đồng Việt Nam",
  AUD: "Đô la Úc",
  CHF: "Franc Thụy Sĩ",
  CNY: "Nhân dân tệ",
  DKK: "Krone Đan Mạch",
  GBP: "Bảng Anh",
  HKD: "Đô la Hồng Kông",
  INR: "Rupee Ấn Độ",
  JPY: "Yên Nhật",
  KRW: "Won Hàn Quốc",
  KWD: "Dinar Kuwait",
  MYR: "Ringgit Malaysia",
  NOK: "Krone Na Uy",
  RUB: "Rúp Nga",
  SAR: "Rial Ả Rập Xê Út",
  SEK: "Krona Thụy Điển",
  SGD: "Đô la Singapore",
  THB: "Baht Thái",
};

let fxBusy = false;

/* ---------- Đọc dữ liệu tỷ giá ---------- */
function fxHistory() {
  return state.settings?.[0]?.fxRates?.history || [];
}

/* Bản tỷ giá có hiệu lực vào một ngày (YYYY-MM-DD): bản mới nhất có date <= ngày đó. */
function fxEntryOn(dateISO) {
  return fxHistory().find((entry) => entry.date <= dateISO) || null;
}

function fxCurrent() {
  return fxEntryOn(todayISO());
}

/* Số VND cho 1 đơn vị ngoại tệ; trả null nếu chưa có tỷ giá. */
function fxRate(code, entry = fxCurrent()) {
  const value = Number(entry?.rates?.[code]);
  return value > 0 ? value : null;
}

/* Đổi tiền giữa hai loại qua VND; trả null nếu thiếu tỷ giá. */
function fxConvert(amount, from, to, entry = fxCurrent()) {
  const fromRate = fxRate(from, entry);
  const toRate = fxRate(to, entry);
  if (!fromRate || !toRate) return null;
  return (Number(amount) * fromRate) / toRate;
}

/* Hiển thị số tiền VND ở tiền tệ `code` theo bảng tỷ giá; thiếu tỷ giá thì hiện VND. */
function fxMoney(vnd, code = fxDisplayCurrency, entry = fxCurrent()) {
  const amount = Number(vnd) || 0;
  if (code === "VND") return money(amount);
  const value = fxConvert(amount, "VND", code, entry);
  if (value === null) return money(amount);
  return fxFormat(value, code);
}

function fxFormat(value, code) {
  const digits = Math.abs(value) < 100 ? 2 : 0;
  const text = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);
  return `${text} ${code}`;
}

/* ---------- Tỷ giá theo ngày tạo chứng từ (T1-03) ---------- */
/* Chứng từ KHÔNG lưu tỷ giá, chỉ có ngày tạo; tỷ giá của ngày đó được tra lại trong history.
   Ngày tạo lấy từ: fxDate (báo giá, phiên bản, booking) → issuedAt (hóa đơn) → date (giao dịch)
   → ngày của createdAt (báo giá cũ). Không có ngày nào thì dùng tỷ giá hiện hành. */
function fxDocDate(doc) {
  const created = String(doc?.createdAt || "").slice(0, 10);
  return doc?.fxDate || doc?.issuedAt || doc?.date || created || "";
}

function fxOldestEntry() {
  const history = fxHistory();
  return history[history.length - 1] || null;
}

/* Bản tỷ giá của ngày tạo chứng từ; ngày sớm hơn mọi bản đã lưu thì dùng bản cũ nhất. */
function fxEntryOf(doc) {
  const date = fxDocDate(doc);
  if (!date) return fxCurrent();
  return fxEntryOn(date) || fxOldestEntry();
}

/* ---------- Nhập tiền theo tiền tệ đang chọn (mặc định USD), lưu bằng VND ---------- */
/* Tiền dùng cho ô nhập: thiếu tỷ giá của `code` thì nhập bằng VND. */
function fxInputCode(code = fxDisplayCurrency, entry = fxCurrent()) {
  return code && code !== "VND" && fxRate(code, entry) ? code : "VND";
}

/* Số trong ô nhập (tiền `code`) → số VND để lưu. */
function fxToVnd(amount, code, entry = fxCurrent()) {
  const value = Number(amount) || 0;
  const rate = code === "VND" ? 1 : fxRate(code, entry) || 1;
  return Math.round(value * rate);
}

/* Số VND đã lưu → số hiện trong ô nhập (tiền `code`), làm tròn 2 số lẻ. */
function fxFromVnd(vnd, code, entry = fxCurrent()) {
  const value = Number(vnd) || 0;
  if (code === "VND") return value;
  const converted = fxConvert(value, "VND", code, entry);
  return converted === null ? value : Math.round(converted * 100) / 100;
}

/* Hiển thị số VND của một chứng từ ở tiền tệ `code` theo tỷ giá đã chụp trên chứng từ đó. */
function fxMoneyOf(doc, vnd, code = fxDisplayCurrency) {
  return fxMoney(vnd, code, fxEntryOf(doc));
}

/* Cộng nhiều chứng từ: mỗi cái quy đổi theo tỷ giá của riêng nó rồi mới cộng. */
function fxSumMoney(docs, amountOf, code = fxDisplayCurrency) {
  let total = 0;
  let sumVnd = 0;
  let complete = code !== "VND";
  for (const doc of docs) {
    const vnd = Number(amountOf(doc)) || 0;
    const value = fxConvert(vnd, "VND", code, fxEntryOf(doc));
    sumVnd += vnd;
    if (value === null) complete = false;
    else total += value;
  }
  return complete ? fxFormat(total, code) : money(sumVnd);
}

/* "1.000 USD (26.050.000 ₫)": số tiền khách nhìn thấy kèm số VND; thiếu tỷ giá thì chỉ VND. */
function fxDual(vnd, entry) {
  if (!fxRate(fxDisplayCurrency, entry)) return money(vnd);
  return `${fxMoney(vnd, fxDisplayCurrency, entry)} (${money(vnd)})`;
}

/* Các tiền tệ cho nút chuyển hiển thị: USD, tiền của khách (nếu có tỷ giá), VND. */
function fxViewCurrencies(extra = "") {
  const codes = [fxDisplayCurrency];
  if (extra && extra !== "VND" && !codes.includes(extra) && fxRate(extra)) codes.push(extra);
  codes.push("VND");
  return codes;
}

/* ---------- Ghi dữ liệu tỷ giá ---------- */
function fxStore() {
  if (!state.settings.length) state.settings.push({ id: "CFG-1" });
  const settings = state.settings[0];
  if (!settings.fxRates) {
    settings.fxRates = { source: "VCB", rateType: "sell", history: [] };
  }
  if (!Array.isArray(settings.fxRates.history)) settings.fxRates.history = [];
  return settings.fxRates;
}

/* Mỗi ngày hiệu lực chỉ có một bản: ghi lại cùng ngày thì thay bản cũ. */
function fxSaveEntry(entry) {
  const store = fxStore();
  const history = store.history.filter((item) => item.date !== entry.date);
  history.push(entry);
  history.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  store.history = history.slice(0, fxHistoryLimit);
}

/* ---------- Lấy tỷ giá từ Vietcombank (qua fx-vcb.php) ---------- */
async function fxFetchVcb() {
  const response = await fetch(TRAVEL_CONFIG.fxEndpoint, { cache: "no-store" });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || "Không lấy được tỷ giá từ Vietcombank.");
  }
  return result;
}

/* Chỉ lấy cột "Bán" (giá bán) của VCB; VND luôn bằng 1. */
function fxEntryFromVcb(result) {
  const rates = { VND: 1 };
  for (const [code, row] of Object.entries(result.rates || {})) {
    if (Number(row?.sell) > 0) rates[code] = Number(row.sell);
  }
  return {
    date: todayISO(),
    mode: "auto",
    by: actor().name,
    at: nowISO(),
    vcbTime: result.vcbTime || "",
    rates,
  };
}

async function fxPullFromVcb() {
  const result = await fxFetchVcb();
  if (result.stale || !(Number(result.rates?.USD?.sell) > 0)) {
    throw new Error("Vietcombank tạm thời không phản hồi, chưa cập nhật được tỷ giá.");
  }
  fxSaveEntry(fxEntryFromVcb(result));
}

/* Tự cập nhật mỗi ngày 1 lần: chạy khi Giám đốc/Kế toán vào hệ thống và hôm nay chưa có bản. */
async function fxAutoUpdate() {
  if (!can("fx_manage") || fxBusy) return;
  if (!TRAVEL_CONFIG.fxEndpoint) return;
  if (fxHistory()[0]?.date === todayISO()) return;
  fxBusy = true;
  try {
    await fxPullFromVcb();
    audit("settings", "fxRates", "UPDATE", `Tự động cập nhật tỷ giá VCB ngày ${todayISO()}`);
    save();
    if (["settings", "accounting"].includes(current)) render();
  } catch (error) {
    console.warn("Chưa tự cập nhật được tỷ giá VCB:", error);
  } finally {
    fxBusy = false;
  }
}

/* Nút "Cập nhật từ VCB": lấy lại ngay, ghi đè bản của hôm nay. */
async function fxRefreshNow() {
  if (!requireCapability("fx_manage")) return;
  if (fxBusy) return;
  const today = fxHistory()[0];
  if (today?.date === todayISO() && today.mode === "manual") {
    if (!confirm("Tỷ giá hôm nay đang nhập tay. Ghi đè bằng tỷ giá VCB?")) return;
  }
  fxBusy = true;
  try {
    await fxPullFromVcb();
    audit("settings", "fxRates", "UPDATE", "Cập nhật tỷ giá VCB theo yêu cầu");
    save();
    render();
    toast("Đã cập nhật tỷ giá Vietcombank.");
  } catch (error) {
    toast(error.message);
  } finally {
    fxBusy = false;
  }
}

/* ---------- Nhập tay ---------- */
function fxSortCodes(codes) {
  const pinned = fxPinnedCurrencies.filter((code) => codes.includes(code));
  const others = codes.filter((code) => !pinned.includes(code)).sort();
  return pinned.concat(others);
}

function fxRateField(code, entry) {
  const value = fxRate(code, entry) || "";
  const name = fxCurrencyNames[code] || code;
  const required = code === "USD" ? "required" : "";
  const input = `<input name="rate_${esc(code)}" type="number" min="0" step="any" value="${value}" ${required}>`;
  return `<label>${esc(code)} · ${esc(name)}${input}</label>`;
}

function fxEditForm() {
  if (!requireCapability("fx_manage")) return;
  const entry = fxCurrent();
  const known = Object.keys(entry?.rates || {}).filter((code) => code !== "VND");
  const codes = fxSortCodes(known.length ? known : ["USD", "EUR", "CAD"]);
  const fields = codes.map((code) => fxRateField(code, entry)).join("");
  modal(
    "Nhập tay tỷ giá",
    `<form onsubmit="fxSaveManual(event)">
      <div class="formgrid">
        <label class="full">Ngày hiệu lực<input name="date" type="date" max="${todayISO()}" value="${todayISO()}" required></label>
        ${fields}
      </div>
      <div class="notice">Nhập số VND cho 1 đơn vị ngoại tệ, theo giá bán của Vietcombank. Để trống nếu không dùng loại tiền đó.</div>
      <div class="formfooter"><button class="btn primary">Lưu tỷ giá</button></div>
    </form>`,
  );
}

function fxSaveManual(event) {
  event.preventDefault();
  if (!requireCapability("fx_manage")) return;
  const f = new FormData(event.target);
  const date = String(f.get("date") || "");
  if (!date || date > todayISO()) return toast("Ngày hiệu lực không hợp lệ.");
  const rates = { VND: 1 };
  for (const [key, value] of f.entries()) {
    if (!key.startsWith("rate_") || String(value).trim() === "") continue;
    const rate = Number(value);
    if (!Number.isFinite(rate) || rate <= 0) return toast("Tỷ giá phải là số lớn hơn 0.");
    rates[key.slice(5)] = rate;
  }
  if (!rates.USD) return toast("Cần nhập tỷ giá USD.");
  fxSaveEntry({
    date,
    mode: "manual",
    by: actor().name,
    at: nowISO(),
    vcbTime: "",
    rates,
  });
  audit("settings", "fxRates", "UPDATE", `Nhập tay tỷ giá ngày ${date}`);
  save();
  closeModal();
  render();
  toast("Đã lưu tỷ giá.");
}

/* ---------- Giao diện (dùng trong Cài đặt và trong Kế toán) ---------- */
function fxDateVN(iso) {
  return String(iso || "").split("-").reverse().join("/");
}

function fxNumber(value) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
}

function fxSmallNumber(value) {
  return new Intl.NumberFormat("vi-VN", { maximumSignificantDigits: 5 }).format(value);
}

function fxModeLabel(mode) {
  return mode === "manual" ? "Nhập tay" : "Tự động VCB";
}

function fxActions() {
  if (!can("fx_manage")) return "";
  return btn("Cập nhật từ VCB", "fxRefreshNow()", "primary") + btn("Nhập tay", "fxEditForm()");
}

function fxSummaryLine(entry) {
  const parts = [
    `Có hiệu lực từ <b>${fxDateVN(entry.date)}</b>`,
    badge(fxModeLabel(entry.mode)),
    `Cập nhật bởi ${esc(entry.by || "—")}`,
  ];
  if (entry.vcbTime) parts.push(`VCB công bố lúc <b>${dateTimeVN(entry.vcbTime)}</b>`);
  return `<p class="sub">${parts.join(" · ")}</p>`;
}

function fxSummaryBody(entry) {
  if (!entry) {
    return '<div class="empty">Chưa có tỷ giá. Bấm "Cập nhật từ VCB" hoặc "Nhập tay".</div>';
  }
  const stale = entry.date < todayISO();
  const staleAlert = stale
    ? `<div class="alert red">Đang dùng tỷ giá ngày ${fxDateVN(entry.date)}, chưa có bản của hôm nay.</div>`
    : "";
  const source = "Nguồn: Vietcombank, tỷ giá bán. Tự cập nhật mỗi ngày 1 lần khi Giám đốc hoặc Kế toán đăng nhập.";
  return `${staleAlert}${fxSummaryLine(entry)}<p class="sub">${source}</p>`;
}

function fxRateRow(code, entry) {
  const usd = fxConvert(1, code, "USD", entry);
  return `<tr>
    <td><b>${esc(code)}</b></td>
    <td>${esc(fxCurrencyNames[code] || code)}</td>
    <td>${fxNumber(fxRate(code, entry))}</td>
    <td>${usd ? fxSmallNumber(usd) : "—"}</td>
  </tr>`;
}

function fxRatesTable(entry) {
  if (!entry) return "";
  const codes = fxSortCodes(Object.keys(entry.rates || {}));
  return card(
    "Bảng tỷ giá hiện hành",
    table(
      ["MÃ", "TIỀN TỆ", "VND / 1 ĐƠN VỊ (GIÁ BÁN)", "1 ĐƠN VỊ = USD"],
      codes.map((code) => fxRateRow(code, entry)),
    ),
  );
}

function fxHistoryRow(entry) {
  const cells = ["USD", "EUR", "CAD"].map((code) => {
    const rate = fxRate(code, entry);
    return `<td>${rate ? fxNumber(rate) : "—"}</td>`;
  });
  return `<tr>
    <td>${fxDateVN(entry.date)}</td>
    <td>${badge(fxModeLabel(entry.mode))}</td>
    <td>${esc(entry.by || "—")}</td>
    ${cells.join("")}
    <td>${entry.vcbTime ? dateTimeVN(entry.vcbTime) : "—"}</td>
  </tr>`;
}

function fxHistoryCard() {
  const rows = fxHistory().slice(0, 60).map((entry) => fxHistoryRow(entry));
  if (!rows.length) return "";
  return card(
    "Lịch sử tỷ giá",
    table(
      ["NGÀY HIỆU LỰC", "NGUỒN", "NGƯỜI CẬP NHẬT", "USD", "EUR", "CAD", "VCB CÔNG BỐ"],
      rows,
    ),
  );
}

function fxRatesPanel() {
  const entry = fxCurrent();
  return (
    card("Tỷ giá Vietcombank — giá bán", fxSummaryBody(entry), fxActions()) +
    fxRatesTable(entry) +
    fxHistoryCard()
  );
}
