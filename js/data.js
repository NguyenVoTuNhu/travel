/* DATA SCHEMA — cấu trúc state; danh mục và nghiệp vụ nằm trong database. */

let serviceTypes = [];
let typesVI = {};
let stages = [];
let crmOwners = [];
let careOwners = [];
let operationOwners = [];
let crmCountries = [];
let crmLeadSources = [];
let contentChannels = [];
let marketingOwners = [];
let travelCurrencies = [];
let travelLanguages = [];
let travelTranslations = {};
let serviceCostWeights = [];

function emptyState() {
  return {
    guides: [],
    suppliers: [],
    bookings: [],
    leads: [],
    quotes: [],
    payables: [],
    transactions: [],
    drafts: [],
    docs: [],
    activities: [],
    campaigns: [],
    customers: [],
    invoices: [],
    vat: [],
    contents: [],
    vehicles: [],
    issues: [],
    customerServiceCases: [],
    settings: [],
    fxHistory: [],
    tourTemplates: [],
    approvals: [],
    auditLogs: [],
  };
}

/* Collection mới (phê duyệt, nhật ký, lịch sử tỷ giá) có thể chưa có bảng trên KIO: nếu đọc lỗi thì coi như rỗng. */
const optionalCollections = ["approvals", "auditLogs", "fxHistory"];

function initializeDemoCollections() {
  for (const collection of Object.keys(emptyState()))
    if (!Array.isArray(state[collection])) state[collection] = [];
}

const businessIdSchemas = {
  customers: "KH",
  leads: "TN",
  quotes: "BG",
  bookings: "BK",
  suppliers: "NCC",
  guides: "HDV",
  vehicles: "XE",
  payables: "PC",
  transactions: "GD",
  invoices: "HD",
  docs: "TL",
  issues: "SC",
  customerServiceCases: "CS",
  campaigns: "CD",
  contents: "ND",
  vat: "VAT",
  tourTemplates: "CT",
};

/* Mã nghiệp vụ cho collection không đánh lại số (tham chiếu chéo nhiều nơi). */
const stableIdSchemas = { approvals: "PD", auditLogs: "NK" };

function nextStableId(collection, date = new Date()) {
  const prefix = stableIdSchemas[collection];
  const year = String(date.getFullYear());
  const pattern = new RegExp(`^${prefix}-${year}-(\\d{4,6})$`);
  const max = (state[collection] || []).reduce((highest, item) => {
    const match = String(item.id || "").match(pattern);
    return Math.max(highest, match ? Number(match[1]) : 0);
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(4, "0")}`;
}

function businessIdYear(item = {}) {
  const value = item.createdAt || item.date || item.start || item.due || item.dueDate || item.tourEnd || item.id;
  const match = String(value || "").match(/\b(20\d{2})\b/);
  return match ? match[1] : String(new Date().getFullYear());
}

function nextBusinessId(collection, date = new Date()) {
  const prefix = businessIdSchemas[collection];
  if (!prefix) throw new Error(`Chưa khai báo tiền tố mã cho ${collection}`);
  const year = String(date instanceof Date ? date.getFullYear() : date).match(/20\d{2}/)?.[0] || String(new Date().getFullYear());
  const pattern = new RegExp(`^${prefix}-${year}-(\\d{4})$`);
  const max = (state[collection] || []).reduce((highest, item) => {
    const match = String(item.id || "").match(pattern);
    return Math.max(highest, match ? Number(match[1]) : 0);
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(4, "0")}`;
}

function normalizeBusinessIds() {
  const maps = {};
  let changed = false;

  for (const [collection, prefix] of Object.entries(businessIdSchemas)) {
    const counters = {};
    maps[collection] = new Map();
    for (const item of state[collection] || []) {
      const year = businessIdYear(item);
      counters[year] = (counters[year] || 0) + 1;
      const next = `${prefix}-${year}-${String(counters[year]).padStart(4, "0")}`;
      if (item.id && item.id !== next) maps[collection].set(item.id, next);
      if (item.id !== next) changed = true;
      item.id = next;
    }
  }

  const remap = (collection, value) => maps[collection]?.get(value) || value;
  for (const quote of state.quotes) quote.lead = remap("leads", quote.lead);
  for (const lead of state.leads) if (lead.campaign) lead.campaign = remap("campaigns", lead.campaign);
  for (const invoice of state.invoices) invoice.booking = remap("bookings", invoice.booking);
  for (const approval of state.approvals || []) approval.ref = remap(approval.refType === "quote" ? "quotes" : "bookings", approval.ref);
  for (const booking of state.bookings) {
    booking.lead = remap("leads", booking.lead);
    booking.quote = remap("quotes", booking.quote);
    booking.guide = remap("guides", booking.guide);
    booking.vehicle = remap("vehicles", booking.vehicle);
    for (const service of booking.services || []) service.supplier = remap("suppliers", service.supplier);
  }
  for (const payable of state.payables) {
    payable.supplier = remap("suppliers", payable.supplier);
    payable.booking = remap("bookings", payable.booking);
  }
  for (const transaction of state.transactions) {
    transaction.invoice = remap("invoices", transaction.invoice);
    for (const collection of ["bookings", "payables", "quotes"])
      transaction.ref = remap(collection, transaction.ref);
  }
  for (const doc of state.docs) doc.booking = remap("bookings", doc.booking);
  for (const issue of state.issues) issue.booking = remap("bookings", issue.booking);
  for (const item of state.customerServiceCases) item.bookingId = remap("bookings", item.bookingId);
  for (const vehicle of state.vehicles) vehicle.supplier = remap("suppliers", vehicle.supplier);
  for (const draft of state.drafts) draft.lead = remap("leads", draft.lead);

  if (changed) {
    const replacements = Object.values(maps).flatMap((map) => [...map.entries()]);
    for (const activity of state.activities)
      for (const [oldId, newId] of replacements)
        activity.text = String(activity.text || "").replaceAll(oldId, newId);
  }
  return changed;
}

function applyDatabaseSettings() {
  const settings = state.settings[0] || {};
  serviceTypes = settings.serviceTypes || [];
  typesVI = settings.serviceLabels || {};
  stages = typeof leadFlow !== "undefined" ? leadFlow.concat(["LOST", "UNQUALIFIED"]) : settings.leadStages || [];
  crmOwners = settings.crmOwners || [];
  careOwners = settings.careOwners || [];
  operationOwners = settings.operationOwners || [];
  crmCountries = settings.countries || [];
  crmLeadSources = settings.leadSources || [];
  contentChannels = settings.contentChannels || [];
  marketingOwners = settings.marketingOwners || [];
  travelCurrencies = settings.currencies || [];
  travelLanguages = settings.languages || [];
  travelTranslations = settings.translations || {};
  serviceCostWeights = settings.serviceCostWeights || [];
}
