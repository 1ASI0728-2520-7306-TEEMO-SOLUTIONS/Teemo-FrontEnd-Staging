import { Component, OnInit } from "@angular/core"
import { ActivatedRoute, Router } from "@angular/router"
import  { AuthService } from "../../../services/auth.service"
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-confirm-registration",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./confirm-registration.component.html",
  styleUrls: ["./confirm-registration.component.css"],
})
export class ConfirmRegistrationComponent implements OnInit {
  token: string | null = null
  isProcessing = false
  isError = false
  message = ""

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Leer el token de los query params: ?token=...
    this.route.queryParamMap.subscribe((params) => {
      this.token = params.get("token")

      if (!this.token) {
        this.isError = true
        this.message = "Token de confirmación no encontrado en el enlace."
      }
    })
  }

  onConfirm(): void {
    if (!this.token || this.isProcessing) return

    this.isProcessing = true
    this.isError = false
    this.message = ""

    this.authService.confirmRegistration(this.token).subscribe({
      next: () => {
        this.isProcessing = false
        this.message = "Tu cuenta ha sido confirmada correctamente. Ya puedes iniciar sesión."
        // Opcional: redirigir al login después de unos segundos
        setTimeout(() => {
          this.router.navigate(["/login"])
        }, 2500)
      },
      error: (err) => {
        this.isProcessing = false
        this.isError = true
        this.message = err.message || "Ocurrió un error al confirmar tu cuenta."
      },
    })
  }
}
