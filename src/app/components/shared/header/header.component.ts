import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { AuthService } from "../../../services/auth.service"
import { ThemeService } from "../../../services/theme.service"
import { NotificationService, type NotificationResource } from "../../../services/notification.service"
import { SurveyModalComponent } from "../survey-modal/survey-modal.component"
import { PortAdminModalComponent } from "../port-admin-modal/port-admin-modal.component"
import { ConfigurationModalComponent } from "../configuration-modal/configuration-modal.component"

type HeaderNotification = NotificationResource

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, RouterModule, ConfigurationModalComponent, SurveyModalComponent, PortAdminModalComponent],
  template: `
    <header class="header">
      <div class="header-ambient" aria-hidden="true">
        <span class="ambient-gradient"></span>
        <span class="ambient-orb orb-left"></span>
        <span class="ambient-orb orb-right"></span>
        <span class="ambient-grid"></span>
      </div>
      <div class="header-lightbar" aria-hidden="true"></div>

      <div class="header-content">
        <div class="header-left">
          <div class="title-row">
            <div class="title-stack">
              <div class="title-main">
                <!-- Logo en data URI PNG (placeholder). Reemplazar por assets/logo.png si anades el archivo) -->
                <img src="assets/Teemo-hongo-logo.png" alt="Logo" class="header-logo" />
                <div class="title-text">
                  <h1 class="page-title">{{ pageTitle }}</h1>
                  <p class="page-subtitle">{{ subtitleText }}</p>
                </div>
              </div>
            </div>

            <div class="header-pulse" aria-hidden="true">
              <span class="pulse-dot"></span>
              <span class="pulse-line"></span>
            </div>
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
          <div class="header-right-actions">
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
                  <div>
                    <h3>Notificaciones</h3>
                    <p class="notifications-subtitle">
                      {{ unreadNotifications > 0 ? unreadNotifications + " pendientes" : "Todo al dia" }}
                    </p>
                  </div>
                  <div class="notifications-header-actions">
                    <button
                      class="mark-all-btn"
                      type="button"
                      (click)="markAllNotificationsAsRead()"
                      [disabled]="unreadNotifications === 0 || markAllInProgress"
                    >
                      {{ markAllInProgress ? "Marcando..." : "Marcar todas" }}
                    </button>
                    <button class="close-notifications" (click)="closeNotifications()" type="button" aria-label="Cerrar notificaciones">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="notifications-content">
                  <div class="notifications-status" *ngIf="notificationsLoading && notifications.length === 0">
                    Cargando notificaciones...
                  </div>

                  <div class="notifications-status error" *ngIf="notificationsError">
                    {{ notificationsError }}
                    <button type="button" (click)="loadNotifications(true)" [disabled]="notificationsLoading">Reintentar</button>
                  </div>

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
                      <p>Ayudanos a mejorar la plataforma con tu feedback. Solo toma 2 minutos.</p>
                      <div class="notification-actions">
                        <button class="btn-survey" (click)="openSurvey()">Responder Encuesta</button>
                        <button class="btn-dismiss" (click)="dismissSurveyNotification()">Descartar</button>
                      </div>
                    </div>
                  </div>

                  <!-- Backend Notifications -->
                  <ng-container *ngIf="notifications.length > 0">
                    <div
                      class="notification-item"
                      *ngFor="let notification of notifications; trackBy: trackNotificationById"
                      [class.unread]="!notification.read"
                      [class.notification-disabled]="notification.action === 'DISABLED'"
                      [class.notification-enabled]="notification.action === 'ENABLED'"
                      (click)="handleNotificationClick(notification)"
                    >
                      <div class="notification-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      </div>
                      <div class="notification-content">
                        <div class="notification-content-header">
                          <div>
                            <h4>{{ notification.title }}</h4>
                            <p class="notification-meta" *ngIf="notification.portName || notification.performedBy">
                              <ng-container *ngIf="notification.portName">Puerto {{ notification.portName }}</ng-container>
                              <ng-container *ngIf="notification.portName && notification.performedBy">
                                <span class="notification-meta-separator" aria-hidden="true">&bull;</span>
                              </ng-container>
                              <ng-container *ngIf="notification.performedBy">Por {{ notification.performedBy }}</ng-container>
                            </p>
                          </div>
                          <span class="notification-action-pill" *ngIf="notification.action">
                            {{ notification.action === "DISABLED" ? "Deshabilitado" : notification.action === "ENABLED" ? "Habilitado" : notification.action }}
                          </span>
                        </div>
                        <p>{{ notification.message }}</p>
                        <div class="notification-footer">
                          <span class="notification-time">{{ formatRelativeTime(notification.createdAt) }}</span>
                          <button
                            class="mark-read-btn"
                            type="button"
                            (click)="markNotificationAsRead(notification); $event.stopPropagation()"
                            *ngIf="!notification.read"
                          >
                            Marcar como leida
                          </button>
                        </div>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Empty state -->
                  <div
                    class="empty-notifications"
                    *ngIf="!notificationsLoading && notifications.length === 0 && !showSurveyNotification && !notificationsError"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <p>No hay notificaciones nuevas</p>
                  </div>
                </div>

                <div class="notifications-footer" *ngIf="notifications.length > 0">
                  <button
                    class="load-more-btn"
                    type="button"
                    (click)="loadNotifications()"
                    [disabled]="notificationsLoading || !notificationsHasNext"
                  >
                    {{ notificationsHasNext ? (notificationsLoading ? "Cargando..." : "Ver mas") : "Sin mas registros" }}
                  </button>
                </div>
              </div>
            </div>

            <button class="action-btn" title="Preferencias y ajustes" (click)="openConfiguration()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            <button class="logout-btn" (click)="logout()" title="Cerrar sesion">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
            </div>

          </div>
        </div>
      </div>
    </header>

    <ng-container>
      <app-configuration-modal
          [isOpen]="showConfigModal"
          [canManagePorts]="canManagePorts"
          (close)="closeConfiguration()"
          (managePorts)="handleManagePorts()">
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
    </ng-container>
  `,
  styles: [
    `
      /* Force header to maintain original colors regardless of theme */
      .header {
        background: radial-gradient(circle at 10% -20%, rgba(59, 130, 246, 0.65), rgba(15, 23, 42, 0.9)) #031028;
        box-shadow: 0 12px 24px rgba(2, 6, 23, 0.45);
        border-bottom: 1px solid rgba(59, 130, 246, 0.3);
        min-height: 70px;
        display: flex;
        align-items: stretch;
        padding: 0 1.5rem;
        position: fixed;
        top: 0;
        right: 0;
        left: 80px;
        z-index: 50;
        overflow: visible; /* allow dropdown layers (notifications, menus) to escape the header bounds */
        transition: left 250ms ease, background 300ms ease;

        &.sidebar-expanded {
          left: 260px;
        }
      }

      .header-ambient {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .ambient-gradient {
        position: absolute;
        inset: -40% -20%;
        background: linear-gradient(120deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.1), rgba(99, 102, 241, 0.4));
        filter: blur(60px);
        opacity: 0.8;
        animation: gradientFloat 8s ease-in-out infinite alternate;
      }

      .ambient-orb {
        position: absolute;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        filter: blur(40px);
        opacity: 0.5;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.45), transparent 65%);
      }

      .ambient-orb.orb-left {
        left: -60px;
        top: -40px;
      }

      .ambient-orb.orb-right {
        right: -80px;
        bottom: -120px;
        background: radial-gradient(circle, rgba(248, 113, 113, 0.4), transparent 65%);
      }

      .ambient-grid {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        background-size: 120px 120px;
        opacity: 0.35;
        transform: skewY(-8deg);
        animation: gridDrift 18s linear infinite;
      }

      .header-lightbar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.8), transparent);
        opacity: 0.8;
      }

      .header-content {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 1.5rem;
      }

      .header-left {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
      }

      .title-stack {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .title-main {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .title-text {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      .header-logo {
        width: 44px;
        height: 44px;
        object-fit: contain;
        display: block;
        filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.35));
      }

      .page-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: white !important;
        margin: 0;
        letter-spacing: -0.02em;
        text-shadow: 0 6px 14px rgba(3, 7, 18, 0.4);
      }

      .page-subtitle {
        margin: 0;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.78);
        font-weight: 400;
        max-width: 460px;
      }

      .header-pulse {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding-left: 1rem;
        border-left: 1px solid rgba(255, 255, 255, 0.15);
      }

      .pulse-dot {
        width: 10px;
        height: 10px;
        border-radius: 9999px;
        background: #34d399;
        box-shadow: 0 0 12px rgba(52, 211, 153, 0.8);
        animation: pulse 2s infinite;
      }

      .pulse-line {
        width: 80px;
        height: 2px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(96, 165, 250, 0.9));
        border-radius: 9999px;
        animation: shimmer 3s linear infinite;
      }

      .breadcrumbs {
        display: flex;
        align-items: center;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.65);
      }

      .breadcrumb-item {
        color: rgba(255, 255, 255, 0.75) !important;
        text-decoration: none;
        transition: color 200ms ease;

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
        color: rgba(255, 255, 255, 0.45) !important;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .header-right-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .action-btn, .logout-btn {
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

      .notifications-subtitle {
        margin: 0;
        font-size: 0.85rem;
        color: #64748b;
      }

      .notifications-header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .mark-all-btn {
        border: 1px solid #cbd5f5;
        background: rgba(59, 130, 246, 0.08);
        color: #1d4ed8;
        border-radius: 9999px;
        padding: 0.35rem 0.9rem;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 150ms ease;
      }

      .mark-all-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .notifications-status {
        padding: 0.75rem 1.5rem;
        font-size: 0.85rem;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .notifications-status.error {
        color: #dc2626;
        background: rgba(248, 113, 113, 0.12);
      }

      .notifications-status button {
        border: none;
        background: none;
        color: #2563eb;
        font-weight: 600;
        cursor: pointer;
      }

      .notifications-status button[disabled] {
        color: #94a3b8;
        cursor: not-allowed;
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

      .notification-item.unread {
        background-color: rgba(79, 70, 229, 0.05);
      }

      .notification-item.notification-disabled {
        border-left: 4px solid rgba(248, 113, 113, 0.6);
      }

      .notification-item.notification-enabled {
        border-left: 4px solid rgba(34, 197, 94, 0.6);
      }
      .notification-item.notification-disabled .notification-action-pill {
        background-color: rgba(248, 113, 113, 0.15);
        color: #b91c1c;
      }

      .notification-item.notification-enabled .notification-action-pill {
        background-color: rgba(34, 197, 94, 0.2);
        color: #15803d;
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

      .notification-content-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
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

      .notification-meta {
        margin: 0;
        font-size: 0.75rem;
        color: #94a3b8;
      }

      .notification-meta-separator {
        display: inline-block;
        margin: 0 0.35rem;
        color: inherit;
      }

      .notification-time {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .notification-action-pill {
        border-radius: 9999px;
        padding: 0.15rem 0.5rem;
        font-size: 0.7rem;
        font-weight: 600;
        background-color: #e2e8f0;
        color: #0f172a;
        white-space: nowrap;
      }

      .notification-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .mark-read-btn {
        border: none;
        background: none;
        color: #2563eb;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
      }

      .mark-read-btn:hover {
        text-decoration: underline;
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

      .notifications-footer {
        border-top: 1px solid #e2e8f0;
        padding: 0.75rem 1.5rem;
      }

      .load-more-btn {
        width: 100%;
        border: 1px solid #cbd5f5;
        background: white;
        color: #2563eb;
        font-weight: 600;
        border-radius: 9999px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: all 150ms ease;
      }

      .load-more-btn:disabled {
        cursor: not-allowed;
        color: #94a3b8;
        border-color: #e2e8f0;
      }

      @keyframes shimmer {
        0% { transform: scaleX(0); opacity: 0.4; }
        50% { transform: scaleX(1); opacity: 1; }
        100% { transform: scaleX(0); opacity: 0.4; }
      }

      @keyframes gradientFloat {
        0% { transform: translateY(0); }
        100% { transform: translateY(20px); }
      }

      @keyframes gridDrift {
        0% { transform: skewY(-8deg) translateX(0); }
        100% { transform: skewY(-8deg) translateX(-80px); }
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

      :host-context(.dark-mode) .notifications-subtitle {
        color: #94a3b8;
      }

      :host-context(.dark-mode) .mark-all-btn {
        background: rgba(79, 70, 229, 0.2);
        border-color: rgba(129, 140, 248, 0.45);
        color: #c7d2fe;
      }

      :host-context(.dark-mode) .notifications-status {
        color: #cbd5f5;
        background: rgba(15, 23, 42, 0.7);
      }

      :host-context(.dark-mode) .notifications-status.error {
        background: rgba(239, 68, 68, 0.15);
      }

      :host-context(.dark-mode) .notifications-status button {
        color: #93c5fd;
      }

      :host-context(.dark-mode) .notification-item {
        border-bottom-color: #334155;
      }

      :host-context(.dark-mode) .notification-item:hover {
        background-color: #334155;
      }

      :host-context(.dark-mode) .notification-item.unread {
        background-color: rgba(79, 70, 229, 0.3);
      }

      :host-context(.dark-mode) .notification-action-pill {
        background-color: rgba(148, 163, 184, 0.35);
        color: #f8fafc;
      }

      :host-context(.dark-mode) .mark-read-btn {
        color: #93c5fd;
      }

      :host-context(.dark-mode) .notifications-footer {
        border-top-color: #334155;
      }

      :host-context(.dark-mode) .load-more-btn {
        background: rgba(30, 41, 59, 0.9);
        border-color: rgba(148, 163, 184, 0.35);
        color: #bfdbfe;
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
        min-height: 60px;
        padding: 0 1rem;
      }

      :host-context(.compact-mode) .page-title {
        font-size: 1.25rem;
      }

      :host-context(.compact-mode) .page-subtitle,
      :host-context(.compact-mode) .header-pulse {
        display: none;
      }

      :host-context(.compact-mode) .action-btn,
      :host-context(.compact-mode) .logout-btn {
        width: 36px;
        height: 36px;
      }

      /* Animation disabled */
      :host-context(.no-animations) * {
        transition: none !important;
        animation: none !important;
      }

      @media (max-width: 768px) {
        .page-subtitle {
          display: none;
        }

        .header-right {
          justify-content: flex-start;
        }
      }

      /* Mobile responsiveness */
      @media (max-width: 640px) {
        .notifications-panel {
          width: 320px;
          right: -1rem;
        }
      }

      :host-context(.dark-mode) .header {
        background: radial-gradient(circle at -5% 0%, rgba(14, 165, 233, 0.5), rgba(2, 6, 23, 0.95));
        border-color: rgba(148, 163, 184, 0.35);
        color: #e2e8f0;
      }

      :host-context(.dark-mode) .ambient-grid {
        opacity: 0.55;
      }

      :host-context(.dark-mode) .page-title,
      :host-context(.dark-mode) .page-subtitle,
      :host-context(.dark-mode) .breadcrumb-item,
      :host-context(.dark-mode) .breadcrumb-separator {
        color: #f8fafc;
      }

      :host-context(.dark-mode) .header-logo {
        filter: drop-shadow(0 2px 6px rgba(15, 118, 198, 0.5));
      }

      :host-context(.dark-mode) .notification-badge {
        background: #f97316;
        color: #020617;
      }


      :host-context(.dark-mode) .action-btn,
      :host-context(.dark-mode) .logout-btn {
        background: rgba(14, 165, 233, 0.12);
        border: 1px solid rgba(125, 211, 252, 0.35);
        color: #f8fafc;
      }

      :host-context(.dark-mode) .notifications-panel {
        background: rgba(15, 23, 42, 0.96);
        border-color: rgba(148, 163, 184, 0.2);
        color: #e2e8f0;
        box-shadow: 0 20px 45px rgba(2, 6, 23, 0.7);
      }

      :host-context(.dark-mode) .notification-item + .notification-item {
        border-color: rgba(148, 163, 184, 0.25);
      }

      :host-context(.dark-mode) .btn-survey {
        background: #0ea5e9;
        color: #020617;
      }

      :host-context(.dark-mode) .btn-dismiss {
        color: #f8fafc;
        border-color: rgba(148, 163, 184, 0.25);
      }
    `,
  ],
})
export class HeaderComponent {
  @Input() pageTitle = "Teemo Solutions"
  @Input() subtitle?: string
  @Input() breadcrumbs: { label: string; link?: string }[] = []
  @Input() sidebarCollapsed = false
  @Input() notificationCount = 0

  @Output() themeToggled = new EventEmitter<boolean>()

  isDarkMode = false
  showSurveyModal = false
  showNotifications = false
  showSurveyNotification = true
  showPortAdminModal = false
  showConfigModal = false

  notifications: HeaderNotification[] = []
  unreadNotifications = 0
  notificationsLoading = false
  notificationsError: string | null = null
  notificationsHasNext = true
  markAllInProgress = false

  private notificationsPage = 0
  private readonly notificationsLimit = 10
  private notificationsRequested = false
  private lastNotificationsRefresh = 0
  private readonly notificationsRefreshIntervalMs = 30000
  private readonly fallbackNotifications: HeaderNotification[] = [
    {
      id: "fallback-1",
      type: "PORT_STATUS_CHANGE",
      title: "Puerto Callao deshabilitado",
      message: "El puerto Callao quedo inoperativo por mantenimiento programado.",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: true,
      action: "DISABLED",
      portName: "Callao",
    },
    {
      id: "fallback-2",
      type: "PORT_STATUS_CHANGE",
      title: "Puerto Valparaiso habilitado",
      message: "El puerto Valparaiso volvio a operaciones normales.",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      read: true,
      action: "ENABLED",
      portName: "Valparaiso",
    },
  ]
  private readonly notificationOrder: "asc" | "desc" = "desc"

  get canManagePorts(): boolean {
    return this.userHasRole("ROLE_OPERATOR") || this.userHasRole("ROLE_ADMIN")
  }

  constructor(
      private authService: AuthService,
      private themeService: ThemeService,
      private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.isDarkMode$.subscribe((isDark) => {
      this.isDarkMode = isDark
    })

    this.requestInitialNotifications()

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

  openConfiguration(): void {
    this.showConfigModal = true
  }

  closeConfiguration(): void {
    this.showConfigModal = false
  }

  handleManagePorts(): void {
    this.closeConfiguration()
    this.openPortAdministration()
  }

  openPortAdministration(): void {
    this.showPortAdminModal = true
  }

  closePortAdministration(): void {
    this.showPortAdminModal = false
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications

    if (this.showNotifications) {
      if (!this.notificationsRequested) {
        this.requestInitialNotifications()
      } else if (!this.notificationsLoading) {
        this.refreshNotificationsIfNeeded()
      }
    }
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

  loadNotifications(reset = false): void {
    if (this.notificationsLoading) {
      return
    }

    if (reset) {
      this.notificationsPage = 0
      this.notificationsHasNext = true
      this.notifications = []
    } else if (!this.notificationsHasNext) {
      return
    }

    const pageToRequest = this.notificationsPage
    this.notificationsRequested = true
    this.notificationsLoading = true
    this.notificationsError = null

    this.notificationService
      .getNotifications({ page: pageToRequest, limit: this.notificationsLimit, order: this.notificationOrder })
      .subscribe({
        next: (response) => {
          const normalized = (response.items ?? []).map((item) => this.mapNotificationResource(item))
          this.notifications = reset ? normalized : [...this.notifications, ...normalized]

          let hasNext: boolean
          if (typeof response.hasNext === "boolean") {
            hasNext = response.hasNext
          } else if (typeof response.totalPages === "number") {
            hasNext = pageToRequest + 1 < response.totalPages
          } else {
            hasNext = normalized.length === this.notificationsLimit
          }

          this.notificationsHasNext = hasNext
          this.notificationsPage = pageToRequest + 1
          if (reset) {
            this.lastNotificationsRefresh = Date.now()
          }

          if (this.notifications.length === 0 && this.fallbackNotifications.length > 0) {
            this.notifications = [...this.fallbackNotifications]
            this.notificationsHasNext = false
          }

          this.notificationsLoading = false
          this.updateUnreadCount()
        },
        error: (error) => {
          this.notificationsLoading = false
          this.notificationsError = error?.message || "No se pudieron cargar las notificaciones."

          if (this.notifications.length === 0) {
            this.notifications = [...this.fallbackNotifications]
          }

          this.notificationsHasNext = false
          this.updateUnreadCount()
        },
      })
  }

  handleNotificationClick(notification: HeaderNotification): void {
    if (!notification || notification.read) {
      return
    }
    this.markNotificationAsRead(notification)
  }

  markNotificationAsRead(notification: HeaderNotification): void {
    if (!notification || notification.read) {
      return
    }

    if (this.isFallbackNotification(notification)) {
      notification.read = true
      this.updateUnreadCount()
      return
    }

    notification.read = true
    this.updateUnreadCount()

    this.notificationService.markAsRead(notification.id).subscribe({
      error: (error) => {
        this.notificationsError = error?.message || "No se pudo actualizar la notificacion."
        notification.read = false
        this.updateUnreadCount()
      },
    })
  }

  markAllNotificationsAsRead(): void {
    const pendingIds = this.notifications
      .filter((notification) => !notification.read && !this.isFallbackNotification(notification))
      .map((notification) => notification.id)

    if (pendingIds.length === 0) {
      this.notifications.forEach((notification) => {
        if (this.isFallbackNotification(notification)) {
          notification.read = true
        }
      })
      this.updateUnreadCount()
      return
    }

    const affectedIds = new Set(pendingIds)
    this.notifications.forEach((notification) => {
      if (affectedIds.has(notification.id)) {
        notification.read = true
      }
    })
    this.updateUnreadCount()

    this.markAllInProgress = true
    this.notificationService.markManyAsRead(pendingIds).subscribe({
      next: () => {
        this.markAllInProgress = false
        this.updateUnreadCount()
      },
      error: (error) => {
        this.notificationsError = error?.message || "No se pudieron marcar las notificaciones."
        this.notifications.forEach((notification) => {
          if (affectedIds.has(notification.id)) {
            notification.read = false
          }
        })
        this.markAllInProgress = false
        this.updateUnreadCount()
      },
    })
  }

  trackNotificationById(index: number, notification: HeaderNotification): string {
    return notification?.id ?? `notification-${index}`
  }

  formatRelativeTime(dateIso?: string | null): string {
    if (!dateIso) {
      return "Hace instantes"
    }

    const date = new Date(dateIso)
    if (Number.isNaN(date.getTime())) {
      return "Hace instantes"
    }

    const diff = Date.now() - date.getTime()
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diff < minute) {
      return "Hace instantes"
    }

    if (diff < hour) {
      const minutes = Math.round(diff / minute)
      return `Hace ${minutes} min${minutes === 1 ? "" : "s"}`
    }

    if (diff < day) {
      const hours = Math.round(diff / hour)
      return `Hace ${hours} h`
    }

    const days = Math.round(diff / day)
    return `Hace ${days} d`
  }

  private requestInitialNotifications(): void {
    if (this.notificationsRequested) {
      return
    }

    this.notificationsRequested = true
    this.loadNotifications(true)
  }

  private refreshNotificationsIfNeeded(force = false): void {
    if (force || Date.now() - this.lastNotificationsRefresh > this.notificationsRefreshIntervalMs) {
      this.loadNotifications(true)
    }
  }

  private updateUnreadCount(): void {
    this.unreadNotifications = this.notifications.filter((notification) => !notification.read && !this.isFallbackNotification(notification)).length
  }

  private mapNotificationResource(resource: NotificationResource): HeaderNotification {
    const fallbackTitle = "Actualizacion del sistema"
    const fallbackMessage = "Consulta los detalles completos en el panel de operaciones."
    const normalizedTitle =
      typeof resource.title === "string" && resource.title.trim().length > 0 ? resource.title.trim() : fallbackTitle
    const normalizedMessage =
      typeof resource.message === "string" && resource.message.trim().length > 0 ? resource.message.trim() : fallbackMessage
    const normalizedId = resource.id && resource.id.length > 0 ? resource.id : `notification-${Date.now()}-${Math.random()}`

    return {
      ...resource,
      id: normalizedId,
      title: normalizedTitle,
      message: normalizedMessage,
      createdAt: resource.createdAt ?? new Date().toISOString(),
      read: Boolean(resource.read),
    }
  }

  private isFallbackNotification(notification: HeaderNotification): boolean {
    return notification?.id?.startsWith("fallback-") ?? false
  }

  getTotalNotifications(): number {
    let count = this.unreadNotifications
    if (this.showSurveyNotification) {
      count += 1
    }
    return count
  }

  logout(): void {
    this.authService.logout()
  }

  private userHasRole(role: string): boolean {
    const normalized = role.toUpperCase()
    const user = this.authService.currentUserValue
    const roles = [
      ...(user?.roles ?? []),
      user?.role ?? "",
    ]
      .filter(Boolean)
      .map((r) => r.toUpperCase())
    return roles.includes(normalized)
  }

  get subtitleText(): string {
    return this.subtitle?.trim() || "Orquestando rutas inteligentes y logistica avanzada"
  }
}


