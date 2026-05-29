import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertsComponent } from './alerts.component';
import { AlertService } from '../../../services/alert.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('AlertsComponent', () => {
  let component: AlertsComponent;
  let fixture: ComponentFixture<AlertsComponent>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;

  beforeEach(async () => {
    // Arrange
    const dummyAlerts = [{ id: '1', tipo: 'success', titulo: 'Exito', mensaje: 'Exito', timeout: 3000 } as any];
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['eliminarAlerta'], {
      alertas$: of(dummyAlerts)
    });

    await TestBed.configureTestingModule({
      imports: [AlertsComponent, NoopAnimationsModule],
      providers: [
        { provide: AlertService, useValue: alertServiceSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  it('should load alerts on init', () => {
    // Act is done in fixture.detectChanges() which calls ngOnInit

    // Assert
    expect(component.alertas.length).toBe(1);
    expect(component.alertas[0].mensaje).toBe('Exito');
  });

  it('should call eliminarAlerta on quitarAlerta', () => {
    // Act
    component.quitarAlerta('1');

    // Assert
    expect(alertServiceSpy.eliminarAlerta).toHaveBeenCalledWith('1');
  });
});
