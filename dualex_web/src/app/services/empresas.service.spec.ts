import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmpresasService } from './empresas.service';
import { environment } from '../../environments/environment';

describe('EmpresasService', () => {
  let service: EmpresasService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/index.php?c=Empresas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EmpresasService]
    });
    service = TestBed.inject(EmpresasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should get empresas', () => {
    // Arrange
    const dummyEmpresas: any[] = [{ id: 1, nombre: 'Test' }];

    // Act
    service.getEmpresas().subscribe(res => {
      // Assert
      expect(res.length).toBe(1);
      expect(res).toEqual(dummyEmpresas);
    });

    const req = httpMock.expectOne(`${API_URL}&m=listar`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyEmpresas);
  });
});
