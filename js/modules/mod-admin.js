/* MODULE mod-admin — người dùng & phân quyền, cài đặt chính sách, nhật ký hệ thống. */

let settingsTab = "policy";
let usersBusy = false;

/* ---------- Người dùng ---------- */
async function persistAuthUsers(users) {
  const payload = JSON.stringify(users);
  const chunks = splitDatabasePayload(payload);
  const result = await getKrudList({ table: AUTH_TABLE, page: 1, limit: 1000, sort: { id: "ASC" }, where: [] });
  if (!result.success) throw new Error(result.error || "Không đọc được bảng người dùng.");
  const ids = result.data.map((r) => Number(r.id));
  for (let i = 0; i < chunks.length; i += 1) {
    const res = await krud(ids[i] ? "update" : "insert", AUTH_TABLE, databaseFields("users", chunks[i], i), ids[i] || null);
    if (!res.success) throw new Error(res.error || "Không lưu được người dùng.");
  }
  for (const id of ids.slice(chunks.length)) await krud("delete", AUTH_TABLE, {}, id);
}

async function mutateUsers(fn, successMessage) {
  if (!requireCapability("all", "Chỉ Giám đốc được quản lý người dùng.")) return;
  if (usersBusy) return;
  usersBusy = true;
  try {
    await loadAuthUsers();
    const users = authUsers.map((u) => ({ ...u }));
    const proceed = await fn(users);
    if (proceed === false) return;
    await persistAuthUsers(users);
    await loadAuthUsers();
    render();
    toast(successMessage);
  } catch (error) {
    toast("Không lưu được: " + error.message);
  } finally {
    usersBusy = false;
  }
}

function randomSalt() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
}

async function passwordRecord(password, iterations = 100000) {
  const salt = randomSalt();
  return { salt, iterations, passwordHash: await hashPassword(password, salt, iterations) };
}

function toggleUser(id) {
  if (id === currentUser?.id) return toast("Không thể khóa chính tài khoản đang đăng nhập.");
  mutateUsers((users) => {
    const u = users.find((x) => x.id === id);
    u.active = !u.active;
    audit("user", id, u.active ? "ACTIVATE" : "DEACTIVATE", `${u.active ? "Mở khóa" : "Khóa"} tài khoản ${u.username}`);
  }, "Đã cập nhật tài khoản.");
}

function changeUserRole(id, newRole) {
  if (id === currentUser?.id) {
    render();
    return toast("Không thể tự đổi vai trò của chính mình.");
  }
  mutateUsers((users) => {
    const u = users.find((x) => x.id === id);
    u.role = newRole;
    audit("user", id, "ROLE", `Đổi vai trò ${u.username} → ${rolelabels[newRole] || newRole}`);
  }, "Đã đổi vai trò.");
}

function resetUserPassword(id) {
  mutateUsers(async (users) => {
    const u = users.find((x) => x.id === id);
    Object.assign(u, await passwordRecord("123456", u.iterations || 100000), { mustChangePassword: true });
    audit("user", id, "RESET", `Đặt lại mật khẩu ${u.username} về mặc định`);
  }, "Đã đặt lại mật khẩu về 123456. Người dùng sẽ bị yêu cầu đổi mật khẩu ở lần đăng nhập kế tiếp.");
}

function userForm() {
  modal(
    "Thêm người dùng",
    `<form onsubmit="addUser(event)"><div class="formgrid"><label>Tên đăng nhập${field("username", "text", "", true)}</label><label>Họ tên${field("fullName", "text", "", true)}</label><label>Vai trò<select name="role">${Object.entries(rolelabels).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("")}</select></label><label>Mã HDV (nếu là HDV)<select name="guideId"><option value="">—</option>${state.guides.map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select></label></div><div class="notice">Mật khẩu ban đầu: <b>123456</b>.</div><div class="formfooter"><button class="btn primary">Tạo tài khoản</button></div></form>`,
    true,
  );
}

function addUser(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const username = f.get("username").trim().toLowerCase();
  mutateUsers(async (users) => {
    if (users.some((u) => u.username.toLowerCase() === username)) {
      toast("Tên đăng nhập đã tồn tại.");
      return false;
    }
    const id = "u" + (Math.max(0, ...users.map((u) => parseInt(String(u.id).replace(/\D/g, ""), 10) || 0)) + 1);
    users.push({ id, username, fullName: f.get("fullName").trim(), role: f.get("role"), active: true, guideId: f.get("guideId") || "", mustChangePassword: true, ...(await passwordRecord("123456")) });
    audit("user", id, "CREATE", `Tạo tài khoản ${username}`);
    closeModal();
  }, "Đã tạo tài khoản.");
}

views.users = () => {
  if (!can("all")) return title("Người dùng & phân quyền", "Chỉ Giám đốc được quản lý tài khoản.");
  const users = authUsers;
  const byRole = {};
  users.forEach((u) => (byRole[u.role] = (byRole[u.role] || 0) + 1));
  return (
    title("Người dùng & phân quyền", "Quản lý tài khoản, vai trò và trạng thái truy cập.", btn("+ Thêm người dùng", "userForm()", "primary")) +
    `<div class="stats stats--compact">${Object.entries(rolelabels).map(([k, l]) => stat(esc(l).toUpperCase(), byRole[k] || 0, "Tài khoản")).join("")}</div>` +
    card(
      "Danh sách tài khoản",
      table(
        ["TÀI KHOẢN", "HỌ TÊN", "VAI TRÒ", "TRẠNG THÁI", ""],
        users.map((u) => `<tr><td><b>${esc(u.username)}</b>${u.guideId ? `<span class="sub">${u.guideId}</span>` : ""}</td><td>${esc(u.fullName)}</td><td><select aria-label="Vai trò" onchange="changeUserRole('${u.id}',this.value)" ${u.id === currentUser?.id ? "disabled" : ""}>${Object.entries(rolelabels).map(([k, l]) => `<option value="${k}" ${k === u.role ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></td><td>${badge(u.active ? "Đang hoạt động" : "Đã khóa", u.active ? "green" : "red")}</td><td><div class="actions">${btn(u.active ? "Khóa" : "Mở khóa", `toggleUser('${u.id}')`, "small")}${btn("Đặt lại mật khẩu", `resetUserPassword('${u.id}')`, "small")}</div></td></tr>`),
      ),
    )
  );
};

/* ---------- Cài đặt ---------- */
function savePolicy(e) {
  e.preventDefault();
  if (!requireCapability("all", "Chỉ Giám đốc được thay đổi chính sách.")) return;
  const f = new FormData(e.target);
  const next = {
    minMarginPct: +f.get("minMarginPct"),
    maxDiscountPct: +f.get("maxDiscountPct"),
    requireDeposit: f.get("requireDeposit") === "on",
    depositPct: +f.get("depositPct"),
    costOverrunPct: +f.get("costOverrunPct"),
    settlementGraceDays: +f.get("settlementGraceDays"),
    quoteValidDays: +f.get("quoteValidDays"),
    monthlyTarget: +f.get("monthlyTarget"),
    refund30: +f.get("refund30"),
    refund15: +f.get("refund15"),
    refund7: +f.get("refund7"),
  };
  const limits = { settlementGraceDays: 365, quoteValidDays: 90, monthlyTarget: 1e13 };
  if (Object.entries(next).some(([k, v]) => k !== "requireDeposit" && (!Number.isFinite(v) || v < 0 || v > (limits[k] || 100)))) return toast("Giá trị chính sách không hợp lệ.");
  if (!state.settings.length) state.settings.push({ id: "CFG-1" });
  state.settings[0].policy = { ...(state.settings[0].policy || {}), ...next };
  audit("settings", "policy", "UPDATE", "Cập nhật chính sách nghiệp vụ");
  render();
  toast("Đã lưu chính sách.");
}

function settingsPolicyTab() {
  const p = policy();
  const num = (name, label, hint, max = 100) => `<label>${label}<input name="${name}" type="number" min="0" max="${max}" step="0.5" value="${p[name]}" required><small class="sub">${hint}</small></label>`;
  return card(
    "Chính sách nghiệp vụ",
    `<form onsubmit="savePolicy(event)"><div class="formgrid">${num("minMarginPct", "Biên lợi nhuận tối thiểu (%)", "Báo giá thấp hơn cần CEO duyệt")}${num("maxDiscountPct", "Chiết khấu tối đa không cần duyệt (%)", "Sales được giảm tới mức này")}${num("depositPct", "Tỷ lệ đặt cọc (%)", "Tính trên giá trị hợp đồng")}${num("costOverrunPct", "Ngưỡng vượt chi phí (%)", "Vượt dự toán quá mức này cần CEO duyệt")}${num("settlementGraceDays", "Hạn quyết toán sau tour (ngày)", "Nhắc kế toán quyết toán", 365)}${num("quoteValidDays", "Hiệu lực báo giá (ngày)", "Tính từ ngày gửi khách", 90)}${num("monthlyTarget", "Mục tiêu doanh thu tháng (VND)", "Hiển thị ở Tổng quan; 0 = không đặt", 1e13)}${num("refund30", "Hoàn tiền khi hủy trước 30 ngày (%)", "Tính trên số đã thu", 100)}${num("refund15", "Hoàn tiền khi hủy 15–29 ngày (%)", "Tính trên số đã thu", 100)}${num("refund7", "Hoàn tiền khi hủy 7–14 ngày (%)", "Dưới 7 ngày: không hoàn", 100)}<label class="checkitem"><span><input name="requireDeposit" type="checkbox" ${p.requireDeposit ? "checked" : ""}> Bắt buộc đặt cọc trước khi bàn giao Điều hành</span></label></div><div class="formfooter"><button class="btn primary">Lưu chính sách</button></div></form>`,
  );
}

let auditUser = "all", auditEntity = "all";
function settingsAuditTab() {
  const all = state.auditLogs || [];
  const users = [...new Set(all.map((a) => a.user).filter(Boolean))].sort(), entities = [...new Set(all.map((a) => a.entity).filter(Boolean))].sort();
  const logs = all.filter((a) => (auditUser === "all" || a.user === auditUser) && (auditEntity === "all" || a.entity === auditEntity)).slice(0, 200);
  const filter = `<div class="filters"><select aria-label="Lọc theo người dùng" onchange="auditUser=this.value;render()"><option value="all">Tất cả người dùng</option>${users.map((u) => `<option ${auditUser === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select><select aria-label="Lọc theo đối tượng" onchange="auditEntity=this.value;render()"><option value="all">Tất cả đối tượng</option>${entities.map((u) => `<option ${auditEntity === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select><span class="sub" style="margin-left:auto">${logs.length} / ${all.length} dòng</span></div>`;
  return card(
    "Nhật ký hoạt động",
    filter +
    logs.length
      ? table(["THỜI GIAN", "NGƯỜI DÙNG", "ĐỐI TƯỢNG", "HÀNH ĐỘNG", "NỘI DUNG"], logs.map((a) => `<tr><td>${dateTimeVN(a.at)}</td><td>${esc(a.user)}<span class="sub">${esc(a.role || "")}</span></td><td>${esc(a.entity)} ${esc(a.entityId || "")}</td><td>${badge(a.action)}</td><td style="white-space:normal">${esc(a.summary)}</td></tr>`))
      : '<div class="empty">Chưa có nhật ký.</div>',
  );
}

function settingsRolesTab() {
  const labelOf = Object.fromEntries(pages.map((p) => [p[0], p[2]]));
  return card(
    "Ma trận vai trò & menu",
    table(
      ["VAI TRÒ", "MENU ĐƯỢC TRUY CẬP", "QUYỀN CHÍNH"],
      Object.keys(rolelabels).map((r) => `<tr><td><b>${esc(rolelabels[r])}</b></td><td style="white-space:normal">${(rights[r] || []).map((m) => badge(labelOf[m] || m)).join(" ")}</td><td style="white-space:normal"><span class="sub">${(roleCapabilities[r] || []).map(esc).join(", ")}</span></td></tr>`),
    ) + '<p class="sub">Quyền được định nghĩa theo vai trò trong hệ thống; tài khoản đổi vai trò tại mục Người dùng.</p>',
  );
}

function settingsBackupTab() {
  return card("Sao lưu dữ liệu", `<p class="sub">Xuất toàn bộ dữ liệu đang nạp từ database ra file JSON.</p>${btn("Tải bản sao lưu", "downloadBackup()", "primary")}`);
}

views.settings = () => {
  if (!can("all")) return title("Cài đặt", "Chỉ Giám đốc được thay đổi cài đặt hệ thống.");
  const tabs = [["policy", "Chính sách"], ["audit", "Nhật ký"], ["roles", "Vai trò & menu"], ["backup", "Sao lưu"]];
  return (
    title("Cài đặt hệ thống", "Ngưỡng phê duyệt, nhật ký và phân quyền.") +
    `<nav class="tabs">${tabs.map(([k, l]) => `<button class="btn ${settingsTab === k ? "selected" : ""}" onclick="settingsTab='${k}';render()">${l}</button>`).join("")}</nav>` +
    (settingsTab === "audit" ? settingsAuditTab() : settingsTab === "roles" ? settingsRolesTab() : settingsTab === "backup" ? settingsBackupTab() : settingsPolicyTab())
  );
};


/* ---------- Đổi mật khẩu cá nhân (bắt buộc ở lần đăng nhập đầu hoặc sau khi bị đặt lại) ---------- */
function passwordForm(forced = false) {
  closeAccountMenu();
  modal("Đổi mật khẩu", `<form onsubmit="saveMyPassword(event)">${forced ? '<div class="alert red"><b>Bạn cần đổi mật khẩu mặc định</b> trước khi tiếp tục sử dụng hệ thống.</div>' : ""}<label>Mật khẩu hiện tại<input name="old" type="password" autocomplete="current-password" required></label><label>Mật khẩu mới (tối thiểu 8 ký tự, gồm chữ và số)<input name="next" type="password" autocomplete="new-password" required minlength="8"></label><label>Nhập lại mật khẩu mới<input name="again" type="password" autocomplete="new-password" required></label><div class="formfooter"><button class="btn primary">Đổi mật khẩu</button></div></form>`, true);
  if (forced) {
    const back = document.querySelector(".modalback");
    if (back) back.onclick = null;
    document.querySelector(".modal .close")?.remove();
  }
}

async function saveMyPassword(e) {
  e.preventDefault();
  const f = new FormData(e.target), oldPw = f.get("old"), next = f.get("next");
  if (next !== f.get("again")) return toast("Mật khẩu nhập lại không khớp.");
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) return toast("Mật khẩu mới cần ít nhất 8 ký tự, gồm cả chữ và số.");
  if (next === "123456" || next === oldPw) return toast("Mật khẩu mới phải khác mật khẩu cũ và không phải mật khẩu mặc định.");
  try {
    await loadAuthUsers();
    const users = authUsers.map((u) => ({ ...u })), me = users.find((u) => u.id === currentUser.id);
    if (!me) return toast("Không tìm thấy tài khoản.");
    if (!hashesMatch(await hashPassword(oldPw, me.salt, me.iterations), me.passwordHash)) return toast("Mật khẩu hiện tại không đúng.");
    Object.assign(me, await passwordRecord(next, me.iterations || 100000), { mustChangePassword: false });
    await persistAuthUsers(users);
    currentUser.mustChangePassword = false;
    audit("user", me.id, "PASSWORD", `${me.username} đổi mật khẩu`);
    closeModal();
    toast("Đã đổi mật khẩu.");
  } catch (error) {
    toast("Không đổi được mật khẩu: " + error.message);
  }
}

/* Chưa đổi mật khẩu mặc định thì không đóng được hộp thoại. */
function enforcePasswordChange() {
  if (currentUser?.mustChangePassword && !document.querySelector(".modalback")) passwordForm(true);
}
