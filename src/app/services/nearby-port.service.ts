import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable, of } from "rxjs"
import { catchError, map } from "rxjs/operators"
import { environment } from "../../environments/environment"

export interface NearbyPort {
  id: string
  name: string
  country: string
  latitude: number
  longitude: number
  status: "open" | "closed"
  facilities: string[]
  maxDepth: number
  contactInfo: {
    phone: string
    email: string
    vhfChannel: string
  }
}

@Injectable({
  providedIn: "root",
})
export class NearbyPortService {
  private platformApiUrl = `${environment.apiUrl}/api/v1`
  private publicPortsApiUrl = "https://freetestapi.com/api/v1/ports"

  constructor(private http: HttpClient) {}

  /**
   * Try to fetch nearby ports from our platform API first.
   * If it fails (RBAC restrictions, feature not ready, etc.) fall back to the public dataset.
   */
  getNearbyPorts(vesselId: string): Observable<NearbyPort[]> {
    return this.http.get<NearbyPort[]>(`${this.platformApiUrl}/vessels/${vesselId}/nearby-ports`).pipe(
      catchError((error) => {
        console.error("Error al obtener puertos cercanos en la plataforma:", error)
        return this.fetchPublicPorts()
      }),
    )
  }

  /**
   * Consume the public dataset at freetestapi.com and normalise the payload.
   */
  fetchPublicPorts(): Observable<NearbyPort[]> {
    return this.http.get<any[]>(this.publicPortsApiUrl).pipe(
      map((ports) => this.mapPublicPorts(ports)),
      catchError((error) => {
        console.error("No se pudo consultar la API pública de puertos:", error)
        return of(this.getFallbackNearbyPorts())
      }),
    )
  }

  private mapPublicPorts(ports: any[]): NearbyPort[] {
    if (!Array.isArray(ports)) return this.getFallbackNearbyPorts()

    return ports.map((port, index) => ({
      id: String(port.id ?? port.code ?? index + 1),
      name: port.name ?? `Puerto ${index + 1}`,
      country: port.country ?? port.city ?? "N/D",
      latitude: Number(port.latitude ?? port.lat ?? port.coordinates?.latitude ?? 0),
      longitude: Number(port.longitude ?? port.lon ?? port.coordinates?.longitude ?? 0),
      status: String(port.status ?? "open").toLowerCase().includes("clos") ? "closed" : "open",
      facilities: Array.isArray(port.facilities)
        ? port.facilities
        : (port.services?.split(",").map((service: string) => service.trim()).filter(Boolean) ?? ["Supplies"]),
      maxDepth: Number(port.max_depth ?? port.depth ?? 12),
      contactInfo: {
        phone: port.contact?.phone ?? port.phone ?? "N/D",
        email: port.contact?.email ?? port.email ?? "N/D",
        vhfChannel: port.contact?.vhf ?? port.vhf ?? "16",
      },
    }))
  }

  private getFallbackNearbyPorts(): NearbyPort[] {
    return [
      {
        id: "1",
        name: "Puerto de Singapore",
        country: "Asia",
        latitude: 1.29027,
        longitude: 103.851959,
        status: "open",
        facilities: ["Fuel", "Repairs", "Medical", "Supplies"],
        maxDepth: 15,
        contactInfo: {
          phone: "+65 1234 5678",
          email: "port@singapore.com",
          vhfChannel: "16",
        },
      },
      {
        id: "2",
        name: "Puerto de Johor",
        country: "Asia",
        latitude: 1.4655,
        longitude: 103.7578,
        status: "open",
        facilities: ["Fuel", "Supplies"],
        maxDepth: 12,
        contactInfo: {
          phone: "+60 7123 4567",
          email: "port@johor.com",
          vhfChannel: "14",
        },
      },
      {
        id: "3",
        name: "Puerto de Batam",
        country: "Asia",
        latitude: 1.1301,
        longitude: 104.0529,
        status: "closed",
        facilities: ["Repairs", "Supplies"],
        maxDepth: 10,
        contactInfo: {
          phone: "+62 778 123456",
          email: "port@batam.com",
          vhfChannel: "12",
        },
      },
      {
        id: "4",
        name: "Puerto de Bintan",
        country: "Asia",
        latitude: 1.0619,
        longitude: 104.4165,
        status: "open",
        facilities: ["Fuel", "Customs"],
        maxDepth: 14,
        contactInfo: {
          phone: "+62 770 123456",
          email: "port@bintan.com",
          vhfChannel: "10",
        },
      },
      {
        id: "5",
        name: "Puerto de Kuala Lumpur",
        country: "Asia",
        latitude: 3.0738,
        longitude: 101.6881,
        status: "open",
        facilities: ["Fuel", "Repairs", "Medical", "Supplies", "Customs"],
        maxDepth: 18,
        contactInfo: {
          phone: "+60 3123 4567",
          email: "port@kl.com",
          vhfChannel: "16",
        },
      },
    ]
  }
}
