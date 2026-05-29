import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../auth/services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { ProfesorDashboardService } from '../../services/profesor-dashboard.service';
import { ProfesoresService } from '../../services/profesores.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let dashboardSpy: jasmine.SpyObj<DashboardService>;
  let profDashboardSpy: jasmine.SpyObj<ProfesorDashboardService>;
  let profesoresSpy: jasmine.SpyObj<ProfesoresService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', [], { perfilUsuario$: of(null) });
    dashboardSpy = jasmine.createSpyObj('DashboardService', [], { categorias$: of([]) });
    profDashboardSpy = jasmine.createSpyObj('ProfesorDashboardService', ['obtenerModulosDelProfesor']);
    profesoresSpy = jasmine.createSpyObj('ProfesoresService', ['getProfesorByEmail']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    profDashboardSpy.obtenerModulosDelProfesor.and.returnValue(of([{ idModulo: 1, nombreModulo: 'DAM' } as any]));
    profesoresSpy.getProfesorByEmail.and.returnValue(of({ ciclos: 'DAM, DAW' } as any));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: DashboardService, useValue: dashboardSpy },
        { provide: ProfesorDashboardService, useValue: profDashboardSpy },
        { provide: ProfesoresService, useValue: profesoresSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(new Map()) } }
      ]
    })
    .compileComponents();
  });

  const setupComponent = () => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create', () => {
    setupComponent();
    expect(component).toBeTruthy();
  });

  it('should redirect to /tareas if ALUMNO', () => {
    Object.defineProperty(authSpy, 'perfilUsuario$', { get: () => of({ rol: 'ALUMNO' }) });
    setupComponent();
    
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tareas']);
  });

  it('should load modulos if PROFESOR', () => {
    Object.defineProperty(authSpy, 'perfilUsuario$', { get: () => of({ rol: 'PROFESOR' }) });
    setupComponent();
    
    expect(profDashboardSpy.obtenerModulosDelProfesor).toHaveBeenCalled();
    expect(component.modulosProfesor.length).toBe(1);
    expect(component.cargandoModulos).toBeFalse();
  });

  it('should handle error when loading modulos for PROFESOR', () => {
    Object.defineProperty(authSpy, 'perfilUsuario$', { get: () => of({ rol: 'PROFESOR' }) });
    profDashboardSpy.obtenerModulosDelProfesor.and.returnValue(throwError(() => new Error('error')));
    setupComponent();
    
    expect(component.cargandoModulos).toBeFalse();
  });

  it('should load profesor info and parse ciclos if COORDINADOR', () => {
    Object.defineProperty(authSpy, 'perfilUsuario$', { get: () => of({ rol: 'COORDINADOR', email: 'test@test.com' }) });
    setupComponent();
    
    expect(profesoresSpy.getProfesorByEmail).toHaveBeenCalledWith('test@test.com');
    // .slice(0,1) gives only the first ciclo
    expect(component.ciclosCoordinados).toEqual(['DAM']); 
  });
  
  it('should handle error when loading profesor info for COORDINADOR', () => {
    Object.defineProperty(authSpy, 'perfilUsuario$', { get: () => of({ rol: 'COORDINADOR', email: 'test@test.com' }) });
    profesoresSpy.getProfesorByEmail.and.returnValue(throwError(() => new Error('error')));
    setupComponent();
    
    expect(component.ciclosCoordinados).toEqual([]);
  });
});
