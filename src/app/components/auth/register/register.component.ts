import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import { Router, RouterModule } from "@angular/router"
import { AuthService } from "../../../services/auth.service"
import { environment } from "../../../../environments/environment"

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="register-container">
      <div class="register-background">
        <span class="orb orb-one"></span>
        <span class="orb orb-two"></span>
        <span class="grid"></span>
      </div>
      <div class="register-card">
        <div class="register-header">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
              <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7H2v5z"></path>
              <path d="M6 7V5c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span class="logo-text">Maritime Route</span>
          </div>
          <h1>Registro de Usuario</h1>
          <p>Cree una nueva cuenta para acceder al sistema</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
          <div class="form-group">
            <label for="username">Nombre de Usuario</label>
            <div class="input-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                id="username"
                formControlName="username"
                placeholder="Ingrese un nombre de usuario"
                [ngClass]="{'is-invalid': submitted && f['username'].errors}"
              >
            </div>
            <div *ngIf="submitted && f['username'].errors" class="error-message">
              <span *ngIf="f['username'].errors['required']">El nombre de usuario es requerido</span>
              <span *ngIf="f['username'].errors['minlength']">El nombre de usuario debe tener al menos 3 caracteres</span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <div class="input-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="input-icon"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                <polyline points="4,6 12,12 20,6"></polyline>
              </svg>
              <input
                type="text"
                id="email"
                formControlName="email"
                placeholder="Ingrese su correo electrónico"
                [ngClass]="{'is-invalid': submitted && f['email'].errors}"
              >
            </div>
            <div *ngIf="submitted && f['email'].errors" class="error-message">
              <span *ngIf="f['email'].errors['required']">El correo electrónico es requerido</span>
              <span *ngIf="f['email'].errors['email']">Ingrese un correo electrónico válido</span>
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
                placeholder="Ingrese una contraseña"
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
              <span *ngIf="f['password'].errors['minlength']">La contraseña debe tener al menos 6 caracteres</span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Contraseña</label>
            <div class="input-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="confirmPassword"
                formControlName="confirmPassword"
                placeholder="Confirme su contraseña"
                [ngClass]="{'is-invalid': submitted && f['confirmPassword'].errors}"
              >
            </div>
            <div *ngIf="submitted && f['confirmPassword'].errors" class="error-message">
              <span *ngIf="f['confirmPassword'].errors['required']">La confirmación de contraseña es requerida</span>
              <span *ngIf="f['confirmPassword'].errors['mustMatch']">Las contraseñas no coinciden</span>
            </div>
          </div>

          <div class="form-group">
            <label for="role">Rol</label>
            <div class="input-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <select
                id="role"
                formControlName="role"
                [ngClass]="{'is-invalid': submitted && f['role'].errors}"
              >
                <option value="">Seleccione un rol</option>
                <option value="ROLE_USER">Usuario</option>
                <option value="ROLE_ADMIN">Administrador</option>
                <option value="ROLE_INSTRUCTOR">Instructor</option>
              </select>
            </div>
            <div *ngIf="submitted && f['role'].errors" class="error-message">
              <span *ngIf="f['role'].errors['required']">El rol es requerido</span>
            </div>
          </div>

          <!-- Shipping Company Field -->
          <div class="form-group">
            <label for="shippingCompany">Empresa Naviera (Opcional)</label>
            <div class="input-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7H2v5z"></path>
                <path d="M6 7V5c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v2"></path>
              </svg>
              <select
                id="shippingCompany"
                formControlName="shippingCompany"
                (change)="onShippingCompanyChange($event)"
              >
                <option value="">Seleccione una empresa naviera</option>
                <option value="APM-Maersk">APM-Maersk</option>
                <option value="Mediterranean Shipping">Mediterranean Shipping</option>
                <option value="Cosco Shipping">Cosco Shipping</option>
                <option value="CMA CGM">CMA CGM</option>
                <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                <option value="ONE">ONE</option>
                <option value="Evergreen Line">Evergreen Line</option>
                <option value="Yang Ming Marine">Yang Ming Marine</option>
                <option value="Hyundai M. M.">Hyundai M. M.</option>
                <option value="PIL (Pacific Int. Line)">PIL (Pacific Int. Line)</option>
                <option value="Zim">Zim</option>
                <option value="Wan Hai Line">Wan Hai Line</option>
                <option value="Zhonggu Logistics">Zhonggu Logistics</option>
                <option value="IRISL Group">IRISL Group</option>
                <option value="KMTC">KMTC</option>
                <option value="Antong Holdings">Antong Holdings</option>
                <option value="SITC">SITC</option>
                <option value="X-Press Feeders Group">X-Press Feeders Group</option>
                <option value="TS Line">TS Line</option>
                <option value="SM Corp.">SM Corp.</option>
                <option value="other">Otra</option>
              </select>
            </div>
          </div>

          <!-- Custom Shipping Company Input (shown when "other" is selected) -->
          <div class="form-group" *ngIf="showCustomShippingInput">
            <label for="customShippingCompany">Especifique la Empresa Naviera</label>
            <div class="input-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              <input
                type="text"
                id="customShippingCompany"
                formControlName="customShippingCompany"
                placeholder="Ingrese el nombre de la empresa naviera"
                [ngClass]="{'is-invalid': submitted && f['customShippingCompany'].errors}"
              >
            </div>
            <div *ngIf="submitted && f['customShippingCompany'].errors" class="error-message">
              <span *ngIf="f['customShippingCompany'].errors['required']">Debe especificar el nombre de la empresa naviera</span>
            </div>
          </div>

          <div class="form-group">
            <div class="terms-checkbox">
              <input type="checkbox" id="terms" formControlName="terms">
              <label for="terms">Acepto los términos y condiciones</label>
            </div>
            <div *ngIf="submitted && f['terms'].errors" class="error-message">
              <span *ngIf="f['terms'].errors['requiredTrue']">Debe aceptar los términos y condiciones</span>
            </div>
          </div>

          <div *ngIf="error" class="alert-error">
            {{ error }}
          </div>

          <button type="submit" class="register-btn" [disabled]="loading">
            <span *ngIf="!loading">Registrarse</span>
            <div *ngIf="loading" class="spinner"></div>
          </button>

          <div *ngIf="success" class="alert-success">
            {{ success }}
          </div>
        </form>

        <div class="register-footer">
          <p>¿Ya tiene una cuenta? <a [routerLink]="['/login']">Iniciar Sesión</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .register-container {
        position: relative;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: radial-gradient(circle at 20% 20%, #e0f2fe, #f8fbff 55%, #eef2ff);
        overflow: hidden;
      }

      .register-background {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .register-background .orb {
        position: absolute;
        width: 500px;
        height: 500px;
        border-radius: 50%;
        filter: blur(90px);
        opacity: 0.35;
        animation: float 14s ease-in-out infinite;
      }

      .orb-one {
        top: -180px;
        left: -120px;
        background: rgba(14, 165, 233, 0.4);
      }

      .orb-two {
        bottom: -220px;
        right: -80px;
        background: rgba(14, 116, 144, 0.35);
        animation-delay: 4s;
      }

      .register-background .grid {
        position: absolute;
        inset: 15% 22%;
        border-radius: 32px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(14, 165, 233, 0.05));
        transform: rotate(-5deg);
        animation: gridDrift 22s linear infinite;
      }

      .register-card {
        position: relative;
        width: 100%;
        max-width: 520px;
        padding: 2.5rem;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 1.5rem;
        border: 1px solid rgba(148, 163, 184, 0.25);
        box-shadow: 0 25px 70px rgba(15, 23, 42, 0.15);
        backdrop-filter: blur(20px);
        color: #0f172a;
        z-index: 1;
      }

      .register-card::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: 1px solid rgba(255, 255, 255, 0.6);
        pointer-events: none;
        mix-blend-mode: soft-light;
      }

      .register-header {
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
        border: 1px solid rgba(14, 165, 233, 0.2);
        color: #0f172a;
        margin-bottom: 1.5rem;
      }

      .logo-icon {
        color: #0284c7;
      }

      .logo-text {
        font-weight: 700;
        font-size: 1.1rem;
        letter-spacing: 0.04em;
      }

      .register-header h1 {
        margin: 0;
        font-size: 1.9rem;
        color: #0f172a;
      }

      .register-header p {
        margin: 0.5rem 0 0;
        color: #475569;
        font-size: 0.95rem;
      }

      .register-form {
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
      }

      .input-container input,
      .input-container select {
        width: 100%;
        border-radius: 14px;
        border: 1px solid rgba(15, 23, 42, 0.12);
        padding: 0.9rem 1rem 0.9rem 2.8rem;
        background: rgba(255, 255, 255, 0.9);
        color: #0f172a;
        font-size: 0.95rem;
        transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        appearance: none;
      }

      .input-container input::placeholder {
        color: #94a3b8;
      }

      .input-container select {
        padding-right: 2.5rem;
        background-image:
          linear-gradient(45deg, transparent 50%, #94a3b8 50%),
          linear-gradient(135deg, #94a3b8 50%, transparent 50%);
        background-position:
          calc(100% - 18px) calc(50% - 4px),
          calc(100% - 12px) calc(50% - 4px);
        background-size: 6px 6px;
        background-repeat: no-repeat;
      }

      .input-container input:focus,
      .input-container select:focus {
        outline: none;
        border-color: #0ea5e9;
        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2);
        background: #fff;
      }

      .input-container input.is-invalid,
      .input-container select.is-invalid {
        border-color: #f87171;
        box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.12);
      }

      .password-toggle {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 0.35rem;
        display: grid;
        place-items: center;
      }

      .password-toggle:hover {
        color: #0f172a;
      }

      .terms-checkbox {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        color: #475569;
      }

      .terms-checkbox input {
        width: 1rem;
        height: 1rem;
        margin-top: 0.2rem;
        accent-color: #0ea5e9;
      }

      .terms-checkbox label {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 500;
        color: #0f172a;
      }

      .alert-error,
      .alert-success {
        padding: 0.9rem 1rem;
        border-radius: 1rem;
        font-size: 0.85rem;
        border: 1px solid rgba(248, 113, 113, 0.2);
        background: rgba(248, 113, 113, 0.08);
        color: #b91c1c;
        margin: 0;
      }

      .alert-success {
        border-color: rgba(34, 197, 94, 0.25);
        background: rgba(34, 197, 94, 0.08);
        color: #15803d;
        margin-top: 0.5rem;
      }

      .register-btn {
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

      .register-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 25px 50px rgba(14, 165, 233, 0.4);
      }

      .register-btn:disabled {
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

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }

      @keyframes gridDrift {
        0% { transform: rotate(-5deg) translateY(0); opacity: 0.35; }
        100% { transform: rotate(-5deg) translateY(30px); opacity: 0.2; }
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @media (max-width: 640px) {
        .register-container {
          padding: 1.5rem;
        }
        .register-card {
          padding: 2rem 1.75rem;
        }
      }

      :host-context(.dark-mode) .register-container {
        background: radial-gradient(circle at 30% 20%, #0b2548, #020617 70%);
      }

      :host-context(.dark-mode) .register-card {
        background: rgba(6, 12, 24, 0.92);
        border-color: rgba(148, 163, 184, 0.3);
        box-shadow: 0 25px 80px rgba(2, 6, 23, 0.75);
        color: #e2e8f0;
      }

      :host-context(.dark-mode) .register-card::after {
        border-color: rgba(255, 255, 255, 0.08);
      }

      :host-context(.dark-mode) .logo {
        background: rgba(56, 189, 248, 0.15);
        border-color: rgba(56, 189, 248, 0.3);
        color: #e0f2fe;
      }

      :host-context(.dark-mode) .register-header h1 {
        color: #f8fafc;
      }

      :host-context(.dark-mode) .register-header p {
        color: rgba(226, 232, 240, 0.8);
      }

      :host-context(.dark-mode) label {
        color: #e2e8f0;
      }

      :host-context(.dark-mode) .input-container input,
      :host-context(.dark-mode) .input-container select {
        background: rgba(15, 23, 42, 0.9);
        border-color: rgba(148, 163, 184, 0.35);
        color: #f8fafc;
      }

      :host-context(.dark-mode) .input-container input:focus,
      :host-context(.dark-mode) .input-container select:focus {
        background: rgba(15, 23, 42, 1);
      }

      :host-context(.dark-mode) .input-container input::placeholder {
        color: rgba(226, 232, 240, 0.55);
      }

      :host-context(.dark-mode) .input-icon,
      :host-context(.dark-mode) .password-toggle {
        color: rgba(226, 232, 240, 0.7);
      }

      :host-context(.dark-mode) .terms-checkbox {
        color: rgba(226, 232, 240, 0.8);
      }

      :host-context(.dark-mode) .terms-checkbox label {
        color: rgba(226, 232, 240, 0.9);
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

      :host-context(.dark-mode) .error-message {
        color: #fecdd3;
      }

      :host-context(.dark-mode) .register-footer {
        color: rgba(226, 232, 240, 0.85);
      }

      :host-context(.dark-mode) .register-footer a {
        color: #38bdf8;
      }

      :host-context(.dark-mode) .register-background .grid {
        border-color: rgba(148, 163, 184, 0.18);
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(14, 165, 233, 0.06));
      }

      :host-context(.dark-mode) .register-background .orb {
        opacity: 0.2;
      }

      .error-message {
        color: #b91c1c;
        font-size: 0.8rem;
      }

      .register-footer {
        margin-top: 2rem;
        text-align: center;
        color: #475569;
        font-size: 0.9rem;
      }

      .register-footer p {
        margin: 0;
      }

      .register-footer a {
        color: #0ea5e9;
        font-weight: 600;
        text-decoration: none;
      }

      .register-footer a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup
  loading = false
  submitted = false
  error = ""
  success = ""
  showPassword = false
  showCustomShippingInput = false

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
  this.registerForm = this.formBuilder.group(
    {
      username: ["", [Validators.required, Validators.minLength(3)]],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", Validators.required],
      role: ["", Validators.required],
      shippingCompany: [""],
      customShippingCompany: [""],
      terms: [false, Validators.requiredTrue],
    },
    {
      validator: this.mustMatch("password", "confirmPassword"),
    },
  )
}

  // Getter para acceder fácilmente a los campos del formulario
  get f() {
    return this.registerForm.controls
  }

  onShippingCompanyChange(event: any): void {
    const selectedValue = event.target.value
    this.showCustomShippingInput = selectedValue === "other"

    if (this.showCustomShippingInput) {
      // Agregar validación requerida para el campo personalizado
      this.f["customShippingCompany"].setValidators([Validators.required])
    } else {
      // Remover validación y limpiar el campo personalizado
      this.f["customShippingCompany"].clearValidators()
      this.f["customShippingCompany"].setValue("")
    }
    this.f["customShippingCompany"].updateValueAndValidity()
  }

  // Modificar el método onSubmit para manejar el caso de servidor de prueba
  onSubmit(): void {
    this.submitted = true

    // Detener si el formulario es inválido
    if (this.registerForm.invalid) {
      return
    }

    this.loading = true
    this.error = ""
    this.success = ""

    // Determinar la empresa naviera final
    let finalShippingCompany = this.f["shippingCompany"].value
    if (finalShippingCompany === "other") {
      finalShippingCompany = this.f["customShippingCompany"].value
    }

    // Preparar los datos para el registro
    const registerData = {
      username: this.f["username"].value,
      email: this.f["email"].value,            // 👈 NUEVO
      password: this.f["password"].value,
      roles: [this.f["role"].value],
      shippingCompany: finalShippingCompany || null, // Opcional
    }

    console.log("Sending registration data:", registerData)

    // Verificar si estamos en modo de prueba (sin backend real)
    if (environment.mockBackend) {
      // Simular registro exitoso
      setTimeout(() => {
        this.success = `Usuario "${registerData.username}" registrado con éxito. Ahora puede iniciar sesión.`
        this.loading = false

        // Opcional: redirigir al login después de un tiempo
        setTimeout(() => {
          this.router.navigate(["/login"], {
            queryParams: {
              registered: "true",
              username: registerData.username,
            },
          })
        }, 2000)
      }, 1000)
      return
    }

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log("Usuario registrado con éxito:", response)
        this.success = `Usuario "${registerData.username}" registrado con éxito. Ahora puede iniciar sesión.`
        this.loading = false

        // Opcional: redirigir al login después de un tiempo
        setTimeout(() => {
          this.router.navigate(["/login"], {
            queryParams: {
              registered: "true",
              username: registerData.username,
            },
          })
        }, 2000)
      },
      error: (error) => {
        console.error("Error al registrar usuario:", error)
        this.error = `Error al registrar usuario: ${error.message}`
        this.loading = false
      },
    })
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }

  // Validador personalizado para verificar que las contraseñas coincidan
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName]
      const matchingControl = formGroup.controls[matchingControlName]

      if (matchingControl.errors && !matchingControl.errors["mustMatch"]) {
        // Retornar si otro validador ya ha encontrado un error
        return
      }

      // Establecer error si las contraseñas no coinciden
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true })
      } else {
        matchingControl.setErrors(null)
      }
    }
  }
}
