import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CiclosService } from './ciclos.service';
import { environment } from '../../environments/environment';
import { CicloDTO } from '../dto/dualex.dto';

describe('CiclosService', () => {
  let service: CiclosService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/index.php?c=Ciclos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CiclosService]
    });
    service = TestBed.inject(CiclosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should delete ciclo', () => {
    // Arrange
    const cicloId = 1;

    // Act
    service.deleteCiclo(cicloId).subscribe(res => {
      // Assert
      expect(res).toBeTrue();
    });

    const req = httpMock.expectOne(`${API_URL}&m=eliminar&id=${cicloId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(true);
  });
  
  it('should create ciclo', () => {
    // Arrange
    const dummyCiclo: CicloDTO = { id: 1, nombre: 'Test' } as any;

    // Act
    service.addCiclo(dummyCiclo).subscribe(res => {
      // Assert
      expect(res).toEqual(dummyCiclo);
    });

    const req = httpMock.expectOne(`${API_URL}&m=crear`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dummyCiclo);
    req.flush(dummyCiclo);
  });
});
