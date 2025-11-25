import { Injectable } from "@angular/core"
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http"
import { type Observable, of } from "rxjs"
import { delay, map, catchError } from "rxjs/operators"
import { environment } from "../../environments/environment"

export interface ShipmentReport {
  id: number
  historyId?: string
  shipmentId: string
  routeName: string
  departureDate: string
  arrivalDate: string
  totalTime: string
  distance: string
  vessel: string
  events: ShipmentEvent[]
  emissions: {
    co2: string
    nox: string
    sox: string
  }
}

export interface ShipmentEvent {
  timestamp: string
  type: string
  description: string
  location?: string
}

export interface RouteHistoryItem {
  id: number
  routeName: string
  originPort: string
  destinationPort: string
  departureDate: string
  arrivalDate: string
  vessel: string
  status: string
  distance: string
  emissions: string
}

export interface RouteReportSummaryResource {
  historyId: string
  shipmentId?: string
  routeLabel: string
  departureDate?: string
  arrivalDate?: string
  vesselName?: string
  distanceNm?: number
  totalDurationHours?: number
  co2Tons?: number
  noxTons?: number
  soxTons?: number
  events?: ShipmentEvent[]
}

export interface RouteReportSummaryListResponse {
  items: RouteReportSummaryResource[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

@Injectable({
  providedIn: "root",
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/api/v1/reports`
  private downloadsApiUrl = `${environment.apiUrl}/reports`
  private readonly reportsListUrl = `${environment.apiUrl}/reports`

  private mockShipmentReports: ShipmentReport[] = [
    {
      id: 1,
      shipmentId: "SHP-2023-001",
      routeName: "Singapore to Rotterdam",
      departureDate: "2023-01-15T08:30:00Z",
      arrivalDate: "2023-02-20T14:45:00Z",
      totalTime: "36d 6h 15m",
      distance: "8,450 nm",
      vessel: "Pacific Voyager",
      events: [
        {
          timestamp: "2023-01-15T08:30:00Z",
          type: "Departure",
          description: "Vessel departed from Singapore port",
          location: "Singapore",
        },
        {
          timestamp: "2023-01-28T10:15:00Z",
          type: "Weather",
          description: "Encountered heavy storm, reduced speed",
          location: "Indian Ocean",
        },
        {
          timestamp: "2023-02-10T16:45:00Z",
          type: "Maintenance",
          description: "Minor engine maintenance performed",
          location: "Mediterranean Sea",
        },
        {
          timestamp: "2023-02-20T14:45:00Z",
          type: "Arrival",
          description: "Vessel arrived at Rotterdam port",
          location: "Rotterdam",
        },
      ],
      emissions: {
        co2: "1,250 tons",
        nox: "35 tons",
        sox: "12 tons",
      },
    },
    {
      id: 2,
      shipmentId: "SHP-2023-002",
      routeName: "Shanghai to Los Angeles",
      departureDate: "2023-02-05T09:15:00Z",
      arrivalDate: "2023-03-10T11:30:00Z",
      totalTime: "33d 2h 15m",
      distance: "6,250 nm",
      vessel: "Asian Explorer",
      events: [
        {
          timestamp: "2023-02-05T09:15:00Z",
          type: "Departure",
          description: "Vessel departed from Shanghai port",
          location: "Shanghai",
        },
        {
          timestamp: "2023-02-18T14:30:00Z",
          type: "Weather",
          description: "Favorable winds, increased speed",
          location: "Pacific Ocean",
        },
        {
          timestamp: "2023-03-01T07:45:00Z",
          type: "Incident",
          description: "Minor collision with floating debris",
          location: "North Pacific",
        },
        {
          timestamp: "2023-03-10T11:30:00Z",
          type: "Arrival",
          description: "Vessel arrived at Los Angeles port",
          location: "Los Angeles",
        },
      ],
      emissions: {
        co2: "980 tons",
        nox: "28 tons",
        sox: "9 tons",
      },
    },
    {
      id: 3,
      shipmentId: "SHP-2023-003",
      routeName: "New York to Southampton",
      departureDate: "2023-03-20T12:00:00Z",
      arrivalDate: "2023-04-05T16:30:00Z",
      totalTime: "16d 4h 30m",
      distance: "3,400 nm",
      vessel: "Atlantic Carrier",
      events: [
        {
          timestamp: "2023-03-20T12:00:00Z",
          type: "Departure",
          description: "Vessel departed from New York port",
          location: "New York",
        },
        {
          timestamp: "2023-03-25T08:15:00Z",
          type: "Weather",
          description: "Rough seas, reduced speed",
          location: "North Atlantic",
        },
        {
          timestamp: "2023-04-01T19:45:00Z",
          type: "Maintenance",
          description: "Routine equipment check",
          location: "North Atlantic",
        },
        {
          timestamp: "2023-04-05T16:30:00Z",
          type: "Arrival",
          description: "Vessel arrived at Southampton port",
          location: "Southampton",
        },
      ],
      emissions: {
        co2: "620 tons",
        nox: "18 tons",
        sox: "6 tons",
      },
    },
  ]

  private mockRouteHistory: RouteHistoryItem[] = [
    {
      id: 1,
      routeName: "Singapore to Rotterdam",
      originPort: "Singapore",
      destinationPort: "Rotterdam",
      departureDate: "2023-01-15",
      arrivalDate: "2023-02-20",
      vessel: "Pacific Voyager",
      status: "Completed",
      distance: "8,450 nm",
      emissions: "1,250 tons CO2",
    },
    {
      id: 2,
      routeName: "Shanghai to Los Angeles",
      originPort: "Shanghai",
      destinationPort: "Los Angeles",
      departureDate: "2023-02-05",
      arrivalDate: "2023-03-10",
      vessel: "Asian Explorer",
      status: "Completed",
      distance: "6,250 nm",
      emissions: "980 tons CO2",
    },
    {
      id: 3,
      routeName: "New York to Southampton",
      originPort: "New York",
      destinationPort: "Southampton",
      departureDate: "2023-03-20",
      arrivalDate: "2023-04-05",
      vessel: "Atlantic Carrier",
      status: "Completed",
      distance: "3,400 nm",
      emissions: "620 tons CO2",
    },
    {
      id: 4,
      routeName: "Dubai to Mumbai",
      originPort: "Dubai",
      destinationPort: "Mumbai",
      departureDate: "2023-04-10",
      arrivalDate: "2023-04-18",
      vessel: "Arabian Star",
      status: "Completed",
      distance: "1,200 nm",
      emissions: "320 tons CO2",
    },
    {
      id: 5,
      routeName: "Rotterdam to New York",
      originPort: "Rotterdam",
      destinationPort: "New York",
      departureDate: "2023-05-05",
      arrivalDate: "2023-05-22",
      vessel: "European Voyager",
      status: "Completed",
      distance: "3,500 nm",
      emissions: "630 tons CO2",
    },
    {
      id: 6,
      routeName: "Los Angeles to Tokyo",
      originPort: "Los Angeles",
      destinationPort: "Tokyo",
      departureDate: "2023-06-10",
      arrivalDate: "2023-07-05",
      vessel: "Pacific Explorer",
      status: "Completed",
      distance: "5,500 nm",
      emissions: "850 tons CO2",
    },
  ]

  constructor(private http: HttpClient) {}

  getShipmentReports(): Observable<ShipmentReport[]> {
    if (environment.mockBackend) {
      return of(this.mockShipmentReports).pipe(delay(800))
    }

    const params = new HttpParams().set("page", "0").set("size", "20")
    return this.http.get<RouteReportSummaryListResponse>(this.reportsListUrl, { params }).pipe(
      map((response) => (response.items ?? []).map((item, idx) => this.mapSummaryToReport(item, idx))),
      catchError((error) => {
        console.error("Error al cargar los reportes reales, usando mocks.", error)
        return of(this.mockShipmentReports)
      }),
    )
  }

  getShipmentReportById(id: number): Observable<ShipmentReport | undefined> {
    const report = this.mockShipmentReports.find((r) => r.id === id)
    return of(report).pipe(delay(500))
  }

  getRouteHistory(filters?: any): Observable<RouteHistoryItem[]> {
    let filteredHistory = [...this.mockRouteHistory]

    if (filters) {
      if (filters.startDate && filters.endDate) {
        filteredHistory = filteredHistory.filter(
          (item) =>
            new Date(item.departureDate) >= new Date(filters.startDate) &&
            new Date(item.departureDate) <= new Date(filters.endDate),
        )
      }

      if (filters.destination) {
        filteredHistory = filteredHistory.filter((item) =>
          item.destinationPort.toLowerCase().includes(filters.destination.toLowerCase()),
        )
      }

      if (filters.vessel) {
        filteredHistory = filteredHistory.filter((item) =>
          item.vessel.toLowerCase().includes(filters.vessel.toLowerCase()),
        )
      }
    }

    return of(filteredHistory).pipe(
      delay(800), // Simular latencia de red
    )
  }

  downloadReport(reportId: number | string, format: "pdf" | "excel"): Observable<HttpResponse<Blob>> {
    const targetId = String(reportId)
    const endpoint =
      format === "pdf"
        ? `${this.downloadsApiUrl}/${targetId}/pdf`
        : `${this.downloadsApiUrl}/${targetId}/excel`

    const headers = new HttpHeaders({
      Accept:
        format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    return this.http.get(endpoint, {
      headers,
      responseType: "blob",
      observe: "response",
    })
  }

  // Método para añadir un nuevo reporte
  addReport(report: ShipmentReport): void {
    if (!environment.mockBackend) {
      return
    }

    this.mockShipmentReports.unshift(report)

    const routeHistoryItem: RouteHistoryItem = {
      id: report.id,
      routeName: report.routeName,
      originPort: report.routeName.split(" a ")[0],
      destinationPort: report.routeName.split(" a ")[1],
      departureDate: new Date(report.departureDate).toISOString().split("T")[0],
      arrivalDate: new Date(report.arrivalDate).toISOString().split("T")[0],
      vessel: report.vessel,
      status: "Planificada",
      distance: report.distance,
      emissions: report.emissions.co2,
    }

    this.mockRouteHistory.unshift(routeHistoryItem)
  }

  private mapSummaryToReport(summary: RouteReportSummaryResource, index: number): ShipmentReport {
    const distance = summary.distanceNm !== undefined ? `${summary.distanceNm.toFixed(1)} nm` : "N/D"
    const totalTime =
      summary.totalDurationHours !== undefined ? `${summary.totalDurationHours.toFixed(1)} h` : "N/D"
    const vessel = summary.vesselName || "N/D"
    const shipmentId = summary.shipmentId || `HIST-${summary.historyId}`

    return {
      id: Number(summary.historyId) || index,
      historyId: summary.historyId,
      shipmentId,
      routeName: summary.routeLabel,
      departureDate: summary.departureDate || "",
      arrivalDate: summary.arrivalDate || "",
      totalTime,
      distance,
      vessel,
      events: summary.events ?? this.buildPlaceholderEvents(summary),
      emissions: {
        co2: summary.co2Tons !== undefined ? `${summary.co2Tons} tons` : "N/D",
        nox: summary.noxTons !== undefined ? `${summary.noxTons} tons` : "N/D",
        sox: summary.soxTons !== undefined ? `${summary.soxTons} tons` : "N/D",
      },
    }
  }

  private buildPlaceholderEvents(summary: RouteReportSummaryResource): ShipmentEvent[] {
    const events: ShipmentEvent[] = []
    if (summary.departureDate) {
      events.push({
        timestamp: summary.departureDate,
        type: "Departure",
        description: "Salida registrada en el historial.",
        location: summary.routeLabel.split("->")[0]?.trim(),
      })
    }
    if (summary.arrivalDate) {
      events.push({
        timestamp: summary.arrivalDate,
        type: "Arrival",
        description: "Arribo confirmado por Route History.",
        location: summary.routeLabel.split("->")[1]?.trim(),
      })
    }
    return events.length ? events : [
      {
        timestamp: new Date().toISOString(),
        type: "Info",
        description: "Reporte disponible para descarga.",
      },
    ]
  }
}
