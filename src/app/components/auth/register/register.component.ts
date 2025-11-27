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
              <span *ngIf="f['email'].errors['email']">El nombre de usuario es requerido</span>
              <span *ngIf="f['email'].errors['email']">El nombre de usuario debe tener al menos 3 caracteres</span>
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
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f8fafc;
        padding: 1rem;
      }

      .register-card {
        width: 100%;
        max-width: 450px;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }

      .register-header {
        padding: 2rem 2rem 1rem;
        text-align: center;
      }

      .logo {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
      }

      .logo-icon {
        color: #0a6cbc;
      }

      .logo-text {
        font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        font-weight: 700;
        font-size: 1.25rem;
        color: #0f172a;
        margin-left: 0.5rem;
      }

      .register-header h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        color: #0f172a;
      }

      .register-header p {
        margin: 0;
        color: #64748b;
        font-size: 0.875rem;
      }

      .register-form {
        padding: 1.5rem 2rem;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
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

      input[type="text"],
      input[type="password"],
      select {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        transition: all 150ms ease;

        &:focus {
          outline: none;
          border-color: #0a6cbc;
          box-shadow: 0 0 0 2px rgba(10, 108, 188, 0.1);
        }

        &.is-invalid {
          border-color: #ef4444;
        }
      }

      .password-toggle {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 0;

        &:hover {
          color: #0f172a;
        }
      }

      .terms-checkbox {
        display: flex;
        align-items: center;

        input[type="checkbox"] {
          margin-right: 0.5rem;
        }

        label {
          margin-bottom: 0;
          color: #64748b;
        }
      }

      .alert-error {
        padding: 0.75rem 1rem;
        background-color: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border-radius: 0.375rem;
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
      }

      .alert-success {
        padding: 0.75rem 1rem;
        background-color: rgba(34, 197, 94, 0.1);
        color: #22c55e;
        border-radius: 0.375rem;
        margin-top: 1rem;
        font-size: 0.875rem;
      }

      .register-btn {
        width: 100%;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 150ms ease;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 2.75rem;
        background-color: #0a6cbc;
        color: white;

        &:hover {
          background-color: #084e88;
        }

        &:disabled {
          background-color: #6b9ecf;
          cursor: not-allowed;
        }
      }

      .spinner {
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .error-message {
        color: #ef4444;
        font-size: 0.75rem;
        margin-top: 0.25rem;
      }

      .register-footer {
        padding: 1.5rem 2rem;
        border-top: 1px solid #e2e8f0;
        background-color: #f8fafc;
        text-align: center;

        p {
          margin: 0;
          font-size: 0.875rem;
          color: #64748b;
        }

        a {
          color: #0a6cbc;
          text-decoration: none;
          font-weight: 500;

          &:hover {
            text-decoration: underline;
          }
        }
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
