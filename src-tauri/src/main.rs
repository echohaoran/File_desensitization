#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if std::env::args().nth(1).as_deref() == Some("--candle-infer") {
        std::process::exit(desens_tauri_lib::run_inference_cli());
    }
    if std::env::args().nth(1).as_deref() == Some("--candle-regex-convert") {
        std::process::exit(desens_tauri_lib::run_regex_conversion_cli());
    }
    desens_tauri_lib::run()
}
