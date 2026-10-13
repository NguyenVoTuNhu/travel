/* PERSISTENCE — local-first repository với record schema tương thích KioStore.
 * Driver hiện tại cố định ở local; không tải KIO scripts, không phát sinh request mạng.
 */

let state = TravelStorage.loadState(seed);

function save() {
  try {
    TravelStorage.saveState(state);
  } catch (error) {
    toast('Trình duyệt không lưu được dữ liệu; thay đổi có thể chỉ còn trong phiên này. ' + (error?.message || ''));
  }
}

function log(text) {
  state.activities.unshift({
    id: 'ACT-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    text,
    time: new Date().toLocaleString('vi-VN')
  });
  state.activities = state.activities.slice(0, 80);
  save();
}
