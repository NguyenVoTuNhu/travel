/* Cấu hình persistence cho Typic Travel.
 * Dữ liệu hiện được lưu local theo collection; tên bảng và record shape tương thích
 * với KioStore.syncCollection(table, items) trong ERP_LENAM. Không gọi KIO khi driver=local.
 */
const TRAVEL_CONFIG = Object.freeze({
  brand: 'Typic Travel',
  driver: 'local', // Hiện tại chỉ local; chưa gửi/ghi bất kỳ dữ liệu nào lên KIO.
  storageKey: 'typic-travel-demo-v2', // legacy monolithic key, dùng để migrate dữ liệu cũ.
  storagePrefix: 'typic-travel:kio-local:v1:',
  schemaVersion: 1,
  apiBaseUrl: null,
  tables: Object.freeze({
    guides: 'travel_guides',
    suppliers: 'travel_suppliers',
    bookings: 'travel_bookings',
    leads: 'travel_leads',
    quotes: 'travel_quotes',
    payables: 'travel_payables',
    transactions: 'travel_transactions',
    drafts: 'travel_tour_drafts',
    docs: 'travel_documents',
    activities: 'travel_activity_logs',
    campaigns: 'travel_campaigns',
    customers: 'travel_customers',
    invoices: 'travel_invoices',
    vat: 'travel_vat_records',
    contents: 'travel_marketing_contents',
    vehicles: 'travel_vehicles',
    issues: 'travel_tour_issues',
    auditLogs: 'travel_audit_logs',
    settings: 'travel_settings'
  })
});
