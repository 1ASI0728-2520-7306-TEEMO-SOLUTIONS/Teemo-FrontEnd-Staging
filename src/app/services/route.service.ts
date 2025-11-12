import { Injectable, Injector } from "@angular/core"
import { HttpClient, type HttpErrorResponse, HttpParams } from "@angular/common/http"
import { Observable, throwError } from "rxjs"
import { catchError } from "rxjs/operators"
import { environment } from "../../environments/environment"
import { ReportService } from "./report.service"

export interface RoutePort {
  id: number
  name: string
}

export interface Route {
  id: number
  name: string
  status: string
  vessels: number
  distance: string
  eta: string
  originPortId?: number
  destinationPortId?: number
  departureDate?: string
  ports?: RoutePort[]
}

export interface CreateRouteRequest {
  name: string
  from: string
  to: string
  vessels: number
  departureDate: string
  status: string
}

export interface RoutePlanResult {
  route: string[]
  message: string
  name?: string
  distance?: number
  vessels?: number
  departureDate?: string
  eta?: string
  status?: string
}

// Añadir estos nuevos tipos para manejar la respuesta del endpoint de cálculo de ruta
export interface RouteCalculationResource {
  optimalRoute: string[]
  totalDistance: number
  warnings: string[]
  coordinatesMapping?: { [portName: string]: { latitude: number; longitude: number } }
  metadata?: any
}

export interface RouteDistanceResource {
  distance: number
  messages: string[]
  metadata: Record<string, any>
}

export interface RouteReportData {
  name: string
  originPortId: string
  destinationPortId: string
  departureDate: string
  vessels: number
  status: string
  intermediatePorts: string[]
  routeData: RouteCalculationResource
}

@Injectable({
  providedIn: "root",
})
export class RouteService {
  private apiUrl = `${environment.apiUrl}/routes`

  constructor(
    private http: HttpClient,
    private injector: Injector,
  ) {}

  // GET /api/v1/routes/find
  findRoute(from: string, to: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/find?from=${from}&to=${to}`).pipe(catchError(this.handleError))
  }

  // GET /api/v1/routes/ports
  getRoutePorts(): Observable<RoutePort[]> {
    return this.http.get<RoutePort[]>(`${this.apiUrl}/ports`).pipe(catchError(this.handleError))
  }

  // POST /api/v1/routes/plan
  planRoute(routeData: CreateRouteRequest): Observable<RoutePlanResult> {
    return this.http.post<RoutePlanResult>(`${this.apiUrl}/plan`, routeData).pipe(catchError(this.handleError))
  }

  // Get route by ID (assuming you'll add this endpoint)
  getRouteById(routeId: number): Observable<Route> {
    return this.http.get<Route>(`${this.apiUrl}/${routeId}`).pipe(catchError(this.handleError))
  }

  // Método modificado para calcular la ruta óptima incluyendo puertos intermedios
  calculateOptimalRoute(
    startPortId: string,
    endPortId: string,
    intermediatePortIds: string[] = [],
  ): Observable<RouteCalculationResource> {
    const payload = {
      startPortId,
      endPortId,
      intermediatePortIds: intermediatePortIds ?? [],
    }

    console.log("Parámetros de la solicitud:", payload)

    let params = new HttpParams().set("startPortId", startPortId).set("endPortId", endPortId)

    if (intermediatePortIds && intermediatePortIds.length > 0) {
      params = params.set("intermediatePortIds", intermediatePortIds.join(","))
    }

    return this.http
      .post<RouteCalculationResource>(`${this.apiUrl}/calculate-optimal-route`, payload, { params })
      .pipe(catchError(this.handleError))
  }

  // Método para obtener la distancia entre dos puertos
  getDistanceBetweenPorts(startPort: string, endPort: string): Observable<RouteDistanceResource> {
    const params = new HttpParams().set("startPort", startPort).set("endPort", endPort)

    return this.http
      .get<RouteDistanceResource>(`${this.apiUrl}/distance-between-ports`, { params })
      .pipe(catchError(this.handleError))
  }

  recalculateRoute(routeId: string, payload: { avoidedPortIds?: string[] } = {}): Observable<RouteCalculationResource> {
    return this.http
      .post<RouteCalculationResource>(`${this.apiUrl}/${routeId}/recalculate`, payload)
      .pipe(catchError(this.handleError))
  }

  // Método para crear un reporte basado en una ruta
  createRouteReport(routeData: any): Observable<any> {
    // En un entorno real, esto enviaría los datos al backend
    // Para este ejemplo, vamos a simular la creación de un reporte
    return new Observable((observer) => {
      try {
        // Simular un retraso de red
        setTimeout(() => {
          // Generar un ID único para el reporte
          const reportId = `SHP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0")}`

          // Calcular una fecha de llegada estimada (15 días después de la salida)
          const departureDate = new Date(routeData.departureDate)
          const arrivalDate = new Date(departureDate)
          arrivalDate.setDate(departureDate.getDate() + 15)

          // Crear el reporte
          const report: any = {
            id: Math.floor(Math.random() * 1000) + 10, // ID numérico aleatorio
            shipmentId: reportId,
            routeName: routeData.name,
            departureDate: departureDate.toISOString(),
            arrivalDate: arrivalDate.toISOString(),
            totalTime: "15d 0h 0m", // Tiempo estimado
            distance: `${routeData.routeData.totalDistance || 5000} nm`,
            vessel: "Maritime Explorer",
            events: [
              {
                timestamp: departureDate.toISOString(),
                type: "Departure",
                description: `Vessel departed from ${routeData.name.split(" a ")[0]} port`,
                location: routeData.name.split(" a ")[0],
              },
              {
                timestamp: arrivalDate.toISOString(),
                type: "Arrival",
                description: `Vessel arrived at ${routeData.name.split(" a ")[1]} port`,
                location: routeData.name.split(" a ")[1],
              },
            ],
            emissions: {
              co2: `${Math.floor((routeData.routeData.totalDistance || 5000) * 0.15)} tons`,
              nox: `${Math.floor((routeData.routeData.totalDistance || 5000) * 0.004)} tons`,
              sox: `${Math.floor((routeData.routeData.totalDistance || 5000) * 0.002)} tons`,
            },
          }

          // Añadir el reporte al servicio de reportes
          this.addReportToService(report)

          // Notificar éxito
          observer.next({ success: true, reportId: reportId })
          observer.complete()
        }, 1000)
      } catch (error) {
        observer.error(error)
      }
    })
  }

  // Método privado para añadir el reporte al servicio de reportes
  private addReportToService(report: any): void {
    // Obtener una referencia al servicio de reportes
    const reportService = this.injector.get(ReportService)

    // Añadir el reporte a la lista de reportes
    reportService.addReport(report)
  }

  // Handle HTTP errors
  private handleError(error: HttpErrorResponse) {
    let errorMessage = "An unknown error occurred"

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = "Could not connect to the server. Please check your internet connection."
      } else if (error.status === 404) {
        errorMessage = "The requested route could not be found."
      } else if (error.status === 400) {
        errorMessage = error.error?.message || "Invalid request. Please check your input."
      } else if (error.status === 500) {
        errorMessage = error.error?.message || "Server error. Please try again later."
      } else {
        errorMessage = `Error ${error.status}: ${error.error?.message || error.statusText}`
      }
    }

    console.error("Route service error:", error)
    return throwError(() => new Error(errorMessage))
  }
}
