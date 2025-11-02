import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export type DelayPredictionResponse = {
  isDelay: boolean;
  delayHours: number;
  riskScore?: number;
  inputs?: {
    distanceKm?: number;
    cruiseKnots?: number;
    avgWindKnots?: number;
    maxWaveM?: number;
  };
  model?: { name?: string; version?: string };
};

@Injectable({ providedIn: 'root' })
export class PredictionService {
  // URL completa usando TUS variables del environment
  private readonly url = `${environment.apiUrl}${environment.ai.predictDelayPath}`;

  constructor(private http: HttpClient) {}

  predictDelay(payload: {
    origin: string;
    destination: string;
    cruiseKnots?: number;
    plannedHours?: number;
  }): Observable<DelayPredictionResponse> {
    return this.http.post<DelayPredictionResponse>(this.url, payload);
  }
}
