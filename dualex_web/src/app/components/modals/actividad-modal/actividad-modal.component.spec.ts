import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActividadModalComponent, arrayNotEmptyValidator } from './actividad-modal.component';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';
import { CiclosService } from '../../../services/ciclos.service';
import { ModulosService } from '../../../services/modulos.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ProfesoresService } from '../../../services/profesores.service';
import { of, throwError } from 'rxjs';
import { Renderer2 } from '@angular/core';

describe('ActividadModalComponent', () => {
  let component: ActividadModalComponent;
  let fixture: ComponentFixture<ActividadModalComponent>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let ciclosSpy: jasmine.SpyObj<CiclosService>;
  let modulosSpy: jasmine.SpyObj<ModulosService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let profesSpy: jasmine.SpyObj<ProfesoresService>;
  let rendererSpy: jasmine.SpyObj<Renderer2>;

  beforeEach(async () => {
    // Arrange
    alertSpy = jasmine.createSpyObj('AlertService', ['error', 'advertencia']);
    ciclosSpy = jasmine.createSpyObj('CiclosService', ['getCiclos']);
    modulosSpy = jasmine.createSpyObj('ModulosService', ['getModulos']);
    authSpy = jasmine.createSpyObj('AuthService', [], { currentUserValue: { rol: 'COORDINADOR', email: 'test@test.com' } });
    profesSpy = jasmine.createSpyObj('ProfesoresService', ['getProfesorByEmail']);
    rendererSpy = jasmine.createSpyObj('Renderer2', ['addClass', 'removeClass']);

    ciclosSpy.getCiclos.and.returnValue(of([{ id: 1, nombre: 'DAM', siglas: 'DAM' }]));
    modulosSpy.getModulos.and.returnValue(of([{ id: 10, nombre: 'Programacion', ciclo: 'DAM' }]));
    profesSpy.getProfesorByEmail.and.returnValue(of({ ciclos: 'DAM' }));

    await TestBed.configureTestingModule({
      imports: [ActividadModalComponent, ReactiveFormsModule],
      providers: [
        { provide: AlertService, useValue: alertSpy },
        { provide: CiclosService, useValue: ciclosSpy },
        { provide: ModulosService, useValue: modulosSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ProfesoresService, useValue: profesSpy },
        { provide: Renderer2, useValue: rendererSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActividadModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  describe('Validators', () => {
    it('arrayNotEmptyValidator should return error if empty', () => {
      // Arrange
      const control = new FormControl([]);
      const validator = arrayNotEmptyValidator();
      // Act
      const result = validator(control);
      // Assert
      expect(result).toEqual({ arrayEmpty: true });
    });

    it('arrayNotEmptyValidator should return null if not empty', () => {
      // Arrange
      const control = new FormControl([1, 2]);
      const validator = arrayNotEmptyValidator();
      // Act
      const result = validator(control);
      // Assert
      expect(result).toBeNull();
    });
  });

  it('should load arbol on init for COORDINADOR', fakeAsync(() => {
    // Act
    component.ngOnInit();
    tick();

    // Assert
    expect(ciclosSpy.getCiclos).toHaveBeenCalled();
    expect(component.arbolCiclos.length).toBe(1);
    expect(component.arbolCiclos[0].siglas).toBe('DAM');
    expect(component.arbolCiclos[0].modulos.length).toBe(1);
  }));

  it('should emit and close on valid submit', () => {
    // Arrange
    spyOn(component.guardarEvent, 'emit');
    spyOn(component.visibleChange, 'emit');
    component.actividadForm.patchValue({
      titulo: 'Test titulo',
      descripcion: 'Test descripcion',
      idModulos: [10]
    });

    // Act
    component.onSubmit();

    // Assert
    expect(component.guardarEvent.emit).toHaveBeenCalled();
    expect(component.visible).toBeFalse();
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
  });

  it('should show alert on invalid submit with empty array', () => {
    // Arrange
    component.actividadForm.patchValue({
      titulo: 'Test titulo',
      descripcion: 'Test descripcion',
      idModulos: []
    });

    // Act
    component.onSubmit();

    // Assert
    expect(alertSpy.advertencia).toHaveBeenCalledWith('Falta Asignatura', jasmine.any(String));
  });

  it('should handle toggleModuloSelection', () => {
    // Arrange
    component.actividadForm.patchValue({ idModulos: [10] });

    // Act 1: Deselect
    component.toggleModuloSelection(10);
    // Assert 1
    expect(component.actividadForm.value.idModulos).toEqual([]);

    // Act 2: Select
    component.toggleModuloSelection(20);
    // Assert 2
    expect(component.actividadForm.value.idModulos).toEqual([20]);
  });

  it('should toggle scroll on visible change', () => {
    // Act 1
    component.ngOnChanges({ visible: { currentValue: true, previousValue: false, firstChange: true, isFirstChange: () => true } });
    // Assert 1
    expect(rendererSpy.addClass).toHaveBeenCalled();

    // Act 2
    component.cerrar();
    // Assert 2
    expect(rendererSpy.removeClass).toHaveBeenCalled();
  });
});
