import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { ConfigurationService, NotificationPreferences } from "../../../services/configuration.service"
import { ThemeService, ThemeConfig } from "../../../services/theme.service"

type NotificationChannel = NotificationPreferences["channel"]

@Component({
  selector: "app-configuration-modal",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div>
            <p class="eyebrow">Preferencias</p>
            <h2>Configuracion personal</h2>
            <p class="description">
              Ajusta el aspecto de la aplicacion y como deseas recibir las notificaciones.
            </p>
          </div>
          <button class="close-btn" type="button" (click)="closeModal()" aria-label="Cerrar configuracion">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <nav class="tabs">
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab === 'preferences'"
            (click)="activeTab = 'preferences'">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            Preferencias personales
          </button>
          <button
            *ngIf="canManagePorts"
            type="button"
            class="tab-btn"
            [class.active]="activeTab === 'operations'"
            (click)="activeTab = 'operations'">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1v22M4 5h16M4 12h16M4 19h16"></path>
            </svg>
            Operaciones
          </button>
        </nav>

        <section class="tab-content" *ngIf="activeTab === 'preferences'">
          <div class="settings-grid">
            <article class="card">
              <div class="card-header decorated">
                <span class="chip chip-primary">Tema</span>
                <div>
                  <h3>Modo de visualización</h3>
                  <p class="support-text">Activa el modo claro u oscuro según tus necesidades.</p>
                </div>
              </div>

              <div class="card-body">
                <div class="setting-group">
                  <label class="label">Modo</label>
                  <div class="radio-group">
                    <label class="radio-option">
                      <input type="radio" name="themeMode" value="light" [(ngModel)]="themeConfig.mode" (change)="updateTheme()">
                      <span>Claro</span>
                    </label>
                    <label class="radio-option">
                      <input type="radio" name="themeMode" value="dark" [(ngModel)]="themeConfig.mode" (change)="updateTheme()">
                      <span>Oscuro</span>
                    </label>
                  </div>
                </div>

                <div class="theme-preview">
                  <div class="preview-panel">
                    <span class="preview-badge">Vista previa</span>
                    <h4>{{ themeConfig.mode === 'dark' ? 'Modo Oscuro' : 'Modo Claro' }}</h4>
                    <p>{{ themeConfig.mode === 'dark' ? 'Interfaz con contrastes optimizados para entornos de baja luz.' : 'Iluminación neutra para jornadas diurnas.' }}</p>
                    <div class="preview-line"></div>
                    <span class="preview-hint">Los cambios se aplican al instante</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="tab-content" *ngIf="activeTab === 'operations'">
          <article class="card operations-card">
            <div class="card-header decorated">
              <span class="chip chip-secondary">Puertos</span>
              <div>
                <h3>Administración de puertos</h3>
                <p class="support-text">
                  Gestiona cierres, habilitaciones y bloqueos temporales que afectan las rutas disponibles en la plataforma.
                </p>
              </div>
            </div>
            <div class="card-body operations-body">
              <ul class="operations-list">
                <li>Supervisa el estado global de los puertos habilitados por región.</li>
                <li>Desactiva temporalmente destinos no operativos o con incidencias.</li>
                <li>Coordina reaperturas en tiempo real junto con los operadores regionales.</li>
              </ul>
              <button class="btn-primary" type="button" (click)="openPortAdministration()">
                Abrir administrador de puertos
              </button>
            </div>
          </article>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.65);
        display: grid;
        place-items: center;
        z-index: 1000;
      }

      .modal-container {
        width: min(940px, 95vw);
        max-height: 90vh;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 1.5rem;
        box-shadow: 0 40px 70px rgba(15, 23, 42, 0.3);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.25);
        backdrop-filter: blur(12px);
      }

      .modal-header {
        padding: 1.75rem 2.25rem 1.25rem;
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.85rem;
        color: #0f172a;
      }

      .description {
        margin: 0.35rem 0 0;
        color: #64748b;
      }

      .close-btn {
        border: none;
        background: transparent;
        color: #475569;
        cursor: pointer;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        transition: background 0.2s;
      }

      .close-btn:hover {
        background: rgba(15, 23, 42, 0.06);
      }

      .tabs {
        display: flex;
        gap: 0.75rem;
        padding: 0 2rem 1.25rem;
      }

      .tab-btn {
        border: none;
        background: rgba(248, 250, 252, 0.85);
        color: #475569;
        font-weight: 500;
        padding: 0.85rem 1.25rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        border-radius: 999px;
        cursor: pointer;
        border: 1px solid rgba(148, 163, 184, 0.3);
        transition: color 0.2s, border-color 0.2s, background 0.2s;
      }

      .tab-btn.active {
        color: #fff;
        border-color: #0a6cbc;
        background: linear-gradient(135deg, #0a6cbc, #38bdf8);
        box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
      }

      .tab-content {
        padding: 1.5rem 2rem 2rem;
        overflow: auto;
      }

      .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
      }

      .card {
        position: relative;
        border-radius: 1.25rem;
        border: 1px solid rgba(148, 163, 184, 0.25);
        background: linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(226, 232, 240, 0.85));
        box-shadow: 0 25px 45px rgba(15, 23, 42, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        isolation: isolate;
      }

      .card::after {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top right, rgba(14, 165, 233, 0.18), transparent 65%);
        opacity: 0.8;
        pointer-events: none;
      }

      .card-header {
        position: relative;
        z-index: 1;
        padding: 1.25rem 1.25rem 0;
      }

      .card-body {
        position: relative;
        z-index: 1;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .setting-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        color: #0f172a;
        font-weight: 500;
      }

      select,
      input[type="time"] {
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        font: inherit;
      }

      .radio-group {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .radio-option {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.95rem;
        color: #475569;
        padding: 0.45rem 0.9rem;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(248, 250, 252, 0.9);
        transition: border-color 0.2s, background 0.2s, color 0.2s;
      }

      .radio-option input[type="radio"] {
        accent-color: #0a6cbc;
      }

      .radio-option:hover {
        border-color: #0a6cbc;
        color: #0a6cbc;
      }

      .switch-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
      }

      .theme-preview {
        margin-top: 0.25rem;
        position: relative;
        border-radius: 1rem;
        overflow: hidden;
        padding: 1.25rem;
        background: radial-gradient(circle at top right, rgba(14, 165, 233, 0.15), rgba(248, 250, 252, 0.95));
        color: #0f172a;
        box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
      }

      .theme-preview::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), transparent 60%);
        opacity: 0.5;
        pointer-events: none;
      }

      .preview-panel {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.2);
      }

      .preview-panel h4 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
        color: #0f172a;
      }

      .preview-panel p {
        margin: 0;
        font-size: 0.9rem;
        color: #475569;
      }

      .preview-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        background: rgba(15, 118, 232, 0.12);
        color: #0a6cbc;
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
        font-size: 0.7rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .preview-line {
        height: 3px;
        width: 100%;
        background: linear-gradient(90deg, #0a6cbc, #38bdf8);
        border-radius: 999px;
      }

      .preview-hint {
        font-size: 0.8rem;
        color: #64748b;
      }

      .quiet-hours {
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .quiet-hours-range {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 1rem;
      }

      .operations-card {
        border-color: rgba(14, 165, 233, 0.35);
        background: rgba(14, 165, 233, 0.08);
      }

      .operations-body {
        gap: 1rem;
      }

      .operations-list {
        padding-left: 1.25rem;
        margin: 0;
        color: #0f172a;
        line-height: 1.4;
      }

      .btn-primary {
        border: none;
        background: #0a6cbc;
        color: #fff;
        font-weight: 600;
        border-radius: 0.65rem;
        padding: 0.75rem 1.25rem;
        cursor: pointer;
        align-self: flex-start;
        transition: background 0.2s;
      }

      .btn-primary:hover {
        background: #084f8d;
      }

      @media (max-width: 640px) {
        .modal-container {
          border-radius: 0;
          width: 100vw;
          height: 100vh;
          max-height: none;
        }

        .tabs {
          flex-direction: column;
        }

        .tab-btn {
          border-bottom: 1px solid #e2e8f0;
        }
      }

      :host-context(.dark-mode) .modal-container {
        background: rgba(5, 10, 25, 0.95);
        color: #e2e8f0;
        border-color: rgba(56, 189, 248, 0.15);
        box-shadow: 0 45px 90px rgba(1, 4, 18, 0.9);
      }

      :host-context(.dark-mode) .modal-header h2 {
        color: #f8fafc;
      }

      :host-context(.dark-mode) .card {
        background: linear-gradient(150deg, rgba(13, 37, 63, 0.95), rgba(15, 23, 42, 0.9));
        border-color: rgba(59, 130, 246, 0.2);
        box-shadow: 0 25px 45px rgba(2, 6, 23, 0.6);
      }

      :host-context(.dark-mode) .card::after {
        background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.25), transparent 65%);
        opacity: 1;
      }

      :host-context(.dark-mode) .description,
      :host-context(.dark-mode) .preview-panel p,
      :host-context(.dark-mode) .preview-hint,
      :host-context(.dark-mode) .label {
        color: #cbd5f5;
      }

      :host-context(.dark-mode) .tab-btn {
        background: rgba(8, 18, 35, 0.8);
        color: #94a3b8;
        border-color: rgba(148, 163, 184, 0.25);
      }

      :host-context(.dark-mode) .tab-btn.active {
        background: linear-gradient(135deg, #1d4ed8, #38bdf8);
        color: #f8fafc;
        border-color: rgba(59, 130, 246, 0.45);
      }

      :host-context(.dark-mode) .radio-option {
        background: rgba(8, 18, 35, 0.85);
        border-color: rgba(59, 130, 246, 0.35);
      }

      :host-context(.dark-mode) .radio-option:hover {
        color: #38bdf8;
        border-color: #38bdf8;
      }

      :host-context(.dark-mode) .theme-preview {
        background: radial-gradient(circle at top right, rgba(30, 64, 175, 0.35), rgba(2, 6, 23, 0.95));
        color: #f1f5f9;
        box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.35);
      }

      :host-context(.dark-mode) .theme-preview::after {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.35), transparent 60%);
      }

      :host-context(.dark-mode) .preview-panel {
        background: rgba(6, 12, 30, 0.9);
        border-color: rgba(59, 130, 246, 0.3);
      }

      :host-context(.dark-mode) .preview-panel h4 {
        color: #f8fafc;
      }

      :host-context(.dark-mode) .preview-line {
        background: linear-gradient(90deg, #38bdf8, #818cf8);
      }

      :host-context(.dark-mode) .operations-list {
        color: #cbd5f5;
      }
    `,
  ],
})
export class ConfigurationModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false
  @Input() canManagePorts = false

  @Output() close = new EventEmitter<void>()
  @Output() managePorts = new EventEmitter<void>()

  activeTab: "preferences" | "operations" = "preferences"
  themeConfig: ThemeConfig = {
    mode: "light",
    primaryColor: "#0a6cbc",
    accentColor: "#ff6e40",
    fontSize: "medium",
    animations: true,
    compactMode: false,
  }
  private readonly baseNotifications: NotificationPreferences = {
    channel: "push",
    emailNotifications: true,
    pushNotifications: true,
    routeAlerts: true,
    weatherAlerts: true,
    systemUpdates: true,
    marketingEmails: false,
    alertSound: true,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
    },
  }
  notifications: NotificationPreferences = { ...this.baseNotifications }
  notificationChannel: NotificationChannel = "push"

  constructor(
    private readonly configService: ConfigurationService,
    private readonly themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentSettings()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["isOpen"] && this.isOpen) {
      this.activeTab = "preferences"
      this.loadCurrentSettings()
    }

    if (changes["canManagePorts"] && !this.canManagePorts && this.activeTab === "operations") {
      this.activeTab = "preferences"
    }
  }

  updateTheme(): void {
    this.themeService.updateThemeConfig(this.themeConfig)
  }

  updateNotifications(): void {
    this.configService.updateNotificationPreferences({
      ...this.notifications,
      channel: this.notificationChannel,
    })
  }

  handleChannelChange(channel: NotificationChannel): void {
    this.notificationChannel = channel
    this.notifications.channel = channel
    this.updateNotifications()
  }

  closeModal(): void {
    this.close.emit()
  }

  openPortAdministration(): void {
    this.managePorts.emit()
  }

  private loadCurrentSettings(): void {
    const config = this.configService.getCurrentConfiguration()
    const quietHours = {
      ...this.baseNotifications.quietHours,
      ...(config.notifications?.quietHours ?? {}),
    }
    this.notifications = {
      ...this.baseNotifications,
      ...(config.notifications ?? {}),
      quietHours,
    }
    this.notificationChannel = this.notifications.channel ?? "push"
    this.themeConfig = { ...this.themeService.getCurrentThemeConfig() }
  }

  get modeTitle(): string {
    const mode = this.themeConfig.mode
    if (mode === "dark") return "Midnight Ops activo"
    if (mode === "light") return "Modo claro operativo"
    return "Modo automatico adaptable"
  }

  get modeDescription(): string {
    const mode = this.themeConfig.mode
    if (mode === "dark") {
      return "Prioriza la legibilidad nocturna reduciendo el brillo en salas de mando."
    }
    if (mode === "light") {
      return "Aprovecha fondos claros para operaciones diurnas y briefings rapidos."
    }
    return "Detecta tu preferencia del sistema y armoniza la interfaz segun la hora."
  }
}
