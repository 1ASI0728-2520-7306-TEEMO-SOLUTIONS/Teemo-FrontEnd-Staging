import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing"
import { of } from "rxjs"
import { PortAdminModalComponent } from "./port-admin-modal.component"
import { PortService, type PortAdminRecord } from "../../../services/port.service"

describe("PortAdminModalComponent", () => {
  let component: PortAdminModalComponent
  let fixture: ComponentFixture<PortAdminModalComponent>
  let portService: jasmine.SpyObj<PortService>

  const mockPorts: PortAdminRecord[] = [
    {
      id: "PORT-1",
      name: "Callao",
      continent: "South America",
      coordinates: { latitude: -12.06, longitude: -77.15 },
      disabled: false,
      lastActionBy: "ops@teemo",
      lastActionAt: new Date().toISOString(),
    },
    {
      id: "PORT-2",
      name: "Valparaíso",
      continent: "South America",
      coordinates: { latitude: -33.04, longitude: -71.62 },
      disabled: true,
      lastActionBy: "ops@teemo",
      lastActionAt: new Date().toISOString(),
    },
  ]

  beforeEach(async () => {
    portService = jasmine.createSpyObj("PortService", ["getAdminPorts", "disablePort", "enablePort"])

    await TestBed.configureTestingModule({
      imports: [PortAdminModalComponent],
      providers: [{ provide: PortService, useValue: portService }],
    }).compileComponents()

    fixture = TestBed.createComponent(PortAdminModalComponent)
    component = fixture.componentInstance
  })

  it("renders the ports list and disables a port with reason", fakeAsync(() => {
    portService.getAdminPorts.and.returnValue(of(mockPorts))
    portService.disablePort.and.returnValue(of(void 0))

    component.isOpen = true
    fixture.detectChanges()
    tick()
    fixture.detectChanges()

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="port-row"]')
    expect(rows.length).toBe(2)

    const disableButton: HTMLButtonElement = rows[0].querySelector('[data-testid="disable-button"]')
    disableButton.click()
    fixture.detectChanges()

    const reason: HTMLTextAreaElement = fixture.nativeElement.querySelector('[data-testid="disable-reason"]')
    reason.value = "Mantenimiento programado"
    reason.dispatchEvent(new Event("input"))

    const confirmBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="confirm-disable"]')
    confirmBtn.click()
    tick()

    expect(portService.disablePort).toHaveBeenCalledWith("PORT-1", "Mantenimiento programado")
    expect(portService.getAdminPorts).toHaveBeenCalledTimes(2)
  }))

  it("habilitates a disabled port from the table", fakeAsync(() => {
    portService.getAdminPorts.and.returnValue(of(mockPorts))
    portService.enablePort.and.returnValue(of(void 0))

    component.isOpen = true
    fixture.detectChanges()
    tick()
    fixture.detectChanges()

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="port-row"]')
    const enableButton: HTMLButtonElement = rows[1].querySelector('[data-testid="enable-button"]')
    enableButton.click()
    tick()

    expect(portService.enablePort).toHaveBeenCalledWith("PORT-2")
  }))
})
