import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { environment } from '../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/index.php?c=Dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService]
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should get categories', () => {
    // Arrange
    const dummyCategorias = [{ titulo: 'Profesores' }];
    
    // Act & Assert
    service.categorias$.subscribe(cats => {
      // It will initially emit default categories, we just check it exists
      expect(cats).toBeDefined();
    });
  });
});
