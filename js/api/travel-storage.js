/* TRAVEL STORAGE — local-first collection adapter.
 * Interface/schema được thiết kế để thay implementation local bằng KioStore sau này.
 * Mỗi collection là mảng record JSON có id ổn định; có thể truyền trực tiếp vào
 * KioStore.syncCollection(tableName, records). Module này tuyệt đối không gọi KIO.
 */
const TravelStorage = (() => {
  const tableEntries = Object.entries(TRAVEL_CONFIG.tables);

  function storageKey(tableName) {
    return TRAVEL_CONFIG.storagePrefix + tableName;
  }

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? null : JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function recordId(record, collectionKey, index) {
    if (record && record.id != null && String(record.id) !== '') return String(record.id);
    if (record && record.code != null && String(record.code) !== '') return String(record.code);
    if (record && record.key != null && String(record.key) !== '') return String(record.key);
    if (collectionKey === 'campaigns' && record && record.name) return String(record.name);
    return collectionKey.toUpperCase() + '-' + String(index + 1).padStart(5, '0');
  }

  function normalizeCollection(collectionKey, records) {
    return (Array.isArray(records) ? records : []).map((record, index) => {
      const clone = JSON.parse(JSON.stringify(record));
      if (clone && typeof clone === 'object' && !Array.isArray(clone) &&
          (clone.id == null || String(clone.id) === '')) {
        clone.id = recordId(clone, collectionKey, index);
      }
      return clone;
    });
  }

  function loadCollection(tableName) {
    const records = readJson(storageKey(tableName));
    return Array.isArray(records) ? records : null;
  }

  function syncCollection(tableName, records) {
    const key = storageKey(tableName);
    const value = JSON.stringify(Array.isArray(records) ? records : []);
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      throw new Error('Không thể lưu collection ' + tableName + ' vào localStorage: ' + (error?.message || error));
    }
  }

  function loadState(seedFactory) {
    const savedCollections = tableEntries.map(([, tableName]) => loadCollection(tableName));
    if (savedCollections.some(collection => collection !== null)) {
      // Collection đã lưu là nguồn sự thật; seed chỉ bổ sung collection mới ở phiên bản sau.
      const initial = seedFactory();
      tableEntries.forEach(([stateKey, tableName], index) => {
        if (savedCollections[index] !== null) initial[stateKey] = savedCollections[index];
      });
      return initial;
    }

    // Migration một lần từ phiên bản cũ: một object state duy nhất trong localStorage.
    const legacy = readJson(TRAVEL_CONFIG.storageKey);
    if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) return legacy;
    return seedFactory();
  }

  function saveState(state) {
    const pending = tableEntries.map(([stateKey, tableName]) => ({
      tableName,
      key: storageKey(tableName),
      value: JSON.stringify(normalizeCollection(stateKey, state[stateKey]))
    }));
    const previous = pending.map(item => {
      try { return localStorage.getItem(item.key); } catch (_) { return null; }
    });

    try {
      pending.forEach(item => localStorage.setItem(item.key, item.value));
      // Bản legacy không còn cần thiết sau khi đã ghi collection thành công.
      try { localStorage.removeItem(TRAVEL_CONFIG.storageKey); } catch (_) {}
      return true;
    } catch (error) {
      // Rollback các key đã ghi nếu quota/quyền lưu trữ gây lỗi giữa chừng.
      pending.forEach((item, index) => {
        try {
          if (previous[index] == null) localStorage.removeItem(item.key);
          else localStorage.setItem(item.key, previous[index]);
        } catch (_) {}
      });
      throw error;
    }
  }

  return Object.freeze({ loadCollection, syncCollection, loadState, saveState });
})();
