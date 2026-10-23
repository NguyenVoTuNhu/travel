/* PERSISTENCE — nạp/lưu state qua database multi-tenant KIO. */

const databaseCollectionNames = Object.keys(emptyState());
const databaseRows = {};
const databaseChunks = {};
const databaseSnapshots = {};
let state = emptyState();
let databaseSaveTimer;
let databaseSyncQueue = Promise.resolve();
let databaseLoadPromise = Promise.resolve();
let databaseLocalRevision = 0;

function databaseCacheKey() {
  return `typicone_database_cache_${currentUser?.id || "anonymous"}`;
}

function cacheDatabase() {
  try {
    const cachedState = { ...state };
    if (Array.isArray(cachedState.docs))
      cachedState.docs = cachedState.docs.map(({ data, ...document }) => document);
    sessionStorage.setItem(databaseCacheKey(), JSON.stringify(cachedState));
  } catch (error) {
    console.warn("Database cache error:", error);
  }
}

function restoreDatabaseCache() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(databaseCacheKey()) || "null");
    if (!cached || !databaseCollectionNames.every((name) => Array.isArray(cached[name])))
      return false;
    state = cached;
    return true;
  } catch {
    sessionStorage.removeItem(databaseCacheKey());
    return false;
  }
}

function clearDatabaseCache() {
  sessionStorage.removeItem(databaseCacheKey());
}

function databaseTable(collection) {
  return (
    TRAVEL_CONFIG.tablePrefix +
    collection.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  );
}

function splitDatabasePayload(payload) {
  return (
    payload.match(new RegExp(`.{1,${TRAVEL_CONFIG.chunkSize}}`, "gs")) || [""]
  );
}

const databaseMissingTables = new Set();

async function loadDatabaseCollection(collection) {
  const result = await getKrudList({
    table: databaseTable(collection),
    page: 1,
    limit: 1000,
    sort: { id: "ASC" },
    where: [],
  });
  if (!result.success && optionalCollections.includes(collection)) {
    databaseMissingTables.add(collection);
    console.warn(`Bảng ${databaseTable(collection)} chưa tồn tại trên KIO — dùng bộ nhớ phiên cho tới khi tạo bảng.`);
    return { collection, data: [], rows: [], chunks: [] };
  }
  if (!result.success)
    throw new Error(result.error || `Không đọc được ${collection}`);

  const payload = result.data.map((row) => row.payload_text || "").join("");
  return {
    collection,
    data: payload ? JSON.parse(payload) : [],
    rows: result.data.map((row) => Number(row.id)),
    chunks: result.data.map((row) => row.payload_text || ""),
  };
}

async function performDatabaseLoad() {
  await ensureKioSdk();
  if (typeof krud !== "function" || typeof getKrudList !== "function")
    throw new Error("Không tải được SDK database KIO.");
  const revision = databaseLocalRevision;
  const collections = await Promise.all(databaseCollectionNames.map(loadDatabaseCollection));
  for (const result of collections) {
    databaseRows[result.collection] = result.rows;
    databaseChunks[result.collection] = result.chunks;
    databaseSnapshots[result.collection] = JSON.stringify(result.data);
    if (databaseLocalRevision === revision) state[result.collection] = result.data;
  }
  if (databaseLocalRevision === revision) cacheDatabase();
  else save();
  return databaseLocalRevision === revision;
}

function loadDatabase() {
  clearTimeout(databaseSaveTimer);
  const pendingWrites = databaseSyncQueue.catch(() => {});
  databaseLoadPromise = databaseLoadPromise
    .catch(() => {})
    .then(() => pendingWrites)
    .then(performDatabaseLoad);
  return databaseLoadPromise;
}

function databaseFields(collection, chunk, index) {
  return {
    state_key: { value: collection, type: "string" },
    chunk_index: { value: index, type: "int" },
    payload_text: { value: chunk, type: "text" },
    updated_at: { value: new Date().toISOString(), type: "string" },
  };
}

async function syncDatabaseCollection(collection, payload) {
  const table = databaseTable(collection);
  const chunks = splitDatabasePayload(payload);
  const oldIds = databaseRows[collection] || [];
  const oldChunks = databaseChunks[collection] || [];
  const nextIds = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const id = oldIds[index] || null;
    /* Chunk không đổi so với nội dung đang lưu trên KIO thì bỏ qua, chỉ ghi chunk có thay đổi. */
    if (id && oldChunks[index] === chunks[index]) {
      nextIds.push(id);
      continue;
    }
    const result = await krud(
      id ? "update" : "insert",
      table,
      databaseFields(collection, chunks[index], index),
      id,
    );
    if (!result.success)
      throw new Error(result.error || `Không lưu được ${collection}`);
    nextIds.push(id || Number(result.data.id));
  }

  for (const id of oldIds.slice(chunks.length)) {
    const result = await krud("delete", table, {}, id);
    if (!result.success)
      throw new Error(result.error || `Không xóa được chunk ${id}`);
  }

  databaseRows[collection] = nextIds;
  databaseChunks[collection] = chunks;
  databaseSnapshots[collection] = payload;
}

async function performDatabaseFlush() {
  const dirty = databaseCollectionNames
    .map((collection) => [collection, JSON.stringify(state[collection] || [])])
    .filter(
      ([collection, payload]) => databaseSnapshots[collection] !== payload,
    );

  /* shortcut: KIO chưa có compare-and-swap; kiểm tra này chặn phần lớn ghi đè tuần tự,
     cần API revision nguyên tử khi hệ thống có nhiều phiên lưu đúng cùng một mili-giây. */
  const conflicts = await Promise.all(dirty.map(async ([collection, payload], index) => {
    if (databaseMissingTables.has(collection)) return null;
    const result = await getKrudList({ table: databaseTable(collection), page: 1, limit: 1000, sort: { id: "ASC" }, where: [] });
    if (!result.success) throw new Error(result.error || `Không kiểm tra được phiên bản ${collection}`);
    const serverPayload = result.data.map((row) => row.payload_text || "").join("") || "[]";
    /* Nhật ký là dữ liệu append-only: gộp các sự kiện theo id thay vì chặn cả
       giao dịch khi một phiên khác vừa ghi thêm log. Dữ liệu nghiệp vụ vẫn dùng
       kiểm tra xung đột nghiêm ngặt bên dưới. */
    if (collection === "auditLogs" && serverPayload !== (databaseSnapshots[collection] ?? "[]")) {
      const localLogs = JSON.parse(payload || "[]");
      const remoteLogs = JSON.parse(serverPayload || "[]");
      const merged = [...new Map([...localLogs, ...remoteLogs].map((entry) => [entry.id, entry])).values()]
        .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
        .slice(0, 600);
      state.auditLogs = merged;
      databaseChunks[collection] = [];
      dirty[index][1] = JSON.stringify(merged);
      return null;
    }
    return serverPayload !== (databaseSnapshots[collection] ?? "[]") ? collection : null;
  }));
  const conflict = conflicts.find(Boolean);
  if (conflict) {
    const error = new Error(`Dữ liệu ${conflict} vừa được người khác cập nhật. Hãy tải lại trang trước khi lưu tiếp.`);
    error.code = "DATA_CONFLICT";
    throw error;
  }

  for (const [collection, payload] of dirty) {
    try {
      await syncDatabaseCollection(collection, payload);
      databaseMissingTables.delete(collection);
    } catch (error) {
      if (!optionalCollections.includes(collection)) throw error;
      databaseSnapshots[collection] = payload;
      if (!databaseMissingTables.has(collection) || !flushDatabase.warned) {
        flushDatabase.warned = true;
        if (typeof toast === "function")
          toast(`Chưa lưu được ${databaseTable(collection)}: hãy tạo bảng này trên KIO (xem claude.md mục 3.4).`);
      }
      databaseMissingTables.add(collection);
    }
  }
}

function flushDatabase() {
  clearTimeout(databaseSaveTimer);
  const pendingLoad = databaseLoadPromise.catch(() => {});
  databaseSyncQueue = databaseSyncQueue
    .catch(() => {})
    .then(() => pendingLoad)
    .then(performDatabaseFlush);
  return databaseSyncQueue;
}

function save() {
  databaseLocalRevision += 1;
  cacheDatabase();
  clearTimeout(databaseSaveTimer);
  databaseSaveTimer = setTimeout(() => {
    flushDatabase().catch((error) => {
      console.error("Database sync error:", error);
      if (typeof toast === "function")
        toast("Không thể đồng bộ database: " + error.message);
    });
  }, 200);
}

function log(text) {
  state.activities.unshift({ text, time: new Date().toLocaleString("vi-VN") });
  state.activities = state.activities.slice(0, 80);
  save();
}

/* ---------- Tệp tải lên: lưu vào thư mục uploads/ trên máy chủ, database chỉ lưu đường dẫn ---------- */
function uploadErrorMessage(response, result) {
  if (result?.error) return result.error;
  if (response.status === 404 || response.status === 405)
    return "Máy chủ chưa hỗ trợ tải tệp (thiếu upload.php).";
  return "Không tải được tệp lên máy chủ (mã " + response.status + ").";
}

async function uploadFile(file, category = "docs") {
  if (!file || !file.size) throw new Error("Chưa chọn tệp.");
  if (file.size > TRAVEL_CONFIG.uploadMaxBytes) {
    const limit = Math.round(TRAVEL_CONFIG.uploadMaxBytes / 1024 / 1024);
    throw new Error("Tệp phải không quá " + limit + " MB.");
  }
  const body = new FormData();
  body.append("file", file);
  body.append("category", category);
  let response;
  try {
    response = await fetch(TRAVEL_CONFIG.uploadEndpoint, { method: "POST", body });
  } catch (error) {
    throw new Error("Không kết nối được máy chủ để tải tệp.");
  }
  let result = null;
  try {
    result = await response.json();
  } catch (error) {
    result = null;
  }
  if (!response.ok || !result?.ok) throw new Error(uploadErrorMessage(response, result));
  return { path: result.path, name: file.name, size: file.size, mime: result.mime || file.type };
}
