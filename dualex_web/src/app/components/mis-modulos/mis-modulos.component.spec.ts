import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisModulosComponent } from './mis-modulos.component';
import { AuthService } from '../../auth/services/auth.service';
import { ProfesorDashboardService } from '../../services/profesor-dashboard.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('MisModulosComponent', () => {
  let component: MisModulosComponent;
  let fixture: ComponentFixture<MisModulosComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let dashboardSpy: jasmine.SpyObj<ProfesorDashboardService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', [], {
      perfilUsuario$: of({ email: 'test@test.com' })
    });
    dashboardSpy = jasmine.createSpyObj('ProfesorDashboardService', ['obtenerModulosPorEmail']);
    dashboardSpy.obtenerModulosPorEmail.and.returnValue(of([{ idModulo: 1, nombreModulo: 'DAM' } as any]));

    await TestBed.configureTestingModule({
      imports: [MisModulosComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ProfesorDashboardService, useValue: dashboardSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    })
    .compileComponents();
  });

  const setupComponent = (perfil: any = { email: 'test@test.com' }) => {
    Object.defineProperty(authSpy, 'perfilUsuario$', { get: () => of(perfil) });
    fixture = TestBed.createComponent(MisModulosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create and load modules', () => {
    setupComponent();
    expect(component).toBeTruthy();
    expect(dashboardSpy.obtenerModulosPorEmail).toHaveBeenCalledWith('test@test.com');
    expect(component.modulos.length).toBe(1);
    expect(component.cargando).toBeFalse();
  });

  it('should not load modules if no email', () => {
    setupComponent({ email: null });
    expect(dashboardSpy.obtenerModulosPorEmail).not.toHaveBeenCalled();
    expect(component.modulos.length).toBe(0);
  });

  it('should handle error when loading modules', () => {
    dashboardSpy.obtenerModulosPorEmail.and.returnValue(throwError(() => new Error('error')));
    setupComponent();
    expect(component.modulos.length).toBe(0);
    expect(component.cargando).toBeFalse();
  });
});
