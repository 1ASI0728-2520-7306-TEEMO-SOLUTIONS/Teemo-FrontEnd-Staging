import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { SidebarComponent } from "../shared/sidebar/sidebar.component"
import { AuthService, type User } from "../../services/auth.service"
import { ConfigurationService, type UserProfile } from "../../services/configuration.service"

interface ProfileSummary {
  id?: string
  name: string
  username: string
  email: string
  role: string
  company: string
  phone: string
  timezone: string
  language: string
}

@Component({
  selector: "app-user-profile",
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  template: `
    <div class="profile-app-container">
      <div class="profile-background" aria-hidden="true"></div>

      <app-sidebar [currentUser]="sidebarUser"></app-sidebar>

      <div class="profile-main">
        <header class="profile-header">
          <p class="header-eyebrow">Perfil</p>
          <h1>Perfil del Usuario</h1>
          <p class="header-support">
            Gestiona tu identidad operativa y revisa la información sincronizada con el backend.
          </p>
        </header>

        <main class="profile-content" *ngIf="profileData as profile; else profileFallback">
          <section class="profile-card">
            <div class="profile-card-left">
              <div class="profile-avatar">
                <span>{{ profileInitial }}</span>
              </div>
              <div class="profile-summary">
                <h2>{{ profile.name || profile.username || 'Sin nombre disponible' }}</h2>
                <ng-container *ngIf="profile.username; else usernameFallback">
                  <p class="profile-username">{{ '@' + profile.username }}</p>
                </ng-container>
                <ng-template #usernameFallback>
                  <p class="profile-username muted">Sin identificador</p>
                </ng-template>
                <span class="role-badge">{{ profile.role || 'Sin rol registrado' }}</span>
              </div>
            </div>
            <div class="profile-card-right">
              <div class="meta-item">
                <span class="meta-label">Correo</span>
                <span class="meta-value">{{ profile.email || 'Sin datos' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Organización</span>
                <span class="meta-value">{{ profile.company || 'Sin datos' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Teléfono</span>
                <span class="meta-value">{{ profile.phone || 'Sin datos' }}</span>
              </div>
            </div>
          </section>

          <section class="details-grid">
            <article class="detail-card" *ngFor="let detail of detailEntries">
              <p class="detail-label">{{ detail.label }}</p>
              <p class="detail-value">{{ detail.value || 'Sin especificar' }}</p>
            </article>
          </section>
        </main>

        <ng-template #profileFallback>
          <div class="profile-empty-state">
            <p *ngIf="isLoading">Cargando información del perfil...</p>
            <p *ngIf="!isLoading">No hay datos de perfil disponibles.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .profile-app-container {
        display: flex;
        min-height: 100vh;
        position: relative;
        overflow: hidden;
      }

      .profile-background {
        position: fixed;
        inset: 0;
        background: linear-gradient(135deg, #0f172a, #1d4ed8);
        opacity: 0.15;
        z-index: 0;
      }

      .profile-main {
        flex: 1;
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        background-color: #f8fafc;
        margin-left: 260px;
        min-height: 100vh;
      }

      :host-context(.sidebar-collapsed) .profile-main {
        margin-left: 80px;
      }

      .profile-header {
        padding: 2rem 2rem 1rem;
        border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      }

      .header-eyebrow {
        margin: 0;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        color: #0ea5e9;
        font-weight: 600;
      }

      .profile-header h1 {
        margin: 0.35rem 0 0.5rem;
        font-size: 1.75rem;
        color: #0f172a;
      }

      .header-support {
        margin: 0;
        color: #475569;
      }

      .profile-content {
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .profile-card {
        background-color: white;
        border-radius: 1rem;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.15);
        border: 1px solid rgba(15, 23, 42, 0.08);
        gap: 1.5rem;
      }

      .profile-card-left {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }

      .profile-avatar {
        width: 72px;
        height: 72px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #0ea5e9, #6366f1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: 600;
        color: white;
        box-shadow: 0 20px 25px -5px rgba(14, 165, 233, 0.35);
      }

      .profile-summary h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #0f172a;
      }

      .profile-username {
        margin: 0.25rem 0 0.75rem;
        color: #64748b;
      }

      .profile-username.muted {
        color: #94a3b8;
      }

      .role-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        background: rgba(14, 165, 233, 0.15);
        color: #0c4a6e;
        font-weight: 600;
        font-size: 0.875rem;
      }

      .profile-card-right {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
        width: 100%;
      }

      .meta-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .meta-label {
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        color: #64748b;
        text-transform: uppercase;
      }

      .meta-value {
        font-size: 0.95rem;
        color: #0f172a;
        font-weight: 600;
      }

      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 1rem;
      }

      .detail-card {
        background: white;
        border-radius: 0.75rem;
        padding: 1.25rem;
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: 0 10px 20px -15px rgba(15, 23, 42, 0.45);
      }

      .detail-label {
        margin: 0;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
      }

      .detail-value {
        margin: 0.35rem 0 0;
        font-size: 1.1rem;
        color: #0f172a;
        font-weight: 600;
      }

      .profile-empty-state {
        padding: 4rem 2rem;
        text-align: center;
        color: #475569;
        font-size: 1rem;
      }

      @media (max-width: 1024px) {
        .profile-card {
          flex-direction: column;
          align-items: flex-start;
        }

        .profile-card-right {
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          width: 100%;
        }
      }

      @media (max-width: 768px) {
        .profile-app-container {
          flex-direction: column;
        }
      }

      :host-context(.dark-mode) .profile-main {
        background: rgba(2, 6, 23, 0.92);
      }

      :host-context(.dark-mode) .profile-header {
        border-bottom-color: rgba(148, 163, 184, 0.2);
      }

      :host-context(.dark-mode) .profile-header h1 {
        color: #f8fafc;
      }

      :host-context(.dark-mode) .header-support {
        color: #94a3b8;
      }

      :host-context(.dark-mode) .profile-card,
      :host-context(.dark-mode) .detail-card {
        background: rgba(15, 23, 42, 0.9);
        border-color: rgba(148, 163, 184, 0.2);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75);
      }

      :host-context(.dark-mode) .profile-summary h2,
      :host-context(.dark-mode) .meta-value,
      :host-context(.dark-mode) .detail-value {
        color: #f8fafc;
      }

      :host-context(.dark-mode) .profile-username,
      :host-context(.dark-mode) .meta-label,
      :host-context(.dark-mode) .detail-label {
        color: #94a3b8;
      }

      :host-context(.dark-mode) .profile-empty-state {
        color: #cbd5f5;
      }
    `,
  ],
})
export class UserProfileComponent implements OnInit {
  sidebarUser = {
    name: "",
    role: "",
  }

  profileData: ProfileSummary | null = null
  profileInitial = "?"
  detailEntries: { label: string; value: string }[] = []
  isLoading = true

  constructor(
    private readonly authService: AuthService,
    private readonly configurationService: ConfigurationService,
  ) {}

  ngOnInit(): void {
    this.loadProfileData()
  }

  private loadProfileData(): void {
    this.isLoading = true

    try {
      const authUser = this.authService.currentUserValue
      const configProfile: Partial<UserProfile> =
        this.configurationService.getCurrentConfiguration()?.userProfile ?? {}

      const profile: ProfileSummary = {
        id: authUser?.id,
        name: this.extractUserName(authUser) ?? "",
        username:
          this.normalizeText(authUser?.username) ??
          this.deriveIdentifier(authUser?.email) ??
          this.deriveIdentifier(configProfile.email) ??
          "",
        email: this.normalizeText(authUser?.email) ?? this.normalizeText(configProfile.email) ?? "",
        role:
          this.formatRole(authUser) ??
          this.normalizeRole(configProfile.role) ??
          "",
        company: this.normalizeText(configProfile.company) ?? "",
        phone: this.normalizeText(configProfile.phone) ?? "",
        timezone: this.normalizeText(configProfile.timezone) ?? "",
        language: (this.normalizeText(configProfile.language) ?? "").toUpperCase(),
      }

      this.profileData = profile
      this.profileInitial = this.computeInitial(profile)
      this.detailEntries = this.buildDetailEntries(profile)
      this.sidebarUser = {
        name: profile.name || profile.username || "",
        role: profile.role,
      }
    } finally {
      this.isLoading = false
    }
  }

  private buildDetailEntries(profile: ProfileSummary): { label: string; value: string }[] {
    return [
      { label: "Correo", value: profile.email },
      { label: "Organización", value: profile.company },
      { label: "Teléfono", value: profile.phone },
      { label: "Zona Horaria", value: profile.timezone },
      { label: "Idioma", value: profile.language },
      { label: "Rol Asignado", value: profile.role },
    ]
  }

  private extractUserName(user: User | null): string | undefined {
    if (!user) {
      return undefined
    }
    return this.normalizeText(user.name) || this.normalizeText(user.username)
  }

  private formatRole(user: User | null): string | undefined {
    if (!user) {
      return undefined
    }
    const rawRole = user.role || user.roles?.[0]
    if (!rawRole) {
      return undefined
    }
    return this.normalizeRole(rawRole)
  }

  private normalizeRole(role?: string | null): string | undefined {
    if (!role) {
      return undefined
    }
    const normalized = role.replace(/^ROLE_/, "").toLowerCase()
    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }

  private normalizeText(value?: string | null): string | undefined {
    if (typeof value !== "string") {
      return undefined
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  private deriveIdentifier(value?: string | null): string | undefined {
    const normalized = this.normalizeText(value)
    if (!normalized) {
      return undefined
    }
    const atIndex = normalized.indexOf("@")
    return atIndex > 0 ? normalized.slice(0, atIndex) : normalized
  }

  private computeInitial(profile: ProfileSummary): string {
    const source = profile.name || profile.username || profile.email || ""
    return source.trim().charAt(0).toUpperCase() || "?"
  }
}
