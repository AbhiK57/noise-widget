#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  use window_vibrancy::apply_acrylic;
  use tauri::Manager;

  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      #[cfg(target_os = "windows")]
      {
        let window = app.get_webview_window("main").unwrap();
        apply_acrylic(&window, Some((18, 18, 18, 100))).expect("Failed to apply acrylic effect");
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
