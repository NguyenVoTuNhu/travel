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
    tourTemplates: [],
  };
}

function initializeDemoCollections() {
  for (const collection of Object.keys(emptyState()))
    if (!Array.isArray(state[collection])) state[collection] = [];
}

function applyDatabaseSettings() {
  const settings = state.settings[0] || {};
  serviceTypes = settings.serviceTypes || [];
  typesVI = settings.serviceLabels || {};
  stages = settings.leadStages || [];
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
