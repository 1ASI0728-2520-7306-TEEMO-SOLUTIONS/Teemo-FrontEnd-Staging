import {
  Component,
  EventEmitter,
  Input,
  Output,
  type OnInit,
  type OnDestroy,
  type OnChanges,
  type SimpleChanges,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import * as L from "leaflet"
import { PortService, Port, type PortAdminRecord } from "../../../services/port.service"
import { RouteCalculationResource, RouteService } from "../../../services/route.service"

interface PortCoordinates {
  latitude: number
  longitude: number
}

interface RoutePort {
  name: string
  coordinates: PortCoordinates
}


interface GeoJSONFeature {
  type: "Feature"
  geometry: {
    type: "Polygon" | "MultiPolygon"
    coordinates: number[][][] | number[][][][]
  }
  properties: any
}

interface GeoJSONData {
  type: "FeatureCollection"
  features: GeoJSONFeature[]
}

// Interfaz para representar un segmento de línea
interface LineSegment {
  start: { lat: number; lng: number }
  end: { lat: number; lng: number }
}

@Component({
  selector: "app-route-animation",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="route-animation-container">

      <!-- Estado de carga de GeoJSON -->
      <div class="geojson-status" *ngIf="!geoJsonLoaded">
        <div class="loading-indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="animate-spin"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56"></path>
          </svg>
          Cargando datos geográficos...
        </div>
      </div>

      <div class="recalc-banner" *ngIf="isRecalculatingRoute" data-testid="recalc-banner">
        <div class="loading-indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="animate-spin"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56"></path>
          </svg>
          Recalculando ruta alternativa por puertos deshabilitados…
        </div>
      </div>

      <div class="recalc-alert info" *ngIf="recalculationInfoVisible" data-testid="recalc-info">
        <div>
          <strong>Ruta alternativa activa</strong>
          <p>Se está usando una ruta alternativa porque {{ disabledPortsInRoute.join(", ") }} están deshabilitados.</p>
        </div>
        <button class="detail-btn" (click)="toggleAlternativeDetails()">
          {{ showAlternativeDetails ? "Ocultar detalles" : "Ver detalles" }}
        </button>
      </div>

      <div class="alt-details" *ngIf="recalculationInfoVisible && showAlternativeDetails" data-testid="recalc-details">
        <div *ngIf="currentRouteData?.warnings?.length">
          <h5>Advertencias</h5>
          <ul>
            <li *ngFor="let warning of currentRouteData?.warnings">{{ warning }}</li>
          </ul>
        </div>
        <div *ngIf="currentRouteData?.metadata">
          <h5>Metadatos</h5>
          <pre>{{ currentRouteData?.metadata | json }}</pre>
        </div>
      </div>

      <div class="recalc-alert warning" *ngIf="recalculationConflictMessage" data-testid="recalc-conflict">
        <div>
          <strong>Sin ruta viable</strong>
          <p>{{ recalculationConflictMessage }}</p>
          <p *ngIf="recalculationConflictPortNames.length > 0">
            Puertos evitados: {{ recalculationConflictPortNames.join(", ") }}
          </p>
        </div>
        <button class="detail-btn danger" (click)="backRequested.emit()">Volver atrás</button>
      </div>

      <div class="recalc-alert error" *ngIf="recalculationErrorMessage" data-testid="recalc-error">
        {{ recalculationErrorMessage }}
      </div>

      <!-- Información de la Ruta -->
      <div class="route-info" *ngIf="currentRouteData">
        <div class="info-card">
          <h4>Información de la Ruta</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Distancia Total:</span>
              <span class="value">{{ currentRouteData?.totalDistance | number : "1.0-0" }} millas náuticas</span>
            </div>
            <div class="info-item">
              <span class="label">Puertos en la Ruta:</span>
              <span class="value">{{ routePorts.length }}</span>
            </div>
            <div class="info-item" *ngIf="currentPortIndex >= 0 && routePorts[currentPortIndex]">
              <span class="label">Puerto Actual:</span>
              <span class="value">{{ routePorts[currentPortIndex].name }}</span>
            </div>
            <div class="info-item" *ngIf="currentPortIndex >= 0 && routePorts[currentPortIndex + 1]">
              <span class="label">Próximo Puerto:</span>
              <span class="value">{{ routePorts[currentPortIndex + 1].name }}</span>
            </div>
            <div class="info-item" *ngIf="geoJsonLoaded">
              <span class="label">Detección de Tierra:</span>
              <span class="value">✓ Activa ({{ geoJsonFeatureCount }} características)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Controles de Animación (movido debajo de Información de la Ruta) -->
      <div class="animation-controls">
        <div class="control-group">
          <button
            class="control-btn"
            [class.active]="isAnimating"
            (click)="toggleAnimation()"
            [disabled]="!routePoints || routePoints.length === 0"
          >
            <svg
              *ngIf="!isAnimating"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <svg
              *ngIf="isAnimating"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            {{ isAnimating ? "Pausar" : "Iniciar" }} Animación
          </button>

          <button class="control-btn" (click)="resetAnimation()" [disabled]="!routePoints || routePoints.length === 0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Reiniciar
          </button>
        </div>

        <div class="speed-control">
          <label for="speed-slider">Velocidad:</label>
          <input
            id="speed-slider"
            type="range"
            min="1"
            max="10"
            [(ngModel)]="animationSpeed"
            (input)="updateAnimationSpeed()"
            class="speed-slider"
          />
          <span class="speed-value">{{ animationSpeed }}x</span>
        </div>
      </div>

      <!-- Mapa -->
      <div class="map-container">
        <div id="route-map" class="map"></div>
      </div>

      <!-- Lista de Puertos -->
      <div class="ports-list" *ngIf="routePorts.length > 0">
        <h4>Puertos en la Ruta</h4>
        <div class="ports-grid">
          <div
            *ngFor="let port of routePorts; let i = index"
            class="port-item"
            [class.current]="i === currentPortIndex"
            [class.visited]="i < currentPortIndex"
            [class.pending]="i > currentPortIndex"
          >
            <div class="port-number">{{ i + 1 }}</div>
            <div class="port-details">
              <div class="port-name">{{ port.name }}</div>
              <div class="port-coordinates">
                {{ port.coordinates.latitude | number : "1.4-4" }}°,
                {{ port.coordinates.longitude | number : "1.4-4" }}°
              </div>
            </div>
            <div class="port-status">
              <svg
                *ngIf="i < currentPortIndex"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="status-icon visited"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <svg
                *ngIf="i === currentPortIndex"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="status-icon current"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <svg
                *ngIf="i > currentPortIndex"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="status-icon pending"
              >
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .route-animation-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background-color: white;
        border-radius: 0.5rem;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .animation-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background-color: #f8fafc;
        border-radius: 0.375rem;
        border: 1px solid #e2e8f0;
      }

      .control-group {
        display: flex;
        gap: 0.5rem;
      }

      .control-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background-color: #0a6cbc;
        color: white;
        border: none;
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms ease;

        &:hover:not(:disabled) {
          background-color: #084e88;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &.active {
          background-color: #dc2626;

          &:hover {
            background-color: #b91c1c;
          }
        }

        svg {
          flex-shrink: 0;
        }
      }

      .speed-control {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;

        label {
          font-weight: 500;
          color: #374151;
        }
      }

      .speed-slider {
        width: 100px;
        height: 4px;
        border-radius: 2px;
        background: #e2e8f0;
        outline: none;
        cursor: pointer;

        &::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #0a6cbc;
          cursor: pointer;
        }

        &::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #0a6cbc;
          cursor: pointer;
          border: none;
        }
      }

      .speed-value {
        font-weight: 600;
        color: #0a6cbc;
        min-width: 2rem;
        text-align: center;
      }

      .geojson-status {
        padding: 0.75rem;
        background-color: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 0.375rem;
        color: #92400e;
      }

      .loading-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .recalc-banner,
      .recalc-alert {
        margin-bottom: 1rem;
        border-radius: 0.75rem;
        padding: 0.85rem 1rem;
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: center;
      }

      .recalc-banner {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(59, 130, 246, 0.4);
        color: #bfdbfe;
      }

      .recalc-alert.info {
        background: rgba(14, 165, 233, 0.15);
        border: 1px solid rgba(14, 165, 233, 0.3);
        color: #e0f2fe;
      }

      .recalc-alert.warning {
        background: rgba(249, 115, 22, 0.15);
        border: 1px solid rgba(251, 146, 60, 0.4);
        color: #fed7aa;
      }

      .recalc-alert.error {
        background: rgba(248, 113, 113, 0.15);
        border: 1px solid rgba(248, 113, 113, 0.3);
        color: #fecaca;
      }

      .detail-btn {
        border: none;
        padding: 0.45rem 0.85rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        background: rgba(15, 23, 42, 0.2);
        color: inherit;
      }

      .detail-btn:hover {
        background: rgba(15, 23, 42, 0.35);
      }

      .detail-btn.danger {
        border: 1px solid rgba(248, 113, 113, 0.5);
      }

      .alt-details {
        border: 1px dashed rgba(148, 163, 184, 0.4);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        color: #0f172a;
        background: #f1f5f9;
        margin-bottom: 1.25rem;
      }

      .alt-details h5 {
        margin: 0.25rem 0;
        font-size: 0.9rem;
      }

      .alt-details ul {
        margin: 0.5rem 0 0.75rem 1rem;
      }

      .alt-details pre {
        background: #0f172a;
        color: #e2e8f0;
        padding: 0.5rem;
        border-radius: 0.5rem;
        overflow-x: auto;
      }

      .animate-spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .detection-info {
        margin-bottom: 1rem;
      }

      .detection-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 0.75rem;
      }

      .detection-item {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .label {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .value {
          font-size: 0.875rem;
          color: #0f172a;
          font-weight: 600;

          &.crosses {
            color: #dc2626;
          }
        }
      }

      .route-info {
        margin-bottom: 1rem;
      }

      .info-card {
        background-color: #f8fafc;
        border-radius: 0.375rem;
        padding: 1rem;
        border: 1px solid #e2e8f0;

        h4 {
          margin: 0 0 0.75rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .label {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .value {
          font-size: 0.875rem;
          color: #0f172a;
          font-weight: 600;
        }
      }

      .map-container {
        position: relative;
        height: 400px;
        border-radius: 0.375rem;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      }

      .map {
        width: 100%;
        height: 100%;
      }

      .ports-list {
        margin-top: 1rem;

        h4 {
          margin: 0 0 0.75rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
        }
      }

      .ports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 0.5rem;
      }

      .port-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background-color: #f8fafc;
        border-radius: 0.375rem;
        border: 1px solid #e2e8f0;
        transition: all 150ms ease;

        &.current {
          background-color: rgba(10, 108, 188, 0.1);
          border-color: #0a6cbc;
        }

        &.visited {
          background-color: rgba(34, 197, 94, 0.1);
          border-color: #22c55e;
        }

        &.pending {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
        }
      }

      .port-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        background-color: #e2e8f0;
        color: #475569;
        border-radius: 50%;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
      }

      .port-item.current .port-number {
        background-color: #0a6cbc;
        color: white;
      }

      .port-item.visited .port-number {
        background-color: #22c55e;
        color: white;
      }

      .port-details {
        flex: 1;
        min-width: 0;
      }

      .port-name {
        font-weight: 600;
        color: #0f172a;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }

      .port-coordinates {
        font-size: 0.75rem;
        color: #64748b;
        font-family: monospace;
      }

      .port-status {
        flex-shrink: 0;
      }

      .status-icon {
        &.visited {
          color: #22c55e;
        }

        &.current {
          color: #0a6cbc;
        }

        &.pending {
          color: #94a3b8;
        }
      }

      @media (max-width: 768px) {
        .animation-controls {
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
        }

        .control-group {
          justify-content: center;
        }

        .speed-control {
          justify-content: center;
        }

        .info-grid {
          grid-template-columns: 1fr;
        }

        .detection-grid {
          grid-template-columns: 1fr;
        }

        .ports-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class RouteAnimationComponent implements OnInit, OnDestroy, OnChanges {
  @Input() originPortName = ""
  @Input() destinationPortName = ""
  @Input() intermediatePorts: Port[] = []
  @Input() routeData: RouteCalculationResource | null = null
  @Input() routeId: string | null = null
  @Output() backRequested = new EventEmitter<void>()

  private map: L.Map | null = null
  private shipMarkers: L.Marker[] = [] // Array of ship markers for different world copies
  private routePolylines: L.Polyline[] = [] // Array of route polylines for different world copies
  private traveledPolylines: L.Polyline[] = [] // Array of traveled polylines for different world copies
  private portMarkers: L.Marker[] = []
  private animationInterval: any = null

  // Propiedades de animación
  isAnimating = false
  animationSpeed = 3
  currentPointIndex = 0
  currentPortIndex = 0

  // Datos de la ruta
  routePoints: L.LatLng[] = []
  routePorts: RoutePort[] = []
  currentRouteData: RouteCalculationResource | null = null
  disabledPortsInRoute: string[] = []
  recalculationConflictPortNames: string[] = []
  recalculationConflictMessage = ""
  recalculationErrorMessage = ""
  recalculationInfoVisible = false
  showAlternativeDetails = false
  isRecalculatingRoute = false

  // Datos GeoJSON para detección de tierra
  private geoJsonData: GeoJSONData | null = null
  geoJsonLoaded = false
  geoJsonFeatureCount = 0

  // Información de detección para debugging
  lastDetectionInfo: {
    directLineCrossesLand: boolean
    testPoints: number
    intersections: number
    curveDirection: number
  } | null = null

  // Iconos personalizados
  private shipIcon = L.divIcon({
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #dc2626;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 6px solid white;
        "></div>
      </div>
    `,
    className: "ship-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  // Add these properties after the existing ones
  private adminPortsIndex = new Map<string, PortAdminRecord>()
  private recalculationConflictSignature: string | null = null
  private userInteracting = false
  private interactionTimeout: any = null

  constructor(
    private portService: PortService,
    private routeService: RouteService,
  ) {}

  ngOnInit(): void {
    this.initializeMap()
    this.loadGeoJSON()
  }

  ngOnDestroy(): void {
    this.stopAnimation()

    // Limpiar timeout de interacción
    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout)
    }

    if (this.map) {
      this.map.remove()
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["routeId"] && !changes["routeId"].firstChange) {
      this.recalculationConflictSignature = null
    }

    if (changes["routeData"]) {
      this.currentRouteData = this.routeData
      if (this.currentRouteData) {
        console.log("RouteData recibida:", this.currentRouteData)
      }
      this.processRouteData()
      this.evaluatePortsAvailability()
    }
  }

  toggleAnimation(): void {
    if (this.isAnimating) {
      this.stopAnimation()
    } else {
      this.startAnimation()
    }
  }

  resetAnimation(): void {
    this.stopAnimation()
    this.currentPointIndex = 0
    this.currentPortIndex = 0

    if (this.shipMarkers.length > 0 && this.routePoints.length > 0) {
      this.updateShipMarkers(this.routePoints[0])
    }

    // Reset traveled polylines
    this.updateTraveledPolylines([])
  }

  updateAnimationSpeed(): void {
    if (this.isAnimating) {
      this.stopAnimation()
      this.startAnimation()
    }
  }

  private async loadGeoJSON(): Promise<void> {
    try {
      console.log("Cargando datos GeoJSON locales...")

      // Usar el archivo GeoJSON local del proyecto
      const response = await fetch("/assets/data/land-polygons.geojson")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      this.geoJsonData = await response.json()
      this.geoJsonLoaded = true
      this.geoJsonFeatureCount = this.geoJsonData?.features?.length || 0
      console.log("GeoJSON local cargado exitosamente:", this.geoJsonFeatureCount, "características")

      // Si ya tenemos datos de ruta, reprocesarlos con la nueva información geográfica
      if (this.currentRouteData) {
        this.processRouteData()
      }
    } catch (error) {
      console.error("Error cargando GeoJSON local:", error)
      console.log("Intentando cargar GeoJSON de respaldo...")

      // Fallback al GeoJSON externo si el local falla
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        this.geoJsonData = await response.json()
        this.geoJsonLoaded = true
        this.geoJsonFeatureCount = this.geoJsonData?.features?.length || 0
        console.log("GeoJSON de respaldo cargado:", this.geoJsonFeatureCount, "características")

        if (this.currentRouteData) {
          this.processRouteData()
        }
      } catch (fallbackError) {
        console.error("Error cargando GeoJSON de respaldo:", fallbackError)
        console.log("Continuando sin detección precisa de tierra...")
        this.geoJsonLoaded = false
      }
    }
  }

  private initializeMap(): void {
    // Inicializar el mapa con worldCopyJump habilitado para mejor manejo del antimeridiano
    this.map = L.map("route-map", { worldCopyJump: true }).setView([20, 0], 2)

    // Añadir capa de mapa
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(this.map)

    // Configurar seguimiento de interacción del usuario
    this.setupInteractionTracking()

    // Procesar datos de ruta si ya están disponibles
    if (this.currentRouteData) {
      this.processRouteData()
    }
  }

  private processRouteData(): void {
    if (!this.currentRouteData || !this.map) {
      console.log("No hay datos de ruta o mapa no inicializado")
      return
    }

    const activeRoute = this.currentRouteData
    console.log("Procesando datos de ruta:", activeRoute)

    // Limpiar datos anteriores
    this.clearMap()
    this.routePorts = []
    this.routePoints = []

    // Verificar si tenemos coordinatesMapping (datos reales de la API)
    if (activeRoute.coordinatesMapping && activeRoute.optimalRoute) {
      console.log("Usando datos reales de la API")

      // Extraer puertos de la ruta óptima
      const portNames = activeRoute.optimalRoute
      console.log("Nombres de puertos en la ruta:", portNames)

      // Crear array de puertos con sus coordenadas
      portNames.forEach((portName) => {
        const coordinates = activeRoute.coordinatesMapping![portName]
        if (coordinates) {
          this.routePorts.push({
            name: portName,
            coordinates: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            },
          })
        } else {
          console.warn(`No se encontraron coordenadas para el puerto: ${portName}`)
        }
      })

      console.log("Puertos procesados:", this.routePorts)

      // Cargar puertos y dibujar ruta
      this.loadPortsAndDrawRoute()
    } else {
      console.log("Usando datos simulados")
      // Fallback a datos simulados
      this.createSimulatedRoute()
    }
  }

  toggleAlternativeDetails(): void {
    this.showAlternativeDetails = !this.showAlternativeDetails
  }

  private evaluatePortsAvailability(): void {
    const routeNames = this.collectRoutePortNames()

    if (routeNames.length === 0) {
      if (!this.recalculationInfoVisible) {
        this.disabledPortsInRoute = []
      }
      this.recalculationConflictMessage = ""
      return
    }

    this.portService.getAdminPorts().subscribe({
      next: (ports) => {
        this.adminPortsIndex = new Map(ports.map((port) => [port.id, port]))
        const metadataPortIds = this.extractMetadataPortIds()

        const disabledMatches = ports.filter(
          (port) => port.disabled && this.matchesRoutePort(port, routeNames, metadataPortIds),
        )

        if (disabledMatches.length === 0) {
          if (!this.recalculationInfoVisible) {
            this.disabledPortsInRoute = []
          }
          if (!this.isRecalculatingRoute) {
            this.recalculationConflictMessage = ""
            this.recalculationErrorMessage = ""
          }
          return
        }

        this.disabledPortsInRoute = disabledMatches.map((port) => port.name)
        this.recalculationErrorMessage = ""

        if (!this.routeId) {
          this.recalculationErrorMessage =
            "Se detectaron puertos deshabilitados pero falta el identificador de la ruta para recalcular."
          return
        }

        const signature = this.buildDisabledSignature(disabledMatches)
        if (this.isRecalculatingRoute || this.recalculationConflictSignature === signature) {
          return
        }

        this.triggerRouteRecalculation(disabledMatches, signature)
      },
      error: (error) => {
        this.recalculationErrorMessage =
          error?.error?.message || error?.message || "No se pudo verificar el estado de los puertos."
      },
    })
  }

  private triggerRouteRecalculation(disabledPorts: PortAdminRecord[], signature: string): void {
    if (!this.routeId) return

    const avoidedPortIds = disabledPorts.map((port) => port.id).filter((id): id is string => !!id)

    this.isRecalculatingRoute = true
    this.recalculationConflictMessage = ""
    this.recalculationErrorMessage = ""
    this.recalculationInfoVisible = false
    this.showAlternativeDetails = false

    this.routeService.recalculateRoute(this.routeId, { avoidedPortIds }).subscribe({
      next: (route) => {
        this.isRecalculatingRoute = false
        this.recalculationConflictSignature = null
        this.currentRouteData = route
        this.recalculationInfoVisible = true
        this.recalculationConflictMessage = ""
        this.recalculationErrorMessage = ""
        this.recalculationConflictPortNames = []
        this.processRouteData()
      },
      error: (error) => {
        this.isRecalculatingRoute = false
        if (error?.status === 409) {
          this.recalculationConflictMessage =
            error.error?.message || "No existe una ruta viable evitando los puertos deshabilitados."
          const avoidedIds: string[] = Array.isArray(error.error?.avoidedPortIds) ? error.error.avoidedPortIds : []
          this.recalculationConflictPortNames = avoidedIds.map((id) => this.adminPortsIndex.get(id)?.name || id)
          this.recalculationConflictSignature = signature
        } else {
          this.recalculationErrorMessage =
            error?.error?.message || error?.message || "No se pudo recalcular la ruta."
          this.recalculationConflictSignature = null
        }
      },
    })
  }

  private collectRoutePortNames(): string[] {
    if (this.currentRouteData?.optimalRoute?.length) {
      return this.currentRouteData.optimalRoute
    }

    const names: string[] = []
    if (this.originPortName) {
      names.push(this.originPortName)
    }

    if (this.intermediatePorts?.length) {
      names.push(...this.intermediatePorts.map((port) => port.name))
    }

    if (this.destinationPortName) {
      names.push(this.destinationPortName)
    }

    return names.filter((name) => !!name)
  }

  private extractMetadataPortIds(): string[] {
    const metadataPortIds = this.currentRouteData?.metadata?.portIds
    return Array.isArray(metadataPortIds) ? metadataPortIds : []
  }

  private matchesRoutePort(port: PortAdminRecord, routeNames: string[], metadataPortIds: string[]): boolean {
    const normalizedName = port.name?.toLowerCase()
    const nameMatch = routeNames.some((name) => name?.toLowerCase() === normalizedName)
    const idMatch = port.id ? metadataPortIds.includes(port.id) : false
    return nameMatch || idMatch
  }

  private buildDisabledSignature(disabledPorts: PortAdminRecord[]): string {
    const identifiers = disabledPorts.map((port) => port.id || port.name).sort()
    return `${this.routeId ?? "no-route"}:${identifiers.join("|")}`
  }
  private loadPortsAndDrawRoute(): void {
    if (!this.map || this.routePorts.length === 0) {
      console.log("No hay mapa o puertos para mostrar")
      return
    }

    console.log("Cargando puertos y dibujando ruta. Puertos:", this.routePorts)

    // Mostrar TODOS los puertos de la ruta óptima
    this.routePorts.forEach((port, index) => {
      console.log(`Procesando puerto ${index + 1}:`, port.name, port.coordinates)

      // Determinar el tipo de puerto
      let portType: "origin" | "destination" | "route-port"

      if (index === 0) {
        portType = "origin"
      } else if (index === this.routePorts.length - 1) {
        portType = "destination"
      } else {
        portType = "route-port"
      }

      console.log(`Puerto ${port.name} será marcado como: ${portType}`)

      // Añadir el marcador del puerto
      this.addPortMarkerFromCoordinates(port.name, port.coordinates, portType)
    })

    // Crear puntos de ruta suaves conectando todos los puertos
    this.createRoutePointsFromRealPorts()

    // Ajustar el mapa para mostrar todos los puertos
    setTimeout(() => {
      this.fitMapToBounds()
    }, 100)
  }

  private createRoutePointsFromRealPorts(): void {
    if (this.routePorts.length < 2) {
      console.log("No hay suficientes puertos para crear una ruta")
      return
    }

    this.routePoints = []
    let previousSegmentEndPointLatLng: L.LatLng | null = null

    for (let i = 0; i < this.routePorts.length - 1; i++) {
      const currentPortData = this.routePorts[i] // { name, coordinates: {latitude, longitude} }
      const nextPortData = this.routePorts[i + 1] // { name, coordinates: {latitude, longitude} }

      let segmentStartCoordinates: PortCoordinates

      if (i === 0) {
        // Para el primer segmento, usar las coordenadas originales del puerto de inicio
        segmentStartCoordinates = currentPortData.coordinates
      } else {
        // Para segmentos subsecuentes, el inicio debe ser el final del segmento anterior
        // para mantener la continuidad de la longitud desenrollada.
        if (!previousSegmentEndPointLatLng) {
          console.error(
            `Error crítico: previousSegmentEndPointLatLng es nulo para el segmento ${i}. Usando coordenadas normalizadas como fallback.`,
          )
          // Fallback (aunque esto no debería ocurrir en un flujo normal)
          segmentStartCoordinates = currentPortData.coordinates
        } else {
          segmentStartCoordinates = {
            latitude: currentPortData.coordinates.latitude, // La latitud es la del puerto actual
            longitude: previousSegmentEndPointLatLng.lng, // La longitud es la desenrollada del final del segmento anterior
          }
        }
      }

      console.log(
        `\n=== Creando ruta desde ${currentPortData.name} (Lat: ${segmentStartCoordinates.latitude.toFixed(4)}, Lng: ${segmentStartCoordinates.longitude.toFixed(4)}) ` +
        `hacia ${nextPortData.name} (Lat: ${nextPortData.coordinates.latitude.toFixed(4)}, Lng: ${nextPortData.coordinates.longitude.toFixed(4)}) ===`,
      )

      const curvePoints = this.createIntelligentMaritimeCurve(
        segmentStartCoordinates,
        nextPortData.coordinates, // Las coordenadas del puerto de destino son siempre las originales/normalizadas
        50, // numPoints
      )

      if (curvePoints && curvePoints.length > 0) {
        if (i === 0) {
          this.routePoints.push(...curvePoints)
        } else {
          // Añadir puntos de la curva, omitiendo el primero para evitar duplicados,
          // ya que curvePoints[0] es geográficamente el mismo que previousSegmentEndPointLatLng.
          this.routePoints.push(...curvePoints.slice(1))
        }
        // Guardar el último punto de la curva actual (con longitud desenrollada)
        // para usarlo como inicio del siguiente segmento.
        previousSegmentEndPointLatLng = curvePoints[curvePoints.length - 1]
      } else {
        console.warn(
          `No se generaron puntos de curva para el segmento: ${currentPortData.name} -> ${nextPortData.name}`,
        )
        // Si no se generan puntos, el siguiente segmento podría tener problemas para encontrar previousSegmentEndPointLatLng.
        // Considerar cómo manejar este caso si es posible. Por ahora, se asume que siempre se generan puntos.
        // Si es necesario, se podría intentar establecer previousSegmentEndPointLatLng a un valor basado en nextPortData,
        // pero esto podría reintroducir problemas de salto si nextPortData está en un "mundo" diferente.
      }
    }

    console.log(`\nRuta marítima inteligente creada con ${this.routePoints.length} puntos`)

    // Logging detallado para debugging del antimeridiano
    if (this.routePoints.length > 0) {
      console.log("=== ANÁLISIS DE PUNTOS DE RUTA ===")
      console.log("Primer punto:", { lat: this.routePoints[0].lat.toFixed(4), lng: this.routePoints[0].lng.toFixed(4) })
      console.log("Último punto:", {
        lat: this.routePoints[this.routePoints.length - 1].lat.toFixed(4),
        lng: this.routePoints[this.routePoints.length - 1].lng.toFixed(4),
      })

      let maxLngJump = 0
      let jumpIndex = -1
      for (let k = 1; k < this.routePoints.length; k++) {
        const lngDiff = Math.abs(this.routePoints[k].lng - this.routePoints[k - 1].lng)
        if (lngDiff > maxLngJump) {
          maxLngJump = lngDiff
          jumpIndex = k
        }
      }

      if (maxLngJump > 180) {
        // Un salto mayor a 180 grados es problemático
        console.warn(`⚠️ SALTO BRUSCO DETECTADO en índice ${jumpIndex}:`)
        console.warn(
          `  Punto ${jumpIndex - 1}: lat=${this.routePoints[jumpIndex - 1].lat.toFixed(4)}, lng=${this.routePoints[jumpIndex - 1].lng.toFixed(4)}`,
        )
        console.warn(
          `  Punto ${jumpIndex}: lat=${this.routePoints[jumpIndex].lat.toFixed(4)}, lng=${this.routePoints[jumpIndex].lng.toFixed(4)}`,
        )
        console.warn(`  Diferencia de longitud: ${maxLngJump.toFixed(4)}°`)
      } else {
        console.log(
          "✓ Análisis de saltos de longitud: No se detectaron saltos bruscos (>180°). Máximo salto: ",
          maxLngJump.toFixed(4) + "°",
        )
      }

      const samplePoints = this.routePoints.filter(
        (_, index) => index % Math.max(1, Math.floor(this.routePoints.length / 20)) === 0,
      )
      console.log(
        "Muestra de puntos de ruta (cada ~5%):",
        samplePoints.map((p) => ({ lat: p.lat.toFixed(2), lng: p.lng.toFixed(2) })),
      )
    }

    this.drawRoute()
  }

  private createIntelligentMaritimeCurve(start: PortCoordinates, end: PortCoordinates, numPoints: number): L.LatLng[] {
    console.log(
      `Creando curva inteligente de [${start.latitude}, ${start.longitude}] a [${end.latitude}, ${end.longitude}]`,
    )

    // Primero, verificar si la línea directa cruza tierra con alta precisión
    const directLineCrossesLand = this.doesLineIntersectLandPrecise(start, end)

    // Información para debugging
    this.lastDetectionInfo = {
      directLineCrossesLand,
      testPoints: 100, // Usamos 100 puntos para la detección precisa
      intersections: 0,
      curveDirection: 0,
    }

    if (!directLineCrossesLand) {
      console.log("✓ Línea directa no cruza tierra, usando ruta recta")
      this.lastDetectionInfo.curveDirection = 0
      return this.createStraightLine(start, end, numPoints)
    }

    console.log("⚠ Línea directa cruza tierra, buscando ruta alternativa...")

    // Buscar la mejor curvatura usando múltiples intentos
    const bestCurve = this.findBestCurveDirection(start, end, numPoints)
    this.lastDetectionInfo.curveDirection = bestCurve.direction
    this.lastDetectionInfo.intersections = bestCurve.intersections

    console.log(
      `✓ Mejor curvatura encontrada: ${bestCurve.direction > 0 ? "ESTE" : "OESTE"} (${bestCurve.intersections} intersecciones)`,
    )

    return bestCurve.points
  }

  private doesLineIntersectLandPrecise(
    start: PortCoordinates, // Las coordenadas pueden estar desenrolladas si vienen de un segmento de curva
    end: PortCoordinates, // Las coordenadas pueden estar desenrolladas
    numTestSegments = 100, // Valor por defecto para la prueba de línea recta inicial entre puertos
  ): boolean {
    if (!this.geoJsonData) {
      return false
    }

    const deltaLat = end.latitude - start.latitude
    let actualDeltaLng: number

    // Determinar el deltaLng a usar para la interpolación.
    // Si las longitudes de inicio y fin ya están "cerca" en el espacio desenrollado
    // (lo que es cierto para segmentos adyacentes de una curva generada con longitudes desenrolladas),
    // entonces la diferencia directa es lo que queremos interpolar.
    // Si están lejos (como las coordenadas originales de los puertos para la prueba de línea recta inicial),
    // necesitamos calcular el camino más corto.
    const directLngDiff = end.longitude - start.longitude

    if (numTestSegments < 100 && Math.abs(directLngDiff) < 200) {
      // Heurística: si es una prueba de segmento de curva (menos testPoints)
      // Y la diferencia directa no es masiva (evitar errores si se pasa algo raro)
      // entonces usar la diferencia directa.
      actualDeltaLng = directLngDiff
    } else {
      // Para la prueba de línea recta inicial (numTestSegments = 100 por defecto)
      // o si la diferencia directa es muy grande, usar el cálculo del camino más corto.
      actualDeltaLng = this.calculateShortestLongitudeDelta(start.longitude, end.longitude)
    }

    // El primer punto del primer sub-segmento, normalizado para la prueba de intersección.
    // start.longitude aquí puede estar desenrollado.
    let p1_normalized = { lat: start.latitude, lng: this.normalizeLongitude(start.longitude) }
    console.log(
      `doesLineIntersectLandPrecise: Probando de ${JSON.stringify(start)} a ${JSON.stringify(end)} con deltaLng ${actualDeltaLng.toFixed(2)} y ${numTestSegments} segmentos.`,
    )

    for (let k = 1; k <= numTestSegments; k++) {
      const t = k / numTestSegments
      const currentLat = start.latitude + t * deltaLat
      // Interpolar usando actualDeltaLng sobre el start.longitude original (que puede estar desenrollado)
      const currentLng_unwrapped = start.longitude + t * actualDeltaLng
      const p2_normalized = { lat: currentLat, lng: this.normalizeLongitude(currentLng_unwrapped) }

      if (this.doesSegmentIntersectLand(p1_normalized, p2_normalized)) {
        console.log(
          `Intersección en doesLineIntersectLandPrecise: sub-segmento ${JSON.stringify(p1_normalized)} -> ${JSON.stringify(p2_normalized)} cruza tierra.`,
        )
        return true
      }
      p1_normalized = p2_normalized
    }
    console.log(`doesLineIntersectLandPrecise: No se encontraron intersecciones para el segmento.`)
    return false
  }

  private doesSegmentIntersectLand(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): boolean {
    if (!this.geoJsonData) return false

    // Verificar si alguno de los puntos está en tierra
    if (this.isPointOnLand(point1.lat, point1.lng) || this.isPointOnLand(point2.lat, point2.lng)) {
      return true
    }

    // Verificar intersección de línea con polígonos de tierra
    const lineSegment: LineSegment = {
      start: point1,
      end: point2,
    }

    for (const feature of this.geoJsonData.features) {
      if (this.doesLineIntersectFeature(lineSegment, feature)) {
        return true
      }
    }

    return false
  }

  private doesLineIntersectFeature(line: LineSegment, feature: GeoJSONFeature): boolean {
    if (feature.geometry.type === "Polygon") {
      const coordinates = feature.geometry.coordinates as number[][][]
      return coordinates.some((ring) => this.doesLineIntersectPolygon(line, ring))
    } else if (feature.geometry.type === "MultiPolygon") {
      const coordinates = feature.geometry.coordinates as number[][][][]
      return coordinates.some((polygon) => polygon.some((ring) => this.doesLineIntersectPolygon(line, ring)))
    }
    return false
  }

  private doesLineIntersectPolygon(line: LineSegment, polygon: number[][]): boolean {
    // Verificar intersección con cada borde del polígono
    for (let i = 0; i < polygon.length - 1; i++) {
      const edge = {
        start: { lat: polygon[i][1], lng: polygon[i][0] },
        end: { lat: polygon[i + 1][1], lng: polygon[i + 1][0] },
      }

      if (this.doLinesIntersect(line, edge)) {
        return true
      }
    }
    return false
  }

  private doLinesIntersect(line1: LineSegment, line2: LineSegment): boolean {
    // Algoritmo de intersección de líneas usando determinantes
    const x1 = line1.start.lng,
      y1 = line1.start.lat
    const x2 = line1.end.lng,
      y2 = line1.end.lat
    const x3 = line2.start.lng,
      y3 = line2.start.lat
    const x4 = line2.end.lng,
      y4 = line2.end.lat

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

    if (Math.abs(denom) < 1e-10) {
      return false // Líneas paralelas
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

    return t >= 0 && t <= 1 && u >= 0 && u <= 1
  }

  // Reemplazar la función findBestCurveDirection con esta versión mejorada
  private findBestCurveDirection(
    start: PortCoordinates,
    end: PortCoordinates,
    numPoints: number,
  ): {
    direction: number
    points: L.LatLng[]
    intersections: number
  } {
    const testDirections = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2] // Múltiples direcciones y intensidades

    const candidates: Array<{
      direction: number
      points: L.LatLng[]
      intersections: number
      absDirection: number
    }> = []

    console.log(`findBestCurveDirection: Buscando curva entre ${JSON.stringify(start)} y ${JSON.stringify(end)}`)

    for (const dir of testDirections) {
      const currentPoints = this.createCurveWithDirection(start, end, dir, numPoints)
      const currentIntersections = this.countCurveIntersections(currentPoints)
      console.log(`Probando dirección ${dir}: ${currentIntersections} intersecciones`)
      candidates.push({
        direction: dir,
        points: currentPoints,
        intersections: currentIntersections,
        absDirection: Math.abs(dir),
      })
    }

    // Ordenar los candidatos
    candidates.sort((a, b) => {
      // Prioridad 1: Menor número de intersecciones
      if (a.intersections !== b.intersections) {
        return a.intersections - b.intersections
      }
      // Prioridad 2: Menor magnitud de curvatura (absDirection)
      if (a.absDirection !== b.absDirection) {
        return a.absDirection - b.absDirection
      }
      // Prioridad 3: Preferir dirección positiva (Este) si todo lo demás es igual
      if (a.direction > 0 && b.direction < 0) return -1
      if (a.direction < 0 && b.direction > 0) return 1
      return 0 // Mismo signo o ambos cero
    })

    // El mejor candidato es el primero después de ordenar
    const bestCandidate = candidates[0]

    if (bestCandidate) {
      console.log(
        `Mejor opción elegida: dirección ${bestCandidate.direction}, intersecciones: ${bestCandidate.intersections}, absDirección: ${bestCandidate.absDirection}`,
      )
      return {
        direction: bestCandidate.direction,
        points: bestCandidate.points,
        intersections: bestCandidate.intersections,
      }
    }

    // Fallback: si algo salió mal y no hay candidatos (no debería pasar con testDirections no vacío)
    console.warn(
      "findBestCurveDirection: No se encontraron candidatos de curva válidos, devolviendo línea recta original.",
    )
    const straightLinePoints = this.createStraightLine(start, end, numPoints)
    return {
      direction: 0, // Indica línea recta
      points: straightLinePoints,
      intersections: this.countCurveIntersections(straightLinePoints),
    }
  }

  private createCurveWithDirection(
    start: PortCoordinates,
    end: PortCoordinates,
    direction: number,
    numPoints: number,
  ): L.LatLng[] {
    const points: L.LatLng[] = []
    const deltaLat = end.latitude - start.latitude

    // Calcular deltaLng para el camino más corto (crucial para antimeridiano)
    const deltaLng = this.calculateShortestLongitudeDelta(start.longitude, end.longitude)
    const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng)

    // Calcular curvatura adaptativa basada en la distancia
    const baseCurvature = Math.min(distance * 0.6, 120)
    const curvature = baseCurvature * Math.abs(direction)

    // Punto medio en espacio desenrollado
    const midLat = (start.latitude + end.latitude) / 2
    const midLng_unwrapped = start.longitude + deltaLng / 2

    // Calcular punto de control perpendicular
    const perpLat = (-deltaLng / distance) * curvature * Math.sign(direction)
    const perpLngOffset = (deltaLat / distance) * curvature * Math.sign(direction)

    const controlLat = midLat + perpLat
    const controlLng_initial = midLng_unwrapped + perpLngOffset

    // Definir longitudes en espacio "desenrollado"
    const p0_lng = start.longitude
    const p2_lng_target = start.longitude + deltaLng // Punto final en espacio desenrollado

    // Ajustar controlLng_initial para estar en el mismo continuo desenrollado
    let p1_lng = controlLng_initial
    const expectedMidLng = p0_lng + deltaLng / 2

    // Si p1_lng está muy lejos del punto medio esperado, ajustarlo
    if (Math.abs(p1_lng - expectedMidLng) > 180) {
      if (deltaLng > 0 && p1_lng < expectedMidLng) {
        p1_lng += 360
      } else if (deltaLng < 0 && p1_lng > expectedMidLng) {
        p1_lng -= 360
      }
    }

    // Asegurar que p1_lng esté en el rango correcto respecto a p0_lng y p2_lng_target
    while (p1_lng - p0_lng > 180) {
      p1_lng -= 360
    }
    while (p0_lng - p1_lng > 180) {
      p1_lng += 360
    }

    // Generar puntos de la curva de Bézier cuadrática en espacio desenrollado
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints
      const lat = Math.pow(1 - t, 2) * start.latitude + 2 * (1 - t) * t * controlLat + Math.pow(t, 2) * end.latitude

      // Interpolación en espacio desenrollado
      const lng_unwrapped = Math.pow(1 - t, 2) * p0_lng + 2 * (1 - t) * t * p1_lng + Math.pow(t, 2) * p2_lng_target

      // NO normalizar aquí para los puntos de la ruta - Leaflet puede manejar longitudes fuera de [-180, 180]
      points.push(L.latLng(lat, lng_unwrapped))
    }

    return points
  }

  // Función auxiliar para calcular el delta de longitud más corto
  private calculateShortestLongitudeDelta(startLng: number, endLng: number): number {
    let delta = endLng - startLng

    // Ajustar para tomar el camino más corto
    if (delta > 180) {
      delta -= 360
    } else if (delta < -180) {
      delta += 360
    }

    return delta
  }

  // Función auxiliar para normalizar longitud al rango [-180, 180]
  private normalizeLongitude(lng: number): number {
    while (lng > 180) {
      lng -= 360
    }
    while (lng < -180) {
      lng += 360
    }
    return lng
  }

  private countCurveIntersections(curvePoints: L.LatLng[]): number {
    if (!this.geoJsonData || curvePoints.length < 2) {
      return 0
    }
    let intersections = 0
    console.log(`countCurveIntersections: Verificando ${curvePoints.length - 1} segmentos de curva.`)

    for (let i = 0; i < curvePoints.length - 1; i++) {
      const p1_unwrapped = curvePoints[i]
      const p2_unwrapped = curvePoints[i + 1]

      const segmentStart: PortCoordinates = { latitude: p1_unwrapped.lat, longitude: p1_unwrapped.lng }
      const segmentEnd: PortCoordinates = { latitude: p2_unwrapped.lat, longitude: p2_unwrapped.lng }

      // Usar un número pequeño de subsegmentos para doesLineIntersectLandPrecise,
      // ya que el segmento de la curva generado por createCurveWithDirection ya es corto.
      // Un valor como 5-10 debería ser suficiente.
      if (this.doesLineIntersectLandPrecise(segmentStart, segmentEnd, 10)) {
        console.log(
          `Intersección contada para segmento de curva: ${JSON.stringify(segmentStart)} -> ${JSON.stringify(segmentEnd)}`,
        )
        intersections++
      }
    }
    console.log(`countCurveIntersections: Total de intersecciones encontradas: ${intersections}`)
    return intersections
  }

  private createStraightLine(start: PortCoordinates, end: PortCoordinates, numPoints: number): L.LatLng[] {
    const points: L.LatLng[] = []
    const deltaLat = end.latitude - start.latitude
    // Usar el delta de longitud más corto
    const shortestDeltaLng = this.calculateShortestLongitudeDelta(start.longitude, end.longitude)

    // Interpolar en el espacio desenrollado
    const p0_lng = start.longitude

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints
      const lat = start.latitude + t * deltaLat
      // Interpolar longitud en espacio desenrollado
      const lng_unwrapped = p0_lng + t * shortestDeltaLng
      // NO normalizar aquí para los puntos de la ruta
      points.push(L.latLng(lat, lng_unwrapped))
    }
    return points
  }

  private isPointOnLand(lat: number, lng: number): boolean {
    if (!this.geoJsonData) return false

    // Verificar si el punto está dentro de algún polígono de tierra
    for (const feature of this.geoJsonData.features) {
      if (feature.geometry.type === "Polygon") {
        const coordinates = feature.geometry.coordinates as number[][][]
        if (coordinates.length > 0 && this.isPointInPolygon(lat, lng, coordinates[0])) {
          return true
        }
      } else if (feature.geometry.type === "MultiPolygon") {
        const coordinates = feature.geometry.coordinates as number[][][][]
        for (const polygon of coordinates) {
          if (polygon.length > 0 && this.isPointInPolygon(lat, lng, polygon[0])) {
            return true
          }
        }
      }
    }
    return false
  }

  private isPointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
    // Algoritmo de ray casting mejorado
    let inside = false
    const x = lng
    const y = lat

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0]
      const yi = polygon[i][1]
      const xj = polygon[j][0]
      const yj = polygon[j][1]

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside
      }
    }

    return inside
  }

  private createSimulatedRoute(): void {
    // Crear una ruta simulada simple si no hay datos reales
    console.log("Creando ruta simulada")

    this.routePorts = [
      { name: this.originPortName || "Puerto Origen", coordinates: { latitude: 35.6895, longitude: 139.6917 } },
      { name: "Puerto Intermedio 1", coordinates: { latitude: 1.3521, longitude: 103.8198 } },
      { name: this.destinationPortName || "Puerto Destino", coordinates: { latitude: -33.0472, longitude: -71.6128 } },
    ]

    this.loadPortsAndDrawRoute()
  }

  private clearMap(): void {
    if (!this.map) return

    // Limpiar marcadores de puertos
    this.portMarkers.forEach((marker) => {
      this.map!.removeLayer(marker)
    })
    this.portMarkers = []

    // Limpiar rutas (múltiples copias)
    this.routePolylines.forEach((polyline) => {
      this.map!.removeLayer(polyline)
    })
    this.routePolylines = []

    this.traveledPolylines.forEach((polyline) => {
      this.map!.removeLayer(polyline)
    })
    this.traveledPolylines = []

    // Limpiar marcadores del barco
    this.shipMarkers.forEach((marker) => {
      this.map!.removeLayer(marker)
    })
    this.shipMarkers = []
  }

  private fitMapToBounds(): void {
    if (!this.map) {
      console.warn("fitMapToBounds: Mapa no disponible.")
      return
    }

    if (this.routePorts.length > 0) {
      // Detectar si la ruta cruza el antimeridiano
      const crossesAntimeridian = this.detectAntimeridianCrossing()

      if (crossesAntimeridian) {
        // Centrar el mapa en el Pacífico para rutas que cruzan el antimeridiano
        console.log("Ruta cruza el antimeridiano, centrando en el Pacífico")

        // Calcular el centro de la ruta considerando el cruce del Pacífico
        const lats = this.routePorts.map((port) => port.coordinates.latitude)
        const avgLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length

        // Centrar en el Pacífico (longitud -150 es aproximadamente el centro del Pacífico)
        this.map.setView([avgLat, -150], 3)
      } else {
        // Para rutas que no cruzan el antimeridiano, usar el enfoque estándar
        const bounds = L.latLngBounds(
          this.routePorts.map((port) => [port.coordinates.latitude, port.coordinates.longitude]),
        )
        this.map.fitBounds(bounds.pad(0.1))
      }
    } else {
      console.warn("fitMapToBounds: No hay puertos para ajustar los límites.")
      this.map.setView([20, 0], 2)
    }
  }

  private detectAntimeridianCrossing(): boolean {
    if (this.routePorts.length < 2) return false

    // Verificar si hay puertos en ambos lados del antimeridiano
    let hasEasternHemisphere = false
    let hasWesternHemisphere = false

    for (const port of this.routePorts) {
      const lng = this.normalizeLongitude(port.coordinates.longitude)
      if (lng > 90 || lng < -90) {
        // Puerto cerca del antimeridiano (longitud > 90° o < -90°)
        if (lng > 0) {
          hasEasternHemisphere = true
        } else {
          hasWesternHemisphere = true
        }
      }
    }

    // Si hay puertos en ambos lados del antimeridiano, la ruta probablemente lo cruza
    return hasEasternHemisphere && hasWesternHemisphere
  }

  private addPortMarkerFromCoordinates(
    portName: string,
    coordinates: PortCoordinates,
    type: "origin" | "destination" | "route-port",
  ): void {
    if (!coordinates || !this.map) {
      console.error(`Coordenadas inválidas para el puerto ${portName}:`, coordinates)
      return
    }

    if (typeof coordinates.latitude !== "number" || typeof coordinates.longitude !== "number") {
      console.error(`Coordenadas no son números válidos para ${portName}:`, coordinates)
      return
    }

    try {
      let iconColor = "#6b7280" // Gris por defecto para puertos intermedios
      let iconSize = 25

      if (type === "origin") {
        iconColor = "#22c55e" // Verde para origen
        iconSize = 30
      } else if (type === "destination") {
        iconColor = "#dc2626" // Rojo para destino
        iconSize = 30
      } else if (type === "route-port") {
        iconColor = "#8b5cf6" // Morado para puertos de ruta
        iconSize = 25
      }

      const iconHtml = `
      <div style="
        width: ${iconSize}px;
        height: ${iconSize}px;
        background-color: ${iconColor};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 4.17 4.42 9.92 6.24 12.11.4.48 1.13.48 1.53 0C14.58 18.92 19 13.17 19 9c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>
      </div>
    `

      const portIcon = L.divIcon({
        html: iconHtml,
        className: `port-marker port-${type}`,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2],
      })

      const popupContent = `
      <div style="text-align: center;">
        <strong>${portName}</strong><br>
        <small>Tipo: ${type === "origin" ? "Origen" : type === "destination" ? "Destino" : "Puerto de Ruta"}</small><br>
        <small>${coordinates.latitude.toFixed(4)}°, ${this.normalizeLongitude(coordinates.longitude).toFixed(4)}°</small>
      </div>
    `

      // Marcador principal
      const mainMarker = L.marker([coordinates.latitude, coordinates.longitude], { icon: portIcon })
        .addTo(this.map)
        .bindPopup(popupContent)
      this.portMarkers.push(mainMarker)
      console.log(`Marcador principal añadido para ${portName} (${type}) en:`, coordinates)

      // Añadir copias de marcadores si worldCopyJump está activo
      if (this.map.options.worldCopyJump) {
        // Copia Este (+360°)
        const markerCopyEast = L.marker([coordinates.latitude, coordinates.longitude + 360], { icon: portIcon })
          .addTo(this.map)
          .bindPopup(popupContent)
        this.portMarkers.push(markerCopyEast)
        console.log(`Marcador copia Este añadido para ${portName} en: ${coordinates.longitude + 360}°`)

        // Copia Oeste (-360°)
        const markerCopyWest = L.marker([coordinates.latitude, coordinates.longitude - 360], { icon: portIcon })
          .addTo(this.map)
          .bindPopup(popupContent)
        this.portMarkers.push(markerCopyWest)
        console.log(`Marcador copia Oeste añadido para ${portName} en: ${coordinates.longitude - 360}°`)
      }
    } catch (error) {
      console.error(`Error al crear marcador para ${portName}:`, error)
    }
  }

  private drawRoute(): void {
    if (!this.map || this.routePoints.length === 0) {
      return
    }

    // Limpiar rutas anteriores
    this.routePolylines.forEach((polyline) => {
      this.map!.removeLayer(polyline)
    })
    this.routePolylines = []

    this.traveledPolylines.forEach((polyline) => {
      this.map!.removeLayer(polyline)
    })
    this.traveledPolylines = []

    // Crear múltiples copias de las líneas de ruta para worldCopyJump
    this.createRoutePolylines()
    this.createTraveledPolylines()
  }

  private createRoutePolylines(): void {
    if (!this.map || this.routePoints.length === 0) return

    const routeOptions = {
      color: "#cbd5e1",
      weight: 4,
      opacity: 0.7,
      noClip: true,
    }

    // Crear polilínea principal
    const mainPolyline = L.polyline(this.routePoints, routeOptions).addTo(this.map)
    this.routePolylines.push(mainPolyline)

    // Crear copias para worldCopyJump si está habilitado
    if (this.map.options.worldCopyJump) {
      // Copia Este (+360°)
      const routePointsEast = this.routePoints.map((point) => L.latLng(point.lat, point.lng + 360))
      const polylineEast = L.polyline(routePointsEast, routeOptions).addTo(this.map)
      this.routePolylines.push(polylineEast)

      // Copia Oeste (-360°)
      const routePointsWest = this.routePoints.map((point) => L.latLng(point.lat, point.lng - 360))
      const polylineWest = L.polyline(routePointsWest, routeOptions).addTo(this.map)
      this.routePolylines.push(polylineWest)
    }

    console.log(`Creadas ${this.routePolylines.length} polilíneas de ruta`)
  }

  private createTraveledPolylines(): void {
    if (!this.map) return

    const traveledOptions = {
      color: "#0a6cbc",
      weight: 4,
      opacity: 0.9,
      noClip: true,
    }

    // Crear polilínea principal (inicialmente vacía)
    const mainTraveledPolyline = L.polyline([], traveledOptions).addTo(this.map)
    this.traveledPolylines.push(mainTraveledPolyline)

    // Crear copias para worldCopyJump si está habilitado
    if (this.map.options.worldCopyJump) {
      // Copia Este (+360°)
      const traveledPolylineEast = L.polyline([], traveledOptions).addTo(this.map)
      this.traveledPolylines.push(traveledPolylineEast)

      // Copia Oeste (-360°)
      const traveledPolylineWest = L.polyline([], traveledOptions).addTo(this.map)
      this.traveledPolylines.push(traveledPolylineWest)
    }

    console.log(`Creadas ${this.traveledPolylines.length} polilíneas de progreso`)
  }

  private updateTraveledPolylines(traveledPoints: L.LatLng[]): void {
    if (this.traveledPolylines.length === 0) return

    // Actualizar polilínea principal
    if (this.traveledPolylines[0]) {
      this.traveledPolylines[0].setLatLngs(traveledPoints)
    }

    // Actualizar copias si existen
    if (this.map?.options.worldCopyJump && this.traveledPolylines.length >= 3) {
      // Copia Este (+360°)
      if (this.traveledPolylines[1]) {
        const traveledPointsEast = traveledPoints.map((point) => L.latLng(point.lat, point.lng + 360))
        this.traveledPolylines[1].setLatLngs(traveledPointsEast)
      }

      // Copia Oeste (-360°)
      if (this.traveledPolylines[2]) {
        const traveledPointsWest = traveledPoints.map((point) => L.latLng(point.lat, point.lng - 360))
        this.traveledPolylines[2].setLatLngs(traveledPointsWest)
      }
    }
  }

  private startAnimation(): void {
    if (!this.routePoints || this.routePoints.length === 0) {
      console.log("No hay puntos de ruta para animar")
      return
    }

    this.isAnimating = true

    // Crear marcadores del barco si no existen (múltiples copias para worldCopyJump)
    if (this.shipMarkers.length === 0 && this.map) {
      this.createShipMarkers(this.routePoints[this.currentPointIndex])
    }

    // Iniciar la animación
    this.animationInterval = setInterval(() => {
      this.animateStep()
    }, 100 / this.animationSpeed)
  }

  private animateStep(): void {
    if (
      this.shipMarkers.length === 0 ||
      this.traveledPolylines.length === 0 ||
      this.currentPointIndex >= this.routePoints.length - 1
    ) {
      this.stopAnimation()
      return
    }

    this.currentPointIndex++
    const currentTargetPoint = this.routePoints[this.currentPointIndex]

    // Actualizar todas las copias del marcador del barco
    this.updateShipMarkers(currentTargetPoint)

    // Actualizar todas las líneas de progreso
    const traveledPoints = this.routePoints.slice(0, this.currentPointIndex + 1)
    this.updateTraveledPolylines(traveledPoints)

    this.updateCurrentPort()
  }

  // Método auxiliar para detectar si el usuario está interactuando con el mapa
  private isUserInteractingWithMap(): boolean {
    return this.userInteracting
  }

  private setupInteractionTracking(): void {
    if (!this.map) return

    // Eventos que indican que el usuario está interactuando
    const interactionEvents = ["mousedown", "touchstart", "wheel", "keydown"]
    const endInteractionEvents = ["mouseup", "touchend", "keyup"]

    interactionEvents.forEach((eventType) => {
      this.map!.on(eventType as any, () => {
        this.userInteracting = true

        // Limpiar timeout anterior
        if (this.interactionTimeout) {
          clearTimeout(this.interactionTimeout)
        }

        // Marcar como no interactuando después de 2 segundos de inactividad
        this.interactionTimeout = setTimeout(() => {
          this.userInteracting = false
        }, 2000)
      })
    })

    endInteractionEvents.forEach((eventType) => {
      this.map!.on(eventType as any, () => {
        // Reducir el tiempo de espera cuando termina la interacción
        if (this.interactionTimeout) {
          clearTimeout(this.interactionTimeout)
        }

        this.interactionTimeout = setTimeout(() => {
          this.userInteracting = false
        }, 1000)
      })
    })
  }

  private stopAnimation(): void {
    this.isAnimating = false
    clearInterval(this.animationInterval)
  }

  private updateCurrentPort(): void {
    if (this.currentPointIndex < this.routePoints.length && this.routePorts.length > 0) {
      const currentLatLng = this.routePoints[this.currentPointIndex]

      // Buscar el puerto más cercano a la posición actual
      let closestPortIndex = -1
      let minDistance = Number.POSITIVE_INFINITY

      for (let i = 0; i < this.routePorts.length; i++) {
        const port = this.routePorts[i]
        const portLatLng = L.latLng(port.coordinates.latitude, port.coordinates.longitude)
        const distance = currentLatLng.distanceTo(portLatLng)

        if (distance < minDistance) {
          minDistance = distance
          closestPortIndex = i
        }
      }

      // Actualizar el índice del puerto actual si se encuentra uno más cercano
      if (closestPortIndex !== -1) {
        this.currentPortIndex = closestPortIndex
      }
    }
  }

  private createShipMarkers(position: L.LatLng): void {
    if (!this.map) return

    // Limpiar marcadores existentes
    this.shipMarkers.forEach((marker) => {
      this.map!.removeLayer(marker)
    })
    this.shipMarkers = []

    // Crear marcador principal
    const mainMarker = L.marker([position.lat, position.lng], {
      icon: this.shipIcon,
    }).addTo(this.map)
    this.shipMarkers.push(mainMarker)

    // Crear copias para worldCopyJump si está habilitado
    if (this.map.options.worldCopyJump) {
      // Copia Este (+360°)
      const markerCopyEast = L.marker([position.lat, position.lng + 360], {
        icon: this.shipIcon,
      }).addTo(this.map)
      this.shipMarkers.push(markerCopyEast)

      // Copia Oeste (-360°)
      const markerCopyWest = L.marker([position.lat, position.lng - 360], {
        icon: this.shipIcon,
      }).addTo(this.map)
      this.shipMarkers.push(markerCopyWest)
    }

    console.log(`Creados ${this.shipMarkers.length} marcadores de barco en posición:`, position)
  }

  private updateShipMarkers(position: L.LatLng): void {
    if (!this.map || this.shipMarkers.length === 0) return

    // Actualizar marcador principal
    if (this.shipMarkers[0]) {
      this.shipMarkers[0].setLatLng([position.lat, position.lng])
    }

    // Actualizar copias si existen
    if (this.map.options.worldCopyJump && this.shipMarkers.length >= 3) {
      // Copia Este
      if (this.shipMarkers[1]) {
        this.shipMarkers[1].setLatLng([position.lat, position.lng + 360])
      }
      // Copia Oeste
      if (this.shipMarkers[2]) {
        this.shipMarkers[2].setLatLng([position.lat, position.lng - 360])
      }
    }
  }
}
