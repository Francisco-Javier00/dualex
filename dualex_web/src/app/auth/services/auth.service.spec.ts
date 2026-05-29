import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should decode JWT correctly', () => {
    // Arrange
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadObj = { data: { id: 1, roles: ['ALUMNO_DUALEX'] } };
    const payload = btoa(JSON.stringify(payloadObj));
    const token = `${header}.${payload}.signature`;

    // Act
    const decoded = service.decodificarJwt(token);

    // Assert
    expect(decoded?.data.id).toBe(1);
  });

  it('should force a test profile', () => {
    // Arrange
    const mockProfile = { id: 1, nombre: 'Test', apellidos: 'User', email: 'test@test.com', rol: 'ALUMNO', esGeneral: false };

    // Act
    service.forzarPerfilPrueba(mockProfile);

    // Assert
    expect(service.currentUserValue).toEqual(mockProfile);
  });
  
  it('should set esGeneral correctly', () => {
    // Arrange
    const mockProfile = { id: 1, nombre: 'Test', apellidos: 'User', email: 'test@test.com', rol: 'ALUMNO', esGeneral: false };
    service.forzarPerfilPrueba(mockProfile);

    // Act
    service.setEsGeneral(true);

    // Assert
    expect(service.currentUserValue?.esGeneral).toBeTrue();
  });
});
