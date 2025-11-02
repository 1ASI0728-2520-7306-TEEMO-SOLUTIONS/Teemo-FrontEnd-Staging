export interface DelayPredictionRequest {
  origin: string;         // código/ID del puerto origen (o nombre)
  destination: string;    // código/ID del puerto destino
  cruiseKnots?: number;   // opcional (si no, backend asume por defecto)
  plannedHours?: number;  // opcional
}

export interface DelayPredictionResponse {
  isDelay: boolean;       // true si se espera retraso
  delayHours: number;     // horas estimadas de retraso (p.ej. 4.2)
  riskScore?: number;     // 0..1 (si el back lo expone; si no, omitir)
  inputs?: {
    distanceKm?: number;
    cruiseKnots?: number;
    avgWindKnots?: number;
    maxWaveM?: number;
  };
  model?: {
    name?: string;
    version?: string;
  };
}
