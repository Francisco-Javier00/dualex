import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConfiguracionService } from './configuracion.service';
import { environment } from '../../environments/environment';
import { ConfiguracionDTO } from '../dto/dualex.dto';

describe('ConfiguracionService', () => {
  let service: ConfiguracionService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/index.php`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfiguracionService]
    });
    service = TestBed.inject(ConfiguracionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should get configuration', () => {
    // Arrange
    const dummyConfig: ConfiguracionDTO = { curso_actual: 1 } as any;

    // Act
    service.getConfiguracion().subscribe(config => {
      // Assert
      expect(config).toEqual(dummyConfig);
    });

    const req = httpMock.expectOne(`${API_URL}?c=Configuracion&m=obtenerConfiguracion`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyConfig);
  });

  it('should check if it is general', () => {
    // Arrange
    const dummyResponse = { esGeneral: true };

    // Act
    service.esGeneral().subscribe(res => {
      // Assert
      expect(res.esGeneral).toBeTrue();
    });

    const req = httpMock.expectOne(`${API_URL}?c=Configuracion&m=esGeneral`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyResponse);
  });

  it('should update configuration', () => {
    // Arrange
    const configUpdate: ConfiguracionDTO = { curso_actual: 2 } as any;

    // Act
    service.updateConfiguracion(configUpdate).subscribe(res => {
      // Assert
      expect(res).toBeDefined();
    });

    const req = httpMock.expectOne(`${API_URL}?c=Configuracion&m=actualizarConfiguracion`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(configUpdate);
    req.flush({});
  });
});
