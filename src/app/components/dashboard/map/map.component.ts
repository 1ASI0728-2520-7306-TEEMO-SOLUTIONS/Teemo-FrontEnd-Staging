import { Component, type OnInit, type AfterViewInit, type ElementRef, ViewChild, type OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import * as L from "leaflet";
import { PortService, Port } from "../../../services/port.service";
import { environment } from '../../../../environments/environment';

type DelayPredictionResponse = {
  isDelay: boolean;
  delayHours: number;
  riskScore?: number;
  inputs?: {
    distanceKm?: number;
    cruiseKnots?: number;
    avgWindKnots?: number;
    maxWaveM?: number;
  };
  model?: {
    name?: string;
    version?: string;
  };
};

@Component({
  selector: "app-map",
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="map-container scale-in" style="position:relative">
      <div class="map-header">
        <h3>Mapa de Puertos Marítimos</h3>
        <div class="map-controls">
          <button class="map-btn" (click)="zoomIn()">Zoom In</button>
          <button class="map-btn" (click)="zoomOut()">Zoom Out</button>
          <button class="map-btn" (click)="resetView()">Reset</button>
          <button class="map-btn" (click)="clearSelection()">Limpiar selección</button>
        </div>
      </div>

      <div id="map" class="map-canvas"></div>

      <!-- Overlay de IA -->
      <div class="teemo-delay-overlay" *ngIf="selectedOriginPort && selectedDestinationPort">
        <div class="hdr">
          <span>Predicción de retraso</span>
          <span class="pill" [ngClass]="pillClass()">
            <ng-container *ngIf="loadingPrediction">Calculando…</ng-container>
            <ng-container *ngIf="!loadingPrediction && prediction">
              {{ prediction?.isDelay ? 'Riesgo de retraso' : 'Bajo riesgo' }}
            </ng-container>
          </span>
        </div>

        <div class="kv">
          <div><b>Origen:</b> {{ selectedOriginPort?.name }}</div>
          <div><b>Destino:</b> {{ selectedDestinationPort?.name }}</div>
        </div>

        <div class="kv" *ngIf="prediction">
          <div><b>Retraso estimado:</b> {{ prediction.delayHours | number:'1.1-1' }} h</div>
          <div *ngIf="prediction.riskScore !== undefined"><b>Confianza:</b> {{ (prediction.riskScore * 100) | number:'1.0-0' }}%</div>
          <div class="muted" *ngIf="prediction.inputs">
            <div *ngIf="prediction.inputs.distanceKm !== undefined">Distancia: {{ prediction.inputs.distanceKm | number:'1.0-0' }} km</div>
            <div *ngIf="prediction.inputs.cruiseKnots !== undefined">Velocidad crucero: {{ prediction.inputs.cruiseKnots }} kn</div>
            <div *ngIf="prediction.inputs.avgWindKnots !== undefined">Viento medio: {{ prediction.inputs.avgWindKnots | number:'1.0-0' }} kn</div>
            <div *ngIf="prediction.inputs.maxWaveM !== undefined">Oleaje máx: {{ prediction.inputs.maxWaveM | number:'1.1-1' }} m</div>
          </div>
          <div class="muted" *ngIf="prediction.model?.version">Modelo: {{ prediction.model?.name || 'ONNX' }} v{{ prediction.model?.version }}</div>
        </div>

        <div class="kv" *ngIf="!loadingPrediction && predictionError">
          {{ predictionError }}
        </div>

        <button class="map-btn" style="margin-top:8px" (click)="fetchDelayPrediction()">Actualizar predicción</button>
      </div>
    </div>
  `,
  styles: [
    `
      .map-container {
        background-color: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .map-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e0e0e0;

        h3 {
          margin: 0;
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

          &:hover {
            background-color: #e8eaed;
          }
        }
      }

      .map-canvas {
        height: 400px;
        width: 100%;
      }

      /* Overlay IA */
      .teemo-delay-overlay {
        position: absolute;
        left: 16px;
        bottom: 16px;
        z-index: 500;
        min-width: 260px;
        max-width: 360px;
        background: rgba(18, 18, 18, 0.86);
        color: #fff;
        backdrop-filter: blur(6px);
        border-radius: 14px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        padding: 12px 14px;
        pointer-events: auto;
      }
      .teemo-delay-overlay .hdr {
        display: flex; align-items: center; gap: 8px;
        font-weight: 600; font-size: 14px;
      }
      .teemo-delay-overlay .pill {
        display: inline-block;
        padding: 2px 8px; border-radius: 999px; font-size: 12px;
        margin-left: auto;
        background: #1f8f4e;
      }
      .teemo-delay-overlay .pill.warn { background: #c37017; }
      .teemo-delay-overlay .pill.bad  { background: #b32d2d; }
      .teemo-delay-overlay .kv { margin-top: 8px; font-size: 13px; line-height: 1.35; }
      .teemo-delay-overlay .kv b { font-weight: 600; }
      .teemo-delay-overlay .muted { opacity: .8; }
    `,
  ],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map!: L.Map;
  private ports: Port[] = [];
  private portMarkers: L.Marker[] = [];
  private routeLine?: L.Polyline;

  private defaultCenter: L.LatLngExpression = [20, 0];
  private defaultZoom = 2;

  selectedOriginPort?: Port;
  selectedDestinationPort?: Port;

  loadingPrediction = false;
  prediction: DelayPredictionResponse | null = null;
  predictionError: string | null = null;

  @ViewChild("mapCanvas") mapCanvas!: ElementRef;

  // URL de predicción a partir del environment
  private get predictUrl() {
    return `${environment.apiUrl}${environment.ai.predictDelayPath}`;
  }

  // Listener para eventos del PortSelector
  private onRouteCalculated = (ev: Event) => {
    const d = (ev as CustomEvent).detail as { originName: string; destinationName: string };
    if (!d?.originName || !d?.destinationName) return;

    const o = this.ports.find(p => p.name === d.originName);
    const t = this.ports.find(p => p.name === d.destinationName);
    if (!o || !t) return;

    this.selectedOriginPort = o;
    this.selectedDestinationPort = t;
    this.drawRouteLine();
    this.fetchDelayPrediction();
  };

  constructor(private portService: PortService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPorts();
    // Escucha cuando otra parte del front calcule/seleccione la ruta
    window.addEventListener("teemo:route-calculated", this.onRouteCalculated);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
    window.removeEventListener("teemo:route-calculated", this.onRouteCalculated);
  }

  private initMap(): void {
    this.map = L.map("map", {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    if (this.ports.length > 0) {
      this.addPortsToMap();
    }
  }

  private loadPorts(): void {
    this.portService.getAllPorts().subscribe({
      next: (ports) => {
        this.ports = ports;
        if (this.map) this.addPortsToMap();
      },
      error: (err) => console.error("Error al cargar puertos para el mapa:", err),
    });
  }

  private addPortsToMap(): void {
    this.clearPortMarkers();

    this.ports.forEach((port) => {
      const portIcon = L.divIcon({
        className: "port-marker",
        html: `<div class="port-icon" title="${port.name}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([port.coordinates.latitude, port.coordinates.longitude], { icon: portIcon })
        .addTo(this.map)
        .bindPopup(`
          <div class="port-popup">
            <h4>${port.name}</h4>
            <p>Continente: ${port.continent || "Desconocido"}</p>
            <p>Coordenadas: ${port.coordinates.latitude.toFixed(4)}, ${port.coordinates.longitude.toFixed(4)}</p>
            <p style="margin-top:8px;"><em>Click para seleccionar Origen/Destino</em></p>
          </div>
        `);

      marker.on("click", () => {
        this.handlePortClick(port);
      });

      this.portMarkers.push(marker);
    });

    this.addPortMarkerStyles();
  }

  private handlePortClick(port: Port) {
    if (!this.selectedOriginPort || (this.selectedOriginPort && this.selectedDestinationPort)) {
      this.selectedOriginPort = port;
      this.selectedDestinationPort = undefined;
      this.prediction = null;
      this.predictionError = null;
      this.drawRouteLine();
      return;
    }

    if (!this.selectedDestinationPort) {
      if (this.selectedOriginPort.name === port.name) return;
      this.selectedDestinationPort = port;
      this.drawRouteLine();
      this.fetchDelayPrediction();
    }
  }

  private drawRouteLine() {
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = undefined;
    }

    if (this.selectedOriginPort && this.selectedDestinationPort) {
      const a = this.selectedOriginPort.coordinates;
      const b = this.selectedDestinationPort.coordinates;
      this.routeLine = L.polyline(
        [
          [a.latitude, a.longitude],
          [b.latitude, b.longitude],
        ],
        { color: "#1a73e8", weight: 3, opacity: 0.9 }
      ).addTo(this.map);

      this.map.fitBounds(this.routeLine.getBounds(), { padding: [40, 40] });
    }
  }

  fetchDelayPrediction() {
    if (!this.selectedOriginPort || !this.selectedDestinationPort) return;

    this.loadingPrediction = true;
    this.predictionError = null;

    const payload = {
      origin: this.selectedOriginPort.name,
      destination: this.selectedDestinationPort.name,
    };

    console.log("[AI] POST", this.predictUrl, payload);

    this.http.post<DelayPredictionResponse>(this.predictUrl, payload).subscribe({
      next: (resp) => {
        this.prediction = resp;
        this.loadingPrediction = false;
      },
      error: (err) => {
        console.error("[AI] predict-delay error", err);
        this.predictionError = "No se pudo obtener la predicción.";
        this.loadingPrediction = false;
      },
    });
  }

  pillClass() {
    if (this.loadingPrediction || !this.prediction) return "";
    const h = this.prediction.delayHours;
    if (h >= 6) return "bad";
    if (h >= 2) return "warn";
    return "";
  }

  private clearPortMarkers(): void {
    this.portMarkers.forEach((m) => {
      if (this.map) this.map.removeLayer(m);
    });
    this.portMarkers = [];
  }

  private addPortMarkerStyles(): void {
    const style = document.createElement("style");
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
    `;
    document.head.appendChild(style);
  }

  // Controles
  zoomIn(): void { if (this.map) this.map.zoomIn(); }
  zoomOut(): void { if (this.map) this.map.zoomOut(); }
  resetView(): void { if (this.map) this.map.setView(this.defaultCenter, this.defaultZoom); }

  clearSelection(): void {
    this.selectedOriginPort = undefined;
    this.selectedDestinationPort = undefined;
    this.prediction = null;
    this.predictionError = null;
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = undefined;
    }
  }

  // ——— Bloque canvas alternativo (opcional) ———
  drawMap(): void {
    try {
      const canvasElement = this.mapCanvas?.nativeElement;
      if (!canvasElement) return;

      if (!(canvasElement instanceof HTMLCanvasElement)) {
        const canvas = document.createElement("canvas");
        canvas.width = canvasElement.offsetWidth;
        canvas.height = canvasElement.offsetHeight;
        canvasElement.appendChild(canvas);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          this.drawMapContent(ctx, canvas.width, canvas.height);
        } else {
          console.error("No se pudo obtener el contexto 2D del canvas");
        }
      } else {
        canvasElement.width = canvasElement.offsetWidth;
        canvasElement.height = canvasElement.offsetHeight;
        const ctx = canvasElement.getContext("2d");
        if (ctx) {
          this.drawMapContent(ctx, canvasElement.width, canvasElement.height);
        } else {
          console.error("No se pudo obtener el contexto 2D del canvas");
        }
      }
    } catch (error) {
      console.error("Error al dibujar el mapa:", error);
      this.showFallbackMap();
    }
  }

  drawMapContent(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.beginPath();
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.strokeStyle = "#1a73e8";
    ctx.lineWidth = 2;
    ctx.moveTo(100, 150);
    ctx.bezierCurveTo(200, 100, 300, 200, 400, 150);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#34a853";
    ctx.lineWidth = 2;
    ctx.moveTo(150, 250);
    ctx.bezierCurveTo(250, 200, 350, 300, 450, 250);
    ctx.stroke();

    this.drawShip(ctx, 100, 150, "#1a73e8");
    this.drawShip(ctx, 400, 150, "#1a73e8");
    this.drawShip(ctx, 150, 250, "#34a853");
    this.drawShip(ctx, 450, 250, "#34a853");
  }

  drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  showFallbackMap(): void {
    const container = this.mapCanvas?.nativeElement;
    if (!container) return;
    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100%; background-color: #f8f9fa;">
        <div style="text-align: center; padding: 20px;">
          <p style="margin: 0; color: #5f6368;">No se pudo cargar el mapa</p>
          <button
            style="margin-top: 10px; padding: 5px 10px; background-color: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer;"
            onclick="this.parentNode.parentNode.parentNode.dispatchEvent(new CustomEvent('retry'))">
            Reintentar
          </button>
        </div>
      </div>
    `;
    container.addEventListener("retry", () => this.drawMap());
  }
}
