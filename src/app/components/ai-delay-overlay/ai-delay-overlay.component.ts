import { Component, Input, OnChanges, SimpleChanges, ElementRef, Renderer2, ViewChild, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { environment } from "../../../environments/environment";

type DelayPredictionResponse = {
  delayHours: number;
  delayProbability?: number;
  plannedEtaIso?: string | null;
  adjustedEtaIso?: string | null;
  mainDelayFactor?: string;
  usedFallback?: boolean;
  usedAvgWindKnots?: number | null;
  usedMaxWaveM?: number | null;
};

type Hazard = {
  type: string;
  probability: number;
  severity?: "LOW" | "MEDIUM" | "HIGH" | string;
  windowStartIso?: string | null;
  windowEndIso?: string | null;
  regionName?: string | null;
  source?: string | null;
  rationale?: string | null;
  latCenter?: number;
  lonCenter?: number;
  radiusKm?: number;
};

type HazardSegment = {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  hazards: Hazard[];
  notViableDueToIce: boolean;
  advisory?: string | null;
};

type HazardAssessmentResponse = {
  season: string;
  month: number;
  hemisphere: string;
  routeDistanceKm: number;
  plannedHours: number;
  segments: HazardSegment[];
};

type RiskLevel = "low" | "medium" | "high";

@Component({
  selector: "app-ai-delay-overlay",
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div
      #overlay
      class="teemo-delay-overlay"
      *ngIf="origin && destination"
      [class.hidden]="!showOverlay"
    >
      <div class="hdr" (mousedown)="startDrag($event)" (touchstart)="startDragTouch($event)">
        <div class="title">
          <span class="dot"></span>
          IA · Ruta
        </div>
        <span class="pill" [ngClass]="pillClass()">
          <ng-container *ngIf="loading">Calculando…</ng-container>
          <ng-container *ngIf="!loading && prediction">{{ riskLabel() }}</ng-container>
        </span>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="tab==='delay'" (click)="tab='delay'">Retraso</button>
        <button class="tab" [class.active]="tab==='hazards'" (click)="tab='hazards'">Riesgos</button>
      </div>

      <div class="kv">
        <div><b>Origen:</b> {{ origin }}</div>
        <div><b>Destino:</b> {{ destination }}</div>
      </div>

      <ng-container *ngIf="tab==='delay'">
        <div class="kv" *ngIf="prediction">
          <div class="metric"><b>Retraso estimado:</b> {{ prediction.delayHours | number:'1.1-1' }} h</div>

          <div *ngIf="prediction.mainDelayFactor" class="muted">
            Causa principal: {{ prediction.mainDelayFactor }}
          </div>

          <div class="kv eta" *ngIf="prediction.plannedEtaIso || prediction.adjustedEtaIso">
            <div *ngIf="prediction.plannedEtaIso"><b>ETA planificada:</b> {{ prediction.plannedEtaIso | date:'medium' }}</div>
            <div *ngIf="prediction.adjustedEtaIso"><b>ETA ajustada:</b> {{ prediction.adjustedEtaIso | date:'medium' }}</div>
          </div>

          <div class="muted" *ngIf="prediction.usedFallback">
            ⚠️ Predicción en modo de respaldo (datos incompletos o error de IA)
          </div>
        </div>

        <div class="kv error" *ngIf="!loading && error">{{ error }}</div>

        <div class="row">
          <button class="map-btn primary" (click)="fetch()">Actualizar</button>
          <button class="map-btn ghost" (click)="toggle()">
            {{ showOverlay ? 'Ocultar' : 'Mostrar' }}
          </button>
        </div>
      </ng-container>

      <ng-container *ngIf="tab==='hazards'">
        <div class="kv" *ngIf="hazLoading">Cargando riesgos…</div>
        <div class="kv error" *ngIf="!hazLoading && hazError">{{ hazError }}</div>

        <div class="kv" *ngIf="haz && !hazLoading">
          <div class="haz-meta">
            <div><b>Temporada:</b> {{ haz.season }} (mes {{ haz.month }})</div>
            <div><b>Hemisferio:</b> {{ haz.hemisphere }}</div>
            <div><b>Distancia:</b> {{ haz.routeDistanceKm | number:'1.0-0' }} km</div>
            <div><b>Horas planificadas:</b> {{ haz.plannedHours | number:'1.0-0' }}</div>
          </div>

          <div class="segment" *ngFor="let seg of haz.segments; let i = index">
            <div class="segment-hdr">Tramo {{ i + 1 }}</div>
            <div class="segment-sub">
              {{ seg.startLat | number:'1.2-2' }}, {{ seg.startLon | number:'1.2-2' }}
              → {{ seg.endLat | number:'1.2-2' }}, {{ seg.endLon | number:'1.2-2' }}
            </div>

            <div class="ice-advisory" *ngIf="seg.notViableDueToIce">
              ⚠ Ruta no viable por hielo estacional. {{ seg.advisory || '' }}
            </div>

            <div class="haz-row" *ngFor="let h of seg.hazards">
              <span class="badge" [ngClass]="sevClass(h.severity)">{{ h.type }}</span>
              <span class="muted">{{ probFmt(h.probability) }}</span>
              <span class="muted" *ngIf="h.regionName"> · {{ h.regionName }}</span>
              <span class="muted" *ngIf="h.windowStartIso || h.windowEndIso">
                · {{ (h.windowStartIso || '') | date:'MMM d' }} — {{ (h.windowEndIso || '') | date:'MMM d' }}
              </span>
              <div class="rationale" *ngIf="h.rationale">{{ h.rationale }}</div>
            </div>
          </div>

          <div *ngIf="(!haz.segments || haz.segments.length===0)" class="muted" style="margin-top:6px;">
            No se detectaron riesgos relevantes en la ruta.
          </div>
        </div>

        <div class="row">
          <button class="map-btn primary" (click)="fetchHazards()">Actualizar riesgos</button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { --blue:#0a6cbc; --blue-600:#084e88; --slate-50:#f8fafc; --slate-100:#f1f5f9; --slate-200:#e2e8f0; --slate-400:#94a3b8; --slate-600:#475569; --slate-800:#0f172a; --success:#10b981; --warn:#f59e0b; --danger:#ef4444; }

    .teemo-delay-overlay {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 9999;
      min-width: 280px;
      max-width: 380px;
      background: #fff;
      color: var(--slate-800);
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(2, 6, 23, 0.12);
      padding: 12px 14px;
      user-select: none;
      pointer-events: auto;
    }
    .teemo-delay-overlay.dragging {
      opacity: 0.98;
      box-shadow: 0 12px 28px rgba(2, 6, 23, 0.18);
    }
    .hidden { display: none; }

    .hdr {
      display:flex; align-items:center; gap:10px;
      border-bottom: 1px solid var(--slate-200);
      padding-bottom: 8px;
      cursor: grab;
    }
    .title {
      display:flex; align-items:center; gap:8px;
      font-weight: 600; color: var(--blue);
    }
    .dot {
      width:8px; height:8px; border-radius:999px; background: var(--blue);
      box-shadow: 0 0 0 3px rgba(10,108,188,0.15);
    }

    .pill {
      margin-left:auto; padding:2px 10px; border-radius:999px; font-size:12px;
      background: var(--slate-100); color: var(--slate-600); border:1px solid var(--slate-200);
    }
    .pill.good { background: #ecfdf5; color:#065f46; border-color:#bbf7d0; }
    .pill.warn { background: #fff7ed; color:#92400e; border-color:#fed7aa; }
    .pill.bad  { background: #fef2f2; color:#991b1b; border-color:#fecaca; }

    .tabs {
      display:flex; gap:6px; padding-top:8px; margin-top:8px;
      border-top: 1px solid var(--slate-200);
    }
    .tab {
      padding: 4px 10px; font-size: 12.5px;
      border: 1px solid var(--slate-200);
      border-radius: 999px;
      background: #fff; color: var(--slate-800);
      cursor: pointer;
    }
    .tab.active {
      background: #e6f1fb;
      border-color: #93c5fd;
      color: #084e88;
      font-weight: 600;
    }

    .kv { margin-top:10px; font-size:13px; line-height:1.35; }
    .kv.eta { margin-top:10px; padding-top:8px; border-top:1px solid var(--slate-200); }
    .metric { font-size:13.5px; }
    .muted { color: var(--slate-600); }
    .error { color: #b91c1c; }

    .row { display:flex; gap:8px; margin-top:12px; }

    .map-btn {
      padding: 0.4rem 0.7rem;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      border: 1px solid var(--slate-200);
      background-color: #fff;
      color: var(--slate-800);
      transition: background-color .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease;
    }
    .map-btn:hover { background-color: var(--slate-50); }
    .map-btn.primary {
      background: var(--blue);
      color: #fff;
      border-color: var(--blue);
    }
    .map-btn.primary:hover { background: var(--blue-600); border-color: var(--blue-600); }
    .map-btn.ghost {
      background:#fff; color: var(--slate-800);
      border:1px solid var(--slate-200);
    }
    .map-btn.ghost:hover { background: var(--slate-100); }

    .haz-meta {
      display:grid; grid-template-columns: 1fr 1fr; gap:4px 12px;
      font-size:12px; color:#334155; margin-bottom:6px;
    }
    .segment {
      border:1px solid var(--slate-200);
      border-radius:10px;
      padding:8px; margin-top:8px; background:#f8fafc;
    }
    .segment-hdr { font-weight:600; color:#0f172a; margin-bottom:3px; }
    .segment-sub { font-size:12px; color:#475569; margin-bottom:6px; }
    .ice-advisory {
      background:#fee2e2; border:1px solid #fecaca;
      color:#991b1b; border-radius:8px; padding:6px 8px;
      font-size:12px; margin-bottom:6px;
    }
    .haz-row {
      display:flex; align-items:center; flex-wrap:wrap; gap:6px;
      padding:4px 0; border-top:1px dashed var(--slate-200);
    }
    .haz-row:first-child { border-top:none; }
    .badge {
      padding:2px 8px; border-radius:999px; font-size:12px; background:#e2e8f0; color:#0f172a; border:1px solid #cbd5e1;
    }
    .badge.low {    background:#dcfce7; color:#14532d; border-color:#bbf7d0; }
    .badge.medium { background:#fef9c3; color:#713f12; border-color:#fde68a; }
    .badge.high {   background:#fee2e2; color:#7f1d1d; border-color:#fecaca; }
    .rationale { width:100%; font-size:12px; color:#475569; margin-left:2px; }

    :host-context(.dark-mode) .teemo-delay-overlay {
      background: rgba(4, 7, 20, 0.94);
      color: #e2e8f0;
      border-color: rgba(56, 189, 248, 0.25);
      box-shadow: 0 24px 50px rgba(1, 4, 18, 0.8);
    }
    :host-context(.dark-mode) .hdr {
      border-bottom-color: rgba(148, 163, 184, 0.25);
    }
    :host-context(.dark-mode) .title {
      color: #93c5fd;
    }
    :host-context(.dark-mode) .dot {
      background:#38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
    }
    :host-context(.dark-mode) .pill {
      background: rgba(8, 18, 35, 0.85);
      color: #cbd5f5;
      border-color: rgba(148, 163, 184, 0.3);
    }
    :host-context(.dark-mode) .tabs {
      border-top-color: rgba(148, 163, 184, 0.25);
    }
    :host-context(.dark-mode) .tab {
      background: rgba(8, 18, 35, 0.9);
      color: #e2e8f0;
      border-color: rgba(148, 163, 184, 0.25);
    }
    :host-context(.dark-mode) .tab.active {
      background: rgba(56, 189, 248, 0.18);
      border-color: rgba(56, 189, 248, 0.45);
      color: #0ea5e9;
    }
    :host-context(.dark-mode) .kv {
      color: #e2e8f0;
    }
    :host-context(.dark-mode) .muted {
      color: #94a3b8;
    }
    :host-context(.dark-mode) .haz-meta {
      color: #cbd5f5;
    }
    :host-context(.dark-mode) .segment {
      background: rgba(8, 17, 31, 0.9);
      border-color: rgba(56, 189, 248, 0.25);
    }
    :host-context(.dark-mode) .segment-hdr {
      color: #f8fafc;
    }
    :host-context(.dark-mode) .segment-sub,
    :host-context(.dark-mode) .rationale {
      color: #94a3b8;
    }
    :host-context(.dark-mode) .ice-advisory {
      background: rgba(127, 29, 29, 0.35);
      border-color: rgba(248, 113, 113, 0.5);
      color: #fecaca;
    }
    :host-context(.dark-mode) .haz-row {
      border-top-color: rgba(148, 163, 184, 0.25);
    }
    :host-context(.dark-mode) .badge {
      background: rgba(148, 163, 184, 0.2);
      color: #f8fafc;
      border-color: rgba(148, 163, 184, 0.35);
    }
    :host-context(.dark-mode) .badge.low {
      background: rgba(74, 222, 128, 0.2);
      color: #bbf7d0;
      border-color: rgba(74, 222, 128, 0.35);
    }
    :host-context(.dark-mode) .badge.medium {
      background: rgba(249, 224, 127, 0.2);
      color: #fde68a;
      border-color: rgba(250, 204, 21, 0.35);
    }
    :host-context(.dark-mode) .badge.high {
      background: rgba(248, 113, 113, 0.25);
      color: #fecaca;
      border-color: rgba(248, 113, 113, 0.4);
    }
    :host-context(.dark-mode) .map-btn {
      background: rgba(8, 18, 35, 0.85);
      color: #f8fafc;
      border-color: rgba(148, 163, 184, 0.35);
    }
    :host-context(.dark-mode) .map-btn:hover {
      background: rgba(59, 130, 246, 0.18);
      color: #f8fafc;
    }
    :host-context(.dark-mode) .map-btn.primary {
      background: #1d4ed8;
      border-color: #1d4ed8;
    }
    :host-context(.dark-mode) .map-btn.primary:hover {
      background: #1e40af;
      border-color: #1e40af;
    }
    :host-context(.dark-mode) .map-btn.ghost {
      background: rgba(8, 18, 35, 0.85);
      color: #e2e8f0;
      border-color: rgba(148, 163, 184, 0.35);
    }
  `]
})
export class AiDelayOverlayComponent implements OnChanges {
  @Input() origin: string | null = null;
  @Input() destination: string | null = null;
  @Input() distanceNm?: number | null;

  @Input() originLat?: number | null;
  @Input() originLon?: number | null;
  @Input() destLat?: number | null;
  @Input() destLon?: number | null;
  @Input() cruiseSpeedKnots: number = 18;
  @Output() riskLevelChange = new EventEmitter<RiskLevel>();

  @ViewChild("overlay") overlayRef!: ElementRef;

  // Delay
  loading = false;
  error: string | null = null;
  prediction: DelayPredictionResponse | null = null;

  // Hazards
  tab: 'delay' | 'hazards' = 'delay';
  hazLoading = false;
  hazError: string | null = null;
  haz: HazardAssessmentResponse | null = null;

  showOverlay = true;

  // drag
  private dragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  private get delayUrl() {
    const base = environment.apiUrl?.replace(/\/+$/, "") || "";
    const path = environment.ai?.predictDelayPath || "/api/ai/predict-weather-delay";
    return `${base}${path}`;
  }

  // ✅ FIX: construye la URL sin duplicar /api
  private get hazardUrl() {
    const base = environment.apiUrl?.replace(/\/+$/, "") || "";
    const path = (environment as any).ai?.hazardAssessmentPath || "/ai/hazard-assessment";
    let p = path.startsWith("/") ? path : `/${path}`;
    if (base.endsWith("/api") && p.startsWith("/api/")) {
      p = p.replace(/^\/api/, "");
    }
    return `${base}${p}`;
  }

  constructor(private http: HttpClient, private renderer: Renderer2) {
    this.renderer.listen('window', 'mouseup', () => this.stopDrag());
    this.renderer.listen('window', 'mousemove', (e: MouseEvent) => this.onDrag(e));
    this.renderer.listen('window', 'touchend', () => this.stopDrag());
    this.renderer.listen('window', 'touchmove', (e: TouchEvent) => this.onDragTouch(e));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['origin'] || changes['destination']) && this.origin && this.destination) {
      this.fetch();
      this.fetchHazards();
    }
  }

  // Drag
  startDrag(event: MouseEvent) {
    if (!this.overlayRef) return;
    event.preventDefault();
    const el = this.overlayRef.nativeElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    this.renderer.setStyle(el, 'left', `${rect.left}px`);
    this.renderer.setStyle(el, 'top', `${rect.top}px`);
    this.renderer.setStyle(el, 'right', 'auto');
    this.renderer.setStyle(el, 'bottom', 'auto');
    this.dragging = true;
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    el.classList.add('dragging');
  }

  startDragTouch(ev: TouchEvent) {
    if (!this.overlayRef) return;
    const t = ev.touches[0];
    if (!t) return;
    ev.preventDefault();
    const el = this.overlayRef.nativeElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    this.renderer.setStyle(el, 'left', `${rect.left}px`);
    this.renderer.setStyle(el, 'top', `${rect.top}px`);
    this.renderer.setStyle(el, 'right', 'auto');
    this.renderer.setStyle(el, 'bottom', 'auto');
    this.dragging = true;
    this.dragOffsetX = t.clientX - rect.left;
    this.dragOffsetY = t.clientY - rect.top;
    el.classList.add('dragging');
  }

  onDrag(event: MouseEvent) {
    if (!this.dragging || !this.overlayRef) return;
    event.preventDefault();
    this.moveTo(event.clientX, event.clientY);
  }

  onDragTouch(ev: TouchEvent) {
    if (!this.dragging) return;
    const t = ev.touches[0];
    if (!t) return;
    ev.preventDefault();
    this.moveTo(t.clientX, t.clientY);
  }

  private moveTo(clientX: number, clientY: number) {
    const el = this.overlayRef.nativeElement as HTMLElement;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const margin = 8;

    let x = clientX - this.dragOffsetX;
    let y = clientY - this.dragOffsetY;

    const maxX = window.innerWidth - w - margin;
    const maxY = window.innerHeight - h - margin;

    x = Math.max(margin, Math.min(x, maxX));
    y = Math.max(margin, Math.min(y, maxY));

    this.renderer.setStyle(el, 'left', `${x}px`);
    this.renderer.setStyle(el, 'top', `${y}px`);
  }

  stopDrag() {
    if (!this.dragging || !this.overlayRef) return;
    this.dragging = false;
    (this.overlayRef.nativeElement as HTMLElement).classList.remove('dragging');
  }

  // Delay
  fetch() {
    if (!this.origin || !this.destination) return;
    this.loading = true;
    this.error = null;

    let distanceKm: number | undefined;
    if (this.distanceNm != null) {
      distanceKm = this.distanceNm * 1.852;
    } else if (this.originLat != null && this.originLon != null && this.destLat != null && this.destLon != null) {
      distanceKm = this.haversineKm(this.originLat!, this.originLon!, this.destLat!, this.destLon!);
    }

    const payload: any = {
      origin: this.origin,
      destination: this.destination,
      cruiseSpeedKnots: this.cruiseSpeedKnots,
      avgWindKnots: 12,
      maxWaveM: 2,
      originLat: this.originLat,
      originLon: this.originLon,
      destLat: this.destLat,
      destLon: this.destLon,
      departureTimeIso: new Date().toISOString(),
    };
    if (distanceKm != null) payload.distanceKm = distanceKm;

    this.http.post<DelayPredictionResponse>(this.delayUrl, payload).subscribe({
      next: (resp) => {
        this.prediction = resp;
        this.loading = false;
        this.emitRiskLevel(this.prediction?.delayProbability);
      },
      error: (err) => {
        console.error("[AI] predict-delay error", err);
        this.error = "No se pudo obtener la predicción.";
        this.prediction = null;
        this.loading = false;
        this.emitRiskLevel(undefined);
      },
    });
  }

  // Hazards
  fetchHazards() {
    if (this.originLat==null || this.originLon==null || this.destLat==null || this.destLon==null) return;
    this.hazLoading = true;
    this.hazError = null;

    const payload: any = {
      originLat: this.originLat,
      originLon: this.originLon,
      destLat: this.destLat,
      destLon: this.destLon,
      departureTimeIso: new Date().toISOString(),
      cruiseSpeedKnots: this.cruiseSpeedKnots,
    };
    if (this.distanceNm != null) payload.distanceKm = this.distanceNm * 1.852;

    this.http.post<HazardAssessmentResponse>(this.hazardUrl, payload).subscribe({
      next: (resp) => { this.haz = resp; this.hazLoading = false; },
      error: (err) => {
        console.error("[AI] hazard-assessment error", err);
        this.hazError = "No se pudo obtener la evaluación de riesgos.";
        this.hazLoading = false;
      }
    });
  }

  // Utils
  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = this.rad(lat2 - lat1);
    const dLon = this.rad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
      Math.cos(this.rad(lat1)) * Math.cos(this.rad(lat2)) *
      Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  private rad(d: number) { return d * Math.PI / 180; }

  toggle() { this.showOverlay = !this.showOverlay; }

  private determineRiskLevel(probability?: number): RiskLevel {
    const value = probability ?? 0;
    if (value >= 0.5) return "high";
    if (value >= 0.36) return "medium";
    return "low";
  }

  private emitRiskLevel(probability?: number): void {
    this.riskLevelChange.emit(this.determineRiskLevel(probability));
  }

  pillClass() {
    if (this.loading || !this.prediction) return "good";
    const level = this.determineRiskLevel(this.prediction.delayProbability);
    if (level === "high") return "bad";
    if (level === "medium") return "warn";
    return "good";
  }

  riskLabel() {
    if (!this.prediction) return "";
    const level = this.determineRiskLevel(this.prediction.delayProbability);
    if (level === "high") return "Riesgo alto";
    if (level === "medium") return "Riesgo medio";
    return "Bajo riesgo";
  }

  sevClass(s?: string) {
    const v = (s || '').toUpperCase();
    if (v === 'HIGH') return 'badge high';
    if (v === 'MEDIUM') return 'badge medium';
    return 'badge low';
  }
  probFmt(p: number) { return `${Math.round((p||0)*100)}%`; }
}
