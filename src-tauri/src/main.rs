#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if std::env::args().nth(1).as_deref() == Some("--candle-infer") {
        std::process::exit(desens_tauri_lib::run_inference_cli());
    }
    desens_tauri_lib::run()
}
