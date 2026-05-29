import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AlumnosService } from './alumnos.service';
import { environment } from '../../environments/environment';
import { AlumnoDTO } from '../dto/dualex.dto';

describe('AlumnosService', () => {
  let service: AlumnosService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/index.php?c=Alumnos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AlumnosService]
    });
    service = TestBed.inject(AlumnosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should get alumnos', () => {
    // Arrange
    const dummyAlumnos: AlumnoDTO[] = [{ id: 1, nombre: 'Test' } as any];

    // Act
    service.getAlumnos().subscribe(res => {
      // Assert
      expect(res.length).toBe(1);
      expect(res).toEqual(dummyAlumnos);
    });

    const req = httpMock.expectOne(`${API_URL}&m=listar`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyAlumnos);
  });

  it('should get alumnos by modulo', () => {
    // Arrange
    const dummyAlumnos: AlumnoDTO[] = [{ id: 1, nombre: 'Test' } as any];

    // Act
    service.getAlumnosByModulo(10).subscribe(res => {
      // Assert
      expect(res).toEqual(dummyAlumnos);
    });

    const req = httpMock.expectOne(`${API_URL}&m=listarPorModulo&idModulo=10`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyAlumnos);
  });
  
  it('should update alumno', () => {
    // Arrange
    const dummyAlumno: AlumnoDTO = { id: 1, nombre: 'Test' } as any;

    // Act
    service.updateAlumno(dummyAlumno).subscribe(res => {
      // Assert
      expect(res).toEqual(dummyAlumno);
    });

    const req = httpMock.expectOne(`${API_URL}&m=actualizar&id=1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dummyAlumno);
    req.flush(dummyAlumno);
  });
});
