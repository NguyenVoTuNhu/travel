/* APPLICATION BOOTSTRAP — khởi động ứng dụng sau khi tải đủ modules. */

// Start once after the configuration, storage and all module scripts are loaded.
initializeDemoCollections();
save();
window.addEventListener('keydown', event => {
  if(event.key === 'Escape') closeModal();
});
render();
