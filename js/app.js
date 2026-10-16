/* APPLICATION BOOTSTRAP — nạp database trước khi render ứng dụng. */

window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.getElementById("globalSearch")?.focus();
  }
  if (event.key === "Escape") {
    closeModal();
    closeAccountMenu();
  }
});

document.addEventListener("invalid", (event) => {
  const control = event.target;
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) return;
  event.preventDefault();
  control.classList.add("field-invalid");
  control.setAttribute("aria-invalid", "true");
  let error = control.parentElement?.querySelector(":scope > .field-error");
  if (!error) {
    error = document.createElement("small");
    error.className = "field-error";
    control.insertAdjacentElement("afterend", error);
  }
  error.textContent = control.validationMessage || "Vui lòng kiểm tra trường này.";
  const first = control.form?.querySelector(":invalid");
  if (first === control) setTimeout(() => control.focus(), 0);
}, true);

document.addEventListener("input", (event) => {
  const control = event.target;
  if (!control?.matches?.("input,select,textarea") || !control.validity?.valid) return;
  control.classList.remove("field-invalid");
  control.removeAttribute("aria-invalid");
  control.parentElement?.querySelector(":scope > .field-error")?.remove();
});

async function enterApplication(user) {
  currentUser = user;
  role = user.role;
  if (!rights[role]?.includes(current)) current = rights[role]?.[0];
  openNavGroups.clear();
  navGroupsInitialized = false;
  showAppShell();
  const app = document.getElementById("app");
  const hasCache = restoreDatabaseCache();
  if (hasCache) {
    initializeDemoCollections();
    migrateWorkflowData();
    applyDatabaseSettings();
    renderCurrentUser();
    render();
  } else app.innerHTML = '<div class="empty">Đang kết nối database…</div>';
  try {
    await loadDatabase();
    initializeDemoCollections();
    const normalized = normalizeBusinessIds();
    const migrated = migrateWorkflowData();
    if (normalized || migrated) save();
    applyDatabaseSettings();
    renderCurrentUser();
    render();
    enforcePasswordChange();
  } catch (error) {
    console.error("Database startup error:", error);
    if (hasCache) toast("Đang dùng dữ liệu gần nhất vì database tạm thời mất kết nối.");
    else app.innerHTML = `<div class="alert red"><b>Không thể kết nối database</b>${esc(error.message)}. Hãy kiểm tra kết nối tới kio.dvqt.vn rồi tải lại trang.</div>`;
  }
}

async function startApplication() {
  startUILocalization();
  if (restoreAuthCache()) {
    const cachedUser = await restoreAuthSession();
    if (cachedUser) {
      enterApplication(cachedUser);
      loadAuthUsers()
        .then(async () => {
          if (!(await restoreAuthSession())) logout();
        })
        .catch((error) => console.warn("Background authentication refresh error:", error));
      return;
    }
  }
  try {
    await loadAuthUsers();
    const user = await restoreAuthSession();
    if (user) await enterApplication(user);
    else showLogin();
  } catch (error) {
    console.error("Authentication startup error:", error);
    showLogin(`${error.message} Hãy kiểm tra kết nối tới kio.dvqt.vn.`);
  }
}

startApplication();
