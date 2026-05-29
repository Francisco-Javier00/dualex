import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProfesorDashboardService } from './profesor-dashboard.service';
import { environment } from '../../environments/environment';

describe('ProfesorDashboardService', () => {
  let service: ProfesorDashboardService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/index.php?c=Modulos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfesorDashboardService]
    });
    service = TestBed.inject(ProfesorDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should get modulos', () => {
    // Arrange
    const dummyModulos: any[] = [{ id: 1 }];

    // Act
    service.obtenerModulosDelProfesor().subscribe(res => {
      // Assert
      expect(res).toEqual(dummyModulos);
    });

    const req = httpMock.expectOne(`${API_URL}&m=listarProfesor`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyModulos);
  });
});
