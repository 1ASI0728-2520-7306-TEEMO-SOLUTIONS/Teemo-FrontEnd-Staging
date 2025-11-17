import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http'
import { Observable, throwError } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from '../../environments/environment'

export type RouteHistoryStatus = 'SUCCESS' | 'NO_VIABLE_ROUTE' | 'CANCELLED'
export type RouteHistorySource = 'AUTO' | 'MANUAL' | 'OPERATOR_OVERRIDE'

export interface RouteHistoryItemResource {
  id: string
  tenantId?: string
  userId: string
  routeId?: string
  originPortId: string
  destinationPortId: string
  waypointPortIds?: string[]
  avoidedPortIds?: string[]
  computedAt: string
  engineVersion?: string
  totalDistance?: number
  durationEstimate?: number
  costEstimate?: number
  status: RouteHistoryStatus
  source: RouteHistorySource
  notes?: string
  archived: boolean
  metadata?: Record<string, unknown>
  pathEncoding?: string
  geojson?: Record<string, unknown>
}

export interface RouteHistoryListResponse {
  items: RouteHistoryItemResource[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  nextCursor?: string
}

export interface RouteHistoryFilters {
  from?: Date | string
  to?: Date | string
  status?: RouteHistoryStatus
  source?: RouteHistorySource
  archived?: boolean
  routeId?: string
  page?: number
  size?: number
}

@Injectable({
  providedIn: 'root',
})
export class RouteHistoryService {
  private readonly apiUrl = environment.apiUrl

  constructor(private http: HttpClient) {}

  getRouteHistoryForUser(userId: string, filters: RouteHistoryFilters = {}): Observable<RouteHistoryListResponse> {
    const params = this.buildListParams(filters)

    return this.http
      .get<RouteHistoryListResponse>(`${this.apiUrl}/users/${userId}/route-history`, { params })
      .pipe(
        map((response) => ({
          ...response,
          items: [...(response.items ?? [])].sort((a, b) =>
            b.computedAt.localeCompare(a.computedAt),
          ),
        })),
        catchError((error) => this.handleError('cargar el historial de rutas', error)),
      )
  }

  getHistoryItem(historyId: string): Observable<RouteHistoryItemResource> {
    return this.http
      .get<RouteHistoryItemResource>(`${this.apiUrl}/route-history/${historyId}`)
      .pipe(catchError((error) => this.handleError('consultar el detalle del historial', error)))
  }

  archiveHistoryItem(historyId: string, notes?: string): Observable<RouteHistoryItemResource> {
    const body = notes?.trim()?.length ? { notes: notes.trim() } : {}

    return this.http
      .patch<RouteHistoryItemResource>(`${this.apiUrl}/route-history/${historyId}/archive`, body)
      .pipe(catchError((error) => this.handleError('archivar el historial', error)))
  }

  private buildListParams(filters: RouteHistoryFilters = {}): HttpParams {
    let params = new HttpParams()

    if (filters.from) {
      const formatted = this.formatIso(filters.from)
      if (formatted) params = params.set('from', formatted)
    }

    if (filters.to) {
      const formatted = this.formatIso(filters.to)
      if (formatted) params = params.set('to', formatted)
    }

    if (filters.status) {
      params = params.set('status', filters.status)
    }

    if (filters.source) {
      params = params.set('source', filters.source)
    }

    if (typeof filters.archived === 'boolean') {
      params = params.set('archived', String(filters.archived))
    }

    if (filters.routeId?.trim()) {
      params = params.set('routeId', filters.routeId.trim())
    }

    if (Number.isFinite(filters.page)) {
      params = params.set('page', String(filters.page))
    }

    if (Number.isFinite(filters.size)) {
      params = params.set('size', String(filters.size))
    }

    return params
  }

  private formatIso(value: string | Date): string | undefined {
    if (value instanceof Date) {
      return value.toISOString()
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
  }

  private handleError(context: string, error: HttpErrorResponse) {
    let message = `No se pudo ${context}.`

    if (error.status === 403) {
      message = 'No tienes permisos para realizar esta acción.'
    } else if (error.status === 404) {
      message = 'El registro solicitado no existe o ya no está disponible.'
    } else if (error.error?.message) {
      message = error.error.message
    } else if (error.status === 0) {
      message = 'No se pudo conectar con el backend. Verifica tu conexión.'
    }

    console.error(`RouteHistoryService: ${message}`, error)
    return throwError(() => ({
      message,
      status: error.status,
      error,
    }))
  }
}
