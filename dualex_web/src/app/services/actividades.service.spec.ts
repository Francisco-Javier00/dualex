import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActividadesService } from './actividades.service';
import { environment } from '../../environments/environment';
import { ActividadDTO } from '../dto/dualex.dto';

describe('ActividadesService', () => {
  let service: ActividadesService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/index.php?c=Actividades`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ActividadesService]
    });
    service = TestBed.inject(ActividadesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should get actividades', () => {
    // Arrange
    const dummyActividades: ActividadDTO[] = [{ id: 1, descripcion: 'Test' } as any];

    // Act
    service.getActividades().subscribe(res => {
      // Assert
      expect(res.length).toBe(1);
      expect(res).toEqual(dummyActividades);
    });

    const req = httpMock.expectOne(`${API_URL}&m=listar`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyActividades);
  });

  it('should create actividad', () => {
    // Arrange
    const newActividad: ActividadDTO = { descripcion: 'New' } as any;

    // Act
    service.createActividad(newActividad).subscribe(res => {
      // Assert
      expect(res).toBeDefined();
    });

    const req = httpMock.expectOne(`${API_URL}&m=crear`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newActividad);
    req.flush({});
  });
});
