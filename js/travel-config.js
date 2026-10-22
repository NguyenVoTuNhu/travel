/* Cấu hình persistence KRUD multi-tenant. Database được KIO chọn theo domain gọi. */
const TRAVEL_CONFIG = Object.freeze({
  brand: "TypicOne ERP",
  persistence: "kio",
  apiBaseUrl: "https://kio.dvqt.vn",
  tablePrefix: "typicone_",
  chunkSize: 30000,
});

let kioSdkPromise;

function databaseErrorMessage(error) {
  if (error instanceof TypeError && /fetch|network/i.test(error.message))
    return "Không thể kết nối cơ sở dữ liệu. Vui lòng thử lại sau.";
  return error?.message || "Không thể kết nối cơ sở dữ liệu.";
}

function loadKioScript(file) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${TRAVEL_CONFIG.apiBaseUrl}/${file}`;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Không tải được SDK ${file}.`));
    document.head.appendChild(script);
  });
}

function ensureKioSdk() {
  if (typeof krud === "function" && typeof getKrudList === "function")
    return Promise.resolve();
  if (!kioSdkPromise) {
    kioSdkPromise = Promise.resolve()
      .then(() => (typeof krud === "function" ? null : loadKioScript("krud.js")))
      .then(() => (typeof getKrudList === "function" ? null : loadKioScript("list.js")))
      .catch((error) => {
        kioSdkPromise = null;
        throw error;
      });
  }
  return kioSdkPromise;
}
