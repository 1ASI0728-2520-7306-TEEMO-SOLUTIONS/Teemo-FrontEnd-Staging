import { Component, OnInit, AfterViewInit, OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { MapComponent } from "./map/map.component"
import { PortSelectorComponent } from "./port-selector/port-selector.component"
import { SidebarComponent } from "../shared/sidebar/sidebar.component"
import { HeaderComponent } from "../shared/header/header.component"
import { AnimationService } from "../../services/animation.service"

declare var VANTA: any

interface PopularRoute {
  id: number
  name: string
  originPort: string
  destinationPort: string
  searchCount: number
  distance: string
  estimatedTime: string
  popularity: "high" | "medium" | "low"
}

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MapComponent,
    PortSelectorComponent,
    SidebarComponent,
    HeaderComponent,
  ],
  template: `
    <!-- Splash Screen -->
    <div *ngIf="showSplash" class="splash-screen" [class.hidden]="splashHidden">
      <div class="splash-content">
        <div class="splash-logo">
          <img src="assets/Teemo-hongo-logo.png" alt="Teemo Logo" class="splash-image" />
        </div>
        <h1>MUSHROOM</h1>
      </div>
    </div>

    <div *ngIf="!showSplash" class="app-container">
      <!-- Vanta.js background -->
      <div id="vanta-background" class="vanta-background"></div>

      <app-sidebar [currentUser]="currentUser"></app-sidebar>

      <div class="main-content">
        <app-header
          pageTitle="Mushroom"
          [notificationCount]="3"
        >
          <button class="btn-primary btn-new-route" (click)="togglePortSelector()">
            <svg class="play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="#10b981" />
              <polygon points="10,8 17,12 10,16" fill="#ffffff" />
            </svg>
            {{ showPortSelector ? 'Cancelar Selección' : 'Nueva Ruta' }}
          </button>
        </app-header>

        <main class="dashboard-content">
          <!-- Error message display -->
          <div class="error-message" *ngIf="errorMessage">
            <div class="error-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMessage }}</span>
            </div>
            <button class="close-error" (click)="errorMessage = null">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Port Selector Component -->
          <app-port-selector
            *ngIf="showPortSelector"
            [preselectedOrigin]="preselectedOrigin"
            [preselectedDestination]="preselectedDestination"
            [autoVisualize]="autoVisualize"
            (cancel)="handleCancelRouteCreation()"
            class="animate-fadeIn">
          </app-port-selector>

          <div *ngIf="!showPortSelector" class="dashboard-grid animate-fadeIn">
            <!-- Map Component -->
            <div class="map-container">
              <app-map></app-map>
            </div>

            <!-- Popular Routes Section -->
            <div class="routes-container">
              <div class="card-header">
                <h2>Rutas Más Buscadas</h2>
                <div class="card-actions">
                  <!-- Botón 'Nueva Ruta' eliminado aquí porque ya existe en el header -->
                </div>
              </div>
              <div class="routes-grid">
                <div
                  *ngFor="let route of popularRoutes"
                  class="popular-route-card animate-slideInUp"
                  (click)="selectPopularRoute(route)"
                >
                  <div class="route-header">
                    <div class="route-name">{{ route.name }}</div>
                    <div class="popularity-badge" [class]="'popularity-' + route.popularity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                      </svg>
                      {{ route.popularity === 'high' ? 'Muy Popular' : route.popularity === 'medium' ? 'Popular' : 'Trending' }}
                    </div>
                  </div>

                  <div class="route-details">
                    <div class="route-path">
                      <div class="port origin">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <circle cx="12" cy="12" r="4"></circle>
                        </svg>
                        {{ route.originPort }}
                      </div>
                      <div class="route-arrow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                      <div class="port destination">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {{ route.destinationPort }}
                      </div>
                    </div>

                    <div class="route-stats">
                      <div class="stat">
                        <span class="stat-label">Distancia:</span>
                        <span class="stat-value">{{ route.distance }}</span>
                      </div>
                      <div class="stat">
                        <span class="stat-label">Tiempo Est.:</span>
                        <span class="stat-value">{{ route.estimatedTime }}</span>
                      </div>
                      <div class="stat">
                        <span class="stat-label">Búsquedas:</span>
                        <span class="stat-value">{{ route.searchCount }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="route-action">
                    <button class="btn-route-select">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      Ver Animación
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      /* Splash screen styles */
      .splash-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #0f172a;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 1;
        transition: opacity 0.8s ease, transform 1.2s ease;
      }

      .splash-screen.hidden {
        opacity: 0;
        transform: scale(1.2);
        pointer-events: none;
      }

      .splash-content {
        text-align: center;
        color: white;
      }

      .splash-logo {
        margin-bottom: 2rem;
        animation: pulse 2s infinite ease-in-out;
      }

      .splash-content h1 {
        font-size: 3rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        animation: fadeIn 1.5s ease;
      }

      /* Animación de brillo estelar */
      .starry-eyes {
        transform-origin: center;
      }

      /* Estilo para la imagen del splash */
      .splash-image {
        width: 200px;
        height: 200px;
        object-fit: contain;
        display: inline-block;
        border-radius: 12px;
      }

      .splash-image:hover {
        transform: scale(1.03);
      }

      /* Ajuste para pantallas grandes */
      @media (min-width: 1200px) {
        .splash-image {
          width: 210px;
          height: 210px;
        }

        .splash-content h1 {
          font-size: 3.5rem;
        }
      }

      .eye-base {
        animation: pulse-glow 3s infinite ease-in-out;
      }

      .sparkle {
        opacity: 0;
        animation: twinkle 3s infinite;
      }

      .sparkle:nth-child(1) { animation-delay: 0.2s; }
      .sparkle:nth-child(2) { animation-delay: 0.8s; }
      .sparkle:nth-child(3) { animation-delay: 1.4s; }
      .sparkle:nth-child(4) { animation-delay: 2.0s; }

      @keyframes pulse-glow {
        0%, 100% {
          filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
        }
        50% {
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
        }
      }

      @keyframes twinkle {
        0%, 100% {
          opacity: 0;
          transform: scale(0.1);
        }
        10%, 90% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.5) rotate(15deg);
        }
      }

      .app-container {
        display: flex;
        min-height: 100vh;
        position: relative;
      }

      /* Vanta.js background */
      .vanta-background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
      }

      .main-content {
        flex: 1;
        margin-left: 80px;
        transition: margin-left 250ms ease;
        position: relative;
        z-index: 1;

        &.sidebar-expanded {
          margin-left: 260px;
        }
      }

      .dashboard-content {
        padding: 2rem;
        padding-top: calc(70px + 2rem);
      }

      .error-message {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        background-color: rgba(244, 67, 54, 0.9);
        border-left: 4px solid #f44336;
        border-radius: 0.375rem;
        color: #f44336;
        margin-bottom: 1.5rem;
        animation: fadeIn 250ms ease forwards;
        backdrop-filter: blur(10px);

        .error-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .close-error {
          background: none;
          border: none;
          color: #f44336;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 9999px;
          transition: background-color 150ms ease;

          &:hover {
            background-color: rgba(244, 67, 54, 0.1);
          }
        }
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-areas:
        "map"
        "routes";
        gap: 1.5rem;
      }

      .map-container {
        grid-area: map;
        background-color: rgba(255, 255, 255, 0.95);
        border-radius: 0; /* removed border-radius to remove top border */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: calc(100vh - 300px); /* increased height to fill viewport */
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .routes-container {
        grid-area: routes;
        background-color: rgba(255, 255, 255, 0.95);
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid rgba(226, 232, 240, 0.5);
        background-color: rgba(255, 255, 255, 0.8);

        h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #0f172a;
        }
      }

      .card-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .routes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1rem;
        padding: 1.5rem;
      }

      .popular-route-card {
        background-color: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(226, 232, 240, 0.5);
        border-radius: 0.5rem;
        padding: 1.25rem;
        cursor: pointer;
        transition: all 200ms ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: #0a6cbc;
          background-color: rgba(255, 255, 255, 0.95);
        }
      }

      .route-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .route-name {
        font-size: 1rem;
        font-weight: 600;
        color: #0f172a;
        line-height: 1.4;
      }

      .popularity-badge {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;

        &.popularity-high {
          background-color: rgba(34, 197, 94, 0.2);
          color: #16a34a;
        }

        &.popularity-medium {
          background-color: rgba(59, 130, 246, 0.2);
          color: #2563eb;
        }

        &.popularity-low {
          background-color: rgba(245, 158, 11, 0.2);
          color: #d97706;
        }
      }

      .route-details {
        margin-bottom: 1rem;
      }

      .route-path {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background-color: rgba(248, 250, 252, 0.8);
        border-radius: 0.375rem;
        backdrop-filter: blur(5px);
      }

      .port {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #475569;
      }

      .port.origin svg {
        color: #22c55e;
      }

      .port.destination svg {
        color: #dc2626;
      }

      .route-arrow {
        color: #94a3b8;
      }

      .route-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }

      .stat {
        text-align: center;
      }

      .stat-label {
        display: block;
        font-size: 0.75rem;
        color: #64748b;
        margin-bottom: 0.25rem;
      }

      .stat-value {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #0f172a;
      }

      .route-action {
        display: flex;
        justify-content: center;
      }

      .btn-route-select {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background-color: #0a6cbc;
        color: white;
        border: none;
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 150ms ease;
        width: 100%;
        justify-content: center;

        &:hover {
          background-color: #084e88;
        }

        svg {
          flex-shrink: 0;
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

      .btn-outline {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background-color: rgba(255, 255, 255, 0.8);
        color: #475569;
        border: 1px solid rgba(203, 213, 225, 0.5);
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms ease;
        backdrop-filter: blur(5px);

        &:hover {
          background-color: rgba(241, 245, 249, 0.9);
          border-color: #94a3b8;
        }

        svg {
          flex-shrink: 0;
        }
      }

      .btn-sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
      }

      .mr-2 {
        margin-right: 0.5rem;
      }

      /* Estilos para destacar el botón Nueva Ruta */
      .play-icon {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-right: 0.5rem;
      }

      .btn-new-route {
        background-color: #10b981; /* verde */
        border: none;
        color: white;
        box-shadow: 0 6px 18px rgba(16, 185, 129, 0.18), 0 2px 6px rgba(0,0,0,0.08);
        transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
      }

      .btn-new-route:hover {
        transform: translateY(-2px);
        background-color: #0fb06f;
        box-shadow: 0 10px 24px rgba(16, 185, 129, 0.22);
      }

      .btn-new-route:active {
        transform: translateY(0);
        box-shadow: 0 6px 18px rgba(16, 185, 129, 0.14);
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideInUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .animate-fadeIn {
        animation: fadeIn 250ms ease forwards;
      }

      .animate-slideInUp {
        animation: slideInUp 250ms ease forwards;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  currentUser = {
    name: "Usuario Demo",
    role: "Capitán",
  }

  popularRoutes: PopularRoute[] = [
    {
      id: 1,
      name: "Callao - San Francisco",
      originPort: "Callao",
      destinationPort: "San Francisco",
      searchCount: 1247,
      distance: "4,850 nm",
      estimatedTime: "18 días",
      popularity: "high",
    },
    {
      id: 2,
      name: "Shanghai - Los Angeles",
      originPort: "Shanghai",
      destinationPort: "Los Angeles",
      searchCount: 892,
      distance: "6,250 nm",
      estimatedTime: "22 días",
      popularity: "high",
    },
    {
      id: 3,
      name: "Rotterdam - New York",
      originPort: "Rotterdam",
      destinationPort: "New York",
      searchCount: 756,
      distance: "3,400 nm",
      estimatedTime: "14 días",
      popularity: "medium",
    },
    {
      id: 4,
      name: "Singapore - Hamburg",
      originPort: "Singapore",
      destinationPort: "Hamburg",
      searchCount: 634,
      distance: "8,450 nm",
      estimatedTime: "28 días",
      popularity: "medium",
    },
    {
      id: 5,
      name: "Dubai - Mumbai",
      originPort: "Dubai",
      destinationPort: "Mumbai",
      searchCount: 423,
      distance: "1,200 nm",
      estimatedTime: "6 días",
      popularity: "low",
    },
    {
      id: 6,
      name: "Tokyo - Vancouver",
      originPort: "Tokyo",
      destinationPort: "Vancouver",
      searchCount: 387,
      distance: "4,200 nm",
      estimatedTime: "16 días",
      popularity: "low",
    },
  ]

  showPortSelector = false
  errorMessage: string | null = null
  sidebarCollapsed = true
  showSplash = true
  splashHidden = false

  // Nuevas propiedades para preselección
  preselectedOrigin: string | null = null
  preselectedDestination: string | null = null
  autoVisualize = false

  // Vanta.js effect
  private vantaEffect: any = null

  constructor(
    private animationService: AnimationService,
  ) {}

  ngOnInit(): void {
    // Check if sidebar state is saved
    const savedState = localStorage.getItem("sidebar_collapsed")
    if (savedState) {
      this.sidebarCollapsed = savedState === "true"
    }

    // Verificar si el splash ya se mostró en esta sesión
    const splashAlreadyShown = sessionStorage.getItem("splashShown")

    if (splashAlreadyShown) {
      this.showSplash = false
      this.splashHidden = true
      // Initialize Vanta immediately if splash is skipped
      setTimeout(() => this.initVanta(), 100)
    } else {
      sessionStorage.setItem("splashShown", "true")

      // Splash screen timing
      setTimeout(() => {
        this.splashHidden = true
        setTimeout(() => {
          this.showSplash = false
          // Initialize Vanta after splash screen
          setTimeout(() => this.initVanta(), 100)
        }, 800)
      }, 3000)
    }
  }

  ngAfterViewInit(): void {
    // Iniciar animaciones solo después del splash screen
    setTimeout(() => {
      if (this.showSplash) return // Si aún está mostrando el splash, no ejecutar

      // Animate route cards with staggered effect
      this.animationService.animateDashboardCards(".popular-route-card")

      // Add hover animations to cards
      this.animationService.addHoverAnimation(".popular-route-card")

      // Animate statistics when they come into view
      this.animationService.animateOnScroll(".stat-card")

      // Animate progress bars
      const progressBars = document.querySelectorAll(".progress-fill")
      progressBars.forEach((element) => {
        // Cast Element to HTMLElement
        const bar = element as HTMLElement
        const width = bar.style.width
        bar.style.width = "0"
        setTimeout(() => {
          this.animationService.animateProgressBar(bar, width)
        }, 300)
      })

      // Animate counters in statistics
      const statValues = document.querySelectorAll(".stat-value")
      statValues.forEach((element) => {
        // Cast Element to HTMLElement
        const el = element as HTMLElement
        const value = Number.parseInt(el.textContent || "0", 10)
        el.textContent = "0"
        this.animationService.animateCounter(el, value)
      })
    }, 3500) // 3000ms de splash + 500ms de margen
  }

  ngOnDestroy(): void {
    // Clean up Vanta effect
    if (this.vantaEffect) {
      this.vantaEffect.destroy()
    }
  }

  private initVanta(): void {
    if (typeof VANTA !== "undefined" && VANTA.WAVES) {
      const vantaElement = document.getElementById("vanta-background")
      if (vantaElement) {
        this.vantaEffect = VANTA.WAVES({
          el: vantaElement,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x759298,
          shininess: 18.0,
          waveHeight: 40.0,
          zoom: 0.65,
        })
      }
    }
  }

  togglePortSelector(): void {
    // Limpiar preselecciones cuando se abre manualmente
    this.preselectedOrigin = null
    this.preselectedDestination = null
    this.autoVisualize = false
    this.showPortSelector = !this.showPortSelector
  }

  selectPopularRoute(route: PopularRoute): void {
    console.log("Ruta popular seleccionada:", route)

    // Configurar preselecciones
    this.preselectedOrigin = route.originPort
    this.preselectedDestination = route.destinationPort
    this.autoVisualize = true

    // Mostrar el port selector
    this.showPortSelector = true
  }

  handleCancelRouteCreation(): void {
    this.showPortSelector = false
    // Limpiar preselecciones
    this.preselectedOrigin = null
    this.preselectedDestination = null
    this.autoVisualize = false
  }
}
