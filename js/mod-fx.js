/* TỶ GIÁ VCB — bảng tỷ giá bán của Vietcombank, ngày hiệu lực và lịch sử (T1-01).
   Lịch sử nằm ở collection RIÊNG state.fxHistory (bảng KIO typicone_fx_history), không để trong settings.
   Mỗi phần tử: { date, mode, by, at, vcbTime, rates: { USD: 26050, VND: 1, ... } }, mỗi ngày một bản.
   Số trong rates là số VND cho 1 đơn vị ngoại tệ (giá bán). Xếp CŨ → MỚI và KHÔNG giới hạn số bản:
   thêm bản mới ở cuối nên mỗi lần lưu chỉ ghi lại chunk cuối. settings[0].fxRates chỉ còn { source, rateType }. */

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
/* Lịch sử cũ nằm trong settings[0].fxRates.history (mới → cũ), chỉ còn trước khi chuyển sang fxHistory. */
function fxLegacyHistory() {
  const history = state.settings?.[0]?.fxRates?.history;
  return Array.isArray(history) ? history : [];
}

/* Lịch sử tỷ giá, xếp cũ → mới. Chưa chuyển khỏi settings thì đọc tạm bản cũ ở đó (mọi vai trò vẫn thấy tỷ giá). */
function fxHistory() {
  if (state.fxHistory?.length) return state.fxHistory;
  return fxLegacyHistory().slice().reverse();
}

/* Bản tỷ giá mới nhất (ngày lớn nhất). */
function fxLatest() {
  const history = fxHistory();
  return history[history.length - 1] || null;
}

/* Bản tỷ giá có hiệu lực vào một ngày (YYYY-MM-DD): bản mới nhất có date <= ngày đó. */
function fxEntryOn(dateISO) {
  const history = fxHistory();
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].date <= dateISO) return history[index];
  }
  return null;
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

/* Tối đa 2 số lẻ (không thừa số 0) để sổ kế toán không làm tròn mất xu: 555,56 USD, 1.000 USD. */
function fxFormat(value, code) {
  const text = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
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
  return fxHistory()[0] || null;
}

/* Bản tỷ giá của ngày tạo chứng từ; ngày sớm hơn mọi bản đã lưu thì dùng bản cũ nhất. */
function fxEntryOf(doc) {
  const date = fxDocDate(doc);
  if (!date) return fxCurrent();
  return fxEntryOn(date) || fxOldestEntry();
}

/* ---------- Sổ kế toán ghi bằng USD (T1-04) ---------- */
/* Số tiền vẫn lưu bằng VND. Mọi số tiền của MỘT booking (giá trị hợp đồng, hóa đơn, thu, công nợ)
   quy đổi USD theo tỷ giá của ngày chốt báo giá (booking.fxDate), nên một khoản thu USD luôn khớp
   đúng hóa đơn USD, không phát sinh chênh lệch tỷ giá. */
function fxLedgerReady() {
  return !!fxRate(fxDisplayCurrency);
}

function fxLedgerMoney(booking, vnd) {
  return fxMoney(vnd, fxDisplayCurrency, fxEntryOf(booking));
}

/* Số tiền một giao dịch thu: USD theo sổ của booking, kèm số khách thực trả nếu không phải USD. */
function fxTxMoney(booking, tx) {
  const base = fxLedgerMoney(booking, tx.amount);
  const code = tx.currency;
  if (!code || code === fxDisplayCurrency || tx.original == null) return base;
  if (code === "VND" && Number(tx.original) === Number(tx.amount)) return base;
  const original = code === "VND" ? money(tx.original) : fxFormat(tx.original, code);
  return `${base} <span class="sub">(khách trả ${original})</span>`;
}

/* ---------- Sổ kế toán: các màn còn lại (T1-04b) ---------- */
/* Quy tắc chung: số tiền vẫn lưu VND; mọi khoản gắn với một booking quy đổi USD theo tỷ giá
   ngày chốt báo giá của booking đó (fxEntryOf(booking)). Chưa có tỷ giá thì quay về VND.
   Riêng VAT giữ VND (khai thuế theo quy định Việt Nam). */

/* Tiền của sổ: USD khi đã có tỷ giá, không thì VND. */
function fxLedgerCode() {
  return fxLedgerReady() ? fxDisplayCurrency : "VND";
}

/* VND cho 1 USD theo sổ của booking; booking không có tỷ giá riêng thì dùng tỷ giá hiện hành. */
function fxLedgerRate(booking) {
  return fxRate(fxDisplayCurrency, fxEntryOf(booking)) || fxRate(fxDisplayCurrency);
}

/* Số VND của một booking → số trong tiền của sổ (USD, không làm tròn; VND khi chưa có tỷ giá). */
function fxLedgerNumber(booking, vnd) {
  const amount = Number(vnd) || 0;
  if (!fxLedgerReady()) return amount;
  return amount / fxLedgerRate(booking);
}

/* Cộng nhiều khoản: mỗi khoản quy đổi theo tỷ giá của booking của nó rồi mới cộng. */
function fxLedgerTotal(items, bookingOf, amountOf) {
  let total = 0;
  for (const item of items) {
    total += fxLedgerNumber(bookingOf(item), amountOf(item));
  }
  return total;
}

/* Hiển thị một số đã ở tiền của sổ: "1.234,5 USD" hoặc "1.234.000 ₫". */
function fxLedgerText(value) {
  if (!fxLedgerReady()) return money(value);
  return fxFormat(value, fxDisplayCurrency);
}

/* Bản rút gọn cho thẻ KPI: 1,25M USD, 12,5K USD; chưa có tỷ giá thì rút gọn VND như cũ. */
function fxLedgerShort(value) {
  if (!fxLedgerReady()) return short(value);
  const sign = value < 0 ? "-" : "";
  const size = Math.abs(value);
  if (size >= 1e6) return `${sign}${(size / 1e6).toFixed(2)}M ${fxDisplayCurrency}`;
  if (size >= 1e3) return `${sign}${(size / 1e3).toFixed(1)}K ${fxDisplayCurrency}`;
  return fxFormat(value, fxDisplayCurrency);
}

/* Tổng nhiều khoản (mỗi khoản theo booking của nó), hiển thị đầy đủ. */
function fxLedgerSum(items, bookingOf, amountOf) {
  return fxLedgerText(fxLedgerTotal(items, bookingOf, amountOf));
}

/* Số VND → số hiện trong ô nhập (tiền của sổ, 2 số lẻ) theo tỷ giá của booking. */
function fxLedgerInput(booking, vnd) {
  if (!fxLedgerReady()) return Number(vnd) || 0;
  return fxFromVnd(vnd, fxDisplayCurrency, fxEntryOf(booking));
}

/* Số nhập trong ô (tiền của sổ) → VND để lưu theo tỷ giá của booking. Nếu số nhập đúng bằng số
   đang hiện của `currentVnd` thì giữ nguyên VND cũ, để làm tròn 2 số lẻ không làm trôi số liệu. */
function fxLedgerInputVnd(booking, input, currentVnd = null) {
  const value = Number(input) || 0;
  if (!fxLedgerReady()) return Math.round(value);
  const entry = fxEntryOf(booking);
  if (currentVnd !== null) {
    const shown = fxFromVnd(currentVnd, fxDisplayCurrency, entry);
    if (Math.round(value * 100) === Math.round(shown * 100)) return currentVnd;
  }
  return fxToVnd(value, fxDisplayCurrency, entry);
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
/* settings[0].fxRates chỉ giữ thông tin nguồn; lịch sử nằm ở state.fxHistory. */
function fxStore() {
  if (!state.settings.length) state.settings.push({ id: "CFG-1" });
  const settings = state.settings[0];
  if (!settings.fxRates) settings.fxRates = { source: "VCB", rateType: "sell" };
  return settings.fxRates;
}

/* Chép lịch sử cũ trong settings sang state.fxHistory (cũ → mới), gộp theo ngày, bản ở fxHistory thắng. */
function fxCopyLegacy() {
  const legacy = fxLegacyHistory();
  if (!legacy.length) return false;
  const byDate = new Map();
  for (const entry of legacy) byDate.set(entry.date, entry);
  for (const entry of state.fxHistory) byDate.set(entry.date, entry);
  state.fxHistory = [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return true;
}

/* Chuyển một lần: chép sang fxHistory, ghi lên KIO, chỉ xóa bản trong settings khi ghi thành công.
   Bảng typicone_fx_history chưa có thì giữ nguyên lịch sử ở settings để không mất dữ liệu. */
async function fxMigrateLegacy() {
  if (!can("fx_manage")) return;
  if (!fxLegacyHistory().length) return;
  if (databaseMissingTables.has("fxHistory")) {
    console.warn("Chưa chuyển lịch sử tỷ giá: hãy tạo bảng typicone_fx_history trên KIO (claude.md mục 3.4b).");
    return;
  }
  fxCopyLegacy();
  save();
  try {
    await flushDatabase();
  } catch (error) {
    console.warn("Chưa chuyển được lịch sử tỷ giá sang bảng riêng:", error);
    return;
  }
  if (databaseMissingTables.has("fxHistory")) return;
  delete fxStore().history;
  save();
}

/* Mỗi ngày hiệu lực chỉ có một bản: ghi lại cùng ngày thì thay bản cũ. Không giới hạn số bản. */
function fxSaveEntry(entry) {
  fxStore();
  fxCopyLegacy();
  const history = state.fxHistory.filter((item) => item.date !== entry.date);
  history.push(entry);
  history.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  state.fxHistory = history;
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
  await fxMigrateLegacy();
  if (!TRAVEL_CONFIG.fxEndpoint) return;
  if (fxLatest()?.date === todayISO()) return;
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
  const today = fxLatest();
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
  const history = fxHistory();
  const rows = history.slice(-60).reverse().map((entry) => fxHistoryRow(entry));
  if (!rows.length) return "";
  const note = history.length > rows.length
    ? `<p class="sub">Hiển thị ${rows.length} bản gần nhất trong tổng số ${history.length} bản.</p>`
    : "";
  return card(
    "Lịch sử tỷ giá",
    note + table(
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
