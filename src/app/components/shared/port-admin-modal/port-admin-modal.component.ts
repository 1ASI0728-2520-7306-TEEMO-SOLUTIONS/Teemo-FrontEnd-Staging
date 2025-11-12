import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { PortService, type PortAdminRecord } from "../../../services/port.service"

interface ToastMessage {
  id: number
  message: string
  type: "success" | "error"
}

@Component({
  selector: "app-port-admin-modal",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="closeModal()" data-testid="port-admin-backdrop"></div>
    <div class="modal-panel" *ngIf="isOpen" data-testid="port-admin-modal">
      <header class="modal-header">
        <div>
          <p class="eyebrow">Operaciones de red</p>
          <h2>Administrar puertos</h2>
          <p class="subtitle">
            Habilita o deshabilita puertos operativos. Cada cambio queda auditado con responsable y fecha.
          </p>
        </div>
        <button class="icon-btn" (click)="closeModal()" aria-label="Cerrar modal">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      <div class="toast-stack" *ngIf="toasts.length > 0">
        <div
          class="toast"
          *ngFor="let toast of toasts"
          [class.toast-success]="toast.type === 'success'"
          [class.toast-error]="toast.type === 'error'"
          data-testid="port-admin-toast"
        >
          <span>{{ toast.message }}</span>
          <button class="icon-btn" (click)="dismissToast(toast.id)" aria-label="Dismiss toast">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <section class="controls">
        <label class="control-label search-control">
          Buscar puerto
          <div class="search-input">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
            </svg>
            <input
              type="search"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              placeholder="Nombre, continente o responsable"
              autocomplete="off"
              spellcheck="false"
              data-testid="port-search"
              aria-label="Buscar puerto"
            />
            <button
              type="button"
              class="clear-search"
              *ngIf="searchTerm"
              (click)="clearSearch()"
              aria-label="Limpiar búsqueda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </label>
        <label class="control-label">
          Estado
          <select [(ngModel)]="statusFilter" (change)="onFilterChange(true)" data-testid="status-filter">
            <option value="all">Todos</option>
            <option value="enabled">Solo habilitados</option>
            <option value="disabled">Solo deshabilitados</option>
          </select>
        </label>

        <label class="control-label checkbox">
          <input type="checkbox" [(ngModel)]="showOnlyAlerts" (change)="onFilterChange()" />
          Mostrar únicamente cambios recientes (&lt; 48h)
        </label>
      </section>

      <div class="table-wrapper" *ngIf="!loading && ports.length > 0">
        <table>
          <thead>
            <tr>
              <th>Puerto</th>
              <th>Estado</th>
              <th>Última acción</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let port of ports" data-testid="port-row">
              <td>
                <div class="port-name">
                  <p>{{ port.name }}</p>
                  <span>{{ port.continent }}</span>
                </div>
              </td>
              <td>
                <span class="status-chip" [class.disabled]="port.disabled">
                  {{ port.disabled ? "Deshabilitado" : "Habilitado" }}
                </span>
              </td>
              <td>
                <div class="activity">
                  <p *ngIf="port.lastActionBy">
                    {{ port.lastActionBy }} · {{ port.lastAction || (port.disabled ? "Deshabilitado" : "Habilitado") }}
                  </p>
                  <span *ngIf="port.lastActionAt">{{ port.lastActionAt | date : "short" }}</span>
                  <p *ngIf="!port.lastActionAt" class="muted">Sin registro</p>
                </div>
              </td>
              <td class="actions-cell">
                <button
                  *ngIf="!port.disabled"
                  class="action-btn danger"
                  (click)="requestDisable(port)"
                  data-testid="disable-button"
                >
                  Deshabilitar
                </button>
                <button
                  *ngIf="port.disabled"
                  class="action-btn primary"
                  (click)="enable(port)"
                  [disabled]="actionInProgress"
                  data-testid="enable-button"
                >
                  Habilitar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state" *ngIf="!loading && ports.length === 0">
        <p>No se encontraron puertos con el filtro seleccionado.</p>
      </div>

      <div class="loading-state" *ngIf="loading" data-testid="port-admin-loading">
        <div class="spinner"></div>
        <p>Cargando puertos...</p>
      </div>

      <div class="error-banner" *ngIf="actionError" data-testid="port-admin-error">
        {{ actionError }}
      </div>

      <div class="confirmation-panel" *ngIf="pendingAction?.type === 'disable'" data-testid="disable-confirmation">
        <h3>¿Deshabilitar {{ pendingAction?.port?.name }}?</h3>
        <p>Esta acción notificará a los equipos de operaciones. Puedes adjuntar un motivo (opcional).</p>
        <label>
          Motivo
          <textarea
            rows="3"
            [(ngModel)]="disableReason"
            placeholder="Mantenimiento, cierre temporal, condiciones climáticas..."
            data-testid="disable-reason"
          ></textarea>
        </label>
        <div class="confirmation-actions">
          <button class="action-btn ghost" (click)="cancelPendingAction()">Cancelar</button>
          <button
            class="action-btn danger confirm-disable-btn"
            (click)="confirmDisable()"
            [disabled]="actionInProgress"
            data-testid="confirm-disable"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --pa-surface: #ffffff;
        --pa-surface-muted: #f8fafc;
        --pa-surface-alt: #f1f5f9;
        --pa-border: #e2e8f0;
        --pa-border-strong: #cbd5f5;
        --pa-text: #0f172a;
        --pa-text-muted: #475569;
        --pa-text-soft: #94a3b8;
        --pa-primary: #0ea5e9;
        --pa-danger: #ef4444;
        --pa-success: #22c55e;
        display: block;
        color: var(--pa-text);
        font-family: inherit;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.35);
        backdrop-filter: blur(3px);
        z-index: 40;
      }

      .modal-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--pa-surface);
        border: 1px solid var(--pa-border);
        border-radius: 16px;
        width: min(960px, 95vw);
        max-height: 90vh;
        padding: 2rem;
        color: var(--pa-text);
        z-index: 41;
        box-shadow: 0 30px 60px rgba(15, 23, 42, 0.18);
        overflow: auto;
        animation: fadeUp 0.18s ease-out;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        margin-bottom: 2rem;
      }

      .icon-btn {
        border: 1px solid var(--pa-border);
        background: var(--pa-surface-muted);
        border-radius: 999px;
        color: var(--pa-text);
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      }

      .icon-btn:hover {
        background: var(--pa-surface-alt);
        border-color: var(--pa-text-soft);
      }

      .eyebrow {
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        color: var(--pa-text-soft);
        margin-bottom: 0.25rem;
      }

      .subtitle {
        color: var(--pa-text-muted);
        margin-top: 0.5rem;
        max-width: 32rem;
      }

      .controls {
        display: flex;
        gap: 1.25rem;
        flex-wrap: wrap;
        margin-bottom: 1.5rem;
        padding: 0.85rem 1rem;
        border-radius: 14px;
        border: 1px solid var(--pa-border);
        background: var(--pa-surface-muted);
      }

      .control-label {
        display: flex;
        flex-direction: column;
        font-size: 0.85rem;
        gap: 0.25rem;
        color: var(--pa-text-muted);
        font-weight: 600;
      }

      .control-label select {
        background: var(--pa-surface);
        border: 1px solid var(--pa-border);
        color: var(--pa-text);
        padding: 0.45rem 0.85rem;
        border-radius: 10px;
        min-width: 180px;
        font-weight: 500;
      }

      .search-control {
        flex: 1 1 320px;
      }

      .search-input {
        position: relative;
        display: flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid var(--pa-border);
        background: var(--pa-surface);
        padding: 0.4rem 0.9rem 0.4rem 2.4rem;
        min-height: 42px;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
      }

      .search-input .search-icon {
        position: absolute;
        left: 0.9rem;
        width: 18px;
        height: 18px;
        color: var(--pa-text-soft);
      }

      .search-input input {
        border: none;
        background: transparent;
        flex: 1;
        font-size: 0.95rem;
        color: var(--pa-text);
        outline: none;
      }

      .search-input input::placeholder {
        color: var(--pa-text-soft);
      }

      .clear-search {
        border: none;
        background: transparent;
        color: var(--pa-text-soft);
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        padding: 0;
        transition: background 0.2s ease, color 0.2s ease;
      }

      .clear-search:hover {
        background: var(--pa-surface-muted);
        color: var(--pa-text);
      }

      .clear-search svg {
        width: 14px;
        height: 14px;
      }

      .control-label.checkbox {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        color: var(--pa-text);
      }

      .control-label.checkbox input {
        width: 16px;
        height: 16px;
        accent-color: var(--pa-primary);
      }

      .table-wrapper {
        border: 1px solid var(--pa-border);
        border-radius: 18px;
        overflow: hidden;
        background: var(--pa-surface);
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.95rem;
      }

      thead {
        background: var(--pa-surface-muted);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--pa-text-soft);
        border-bottom: 1px solid var(--pa-border);
      }

      th,
      td {
        padding: 1rem 1.15rem;
        border-bottom: 1px solid var(--pa-border);
      }

      tbody tr:last-child td {
        border-bottom: none;
      }

      tbody tr:hover {
        background: var(--pa-surface-alt);
      }

      .port-name p {
        margin: 0;
        font-weight: 600;
        color: var(--pa-text);
      }

      .port-name span {
        font-size: 0.8rem;
        color: var(--pa-text-soft);
      }

      .status-chip {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        background: rgba(14, 165, 233, 0.12);
        color: var(--pa-primary);
        border: 1px solid rgba(14, 165, 233, 0.2);
      }

      .status-chip.disabled {
        background: rgba(239, 68, 68, 0.12);
        color: var(--pa-danger);
        border-color: rgba(239, 68, 68, 0.25);
      }

      .activity span,
      .activity p {
        margin: 0;
      }

      .activity span {
        font-size: 0.8rem;
        color: var(--pa-text-soft);
      }

      .activity .muted {
        color: var(--pa-text-soft);
      }

      .actions-cell {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        align-items: center;
      }

      .action-btn {
        border: none;
        border-radius: 999px;
        padding: 0.5rem 1.2rem;
        font-weight: 600;
        cursor: pointer;
        transition:
          background 0.2s ease,
          color 0.2s ease,
          box-shadow 0.2s ease,
          border-color 0.2s ease;
        border: 1px solid transparent;
        font-size: 0.88rem;
      }

      .action-btn.danger {
        background: rgba(239, 68, 68, 0.12);
        color: var(--pa-danger);
        border-color: rgba(239, 68, 68, 0.24);
      }

      .action-btn.danger:hover {
        background: rgba(239, 68, 68, 0.18);
      }

      .action-btn.primary {
        background: var(--pa-primary);
        color: #ffffff;
        border-color: var(--pa-primary);
        box-shadow: 0 15px 30px rgba(14, 165, 233, 0.3);
      }

      .action-btn.primary:hover {
        box-shadow: 0 20px 35px rgba(14, 165, 233, 0.35);
        filter: brightness(1.03);
      }

      .action-btn.ghost {
        background: transparent;
        color: var(--pa-text-muted);
        border: 1px solid var(--pa-border);
      }

      .action-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
      }

      .empty-state,
      .loading-state {
        border: 1px dashed var(--pa-border-strong);
        border-radius: 14px;
        padding: 1.5rem;
        text-align: center;
        color: var(--pa-text-soft);
        background: var(--pa-surface-muted);
      }

      .spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(148, 163, 184, 0.4);
        border-top-color: var(--pa-primary);
        border-radius: 50%;
        margin-inline: auto 0;
        animation: spin 1s linear infinite;
      }

      .toast-stack {
        position: fixed;
        top: 1.5rem;
        right: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 42;
      }

      .toast {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        font-size: 0.9rem;
        border: 1px solid var(--pa-border);
        background: var(--pa-surface);
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.15);
        color: var(--pa-text);
      }

      .toast-success {
        border-color: rgba(34, 197, 94, 0.5);
      }

      .toast-error {
        border-color: rgba(239, 68, 68, 0.5);
      }

      .error-banner {
        margin-top: 1rem;
        padding: 0.95rem 1.1rem;
        border-radius: 12px;
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid rgba(239, 68, 68, 0.25);
      }

      .confirmation-panel {
        margin-top: 1.5rem;
        padding: 1.2rem 1.3rem;
        border-radius: 16px;
        border: 1px solid rgba(239, 68, 68, 0.25);
        background: #fff8f8;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .confirmation-panel textarea {
        width: 100%;
        margin-top: 0.35rem;
        border-radius: 12px;
        border: 1px solid var(--pa-border);
        background: var(--pa-surface);
        color: var(--pa-text);
        padding: 0.75rem;
        font-family: inherit;
        min-height: 120px;
        resize: vertical;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
      }

      .confirmation-panel textarea:focus {
        outline: 2px solid rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.4);
      }

      .confirmation-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.85rem;
        flex-wrap: wrap;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translate(-50%, calc(-50% + 10px));
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }

      @media (max-width: 768px) {
        .modal-panel {
          padding: 1.25rem;
          width: min(520px, 95vw);
        }

        .modal-header {
          flex-direction: column;
          gap: 0.75rem;
        }

        .controls {
          flex-direction: column;
        }

        table {
          font-size: 0.85rem;
        }
      }
    `,
  ],
})
export class PortAdminModalComponent implements OnChanges {
  @Input() isOpen = false
  @Output() close = new EventEmitter<void>()

  ports: PortAdminRecord[] = []
  private basePorts: PortAdminRecord[] = []
  loading = false
  statusFilter: "all" | "enabled" | "disabled" = "all"
  showOnlyAlerts = false
  searchTerm = ""
  pendingAction: { type: "disable"; port: PortAdminRecord } | null = null
  disableReason = ""
  actionError = ""
  actionInProgress = false
  toasts: ToastMessage[] = []

  constructor(private portService: PortService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["isOpen"]?.currentValue) {
      this.loadPorts()
    }

    if (!this.isOpen) {
      this.resetState()
    }
  }

  closeModal(): void {
    this.close.emit()
  }

  onFilterChange(shouldReload = false): void {
    if (!this.isOpen) return
    if (shouldReload) {
      this.loadPorts()
      return
    }
    this.ports = this.applyLocalFilters()
  }

  onSearchChange(): void {
    if (!this.isOpen) return
    this.ports = this.applyLocalFilters()
  }

  clearSearch(): void {
    if (!this.searchTerm) return
    this.searchTerm = ""
    this.onSearchChange()
  }

  requestDisable(port: PortAdminRecord): void {
    this.pendingAction = { type: "disable", port }
    this.disableReason = ""
    this.actionError = ""
  }

  cancelPendingAction(): void {
    this.pendingAction = null
    this.disableReason = ""
  }

  confirmDisable(): void {
    if (!this.pendingAction) return

    this.actionInProgress = true
    this.portService.disablePort(this.pendingAction.port.id, this.disableReason).subscribe({
      next: () => {
        this.actionInProgress = false
        this.addToast(`Puerto ${this.pendingAction!.port.name} deshabilitado correctamente`, "success")
        this.pendingAction = null
        this.disableReason = ""
        this.loadPorts()
      },
      error: (error) => {
        this.actionInProgress = false
        this.handleActionError(error)
      },
    })
  }

  enable(port: PortAdminRecord): void {
    this.actionInProgress = true
    this.actionError = ""
    this.portService.enablePort(port.id).subscribe({
      next: () => {
        this.actionInProgress = false
        this.addToast(`Puerto ${port.name} habilitado correctamente`, "success")
        this.loadPorts()
      },
      error: (error) => {
        this.actionInProgress = false
        this.handleActionError(error)
      },
    })
  }

  dismissToast(toastId: number): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== toastId)
  }

  private loadPorts(): void {
    this.loading = true
    this.actionError = ""

    const filter = this.statusFilter === "all" ? undefined : this.statusFilter === "disabled"

    this.portService.getAdminPorts(filter).subscribe({
      next: (ports) => {
        this.loading = false
        this.basePorts = ports
        this.ports = this.applyLocalFilters()
      },
      error: (error) => {
        this.loading = false
        this.handleActionError(error)
      },
    })
  }

  private applyLocalFilters(): PortAdminRecord[] {
    let filtered = [...this.basePorts]

    if (this.showOnlyAlerts) {
      filtered = this.filterRecentChanges(filtered)
    }

    const query = this.searchTerm.trim().toLowerCase()
    if (query) {
      filtered = filtered.filter((port) => {
        const fields = [port.name, port.continent, port.lastActionBy, port.lastAction, port.status]
        return fields.some((field) => field?.toLowerCase().includes(query))
      })
    }

    return filtered
  }

  private filterRecentChanges(ports: PortAdminRecord[]): PortAdminRecord[] {
    const now = new Date().getTime()
    const threshold = 48 * 60 * 60 * 1000
    return ports.filter((port) => {
      if (!port.lastActionAt) return false
      const updatedAt = new Date(port.lastActionAt).getTime()
      return now - updatedAt <= threshold
    })
  }

  private handleActionError(error: any): void {
    if (error?.status === 400 || error?.status === 409) {
      this.actionError = error.error?.message || "El backend rechazó la operación."
    } else if (error?.status === 401) {
      this.actionError = "Sesión expirada. Redirigiendo al inicio de sesión..."
    } else {
      this.actionError = "Ocurrió un error inesperado al procesar la solicitud."
    }
    this.addToast(this.actionError, "error")
  }

  private resetState(): void {
    this.pendingAction = null
    this.disableReason = ""
    this.actionError = ""
    this.searchTerm = ""
    this.basePorts = []
    this.ports = []
    this.loading = false
    this.actionInProgress = false
  }

  private addToast(message: string, type: "success" | "error"): void {
    const toast: ToastMessage = { id: Date.now() + Math.random(), message, type }
    this.toasts = [...this.toasts, toast]

    setTimeout(() => {
      this.dismissToast(toast.id)
    }, 4000)
  }
}
