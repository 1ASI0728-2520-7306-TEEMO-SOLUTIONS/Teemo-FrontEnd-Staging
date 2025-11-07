import { Component, Input, Output, EventEmitter, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { IncotermService, IncotermFormData, IncotermCalculationResult } from "../../../services/incoterm.service"

@Component({
  selector: "app-incoterm-calculator",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="incoterm-calculator">
      <div class="card-header">
        <h2>Calculadora Avanzada de Incoterms</h2>
        <div class="card-actions">
          <button class="btn-outline" (click)="onCancel()">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Cerrar
          </button>
        </div>
      </div>

      <div class="incoterm-content">
        <!-- Información de la ruta -->
        <div class="route-info">
          <div class="info-item">
            <strong>Puerto de Origen:</strong> {{ originPort }}
          </div>
          <div class="info-item">
            <strong>Puerto de Destino:</strong> {{ destinationPort }}
          </div>
          <div class="info-item">
            <strong>Distancia:</strong> {{ distance | number:'1.0-0' }} millas náuticas
          </div>
        </div>

        <!-- Formulario de Incoterms -->
        <div *ngIf="!calculationResult" class="incoterm-form">
          <h3>Información de la Mercancía</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="cargoType">Tipo de Mercancía *</label>
              <select id="cargoType" [(ngModel)]="formData.cargoType" class="form-control">
                <option value="">Seleccione un tipo</option>
                <option value="general">Carga General</option>
                <option value="container">Contenedores</option>
                <option value="bulk">Carga a Granel</option>
                <option value="liquid">Líquidos</option>
                <option value="refrigerated">Refrigerada</option>
                <option value="dangerous">Mercancía Peligrosa</option>
              </select>
              <small class="form-hint">El tipo de carga afecta significativamente los costos de manejo y seguro</small>
            </div>
            <div class="form-group">
              <label for="cargoValue">Valor de la Mercancía (USD) *</label>
              <input
                type="number"
                id="cargoValue"
                [(ngModel)]="formData.cargoValue"
                class="form-control"
                placeholder="Ej: 50000"
                min="1"
              />
              <small class="form-hint">Valor FOB de la mercancía para cálculo de seguros y derechos</small>
            </div>
            <div class="form-group">
              <label for="cargoWeight">Peso (kg) *</label>
              <input
                type="number"
                id="cargoWeight"
                [(ngModel)]="formData.cargoWeight"
                class="form-control"
                placeholder="Ej: 5000"
                min="1"
              />
              <small class="form-hint">Peso bruto total incluyendo embalaje</small>
            </div>
            <div class="form-group">
              <label for="cargoVolume">Volumen (m³) *</label>
              <input
                type="number"
                id="cargoVolume"
                [(ngModel)]="formData.cargoVolume"
                class="form-control"
                placeholder="Ej: 20"
                min="0.1"
                step="0.1"
              />
              <small class="form-hint">Volumen total para cálculo de flete y manipulación</small>
            </div>
          </div>

          <h3>Información Comercial</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="seller">Vendedor *</label>
              <input
                type="text"
                id="seller"
                [(ngModel)]="formData.seller"
                class="form-control"
                placeholder="Nombre del vendedor"
              />
            </div>
            <div class="form-group">
              <label for="buyer">Comprador *</label>
              <input
                type="text"
                id="buyer"
                [(ngModel)]="formData.buyer"
                class="form-control"
                placeholder="Nombre del comprador"
              />
            </div>
            <div class="form-group">
              <label for="sellerCountry">País del Vendedor *</label>
              <select id="sellerCountry" [(ngModel)]="formData.sellerCountry" class="form-control">
                <option value="">Seleccione un país</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="China">China</option>
                <option value="Alemania">Alemania</option>
                <option value="Japón">Japón</option>
                <option value="Brasil">Brasil</option>
              </select>
              <small class="form-hint">Afecta costos de exportación y documentación</small>
            </div>
            <div class="form-group">
              <label for="buyerCountry">País del Comprador *</label>
              <select id="buyerCountry" [(ngModel)]="formData.buyerCountry" class="form-control">
                <option value="">Seleccione un país</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="China">China</option>
                <option value="Alemania">Alemania</option>
                <option value="Japón">Japón</option>
                <option value="Brasil">Brasil</option>
              </select>
              <small class="form-hint">Determina derechos de importación y complejidad aduanera</small>
            </div>
          </div>

          <h3>Configuración Comercial</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="paymentTerms">Términos de Pago *</label>
              <select id="paymentTerms" [(ngModel)]="formData.paymentTerms" class="form-control">
                <option value="">Seleccione una opción</option>
                <option value="prepago">Prepago (100% adelantado)</option>
                <option value="carta_credito">Carta de Crédito</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="credito">Crédito (30-90 días)</option>
              </select>
              <small class="form-hint">Influye en la recomendación del Incoterm</small>
            </div>
            <div class="form-group">
              <label for="experienceLevel">Nivel de Experiencia *</label>
              <select id="experienceLevel" [(ngModel)]="formData.experienceLevel" class="form-control">
                <option value="">Seleccione una opción</option>
                <option value="principiante">Principiante (< 2 años)</option>
                <option value="intermedio">Intermedio (2-5 años)</option>
                <option value="experto">Experto (> 5 años)</option>
              </select>
              <small class="form-hint">Determina el nivel de responsabilidad recomendado</small>
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" [(ngModel)]="formData.insurance" />
                Requiere seguro adicional de carga
              </label>
              <small class="form-hint">Seguro por encima del mínimo requerido</small>
            </div>
            <div class="form-group">
              <label for="specialRequirements">Requisitos Especiales</label>
              <textarea
                id="specialRequirements"
                [(ngModel)]="formData.specialRequirements"
                class="form-control"
                placeholder="Ej: Certificados fitosanitarios, control de temperatura, manejo especial..."
                rows="3"
              ></textarea>
              <small class="form-hint">Requisitos que puedan afectar costos y responsabilidades</small>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-outline" (click)="onCancel()">Cancelar</button>
            <button class="btn-primary" [disabled]="!isFormValid() || isCalculating" (click)="calculateIncoterms()">
              <svg
                *ngIf="isCalculating"
                class="spinner"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              {{ isCalculating ? 'Calculando costos detallados...' : 'Calcular Incoterms' }}
            </button>
          </div>
        </div>

        <!-- Resultados del cálculo -->
        <div *ngIf="calculationResult" class="calculation-results">
          <!-- Condiciones del mercado -->
          <div class="result-section market-conditions">
            <h3>Condiciones Actuales del Mercado</h3>
            <div class="market-grid">
              <div class="market-item">
                <span class="market-label">Precios de Combustible:</span>
                <span class="market-value">{{ calculationResult.marketConditions.fuelPrices }}</span>
              </div>
              <div class="market-item">
                <span class="market-label">Tipos de Cambio:</span>
                <span class="market-value">{{ calculationResult.marketConditions.exchangeRates }}</span>
              </div>
              <div class="market-item">
                <span class="market-label">Congestión Portuaria:</span>
                <span class="market-value">{{ calculationResult.marketConditions.portCongestion }}</span>
              </div>
              <div class="market-item">
                <span class="market-label">Demanda Estacional:</span>
                <span class="market-value">{{ calculationResult.marketConditions.seasonalDemand }}</span>
              </div>
            </div>
          </div>

          <!-- Incoterm recomendado -->
          <div class="result-section">
            <h3>Incoterm Recomendado</h3>
            <div class="incoterm-card recommended">
              <div class="incoterm-header">
                <div class="incoterm-code">{{ calculationResult.recommendedIncoterm.code }}</div>
                <div class="incoterm-name">{{ calculationResult.recommendedIncoterm.name }}</div>
                <div class="recommendation-score">
                  <div class="score-bar">
                    <div
                      class="score-fill"
                      [style.width.%]="calculationResult.recommendedIncoterm.recommendationScore"
                    ></div>
                  </div>
                  <span>{{ calculationResult.recommendedIncoterm.recommendationScore }}% compatible</span>
                </div>
              </div>
              <p class="incoterm-description">
                {{ calculationResult.recommendedIncoterm.description }}
              </p>

              <!-- Punto de transferencia de riesgo -->
              <div class="risk-transfer">
                <strong>Punto de Transferencia de Riesgo:</strong> {{ calculationResult.recommendedIncoterm.riskTransferPoint }}
              </div>

              <!-- Adecuado para -->
              <div class="suitable-for">
                <h4>Adecuado para:</h4>
                <ul>
                  <li *ngFor="let item of calculationResult.recommendedIncoterm.suitableFor">{{ item }}</li>
                </ul>
              </div>

              <!-- Consideraciones -->
              <div class="considerations" *ngIf="calculationResult.recommendedIncoterm.considerations.length > 0">
                <h4>Consideraciones:</h4>
                <ul>
                  <li *ngFor="let consideration of calculationResult.recommendedIncoterm.considerations">{{ consideration }}</li>
                </ul>
              </div>

              <!-- Responsabilidades -->
              <div class="responsibilities-grid">
                <div class="seller-responsibilities">
                  <h4>Responsabilidades del Vendedor</h4>
                  <ul>
                    <li *ngFor="let resp of calculationResult.recommendedIncoterm.sellerResponsibilities">
                      {{ resp }}
                    </li>
                  </ul>
                </div>
                <div class="buyer-responsibilities">
                  <h4>Responsabilidades del Comprador</h4>
                  <ul>
                    <li *ngFor="let resp of calculationResult.recommendedIncoterm.buyerResponsibilities">
                      {{ resp }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Desglose detallado de costos -->
              <div class="detailed-cost-breakdown">
                <h4>Desglose Detallado de Costos (USD)</h4>

                <!-- Costos de transporte -->
                <div class="cost-category">
                  <h5>Transporte Marítimo</h5>
                  <div class="cost-grid">
                    <div class="cost-item">
                      <span>Flete Oceánico:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.oceanFreight | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Recargo de Combustible:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.fuelSurcharge | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Factor de Ajuste Bunker:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.bunkerAdjustmentFactor | number }}</span>
                    </div>
                  </div>
                </div>

                <!-- Costos portuarios -->
                <div class="cost-category">
                  <h5>Manipulación Portuaria</h5>
                  <div class="cost-grid">
                    <div class="cost-item">
                      <span>Manipulación Puerto Origen:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.originPortHandling | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Manipulación Puerto Destino:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.destinationPortHandling | number }}</span>
                    </div>
                    <div class="cost-item" *ngIf="calculationResult.recommendedIncoterm.costBreakdown.containerHandling > 0">
                      <span>Manipulación de Contenedores:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.containerHandling | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Estiba:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.stevedoring | number }}</span>
                    </div>
                  </div>
                </div>

                <!-- Seguros -->
                <div class="cost-category">
                  <h5>Seguros</h5>
                  <div class="cost-grid">
                    <div class="cost-item">
                      <span>Seguro Marítimo:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.marineInsurance | number }}</span>
                    </div>
                    <div class="cost-item" *ngIf="calculationResult.recommendedIncoterm.costBreakdown.cargoInsurance > 0">
                      <span>Seguro Adicional de Carga:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.cargoInsurance | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Seguro de Riesgo de Guerra:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.warRiskInsurance | number }}</span>
                    </div>
                  </div>
                </div>

                <!-- Aduanas y derechos -->
                <div class="cost-category">
                  <h5>Aduanas y Derechos</h5>
                  <div class="cost-grid">
                    <div class="cost-item">
                      <span>Despacho Aduanero Exportación:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.exportCustomsClearance | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Despacho Aduanero Importación:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.importCustomsClearance | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Derechos de Importación:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.importDuties | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Impuestos:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.taxes | number }}</span>
                    </div>
                  </div>
                </div>

                <!-- Documentación -->
                <div class="cost-category">
                  <h5>Documentación</h5>
                  <div class="cost-grid">
                    <div class="cost-item">
                      <span>Conocimiento de Embarque:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.billOfLading | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Certificado de Origen:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.certificateOfOrigin | number }}</span>
                    </div>
                    <div class="cost-item" *ngIf="calculationResult.recommendedIncoterm.costBreakdown.inspectionCertificate > 0">
                      <span>Certificado de Inspección:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.inspectionCertificate | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Documentación Aduanera:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.customsDocumentation | number }}</span>
                    </div>
                  </div>
                </div>

                <!-- Servicios adicionales -->
                <div class="cost-category">
                  <h5>Servicios Adicionales</h5>
                  <div class="cost-grid">
                    <div class="cost-item">
                      <span>Almacenaje:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.warehousing | number }}</span>
                    </div>
                    <div class="cost-item" *ngIf="calculationResult.recommendedIncoterm.costBreakdown.demurrage > 0">
                      <span>Demoras (Demurrage):</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.demurrage | number }}</span>
                    </div>
                    <div class="cost-item" *ngIf="calculationResult.recommendedIncoterm.costBreakdown.detention > 0">
                      <span>Detención de Contenedores:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.detention | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Ajuste de Divisa:</span>
                      <span>{{ calculationResult.recommendedIncoterm.costBreakdown.currencyAdjustment | number }}</span>
                    </div>
                  </div>
                </div>

                <!-- Resumen de costos por responsabilidad -->
                <div class="cost-summary">
                  <div class="summary-item seller">
                    <span>Total Costos del Vendedor:</span>
                    <span>{{ calculationResult.recommendedIncoterm.costBreakdown.sellerCosts | number }}</span>
                  </div>
                  <div class="summary-item buyer">
                    <span>Total Costos del Comprador:</span>
                    <span>{{ calculationResult.recommendedIncoterm.costBreakdown.buyerCosts | number }}</span>
                  </div>
                  <div class="summary-item total">
                    <span>Costo Total de la Transacción:</span>
                    <span>{{ calculationResult.recommendedIncoterm.costBreakdown.total | number }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Comparación de costos -->
          <div class="result-section">
            <h3>Comparación de Costos por Incoterm</h3>
            <div class="cost-comparison">
              <div class="comparison-summary">
                <div class="comparison-item">
                  <span>Opción más económica:</span>
                  <span class="highlight-green">{{ calculationResult.costComparison.lowestCost }}</span>
                </div>
                <div class="comparison-item">
                  <span>Opción más costosa:</span>
                  <span class="highlight-red">{{ calculationResult.costComparison.highestCost }}</span>
                </div>
                <div class="comparison-item">
                  <span>Diferencia de costo:</span>
                  <span class="highlight-blue">{{ calculationResult.costComparison.costDifference | number }} USD</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Alternativas -->
          <div class="result-section">
            <h3>Opciones Alternativas</h3>
            <div class="alternatives-grid">
              <div class="incoterm-card alternative" *ngFor="let alt of calculationResult.alternatives">
                <div class="incoterm-header">
                  <div class="incoterm-code">{{ alt.code }}</div>
                  <div class="incoterm-name">{{ alt.name }}</div>
                  <div class="recommendation-score">
                    <div class="score-bar">
                      <div class="score-fill" [style.width.%]="alt.recommendationScore"></div>
                    </div>
                    <span>{{ alt.recommendationScore }}% compatible</span>
                  </div>
                </div>
                <p class="incoterm-description">{{ alt.description }}</p>
                <div class="cost-breakdown">
                  <div class="cost-summary-alt">
                    <div class="cost-item">
                      <span>Vendedor:</span>
                      <span>{{ alt.costBreakdown.sellerCosts | number }}</span>
                    </div>
                    <div class="cost-item">
                      <span>Comprador:</span>
                      <span>{{ alt.costBreakdown.buyerCosts | number }}</span>
                    </div>
                    <div class="cost-item total">
                      <span>Total:</span>
                      <span>{{ alt.costBreakdown.total | number }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Detalles de la ruta -->
          <div class="result-section">
            <h3>Análisis de la Ruta</h3>
            <div class="route-analysis">
              <div class="route-details">
                <div class="detail-item">
                  <span>Distancia:</span>
                  <span>{{ calculationResult.routeDetails.distance | number:'1.0-0' }} millas náuticas</span>
                </div>
                <div class="detail-item">
                  <span>Tiempo Estimado:</span>
                  <span>{{ calculationResult.routeDetails.estimatedTime }}</span>
                </div>
                <div class="detail-item">
                  <span>Complejidad de Ruta:</span>
                  <span>{{ calculationResult.routeDetails.routeComplexity }}</span>
                </div>
                <div class="detail-item">
                  <span>Nivel de Riesgo:</span>
                  <span
                    [class.risk-low]="calculationResult.routeDetails.riskLevel === 'Bajo'"
                    [class.risk-medium]="calculationResult.routeDetails.riskLevel === 'Medio'"
                    [class.risk-high]="calculationResult.routeDetails.riskLevel === 'Alto'"
                  >
                    {{ calculationResult.routeDetails.riskLevel }}
                  </span>
                </div>
              </div>
              <div class="seasonal-factors" *ngIf="calculationResult.routeDetails.seasonalFactors.length > 0">
                <h4>Factores Estacionales:</h4>
                <ul>
                  <li *ngFor="let factor of calculationResult.routeDetails.seasonalFactors">{{ factor }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Advertencias -->
          <div class="result-section" *ngIf="calculationResult.warnings.length > 0">
            <h3>Advertencias y Consideraciones</h3>
            <div class="warnings">
              <div class="warning-item" *ngFor="let warning of calculationResult.warnings">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                {{ warning }}
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-outline" (click)="resetCalculation()">Nueva Consulta</button>
            <button class="btn-primary" (click)="createReport()">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="mr-2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Generar Informe Detallado
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .incoterm-calculator {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        margin-top: 1.5rem;
        animation: fadeIn 300ms ease;
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e2e8f0;

        h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #0f172a;
        }
      }

      .card-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .incoterm-content {
        padding: 1.5rem;
      }

      .route-info {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        padding: 1rem;
        background-color: #f8fafc;
        border-radius: 0.375rem;
        margin-bottom: 1.5rem;
        border: 1px solid #e2e8f0;
      }

      .info-item {
        flex: 1;
        min-width: 200px;
        font-size: 0.875rem;

        strong {
          color: #0f172a;
        }
      }

      .incoterm-form h3 {
        margin: 1.5rem 0 1rem;
        font-size: 1rem;
        font-weight: 600;
        color: #0f172a;
      }

      .incoterm-form h3:first-child {
        margin-top: 0;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #475569;
      }

      .form-hint {
        font-size: 0.75rem;
        color: #64748b;
        font-style: italic;
      }

      .form-control {
        padding: 0.5rem 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        outline: none;
        transition: border-color 150ms ease;

        &:focus {
          border-color: #0a6cbc;
          box-shadow: 0 0 0 1px rgba(10, 108, 188, 0.2);
        }
      }

      .checkbox-group {
        display: flex;
        align-items: center;
        margin-top: 1.5rem;

        label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e2e8f0;
      }

      .btn-outline {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background-color: transparent;
        color: #475569;
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms ease;

        &:hover {
          background-color: #f1f5f9;
          border-color: #94a3b8;
        }

        svg {
          flex-shrink: 0;
        }
      }

      .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background-color: #0a6cbc;
        color: white;
        border: none;
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 150ms ease;

        &:hover {
          background-color: #084e88;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        svg {
          flex-shrink: 0;
        }
      }

      .spinner {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .mr-2 {
        margin-right: 0.5rem;
      }

      /* Market Conditions */
      .market-conditions {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
        border: 1px solid #bae6fd;
      }

      .market-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
      }

      .market-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background-color: rgba(255, 255, 255, 0.7);
        border-radius: 0.375rem;
        border: 1px solid rgba(186, 230, 253, 0.5);
      }

      .market-label {
        font-weight: 500;
        color: #0f172a;
      }

      .market-value {
        font-size: 0.875rem;
        color: #0369a1;
        font-weight: 500;
      }

      /* Results */
      .calculation-results {
        animation: fadeIn 300ms ease;
      }

      .result-section {
        margin-bottom: 2rem;

        h3 {
          margin: 0 0 1rem;
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
        }
      }

      .incoterm-card {
        background-color: #f8fafc;
        border-radius: 0.5rem;
        padding: 1.5rem;
        border: 1px solid #e2e8f0;
        margin-bottom: 1rem;

        &.recommended {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-color: #bae6fd;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
        }

        &.alternative {
          background-color: #fafafa;
          border-color: #e4e4e7;
        }
      }

      .incoterm-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }

      .incoterm-code {
        font-size: 1.5rem;
        font-weight: 700;
        color: #0a6cbc;
        background-color: rgba(10, 108, 188, 0.1);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
      }

      .incoterm-name {
        font-size: 1rem;
        font-weight: 500;
        color: #0f172a;
        flex: 1;
      }

      .recommendation-score {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;

        span {
          font-size: 0.75rem;
          color: #475569;
        }
      }

      .score-bar {
        width: 100px;
        height: 6px;
        background-color: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
      }

      .score-fill {
        height: 100%;
        background: linear-gradient(90deg, #0a6cbc 0%, #3b82f6 100%);
        border-radius: 3px;
        transition: width 300ms ease;
      }

      .incoterm-description {
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
        color: #475569;
        line-height: 1.5;
      }

      .risk-transfer {
        margin-bottom: 1rem;
        padding: 0.75rem;
        background-color: rgba(34, 197, 94, 0.1);
        border-radius: 0.375rem;
        border-left: 4px solid #22c55e;
        font-size: 0.875rem;
      }

      .suitable-for, .considerations {
        margin-bottom: 1.5rem;

        h4 {
          margin: 0 0 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
        }

        ul {
          margin: 0;
          padding-left: 1.5rem;
          font-size: 0.875rem;
          color: #475569;

          li {
            margin-bottom: 0.25rem;
          }
        }
      }

      .responsibilities-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-bottom: 1.5rem;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }

        h4 {
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
        }

        ul {
          margin: 0;
          padding-left: 1.5rem;
          font-size: 0.875rem;
          color: #475569;

          li {
            margin-bottom: 0.25rem;
          }
        }
      }

      .seller-responsibilities {
        background-color: rgba(239, 68, 68, 0.05);
        padding: 1rem;
        border-radius: 0.375rem;
        border-left: 4px solid #ef4444;
      }

      .buyer-responsibilities {
        background-color: rgba(59, 130, 246, 0.05);
        padding: 1rem;
        border-radius: 0.375rem;
        border-left: 4px solid #3b82f6;
      }

      /* Detailed Cost Breakdown */
      .detailed-cost-breakdown {
        margin-top: 1.5rem;

        h4 {
          margin: 0 0 1rem;
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }
      }

      .cost-category {
        margin-bottom: 1.5rem;
        background-color: rgba(248, 250, 252, 0.8);
        border-radius: 0.5rem;
        padding: 1rem;
        border: 1px solid #e2e8f0;

        h5 {
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0a6cbc;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      }

      .cost-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 0.5rem;
      }

      .cost-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
        padding: 0.5rem;
        border-radius: 0.25rem;
        background-color: rgba(255, 255, 255, 0.7);

        &:nth-child(odd) {
          background-color: rgba(226, 232, 240, 0.3);
        }

        span:last-child {
          font-weight: 500;
          color: #0f172a;
        }
      }

      .cost-summary {
        margin-top: 1.5rem;
        padding: 1rem;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 0.5rem;
        border: 2px solid #cbd5e1;
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        border-radius: 0.375rem;
        font-weight: 500;

        &.seller {
          background-color: rgba(239, 68, 68, 0.1);
          border-left: 4px solid #ef4444;
        }

        &.buyer {
          background-color: rgba(59, 130, 246, 0.1);
          border-left: 4px solid #3b82f6;
        }

        &.total {
          background-color: rgba(34, 197, 94, 0.1);
          border-left: 4px solid #22c55e;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0;
        }

        &:last-child {
          margin-bottom: 0;
        }

        span:last-child {
          font-size: 1.1em;
          color: #0f172a;
        }
      }

      /* Cost Comparison */
      .cost-comparison {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-radius: 0.5rem;
        padding: 1.5rem;
        border: 1px solid #f59e0b;
      }

      .comparison-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .comparison-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 0.375rem;
        font-weight: 500;
      }

      .highlight-green {
        color: #16a34a;
        font-weight: 600;
      }

      .highlight-red {
        color: #dc2626;
        font-weight: 600;
      }

      .highlight-blue {
        color: #0369a1;
        font-weight: 600;
      }

      /* Alternatives */
      .alternatives-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1rem;

        .incoterm-card {
          margin-bottom: 0;
        }
      }

      .cost-summary-alt {
        background-color: rgba(248, 250, 252, 0.8);
        border-radius: 0.375rem;
        padding: 0.75rem;

        .cost-item {
          display: flex;
          justify-content: space-between;
          padding: 0.25rem 0;
          font-size: 0.875rem;

          &.total {
            border-top: 1px solid #cbd5e1;
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            font-weight: 600;
            color: #0f172a;
          }
        }
      }

      /* Route Analysis */
      .route-analysis {
        background-color: #f8fafc;
        border-radius: 0.5rem;
        padding: 1.5rem;
        border: 1px solid #e2e8f0;
      }

      .route-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 0.375rem;
        font-size: 0.875rem;

        span:first-child {
          font-weight: 500;
          color: #475569;
        }

        span:last-child {
          font-weight: 600;
          color: #0f172a;
        }

        .risk-low {
          color: #16a34a;
          font-weight: 600;
        }

        .risk-medium {
          color: #ca8a04;
          font-weight: 600;
        }

        .risk-high {
          color: #dc2626;
          font-weight: 600;
        }
      }

      .seasonal-factors {
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 0.375rem;
        padding: 1rem;

        h4 {
          margin: 0 0 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
        }

        ul {
          margin: 0;
          padding-left: 1.5rem;
          font-size: 0.875rem;
          color: #475569;

          li {
            margin-bottom: 0.25rem;
          }
        }
      }

      /* Warnings */
      .warnings {
        background-color: #fff9db;
        border: 1px solid #fef3c7;
        border-radius: 0.5rem;
        padding: 1rem;
      }

      .warning-item {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: #854d0e;
        background-color: rgba(255, 255, 255, 0.6);
        border-radius: 0.375rem;

        &:last-child {
          margin-bottom: 0;
        }

        svg {
          color: #ca8a04;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 768px) {
        .incoterm-content {
          padding: 1rem;
        }

        .form-grid {
          grid-template-columns: 1fr;
        }

        .incoterm-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .recommendation-score {
          align-items: flex-start;
        }

        .cost-grid {
          grid-template-columns: 1fr;
        }

        .route-details {
          grid-template-columns: 1fr;
        }

        .comparison-summary {
          grid-template-columns: 1fr;
        }

        .alternatives-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class IncotermCalculatorComponent implements OnInit {
  @Input() originPort = ""
  @Input() destinationPort = ""
  @Input() distance = 0
  @Output() cancel = new EventEmitter<void>()
  @Output() calculationComplete = new EventEmitter<IncotermCalculationResult>()
  @Output() reportCreated = new EventEmitter<void>()

  formData: IncotermFormData = {
    cargoType: "",
    cargoValue: 0,
    cargoWeight: 0,
    cargoVolume: 0,
    seller: "",
    buyer: "",
    sellerCountry: "",
    buyerCountry: "",
    paymentTerms: "",
    experienceLevel: "",
    insurance: false,
    specialRequirements: "",
  }

  isCalculating = false
  calculationResult: IncotermCalculationResult | null = null
  showSuccessMessage = false

  constructor(private incotermService: IncotermService) {}

  ngOnInit(): void {
    // Initialize with default values if needed
  }

  isFormValid(): boolean {
    return (
      !!this.formData.cargoType &&
      this.formData.cargoValue > 0 &&
      this.formData.cargoWeight > 0 &&
      this.formData.cargoVolume > 0 &&
      !!this.formData.seller &&
      !!this.formData.buyer &&
      !!this.formData.sellerCountry &&
      !!this.formData.buyerCountry &&
      !!this.formData.paymentTerms &&
      !!this.formData.experienceLevel
    )
  }

  calculateIncoterms(): void {
    throw new Error("Method not implemented.");

    if (!this.isFormValid()) return

    this.isCalculating = true

    this.incotermService
      .calculateIncoterms(this.formData, this.originPort, this.destinationPort, this.distance)
      .subscribe({
        next: (result) => {
          this.calculationResult = result
          this.calculationComplete.emit(result)
          this.isCalculating = false
        },
        error: (error) => {
          console.error("Error calculating Incoterms:", error)
          this.isCalculating = false
          alert("Error al calcular los Incoterms. Por favor, intente nuevamente.")
        },
      })
  }

  resetCalculation(): void {
    this.calculationResult = null
  }

  createReport(): void {
    if (!this.calculationResult) return

    // Simulate report creation with detailed information
    setTimeout(() => {
      this.showSuccessMessage = true
      this.reportCreated.emit()

      // Show success message with more details
      const reportDetails = `
Informe de Incoterms generado exitosamente:
- Incoterm recomendado: ${this.calculationResult!.recommendedIncoterm.code}
- Costo total: $${this.calculationResult!.recommendedIncoterm.costBreakdown.total.toLocaleString()}
- Ruta: ${this.originPort} → ${this.destinationPort}
- Distancia: ${this.distance.toLocaleString()} millas náuticas

El informe detallado está disponible en la sección de Informes.
      `

      alert(reportDetails)

      // Close component after brief delay
      setTimeout(() => {
        this.onCancel()
      }, 2000)
    }, 1000)
  }

  onCancel(): void {
    this.cancel.emit()
  }
}
