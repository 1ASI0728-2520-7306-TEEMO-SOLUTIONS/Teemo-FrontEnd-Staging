import { Component, OnDestroy, OnInit, AfterViewInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { RouterModule } from "@angular/router"
import * as L from "leaflet"
import { Subscription } from "rxjs"
import { NearbyPortService, NearbyPort } from "../../../services/nearby-port.service"
import { SidebarComponent } from "../../shared/sidebar/sidebar.component"
import { HeaderComponent } from "../../shared/header/header.component"

@Component({
  selector: "app-nearby-ports",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-container">
      <app-sidebar [currentUser]="currentUser"></app-sidebar>

      <div class="main-content">
        <app-header
          pageTitle="Información de Puertos"
          [notificationCount]="1"
        >
          <button class="btn-primary" type="button" (click)="reload()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"></path>
              <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14"></path>
            </svg>
            Sincronizar
          </button>
        </app-header>

        <main class="nearby-ports-content">
          <div class="nearby-ports-grid">
            <section class="map-container">
              <div class="map-header">
                <div>
                  <h2>Mapa de Puertos</h2>
                  <p *ngIf="!loading">{{ filteredPorts.length }} puertos visibles</p>
                </div>
                <div class="status-pill" [class.status-open]="statusFilter === 'open'" [class.status-closed]="statusFilter === 'closed'">
                  <span *ngIf="statusFilter === 'all'">Todos</span>
                  <span *ngIf="statusFilter === 'open'">Operativos</span>
                  <span *ngIf="statusFilter === 'closed'">Cerrados</span>
                </div>
              </div>
              <div id="nearby-ports-map" class="map-canvas"></div>
            </section>

            <section class="content-container">
              <article class="ports-list-container">
                <header class="ports-list-header">
                  <div>
                    <h2>Directorio de Puertos</h2>
                    <p>Consulta el estado operativo, contacto y servicios disponibles.</p>
                  </div>
                  <div class="search-container">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o país…"
                      [(ngModel)]="searchTerm"
                      (input)="applyFilters()"
                      class="search-input"
                    >
                  </div>
                  <div class="status-filters">
                    <button type="button" class="status-chip" [class.active]="statusFilter === 'all'" (click)="setStatusFilter('all')">Todos</button>
                    <button type="button" class="status-chip" [class.active]="statusFilter === 'open'" (click)="setStatusFilter('open')">Operativos</button>
                    <button type="button" class="status-chip" [class.active]="statusFilter === 'closed'" (click)="setStatusFilter('closed')">Cerrados</button>
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
                    [class.selected]="selectedPort?.id === port.id"
                    (click)="selectPort(port)"
                  >
                    <div class="port-header">
                      <div>
                        <h3 class="port-name">{{ port.name }}</h3>
                        <div class="port-meta">
                          <span class="port-country">{{ port.country }}</span>
                          <span class="port-coords">{{ port.latitude | number:'1.2-2' }}, {{ port.longitude | number:'1.2-2' }}</span>
                        </div>
                      </div>
                      <span class="port-status" [class.status-open]="port.status === 'open'" [class.status-closed]="port.status === 'closed'">
                        {{ port.status === 'open' ? 'Operativo' : 'Cerrado' }}
                      </span>
                    </div>
                    <div class="port-contact">
                      <span>{{ port.contactInfo.phone }}</span>
                      <span>{{ port.contactInfo.email }}</span>
                    </div>
                  </div>
                </div>

                <div class="no-ports" *ngIf="!loading && filteredPorts.length === 0">
                  No se encontraron puertos con los filtros aplicados.
                </div>
              </article>

              <article class="port-details-container">
                <ng-container *ngIf="selectedPort as port; else emptyDetail">
                  <div class="port-details-header">
                    <h2>Detalles del Puerto</h2>
                    <p>{{ port.name }}</p>
                  </div>
                  <div class="port-details-content">
                    <section class="port-detail-section">
                      <h3>Operación</h3>
                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Estado</span>
                          <span class="detail-value" [class.text-open]="port.status === 'open'" [class.text-closed]="port.status === 'closed'">
                            {{ port.status === 'open' ? 'Operativo' : 'Cerrado' }}
                          </span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">País / Región</span>
                          <span class="detail-value">{{ port.country }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Calado máx.</span>
                          <span class="detail-value">{{ port.maxDepth }} m</span>
                        </div>
                      </div>
                    </section>

                    <section class="port-detail-section">
                      <h3>Contacto</h3>
                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Teléfono</span>
                          <span class="detail-value">{{ port.contactInfo.phone }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Email</span>
                          <span class="detail-value">{{ port.contactInfo.email }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Canal VHF</span>
                          <span class="detail-value">{{ port.contactInfo.vhfChannel }}</span>
                        </div>
                      </div>
                    </section>

                    <section class="port-detail-section">
                      <h3>Servicios Disponibles</h3>
                      <div class="chips">
                        <span class="chip" *ngFor="let facility of port.facilities">{{ facility }}</span>
                      </div>
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
        background: #f5f7fb;
      }

      .main-content {
        flex: 1;
        margin-left: 80px;
        transition: margin-left 250ms ease;
        background: #f5f7fb;
        min-height: 100vh;
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

      .map-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .map-canvas {
        width: 100%;
        height: 340px;
        border-radius: 1rem;
        border: 1px solid #e0e7ff;
      }

      .status-pill {
        padding: 0.35rem 0.9rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        background: rgba(148, 163, 184, 0.2);
        color: #475569;
      }

      .status-pill.status-open {
        background: rgba(16, 185, 129, 0.2);
        color: #047857;
      }

      .status-pill.status-closed {
        background: rgba(248, 113, 113, 0.2);
        color: #b91c1c;
      }

      .content-container {
        display: grid;
        grid-template-columns: 1fr 0.9fr;
        gap: 1.25rem;
        padding: 1.5rem;
      }

      .ports-list-container,
      .port-details-container {
        background: #fdfdfd;
        border-radius: 1rem;
        padding: 1.25rem;
        border: 1px solid #eef2ff;
      }

      .ports-list-header h2 {
        margin: 0;
        font-size: 1.2rem;
      }

      .ports-list-header p {
        margin: 0.25rem 0 0;
        color: #6b7280;
        font-size: 0.9rem;
      }

      .search-container {
        margin-top: 1rem;
        width: 100%;
      }

      .search-input {
        width: 100%;
        padding: 0.65rem 0.85rem;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        font-size: 0.95rem;
      }

      .status-filters {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.75rem;
        flex-wrap: wrap;
      }

      .status-chip {
        border: 1px solid transparent;
        padding: 0.35rem 0.9rem;
        border-radius: 999px;
        background: #f4f6fb;
        color: #475569;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 120ms ease;
      }

      .status-chip.active {
        background: #0a6cbc;
        color: #fff;
        border-color: #0a6cbc;
      }

      .ports-list {
        margin-top: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        max-height: 520px;
        overflow-y: auto;
        padding-right: 0.5rem;
      }

      .port-item {
        border: 1px solid #e5e7eb;
        border-radius: 1rem;
        padding: 1rem;
        background: white;
        cursor: pointer;
        transition: border-color 150ms ease, transform 150ms ease;
      }

      .port-item:hover {
        border-color: #0a6cbc;
        transform: translateX(2px);
      }

      .port-item.selected {
        border-color: #0a6cbc;
        box-shadow: inset 0 0 0 1px rgba(10, 108, 188, 0.15);
      }

      .port-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .port-name {
        margin: 0;
        font-size: 1.05rem;
      }

      .port-meta {
        display: flex;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: #6b7280;
      }

      .port-status {
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        background: rgba(148, 163, 184, 0.2);
        color: #475569;
      }

      .port-status.status-open {
        background: rgba(16, 185, 129, 0.2);
        color: #047857;
      }

      .port-status.status-closed {
        background: rgba(248, 113, 113, 0.2);
        color: #b91c1c;
      }

      .port-contact {
        margin-top: 0.5rem;
        font-size: 0.85rem;
        color: #4b5563;
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      .loading-container,
      .no-ports,
      .empty-detail,
      .error-banner {
        padding: 1rem;
        border-radius: 1rem;
        text-align: center;
        margin-top: 1.25rem;
        background: rgba(99, 102, 241, 0.05);
        border: 1px dashed #cbd5f5;
      }

      .error-banner {
        border-color: rgba(248, 113, 113, 0.4);
        color: #b91c1c;
        background: rgba(248, 113, 113, 0.1);
      }

      .spinner {
        width: 30px;
        height: 30px;
        border: 3px solid rgba(37, 99, 235, 0.2);
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 0.6rem;
      }

      .port-details-header h2 {
        margin: 0;
      }

      .port-details-header p {
        margin: 0.25rem 0 0;
        color: #6b7280;
      }

      .port-detail-section {
        margin-top: 1rem;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.75rem;
      }

      .detail-item {
        background: #f8fafc;
        border-radius: 0.75rem;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
      }

      .detail-label {
        font-size: 0.75rem;
        color: #6b7280;
        display: block;
        margin-bottom: 0.15rem;
        text-transform: uppercase;
      }

      .detail-value {
        font-weight: 600;
        color: #111827;
      }

      .text-open {
        color: #047857;
      }

      .text-closed {
        color: #b91c1c;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .chip {
        padding: 0.35rem 0.8rem;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.08);
        color: #1e293b;
        font-size: 0.8rem;
      }

      @media (max-width: 1200px) {
        .content-container {
          grid-template-columns: 1fr;
        }

        .main-content {
          margin-left: 0;
        }
      }

      @media (max-width: 768px) {
        .nearby-ports-content {
          padding: calc(70px + 1rem) 1rem 1rem;
        }

        .status-filters {
          flex-direction: column;
          align-items: flex-start;
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class NearbyPortsComponent implements OnInit, AfterViewInit, OnDestroy {
  currentUser = {
    name: "Capitán Demo",
    role: "Operaciones",
  }

  ports: NearbyPort[] = []
  filteredPorts: NearbyPort[] = []
  selectedPort?: NearbyPort

  loading = true
  errorMessage?: string
  searchTerm = ""
  statusFilter: "all" | "open" | "closed" = "all"

  private subscriptions = new Subscription()
  private map?: L.Map
  private portMarkers: L.Marker[] = []
  private viewReady = false

  constructor(private nearbyPortService: NearbyPortService) {}

  ngOnInit(): void {
    this.loadPorts()
  }

  ngAfterViewInit(): void {
    this.viewReady = true
    if (!this.loading) {
      setTimeout(() => this.initMap(), 100)
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
    if (this.map) {
      this.map.remove()
    }
  }

  reload(): void {
    this.loadPorts(true)
  }

  setStatusFilter(filter: "all" | "open" | "closed"): void {
    if (this.statusFilter === filter) return
    this.statusFilter = filter
    this.applyFilters()
  }

  selectPort(port: NearbyPort): void {
    this.selectedPort = port
    if (this.map) {
      this.map.setView([port.latitude, port.longitude], Math.max(this.map.getZoom(), 6))
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

    if (this.filteredPorts.length > 0 && (!this.selectedPort || !this.filteredPorts.some((p) => p.id === this.selectedPort?.id))) {
      this.selectedPort = this.filteredPorts[0]
    }

    this.refreshMapMarkers()
  }

  private loadPorts(force = false): void {
    this.loading = true
    this.errorMessage = undefined

    const source$ = force ? this.nearbyPortService.fetchPublicPorts() : this.nearbyPortService.fetchPublicPorts()

    const sub = source$.subscribe({
      next: (ports) => {
        this.loading = false
        this.ports = ports.filter((port) => this.isValidCoordinate(port.latitude, port.longitude))
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

    if (this.map) {
      this.map.remove()
    }

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

    this.filteredPorts.forEach((port) => {
      const marker = L.marker([port.latitude, port.longitude], {
        title: port.name,
      }).addTo(this.map!)

      marker.bindPopup(`
        <div class="port-popup">
          <strong>${port.name}</strong><br>
          ${port.country}<br>
          Estado: ${port.status === "open" ? "Operativo" : "Cerrado"}
        </div>
      `)

      marker.on("click", () => this.selectPort(port))
      this.portMarkers.push(marker)
    })

    const bounds = L.latLngBounds(this.filteredPorts.map((p) => [p.latitude, p.longitude] as [number, number]))
    this.map.fitBounds(bounds.pad(0.3))
  }

  private getDefaultCenter(): [number, number] {
    if (!this.filteredPorts.length) return [0, 0]

    const lat =
      this.filteredPorts.reduce((sum, port) => sum + port.latitude, 0) / this.filteredPorts.length
    const lon =
      this.filteredPorts.reduce((sum, port) => sum + port.longitude, 0) / this.filteredPorts.length

    return [lat || 0, lon || 0]
  }

  private isValidCoordinate(lat: number, lon: number): boolean {
    return Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0
  }
}
