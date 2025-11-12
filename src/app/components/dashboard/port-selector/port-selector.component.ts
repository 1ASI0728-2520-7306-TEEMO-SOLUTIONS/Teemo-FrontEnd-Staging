import { Component, EventEmitter, type OnInit, Output, Input } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { PortService, Port } from "../../../services/port.service"
import { RouteService, RouteCalculationResource } from "../../../services/route.service"
import { RouteAnimationComponent } from "../route-animation/route-animation.component"
import { IncotermCalculatorComponent } from "../incoterm-calculator/incoterm-calculator.component"
import {AiDelayOverlayComponent} from '../../ai-delay-overlay/ai-delay-overlay.component';

@Component({
  selector: "app-port-selector",
  standalone: true,
  imports: [CommonModule, FormsModule, RouteAnimationComponent, IncotermCalculatorComponent, AiDelayOverlayComponent],
  template: `
    <div class="port-selector-container">
      <div class="card-header">
        <h2>{{ preselectedOrigin && preselectedDestination ? 'Ruta: ' + preselectedOrigin + ' → ' + preselectedDestination : 'Selección de Puertos para Nueva Ruta' }}</h2>
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
          Cancelar
        </button>
      </div>

      <!-- Mostrar selector de puertos solo si no hay preselección o si hay error -->
      <div class="port-selector-content" *ngIf="!preselectedOrigin || !preselectedDestination || !portsLoaded">
        <!-- Selector de Puerto de Origen -->
        <div class="port-selection-section">
          <h3>Puerto de Origen</h3>
          <div class="search-container">
            <div class="search-input-wrapper">
              <input
                type="text"
                [(ngModel)]="originSearchTerm"
                (input)="searchOriginPorts()"
                placeholder="Buscar puerto de origen..."
                class="search-input"
              />
              <svg
                *ngIf="originSearchTerm"
                (click)="clearOriginSearch()"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="search-clear-icon"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
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
                class="search-icon"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          <div class="port-list-container">
            <div class="port-list-header">
              <span>Nombre del Puerto</span>
              <span>Continente</span>
            </div>
            <div class="port-list" *ngIf="!loadingOriginPorts">
              <div
                *ngFor="let port of filteredOriginPorts"
                class="port-item"
                [class.selected]="selectedOriginPort && selectedOriginPort.id === port.id"
                (click)="selectOriginPort(port)"
              >
                <div class="port-name">
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
                    class="port-icon"
                  >
                    <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"></path>
                    <path d="M12 12v9"></path>
                    <path d="M8 17h8"></path>
                    <path d="M15 13h0"></path>
                  </svg>
                  {{ port.name }}
                </div>
                <div class="port-continent">{{ port.continent }}</div>
              </div>
            </div>
            <div class="loading-container" *ngIf="loadingOriginPorts">
              <div class="loading-spinner"></div>
              <p>Cargando puertos...</p>
            </div>
            <div class="empty-state" *ngIf="filteredOriginPorts.length === 0 && !loadingOriginPorts">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="empty-icon"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>No se encontraron puertos que coincidan con la búsqueda.</p>
            </div>
          </div>
        </div>

        <!-- Selector de Puerto de Destino -->
        <div class="port-selection-section">
          <h3>Puerto de Destino</h3>
          <div class="search-container">
            <div class="search-input-wrapper">
              <input
                type="text"
                [(ngModel)]="destinationSearchTerm"
                (input)="searchDestinationPorts()"
                placeholder="Buscar puerto de destino..."
                class="search-input"
              />
              <svg
                *ngIf="destinationSearchTerm"
                (click)="clearDestinationSearch()"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="search-clear-icon"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
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
                class="search-icon"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          <div class="port-list-container">
            <div class="port-list-header">
              <span>Nombre del Puerto</span>
              <span>Continente</span>
            </div>
            <div class="port-list" *ngIf="!loadingDestinationPorts">
              <div
                *ngFor="let port of filteredDestinationPorts"
                class="port-item"
                [class.selected]="selectedDestinationPort && selectedDestinationPort.id === port.id"
                (click)="selectDestinationPort(port)"
              >
                <div class="port-name">
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
                    class="port-icon"
                  >
                    <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"></path>
                    <path d="M12 12v9"></path>
                    <path d="M8 17h8"></path>
                    <path d="M15 13h0"></path>
                  </svg>
                  {{ port.name }}
                </div>
                <div class="port-continent">{{ port.continent }}</div>
              </div>
            </div>
            <div class="loading-container" *ngIf="loadingDestinationPorts">
              <div class="loading-spinner"></div>
              <p>Cargando puertos...</p>
            </div>
            <div class="empty-state" *ngIf="filteredDestinationPorts.length === 0 && !loadingDestinationPorts">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="empty-icon"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>No se encontraron puertos que coincidan con la búsqueda.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje de carga para rutas preseleccionadas -->
      <div class="preselected-loading" *ngIf="preselectedOrigin && preselectedDestination && !portsLoaded">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando ruta {{ preselectedOrigin }} → {{ preselectedDestination }}...</p>
        </div>
      </div>
      <!-- Sección de Visualización de Ruta -->
      <div class="route-visualization-section" *ngIf="showRouteVisualization" style="position: relative">
        <h3>Visualización de Ruta</h3>
        <div class="route-summary" *ngIf="routeData">
          <div class="summary-item">
            <strong>Origen:</strong> {{ selectedOriginPort?.name }}
          </div>
          <div class="summary-item">
            <strong>Destino:</strong> {{ selectedDestinationPort?.name }}
          </div>
          <div class="summary-item" *ngIf="selectedIntermediatePorts.length > 0">
            <strong>Puertos Intermedios:</strong>
            {{ getIntermediatePortNames() }}
          </div>
          <div class="summary-item">
            <strong>Distancia Total:</strong> {{ routeData.totalDistance | number: '1.0-0' }} millas náuticas
          </div>
        </div>
        <app-route-animation
          [originPortName]="selectedOriginPort?.name || ''"
          [destinationPortName]="selectedDestinationPort?.name || ''"
          [intermediatePorts]="selectedIntermediatePorts"
          [routeData]="routeData"
        ></app-route-animation>
        <app-ai-delay-overlay
          [origin]="selectedOriginPort?.name || null"
          [destination]="selectedDestinationPort?.name || null"
          [distanceNm]="routeData?.totalDistance || null"
          [originLat]="selectedOriginPort?.coordinates?.latitude || null"
          [originLon]="selectedOriginPort?.coordinates?.longitude || null"
          [destLat]="selectedDestinationPort?.coordinates?.latitude || null"
          [destLon]="selectedDestinationPort?.coordinates?.longitude || null"
          [cruiseSpeedKnots]="18">
        </app-ai-delay-overlay>
      </div>

      <!-- Botones de Acción -->
      <div class="action-buttons" *ngIf="portsLoaded">
        <button
          class="btn-primary"
          [disabled]="!selectedOriginPort || !selectedDestinationPort"
          (click)="createRoute()"
        >
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
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Crear Ruta
        </button>
        <button
          class="btn-success"
          [disabled]="!routeData || !routeCreated"
          (click)="createReport()"
        >
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
          Crear Reporte
        </button>
        <button
          class="btn-secondary"
          (click)="showIncotermForm = true"
          [disabled]="!routeData"
        >
          Calcular Incoterm
        </button>
      </div>

      <!-- Modal de confirmación -->
      <div class="modal-overlay" *ngIf="showConfirmationModal">
        <div class="modal-container">
          <div class="modal-header" [ngClass]="{'success': modalType === 'success', 'error': modalType === 'error'}">
            <svg *ngIf="modalType === 'success'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <svg *ngIf="modalType === 'error'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <h3>{{ modalTitle }}</h3>
          </div>
          <div class="modal-body">
            <p>{{ modalMessage }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-primary" (click)="closeModal()">Aceptar</button>
          </div>
        </div>
      </div>

      <app-incoterm-calculator
        *ngIf="showIncotermForm"
        [originPort]="selectedOriginPort?.name ?? ''"
        [destinationPort]="selectedDestinationPort?.name ?? ''"
        [distance]="routeData?.totalDistance ?? 0"
        (cancel)="showIncotermForm = false"
      ></app-incoterm-calculator>
    </div>
  `,

  styles: [
    `
      .port-selector-container {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        margin: 0 auto 1.5rem;
        width: min(1400px, calc(100% - 3rem));
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

      .preselected-loading {
        padding: 3rem 1.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .port-selector-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        padding: 1.5rem;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }

      .port-selection-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
        }
      }

      .search-container {
        position: relative;
      }

      .search-input-wrapper {
        position: relative;
      }

      .search-input {
        width: 100%;
        padding: 0.5rem 2.5rem 0.5rem 0.75rem;
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

      .search-icon {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #64748b;
        pointer-events: none;
      }

      .search-clear-icon {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #64748b;
        cursor: pointer;
        z-index: 1;

        &:hover {
          color: #475569;
        }
      }

      .port-list-container {
        display: flex;
        flex-direction: column;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        overflow: hidden;
        height: 300px;
      }

      .port-list-header {
        display: grid;
        grid-template-columns: 2fr 1fr;
        padding: 0.5rem 1rem;
        background-color: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
        font-weight: 600;
        font-size: 0.75rem;
        color: #475569;
        text-transform: uppercase;
      }

      .port-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem 0;
      }

      @media (max-width: 768px) {
        .port-selector-container {
          width: 100%;
          margin: 0 0 1.5rem;
        }
      }

      .port-item {
        display: grid;
        grid-template-columns: 2fr 1fr;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: background-color 150ms ease;

        &:hover:not(.disabled) {
          background-color: #f8fafc;
        }

        &.selected {
          background-color: rgba(10, 108, 188, 0.1);
        }

        &.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .port-name {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
      }

      .port-icon {
        color: #0a6cbc;
      }

      .port-continent {
        color: #64748b;
        font-size: 0.875rem;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 1rem;
        color: #64748b;
      }

      .loading-spinner {
        width: 2rem;
        height: 2rem;
        border: 2px solid rgba(10, 108, 188, 0.2);
        border-top-color: #0a6cbc;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 1rem;
        color: #64748b;
        padding: 1rem;
        text-align: center;
      }

      .empty-icon {
        color: #94a3b8;
      }

      .intermediate-ports-section {
        padding: 1.5rem;
        border-top: 1px solid #e2e8f0;

        h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
        }

        .section-description {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          color: #64748b;
        }
      }

      .intermediate-ports-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
      }

      .selected-ports {
        background-color: #f8fafc;
        border-radius: 0.375rem;
        padding: 1rem;
        margin-bottom: 1rem;
        border: 1px solid #e2e8f0;

        h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
        }
      }

      .selected-ports-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .selected-port-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background-color: #0a6cbc;
        color: white;
        border-radius: 9999px;
        padding: 0.25rem 0.5rem 0.25rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .port-order {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        height: 1.25rem;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        font-size: 0.625rem;
        font-weight: 600;
      }

      .remove-port-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        padding: 0;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        transition: background-color 150ms ease;

        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
        }
      }

      .route-visualization-section {
        padding: 1.5rem;
        border-top: 1px solid #e2e8f0;

        h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
        }
      }

      .route-summary {
        background-color: #f8fafc;
        border-radius: 0.375rem;
        padding: 1rem;
        margin-bottom: 1rem;
        border: 1px solid #e2e8f0;
      }

      .summary-item {
        margin-bottom: 0.5rem;
        font-size: 0.875rem;

        &:last-child {
          margin-bottom: 0;
        }

        strong {
          color: #0f172a;
        }
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1.5rem;
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

      .btn-secondary {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background-color: #f1f5f9;
        color: #0f172a;
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms ease;

        &:hover {
          background-color: #e2e8f0;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

      .mr-2 {
        margin-right: 0.25rem;
      }

      /* Estilos para el modal de confirmación */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-container {
        background-color: white;
        border-radius: 0.5rem;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        overflow: hidden;
      }

      .modal-header {
        display: flex;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e2e8f0;
        gap: 0.75rem;
      }

      .modal-header.success {
        background-color: #d1fae5;
        color: #065f46;
      }

      .modal-header.error {
        background-color: #fee2e2;
        color: #b91c1c;
      }

      .modal-header svg {
        flex-shrink: 0;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .modal-body {
        padding: 1.5rem;
        color: #1e293b;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        padding: 1rem 1.5rem;
        border-top: 1px solid #e2e8f0;
      }

      .btn-success {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background-color: #10b981;
        color: white;
        border: none;
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 150ms ease;

        &:hover {
          background-color: #059669;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        svg {
          flex-shrink: 0;
        }
      }
    `,
  ],
})
export class PortSelectorComponent implements OnInit {
  @Input() preselectedOrigin: string | null = null
  @Input() preselectedDestination: string | null = null
  @Input() autoVisualize = false

  showIncotermForm = false
  @Output() cancel = new EventEmitter<void>()

  // Puertos
  allPorts: Port[] = []
  filteredOriginPorts: Port[] = []
  filteredDestinationPorts: Port[] = []
  selectedOriginPort: Port | null = null
  selectedDestinationPort: Port | null = null

  // Términos de búsqueda
  originSearchTerm = ""
  destinationSearchTerm = ""

  // Estados de carga
  loadingOriginPorts = true
  loadingDestinationPorts = true
  portsLoaded = false

  // Visualización de ruta
  showRouteVisualization = false
  routeData: RouteCalculationResource | null = null

  // Puertos intermedios
  selectedIntermediatePorts: Port[] = []
  intermediateSearchTerm = ""
  filteredIntermediatePorts: Port[] = []
  loadingIntermediatePorts = true

  // Modal y reportes
  routeCreated = false
  showConfirmationModal = false
  modalTitle = ""
  modalMessage = ""
  modalType: "success" | "error" = "success"

  constructor(
    private portService: PortService,
    private routeService: RouteService,
  ) {}

  ngOnInit(): void {
    this.loadPorts()
  }

  loadPorts(): void {
    this.loadingOriginPorts = true
    this.loadingDestinationPorts = true
    this.loadingIntermediatePorts = true

    this.portService.getAllPorts().subscribe({
      next: (ports) => {
        this.allPorts = ports
        this.filteredOriginPorts = [...ports]
        this.filteredDestinationPorts = [...ports]
        this.filteredIntermediatePorts = [...ports]
        this.loadingOriginPorts = false
        this.loadingDestinationPorts = false
        this.loadingIntermediatePorts = false
        this.portsLoaded = true

        // Manejar preselecciones
        this.handlePreselectedPorts()
      },
      error: (error) => {
        console.error("Error al cargar puertos:", error)
        this.loadingOriginPorts = false
        this.loadingDestinationPorts = false
        this.loadingIntermediatePorts = false
        this.portsLoaded = true
      },
    })
  }

  private handlePreselectedPorts(): void {
    if (this.preselectedOrigin && this.preselectedDestination) {
      console.log("Manejando puertos preseleccionados:", this.preselectedOrigin, this.preselectedDestination)

      // Buscar y seleccionar puerto de origen
      const originPort = this.allPorts.find((port) =>
        port.name.toLowerCase().includes(this.preselectedOrigin!.toLowerCase()),
      )

      // Buscar y seleccionar puerto de destino
      const destinationPort = this.allPorts.find((port) =>
        port.name.toLowerCase().includes(this.preselectedDestination!.toLowerCase()),
      )

      if (originPort && destinationPort) {
        this.selectedOriginPort = originPort
        this.selectedDestinationPort = destinationPort

        console.log("Puertos encontrados y seleccionados:", originPort.name, destinationPort.name)

        // Si autoVisualize está activado, visualizar automáticamente
        if (this.autoVisualize) {
          setTimeout(() => {
            this.visualizeRoute()
          }, 500) // Pequeño delay para que se vea la transición
        }
      } else {
        console.warn("No se pudieron encontrar los puertos preseleccionados")
        if (!originPort) console.warn("Puerto de origen no encontrado:", this.preselectedOrigin)
        if (!destinationPort) console.warn("Puerto de destino no encontrado:", this.preselectedDestination)
      }
    }
  }

  searchOriginPorts(): void {
    if (!this.originSearchTerm.trim()) {
      this.filteredOriginPorts = [...this.allPorts]
      return
    }

    const searchTerm = this.originSearchTerm.toLowerCase()
    this.filteredOriginPorts = this.allPorts.filter(
      (port) => port.name.toLowerCase().includes(searchTerm) || port.continent.toLowerCase().includes(searchTerm),
    )
  }

  searchDestinationPorts(): void {
    if (!this.destinationSearchTerm.trim()) {
      this.filteredDestinationPorts = [...this.allPorts]
      return
    }

    const searchTerm = this.destinationSearchTerm.toLowerCase()
    this.filteredDestinationPorts = this.allPorts.filter(
      (port) => port.name.toLowerCase().includes(searchTerm) || port.continent.toLowerCase().includes(searchTerm),
    )
  }

  clearOriginSearch(): void {
    this.originSearchTerm = ""
    this.filteredOriginPorts = [...this.allPorts]
  }

  clearDestinationSearch(): void {
    this.destinationSearchTerm = ""
    this.filteredDestinationPorts = [...this.allPorts]
  }

  selectOriginPort(port: Port): void {
    this.selectedOriginPort = port
    if (this.showRouteVisualization) {
      this.showRouteVisualization = false
      this.routeData = null
    }
  }

  selectDestinationPort(port: Port): void {
    this.selectedDestinationPort = port
    if (this.showRouteVisualization) {
      this.showRouteVisualization = false
      this.routeData = null
    }
  }

  visualizeRoute(force: boolean = false): void {
    // Compatibilidad: force ahora se interpreta como createAfter
    const createAfter = !!force
    if (!this.selectedOriginPort || !this.selectedDestinationPort) {
      return
    }

    const intermediatePortIds = this.selectedIntermediatePorts.map((port) => port.id)
    const intermediatePortNames = this.selectedIntermediatePorts.map((port) => port.name)

    console.log("Calculando ruta desde:", this.selectedOriginPort.name, "hasta:", this.selectedDestinationPort.name)
    console.log("Puertos intermedios:", intermediatePortNames)

    this.routeService
      .calculateOptimalRoute(this.selectedOriginPort.id, this.selectedDestinationPort.id, intermediatePortIds)
      .subscribe({
        next: (routeData: RouteCalculationResource) => {
          console.log("Datos de ruta recibidos:", routeData)
          this.routeData = routeData
          this.showRouteVisualization = true
          if (createAfter) this.finalizeCreateRoute()
        },
        error: (err: Error) => {
          console.error("Error al calcular la ruta:", err)
          this.routeData = this.createSimulatedRouteData(
            this.selectedOriginPort?.coordinates,
            this.selectedDestinationPort?.coordinates,
          )
          this.showRouteVisualization = true
          if (createAfter) this.finalizeCreateRoute()
        },
      })
  }

  private finalizeCreateRoute(): void {
    // Simula el comportamiento previo: marcar como creada y mostrar modal
    setTimeout(() => {
      console.log("Ruta creada con éxito")
      this.routeCreated = true
      this.showModal(
        "success",
        "Ruta Creada",
        "La ruta ha sido creada con éxito. Ahora puede generar un reporte detallado.",
      )
    }, 500)
  }

  selectIntermediatePort(port: Port): void {
    const index = this.selectedIntermediatePorts.findIndex((p) => p.id === port.id)

    if (index !== -1) {
      this.selectedIntermediatePorts.splice(index, 1)
    } else if (
      (!this.selectedOriginPort || port.id !== this.selectedOriginPort.id) &&
      (!this.selectedDestinationPort || port.id !== this.selectedDestinationPort.id)
    ) {
      this.selectedIntermediatePorts.push(port)
    }

    if (this.showRouteVisualization) {
      this.showRouteVisualization = false
      this.routeData = null
    }
  }

  isIntermediatePortSelected(port: Port): boolean {
    return this.selectedIntermediatePorts.some((p) => p.id === port.id)
  }

  isPortDisabled(port: Port): boolean {
    return (
      (this.selectedOriginPort !== null && port.id === this.selectedOriginPort.id) ||
      (this.selectedDestinationPort !== null && port.id === this.selectedDestinationPort.id)
    )
  }

  searchIntermediatePorts(): void {
    if (!this.intermediateSearchTerm.trim()) {
      this.filteredIntermediatePorts = [...this.allPorts]
      return
    }

    const searchTerm = this.intermediateSearchTerm.toLowerCase()
    this.filteredIntermediatePorts = this.allPorts.filter(
      (port) => port.name.toLowerCase().includes(searchTerm) || port.continent.toLowerCase().includes(searchTerm),
    )
  }

  clearIntermediateSearch(): void {
    this.intermediateSearchTerm = ""
    this.filteredIntermediatePorts = [...this.allPorts]
  }

  createSimulatedRouteData(originCoords: any, destCoords: any): RouteCalculationResource {
    if (!originCoords || !destCoords || !this.selectedOriginPort || !this.selectedDestinationPort) {
      return {
        optimalRoute: [],
        totalDistance: 0,
        warnings: ["No se pudieron generar datos de ruta simulados"],
        metadata: {
          simulatedRoute: true,
        },
      }
    }

    const optimalRoute = [this.selectedOriginPort.name]

    if (this.selectedIntermediatePorts.length > 0) {
      this.selectedIntermediatePorts.forEach((port) => {
        optimalRoute.push(port.name)
      })
    }

    optimalRoute.push(this.selectedDestinationPort.name)

    const coordinatesMapping: { [key: string]: { latitude: number; longitude: number } } = {}

    coordinatesMapping[this.selectedOriginPort.name] = {
      latitude: originCoords.latitude,
      longitude: originCoords.longitude,
    }

    this.selectedIntermediatePorts.forEach((port) => {
      if (port.coordinates) {
        coordinatesMapping[port.name] = {
          latitude: port.coordinates.latitude,
          longitude: port.coordinates.longitude,
        }
      }
    })

    coordinatesMapping[this.selectedDestinationPort.name] = {
      latitude: destCoords.latitude,
      longitude: destCoords.longitude,
    }

    const totalDistance = this.calculateApproximateDistance(originCoords, destCoords)

    return {
      optimalRoute: optimalRoute,
      totalDistance: totalDistance,
      warnings: ["Ruta simulada debido a error en el servidor"],
      metadata: {
        simulatedRoute: true,
      },
      coordinatesMapping: coordinatesMapping,
    }
  }

  private calculateApproximateDistance(coord1: any, coord2: any): number {
    const R = 3440.065
    const dLat = this.toRadians(coord2.latitude - coord1.latitude)
    const dLon = this.toRadians(coord2.longitude - coord1.longitude)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
      Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  createRoute(): void {
    if (!this.selectedOriginPort || !this.selectedDestinationPort) {
      return
    }

    if (!this.routeData) {
      this.visualizeRoute(true)
      return
    }

    setTimeout(() => {
      console.log("Ruta creada con éxito")
      this.routeCreated = true
      this.showModal(
        "success",
        "Ruta Creada",
        "La ruta ha sido creada con éxito. Ahora puede generar un reporte detallado.",
      )
    }, 500)
  }

  createReport(): void {
    if (!this.routeData || !this.routeCreated || !this.selectedOriginPort || !this.selectedDestinationPort) {
      return
    }

    const reportData = {
      name: `Reporte: ${this.selectedOriginPort.name} a ${this.selectedDestinationPort.name}`,
      originPortId: this.selectedOriginPort.id,
      destinationPortId: this.selectedDestinationPort.id,
      departureDate: new Date().toISOString(),
      routeData: this.routeData,
      intermediatePorts: this.selectedIntermediatePorts.map((port) => port.id),
    }

    this.routeService.createRouteReport(reportData).subscribe({
      next: (response) => {
        console.log("Reporte creado con éxito:", response)
        this.showModal(
          "success",
          "Reporte Generado",
          "El reporte ha sido generado con éxito. Puede consultarlo en la sección de Informes de Envíos.",
        )
      },
      error: (error) => {
        console.error("Error al crear el reporte:", error)
        this.showModal("error", "Error", "No se pudo generar el reporte: " + (error.message || "Error desconocido"))
      },
    })
  }

  showModal(type: "success" | "error", title: string, message: string): void {
    this.modalType = type
    this.modalTitle = title
    this.modalMessage = message
    this.showConfirmationModal = true
  }

  closeModal(): void {
    this.showConfirmationModal = false
  }

  getIntermediatePortNames(): string {
    return this.selectedIntermediatePorts.map((port) => port.name).join(", ")
  }

  onCancel(): void {
    this.cancel.emit()
  }
}
