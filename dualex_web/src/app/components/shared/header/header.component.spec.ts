import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { of } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // Arrange
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['cerrarSesion'], {
      perfilUsuario$: of({ rol: 'ALUMNO', nombre: 'Test', apellidos: 'Alumno', email: 'test@test.com' })
    });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  it('should get navigation links for ALUMNO', () => {
    // Act
    const links = component.obtenerEnlacesNavegacion('ALUMNO');

    // Assert
    expect(links.length).toBe(3);
    expect(links[0].ruta).toBe('/tareas');
  });

  it('should get navigation links for other roles', () => {
    // Act
    const links = component.obtenerEnlacesNavegacion('COORDINADOR');

    // Assert
    expect(links.length).toBe(3);
    expect(links[0].ruta).toBe('/dashboard');
  });

  it('should call cerrarSesion and navigate to root', () => {
    // Act
    component.cerrarSesion();

    // Assert
    expect(authServiceSpy.cerrarSesion).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should navigate to profile on irAPerfil', () => {
    // Act
    component.irAPerfil();

    // Assert
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/perfil']);
  });

  it('should navigate to root if no user on irAInicio', () => {
    // Arrange
    Object.defineProperty(authServiceSpy, 'perfilUsuario$', { get: () => of(null) });
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Act
    component.irAInicio();

    // Assert
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should navigate to tareas if user is ALUMNO on irAInicio', () => {
    // Act
    component.irAInicio();

    // Assert
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tareas']);
  });

  it('should navigate to dashboard if user is not ALUMNO on irAInicio', () => {
    // Arrange
    Object.defineProperty(authServiceSpy, 'perfilUsuario$', { get: () => of({ rol: 'PROFESOR' }) });
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Act
    component.irAInicio();

    // Assert
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to about on abrirAbout', () => {
    // Act
    component.abrirAbout();

    // Assert
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/acerca-de']);
  });
});
