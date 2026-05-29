import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TareasService } from './tareas.service';
import { environment } from '../../environments/environment';

describe('TareasService', () => {
  let service: TareasService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/index.php?c=Tareas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TareasService]
    });
    service = TestBed.inject(TareasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should get tareas', () => {
    // Arrange
    const dummyTareas: any[] = [{ id: 1, descripcion: 'Test' }];

    // Act
    service.getTareas().subscribe(res => {
      // Assert
      expect(res.length).toBe(1);
      expect(res).toEqual(dummyTareas);
    });

    const req = httpMock.expectOne(`${API_URL}&m=listar`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyTareas);
  });
});
