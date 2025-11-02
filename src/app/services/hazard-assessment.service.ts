import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export type Hazard = {
  type: 'HURRICANE'|'ICE'|'MAREAJE'|string;
  probability: number;         // 0..1
  severity: 'LOW'|'MEDIUM'|'HIGH'|string;
  windowStartIso?: string;
  windowEndIso?: string;
  regionName?: string;
  source?: string;
  rationale?: string;

  // opcional: si decides pasarlo en la respuesta pública
  latCenter?: number;
  lonCenter?: number;
  radiusKm?: number;
};

export type HazardSegment = {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  hazards: Hazard[];
  notViableDueToIce: boolean;
  advisory?: string;
};

export type HazardAssessmentResponse = {
  season: 'DJF'|'MAM'|'JJA'|'SON'|string;
  month: number;
  hemisphere: 'N'|'S'|string;
  routeDistanceKm: number;
  plannedHours: number;
  segments: HazardSegment[];
};

@Injectable({ providedIn: 'root' })
export class HazardAssessmentService {
  private url = `${environment.apiUrl}/api/ai/hazard-assessment`;

  constructor(private http: HttpClient) {}

  assess(body: {
    originLat: number;
    originLon: number;
    destLat: number;
    destLon: number;
    departureTimeIso?: string;
    cruiseSpeedKnots?: number;
    distanceKm?: number;
  }): Observable<HazardAssessmentResponse> {
    return this.http.post<HazardAssessmentResponse>(this.url, body);
  }
}
