import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProfesoresService } from './profesores.service';
import { environment } from '../../environments/environment';

describe('ProfesoresService', () => {
  let service: ProfesoresService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/index.php?c=Profesores`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfesoresService]
    });
    service = TestBed.inject(ProfesoresService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should get profesor by email', () => {
    // Arrange
    const dummyProfesor: any = { id: 1, correo: 'test@test.com' };

    // Act
    service.getProfesorByEmail('test@test.com').subscribe(res => {
      // Assert
      expect(res).toEqual(dummyProfesor);
    });

    const req = httpMock.expectOne(`${API_URL}&m=obtener&correo=test@test.com`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyProfesor);
  });
});
