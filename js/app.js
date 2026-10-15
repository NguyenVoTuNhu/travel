/* APPLICATION BOOTSTRAP — nạp database trước khi render ứng dụng. */

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
    closeAccountMenu();
  }
});

async function enterApplication(user) {
  currentUser = user;
  role = user.role;
  if (!rights[role]?.includes(current)) current = rights[role]?.[0];
  openNavGroups.clear();
  navGroupsInitialized = false;
  showAppShell();
  const app = document.getElementById("app");
  app.innerHTML = '<div class="empty">Đang kết nối database…</div>';
  try {
    await loadDatabase();
    initializeDemoCollections();
    applyDatabaseSettings();
    renderCurrentUser();
    render();
  } catch (error) {
    console.error("Database startup error:", error);
    app.innerHTML = `<div class="alert red"><b>Không thể kết nối database</b>${esc(error.message)}. Hãy kiểm tra kết nối tới kio.dvqt.vn rồi tải lại trang.</div>`;
  }
}

async function startApplication() {
  startUILocalization();
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
