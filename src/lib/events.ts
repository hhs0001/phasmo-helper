// Sistema simples de eventos para comunicação entre componentes
type EventName =
  | "timer:start-hunt"
  | "timer:start-smudge"
  | "timer:start-cooldown"
  | "timer:start-hunt-track"
  | "ghostSpeed:calculate"
  | "ghosts:selectSpeedTab";
type EventCallback = (data?: any) => void;

class EventBus {
  private listeners: Map<EventName, EventCallback[]> = new Map();

  // Inscrever para ouvir um evento
  public subscribe(event: EventName, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(callback);

    // Retornar uma função para cancelar a inscrição
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Emitir um evento
  public emit(event: EventName, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
}

// Criar uma única instância para toda a aplicação
export const eventBus = new EventBus();
