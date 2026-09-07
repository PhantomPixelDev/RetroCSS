/**
 * Type definitions for RetroCSS.
 *
 * Hand-written rather than generated: the runtime is plain JS, so `tsc` would
 * infer `any` for most of this. Keep in step with src/js/ when the API changes.
 */

export type RetroTheme = 'light' | 'dark';

/** Hue names that have a full token set (fill, -fg, -text, -hover, -active). */
export type RetroHue =
  | 'primary' | 'success' | 'danger' | 'warning' | 'info'
  | 'teal' | 'tan' | 'pink' | 'lime' | 'cyan' | 'orange' | 'brown'
  | 'violet' | 'gray' | 'maroon' | 'gold' | 'navy' | 'olive' | 'silver';

export interface RetroToastOptions {
  /** Visual variant. `danger` is announced assertively. */
  type?: RetroHue | 'light' | 'dark';
  /** Milliseconds before auto-dismiss. `0` disables the timer entirely. */
  duration?: number;
  /**
   * Render `message` as HTML. Unsanitised — never pass user input.
   * Omitted or `false` uses textContent.
   */
  html?: boolean;
}

export interface RetroToastHandle {
  /** Dismiss now. Safe to call more than once. */
  dismiss(): void;
  element: HTMLElement;
}

export interface RetroToastApi {
  show(message: string, options?: RetroToastOptions): RetroToastHandle;
  /** The live region every toast is appended to, created on first use. */
  container(): HTMLElement;
}

export interface RetroModalApi {
  init(root?: ParentNode): void;
  /** Open by element id. Moves focus in and makes the rest of the page inert. */
  show(modalId: string): void;
  /** Close by element id and restore focus to whatever opened it. */
  hide(modalId: string): void;
}

export interface RetroInitable {
  init(root?: ParentNode): void;
}

export interface RetroEventsApi {
  on(event: string, handler: (detail: unknown) => void): void;
  off(event: string, handler: (detail: unknown) => void): void;
  emit(event: string, detail?: unknown): void;
}

export interface RetroCSSApi {
  modal: RetroModalApi;
  toast: RetroToastApi;
  form: RetroInitable;
  table: RetroInitable;
  dropdown: RetroInitable;
  fileUpload: RetroInitable;
  events: RetroEventsApi;

  /** The theme in effect: a stored choice if there is one, else the OS setting. */
  theme: RetroTheme;

  /** Wire up every component under `document`. Safe to call more than once. */
  init(): RetroCSSApi;

  /** Set the theme without storing it as an explicit choice. */
  applyTheme(theme: RetroTheme): void;

  initTooltips(): void;
  initToastTriggers(): void;
  initSearchBars(): void;
  initTagInputs(): void;
  initThemeToggle(): void;
  initSystemThemeWatch(): void;
  initRatingStars(): void;
}

declare const RetroCSS: RetroCSSApi;
export default RetroCSS;

declare global {
  interface Window {
    RetroCSS: RetroCSSApi;
    RetroModal: RetroModalApi;
    RetroToast: RetroToastApi;
    RetroForm: RetroInitable;
    RetroTable: RetroInitable;
    RetroDropdown: RetroInitable;
    RetroFileUpload: RetroInitable;
    RetroEvents: RetroEventsApi;
  }

  interface HTMLElementEventMap {
    /** Fired by `.retro-rating` when a star is chosen. */
    'retro:rating': CustomEvent<{ rating: number; max: number }>;
    /** Fired by `.retro-infinite-scroll` when the bottom comes into view. */
    'retro:loadmore': CustomEvent<{
      page: number;
      append(node: Node): void;
      loaded(): void;
      done(): void;
    }>;
  }
}
