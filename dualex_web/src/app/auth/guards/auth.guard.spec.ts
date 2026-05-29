import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: null
    });
    routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    // Fuerza modo desarrollador globalmente para los tests de este archivo para evitar redirecciones enteras
    environment.developerMode = true;
  });

  it('should allow access if user is authenticated and no specific roles are required', () => {
    // Arrange
    const mockUser = { id: 1, rol: 'ALUMNO', nombre: 'Test', apellidos: 'Test', email: 't@t.com', esGeneral: false };
    Object.defineProperty(authServiceSpy, 'currentUserValue', { get: () => mockUser });
    const route = { data: {} } as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    // Assert
    expect(result).toBeTrue();
  });

  it('should redirect if user is authenticated but does not have required role', () => {
    // Arrange
    const originalEnv = environment.developerMode;
    environment.developerMode = true;

    const mockUser = { id: 1, rol: 'ALUMNO', nombre: 'Test', apellidos: 'Test', email: 't@t.com', esGeneral: false };
    Object.defineProperty(authServiceSpy, 'currentUserValue', { get: () => mockUser });
    routerSpy.parseUrl.and.returnValue('mockUrlTree' as any);
    
    const route = { data: { roles: ['PROFESOR'] } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    // Assert
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/dashboard');
    expect(result).toBe('mockUrlTree' as any);
    
    environment.developerMode = originalEnv;
  });

  it('should deny access if not authenticated', () => {
    // Arrange
    const originalEnv = environment.developerMode;
    environment.developerMode = true;

    Object.defineProperty(authServiceSpy, 'currentUserValue', { get: () => null });
    const route = { data: {} } as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    // Assert
    expect(result).toBeFalse();
    
    environment.developerMode = originalEnv;
  });
});
