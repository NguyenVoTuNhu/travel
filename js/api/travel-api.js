/* PERSISTENCE — nạp/lưu localStorage và nhật ký. Đây là adapter local, chưa có KIO hoặc backend. */

const key=TRAVEL_CONFIG.storageKey;

let state;

try{state=JSON.parse(localStorage.getItem(key))||seed()}catch{state=seed()}

function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{toast('Trình duyệt không lưu được dữ liệu; thay đổi chỉ còn trong phiên này.')}}

function log(text){state.activities.unshift({text,time:new Date().toLocaleString('vi-VN')});state.activities=state.activities.slice(0,80);save()}
