use lazy_static::lazy_static;
use rdev::{EventType, Key};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::sync::Mutex;
use tauri::{Emitter, Manager}; // Adiciona Emitter aqui
use window_vibrancy::apply_acrylic;

// Definindo uma estrutura para representar um keybind
#[derive(Debug, Clone)]
struct Keybind {
    _id: String, // Renomeado para _id para indicar que não é lido diretamente
    keys: Vec<Key>,
    action: String,
}

// Estrutura para gerenciar os keybinds
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
        if self.keybinds.contains_key(&id) {
            return Err(format!("Keybind com ID '{}' já existe", id));
        }

        self.keybinds.insert(
            id.clone(),
            Keybind {
                _id: id,
                keys,
                action,
            },
        ); // Usa _id aqui
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

    // Método is_enabled removido pois não era utilizado (verificação feita em check_keybinds)

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
        map.insert("ControlLeft", Key::ControlLeft);
        map.insert("ControlRight", Key::ControlRight);
        map.insert("AltLeft", Key::Alt); // Corresponde a Alt esquerdo (rdev usa Key::Alt)
        map.insert("Alt", Key::Alt); // Alias comum para Alt esquerdo
        map.insert("AltRight", Key::AltGr); // Corresponde a AltGr ou Alt direito (rdev usa Key::AltGr)
        map.insert("SuperLeft", Key::MetaLeft); // Corresponde a tecla Windows/Command esquerda
        map.insert("MetaLeft", Key::MetaLeft); // Nome alternativo
        map.insert("SuperRight", Key::MetaRight); // Corresponde a tecla Windows/Command direita
        map.insert("MetaRight", Key::MetaRight); // Nome alternativo
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
        // Adicione outras teclas conforme necessário (ex: Backspace, Enter, Tab, setas, etc.)
        map.insert("Backspace", Key::Backspace);
        map.insert("Enter", Key::Return); // Ou Key::Return ou Key::KpReturn
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
        // Teclas do Numpad (exemplo)
        map.insert("Numpad0", Key::Kp0);
        map.insert("Numpad1", Key::Kp1);
        // ... (adicione outras teclas do numpad)
        map.insert("NumpadEnter", Key::KpReturn);
        map
    };
}

// Função para converter string em Key usando o HashMap
fn string_to_key(key_str: &str) -> Result<Key, String> {
    // Tenta buscar no mapa, ignorando maiúsculas/minúsculas pode ser útil
    // mas rdev::Key diferencia ShiftLeft/Right, etc. Então mantemos case-sensitive por enquanto.
    KEY_MAP
        .get(key_str)
        .cloned() // Clona a Key encontrada
        .ok_or_else(|| format!("Tecla '{}' não reconhecida ou não mapeada", key_str))
}

// Funções para o frontend chamar via Tauri
#[tauri::command]
fn add_keybind(id: String, key_strings: Vec<String>, action: String) -> Result<(), String> {
    let mut keys = Vec::new();
    for key_str in key_strings {
        keys.push(string_to_key(&key_str)?);
    }

    // Adquire o lock do manager
    let mut manager = KEYBIND_MANAGER
        .lock()
        .expect("Falha ao obter lock do KeybindManager (possivelmente poisoned)");
    manager.add_keybind(id, keys, action)
}

#[tauri::command]
fn remove_keybind(id: String) -> Result<(), String> {
    // Adquire o lock do manager
    let mut manager = KEYBIND_MANAGER
        .lock()
        .expect("Falha ao obter lock do KeybindManager (possivelmente poisoned)");
    manager.remove_keybind(&id)
}

#[tauri::command]
fn disable_keybinds() {
    // Adquire o lock do manager e trata possível erro
    // Usar expect para lidar com lock poisoned, pois é um erro inesperado aqui.
    if let Ok(mut manager) = KEYBIND_MANAGER.lock() {
        // Mantém Ok para não falhar o comando se o lock estiver ok
        manager.disable();
    } else {
        eprintln!("Erro: Falha ao obter lock do KeybindManager para desabilitar.");
    }
}

#[tauri::command]
fn enable_keybinds() {
    // Adquire o lock do manager e trata possível erro
    // Usar expect para lidar com lock poisoned.
    if let Ok(mut manager) = KEYBIND_MANAGER.lock() {
        // Mantém Ok para não falhar o comando se o lock estiver ok
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

    // Adquire o lock do manager
    let mut manager = KEYBIND_MANAGER
        .lock()
        .expect("Falha ao obter lock do KeybindManager (possivelmente poisoned)");
    manager.add_keybinds_batch(keybinds)
}

#[tauri::command]
fn remove_all_keybinds() {
    // Adquire o lock do manager e trata possível erro
    // Usar expect para lidar com lock poisoned.
    if let Ok(mut manager) = KEYBIND_MANAGER.lock() {
        // Mantém Ok para não falhar o comando se o lock estiver ok
        manager.remove_all_keybinds();
    } else {
        eprintln!("Erro: Falha ao obter lock do KeybindManager para remover todos os keybinds.");
    }
}

// Variável global para o gerenciador de keybinds
// Usa lazy_static para inicialização segura de estáticos
lazy_static! {
    // Mutex para o KeybindManager compartilhado entre threads
    static ref KEYBIND_MANAGER: Arc<Mutex<KeybindManager>> = Arc::new(Mutex::new(KeybindManager::new()));
}

// Comando para ser chamado pelo frontend para registrar eventos de atalho
#[tauri::command]
fn handle_shortcut_action(shortcut_name: &str) -> String {
    println!("Atalho acionado: {}", shortcut_name);
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

            #[cfg(target_os = "windows")]
            apply_acrylic(&window, Some((18, 18, 18, 125)))
                .expect("Unsupported platform! 'apply_blur' is only supported on Windows");

            // Criar um app_handle que pode ser clonado para uso na thread de eventos de teclado
            let app_handle = app.handle().clone();

            // Criar um conjunto para armazenar as teclas atualmente pressionadas
            let pressed_keys = Arc::new(Mutex::new(HashSet::new()));
            let manager = KEYBIND_MANAGER.clone();

            // Iniciar a escuta de eventos de teclado em uma thread separada
            tauri::async_runtime::spawn(async move {
                let keys = pressed_keys.clone();

                let listen_result = rdev::listen(move |event| {
                    match event.event_type {
                        EventType::KeyPress(key) => {
                            println!("KeyPress: {:?}", &key);

                            // Adicionar tecla ao conjunto de teclas pressionadas
                            keys.lock()
                                .expect("Falha ao obter lock de pressed_keys (KeyPress)")
                                .insert(key);

                            // Verificar se algum keybind foi acionado
                            // Obter locks separadamente para evitar deadlocks
                            let manager_guard = manager
                                .lock()
                                .expect("Falha ao obter lock do manager (check_keybinds)");
                            let keys_guard = keys
                                .lock()
                                .expect("Falha ao obter lock de pressed_keys (check_keybinds)");

                            if let Some(action) = manager_guard.check_keybinds(&keys_guard) {
                                println!("Atalho detectado, ação: {}", action);

                                // Emitir evento para o frontend
                                // Clonar action para o evento, pois app_handle pode precisar dela depois
                                // Emitir evento global usando app_handle.emit (Tauri v2)
                                // e tratar o Result retornado.
                                if let Err(e) = app_handle.emit("keybind-triggered", action.clone())
                                {
                                    eprintln!("Erro ao emitir evento keybind-triggered: {}", e);
                                }
                            }
                            // Locks são liberados automaticamente quando manager_guard e keys_guard saem de escopo
                        }
                        EventType::KeyRelease(key) => {
                            println!("KeyRelease: {:?}", &key);

                            // Remover tecla do conjunto de teclas pressionadas
                            keys.lock()
                                .expect("Falha ao obter lock de pressed_keys (KeyRelease)")
                                .remove(&key);
                        }
                        _ => (),
                    };
                }); // Fim do rdev::listen

                // Tratar o resultado do rdev::listen
                if let Err(err) = listen_result {
                    eprintln!("Erro ao iniciar listener de teclado rdev: {:?}", err);
                    // Considerar notificar o usuário ou tentar reiniciar o listener, ou retornar erro no setup
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
