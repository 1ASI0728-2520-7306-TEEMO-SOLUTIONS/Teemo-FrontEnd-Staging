import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"

export interface DashboardLayout {
  showSidebar: boolean
  sidebarCollapsed: boolean
  showWeatherWidget: boolean
  showStatistics: boolean
  showRecentRoutes: boolean
  gridLayout: "compact" | "comfortable" | "spacious"
  mapPosition: "top" | "left" | "right"
}

export interface NotificationPreferences {
  channel?: "push" | "email" | "both"
  emailNotifications: boolean
  pushNotifications: boolean
  routeAlerts: boolean
  weatherAlerts: boolean
  systemUpdates: boolean
  marketingEmails: boolean
  alertSound: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

export interface UserProfile {
  name: string
  email: string
  role: string
  company: string
  phone: string
  timezone: string
  language: string
  avatar?: string
}

export interface AppConfiguration {
  dashboardLayout: DashboardLayout
  notifications: NotificationPreferences
  userProfile: UserProfile
  autoSave: boolean
  dataRefreshInterval: number
}

@Injectable({
  providedIn: "root",
})
export class ConfigurationService {
  private readonly CONFIG_KEY = "maritime_app_config"

  private readonly defaultConfig: AppConfiguration = {
    dashboardLayout: {
      showSidebar: true,
      sidebarCollapsed: false,
      showWeatherWidget: true,
      showStatistics: true,
      showRecentRoutes: true,
      gridLayout: "comfortable",
      mapPosition: "top",
    },
    notifications: {
      channel: "push",
      emailNotifications: true,
      pushNotifications: true,
      routeAlerts: true,
      weatherAlerts: true,
      systemUpdates: true,
      marketingEmails: false,
      alertSound: true,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
      },
    },
    userProfile: {
      name: "Usuario Demo",
      email: "demo@maritime.com",
      role: "Capitán",
      company: "Maritime Solutions",
      phone: "+1 234 567 8900",
      timezone: "UTC-5",
      language: "es",
    },
    autoSave: true,
    dataRefreshInterval: 30000,
  }

  private configSubject = new BehaviorSubject<AppConfiguration>(this.loadConfiguration())
  public config$ = this.configSubject.asObservable()

  constructor() {
    this.initializeConfiguration()
  }

  private loadConfiguration(): AppConfiguration {
    const saved = localStorage.getItem(this.CONFIG_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<AppConfiguration>
        return {
          ...this.defaultConfig,
          ...parsed,
          dashboardLayout: {
            ...this.defaultConfig.dashboardLayout,
            ...(parsed.dashboardLayout ?? {}),
          },
          notifications: {
            ...this.defaultConfig.notifications,
            ...(parsed.notifications ?? {}),
          },
          userProfile: {
            ...this.defaultConfig.userProfile,
            ...(parsed.userProfile ?? {}),
          },
        }
      } catch {
        return this.defaultConfig
      }
    }
    return this.defaultConfig
  }

  private saveConfiguration(config: AppConfiguration): void {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config))
    this.configSubject.next(config)
  }

  private initializeConfiguration(): void {
    const config = this.configSubject.value
    this.applyDashboardLayout(config.dashboardLayout)
  }

  private applyDashboardLayout(layout: DashboardLayout): void {
    const root = document.documentElement

    // Apply grid layout
    root.classList.remove("layout-compact", "layout-comfortable", "layout-spacious")
    root.classList.add(`layout-${layout.gridLayout}`)

    // Apply sidebar state
    root.classList.toggle("sidebar-collapsed", layout.sidebarCollapsed)

    // Store sidebar preference
    localStorage.setItem("sidebar_collapsed", layout.sidebarCollapsed.toString())
  }

  // Public methods
  updateDashboardLayout(updates: Partial<DashboardLayout>): void {
    const currentConfig = this.configSubject.value
    const newLayout = { ...currentConfig.dashboardLayout, ...updates }
    const newConfig = { ...currentConfig, dashboardLayout: newLayout }

    this.saveConfiguration(newConfig)
    this.applyDashboardLayout(newLayout)
  }

  updateNotificationPreferences(updates: Partial<NotificationPreferences>): void {
    const currentConfig = this.configSubject.value
    const newNotifications = { ...currentConfig.notifications, ...updates }
    const newConfig = { ...currentConfig, notifications: newNotifications }

    this.saveConfiguration(newConfig)
  }

  updateUserProfile(updates: Partial<UserProfile>): void {
    const currentConfig = this.configSubject.value
    const newProfile = { ...currentConfig.userProfile, ...updates }
    const newConfig = { ...currentConfig, userProfile: newProfile }

    this.saveConfiguration(newConfig)
  }

  updateGeneralSettings(updates: { autoSave?: boolean; dataRefreshInterval?: number }): void {
    const currentConfig = this.configSubject.value
    const newConfig = { ...currentConfig, ...updates }

    this.saveConfiguration(newConfig)
  }

  getCurrentConfiguration(): AppConfiguration {
    return this.configSubject.value
  }

  resetToDefaults(): void {
    this.saveConfiguration(this.defaultConfig)
    this.applyDashboardLayout(this.defaultConfig.dashboardLayout)
  }

  exportConfiguration(): string {
    return JSON.stringify(this.configSubject.value, null, 2)
  }

  importConfiguration(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson)
      this.saveConfiguration({ ...this.defaultConfig, ...config })
      this.applyDashboardLayout(config.dashboardLayout || this.defaultConfig.dashboardLayout)
      return true
    } catch {
      return false
    }
  }
}
