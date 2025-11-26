import { HttpClient, HttpParams } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { Observable, of } from "rxjs"
import { catchError } from "rxjs/operators"
import { environment } from "../../environments/environment"

export type PortOperationalStatus = "OPEN" | "RESTRICTED" | "CLOSED"

export interface PortOverviewItem {
  portId: string
  name: string
  country: string
  lat: number
  lon: number
  status: PortOperationalStatus
  reason?: string | null
  traffic?: number
  updatedAt?: string
  contactPhone?: string | null
  contactEmail?: string | null
  website?: string | null
}

export interface PortOverviewResponse {
  content: PortOverviewItem[]
  totalElements: number
  lastSyncedAt?: string
}

@Injectable({
  providedIn: "root",
})
export class NearbyPortService {
  private readonly overviewUrl = `${environment.apiUrl}/ports/overview`

  constructor(private http: HttpClient) {}

  getPortOverview(options?: {
    state?: PortOperationalStatus
    page?: number
    size?: number
  }): Observable<PortOverviewResponse> {
    let params = new HttpParams()
    if (options?.state) {
      params = params.set("state", options.state)
    }
    if (typeof options?.page === "number") {
      params = params.set("page", options.page)
    }
    if (typeof options?.size === "number") {
      params = params.set("size", options.size)
    }

    return this.http.get<PortOverviewResponse>(this.overviewUrl, { params }).pipe(
      catchError((error) => {
        console.error("No se pudo obtener la información global de puertos:", error)
        return of(this.getFallbackOverview())
      }),
    )
  }

  private getFallbackOverview(): PortOverviewResponse {
    const now = new Date().toISOString()
    return {
      content: [
        {
          portId: "SGSIN",
          name: "Port of Singapore",
          country: "SG",
          lat: 1.29027,
          lon: 103.851959,
          status: "OPEN",
          traffic: 720,
          updatedAt: now,
          contactPhone: "+65 1234 5678",
          contactEmail: "info@singapore-port.sg",
          website: "https://www.mpa.gov.sg/",
        },
        {
          portId: "MYTPP",
          name: "Port of Tanjung Pelepas",
          country: "MY",
          lat: 1.365,
          lon: 103.535,
          status: "RESTRICTED",
          reason: "Mantenimiento en muelle oeste",
          traffic: 410,
          updatedAt: now,
          contactPhone: "+60 7-555-0100",
          contactEmail: "ops@ptp.com.my",
          website: "https://www.ptp.com.my/",
        },
        {
          portId: "IDBTH",
          name: "Port of Batam",
          country: "ID",
          lat: 1.1301,
          lon: 104.0529,
          status: "CLOSED",
          reason: "Condiciones meteorológicas adversas",
          traffic: 0,
          updatedAt: now,
          contactPhone: "+62 778 111222",
          contactEmail: "harbor@batamport.id",
          website: "https://batam.go.id/",
        },
      ],
      totalElements: 3,
      lastSyncedAt: now,
    }
  }
}
