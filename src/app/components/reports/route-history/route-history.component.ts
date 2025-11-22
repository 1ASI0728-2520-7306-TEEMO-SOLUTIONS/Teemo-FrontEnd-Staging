import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import * as L from 'leaflet'
import { SidebarComponent } from '../../shared/sidebar/sidebar.component'
import { HeaderComponent } from '../../shared/header/header.component'
import {
  RouteHistoryFilters,
  RouteHistoryItemResource,
  RouteHistoryService,
  RouteHistorySource,
  RouteHistoryStatus,
} from '../../../services/route-history.service'
import { AuthService, User } from '../../../services/auth.service'
import { GoogleAnalyticsService } from '../../../services/google-analytics.service'
import { PortService, type Port } from '../../../services/port.service'
import { ThemeService } from '../../../services/theme.service'
import { Subscription } from 'rxjs'

declare const VANTA: any

interface PaginationState {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

@Component({
  selector: 'app-route-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent, HeaderComponent],
  templateUrl: './route-history.component.html',
  styleUrls: ['./route-history.component.css'],
})
export class RouteHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>

  currentUser: User | null = null
  sidebarUser = { name: 'Usuario', role: 'Operador' }

  filterForm: FormGroup
  routeHistory: RouteHistoryItemResource[] = []
  pagination: PaginationState = { page: 0, size: 20, totalElements: 0, totalPages: 0 }
  nextCursorHint?: string
  telemetryCount: number | null = null

  loadingList = false
  loadingDetail = false
  archiving = false
  showArchiveDialog = false

  selectedItem?: RouteHistoryItemResource
  errorMessage?: string
  detailError?: string
  archiveError?: string
  archiveNotes = ''

  readonly statusOptions: RouteHistoryStatus[] = ['SUCCESS', 'NO_VIABLE_ROUTE', 'CANCELLED']
  readonly sourceOptions: RouteHistorySource[] = ['AUTO', 'MANUAL', 'OPERATOR_OVERRIDE']
  readonly pageSizes = [10, 20, 50]

  private mapInstance?: L.Map
  private routeLayer?: L.Polyline
  private geoLayer?: L.GeoJSON
  private tileLayer?: L.TileLayer
  private viewInitialized = false
  private portNameMap = new Map<string, string>()
  private vantaEffect: any = null
  private themeSub?: Subscription
  private isDarkMode = false

  constructor(
    private routeHistoryService: RouteHistoryService,
    private authService: AuthService,
    private analytics: GoogleAnalyticsService,
    private portService: PortService,
    private fb: FormBuilder,
    private themeService: ThemeService,
  ) {
    this.filterForm = this.fb.group({
      from: [''],
      to: [''],
      status: [''],
      source: [''],
      routeId: [''],
      archived: ['false'],
      userId: [''],
      size: [20],
    })
  }

  ngOnInit(): void {
    this.themeSub = this.themeService.isDarkMode$.subscribe((isDark) => {
      this.isDarkMode = isDark
      if (this.vantaEffect) {
        this.rebuildVanta()
      }
    })

    this.currentUser = this.authService.currentUserValue
    this.sidebarUser = {
      name: this.currentUser?.name || this.currentUser?.username || 'Usuario',
      role: this.readableRole(),
    }

    if (this.currentUser?.id) {
      this.filterForm.patchValue({ userId: this.currentUser.id })
      this.initializeData()
    } else {
      this.errorMessage = 'No se pudo determinar el usuario autenticado.'
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true
    if (this.selectedItem) {
      setTimeout(() => this.renderMap(), 0)
    }
    setTimeout(() => this.initVanta(), 0)
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe()
    this.destroyMap()
    this.destroyVanta()
  }

  get canFilterByUser(): boolean {
    return this.hasRole('ROLE_OPERATOR') || this.hasRole('ROLE_ADMIN')
  }

  applyFilters(): void {
    this.loadRouteHistory(0)
  }

  resetFilters(): void {
    this.filterForm.reset({
      from: '',
      to: '',
      status: '',
      source: '',
      routeId: '',
      archived: 'false',
      userId: this.canFilterByUser ? '' : this.currentUser?.id ?? '',
      size: 20,
    })
    this.pagination.size = 20
    this.loadRouteHistory(0)
  }

  refresh(): void {
    this.loadRouteHistory(this.pagination.page)
  }

  onPageSizeChange(): void {
    const size = Number(this.filterForm.get('size')?.value) || 20
    this.pagination.size = size
    this.loadRouteHistory(0)
  }

  changePage(delta: number): void {
    const nextPage = this.pagination.page + delta
    if (nextPage < 0 || nextPage >= Math.max(this.pagination.totalPages, 1)) {
      return
    }
    this.loadRouteHistory(nextPage)
  }

  selectHistoryItem(item: RouteHistoryItemResource): void {
    if (!item?.id) return
    if (this.selectedItem?.id === item.id && !this.detailError) {
      return
    }
    this.loadHistoryDetails(item.id)
  }

  clearSelection(): void {
    this.selectedItem = undefined
    this.detailError = undefined
    this.showArchiveDialog = false
    this.archiveError = undefined
    this.archiveNotes = ''
    this.destroyMap()
  }

  openArchiveDialog(): void {
    this.showArchiveDialog = true
    this.archiveError = undefined
  }

  closeArchiveDialog(): void {
    this.showArchiveDialog = false
    this.archiveNotes = ''
    this.archiveError = undefined
  }

  archiveSelected(): void {
    if (!this.selectedItem) return
    this.archiving = true
    this.archiveError = undefined
    this.routeHistoryService.archiveHistoryItem(this.selectedItem.id, this.archiveNotes).subscribe({
      next: (item) => {
        this.archiving = false
        this.showArchiveDialog = false
        this.archiveNotes = ''
        this.selectedItem = item
        this.updateListItem(item)
        this.analytics.trackEvent('route_history_archive', 'RouteHistory', item.id)
      },
      error: (err) => {
        this.archiving = false
        this.archiveError = err?.message || 'No se pudo archivar el historial.'
      },
    })
  }

  trackByHistoryId(_: number, item: RouteHistoryItemResource): string {
    return item.id
  }

  hasGeometry(item: RouteHistoryItemResource): boolean {
    return Boolean(item.geojson) || Boolean(item.pathEncoding)
  }

  canArchiveSelected(): boolean {
    if (!this.selectedItem || this.selectedItem.archived) {
      return false
    }
    return this.hasRole('ROLE_OPERATOR') || this.hasRole('ROLE_ADMIN')
  }

  routeLabel(item: RouteHistoryItemResource): string {
    const origin = this.resolvePortName(item.originPortId)
    const destination = this.resolvePortName(item.destinationPortId)
    return `${origin} → ${destination}`
  }

  resolvePortName(portId?: string): string {
    if (!portId) return 'N/D'
    return this.portNameMap.get(portId) ?? portId
  }

  formatDateTime(iso?: string): string {
    if (!iso) return 'N/D'
    const date = new Date(iso)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  formatDistance(distance?: number): string {
    if (distance === undefined || distance === null) return 'N/D'
    return `${distance.toFixed(1)} nm`
  }

  formatDuration(hours?: number): string {
    if (hours === undefined || hours === null) return 'N/D'
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    if (days > 0) {
      return `${days}d ${remainingHours}h`
    }
    return `${hours.toFixed(1)} h`
  }

  formatCost(cost?: number): string {
    if (cost === undefined || cost === null) return 'N/D'
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
      cost,
    )
  }

  private initializeData(): void {
    this.loadPortsDirectory(() => this.loadRouteHistory())
  }

  private loadPortsDirectory(done?: () => void): void {
    this.portService.getAllPorts().subscribe({
      next: (ports) => {
        this.indexPorts(ports)
        done?.()
      },
      error: (err) => {
        console.warn('No se pudieron cargar los puertos, se mostrarán IDs.', err)
        done?.()
      },
    })
  }

  private indexPorts(ports: Port[]): void {
    ports.forEach((port) => {
      if (port?.id && port?.name) {
        this.portNameMap.set(port.id, port.name)
      }
    })
  }

  private loadRouteHistory(page = 0): void {
    const userId = this.resolveUserId()
    if (!userId) {
      this.errorMessage = 'Debes seleccionar un usuario válido.'
      return
    }

    const filters = this.buildFilters(page)
    this.loadingList = true
    this.errorMessage = undefined

    this.routeHistoryService.getRouteHistoryForUser(userId, filters).subscribe({
      next: (response) => {
        this.loadingList = false
        this.routeHistory = response.items
        this.pagination = {
          page: response.page,
          size: response.size,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
        }
        this.nextCursorHint = response.nextCursor ?? undefined
        this.telemetryCount = response.items.length
        this.analytics.trackEvent('route_history_list', 'RouteHistory', 'items', response.items.length)
        if (this.selectedItem) {
          const updated = response.items.find((item) => item.id === this.selectedItem?.id)
          if (updated) {
            this.selectedItem = { ...this.selectedItem, ...updated }
          }
        }
      },
      error: (err) => {
        this.loadingList = false
        this.errorMessage = err?.message || 'No se pudo cargar el historial.'
      },
    })
  }

  private loadHistoryDetails(historyId: string): void {
    this.loadingDetail = true
    this.detailError = undefined
    this.routeHistoryService.getHistoryItem(historyId).subscribe({
      next: (item) => {
        this.loadingDetail = false
        this.selectedItem = item
        this.showArchiveDialog = false
        this.archiveError = undefined
        this.analytics.trackEvent('route_history_detail', 'RouteHistory', item.id)
        if (this.viewInitialized) {
          setTimeout(() => this.renderMap(), 0)
        }
      },
      error: (err) => {
        this.loadingDetail = false
        this.detailError = err?.message || 'No se pudo cargar el detalle.'
      },
    })
  }

  private buildFilters(page: number): RouteHistoryFilters {
    const raw = this.filterForm.value
    const filters: RouteHistoryFilters = {
      page,
      size: this.pagination.size,
    }

    if (raw.from) {
      filters.from = this.composeIso(raw.from, 'start')
    }
    if (raw.to) {
      filters.to = this.composeIso(raw.to, 'end')
    }
    if (raw.status) {
      filters.status = raw.status
    }
    if (raw.source) {
      filters.source = raw.source
    }
    if (raw.routeId?.trim()) {
      filters.routeId = raw.routeId.trim()
    }

    if (raw.archived === 'true') {
      filters.archived = true
    } else if (raw.archived === 'false') {
      filters.archived = false
    }

    const size = Number(raw.size)
    if (!Number.isNaN(size) && size > 0) {
      filters.size = size
      this.pagination.size = size
    }

    return filters
  }

  private composeIso(date: string, boundary: 'start' | 'end'): string {
    const base = new Date(date)
    if (Number.isNaN(base.getTime())) {
      return date
    }

    if (boundary === 'start') {
      base.setUTCHours(0, 0, 0, 0)
    } else {
      base.setUTCHours(23, 59, 59, 999)
    }
    return base.toISOString()
  }

  private resolveUserId(): string | undefined {
    const rawUserId = this.filterForm.get('userId')?.value?.trim()
    if (this.canFilterByUser && rawUserId) {
      return rawUserId
    }
    return this.currentUser?.id
  }

  private hasRole(role: string): boolean {
    const normalized = role.toUpperCase()
    const roles = [
      ...(this.currentUser?.roles ?? []),
      this.currentUser?.role ?? '',
    ]
      .filter(Boolean)
      .map((r) => r.toUpperCase())
    return roles.includes(normalized)
  }

  private readableRole(): string {
    if (this.currentUser?.role) {
      return this.currentUser.role.replace('ROLE_', '').toLowerCase()
    }
    if (this.currentUser?.roles?.length) {
      return this.currentUser.roles[0].replace('ROLE_', '').toLowerCase()
    }
    return 'usuario'
  }

  private updateListItem(updated: RouteHistoryItemResource): void {
    this.routeHistory = this.routeHistory.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
  }

  private renderMap(): void {
    if (!this.selectedItem || !this.hasGeometry(this.selectedItem)) {
      this.destroyMap()
      return
    }

    const container = this.mapContainer?.nativeElement
    if (!container) return

    if (!this.mapInstance) {
      this.mapInstance = L.map(container, {
        zoomControl: true,
        attributionControl: false,
      })
      this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      })
      this.tileLayer.addTo(this.mapInstance)
    } else {
      this.mapInstance.invalidateSize()
    }

    this.geoLayer?.remove()
    this.routeLayer?.remove()

    if (this.selectedItem.geojson) {
      this.geoLayer = L.geoJSON(this.selectedItem.geojson as any, {
        style: { color: '#0a6cbc', weight: 3 },
      }).addTo(this.mapInstance)
      this.mapInstance.fitBounds(this.geoLayer.getBounds(), { padding: [20, 20] })
    } else if (this.selectedItem.pathEncoding) {
      const coordinates = this.decodePathEncoding(this.selectedItem.pathEncoding)
      if (coordinates.length > 0) {
        this.routeLayer = L.polyline(coordinates, { color: '#2563eb', weight: 3 }).addTo(this.mapInstance)
        this.mapInstance.fitBounds(this.routeLayer.getBounds(), { padding: [20, 20] })
      }
    }
  }

  private destroyMap(): void {
    if (this.mapInstance) {
      this.mapInstance.remove()
      this.mapInstance = undefined
      this.routeLayer = undefined
      this.geoLayer = undefined
      this.tileLayer = undefined
    }
  }

  private initVanta(): void {
    if (this.vantaEffect) return
    if (typeof window === 'undefined') return
    if (typeof VANTA === 'undefined' || !VANTA.WAVES) return

    const target = document.getElementById('history-vanta-background')
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
    return this.isDarkMode ? 0x0c0c1d : 0x759298
  }

  private destroyVanta(): void {
    if (this.vantaEffect) {
      this.vantaEffect.destroy()
      this.vantaEffect = null
    }
  }

  private decodePathEncoding(encoded: string): L.LatLngExpression[] {
    const coordinates: L.LatLngExpression[] = []
    let index = 0
    let lat = 0
    let lng = 0

    while (index < encoded.length) {
      let result = 0
      let shift = 0
      let b: number
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1
      lat += deltaLat

      result = 0
      shift = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1
      lng += deltaLng

      coordinates.push([lat / 1e5, lng / 1e5])
    }

    return coordinates
  }
}
