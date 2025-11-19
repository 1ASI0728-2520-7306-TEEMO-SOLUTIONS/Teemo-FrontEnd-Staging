import { Component, OnInit, AfterViewInit, OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import * as L from "leaflet"
import { PortService, Port } from "../../../services/port.service"

@Component({
  selector: "app-map",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container scale-in" style="position:relative">
      <div class="map-header">
        <h3 style="padding-left: 5rem; margin: 0;">Mapa de Puertos Maritimos</h3>
        <div class="map-controls">
          <button class="map-btn" (click)="zoomIn()">Zoom In</button>
          <button class="map-btn" (click)="zoomOut()">Zoom Out</button>
          <button class="map-btn" (click)="resetView()">Reset</button>
        </div>
      </div>

      <div id="map" class="map-canvas"></div>
    </div>
  `,
  styles: [
    `
      .map-container {
        overflow: hidden;
        position: relative;
        margin: 0 calc(-50vw + 50%) 0 calc(-50vw + 50%);
        height: auto;
        width: 100vw;
        left: calc(-50vw + 50%);
      }

      .map-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: #ffffff;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e8eaed;
        margin: 0 calc(-50vw + 50%);
        padding-left: calc(1.5rem + (50vw - 50%));
        padding-right: calc(1.5rem + (50vw - 50%));
      }

      .map-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #2c3e50;
      }

      .map-controls {
        display: flex;
        gap: 0.5rem;
      }

      .map-btn {
        padding: 0.25rem 0.5rem;
        background-color: #f1f3f4;
        border: none;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
      }

      .map-btn:hover {
        background-color: #e8eaed;
      }
    `,
    `
      .map-canvas {
        height: 70vh;
        width: 100%;
      }
    `,
  ],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map?: L.Map
  private ports: Port[] = []
  private portMarkers: L.Marker[] = []
  private defaultCenter: L.LatLngExpression = [20, 0]
  private defaultZoom = 2

  constructor(private portService: PortService) {}

  ngOnInit(): void {
    this.loadPorts()
  }

  ngAfterViewInit(): void {
    this.injectGlobalDashboardOverrides()
    this.initMap()
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove()
    }
  }

  private loadPorts(): void {
    this.portService.getAllPorts().subscribe({
      next: (ports) => {
        this.ports = ports
        if (this.map) {
          this.addPortsToMap()
        }
      },
      error: (err) => console.error("Error al cargar puertos para el mapa:", err),
    })
  }

  private initMap(): void {
    const container = document.getElementById("map")
    if (!container) return

    this.map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView(this.defaultCenter, this.defaultZoom)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map)

    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(this.map)

    this.addPortsToMap()
  }

  private addPortsToMap(): void {
    const map = this.map
    if (!map) return
    this.clearPortMarkers()

    this.ports.forEach((port) => {
      const portIcon = L.divIcon({
        className: "port-marker",
        html: `<div class="port-icon" title="${port.name}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })

      const marker = L.marker([port.coordinates.latitude, port.coordinates.longitude], { icon: portIcon }).addTo(map)

      marker.bindPopup(`
        <div class="port-popup">
          <h4>${port.name}</h4>
          <p>Continente: ${port.continent || "Desconocido"}</p>
          <p>Coordenadas: ${port.coordinates.latitude.toFixed(4)}, ${port.coordinates.longitude.toFixed(4)}</p>
        </div>
      `)

      this.portMarkers.push(marker)
    })

    if (this.ports.length > 0) {
      const bounds = L.latLngBounds(this.ports.map((p) => [p.coordinates.latitude, p.coordinates.longitude]))
      map.fitBounds(bounds, { padding: [8, 8], maxZoom: 5 })
    }

    this.addPortMarkerStyles()
  }

  private clearPortMarkers(): void {
    this.portMarkers.forEach((marker) => {
      if (this.map) {
        this.map.removeLayer(marker)
      }
    })
    this.portMarkers = []
  }

  zoomIn(): void {
    if (this.map) this.map.zoomIn()
  }

  zoomOut(): void {
    if (this.map) this.map.zoomOut()
  }

  resetView(): void {
    if (this.map) this.map.setView(this.defaultCenter, this.defaultZoom)
  }

  private addPortMarkerStyles(): void {
    if (document.head.querySelector("style[data-teemo-port-markers]")) return

    const style = document.createElement("style")
    style.setAttribute("data-teemo-port-markers", "true")
    style.textContent = `
      .port-icon {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #1a73e8;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
      }
      .port-popup h4 {
        margin: 0 0 5px 0;
        color: #2c3e50;
      }
      .port-popup p {
        margin: 3px 0;
        font-size: 12px;
        color: #5f6368;
      }
    `
    document.head.appendChild(style)
  }

  private injectGlobalDashboardOverrides(): void {
    if (document.head.querySelector("style[data-teemo-map-overrides]")) return

    const css = `
      .dashboard-content { padding-left: 0 !important; padding-right: 0 !important; }
      .dashboard-content .dashboard-grid { gap: 1.5rem !important; }
      .dashboard-content .dashboard-grid > .map-container {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        overflow: visible !important;
        height: auto !important;
        border-radius: 0 !important;
        margin-bottom: 1.5rem !important;
      }
    `

    const tag = document.createElement("style")
    tag.setAttribute("data-teemo-map-overrides", "true")
    tag.textContent = css
    document.head.appendChild(tag)
  }
}
