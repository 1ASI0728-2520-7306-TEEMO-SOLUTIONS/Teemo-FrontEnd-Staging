import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { RouterModule } from "@angular/router"
import * as L from "leaflet"
import { Subscription } from "rxjs"
import { NearbyPortService, PortOperationalStatus, PortOverviewItem } from "../../../services/nearby-port.service"
import { SidebarComponent } from "../../shared/sidebar/sidebar.component"
import { HeaderComponent } from "../../shared/header/header.component"
import { ThemeService } from "../../../services/theme.service"
import { AuthService, type User } from "../../../services/auth.service"

declare const VANTA: any

type PortFilter = "all" | PortOperationalStatus

@Component({
  selector: "app-nearby-ports",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-container">
      <div id="nearby-vanta-background" class="vanta-background"></div>
      <app-sidebar [currentUser]="currentUser"></app-sidebar>

      <div class="main-content">
        <app-header pageTitle="Información de Puertos" [notificationCount]="1"></app-header>

        <main class="nearby-ports-content">
          <div class="nearby-ports-grid">
            <section class="map-container">
              <div class="map-header">
                <div>
                  <h2>Mapa de Puertos</h2>
                  <p>Vista geográfica de los puertos monitoreados.</p>
                </div>
                <div
                  class="status-pill"
                  [class.status-open]="statusFilter === 'OPEN'"
                  [class.status-restricted]="statusFilter === 'RESTRICTED'"
                  [class.status-closed]="statusFilter === 'CLOSED'"
                >
                  {{ getStatusFilterLabel(statusFilter) }}
                </div>
              </div>
              <div id="nearby-ports-map" class="map-canvas"></div>
            </section>

            <section class="content-container">
              <article class="ports-list-container">
                <header class="ports-list-header">
                  <div>
                    <h2>Información global de puertos</h2>
                    <p>Datos reales del backend con el estado operativo y notas más recientes.</p>
                  </div>
                  <div class="search-container">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o país"
                      [(ngModel)]="searchTerm"
                      (input)="applyFilters()"
                      class="search-input"
                    >
                  </div>
                  <div class="status-filters">
                    <button
                      type="button"
                      class="status-chip"
                      *ngFor="let option of statusOptions"
                      [class.active]="statusFilter === option.value"
                      (click)="setStatusFilter(option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                  <div class="sync-info" *ngIf="!loading">
                    <span *ngIf="lastSyncedAt">Última sincronización: {{ lastSyncedAt | date:'medium' }}</span>
                    <span>Mostrando {{ filteredPorts.length }} / {{ totalPorts || filteredPorts.length }} puertos</span>
                  </div>
                </header>

                <div class="loading-container" *ngIf="loading">
                  <div class="spinner"></div>
                  <span>Consultando puertos…</span>
                </div>

                <div class="error-banner" *ngIf="errorMessage && !loading">
                  {{ errorMessage }}
                </div>

                <div class="ports-list" *ngIf="!loading && filteredPorts.length > 0">
                  <div
                    class="port-item"
                    *ngFor="let port of filteredPorts"
                    [class.selected]="selectedPort?.portId === port.portId"
                    (click)="selectPort(port)"
                  >
                    <div class="port-header">
                      <div>
                        <h3 class="port-name">{{ port.name }}</h3>
                        <div class="port-meta">
                          <span class="port-country">{{ port.country }}</span>
                          <span class="port-coords">{{ port.lat | number:'1.2-2' }}, {{ port.lon | number:'1.2-2' }}</span>
                        </div>
                      </div>
                      <span class="port-status" [ngClass]="getStatusBadgeClass(port.status)">
                        {{ getStatusLabel(port.status) }}
                      </span>
                    </div>
                    <div class="port-contact">
                      <span>Tráfico estimado: {{ formatTraffic(port.traffic) }}</span>
                      <span *ngIf="port.reason; else statusNote">Nota: {{ port.reason }}</span>
                      <ng-template #statusNote>
                        <span>{{ getStatusLabel(port.status) }}</span>
                      </ng-template>
                      <span>
                        Contacto:
                        {{ port.contactPhone || "N/D" }}
                        ·
                        {{ port.contactEmail || "N/D" }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="no-ports" *ngIf="!loading && filteredPorts.length === 0">
                  No se encontraron puertos con los filtros aplicados.
                </div>
              </article>

              <article class="port-detail-container">
                <header class="port-detail-header">
                  <div>
                    <h2>Detalle operativo</h2>
                    <p>Selecciona un puerto para revisar notas, tráfico y últimas actualizaciones.</p>
                  </div>
                </header>

                <ng-container *ngIf="selectedPort as port; else emptyDetail">
                  <div class="port-detail-card">
                    <section class="port-detail-section">
                      <div class="port-detail-heading">
                        <h3>{{ port.name }}</h3>
                        <span class="port-status" [ngClass]="getStatusBadgeClass(port.status)">
                          {{ getStatusLabel(port.status) }}
                        </span>
                      </div>
                      <p class="port-location">{{ port.country }} · {{ port.lat | number:'1.2-2' }}, {{ port.lon | number:'1.2-2' }}</p>
                    </section>

                    <section class="port-detail-section">
                      <h3>Resumen operativo</h3>
                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Estado</span>
                          <span class="detail-value">{{ getStatusLabel(port.status) }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Tráfico estimado</span>
                          <span class="detail-value">{{ formatTraffic(port.traffic) }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Última actualización</span>
                          <span class="detail-value">{{ port.updatedAt ? (port.updatedAt | date:'medium') : 'N/D' }}</span>
                        </div>
                      </div>
                    </section>

                    <section class="port-detail-section">
                      <h3>Coordenadas</h3>
                      <div class="detail-grid compact">
                        <div class="detail-item">
                          <span class="detail-label">Latitud</span>
                          <span class="detail-value">{{ port.lat | number:'1.4-4' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Longitud</span>
                          <span class="detail-value">{{ port.lon | number:'1.4-4' }}</span>
                        </div>
                      </div>
                    </section>

                    <section class="port-detail-section">
                      <h3>Contacto</h3>
                      <div class="detail-grid compact">
                        <div class="detail-item">
                          <span class="detail-label">Teléfono</span>
                          <span class="detail-value">{{ getContactValue(port.contactPhone) }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Email</span>
                          <span class="detail-value">{{ getContactValue(port.contactEmail) }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Sitio web</span>
                          <span class="detail-value">
                            <a
                              *ngIf="port.website as site; else noWebsite"
                              class="port-link"
                              [href]="site"
                              target="_blank"
                              rel="noopener"
                            >
                              {{ site }}
                            </a>
                          </span>
                          <ng-template #noWebsite>
                            <span class="detail-value">N/D</span>
                          </ng-template>
                        </div>
                      </div>
                    </section>

                    <section class="port-detail-section" *ngIf="port.reason">
                      <h3>Notas operativas</h3>
                      <p class="port-note">{{ port.reason }}</p>
                    </section>
                  </div>
                </ng-container>
                <ng-template #emptyDetail>
                  <div class="empty-detail">
                    <p>Selecciona un puerto para ver más información.</p>
                  </div>
                </ng-template>
              </article>
            </section>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .app-container {
        display: flex;
        min-height: 100vh;
        position: relative;
      }

      .vanta-background {
        position: fixed;
        inset: 0;
        z-index: -1;
      }

      .main-content {
        flex: 1;
        margin-left: 80px;
        transition: margin-left 250ms ease;
        background: transparent;
        min-height: 100vh;
        position: relative;
        z-index: 1;
      }

      .nearby-ports-content {
        padding: calc(70px + 1.5rem) 1.5rem 1.5rem;
      }

      .nearby-ports-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .map-container,
      .content-container {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
        padding: 1.5rem;
      }

      .map-container {
        position: relative;
        overflow: hidden;
        z-index: 0;
      }

      .map-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .map-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #0f172a;
      }

      .map-header p {
        margin: 0.25rem 0 0;
        color: #64748b;
      }

      .status-pill {
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        color: white;
        background: #475569;
      }

      .status-pill.status-open {
        background: #15803d;
      }

      .status-pill.status-restricted {
        background: #b45309;
      }

      .status-pill.status-closed {
        background: #b91c1c;
      }

      .map-canvas {
        width: 100%;
        height: 420px;
        border-radius: 0.75rem;
        overflow: hidden;
      }

      .content-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        background: transparent;
        box-shadow: none;
        padding: 0;
      }

      .ports-list-container,
      .port-detail-container {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
        padding: 1.5rem;
      }

      .ports-list-header h2 {
        margin: 0;
        font-size: 1.35rem;
        color: #0f172a;
      }

      .ports-list-header p {
        margin: 0.35rem 0 1.25rem;
        color: #64748b;
      }

      .search-container {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }

      .search-input {
        flex: 1;
        border: 1px solid #e2e8f0;
        border-radius: 999px;
        padding: 0.65rem 1rem;
        font-size: 0.95rem;
        background: #f8fafc;
      }

      .status-filters {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
      }

      .status-chip {
        border: 1px solid #cbd5f5;
        background: transparent;
        border-radius: 999px;
        padding: 0.35rem 0.9rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: #475569;
        cursor: pointer;
        transition: all 150ms ease;
      }

      .status-chip.active {
        background: #0a6cbc;
        color: white;
        border-color: #0a6cbc;
      }

      .sync-info {
        display: flex;
        flex-direction: column;
        font-size: 0.85rem;
        color: #475569;
        gap: 0.2rem;
      }

      .ports-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-height: 480px;
        overflow-y: auto;
        padding-right: 0.5rem;
      }

      .port-item {
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 1rem;
        transition: all 150ms ease;
        cursor: pointer;
        background: white;
      }

      .port-item:hover {
        border-color: #94a3b8;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
      }

      .port-item.selected {
        border-color: #0a6cbc;
        box-shadow: 0 12px 30px rgba(10, 108, 188, 0.15);
      }

      .port-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }

      .port-name {
        margin: 0 0 0.35rem;
        font-size: 1.1rem;
        color: #0f172a;
      }

      .port-meta {
        display: flex;
        gap: 0.75rem;
        font-size: 0.9rem;
        color: #475569;
      }

      .port-status {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        color: white;
        background: #475569;
        white-space: nowrap;
      }

      .port-status.status-open {
        background: #16a34a;
      }

      .port-status.status-restricted {
        background: #d97706;
      }

      .port-status.status-closed {
        background: #dc2626;
      }

      .port-contact {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin-top: 0.75rem;
        font-size: 0.9rem;
        color: #475569;
      }

      .no-ports,
      .loading-container,
      .error-banner {
        border-radius: 1rem;
        padding: 1rem;
        text-align: center;
        margin-top: 1rem;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        color: #475569;
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e2e8f0;
        border-top-color: #0a6cbc;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .error-banner {
        background: #fee2e2;
        color: #b91c1c;
      }

      .no-ports {
        background: #f1f5f9;
        color: #475569;
      }

      .port-detail-header h2 {
        margin: 0;
        font-size: 1.35rem;
        color: #0f172a;
      }

      .port-detail-header p {
        margin: 0.35rem 0 0;
        color: #64748b;
      }

      .port-detail-card {
        margin-top: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .port-detail-section {
        background: #f8fafc;
        border-radius: 1rem;
        padding: 1.25rem;
      }

      .port-detail-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }

      .port-location {
        margin: 0.35rem 0 0;
        color: #475569;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 1rem;
        margin-top: 0.75rem;
      }

      .detail-grid.compact {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .detail-label {
        font-size: 0.85rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .detail-value {
        font-size: 1rem;
        font-weight: 600;
        color: #0f172a;
      }

      .port-note {
        margin: 0.5rem 0 0;
        color: #0f172a;
      }

      .port-link {
        color: #0a6cbc;
        text-decoration: underline;
      }

      .empty-detail {
        border: 1px dashed #cbd5f5;
        border-radius: 1rem;
        padding: 2rem;
        text-align: center;
        color: #475569;
        margin-top: 1rem;
      }

      .nearby-port-icon .port-icon {
        width: 14px;
        height: 14px;
        border-radius: 999px;
        border: 2px solid white;
        background: #0a6cbc;
        box-shadow: 0 4px 12px rgba(10, 108, 188, 0.45);
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 1180px) {
        .content-container {
          grid-template-columns: 1fr;
        }

        .port-detail-card {
          margin-top: 1rem;
        }
      }

      @media (max-width: 768px) {
        .main-content {
          margin-left: 0;
        }

        .nearby-ports-content {
          padding: calc(70px + 1rem) 1rem 1rem;
        }

        .map-canvas {
          height: 320px;
        }
      }

      :host-context(.dark-mode) .map-container,
      :host-context(.dark-mode) .ports-list-container,
      :host-context(.dark-mode) .port-detail-container,
      :host-context(.dark-mode) .port-item,
      :host-context(.dark-mode) .port-detail-section {
        background: rgba(15, 23, 42, 0.9);
        color: #e2e8f0;
        border-color: rgba(148, 163, 184, 0.25);
      }

      :host-context(.dark-mode) .ports-list-header h2,
      :host-context(.dark-mode) .port-detail-header h2 {
        color: #f8fafc;
      }

      :host-context(.dark-mode) .ports-list-header p,
      :host-context(.dark-mode) .port-detail-header p,
      :host-context(.dark-mode) .port-contact span,
      :host-context(.dark-mode) .sync-info {
        color: #cbd5f5;
      }

      :host-context(.dark-mode) .search-input {
        background: rgba(8, 17, 31, 0.85);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: #f8fafc;
      }

      :host-context(.dark-mode) .status-chip {
        border-color: rgba(59, 130, 246, 0.4);
        color: #e2e8f0;
      }

      :host-context(.dark-mode) .port-item {
        background: rgba(8, 18, 40, 0.85);
        border-color: rgba(59, 130, 246, 0.2);
      }

      :host-context(.dark-mode) .port-item.selected {
        border-color: rgba(59, 130, 246, 0.45);
        background: rgba(14, 23, 45, 0.95);
      }

      :host-context(.dark-mode) .detail-value {
        color: #f8fafc;
      }

      :host-context(.dark-mode) .port-detail-section {
        background: rgba(8, 17, 31, 0.85);
      }

      :host-context(.dark-mode) .empty-detail {
        border-color: rgba(59, 130, 246, 0.35);
        color: #cbd5f5;
      }
    `,
  ],
})
export class NearbyPortsComponent implements OnInit, AfterViewInit, OnDestroy {
  currentUser = {
    id: undefined as string | undefined,
    username: "capitan.demo",
    name: "Capitán Demo",
    role: "Operaciones",
  }

  ports: PortOverviewItem[] = []
  filteredPorts: PortOverviewItem[] = []
  selectedPort?: PortOverviewItem
  totalPorts = 0
  lastSyncedAt?: string

  loading = true
  errorMessage?: string
  searchTerm = ""
  statusFilter: PortFilter = "all"

  private readonly statusLabels: Record<PortOperationalStatus, string> = {
    OPEN: "Operativo",
    RESTRICTED: "Restringido",
    CLOSED: "Cerrado",
  }

  readonly statusOptions: { value: PortFilter; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "OPEN", label: "Operativos" },
    { value: "RESTRICTED", label: "Restringidos" },
    { value: "CLOSED", label: "Cerrados" },
  ]

  private subscriptions = new Subscription()
  private map?: L.Map
  private portMarkers: L.Marker[] = []
  private viewReady = false
  private vantaEffect: any = null
  private isDarkMode = false

  constructor(
    private nearbyPortService: NearbyPortService,
    private themeService: ThemeService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.resolveCurrentUser()

    this.subscriptions.add(
      this.themeService.isDarkMode$.subscribe((isDark) => {
        this.isDarkMode = isDark
        if (this.vantaEffect) {
          this.rebuildVanta()
        }
      }),
    )
    this.loadPorts()
  }

  ngAfterViewInit(): void {
    this.viewReady = true
    setTimeout(() => this.initVanta(), 0)
    if (!this.loading) {
      setTimeout(() => this.initMap(), 100)
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
    this.map?.remove()
    this.destroyVanta()
  }

  setStatusFilter(filter: PortFilter): void {
    if (this.statusFilter === filter) return
    this.statusFilter = filter
    this.applyFilters()
  }

  selectPort(port: PortOverviewItem): void {
    this.selectedPort = port
    if (this.map) {
      this.map.setView([port.lat, port.lon], Math.max(this.map.getZoom(), 6))
    }
  }

  applyFilters(): void {
    if (!this.ports.length) {
      this.filteredPorts = []
      return
    }

    const term = this.searchTerm.trim().toLowerCase()
    this.filteredPorts = this.ports.filter((port) => {
      const matchesTerm =
        !term || port.name.toLowerCase().includes(term) || port.country.toLowerCase().includes(term)
      const matchesStatus = this.statusFilter === "all" || port.status === this.statusFilter
      return matchesTerm && matchesStatus
    })

    if (
      this.filteredPorts.length > 0 &&
      (!this.selectedPort || !this.filteredPorts.some((p) => p.portId === this.selectedPort?.portId))
    ) {
      this.selectedPort = this.filteredPorts[0]
    }

    this.refreshMapMarkers()
  }

  formatTraffic(traffic?: number): string {
    if (traffic === undefined || traffic === null) {
      return "N/D"
    }
    return `${traffic.toLocaleString()} buques/día`
  }

  getContactValue(value?: string | null): string {
    return value && value.trim().length > 0 ? value : "N/D"
  }

  getStatusLabel(status: PortOperationalStatus): string {
    return this.statusLabels[status] ?? status
  }

  getStatusBadgeClass(status: PortOperationalStatus): string {
    return `status-${status.toLowerCase()}`
  }

  getStatusFilterLabel(filter: PortFilter): string {
    if (filter === "all") {
      return "Todos"
    }
    return this.getStatusLabel(filter)
  }

  private resolveCurrentUser(): void {
    const user = this.authService.currentUserValue
    if (!user) {
      return
    }

    this.currentUser = {
      id: user.id,
      username: user.username,
      name: this.extractUserName(user),
      role: this.formatUserRole(user),
    }
  }

  private extractUserName(user: User): string {
    const candidate = user.name?.trim() || user.username
    if (candidate && candidate.length > 0) {
      return candidate
    }
    return this.currentUser.name
  }

  private formatUserRole(user: User): string {
    const rawRole = user.role || user.roles?.[0]
    if (!rawRole) {
      return this.currentUser.role
    }
    const normalized = rawRole.replace(/^ROLE_/, "").toLowerCase()
    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }

  private loadPorts(): void {
    this.loading = true
    this.errorMessage = undefined

    const sub = this.nearbyPortService.getPortOverview({ size: 50 }).subscribe({
      next: (response) => {
        this.loading = false
        this.lastSyncedAt = response.lastSyncedAt
        this.totalPorts = response.totalElements
        this.ports = response.content.filter((port) => this.isValidCoordinate(port.lat, port.lon))
        this.applyFilters()
        if (this.viewReady) {
          setTimeout(() => this.initMap(), 100)
        }
      },
      error: (err) => {
        this.loading = false
        this.errorMessage = err?.message || "No se pudo obtener la información de puertos."
        this.ports = []
        this.filteredPorts = []
      },
    })

    this.subscriptions.add(sub)
  }

  private initMap(): void {
    const target = document.getElementById("nearby-ports-map")
    if (!target) return

    this.map?.remove()

    const center = this.getDefaultCenter()

    this.map = L.map(target, {
      center,
      zoom: 3,
      minZoom: 2,
      maxZoom: 10,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map)

    this.refreshMapMarkers()
  }

  private refreshMapMarkers(): void {
    if (!this.map) return

    this.portMarkers.forEach((marker) => this.map?.removeLayer(marker))
    this.portMarkers = []

    if (!this.filteredPorts.length) return

    const icon = L.divIcon({
      className: "nearby-port-icon",
      html: `<div class="port-icon" title=""></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    })

    this.filteredPorts.forEach((port) => {
      const marker = L.marker([port.lat, port.lon], {
        title: port.name,
        icon,
      }).addTo(this.map!)

      marker.bindPopup(`
        <div class="port-popup">
          <strong>${port.name}</strong><br>
          ${port.country}<br>
          Estado: ${this.getStatusLabel(port.status)}
        </div>
      `)

      marker.on("click", () => this.selectPort(port))
      this.portMarkers.push(marker)
    })

    const bounds = L.latLngBounds(this.filteredPorts.map((p) => [p.lat, p.lon] as [number, number]))
    this.map.fitBounds(bounds.pad(0.3))
  }

  private getDefaultCenter(): [number, number] {
    if (!this.filteredPorts.length) return [0, 0]

    const lat = this.filteredPorts.reduce((sum, port) => sum + port.lat, 0) / this.filteredPorts.length
    const lon = this.filteredPorts.reduce((sum, port) => sum + port.lon, 0) / this.filteredPorts.length

    return [lat || 0, lon || 0]
  }

  private isValidCoordinate(lat: number, lon: number): boolean {
    return Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0
  }

  private initVanta(): void {
    if (this.vantaEffect) return
    if (typeof window === "undefined") return
    if (typeof VANTA === "undefined" || !VANTA.WAVES) return

    const target = document.getElementById("nearby-vanta-background")
    if (!target) return

    this.vantaEffect = VANTA.WAVES({
      el: target,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color: this.getVantaColor(),
      shininess: 18.0,
      waveHeight: 40.0,
      zoom: 0.65,
    })
  }

  private rebuildVanta(): void {
    if (this.vantaEffect) {
      this.vantaEffect.destroy()
      this.vantaEffect = null
    }
    this.initVanta()
  }

  private getVantaColor(): number {
    return this.isDarkMode ? 0x4f4f4f : 0x759298
  }

  private destroyVanta(): void {
    if (this.vantaEffect) {
      this.vantaEffect.destroy()
      this.vantaEffect = null
    }
  }
}
