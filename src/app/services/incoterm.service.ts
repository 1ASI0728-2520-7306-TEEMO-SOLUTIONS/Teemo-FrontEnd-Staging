import { Injectable } from "@angular/core"
import { type Observable, of } from "rxjs"
import { delay } from "rxjs/operators"
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

export interface IncotermFormData {
  cargoType: string
  cargoValue: number
  cargoWeight: number
  cargoVolume: number
  seller: string
  buyer: string
  sellerCountry: string
  buyerCountry: string
  paymentTerms: string
  experienceLevel: string
  insurance: boolean
  specialRequirements: string
}

export interface DetailedCostBreakdown {
  // Transportation Costs
  oceanFreight: number
  fuelSurcharge: number
  bunkerAdjustmentFactor: number

  // Port and Handling
  originPortHandling: number
  destinationPortHandling: number
  containerHandling: number
  stevedoring: number

  // Insurance
  marineInsurance: number
  cargoInsurance: number
  warRiskInsurance: number

  // Customs and Duties
  exportCustomsClearance: number
  importCustomsClearance: number
  importDuties: number
  taxes: number

  // Documentation
  billOfLading: number
  certificateOfOrigin: number
  inspectionCertificate: number
  customsDocumentation: number

  // Additional Services
  warehousing: number
  demurrage: number
  detention: number
  currencyAdjustment: number

  // Totals by responsibility
  sellerCosts: number
  buyerCosts: number
  total: number
}

export interface IncotermOption {
  code: string
  name: string
  description: string
  sellerResponsibilities: string[]
  buyerResponsibilities: string[]
  recommendationScore: number
  costBreakdown: DetailedCostBreakdown
  riskTransferPoint: string
  suitableFor: string[]
  considerations: string[]
}

export interface IncotermCalculationResult {
  recommendedIncoterm: IncotermOption
  alternatives: IncotermOption[]
  routeDetails: {
    distance: number
    estimatedTime: string
    riskLevel: string
    seasonalFactors: string[]
    routeComplexity: string
  }
  marketConditions: {
    fuelPrices: string
    exchangeRates: string
    portCongestion: string
    seasonalDemand: string
  }
  warnings: string[]
  costComparison: {
    lowestCost: string
    highestCost: string
    costDifference: number
  }
}

interface CargoTypeData {
  name: string
  freightMultiplier: number
  insuranceRate: number
  handlingComplexity: number
  dutyRate: number
  specialRequirements: string[]
}

interface CountryData {
  name: string
  dutyRates: { [key: string]: number }
  customsClearanceCost: number
  documentationComplexity: number
  riskFactor: number
  currency: string
}

interface RouteData {
  riskLevel: number
  congestionFactor: number
  seasonalVariation: number
  fuelSurchargeRate: number
}

@Injectable({
  providedIn: "root",
})
export class IncotermService {
  private readonly base = `${environment.apiUrl}/incoterms`;
  
  private cargoTypes: { [key: string]: CargoTypeData } = {
    general: {
      name: "Carga General",
      freightMultiplier: 1.0,
      insuranceRate: 0.15,
      handlingComplexity: 1.0,
      dutyRate: 0.08,
      specialRequirements: [],
    },
    container: {
      name: "Contenedores",
      freightMultiplier: 0.85,
      insuranceRate: 0.12,
      handlingComplexity: 0.8,
      dutyRate: 0.06,
      specialRequirements: ["Container inspection", "Seal verification"],
    },
    bulk: {
      name: "Carga a Granel",
      freightMultiplier: 0.7,
      insuranceRate: 0.18,
      handlingComplexity: 1.2,
      dutyRate: 0.05,
      specialRequirements: ["Bulk handling equipment", "Moisture control"],
    },
    liquid: {
      name: "Líquidos",
      freightMultiplier: 0.9,
      insuranceRate: 0.25,
      handlingComplexity: 1.5,
      dutyRate: 0.12,
      specialRequirements: ["Tank cleaning", "Pump systems", "Spill prevention"],
    },
    refrigerated: {
      name: "Refrigerada",
      freightMultiplier: 1.4,
      insuranceRate: 0.35,
      handlingComplexity: 1.8,
      dutyRate: 0.15,
      specialRequirements: ["Temperature control", "Cold storage", "Reefer monitoring"],
    },
    dangerous: {
      name: "Mercancía Peligrosa",
      freightMultiplier: 2.0,
      insuranceRate: 0.5,
      handlingComplexity: 2.5,
      dutyRate: 0.2,
      specialRequirements: ["IMDG compliance", "Special handling", "Emergency procedures"],
    },
  }

  private countries: { [key: string]: CountryData } = {
    "Estados Unidos": {
      name: "Estados Unidos",
      dutyRates: { general: 0.08, container: 0.06, bulk: 0.04, liquid: 0.12, refrigerated: 0.15, dangerous: 0.25 },
      customsClearanceCost: 350,
      documentationComplexity: 1.2,
      riskFactor: 0.8,
      currency: "USD",
    },
    China: {
      name: "China",
      dutyRates: { general: 0.12, container: 0.08, bulk: 0.06, liquid: 0.15, refrigerated: 0.18, dangerous: 0.3 },
      customsClearanceCost: 280,
      documentationComplexity: 1.5,
      riskFactor: 1.0,
      currency: "CNY",
    },
    Alemania: {
      name: "Alemania",
      dutyRates: { general: 0.06, container: 0.04, bulk: 0.03, liquid: 0.08, refrigerated: 0.1, dangerous: 0.2 },
      customsClearanceCost: 420,
      documentationComplexity: 1.0,
      riskFactor: 0.6,
      currency: "EUR",
    },
    Japón: {
      name: "Japón",
      dutyRates: { general: 0.1, container: 0.07, bulk: 0.05, liquid: 0.14, refrigerated: 0.16, dangerous: 0.28 },
      customsClearanceCost: 380,
      documentationComplexity: 1.3,
      riskFactor: 0.7,
      currency: "JPY",
    },
    Brasil: {
      name: "Brasil",
      dutyRates: { general: 0.18, container: 0.14, bulk: 0.1, liquid: 0.22, refrigerated: 0.25, dangerous: 0.35 },
      customsClearanceCost: 450,
      documentationComplexity: 1.8,
      riskFactor: 1.3,
      currency: "BRL",
    },
  }

  constructor(private http: HttpClient) {}

  calculateIncoterms(
    formData: IncotermFormData,
    originPort: string,
    destinationPort: string,
    distance: number,
  ): Observable<IncotermCalculationResult> {
    //  const result = this.generateRealisticIncotermRecommendation(formData, originPort, destinationPort, distance)
    //  return of(result).pipe(delay(2000)) // Simulate complex calculation time

    const payload = { ...formData, originPort, destinationPort, distance };
    return this.http.post<IncotermCalculationResult>(`${this.base}/calculate`, payload);
  }

  private generateRealisticIncotermRecommendation(
    formData: IncotermFormData,
    originPort: string,
    destinationPort: string,
    distance: number,
  ): IncotermCalculationResult {
    const cargoData = this.cargoTypes[formData.cargoType] || this.cargoTypes['general'];
    const originCountryData = this.countries[formData.sellerCountry] || this.countries["Estados Unidos"]
    const destCountryData = this.countries[formData.buyerCountry] || this.countries["Estados Unidos"]

    // Calculate base costs with realistic factors
    const baseCosts = this.calculateBaseCosts(formData, cargoData, originCountryData, destCountryData, distance)

    // Generate different incoterm options with realistic cost distributions
    const exwOption = this.generateEXWOption(baseCosts, cargoData, formData)
    const fobOption = this.generateFOBOption(baseCosts, cargoData, formData)
    const cfrOption = this.generateCFROption(baseCosts, cargoData, formData)
    const cifOption = this.generateCIFOption(baseCosts, cargoData, formData)
    const ddpOption = this.generateDDPOption(baseCosts, cargoData, formData, destCountryData)

    // Calculate recommendation scores based on realistic factors
    const scores = [
      { incoterm: exwOption, score: this.calculateRealisticScore(exwOption, formData, cargoData) },
      { incoterm: fobOption, score: this.calculateRealisticScore(fobOption, formData, cargoData) },
      { incoterm: cfrOption, score: this.calculateRealisticScore(cfrOption, formData, cargoData) },
      { incoterm: cifOption, score: this.calculateRealisticScore(cifOption, formData, cargoData) },
      { incoterm: ddpOption, score: this.calculateRealisticScore(ddpOption, formData, cargoData) },
    ]

    scores.sort((a, b) => b.score - a.score)
    const recommendedIncoterm = scores[0].incoterm
    const alternatives = [scores[1].incoterm, scores[2].incoterm, scores[3].incoterm]

    // Generate realistic warnings and market conditions
    const warnings = this.generateRealisticWarnings(formData, cargoData, distance, originCountryData, destCountryData)
    const marketConditions = this.generateMarketConditions(distance, cargoData)
    const routeDetails = this.generateRouteDetails(distance, originPort, destinationPort, cargoData)

    // Calculate cost comparison
    const costs = scores.map((s) => s.incoterm.costBreakdown.total)
    const lowestCost = Math.min(...costs)
    const highestCost = Math.max(...costs)
    const lowestIncoterm = scores.find((s) => s.incoterm.costBreakdown.total === lowestCost)?.incoterm.code || ""
    const highestIncoterm = scores.find((s) => s.incoterm.costBreakdown.total === highestCost)?.incoterm.code || ""

    return {
      recommendedIncoterm,
      alternatives,
      routeDetails,
      marketConditions,
      warnings,
      costComparison: {
        lowestCost: lowestIncoterm,
        highestCost: highestIncoterm,
        costDifference: highestCost - lowestCost,
      },
    }
  }

  private calculateBaseCosts(
    formData: IncotermFormData,
    cargoData: CargoTypeData,
    originCountry: CountryData,
    destCountry: CountryData,
    distance: number,
  ) {
    // Ocean freight calculation based on realistic factors
    const baseFreightRate = 0.08 // USD per kg per 1000 nautical miles
    const oceanFreight = Math.round(
      formData.cargoWeight * baseFreightRate * (distance / 1000) * cargoData.freightMultiplier,
    )

    // Fuel surcharge (typically 15-25% of ocean freight)
    const fuelSurcharge = Math.round(oceanFreight * 0.18)

    // Bunker Adjustment Factor
    const bunkerAdjustmentFactor = Math.round(oceanFreight * 0.05)

    // Port handling charges
    const originPortHandling = Math.round(
      (formData.cargoWeight * 0.5 + formData.cargoVolume * 15) * cargoData.handlingComplexity,
    )
    const destinationPortHandling = Math.round(originPortHandling * 1.1) // Destination usually higher

    // Container handling (if applicable)
    const containerHandling = formData.cargoType === "container" ? Math.round(formData.cargoVolume * 25) : 0

    // Stevedoring
    const stevedoring = Math.round(formData.cargoWeight * 0.3 * cargoData.handlingComplexity)

    // Insurance calculations
    const marineInsurance = Math.round(formData.cargoValue * cargoData.insuranceRate * 0.01)
    const cargoInsurance = formData.insurance ? Math.round(formData.cargoValue * 0.003) : 0
    const warRiskInsurance = Math.round(
      formData.cargoValue * 0.001 * (originCountry.riskFactor + destCountry.riskFactor),
    )

    // Customs and duties
    const exportCustomsClearance = Math.round(
      originCountry.customsClearanceCost * originCountry.documentationComplexity,
    )
    const importCustomsClearance = Math.round(destCountry.customsClearanceCost * destCountry.documentationComplexity)
    const importDuties = Math.round(formData.cargoValue * (destCountry.dutyRates[formData.cargoType] || 0.08))
    const taxes = Math.round(importDuties * 0.15) // VAT/GST on duties

    // Documentation
    const billOfLading = 150
    const certificateOfOrigin = 80
    const inspectionCertificate = cargoData.specialRequirements.length > 0 ? 200 : 0
    const customsDocumentation = Math.round(
      120 * (originCountry.documentationComplexity + destCountry.documentationComplexity),
    )

    // Additional services
    const warehousing = Math.round(formData.cargoVolume * 8 * Math.ceil(distance / 2000)) // Storage days based on distance
    const demurrage = distance > 5000 ? Math.round(formData.cargoVolume * 12) : 0 // Long routes risk demurrage
    const detention = containerHandling > 0 ? Math.round(containerHandling * 0.1) : 0
    const currencyAdjustment = Math.round((oceanFreight + fuelSurcharge) * 0.02) // Currency fluctuation buffer

    return {
      oceanFreight,
      fuelSurcharge,
      bunkerAdjustmentFactor,
      originPortHandling,
      destinationPortHandling,
      containerHandling,
      stevedoring,
      marineInsurance,
      cargoInsurance,
      warRiskInsurance,
      exportCustomsClearance,
      importCustomsClearance,
      importDuties,
      taxes,
      billOfLading,
      certificateOfOrigin,
      inspectionCertificate,
      customsDocumentation,
      warehousing,
      demurrage,
      detention,
      currencyAdjustment,
    }
  }

  private generateEXWOption(baseCosts: any, cargoData: CargoTypeData, formData: IncotermFormData): IncotermOption {
    // EXW - Seller only responsible for making goods available
    const sellerCosts = 0
    const buyerCosts = (Object.values(baseCosts) as number[]).reduce((sum: number, cost: number) => sum + cost, 0);

    return {
      code: "EXW",
      name: "Ex Works",
      description: "El vendedor pone la mercancía a disposición del comprador en sus instalaciones.",
      sellerResponsibilities: [
        "Poner la mercancía a disposición en el lugar convenido",
        "Embalaje adecuado para el transporte",
        "Proporcionar factura comercial",
      ],
      buyerResponsibilities: [
        "Recoger la mercancía en las instalaciones del vendedor",
        "Todos los costos y riesgos de transporte",
        "Formalidades de exportación e importación",
        "Seguro de la mercancía",
        "Todos los gastos portuarios y de manipulación",
      ],
      recommendationScore: 0,
      costBreakdown: {
        ...baseCosts,
        sellerCosts,
        buyerCosts,
        total: sellerCosts + buyerCosts,
      },
      riskTransferPoint: "Instalaciones del vendedor",
      suitableFor: ["Compradores con experiencia en comercio internacional", "Transacciones domésticas"],
      considerations: ["Máxima responsabilidad para el comprador", "Menor costo para el vendedor"],
    }
  }

  private generateFOBOption(baseCosts: any, cargoData: CargoTypeData, formData: IncotermFormData): IncotermOption {
    // FOB - Seller responsible until goods are on board
    const sellerCosts =
      baseCosts.originPortHandling +
      baseCosts.exportCustomsClearance +
      baseCosts.billOfLading +
      baseCosts.certificateOfOrigin;
    const buyerCosts = (Object.values(baseCosts) as number[]).reduce((sum: number, cost: number) => sum + cost, 0) - sellerCosts;

    return {
      code: "FOB",
      name: "Free On Board",
      description:
        "El vendedor entrega la mercancía a bordo del buque designado por el comprador en el puerto de embarque.",
      sellerResponsibilities: [
        "Entrega de la mercancía a bordo del buque",
        "Formalidades de exportación",
        "Costos de manipulación en puerto de origen",
        "Documentación de exportación",
      ],
      buyerResponsibilities: [
        "Flete marítimo principal",
        "Seguro de la mercancía",
        "Descarga en puerto de destino",
        "Formalidades de importación",
        "Transporte interior en destino",
      ],
      recommendationScore: 0,
      costBreakdown: {
        ...baseCosts,
        sellerCosts,
        buyerCosts,
        total: sellerCosts + buyerCosts,
      },
      riskTransferPoint: "A bordo del buque en puerto de origen",
      suitableFor: ["Compradores con experiencia marítima", "Cuando el comprador controla el transporte"],
      considerations: ["Control del comprador sobre flete y seguro", "Riesgo transferido en puerto de origen"],
    }
  }

  private generateCFROption(baseCosts: any, cargoData: CargoTypeData, formData: IncotermFormData): IncotermOption {
    // CFR - Seller pays freight but not insurance
    const sellerCosts =
      baseCosts.originPortHandling +
      baseCosts.exportCustomsClearance +
      baseCosts.billOfLading +
      baseCosts.certificateOfOrigin +
      baseCosts.oceanFreight +
      baseCosts.fuelSurcharge +
      baseCosts.bunkerAdjustmentFactor;
    const buyerCosts = (Object.values(baseCosts) as number[]).reduce((sum: number, cost: number) => sum + cost, 0) - sellerCosts;

    return {
      code: "CFR",
      name: "Cost and Freight",
      description:
        "El vendedor paga el costo y flete hasta el puerto de destino, pero el riesgo se transfiere al embarque.",
      sellerResponsibilities: [
        "Entrega a bordo del buque",
        "Flete marítimo hasta destino",
        "Formalidades de exportación",
        "Costos de manipulación en origen",
        "Documentación de transporte",
      ],
      buyerResponsibilities: [
        "Seguro de la mercancía",
        "Descarga en puerto de destino",
        "Formalidades de importación",
        "Derechos e impuestos",
        "Transporte interior en destino",
      ],
      recommendationScore: 0,
      costBreakdown: {
        ...baseCosts,
        sellerCosts,
        buyerCosts,
        total: sellerCosts + buyerCosts,
      },
      riskTransferPoint: "A bordo del buque en puerto de origen",
      suitableFor: ["Transacciones de valor medio", "Cuando el vendedor tiene mejores tarifas de flete"],
      considerations: ["Vendedor controla el transporte", "Comprador asume riesgo durante tránsito"],
    }
  }

  private generateCIFOption(baseCosts: any, cargoData: CargoTypeData, formData: IncotermFormData): IncotermOption {
    // CIF - Seller pays freight and insurance
    const sellerCosts =
      baseCosts.originPortHandling +
      baseCosts.exportCustomsClearance +
      baseCosts.billOfLading +
      baseCosts.certificateOfOrigin +
      baseCosts.oceanFreight +
      baseCosts.fuelSurcharge +
      baseCosts.bunkerAdjustmentFactor +
      baseCosts.marineInsurance +
      baseCosts.cargoInsurance;
    const buyerCosts = (Object.values(baseCosts) as number[]).reduce((sum: number, cost: number) => sum + cost, 0) - sellerCosts;

    return {
      code: "CIF",
      name: "Cost, Insurance and Freight",
      description: "El vendedor paga costo, seguro y flete hasta el puerto de destino designado.",
      sellerResponsibilities: [
        "Entrega a bordo del buque",
        "Flete marítimo hasta destino",
        "Seguro mínimo de la mercancía",
        "Formalidades de exportación",
        "Documentación completa",
      ],
      buyerResponsibilities: [
        "Descarga en puerto de destino",
        "Formalidades de importación",
        "Derechos e impuestos de importación",
        "Transporte interior en destino",
        "Seguro adicional si se requiere",
      ],
      recommendationScore: 0,
      costBreakdown: {
        ...baseCosts,
        sellerCosts,
        buyerCosts,
        total: sellerCosts + buyerCosts,
      },
      riskTransferPoint: "A bordo del buque en puerto de origen",
      suitableFor: ["Compradores nuevos en comercio internacional", "Transacciones de alto valor"],
      considerations: ["Máxima cobertura del vendedor", "Seguro mínimo incluido"],
    }
  }

  private generateDDPOption(
    baseCosts: any,
    cargoData: CargoTypeData,
    formData: IncotermFormData,
    destCountry: CountryData,
  ): IncotermOption {
    // DDP - Seller responsible for everything including duties
    const sellerCosts = (Object.values(baseCosts) as number[]).reduce((sum: number, cost: number) => sum + cost, 0);
    const buyerCosts = (Object.values(baseCosts) as number[]).reduce((sum: number, cost: number) => sum + cost, 0) - sellerCosts;

    return {
      code: "DDP",
      name: "Delivered Duty Paid",
      description: "El vendedor entrega la mercancía al comprador, despachada para importación y lista para descarga.",
      sellerResponsibilities: [
        "Entrega en destino final",
        "Todos los costos de transporte",
        "Seguro completo de la mercancía",
        "Formalidades de exportación e importación",
        "Pago de derechos e impuestos",
        "Todos los gastos hasta entrega final",
      ],
      buyerResponsibilities: ["Recepción de la mercancía", "Descarga en destino final", "Inspección de la mercancía"],
      recommendationScore: 0,
      costBreakdown: {
        ...baseCosts,
        sellerCosts,
        buyerCosts,
        total: sellerCosts + buyerCosts,
      },
      riskTransferPoint: "Lugar de destino convenido",
      suitableFor: ["Compradores sin experiencia", "Mercancía de alto valor", "Relaciones comerciales establecidas"],
      considerations: ["Máxima responsabilidad del vendedor", "Requiere conocimiento local del vendedor"],
    }
  }

  private calculateRealisticScore(
    incoterm: IncotermOption,
    formData: IncotermFormData,
    cargoData: CargoTypeData,
  ): number {
    let score = 50 // Base score

    // Experience level factor
    switch (formData.experienceLevel) {
      case "principiante":
        if (incoterm.code === "CIF" || incoterm.code === "DDP") score += 25
        if (incoterm.code === "EXW" || incoterm.code === "FOB") score -= 15
        break
      case "intermedio":
        if (incoterm.code === "CFR" || incoterm.code === "CIF") score += 15
        if (incoterm.code === "FOB") score += 10
        break
      case "experto":
        if (incoterm.code === "EXW" || incoterm.code === "FOB") score += 20
        if (incoterm.code === "DDP") score -= 10
        break
    }

    // Cargo value considerations
    if (formData.cargoValue > 100000) {
      if (incoterm.code === "CIF" || incoterm.code === "DDP") score += 15
    } else if (formData.cargoValue < 20000) {
      if (incoterm.code === "EXW" || incoterm.code === "FOB") score += 10
    }

    // Cargo type considerations
    if (cargoData.specialRequirements.length > 0) {
      if (incoterm.code === "CIF" || incoterm.code === "DDP") score += 20
    }

    // Payment terms factor
    switch (formData.paymentTerms) {
      case "prepago":
        if (incoterm.code === "EXW" || incoterm.code === "FOB") score += 10
        break
      case "carta_credito":
        if (incoterm.code === "CIF" || incoterm.code === "CFR") score += 15
        break
      case "credito":
        if (incoterm.code === "DDP") score += 10
        break
    }

    // Insurance consideration
    if (formData.insurance) {
      if (incoterm.code === "CIF" || incoterm.code === "DDP") score += 10
    }

    return Math.min(100, Math.max(0, score))
  }

  private generateRealisticWarnings(
    formData: IncotermFormData,
    cargoData: CargoTypeData,
    distance: number,
    originCountry: CountryData,
    destCountry: CountryData,
  ): string[] {
    const warnings: string[] = []

    if (formData.cargoValue > 100000) {
      warnings.push("Carga de alto valor: Considere seguro adicional y documentación especial.")
    }

    if (cargoData.specialRequirements.length > 0) {
      warnings.push(`Carga especial: Requiere ${cargoData.specialRequirements.join(", ")}.`)
    }

    if (distance > 8000) {
      warnings.push("Ruta de larga distancia: Tiempos de tránsito extendidos y mayor riesgo de demoras.")
    }

    if (originCountry.riskFactor > 1.2 || destCountry.riskFactor > 1.2) {
      warnings.push("Ruta de alto riesgo: Considere seguro de guerra y cobertura adicional.")
    }

    if (formData.cargoType === "dangerous") {
      warnings.push("Mercancía peligrosa: Cumplimiento IMDG obligatorio y documentación especial requerida.")
    }

    if (formData.cargoType === "refrigerated") {
      warnings.push("Carga refrigerada: Monitoreo continuo de temperatura y equipos de respaldo necesarios.")
    }

    if (destCountry.documentationComplexity > 1.5) {
      warnings.push("País de destino con alta complejidad documental: Tiempo adicional para despacho aduanero.")
    }

    const totalDuties = formData.cargoValue * (destCountry.dutyRates[formData.cargoType] || 0.08)
    if (totalDuties > formData.cargoValue * 0.15) {
      warnings.push("Derechos de importación elevados: Considere clasificación arancelaria alternativa.")
    }

    return warnings
  }

  private generateMarketConditions(distance: number, cargoData: CargoTypeData) {
    return {
      fuelPrices: distance > 5000 ? "Altos - Impacto significativo en costos" : "Moderados - Impacto controlado",
      exchangeRates: "Volátiles - Considere cobertura de divisas",
      portCongestion: cargoData.handlingComplexity > 1.5 ? "Alta - Posibles demoras" : "Normal - Sin demoras esperadas",
      seasonalDemand: "Temporada alta - Tarifas incrementadas en 15-20%",
    }
  }

  private generateRouteDetails(
    distance: number,
    originPort: string,
    destinationPort: string,
    cargoData: CargoTypeData,
  ) {
    const days = Math.round(distance / 350) // ~350 nautical miles per day
    const complexity = distance > 8000 ? "Alta" : distance > 4000 ? "Media" : "Baja"

    let riskLevel = "Bajo"
    if (distance > 5000 || cargoData.insuranceRate > 0.3) riskLevel = "Medio"
    if (distance > 8000 || cargoData.insuranceRate > 0.4) riskLevel = "Alto"

    const seasonalFactors = []
    if (distance > 6000) seasonalFactors.push("Temporada de huracanes")
    if (cargoData.name.includes("Refrigerada")) seasonalFactors.push("Variaciones de temperatura")
    if (distance > 8000) seasonalFactors.push("Congestión portuaria estacional")

    return {
      distance,
      estimatedTime: `${days} días (${Math.round(days * 0.8)}-${Math.round(days * 1.2)} días)`,
      riskLevel,
      seasonalFactors: seasonalFactors.length > 0 ? seasonalFactors : ["Sin factores estacionales significativos"],
      routeComplexity: complexity,
    }
  }
}
