import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { BehaviorSubject, type Observable, throwError } from "rxjs"
import { catchError, map } from "rxjs/operators"
import { Router } from "@angular/router"
import { environment } from "../../environments/environment"

export interface User {
  id: string
  username: string
  name?: string
  email?: string
  role?: string
  roles?: string[]
  token?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  id: string
  username: string
  token: string
  roles: string[]
}

export interface SignUpRequest {
  username: string
  password: string
  roles: string[]
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  // Cambiamos la URL para que coincida con el backend
  private apiUrl = `${environment.apiUrl}/authentication`
  private tokenKey = "maritime_auth_token"
  private userKey = "maritime_user"
  private currentUserSubject: BehaviorSubject<User | null>
  public currentUser: Observable<User | null>

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    // Intentar recuperar el usuario del almacenamiento local al iniciar
    const storedUser = localStorage.getItem(this.userKey)
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null)
    this.currentUser = this.currentUserSubject.asObservable()
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value
  }

  public get isLoggedIn(): boolean {
    return !!this.currentUserValue && !!this.getToken()
  }

  // Update the login method to match the backend's expected format and response
  login(credentials: LoginRequest): Observable<User> {
    // Calling the endpoint that matches the backend's AuthenticationController
    return this.http.post<LoginResponse>(`${this.apiUrl}/sign-in`, credentials).pipe(
      map((response) => {
        const roles = this.extractRoles(response)
        const primaryRole = roles[0] ?? this.normalizeRole((response as any)?.role) ?? "ROLE_USER"

        const user: User = {
          id: response.id,
          username: response.username,
          name: (response as any)?.name ?? response.username,
          role: primaryRole,
          roles,
          token: response.token,
        }

        // Save token and user
        this.setToken(response.token)
        this.setUser(user)
        this.currentUserSubject.next(user)
        return user
      }),
      catchError((error) => {
        console.error("Error durante el inicio de sesión:", error)
        let errorMessage = "Error de inicio de sesión"

        if (error.error && error.error.message) {
          errorMessage = error.error.message
        } else if (error.status === 401) {
          errorMessage = "Credenciales inválidas"
        } else if (error.status === 403) {
          errorMessage = "No tiene permisos para acceder"
        } else if (error.status === 0) {
          errorMessage = "No se pudo conectar al servidor. Verifique su conexión a internet."
        }

        return throwError(() => new Error(errorMessage))
      }),
    )
  }

  // Modificar el método register para manejar mejor los errores
  register(signUpRequest: SignUpRequest): Observable<User> {
    // No need to modify the roles - we're now sending the exact enum values from the form
    console.log("Sending to backend:", signUpRequest)

    // Llamada al endpoint de registro del backend
    return this.http.post<User>(`${this.apiUrl}/sign-up`, signUpRequest).pipe(
      catchError((error) => {
        console.error("Error durante el registro:", error)
        let errorMessage = "Error de registro"

        if (error.error && error.error.message) {
          errorMessage = error.error.message
        } else if (error.status === 400) {
          errorMessage = "Datos de registro inválidos"
        } else if (error.status === 409) {
          errorMessage = "El nombre de usuario ya existe"
        } else if (error.status === 401) {
          errorMessage = "No se pudo registrar el usuario. El endpoint requiere autenticación."
        } else if (error.status === 500) {
          errorMessage =
            error.error && error.error.message
              ? error.error.message
              : "Error interno del servidor. Por favor contacte al administrador."
        } else if (error.status === 0) {
          errorMessage = "No se pudo conectar al servidor. Verifique su conexión a internet."
        }

        return throwError(() => new Error(errorMessage))
      }),
    )
  }

  logout(): void {
    // Eliminar token y usuario del almacenamiento
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.userKey)
    this.currentUserSubject.next(null)
    this.router.navigate(["/login"])
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token)
  }

  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user))
  }

  private normalizeRole(role?: string | null): string | undefined {
    if (!role) return undefined
    const trimmed = role.trim().toUpperCase()
    return trimmed.startsWith("ROLE_") ? trimmed : `ROLE_${trimmed}`
  }

  private extractRoles(payload: any): string[] {
    const raw = payload?.roles ?? payload?.authorities ?? []
    if (Array.isArray(raw)) {
      return raw.map((role) => this.normalizeRole(role)).filter(Boolean) as string[]
    }
    if (typeof raw === "string") {
      const normalized = this.normalizeRole(raw)
      return normalized ? [normalized] : []
    }
    const single = this.normalizeRole(payload?.role)
    return single ? [single] : []
  }

  private getRoleFromRoles(roles: string[]): string {
    // Prioridad de roles (de mayor a menor)
    const rolePriority = ["ROLE_ADMIN", "ROLE_INSTRUCTOR", "ROLE_USER"]

    // Buscar el rol de mayor prioridad
    for (const role of rolePriority) {
      if (roles.includes(role)) {
        return this.formatRoleName(role)
      }
    }

    // Si no hay coincidencias, devolver el primer rol o "Usuario" por defecto
    return roles.length > 0 ? this.formatRoleName(roles[0]) : "Usuario"
  }

  // Método para formatear el nombre del rol (primera letra mayúscula, resto minúsculas)
  private formatRoleName(role: string): string {
    // Remove the ROLE_ prefix and capitalize the first letter
    const roleName = role.replace("ROLE_", "")
    return roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()
  }

  // Verificar si el token ha expirado
  isTokenExpired(): boolean {
    const token = this.getToken()
    if (!token) return true

    // Si el backend usa JWT, podríamos decodificar el token y verificar su fecha de expiración
    // Por ahora, asumimos que el token es válido
    return false
  }
}
