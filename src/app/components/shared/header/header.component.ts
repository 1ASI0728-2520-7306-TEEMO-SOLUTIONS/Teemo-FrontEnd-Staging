import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { AuthService } from "../../../services/auth.service"
import { ThemeService } from "../../../services/theme.service"
import { ConfigurationModalComponent } from "../configuration-modal/configuration-modal.component"
import { SurveyModalComponent } from "../survey-modal/survey-modal.component"
import { PortAdminModalComponent } from "../port-admin-modal/port-admin-modal.component"

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, RouterModule, ConfigurationModalComponent, SurveyModalComponent, PortAdminModalComponent],
  template: `
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <div class="title-row">
            <!-- Logo en data URI PNG (placeholder). Reemplazar por assets/logo.png si añades el archivo) -->
            <img src="assets/Teemo-hongo-logo.png" alt="Logo" class="header-logo" />
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>
          <div class="breadcrumbs" *ngIf="breadcrumbs && breadcrumbs.length > 0">
            <a [routerLink]="['/dashboard']" class="breadcrumb-item">Dashboard</a>
            <span class="breadcrumb-separator">/</span>
            <ng-container *ngFor="let crumb of breadcrumbs; let last = last; let i = index">
              <a
                  *ngIf="!last && crumb.link"
                  [routerLink]="[crumb.link]"
                  class="breadcrumb-item"
              >{{ crumb.label }}</a>
              <span
                  *ngIf="!last && !crumb.link"
                  class="breadcrumb-item"
              >{{ crumb.label }}</span>
              <span
                  *ngIf="last"
                  class="breadcrumb-item breadcrumb-active"
              >{{ crumb.label }}</span>
              <span *ngIf="!last" class="breadcrumb-separator">/</span>
            </ng-container>
          </div>
        </div>

        <div class="header-right">
          <ng-content></ng-content>

          <div class="header-actions">
            <!-- Notifications with Survey -->
            <div class="notifications-dropdown">
              <button class="action-btn" title="Notificaciones" (click)="toggleNotifications()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span class="notification-badge" *ngIf="getTotalNotifications() > 0">{{ getTotalNotifications() }}</span>
              </button>

              <!-- Notifications Dropdown -->
              <div class="notifications-panel" *ngIf="showNotifications" (click)="$event.stopPropagation()">
                <div class="notifications-header">
                  <h3>Notificaciones</h3>
                  <button class="close-notifications" (click)="closeNotifications()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div class="notifications-content">
                  <!-- Survey Notification -->
                  <div class="notification-item survey-notification" *ngIf="showSurveyNotification">
                    <div class="notification-icon survey-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10,9 9,9 8,9"></polyline>
                      </svg>
                    </div>
                    <div class="notification-content">
                      <h4>Encuesta de Mejoras</h4>
                      <p>Ayúdanos a mejorar la plataforma con tu feedback. Solo toma 2 minutos.</p>
                      <div class="notification-actions">
                        <button class="btn-survey" (click)="openSurvey()">Responder Encuesta</button>
                        <button class="btn-dismiss" (click)="dismissSurveyNotification()">Descartar</button>
                      </div>
                    </div>
                  </div>

                  <!-- Regular Notifications -->
                  <div class="notification-item" *ngFor="let notification of notifications">
                    <div class="notification-icon" [ngClass]="notification.type">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <div class="notification-content">
                      <h4>{{ notification.title }}</h4>
                      <p>{{ notification.message }}</p>
                      <span class="notification-time">{{ notification.time }}</span>
                    </div>
                  </div>

                  <!-- Empty state -->
                  <div class="empty-notifications" *ngIf="notifications.length === 0 && !showSurveyNotification">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <p>No hay notificaciones nuevas</p>
                  </div>
                </div>
              </div>
            </div>

            <button class="action-btn" title="Preferencias" (click)="openConfiguration()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
            </button>

            <button class="action-btn" title="Administrar puertos" (click)="openPortAdministration()" data-testid="open-port-admin">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            <div class="theme-toggle">
              <button class="theme-btn" (click)="toggleTheme()" [title]="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
                <svg *ngIf="!isDarkMode" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <svg *ngIf="isDarkMode" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </button>
            </div>

            <button class="logout-btn" (click)="logout()" title="Cerrar sesión">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Configuration Modal -->
    <app-configuration-modal
        [isOpen]="showConfigModal"
        (close)="closeConfiguration()">
    </app-configuration-modal>

    <!-- Survey Modal -->
    <app-survey-modal
        [isOpen]="showSurveyModal"
        (close)="closeSurvey()">
    </app-survey-modal>

    <app-port-admin-modal
        [isOpen]="showPortAdminModal"
        (close)="closePortAdministration()">
    </app-port-admin-modal>
  `,
  styles: [
    `
      /* Force header to maintain original colors regardless of theme */
      .header {
        background-color: var(--primary-color, #0a6cbc) !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        height: 70px;
        display: flex;
        align-items: center;
        padding: 0 1.5rem;
        position: fixed;
        top: 0;
        right: 0;
        left: 80px;
        z-index: 50;
        transition: left 250ms ease, background-color var(--animation-duration, 0.3s) ease;

        &.sidebar-expanded {
          left: 260px;
        }
      }

      .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }

      .header-left {
        display: flex;
        flex-direction: column;
      }

      .title-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .header-logo {
        width: 40px;
        height: 40px;
        object-fit: contain;
        display: block;
      }

      .page-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: white !important;
        margin: 0;
        transition: color var(--animation-duration, 0.3s) ease;
      }

      .breadcrumbs {
        display: flex;
        align-items: center;
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.7);
        margin-top: 0.25rem;
      }

      .breadcrumb-item {
        color: rgba(255, 255, 255, 0.7) !important;
        text-decoration: none;
        transition: color var(--animation-duration, 0.3s) ease;

        &:hover {
          color: white !important;
          text-decoration: underline;
        }

        &.breadcrumb-active {
          color: white !important;
          font-weight: 500;
        }
      }

      .breadcrumb-separator {
        margin: 0 0.25rem;
        color: rgba(255, 255, 255, 0.5) !important;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .action-btn, .logout-btn, .theme-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 9999px;
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
        border: none;
        cursor: pointer;
        transition: all var(--animation-duration, 0.3s) ease;
        position: relative;

        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }
      }

      .logout-btn {
        &:hover {
          background-color: rgba(239, 68, 68, 0.2);
          color: #fecaca;
        }
      }

      .notification-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        background-color: var(--accent-color, #ff6e40);
        color: white;
        font-size: 0.75rem;
        font-weight: 600;
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      }

      .theme-toggle {
        margin-left: 0.5rem;
      }

      /* Notifications Dropdown */
      .notifications-dropdown {
        position: relative;
      }

      .notifications-panel {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        width: 380px;
        max-height: 500px;
        background-color: white;
        border-radius: 0.75rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border: 1px solid #e2e8f0;
        z-index: 1000;
        animation: slideInDown 0.2s ease;
      }

      .notifications-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .notifications-header h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #0f172a;
      }

      .close-notifications {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: none;
        background: none;
        color: #6b7280;
        cursor: pointer;
        border-radius: 4px;
        transition: all 150ms ease;
      }

      .close-notifications:hover {
        background-color: #f3f4f6;
        color: #374151;
      }

      .notifications-content {
        max-height: 400px;
        overflow-y: auto;
      }

      .notification-item {
        display: flex;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #f1f5f9;
        transition: background-color 150ms ease;
      }

      .notification-item:hover {
        background-color: #f8fafc;
      }

      .notification-item:last-child {
        border-bottom: none;
      }

      .notification-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #e2e8f0;
        color: #64748b;
      }

      .notification-icon.survey-icon {
        background-color: #dbeafe;
        color: #2563eb;
      }

      .notification-content {
        flex: 1;
        min-width: 0;
      }

      .notification-content h4 {
        margin: 0 0 0.25rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #0f172a;
      }

      .notification-content p {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        color: #6b7280;
        line-height: 1.4;
      }

      .notification-time {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .notification-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }

      .btn-survey {
        background-color: #2563eb;
        color: white;
        border: none;
        border-radius: 0.375rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 150ms ease;
      }

      .btn-survey:hover {
        background-color: #1d4ed8;
      }

      .btn-dismiss {
        background-color: transparent;
        color: #6b7280;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms ease;
      }

      .btn-dismiss:hover {
        background-color: #f9fafb;
        border-color: #9ca3af;
      }

      .survey-notification {
        background-color: #f0f9ff;
        border-left: 4px solid #2563eb;
      }

      .empty-notifications {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1.5rem;
        text-align: center;
        color: #9ca3af;
      }

      .empty-notifications svg {
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .empty-notifications p {
        margin: 0;
        font-size: 0.875rem;
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
      }

      @keyframes slideInDown {
        from {
          transform: translateY(-10px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* Dark mode styles */
      :host-context(.dark-mode) .notifications-panel {
        background-color: #1e293b;
        border-color: #334155;
      }

      :host-context(.dark-mode) .notifications-header {
        border-bottom-color: #334155;
      }

      :host-context(.dark-mode) .notifications-header h3 {
        color: #f1f5f9;
      }

      :host-context(.dark-mode) .notification-item {
        border-bottom-color: #334155;
      }

      :host-context(.dark-mode) .notification-item:hover {
        background-color: #334155;
      }

      :host-context(.dark-mode) .notification-content h4 {
        color: #f1f5f9;
      }

      :host-context(.dark-mode) .notification-content p {
        color: #cbd5e1;
      }

      :host-context(.dark-mode) .survey-notification {
        background-color: #1e3a8a;
      }

      /* Compact mode styles */
      :host-context(.compact-mode) .header {
        height: 60px;
        padding: 0 1rem;
      }

      :host-context(.compact-mode) .page-title {
        font-size: 1.25rem;
      }

      :host-context(.compact-mode) .action-btn,
      :host-context(.compact-mode) .logout-btn,
      :host-context(.compact-mode) .theme-btn {
        width: 36px;
        height: 36px;
      }

      /* Animation disabled */
      :host-context(.no-animations) * {
        transition: none !important;
        animation: none !important;
      }

      /* Mobile responsiveness */
      @media (max-width: 640px) {
        .notifications-panel {
          width: 320px;
          right: -1rem;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  @Input() pageTitle = "Teemo Solutions"
  @Input() breadcrumbs: { label: string; link?: string }[] = []
  @Input() sidebarCollapsed = false
  @Input() notificationCount = 0

  @Output() themeToggled = new EventEmitter<boolean>()

  isDarkMode = false
  showConfigModal = false
  showSurveyModal = false
  showNotifications = false
  showSurveyNotification = true
  showPortAdminModal = false

  notifications = [
    {
      title: "Actualización del Sistema",
      message: "Nueva versión disponible con mejoras de rendimiento.",
      time: "Hace 2 horas",
      type: "info",
    },
    {
      title: "Ruta Completada",
      message: "El viaje de Callao a Valparaíso se completó exitosamente.",
      time: "Hace 4 horas",
      type: "success",
    },
  ]

  constructor(
      private authService: AuthService,
      private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.isDarkMode$.subscribe((isDark) => {
      this.isDarkMode = isDark
    })

    // Check if survey was already completed
    const surveyCompleted = localStorage.getItem("survey_completed")
    if (surveyCompleted) {
      this.showSurveyNotification = false
    }

    // Close notifications when clicking outside
    document.addEventListener("click", (event) => {
      if (this.showNotifications) {
        const target = event.target as HTMLElement
        if (!target.closest(".notifications-dropdown")) {
          this.showNotifications = false
        }
      }
    })
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode()
    this.themeToggled.emit(this.isDarkMode)
  }

  openConfiguration(): void {
    this.showConfigModal = true
  }

  closeConfiguration(): void {
    this.showConfigModal = false
  }

  openPortAdministration(): void {
    this.showPortAdminModal = true
  }

  closePortAdministration(): void {
    this.showPortAdminModal = false
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications
  }

  closeNotifications(): void {
    this.showNotifications = false
  }

  openSurvey(): void {
    this.showSurveyModal = true
    this.showNotifications = false
  }

  closeSurvey(): void {
    this.showSurveyModal = false
    // Hide survey notification after user interacts with it
    this.showSurveyNotification = false
  }

  dismissSurveyNotification(): void {
    this.showSurveyNotification = false
    // Store dismissal to avoid showing again for a while
    localStorage.setItem("survey_dismissed", new Date().toISOString())
  }

  getTotalNotifications(): number {
    let count = this.notifications.length
    if (this.showSurveyNotification) {
      count += 1
    }
    return count
  }

  logout(): void {
    this.authService.logout()
  }
}
