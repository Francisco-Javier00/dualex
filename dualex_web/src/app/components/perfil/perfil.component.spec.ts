import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilComponent } from './perfil.component';
import { AuthService } from '../../auth/services/auth.service';
import { AlertService } from '../../services/alert.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';

describe('PerfilComponent', () => {
  let component: PerfilComponent;
  let fixture: ComponentFixture<PerfilComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['cerrarSesion'], {
      perfilUsuario$: of({ nombre: 'Test', rol: 'PROFESOR' })
    });
    alertSpy = jasmine.createSpyObj('AlertService', ['informacion']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: AlertService, useValue: alertSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: locationSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get proper iniciales', () => {
    expect(component.iniciales).toBe('T');
    
    component.perfil = null;
    expect(component.iniciales).toBe('D');
  });

  it('should get proper rolEtiqueta', () => {
    expect(component.rolEtiqueta).toBe('profesor');
    
    component.perfil = null;
    expect(component.rolEtiqueta).toBe('alumno');
  });

  it('should get proper colorPrincipal', () => {
    expect(component.colorPrincipal).toBe('#0f7a4f'); // PROFESOR
    
    component.perfil = { rol: 'COORDINADOR' } as any;
    expect(component.colorPrincipal).toBe('#0b6ba8');
    
    component.perfil = null;
    expect(component.colorPrincipal).toBe('#3b82f6');
  });

  it('should get proper rutaInicio', () => {
    expect(component.rutaInicio).toBe('/dashboard');
    
    component.perfil = { rol: 'ALUMNO' } as any;
    expect(component.rutaInicio).toBe('/tareas');
  });

  it('should call cerrarSesion and navigate', () => {
    component.cerrarSesion();
    
    expect(authSpy.cerrarSesion).toHaveBeenCalled();
    expect(alertSpy.informacion).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should go back on irAtras', () => {
    component.irAtras();
    expect(locationSpy.back).toHaveBeenCalled();
  });
});
