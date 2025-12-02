import { Component, Input, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { NavigationEnd, Router, RouterModule } from "@angular/router"
import { filter } from "rxjs"

interface SidebarUser {
  id?: string
  name: string
  role: string
  username?: string
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside *ngIf="isVisible" class="sidebar" [class.sidebar-collapsed]="collapsed">
      <div class="sidebar-header">
        <div class="logo-container">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
            <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7H2v5z"></path>
            <path d="M6 7V5c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span class="logo-text" *ngIf="!collapsed">Teemo</span>
        </div>
        <button class="collapse-btn" (click)="toggleCollapse()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path *ngIf="collapsed" d="M13 17l5-5-5-5"></path>
            <path *ngIf="!collapsed" d="M11 17l-5-5 5-5"></path>
          </svg>
        </button>
      </div>

      <div class="sidebar-content">
        <nav class="sidebar-nav">
          <a
            [routerLink]="['/dashboard']"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{exact: true}"
            class="nav-item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-icon">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span class="nav-text" *ngIf="!collapsed">Dashboard</span>
          </a>

          <a
            [routerLink]="['/shipment-reports']"
            routerLinkActive="active"
            class="nav-item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span class="nav-text" *ngIf="!collapsed">Informes de Envíos</span>
          </a>

          <a
            [routerLink]="['/route-history']"
            routerLinkActive="active"
            class="nav-item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-icon">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <span class="nav-text" *ngIf="!collapsed">Historial de Rutas</span>
          </a>

          <a
            [routerLink]="['/nearby-ports']"
            routerLinkActive="active"
            class="nav-item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            <span class="nav-text" *ngIf="!collapsed">Puertos Cercanos</span>
          </a>
        </nav>
      </div>

      <div class="sidebar-footer">
        <button
          class="user-trigger"
          type="button"
          *ngIf="!collapsed"
          (click)="openUserProfile()"
          aria-label="Abrir perfil del usuario"
        >
          <span class="user-avatar" aria-hidden="true">
            <span>{{ getUserInitial() }}</span>
          </span>
          <div class="user-details">
            <span class="user-name">{{ currentUser.name }}</span>
            <span class="user-role">{{ currentUser.role }}</span>
          </div>
        </button>
        <button
          class="user-avatar only-icon"
          type="button"
          *ngIf="collapsed"
          (click)="openUserProfile()"
          aria-label="Abrir perfil del usuario"
        >
          <span>{{ getUserInitial() }}</span>
        </button>
      </div>
    </aside>
  `,
  styles: [
    `

      .sidebar {
        display: flex;
        flex-direction: column;
        width: 260px;
        height: 100vh;
        background-color: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: width 250ms ease;
        position: fixed;
        left: 0;
        top: 0;
        z-index: 100;

        &.sidebar-collapsed {
          width: 80px;
        }
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
        height: 70px;
      }

      .logo-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .logo-icon {
        color: #0a6cbc;
      }

      .logo-text {
        font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        font-weight: 700;
        font-size: 1.25rem;
        color: #0f172a;
      }

      .collapse-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        background-color: #f1f5f9;
        color: #475569;
        border: none;
        cursor: pointer;
        transition: all 150ms ease;

        &:hover {
          background-color: #e2e8f0;
          color: #0f172a;
        }
      }

      .sidebar-content {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 0;
      }

      .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        color: #475569;
        text-decoration: none;
        transition: all 150ms ease;
        border-left: 3px solid transparent;

        &:hover {
          background-color: #f1f5f9;
          color: #0a6cbc;
        }

        &.active {
          color: #0a6cbc;
          background-color: rgba(10, 108, 188, 0.05);
          border-left-color: #0a6cbc;

          .nav-icon {
            color: #0a6cbc;
          }
        }
      }

      .nav-icon {
        flex-shrink: 0;
      }

      .sidebar-footer {
        padding: 1rem;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
      }

      .user-trigger {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
        text-align: left;
      }

      .user-trigger:focus-visible {
        outline: 2px solid rgba(14, 165, 233, 0.75);
        border-radius: 0.75rem;
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 9999px;
        background-color: #0a6cbc;
        color: white;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
        border: none;
        cursor: pointer;
        padding: 0;
        transition: transform 150ms ease, opacity 150ms ease;
      }

      .user-avatar.only-icon {
        margin-left: auto;
      }

      .user-avatar:hover {
        opacity: 0.9;
        transform: scale(1.02);
      }

      .user-avatar:focus-visible {
        outline: 2px solid rgba(14, 165, 233, 0.8);
        outline-offset: 2px;
      }

      .user-details {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .user-name {
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-role {
        font-size: 0.75rem;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host-context(.dark-mode) .sidebar {
        background: rgba(4, 10, 22, 0.95);
        border-right: 1px solid rgba(30, 41, 59, 0.85);
        box-shadow: none;
      }

      :host-context(.dark-mode) .sidebar-header {
        border-bottom-color: rgba(30, 41, 59, 0.85);
      }

      :host-context(.dark-mode) .logo-text {
        color: #e2e8f0;
      }

      :host-context(.dark-mode) .collapse-btn {
        background: rgba(100, 116, 139, 0.2);
        color: #e2e8f0;
      }

      :host-context(.dark-mode) .nav-item {
        color: #cbd5f5;
      }

      :host-context(.dark-mode) .nav-item:hover {
        background: rgba(56, 189, 248, 0.12);
        color: #f8fafc;
      }

      :host-context(.dark-mode) .nav-item.active {
        background: rgba(14, 165, 233, 0.18);
        color: #f8fafc;
        border-left-color: #38bdf8;
      }

      :host-context(.dark-mode) .nav-icon {
        color: #94a3b8;
      }

      :host-context(.dark-mode) .sidebar-footer {
        border-top-color: rgba(30, 41, 59, 0.85);
        color: #94a3b8;
      }

      :host-context(.dark-mode) .user-avatar {
        background: rgba(59, 130, 246, 0.2);
        color: #f8fafc;
      }
    `,
  ],
})
export class SidebarComponent implements OnInit {
  @Input() currentUser: SidebarUser = {
    name: "Usuario Demo",
    role: "Capitán",
  }

  collapsed = true
  isVisible = true // Controla la visibilidad del sidebar

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Limpiar estado anterior y empezar colapsado
    this.resetSidebarState()

    // Detectar cambios de ruta
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      // Rutas donde el sidebar debe estar visible
      const visibleRoutes = ["/shipment-reports", "/dashboard", "/nearby-ports", "/user-profile"]
      this.isVisible = visibleRoutes.includes(event.urlAfterRedirects)
    })
  }

  private resetSidebarState(): void {
    // Limpiar localStorage y establecer estado inicial
    localStorage.removeItem("sidebar_collapsed")
    this.collapsed = true
    this.updateRootSidebarClass(true)
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed
    localStorage.setItem("sidebar_collapsed", this.collapsed.toString())
    this.updateRootSidebarClass(this.collapsed)
  }

  getUserInitial(): string {
    const raw = this.currentUser?.name || this.currentUser?.username
    if (!raw) {
      return "U"
    }

    const initial = raw.trim().charAt(0).toUpperCase()
    return initial || "U"
  }

  openUserProfile(): void {
    this.router.navigate(["/user-profile"])
  }

  private updateRootSidebarClass(collapsed: boolean): void {
    if (typeof document === "undefined") {
      return
    }
    document.documentElement.classList.toggle("sidebar-collapsed", collapsed)
  }
}
