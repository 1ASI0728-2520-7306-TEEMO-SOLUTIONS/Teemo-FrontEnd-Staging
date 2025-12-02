import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import { Router, ActivatedRoute, RouterModule } from "@angular/router"
import { AuthService } from "../../../services/auth.service"

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-background">
        <span class="orb orb-one"></span>
        <span class="orb orb-two"></span>
        <span class="grid"></span>
      </div>
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
              <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7H2v5z"></path>
              <path d="M6 7V5c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span class="logo-text">Maritime Route</span>
          </div>
          <h1>Iniciar Sesión</h1>
          <p>Ingrese sus credenciales para acceder al sistema</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username">Usuario</label>
            <div class="input-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                id="username"
                formControlName="username"
                placeholder="Ingrese su nombre de usuario"
                [ngClass]="{'is-invalid': submitted && f['username'].errors}"
              >
            </div>
            <div *ngIf="submitted && f['username'].errors" class="error-message">
              <span *ngIf="f['username'].errors['required']">El nombre de usuario es requerido</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="input-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                formControlName="password"
                placeholder="Ingrese su contraseña"
                [ngClass]="{'is-invalid': submitted && f['password'].errors}"
              >
              <button
                type="button"
                class="password-toggle"
                (click)="togglePasswordVisibility()"
                tabindex="-1"
              >
                <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
            <div *ngIf="submitted && f['password'].errors" class="error-message">
              <span *ngIf="f['password'].errors['required']">La contraseña es requerida</span>
            </div>
          </div>

          <div class="form-options">
            <div class="remember-me">
              <input type="checkbox" id="remember" formControlName="remember">
              <label for="remember">Recordarme</label>
            </div>
            <a href="#" class="forgot-password">¿Olvidó su contraseña?</a>
          </div>

          <div *ngIf="error" class="alert-error">
            {{ error }}
          </div>

          <div *ngIf="registeredMessage" class="alert-success">
            {{ registeredMessage }}
          </div>

          <button type="submit" class="login-btn" [disabled]="loading">
            <span *ngIf="!loading">Iniciar Sesión</span>
            <div *ngIf="loading" class="spinner"></div>
          </button>
        </form>

        <div class="login-footer">
          <p>¿No tiene una cuenta? <a [routerLink]="['/register']">Registrarse</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .login-container {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: radial-gradient(circle at 20% 20%, #e0f2fe, #f8fbff 55%, #eef2ff);
      overflow: hidden;
    }

    .login-background {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .login-background .orb {
      position: absolute;
      width: 520px;
      height: 520px;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.35;
      animation: float 14s ease-in-out infinite;
    }

    .orb-one {
      top: -200px;
      left: -80px;
      background: rgba(14, 165, 233, 0.4);
    }

    .orb-two {
      bottom: -220px;
      right: -120px;
      background: rgba(14, 116, 144, 0.35);
      animation-delay: 4s;
    }

    .login-background .grid {
      position: absolute;
      inset: 15% 20%;
      border-radius: 32px;
      border: 1px solid rgba(15, 23, 42, 0.08);
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(14, 165, 233, 0.05));
      transform: rotate(-4deg);
      animation: gridDrift 24s linear infinite;
    }

    .login-card {
      position: relative;
      width: 100%;
      max-width: 460px;
      padding: 2.5rem;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 1.5rem;
      border: 1px solid rgba(148, 163, 184, 0.25);
      box-shadow: 0 25px 70px rgba(15, 23, 42, 0.15);
      backdrop-filter: blur(20px);
      color: #0f172a;
      z-index: 1;
    }

    .login-card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      border: 1px solid rgba(255, 255, 255, 0.6);
      pointer-events: none;
      mix-blend-mode: soft-light;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 999px;
      background: rgba(14, 165, 233, 0.12);
      color: #0f172a;
      border: 1px solid rgba(14, 165, 233, 0.2);
      margin-bottom: 1.5rem;
    }

    .logo-icon {
      color: #0284c7;
    }

    .logo-text {
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .login-header h1 {
      margin: 0;
      font-size: 1.9rem;
      color: #0f172a;
    }

    .login-header p {
      margin: 0.5rem 0 0;
      color: #475569;
      font-size: 0.95rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #0f172a;
    }

    .input-container {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      pointer-events: none;
    }

    .input-container input {
      width: 100%;
      border-radius: 14px;
      border: 1px solid rgba(15, 23, 42, 0.12);
      padding: 0.9rem 1rem 0.9rem 2.8rem;
      background: rgba(255, 255, 255, 0.9);
      color: #0f172a;
      font-size: 0.95rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }

    .input-container input::placeholder {
      color: #94a3b8;
    }

    .input-container input:focus {
      outline: none;
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2);
      background: #fff;
    }

    .input-container input.is-invalid {
      border-color: #f87171;
      box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.12);
    }

    .password-toggle {
      position: absolute;
      top: 50%;
      right: 0.5rem;
      transform: translateY(-50%);
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      padding: 0.35rem;
      display: grid;
      place-items: center;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.88rem;
      color: #475569;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .remember-me input {
      accent-color: #0ea5e9;
    }

    .remember-me label {
      font-size: 0.9rem;
      font-weight: 500;
      color: #0f172a;
    }

    .forgot-password {
      color: #0284c7;
      font-weight: 600;
      text-decoration: none;
    }

    .forgot-password:hover {
      text-decoration: underline;
    }

    .alert-error,
    .alert-success {
      padding: 0.9rem 1rem;
      border-radius: 1rem;
      font-size: 0.85rem;
      border: 1px solid rgba(248, 113, 113, 0.2);
      background: rgba(248, 113, 113, 0.08);
      color: #b91c1c;
    }

    .alert-success {
      border-color: rgba(34, 197, 94, 0.25);
      background: rgba(34, 197, 94, 0.08);
      color: #15803d;
    }

    .error-message {
      font-size: 0.8rem;
      color: #b91c1c;
    }

    .login-btn {
      width: 100%;
      border: none;
      border-radius: 999px;
      padding: 1rem;
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      color: #fff;
      background: linear-gradient(120deg, #0ea5e9, #0284c7);
      box-shadow: 0 20px 40px rgba(14, 165, 233, 0.35);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 25px 50px rgba(14, 165, 233, 0.4);
    }

    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .login-footer {
      margin-top: 2rem;
      text-align: center;
      color: #475569;
      font-size: 0.9rem;
    }

    .login-footer p {
      margin: 0;
    }

    .login-footer a {
      color: #0ea5e9;
      font-weight: 600;
      text-decoration: none;
    }

    .login-footer a:hover {
      text-decoration: underline;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    @keyframes gridDrift {
      0% { transform: rotate(-4deg) translateY(0); opacity: 0.35; }
      100% { transform: rotate(-4deg) translateY(30px); opacity: 0.2; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      .login-container {
        padding: 1.5rem;
      }
      .login-card {
        padding: 2rem 1.75rem;
      }
    }

    :host-context(.dark-mode) .login-container {
      background: radial-gradient(circle at 30% 20%, #0b2548, #020617 70%);
    }

    :host-context(.dark-mode) .login-card {
      background: rgba(6, 12, 24, 0.92);
      border-color: rgba(148, 163, 184, 0.3);
      box-shadow: 0 25px 80px rgba(2, 6, 23, 0.75);
      color: #e2e8f0;
    }

    :host-context(.dark-mode) .login-card::after {
      border-color: rgba(255, 255, 255, 0.08);
    }

    :host-context(.dark-mode) .logo {
      background: rgba(56, 189, 248, 0.15);
      color: #e0f2fe;
      border-color: rgba(56, 189, 248, 0.3);
    }

    :host-context(.dark-mode) .login-header h1 {
      color: #f8fafc;
    }

    :host-context(.dark-mode) .login-header p {
      color: rgba(226, 232, 240, 0.8);
    }

    :host-context(.dark-mode) label {
      color: #e2e8f0;
    }

    :host-context(.dark-mode) .input-container input {
      background: rgba(15, 23, 42, 0.9);
      border-color: rgba(148, 163, 184, 0.35);
      color: #f8fafc;
    }

    :host-context(.dark-mode) .input-container input:focus {
      background: rgba(15, 23, 42, 1);
    }

    :host-context(.dark-mode) .input-container input::placeholder {
      color: rgba(226, 232, 240, 0.55);
    }

    :host-context(.dark-mode) .input-icon,
    :host-context(.dark-mode) .password-toggle {
      color: rgba(226, 232, 240, 0.7);
    }

    :host-context(.dark-mode) .form-options {
      color: rgba(226, 232, 240, 0.8);
    }

    :host-context(.dark-mode) .remember-me label {
      color: rgba(226, 232, 240, 0.9);
    }

    :host-context(.dark-mode) .forgot-password {
      color: #38bdf8;
    }

    :host-context(.dark-mode) .login-footer {
      color: rgba(226, 232, 240, 0.85);
    }

    :host-context(.dark-mode) .login-footer a {
      color: #38bdf8;
    }

    :host-context(.dark-mode) .alert-error {
      color: #fecdd3;
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(248, 113, 113, 0.35);
    }

    :host-context(.dark-mode) .alert-success {
      color: #bbf7d0;
      background: rgba(34, 197, 94, 0.18);
      border-color: rgba(74, 222, 128, 0.35);
    }

    :host-context(.dark-mode) .login-background .grid {
      border-color: rgba(148, 163, 184, 0.18);
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(14, 165, 233, 0.06));
    }

    :host-context(.dark-mode) .login-background .orb {
      opacity: 0.2;
    }
    `
  ],

})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup
  loading = false
  submitted = false
  error = ""
  showPassword = false
  returnUrl = "/"
  registeredMessage = ""

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {
    // Verificar si se está forzando la página de login
    const forceLogin = this.route.snapshot.queryParams["forceLogin"] === "true"

    // Redirigir al dashboard si ya está autenticado y no se está forzando el login
    if (this.authService.isLoggedIn && !forceLogin) {
      this.router.navigate(["/dashboard"])
    }
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ["", Validators.required],
      password: ["", Validators.required],
      remember: [false],
    })

    // Obtener la URL de retorno de los parámetros de consulta o usar el valor predeterminado
    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/dashboard"

    // Verificar si hay un mensaje de error en los parámetros de consulta
    const errorMsg = this.route.snapshot.queryParams["error"]
    if (errorMsg) {
      this.error = errorMsg
    }

    // Verificar si el usuario viene de registrarse
    const registered = this.route.snapshot.queryParams["registered"]
    const username = this.route.snapshot.queryParams["username"]
    if (registered === "true" && username) {
      this.registeredMessage = `Usuario "${username}" registrado con éxito. Por favor, inicie sesión.`

      // Prellenar el campo de usuario
      this.loginForm.patchValue({
        username: username,
      })
    }
  }

  // Getter para acceder fácilmente a los campos del formulario
  get f() {
    return this.loginForm.controls
  }

  onSubmit(): void {
    this.submitted = true

    // Detener si el formulario es inválido
    if (this.loginForm.invalid) {
      return
    }

    this.loading = true
    this.error = ""

    this.authService
      .login({
        username: this.f["username"].value,
        password: this.f["password"].value,
      })
      .subscribe({
        next: () => {
          this.router.navigate([this.returnUrl])
        },
        error: (error) => {
          this.error = error.message
          this.loading = false
        },
      })
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }
}
