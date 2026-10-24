/** Combines document visibility and native activity state. Either can suspend play. */
export class Lifecycle {
  private readonly inactive = new Set<string>();
  private readonly listeners = new Set<(active: boolean) => void>();
  private back: (() => boolean) | null = null;
  get active() { return this.inactive.size === 0; }
  setActive(source: string, active: boolean) {
    const before = this.active;
    if (active) this.inactive.delete(source); else this.inactive.add(source);
    if (before !== this.active) for (const listener of this.listeners) listener(this.active);
  }
  subscribe(listener: (active: boolean) => void) {
    this.listeners.add(listener);
    listener(this.active);
    return () => { this.listeners.delete(listener); };
  }
  onBack(handler: () => boolean) {
    this.back = handler;
    return () => { if (this.back === handler) this.back = null; };
  }
  requestBack() { return this.back?.() ?? false; }
}

export const lifecycle = new Lifecycle();
