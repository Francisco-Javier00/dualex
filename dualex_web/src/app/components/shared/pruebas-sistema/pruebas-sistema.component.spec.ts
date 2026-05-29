import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PruebasSistemaComponent } from './pruebas-sistema.component';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

describe('PruebasSistemaComponent', () => {
  let component: PruebasSistemaComponent;
  let fixture: ComponentFixture<PruebasSistemaComponent>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let originalEnv: boolean;

  beforeEach(async () => {
    // Arrange
    originalEnv = environment.production;
    environment.production = true; // Evitar recargas reales de ventana en ngInit

    alertServiceSpy = jasmine.createSpyObj('AlertService', ['exito', 'error', 'informacion']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCookieNativa', 'decodificarJwt', 'setCookieNativa']);

    await TestBed.configureTestingModule({
      imports: [PruebasSistemaComponent],
      providers: [
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PruebasSistemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    environment.production = originalEnv;
  });

  it('should create', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  it('should toggle panel', () => {
    // Arrange
    expect(component.abierto).toBeFalse();

    // Act
    component.togglePanel();

    // Assert
    expect(component.abierto).toBeTrue();
  });

  it('should trigger success alert', () => {
    // Act
    component.probarAlerta('success');

    // Assert
    expect(alertServiceSpy.exito).toHaveBeenCalledWith('Éxito', 'Operación completada correctamente');
  });

  it('should trigger danger alert', () => {
    // Act
    component.probarAlerta('danger');

    // Assert
    expect(alertServiceSpy.error).toHaveBeenCalledWith('Error', 'Ha ocurrido un error inesperado');
  });

  it('should trigger info alert', () => {
    // Act
    component.probarAlerta('info');

    // Assert
    expect(alertServiceSpy.informacion).toHaveBeenCalledWith('Información', 'Este es un mensaje informativo');
  });
});
