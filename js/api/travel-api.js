/* PERSISTENCE — nạp/lưu state qua database multi-tenant KIO. */

const databaseCollectionNames = Object.keys(emptyState());
const databaseRows = {};
const databaseSnapshots = {};
let state = emptyState();
let databaseSaveTimer;
let databaseSyncQueue = Promise.resolve();

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

async function loadDatabaseCollection(collection) {
  const result = await getKrudList({
    table: databaseTable(collection),
    page: 1,
    limit: 1000,
    sort: { id: "ASC" },
    where: [],
  });
  if (!result.success)
    throw new Error(result.error || `Không đọc được ${collection}`);

  const payload = result.data.map((row) => row.payload_text || "").join("");
  state[collection] = payload ? JSON.parse(payload) : [];
  databaseRows[collection] = result.data.map((row) => Number(row.id));
  databaseSnapshots[collection] = JSON.stringify(state[collection]);
}

async function loadDatabase() {
  if (typeof krud !== "function" || typeof getKrudList !== "function")
    throw new Error("Không tải được SDK database KIO.");
  await Promise.all(databaseCollectionNames.map(loadDatabaseCollection));
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
  const nextIds = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const id = oldIds[index] || null;
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
  databaseSnapshots[collection] = payload;
}

async function flushDatabase() {
  const dirty = databaseCollectionNames
    .map((collection) => [collection, JSON.stringify(state[collection] || [])])
    .filter(
      ([collection, payload]) => databaseSnapshots[collection] !== payload,
    );

  for (const [collection, payload] of dirty)
    await syncDatabaseCollection(collection, payload);
}

function save() {
  clearTimeout(databaseSaveTimer);
  databaseSaveTimer = setTimeout(() => {
    databaseSyncQueue = databaseSyncQueue.then(flushDatabase).catch((error) => {
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
