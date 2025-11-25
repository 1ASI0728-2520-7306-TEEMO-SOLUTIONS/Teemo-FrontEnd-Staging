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
              <div class="card-header">
                <div>
                  <p class="eyebrow">Tema</p>
                  <h3>Personaliza la apariencia</h3>
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
                    <label class="radio-option">
                      <input type="radio" name="themeMode" value="auto" [(ngModel)]="themeConfig.mode" (change)="updateTheme()">
                      <span>Automatico</span>
                    </label>
                  </div>
                </div>

                <div class="setting-columns">
                  <label class="label">
                    Color primario
                    <input type="color" [(ngModel)]="themeConfig.primaryColor" (change)="updateTheme()">
                  </label>
                  <label class="label">
                    Color de acento
                    <input type="color" [(ngModel)]="themeConfig.accentColor" (change)="updateTheme()">
                  </label>
                </div>

                <div class="setting-group">
                  <label class="label">Tamano de fuente</label>
                  <select [(ngModel)]="themeConfig.fontSize" (change)="updateTheme()">
                    <option value="small">Pequeno</option>
                    <option value="medium">Mediano</option>
                    <option value="large">Grande</option>
                  </select>
                </div>

                <div class="switch-grid">
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="themeConfig.animations" (change)="updateTheme()">
                    <span>Animaciones</span>
                  </label>
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="themeConfig.compactMode" (change)="updateTheme()">
                    <span>Modo compacto</span>
                  </label>
                </div>
              </div>
            </article>

            <article class="card">
              <div class="card-header">
                <div>
                  <p class="eyebrow">Alertas</p>
                  <h3>Notificaciones y avisos</h3>
                </div>
              </div>

              <div class="card-body">
                <div class="setting-group">
                  <label class="label">Canal preferido</label>
                  <div class="radio-group">
                    <label class="radio-option">
                      <input
                        type="radio"
                        name="channel"
                        value="push"
                        [checked]="notificationChannel === 'push'"
                        (change)="handleChannelChange('push')">
                      <span>Push</span>
                    </label>
                    <label class="radio-option">
                      <input
                        type="radio"
                        name="channel"
                        value="email"
                        [checked]="notificationChannel === 'email'"
                        (change)="handleChannelChange('email')">
                      <span>Email</span>
                    </label>
                    <label class="radio-option">
                      <input
                        type="radio"
                        name="channel"
                        value="both"
                        [checked]="notificationChannel === 'both'"
                        (change)="handleChannelChange('both')">
                      <span>Ambos</span>
                    </label>
                  </div>
                </div>

                <div class="switch-grid">
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="notifications.emailNotifications" (change)="updateNotifications()">
                    <span>Emails operativos</span>
                  </label>
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="notifications.pushNotifications" (change)="updateNotifications()">
                    <span>Push del navegador</span>
                  </label>
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="notifications.routeAlerts" (change)="updateNotifications()">
                    <span>Alertas de ruta</span>
                  </label>
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="notifications.weatherAlerts" (change)="updateNotifications()">
                    <span>Alertas meteorologicas</span>
                  </label>
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="notifications.systemUpdates" (change)="updateNotifications()">
                    <span>Actualizaciones del sistema</span>
                  </label>
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="notifications.marketingEmails" (change)="updateNotifications()">
                    <span>Boletines comerciales</span>
                  </label>
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="notifications.alertSound" (change)="updateNotifications()">
                    <span>Sonidos de alerta</span>
                  </label>
                </div>

                <div class="quiet-hours">
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="notifications.quietHours.enabled" (change)="updateNotifications()">
                    <span>Silenciar por horario</span>
                  </label>
                  <div class="quiet-hours-range" *ngIf="notifications.quietHours.enabled">
                    <label class="label">
                      Desde
                      <input type="time" [(ngModel)]="notifications.quietHours.start" (change)="updateNotifications()">
                    </label>
                    <label class="label">
                      Hasta
                      <input type="time" [(ngModel)]="notifications.quietHours.end" (change)="updateNotifications()">
                    </label>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="tab-content" *ngIf="activeTab === 'operations'">
          <article class="card operations-card">
            <div class="card-header">
              <div>
                <p class="eyebrow">Operaciones</p>
                <h3>Administracion de puertos</h3>
                <p class="description">
                  Deshabilita o reactiva puertos para los usuarios cuando existan cierres o interrupciones.
                </p>
              </div>
            </div>

            <div class="card-body operations-body">
              <ul>
                <li>Visualiza el estado global de puertos habilitados.</li>
                <li>Bloquea temporalmente destinos para rutas nuevas.</li>
                <li>Coordina con operadores regionales los cambios en tiempo real.</li>
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
        background: #fff;
        border-radius: 1.25rem;
        box-shadow: 0 30px 60px rgba(15, 23, 42, 0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .modal-header {
        padding: 1.5rem 2rem 1rem;
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.75rem;
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
        gap: 0.5rem;
        padding: 0 2rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .tab-btn {
        border: none;
        background: transparent;
        color: #64748b;
        font-weight: 500;
        padding: 0.85rem 1rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        transition: color 0.2s, border-color 0.2s;
      }

      .tab-btn.active {
        color: #0a6cbc;
        border-bottom-color: #0a6cbc;
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
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
      }

      .card-header {
        padding: 1.25rem 1.25rem 0;
      }

      .card-body {
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

      .radio-option,
      .checkbox-option {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.95rem;
        color: #475569;
      }

      .switch-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
      }

      .setting-columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
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

      .operations-body ul {
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

      .eyebrow {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #64748b;
        margin: 0 0 0.25rem;
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
        background: #0f172a;
        color: #e2e8f0;
      }

      :host-context(.dark-mode) .card {
        background: rgba(15, 23, 42, 0.7);
        border-color: rgba(148, 163, 184, 0.25);
      }

      :host-context(.dark-mode) .description,
      :host-context(.dark-mode) .radio-option,
      :host-context(.dark-mode) .checkbox-option {
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
}
