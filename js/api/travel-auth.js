/* AUTH — xác thực người dùng từ bảng typicone_users. */

const AUTH_TABLE = `${TRAVEL_CONFIG.tablePrefix}users`;
const AUTH_ROLES_TABLE = `${TRAVEL_CONFIG.tablePrefix}roles`;
const AUTH_SESSION_KEY = "typicone_auth_session";
let authUsers = [];
let authRoles = [];
let currentUser = null;

function hexToBytes(hex) {
  return new Uint8Array(hex.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
}

function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function hashPassword(password, salt, iterations) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBytes(salt),
      iterations,
    },
    key,
    256,
  );
  return bytesToHex(bits);
}

function hashesMatch(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1)
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function readAuthCollection(table) {
  if (typeof getKrudList !== "function")
    throw new Error("Không tải được SDK database KIO.");
  const result = await getKrudList({
    table,
    page: 1,
    limit: 1000,
    sort: { id: "ASC" },
    where: [],
  });
  if (!result.success)
    throw new Error(result.error || `Không đọc được ${table}.`);
  const payload = result.data.map((row) => row.payload_text || "").join("");
  return payload ? JSON.parse(payload) : [];
}

async function loadAuthUsers() {
  [authRoles, authUsers] = await Promise.all([
    readAuthCollection(AUTH_ROLES_TABLE),
    readAuthCollection(AUTH_TABLE),
  ]);
  applyRoleConfiguration(authRoles);
  renderLoginRoles();
}

function renderLoginRoles() {
  const container = document.getElementById("loginRoles");
  if (!container) return;
  container.innerHTML = authUsers
    .filter((user) => user.active && rights[user.role])
    .map(
      (user) =>
        `<button type="button" class="login-role" data-username="${esc(user.username)}" onclick="selectLoginRole(this)"><span>${esc(initials(user.fullName))}</span><strong>${esc(rolelabels[user.role])}</strong></button>`,
    )
    .join("");
}

function selectLoginRole(button) {
  document.querySelectorAll(".login-role").forEach((item) =>
    item.classList.toggle("active", item === button),
  );
  const user = authUsers.find((item) => item.username === button.dataset.username);
  document.getElementById("loginUsername").value = user?.username || "";
  document.getElementById("loginPassword").value = "123456";
  document.getElementById("loginError").textContent = "";
  document.getElementById("loginPassword").focus();
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    guideId: user.guideId || "",
  };
}

function storedSession() {
  const raw = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function restoreAuthSession() {
  const saved = storedSession();
  const user = saved && authUsers.find((item) => item.id === saved.id && item.active);
  if (!user || !rights[user.role]) {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
  return user;
}

function saveAuthSession(user, remember) {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
  (remember ? localStorage : sessionStorage).setItem(
    AUTH_SESSION_KEY,
    JSON.stringify(publicUser(user)),
  );
}

async function login(event) {
  event.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const error = document.getElementById("loginError");
  const submit = document.getElementById("loginSubmit");
  error.textContent = "";
  if (!username || !password) {
    error.textContent = "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.";
    return;
  }

  submit.disabled = true;
  submit.textContent = "Đang xác thực…";
  try {
    await loadAuthUsers();
    const user = authUsers.find(
      (item) => item.username.toLowerCase() === username.toLowerCase() && item.active,
    );
    const hash = user
      ? await hashPassword(password, user.salt, user.iterations)
      : "";
    if (!user || !hashesMatch(hash, user.passwordHash)) {
      error.textContent = "Tên đăng nhập hoặc mật khẩu không đúng.";
      return;
    }
    if (!rights[user.role]) throw new Error("Tài khoản chưa được gán role hợp lệ.");
    saveAuthSession(user, document.getElementById("loginRemember").checked);
    await enterApplication(user);
  } catch (loginError) {
    console.error("Login error:", loginError);
    error.textContent = loginError.message || "Không thể kết nối database.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Đăng nhập";
  }
}

function showLogin(message = "") {
  document.getElementById("authBoot").hidden = true;
  document.getElementById("appShell").hidden = true;
  document.getElementById("loginScreen").hidden = false;
  document.getElementById("loginError").textContent = message;
  setTimeout(() => document.getElementById("loginUsername").focus(), 0);
}

function showAppShell() {
  document.getElementById("authBoot").hidden = true;
  document.getElementById("loginScreen").hidden = true;
  document.getElementById("appShell").hidden = false;
}

function logout() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
  currentUser = null;
  closeAccountMenu();
  closeModal();
  document.getElementById("loginPassword").value = "";
  showLogin("Bạn đã đăng xuất khỏi hệ thống.");
}

function togglePassword() {
  const input = document.getElementById("loginPassword");
  input.type = input.type === "password" ? "text" : "password";
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function renderCurrentUser() {
  if (!currentUser) return;
  const avatar = initials(currentUser.fullName);
  const label = rolelabels[currentUser.role] || currentUser.role;
  for (const id of ["userAvatar", "menuUserAvatar"])
    document.getElementById(id).textContent = avatar;
  for (const id of ["userName", "menuUserName"])
    document.getElementById(id).textContent = currentUser.fullName;
  for (const id of ["userRole", "menuUserRole"])
    document.getElementById(id).textContent = label;
  document.getElementById("permissionMenuItem").hidden = !can("users_manage");
}

function toggleAccountMenu() {
  const menu = document.getElementById("accountMenu");
  menu.hidden = !menu.hidden;
  document.getElementById("accountButton").setAttribute("aria-expanded", String(!menu.hidden));
}

function closeAccountMenu() {
  document.getElementById("accountMenu").hidden = true;
  document.getElementById("accountButton").setAttribute("aria-expanded", "false");
}

function showAccountInfo() {
  closeAccountMenu();
  toast(`${currentUser.fullName} · ${rolelabels[currentUser.role]} · @${currentUser.username}`);
}

function showPermissionInfo() {
  closeAccountMenu();
  toast(`Role ${rolelabels[currentUser.role]} được truy cập ${rights[currentUser.role].length} menu.`);
}

function showForgotPassword() {
  document.getElementById("loginError").textContent =
    "Vui lòng liên hệ Giám đốc để đặt lại mật khẩu.";
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".account-wrap")) closeAccountMenu();
});
