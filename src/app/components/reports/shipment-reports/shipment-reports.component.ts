import { Component, type OnInit, AfterViewInit, OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { SidebarComponent } from "../../shared/sidebar/sidebar.component"
import { HeaderComponent } from "../../shared/header/header.component"
import { ReportService, ShipmentReport } from "../../../services/report.service"
import { ThemeService } from "../../../services/theme.service"
import { Subscription } from "rxjs"

declare const VANTA: any

@Component({
  selector: "app-shipment-reports",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-container">
      <div id="reports-vanta-background" class="vanta-background"></div>
      <app-sidebar [currentUser]="currentUser"></app-sidebar>

      <div class="main-content">
        <app-header
          pageTitle="Informes de Envíos"
          [notificationCount]="2"
        >
          <button class="btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportar Informes
          </button>
        </app-header>

        <main class="reports-content">
          <div class="reports-grid">
            <div class="reports-list-container">
              <div class="card-header">
                <h2>Informes Disponibles</h2>
                <div class="search-container">
                  <input
                    type="text"
                    placeholder="Buscar por ID o ruta..."
                    [(ngModel)]="searchTerm"
                    (input)="filterReports()"
                    class="search-input"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>

              <div class="loading-container" *ngIf="loading">
                <div class="spinner"></div>
                <span>Cargando informes...</span>
              </div>

              <div class="no-reports" *ngIf="!loading && filteredReports.length === 0">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p>No se encontraron informes que coincidan con la búsqueda.</p>
              </div>

              <div class="reports-list" *ngIf="!loading && filteredReports.length > 0">
                <div
                  class="report-item"
                  *ngFor="let report of filteredReports"
                  [class.selected]="selectedReport?.id === report.id"
                  (click)="selectReport(report)"
                >
                  <div class="report-item-header">
                    <span class="report-id">{{ report.shipmentId }}</span>
                    <span class="report-status">Completado</span>
                  </div>
                  <div class="report-route">{{ report.routeName }}</div>
                  <div class="report-dates">
                    <div class="date-item">
                      <span class="date-label">Salida:</span>
                      <span class="date-value">{{ formatDate(report.departureDate) }}</span>
                    </div>
                    <div class="date-item">
                      <span class="date-label">Llegada:</span>
                      <span class="date-value">{{ formatDate(report.arrivalDate) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="report-details-container" *ngIf="selectedReport">
              <div class="card-header">
                <h2>Detalles del Informe</h2>
                <button class="download-btn" (click)="downloadReport(selectedReport.id)" [disabled]="downloading">
                  <div class="btn-content" *ngIf="!downloading">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Descargar PDF
                  </div>
                  <div class="btn-loading" *ngIf="downloading">
                    <div class="btn-spinner"></div>
                    Generando...
                  </div>
                </button>
              </div>

              <div class="report-details-content">
                <div class="report-section">
                  <h3>Información General</h3>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">ID de Envío:</span>
                      <span class="info-value">{{ selectedReport.shipmentId }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Ruta:</span>
                      <span class="info-value">{{ selectedReport.routeName }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Embarcación:</span>
                      <span class="info-value">{{ selectedReport.vessel }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Distancia:</span>
                      <span class="info-value">{{ selectedReport.distance }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Tiempo Total:</span>
                      <span class="info-value">{{ selectedReport.totalTime }}</span>
                    </div>
                  </div>
                </div>

                <div class="report-section">
                  <h3>Eventos Registrados</h3>
                  <div class="events-timeline">
                    <div class="event-item" *ngFor="let event of selectedReport.events">
                      <div class="event-time">{{ formatDate(event.timestamp) }}</div>
                      <div class="event-marker" [ngClass]="'event-' + event.type.toLowerCase()"></div>
                      <div class="event-details">
                        <div class="event-type">{{ event.type }}</div>
                        <div class="event-description">{{ event.description }}</div>
                        <div class="event-location" *ngIf="event.location">{{ event.location }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="report-section">
                  <h3>Emisiones Estimadas</h3>
                  <div class="emissions-grid">
                    <div class="emission-item">
                      <div class="emission-icon co2-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M2 12h20"></path>
                          <path d="M2 12a10 10 0 0 1 20 0"></path>
                          <path d="M2 12a10 10 0 0 0 20 0"></path>
                        </svg>
                      </div>
                      <div class="emission-content">
                        <span class="emission-label">CO2:</span>
                        <span class="emission-value">{{ selectedReport.emissions.co2 }}</span>
                      </div>
                    </div>
                    <div class="emission-item">
                      <div class="emission-icon nox-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                        </svg>
                      </div>
                      <div class="emission-content">
                        <span class="emission-label">NOx:</span>
                        <span class="emission-value">{{ selectedReport.emissions.nox }}</span>
                      </div>
                    </div>
                    <div class="emission-item">
                      <div class="emission-icon sox-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M19 12H5"></path>
                          <path d="M19 6H9"></path>
                          <path d="M19 18H9"></path>
                        </svg>
                      </div>
                      <div class="emission-content">
                        <span class="emission-label">SOx:</span>
                        <span class="emission-value">{{ selectedReport.emissions.sox }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="no-report-selected" *ngIf="!selectedReport">
              <div class="no-report-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <h3>Seleccione un informe para ver sus detalles</h3>
                <p>Haga clic en uno de los informes de la lista para ver información detallada.</p>
              </div>
            </div>
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
        position: relative;
        z-index: 1;

        &.sidebar-expanded {
          margin-left: 260px;
        }
      }

    .reports-content {
      padding: 2rem;
      padding-top: calc(70px + 2rem);
    }

    .reports-grid {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 1.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .reports-list-container, .report-details-container, .no-report-selected {
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 70px - 4rem);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;

      h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #0f172a;
      }
    }

    .search-container {
      position: relative;
      width: 100%;
      max-width: 300px;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 1.5rem 0.5rem 2rem;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      font-size: 0.875rem;
      transition: all 150ms ease;

      &:focus {
        outline: none;
        border-color: #0a6cbc;
        box-shadow: 0 0 0 2px rgba(10, 108, 188, 0.1);
      }

      &::placeholder {
        color: #94a3b8;
      }
    }

    .search-icon {
      position: absolute;
      left: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      pointer-events: none;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #475569;
      gap: 1rem;
      flex: 1;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(10, 108, 188, 0.1);
      border-radius: 50%;
      border-top-color: #0a6cbc;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .no-reports {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #475569;
      gap: 1rem;
      flex: 1;
      text-align: center;

      svg {
        color: #cbd5e1;
      }

      p {
        max-width: 300px;
        margin: 0;
      }
    }

    .reports-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .report-item {
      padding: 1rem;
      border-radius: 0.375rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 150ms ease;
      border-left: 3px solid transparent;

      &:hover {
        background-color: #f1f5f9;
      }

      &.selected {
        background-color: rgba(10, 108, 188, 0.05);
        border-left-color: #0a6cbc;
      }
    }

    .report-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .report-id {
      font-weight: 600;
      color: #0f172a;
    }

    .report-status {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background-color: rgba(0, 200, 83, 0.1);
      color: #00c853;
      border-radius: 9999px;
      font-weight: 600;
    }

    .report-route {
      font-size: 0.875rem;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .report-dates {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
    }

    .date-label {
      color: #64748b;
      margin-right: 0.25rem;
    }

    .date-value {
      color: #0f172a;
      font-weight: 500;
    }

    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 1rem;
      background-color: #0a6cbc;
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 150ms ease;

      &:hover {
        background-color: #084e88;
      }

      &:disabled {
        background-color: #6b9ecf;
        cursor: not-allowed;
      }

      svg {
        flex-shrink: 0;
      }
    }

    .btn-content, .btn-loading {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 1s linear infinite;
    }

    .report-details-content {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .report-section {
      margin-bottom: 2rem;

      &:last-child {
        margin-bottom: 0;
      }

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #0f172a;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e2e8f0;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .info-value {
      font-size: 0.875rem;
      color: #0f172a;
      font-weight: 500;
    }

    .events-timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .event-item {
      display: flex;
      align-items: flex-start;
    }

    .event-time {
      width: 100px;
      font-size: 0.75rem;
      color: #64748b;
      padding-top: 0.25rem;
    }

    .event-marker {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin: 0.25rem 1rem 0 0;
      flex-shrink: 0;
    }

    .event-departure {
      background-color: #0a6cbc;
    }

    .event-arrival {
      background-color: #00c853;
    }

    .event-weather {
      background-color: #ffc107;
    }

    .event-maintenance {
      background-color: #ff6e40;
    }

    .event-incident {
      background-color: #f44336;
    }

    .event-details {
      flex: 1;
    }

    .event-type {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }

    .event-description {
      font-size: 0.875rem;
      color: #475569;
      margin-bottom: 0.25rem;
    }

    .event-location {
      font-size: 0.75rem;
      color: #64748b;
      font-style: italic;
    }

    .emissions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .emission-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background-color: #f8fafc;
      border-radius: 0.375rem;
    }

    .emission-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 0.375rem;
      flex-shrink: 0;
    }

    .co2-icon {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .nox-icon {
      background-color: rgba(255, 193, 7, 0.1);
      color: #ffc107;
    }

    .sox-icon {
      background-color: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }

    .emission-content {
      display: flex;
      flex-direction: column;
    }

    .emission-label {
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .emission-value {
      font-size: 1rem;
      color: #0f172a;
      font-weight: 600;
    }

    .no-report-selected {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .no-report-message {
      text-align: center;
      padding: 3rem;
      max-width: 400px;

      svg {
        color: #cbd5e1;
        margin-bottom: 1.5rem;
      }

      h3 {
        margin: 0 0 0.5rem 0;
        color: #0f172a;
        font-size: 1.25rem;
      }

      p {
        margin: 0;
        color: #475569;
        font-size: 0.875rem;
      }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background-color: #0a6cbc;
      color: white;
      border: none;
      border-radius: 0.375rem;
      padding: 0.5rem 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 150ms ease;

      &:hover {
        background-color: #084e88;
      }

      svg {
        flex-shrink: 0;
      }
    }

      .mr-2 {
        margin-right: 0.5rem;
      }

      :host-context(.dark-mode) .reports-list-container,
      :host-context(.dark-mode) .report-details-container,
      :host-context(.dark-mode) .no-report-selected {
        background: rgba(4, 10, 22, 0.94);
        border: 1px solid rgba(59, 130, 246, 0.25);
        box-shadow: 0 24px 48px rgba(2, 6, 23, 0.7);
        color: #e2e8f0;
      }

      :host-context(.dark-mode) .card-header {
        background: transparent;
        border-bottom-color: rgba(148, 163, 184, 0.2);
      }

      :host-context(.dark-mode) .card-header h2,
      :host-context(.dark-mode) .report-section h3,
      :host-context(.dark-mode) .info-label,
      :host-context(.dark-mode) .info-value,
      :host-context(.dark-mode) .report-route,
      :host-context(.dark-mode) .report-id {
        color: #f8fafc;
      }

      :host-context(.dark-mode) .report-item {
        background: rgba(8, 17, 35, 0.9);
        border-color: rgba(148, 163, 184, 0.15);
        color: #e2e8f0;
      }

      :host-context(.dark-mode) .report-item.selected {
        border-color: rgba(59, 130, 246, 0.35);
        background: rgba(14, 23, 45, 0.95);
      }

      :host-context(.dark-mode) input,
      :host-context(.dark-mode) select,
      :host-context(.dark-mode) textarea {
        background: rgba(8, 17, 31, 0.85);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: #f8fafc;
      }

      :host-context(.dark-mode) .btn-primary {
        background: #0ea5e9;
        color: #020617;
      }
    `,
  ],
})
export class ShipmentReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  reports: ShipmentReport[] = []
  filteredReports: ShipmentReport[] = []
  selectedReport: ShipmentReport | null = null
  loading = true
  searchTerm = ""
  downloading = false

  private vantaEffect: any = null
  private themeSub?: Subscription
  private isDarkMode = false

  currentUser = {
    name: "Usuario Demo",
    role: "Capitán",
  }

  constructor(private reportService: ReportService, private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeSub = this.themeService.isDarkMode$.subscribe((isDark) => {
      this.isDarkMode = isDark
      if (this.vantaEffect) {
        this.rebuildVanta()
      }
    })
    this.loadReports()
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initVanta(), 0)
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe()
    this.destroyVanta()
  }

  loadReports(): void {
    this.loading = true
    this.reportService.getShipmentReports().subscribe({
      next: (data) => {
        this.reports = data
        this.filteredReports = [...data]
        this.loading = false
      },
      error: (err) => {
        console.error("Error al cargar los informes:", err)
        this.loading = false
      },
    })
  }

  filterReports(): void {
    if (!this.searchTerm.trim()) {
      this.filteredReports = [...this.reports]
      return
    }

    const term = this.searchTerm.toLowerCase().trim()
    this.filteredReports = this.reports.filter(
      (report) => report.shipmentId.toLowerCase().includes(term) || report.routeName.toLowerCase().includes(term),
    )
  }

  selectReport(report: ShipmentReport): void {
    this.selectedReport = report
  }

  downloadReport(reportId: number): void {
    if (this.downloading) return

    this.downloading = true
    this.reportService.downloadReportPdf(reportId).subscribe({
      next: () => {
        // La descarga la maneja el servicio con jsPDF
        this.downloading = false
      },
      error: (err) => {
        console.error("Error al descargar el informe:", err)
        alert("Error al descargar el informe: " + err.message)
        this.downloading = false
      },
    })
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  private initVanta(): void {
    if (this.vantaEffect) return
    if (typeof window === "undefined") return
    if (typeof VANTA === "undefined" || !VANTA.WAVES) return

    const target = document.getElementById("reports-vanta-background")
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
