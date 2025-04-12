use lazy_static::lazy_static;
use os_info::{get as get_os_info, Type, Version};
use rdev::{EventType, Key};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::sync::Mutex;
use tauri::{Emitter, Manager};
use window_vibrancy::apply_acrylic;

#[derive(Debug, Clone)]
struct Keybind {
    _id: String,
    keys: Vec<Key>,
    action: String,
}

struct KeybindManager {
    keybinds: HashMap<String, Keybind>,
    enabled: bool,
}

impl KeybindManager {
    fn new() -> Self {
        Self {
            keybinds: HashMap::new(),
            enabled: true,
        }
    }

    fn add_keybind(&mut self, id: String, keys: Vec<Key>, action: String) -> Result<(), String> {
        // Substituir o keybind existente se o ID já existir, em vez de retornar erro
        self.keybinds.insert(
            id.clone(),
            Keybind {
                _id: id,
                keys,
                action,
            },
        );
        Ok(())
    }

    fn remove_keybind(&mut self, id: &str) -> Result<(), String> {
        if !self.keybinds.contains_key(id) {
            return Err(format!("Keybind com ID '{}' não existe", id));
        }

        self.keybinds.remove(id);
        Ok(())
    }

    fn add_keybinds_batch(
        &mut self,
        keybinds: Vec<(String, Vec<Key>, String)>,
    ) -> Result<(), String> {
        for (id, keys, action) in keybinds {
            self.add_keybind(id, keys, action)?;
        }
        Ok(())
    }

    fn remove_all_keybinds(&mut self) {
        self.keybinds.clear();
    }

    fn enable(&mut self) {
        self.enabled = true;
    }

    fn disable(&mut self) {
        self.enabled = false;
    }

    fn check_keybinds(&self, pressed_keys: &HashSet<Key>) -> Option<String> {
        if !self.enabled {
            return None;
        }

        for keybind in self.keybinds.values() {
            if keybind.keys.iter().all(|k| pressed_keys.contains(k)) {
                return Some(keybind.action.clone());
            }
        }
        None
    }
}

lazy_static! {
    // HashMap para mapear strings para rdev::Key
    static ref KEY_MAP: HashMap<&'static str, Key> = {
        let mut map = HashMap::new();
        map.insert("ShiftLeft", Key::ShiftLeft);
        map.insert("ShiftRight", Key::ShiftRight);
        map.insert("Shift", Key::ShiftLeft);
        map.insert("ControlLeft", Key::ControlLeft);
        map.insert("ControlRight", Key::ControlRight);
        map.insert("Ctrl", Key::ControlLeft);
        map.insert("AltLeft", Key::Alt);
        map.insert("Alt", Key::Alt);
        map.insert("AltRight", Key::AltGr);
        map.insert("SuperLeft", Key::MetaLeft);
        map.insert("MetaLeft", Key::MetaLeft);
        map.insert("SuperRight", Key::MetaRight);
        map.insert("MetaRight", Key::MetaRight);
        map.insert("Escape", Key::Escape);
        map.insert("F1", Key::F1);
        map.insert("F2", Key::F2);
        map.insert("F3", Key::F3);
        map.insert("F4", Key::F4);
        map.insert("F5", Key::F5);
        map.insert("F6", Key::F6);
        map.insert("F7", Key::F7);
        map.insert("F8", Key::F8);
        map.insert("F9", Key::F9);
        map.insert("F10", Key::F10);
        map.insert("F11", Key::F11);
        map.insert("F12", Key::F12);
        map.insert("1", Key::Num1);
        map.insert("2", Key::Num2);
        map.insert("3", Key::Num3);
        map.insert("4", Key::Num4);
        map.insert("5", Key::Num5);
        map.insert("6", Key::Num6);
        map.insert("7", Key::Num7);
        map.insert("8", Key::Num8);
        map.insert("9", Key::Num9);
        map.insert("0", Key::Num0);
        map.insert("A", Key::KeyA);
        map.insert("B", Key::KeyB);
        map.insert("C", Key::KeyC);
        map.insert("D", Key::KeyD);
        map.insert("E", Key::KeyE);
        map.insert("F", Key::KeyF);
        map.insert("G", Key::KeyG);
        map.insert("H", Key::KeyH);
        map.insert("I", Key::KeyI);
        map.insert("J", Key::KeyJ);
        map.insert("K", Key::KeyK);
        map.insert("L", Key::KeyL);
        map.insert("M", Key::KeyM);
        map.insert("N", Key::KeyN);
        map.insert("O", Key::KeyO);
        map.insert("P", Key::KeyP);
        map.insert("Q", Key::KeyQ);
        map.insert("R", Key::KeyR);
        map.insert("S", Key::KeyS);
        map.insert("T", Key::KeyT);
        map.insert("U", Key::KeyU);
        map.insert("V", Key::KeyV);
        map.insert("W", Key::KeyW);
        map.insert("X", Key::KeyX);
        map.insert("Y", Key::KeyY);
        map.insert("Z", Key::KeyZ);
        map.insert("Backspace", Key::Backspace);
        map.insert("Enter", Key::Return);
        map.insert("Return", Key::Return);
        map.insert("Tab", Key::Tab);
        map.insert("Space", Key::Space);
        map.insert("Delete", Key::Delete);
        map.insert("Home", Key::Home);
        map.insert("End", Key::End);
        map.insert("PageUp", Key::PageUp);
        map.insert("PageDown", Key::PageDown);
        map.insert("UpArrow", Key::UpArrow);
        map.insert("DownArrow", Key::DownArrow);
        map.insert("LeftArrow", Key::LeftArrow);
        map.insert("RightArrow", Key::RightArrow);
        // Adicionar teclas de símbolos que estavam faltando
        map.insert("-", Key::Minus);
        map.insert("=", Key::Equal);
        map.insert("[", Key::LeftBracket);
        map.insert("]", Key::RightBracket);
        map.insert(";", Key::SemiColon);
        map.insert("'", Key::Quote);
        map.insert("`", Key::BackQuote);
        map.insert("\\", Key::BackSlash);
        map.insert(",", Key::Comma);
        map.insert(".", Key::Dot);
        map.insert("/", Key::Slash);
        map
    };
}

fn string_to_key(key_str: &str) -> Result<Key, String> {
    KEY_MAP
        .get(key_str)
        .cloned()
        .ok_or_else(|| format!("Tecla '{}' não reconhecida ou não mapeada", key_str))
}

fn get_os_details() -> (String, String, Option<String>) {
    let os = get_os_info();
    let os_name = match os.os_type() {
        Type::Windows => "Windows".to_string(),
        Type::Macos => "macOS".to_string(),
        _ => os.os_type().to_string(), // Outros sistemas
    };
    let os_version = match os.version() {
        Version::Semantic(major, minor, _) => format!("{}.{}", major, minor),
        Version::Custom(v) => v.to_string(),
        _ => os.version().to_string(),
    };
    let os_build = match os.version() {
        Version::Custom(v) => Some(v.to_string()), // Pode conter build no Windows
        _ => None,
    };
    (os_name, os_version, os_build)
}

fn can_apply_effect(effect: &str, os_name: &str, os_version: &str, os_build: Option<&str>) -> bool {
    match (os_name, effect) {
        ("Windows", "acrylic") => {
            // Acrylic é suportado no Windows 10 (versão 1803+) e Windows 11
            if os_version.starts_with("10") {
                if let Some(build) = os_build {
                    build >= "1803" // Build 1803 é o mínimo para acrylic
                } else {
                    true // Assume suporte se build não estiver disponível
                }
            } else if os_version.starts_with("11") {
                true // Windows 11 suporta acrylic
            } else {
                false
            }
        }
        ("Windows", "mica") => {
            // Mica é suportado apenas no Windows 11, build 22000+
            if os_version.starts_with("11") {
                if let Some(build) = os_build {
                    build >= "22000"
                } else {
                    true // Assume suporte se build não estiver disponível
                }
            } else {
                false
            }
        }
        ("macOS", "vibrancy") => {
            // Vibrancy é suportado no macOS 10.10+
            if let Ok(version) = os_version.parse::<f32>() {
                version >= 10.10
            } else {
                false
            }
        }
        _ => false, // Efeito ou SO não suportado
    }
}
#[tauri::command]
fn add_keybind(id: String, key_strings: Vec<String>, action: String) -> Result<(), String> {
    let mut keys = Vec::new();
    for key_str in key_strings {
        keys.push(string_to_key(&key_str)?);
    }

    let mut manager = KEYBIND_MANAGER
        .lock()
        .expect("Falha ao obter lock do KeybindManager (possivelmente poisoned)");
    manager.add_keybind(id, keys, action)
}

#[tauri::command]
fn remove_keybind(id: String) -> Result<(), String> {
    let mut manager = KEYBIND_MANAGER
        .lock()
        .expect("Falha ao obter lock do KeybindManager (possivelmente poisoned)");
    manager.remove_keybind(&id)
}

#[tauri::command]
fn disable_keybinds() {
    if let Ok(mut manager) = KEYBIND_MANAGER.lock() {
        manager.disable();
    } else {
        eprintln!("Erro: Falha ao obter lock do KeybindManager para desabilitar.");
    }
}

#[tauri::command]
fn enable_keybinds() {
    if let Ok(mut manager) = KEYBIND_MANAGER.lock() {
        manager.enable();
    } else {
        eprintln!("Erro: Falha ao obter lock do KeybindManager para habilitar.");
    }
}

#[tauri::command]
fn add_keybinds_batch(keybinds_data: Vec<(String, Vec<String>, String)>) -> Result<(), String> {
    let mut keybinds = Vec::new();
    for (id, key_strings, action) in keybinds_data {
        let mut keys = Vec::new();
        for key_str in key_strings {
            keys.push(string_to_key(&key_str)?);
        }
        keybinds.push((id, keys, action));
    }

    let mut manager = KEYBIND_MANAGER
        .lock()
        .expect("Falha ao obter lock do KeybindManager (possivelmente poisoned)");
    manager.add_keybinds_batch(keybinds)
}

#[tauri::command]
fn remove_all_keybinds() {
    if let Ok(mut manager) = KEYBIND_MANAGER.lock() {
        manager.remove_all_keybinds();
    } else {
        eprintln!("Erro: Falha ao obter lock do KeybindManager para remover todos os keybinds.");
    }
}

lazy_static! {
    static ref KEYBIND_MANAGER: Arc<Mutex<KeybindManager>> =
        Arc::new(Mutex::new(KeybindManager::new()));
}

#[tauri::command]
fn handle_shortcut_action(shortcut_name: &str) -> String {
    format!("Atalho {} foi acionado com sucesso", shortcut_name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            handle_shortcut_action,
            add_keybind,
            remove_keybind,
            disable_keybinds,
            enable_keybinds,
            add_keybinds_batch,
            remove_all_keybinds
        ])
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("Não foi possível encontrar a janela principal 'main'");

            let (os_name, os_version, os_build) = get_os_details();

            // Verifica se o efeito apply_acrylic pode ser aplicado
            #[cfg(target_os = "windows")]
            {
                if can_apply_effect("acrylic", &os_name, &os_version, os_build.as_deref()) {
                    apply_acrylic(&window, Some((18, 18, 18, 125)))
                        .expect("Falha ao aplicar acrylic: versão do Windows não suportada");
                } else {
                    println!(
                        "Acrylic não suportado nesta versão do Windows: {} {}",
                        os_version,
                        os_build.unwrap_or_default()
                    );
                    // Aqui você pode aplicar um efeito alternativo ou deixar sem efeito
                }
            }

            let app_handle = app.handle().clone();
            let pressed_keys = Arc::new(Mutex::new(HashSet::new()));
            let manager = KEYBIND_MANAGER.clone();

            tauri::async_runtime::spawn(async move {
                let keys = pressed_keys.clone();
                // Clone o app_handle para usar dentro do closure
                let listen_app_handle = app_handle.clone();

                let listen_result = rdev::listen(move |event| {
                    match event.event_type {
                        EventType::KeyPress(key) => {
                            keys.lock()
                                .expect("Falha ao obter lock de pressed_keys (KeyPress)")
                                .insert(key);

                            let manager_guard = manager
                                .lock()
                                .expect("Falha ao obter lock do manager (check_keybinds)");
                            let keys_guard = keys
                                .lock()
                                .expect("Falha ao obter lock de pressed_keys (check_keybinds)");

                            if let Some(action) = manager_guard.check_keybinds(&keys_guard) {
                                if let Err(e) =
                                    listen_app_handle.emit("keybind-triggered", action.clone())
                                {
                                    eprintln!("Erro ao emitir evento keybind-triggered: {}", e);
                                    // Emitir evento de erro para o frontend usando listen_app_handle
                                    let _ = listen_app_handle.emit(
                                        "backend-error",
                                        format!("Erro ao emitir evento keybind-triggered: {}", e),
                                    );
                                }
                            }
                        }
                        EventType::KeyRelease(key) => {
                            keys.lock()
                                .expect("Falha ao obter lock de pressed_keys (KeyRelease)")
                                .remove(&key);
                        }
                        _ => (),
                    };
                });

                if let Err(err) = listen_result {
                    eprintln!("Erro ao iniciar listener de teclado rdev: {:?}", err);
                    // Agora podemos usar app_handle separadamente aqui
                    let _ = app_handle.emit(
                        "backend-error",
                        format!("Erro ao iniciar listener de teclado: {:?}", err),
                    );
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
