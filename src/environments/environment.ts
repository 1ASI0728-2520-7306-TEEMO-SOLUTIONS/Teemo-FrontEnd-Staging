export const environment = {
  production: false,
  apiUrl: "http://localhost:8080/api",
  //apiUrl: "mongodb+srv://teemo:u202214522@teemo.ck7qain.mongodb.net/TeemoDB?retryWrites=true&w=majority",
  mockBackend: false,
  ai: { predictDelayPath: '/ai/predict-weather-delay',
    hazardAssessmentPath: "/ai/hazard-assessment",
    defaultCruiseKnots: 18,
    defaultAvgWindKnots: 12,
    defaultMaxWaveM: 2.0}
};
