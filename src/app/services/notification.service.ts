import { Injectable } from "@angular/core"
import { HttpClient, HttpHeaders, HttpParams, type HttpErrorResponse } from "@angular/common/http"
import { Observable, throwError } from "rxjs"
import { catchError } from "rxjs/operators"
import { environment } from "../../environments/environment"
import { AuthService } from "./auth.service"

export interface NotificationResource {
  id: string
  type: string
  title: string
  message: string
  portId?: string
  portName?: string
  action?: "ENABLED" | "DISABLED" | string
  reason?: string
  performedBy?: string
  audience?: string
  createdAt: string
  read: boolean
  readAt?: string | null
}

export interface NotificationCollectionResource {
  items: NotificationResource[]
  totalItems: number
  totalPages: number
  page: number
  size: number
  hasNext: boolean
}

export interface NotificationQuery {
  page?: number
  limit?: number
  order?: "asc" | "desc"
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getNotifications(query: NotificationQuery = {}): Observable<NotificationCollectionResource> {
    const headers = this.buildAuthHeaders()
    let params = new HttpParams()

    if (typeof query.page === "number") {
      params = params.set("page", String(query.page))
    }
    if (typeof query.limit === "number") {
      params = params.set("limit", String(query.limit))
    }
    if (query.order) {
      params = params.set("order", query.order)
    }

    return this.http
      .get<NotificationCollectionResource>(this.apiUrl, { headers, params })
      .pipe(catchError((error) => this.handleError(error, "obtener las notificaciones")))
  }

  markAsRead(notificationId: string): Observable<void> {
    const headers = this.buildAuthHeaders()
    return this.http
      .patch<void>(`${this.apiUrl}/${notificationId}/read`, {}, { headers })
      .pipe(catchError((error) => this.handleError(error, "marcar la notificación como leída")))
  }

  markManyAsRead(notificationIds: string[]): Observable<void> {
    const headers = this.buildAuthHeaders()
    return this.http
      .post<void>(`${this.apiUrl}/read`, { ids: notificationIds }, { headers })
      .pipe(catchError((error) => this.handleError(error, "marcar las notificaciones como leídas")))
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return new HttpHeaders(headers)
  }

  private handleError(error: HttpErrorResponse, action: string) {
    console.error(`Error al ${action}:`, error)
    const message =
      error.error?.message ||
      error.message ||
      "Ocurrió un problema inesperado con el servicio de notificaciones."
    return throwError(() => new Error(message))
  }
}
