import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AboutComponent } from './about.component';
import { AuthService } from '../../auth/services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', [], { perfilUsuario$: of(null) });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('activarManuales should show manuals after 15 clicks', () => {
    expect(component.mostrarManuales).toBeFalse();
    
    for (let i = 0; i < 14; i++) {
      component.activarManuales();
    }
    expect(component.mostrarManuales).toBeFalse();
    
    component.activarManuales();
    expect(component.mostrarManuales).toBeTrue();
  });

  it('irAInicio should navigate to /tareas if ALUMNO', () => {
    Object.defineProperty(authSpy, 'perfilUsuario$', { get: () => of({ rol: 'ALUMNO' }) });
    component.irAInicio();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tareas']);
  });

  it('irAInicio should navigate to /dashboard if not ALUMNO', () => {
    Object.defineProperty(authSpy, 'perfilUsuario$', { get: () => of({ rol: 'PROFESOR' }) });
    component.irAInicio();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('irAInicio should navigate to / if no user', () => {
    Object.defineProperty(authSpy, 'perfilUsuario$', { get: () => of(null) });
    component.irAInicio();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });
});
