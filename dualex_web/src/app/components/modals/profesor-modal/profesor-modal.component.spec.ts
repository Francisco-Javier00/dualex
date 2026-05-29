import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProfesorModalComponent } from './profesor-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CiclosService } from '../../../services/ciclos.service';
import { ModulosService } from '../../../services/modulos.service';
import { Renderer2 } from '@angular/core';
import { of } from 'rxjs';

describe('ProfesorModalComponent', () => {
  let component: ProfesorModalComponent;
  let fixture: ComponentFixture<ProfesorModalComponent>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let ciclosSpy: jasmine.SpyObj<CiclosService>;
  let modulosSpy: jasmine.SpyObj<ModulosService>;
  let rendererSpy: jasmine.SpyObj<Renderer2>;

  beforeEach(async () => {
    alertSpy = jasmine.createSpyObj('AlertService', ['advertencia']);
    authSpy = jasmine.createSpyObj('AuthService', [], {
      perfilUsuario$: of({ esGeneral: true })
    });
    // @ts-ignore (mocking getter for tests)
    Object.defineProperty(authSpy, 'currentUserValue', { get: () => ({ esGeneral: true }) });
    
    ciclosSpy = jasmine.createSpyObj('CiclosService', ['getCiclos']);
    modulosSpy = jasmine.createSpyObj('ModulosService', ['getModulosPorCiclo']);
    rendererSpy = jasmine.createSpyObj('Renderer2', ['addClass', 'removeClass']);

    ciclosSpy.getCiclos.and.returnValue(of([{ id: 1, nombre: 'DAM', siglas: 'DAM' }]));
    modulosSpy.getModulosPorCiclo.and.returnValue(of([{ id: 10, nombre: 'Programacion', siglas: 'PRG', ciclo: 'DAM' }]));

    await TestBed.configureTestingModule({
      imports: [ProfesorModalComponent, ReactiveFormsModule],
      providers: [
        { provide: AlertService, useValue: alertSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: CiclosService, useValue: ciclosSpy },
        { provide: ModulosService, useValue: modulosSpy },
        { provide: Renderer2, useValue: rendererSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfesorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', fakeAsync(() => {
    component.ngOnInit();
    tick();
    
    expect(ciclosSpy.getCiclos).toHaveBeenCalled();
    expect(modulosSpy.getModulosPorCiclo).toHaveBeenCalledWith('DAM');
    expect(component.ciclosBD.length).toBe(1);
    expect(component.modulosBD.length).toBe(1);
  }));

  it('should handle rol change to COORDINADOR', () => {
    component.onRolChange('COORDINADOR');
    expect(component.profesorForm.value.rol).toBe('COORDINADOR');
    expect(component.nuevoProfesor.rol).toBe('COORDINADOR');
  });

  it('should handle rol change to PROFESOR', () => {
    component.nuevoProfesor.ciclos = ['DAM'];
    component.onRolChange('PROFESOR');
    
    expect(component.profesorForm.value.rol).toBe('PROFESOR');
    expect(component.nuevoProfesor.ciclos.length).toBe(0); // Debe vaciar ciclos
  });

  it('should emit guardar on valid form', () => {
    spyOn(component.guardar, 'emit');
    component.profesorForm.patchValue({
      nombre: 'Test',
      apellidos: 'Profesor',
      correo: 'test@test.com',
      rol: 'PROFESOR'
    });
    
    component.onGuardar();
    
    expect(component.guardar.emit).toHaveBeenCalled();
  });

  it('should alert on invalid form', () => {
    component.profesorForm.reset();
    component.onGuardar();
    
    expect(alertSpy.advertencia).toHaveBeenCalled();
  });
});
