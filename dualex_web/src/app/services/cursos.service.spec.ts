import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CursosService } from './cursos.service';
import { environment } from '../../environments/environment';

describe('CursosService', () => {
  let service: CursosService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/index.php?c=Cursos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CursosService]
    });
    service = TestBed.inject(CursosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should get cursos', () => {
    // Arrange
    const dummyCursos: any[] = [{ id: 1, nombre: 'Test' }];

    // Act
    service.getCursos().subscribe(res => {
      // Assert
      expect(res.length).toBe(1);
      expect(res).toEqual(dummyCursos);
    });

    const req = httpMock.expectOne(`${API_URL}&m=listar`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyCursos);
  });
});
