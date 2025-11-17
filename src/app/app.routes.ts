import type { Routes } from "@angular/router"
import { AuthGuard } from "./guards/auth.guard"

export const routes: Routes = [
  { path: "", redirectTo: "dashboard", pathMatch: "full" },
  {
    path: "login",
    loadComponent: () => import("./components/auth/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "register",
    loadComponent: () => import("./components/auth/register/register.component").then((m) => m.RegisterComponent),
  },
  {
    path: "dashboard",
    loadComponent: () => import("./components/dashboard/dashboard.component").then((m) => m.DashboardComponent),
    canActivate: [AuthGuard],
  },
  {
    path: "shipment-reports",
    loadComponent: () =>
      import("./components/reports/shipment-reports/shipment-reports.component").then(
        (m) => m.ShipmentReportsComponent,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: "route-history",
    loadComponent: () =>
      import("./components/reports/route-history").then((m) => m.RouteHistoryComponent),
    canActivate: [AuthGuard],
  },
  {
    path: "nearby-ports",
    loadComponent: () =>
      import("./components/captain/nearby-ports/nearby-ports.component").then((m) => m.NearbyPortsComponent),
    canActivate: [AuthGuard],
  },
  { path: "**", redirectTo: "dashboard" },
]
