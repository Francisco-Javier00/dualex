import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('should append token if cookie exists', (done) => {
    // Arrange
    spyOnProperty(document, 'cookie', 'get').and.returnValue('auth_token=mocked_token');
    const req = new HttpRequest('GET', '/test');
    const next: HttpHandlerFn = (req) => {
      expect(req.headers.get('Authorization')).toBe('Bearer mocked_token');
      return of({} as HttpEvent<any>);
    };

    // Act & Assert
    TestBed.runInInjectionContext(() => {
      const result = authInterceptor(req, next) as Observable<any>;
      result.subscribe(() => done());
    });
  });

  it('should not append token if cookie does not exist', (done) => {
    // Arrange
    const req = new HttpRequest('GET', '/test2');
    const next: HttpHandlerFn = (req) => {
      expect(req.headers.has('Authorization')).toBeFalse();
      return of({} as HttpEvent<any>);
    };

    // Act & Assert
    TestBed.runInInjectionContext(() => {
      const result = authInterceptor(req, next) as Observable<any>;
      result.subscribe(() => done());
    });
  });
});
