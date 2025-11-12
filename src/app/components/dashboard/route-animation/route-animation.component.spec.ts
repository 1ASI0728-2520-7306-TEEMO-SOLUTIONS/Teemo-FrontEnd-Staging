import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing"
import { of } from "rxjs"
import { RouteAnimationComponent } from "./route-animation.component"
import { PortService, type PortAdminRecord } from "../../../services/port.service"
import { RouteService, type RouteCalculationResource } from "../../../services/route.service"

describe("RouteAnimationComponent", () => {
  let component: RouteAnimationComponent
  let fixture: ComponentFixture<RouteAnimationComponent>
  let portService: jasmine.SpyObj<PortService>
  let routeService: jasmine.SpyObj<RouteService>

  const baseRouteData: RouteCalculationResource = {
    optimalRoute: ["Puerto A", "Puerto B"],
    totalDistance: 1200,
    warnings: [],
    coordinatesMapping: {
      "Puerto A": { latitude: 10, longitude: 20 },
      "Puerto B": { latitude: 15, longitude: 25 },
    },
    metadata: {
      portIds: ["PORT-1", "PORT-2"],
    },
  }

  const adminPorts: PortAdminRecord[] = [
    {
      id: "PORT-1",
      name: "Puerto A",
      continent: "South America",
      coordinates: { latitude: 10, longitude: 20 },
      disabled: true,
    },
    {
      id: "PORT-2",
      name: "Puerto B",
      continent: "South America",
      coordinates: { latitude: 15, longitude: 25 },
      disabled: false,
    },
  ]

  beforeEach(async () => {
    portService = jasmine.createSpyObj("PortService", ["getAdminPorts"])
    routeService = jasmine.createSpyObj("RouteService", ["recalculateRoute"])

    await TestBed.configureTestingModule({
      imports: [RouteAnimationComponent],
      providers: [
        { provide: PortService, useValue: portService },
        { provide: RouteService, useValue: routeService },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(RouteAnimationComponent)
    component = fixture.componentInstance

    spyOn(component as any, "initializeMap").and.callFake(() => {})
    spyOn(component as any, "loadGeoJSON").and.callFake(() => Promise.resolve())
  })

  it("triggers recalculation when a disabled port is detected", fakeAsync(() => {
    portService.getAdminPorts.and.returnValue(of(adminPorts))
    routeService.recalculateRoute.and.returnValue(
      of({
        ...baseRouteData,
        warnings: ["Ruta recalculada"],
        metadata: { ...baseRouteData.metadata, recalculated: true },
      }),
    )

    component.routeId = "route-123"
    component.routeData = baseRouteData

    fixture.detectChanges()
    tick()
    fixture.detectChanges()

    expect(portService.getAdminPorts).toHaveBeenCalled()
    expect(routeService.recalculateRoute).toHaveBeenCalledWith("route-123", { avoidedPortIds: ["PORT-1"] })
    expect(component.disabledPortsInRoute).toEqual(["Puerto A"])
    expect(component.recalculationInfoVisible).toBeTrue()

    const infoBanner: HTMLElement = fixture.nativeElement.querySelector('[data-testid="recalc-info"]')
    expect(infoBanner.textContent).toContain("Puerto A")
  }))
})
