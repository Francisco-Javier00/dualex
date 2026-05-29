import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AlumnoModalComponent } from './alumno-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';
import { CursosService } from '../../../services/cursos.service';
import { EmpresasService } from '../../../services/empresas.service';
import { of } from 'rxjs';
import { Renderer2 } from '@angular/core';

describe('AlumnoModalComponent', () => {
  let component: AlumnoModalComponent;
  let fixture: ComponentFixture<AlumnoModalComponent>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let cursosSpy: jasmine.SpyObj<CursosService>;
  let empresasSpy: jasmine.SpyObj<EmpresasService>;

  beforeEach(async () => {
    alertSpy = jasmine.createSpyObj('AlertService', ['advertencia']);
    cursosSpy = jasmine.createSpyObj('CursosService', ['getCursos']);
    empresasSpy = jasmine.createSpyObj('EmpresasService', ['getEmpresas']);

    cursosSpy.getCursos.and.returnValue(of([{ id: 1, ciclo: 'DAM' } as any]));
    empresasSpy.getEmpresas.and.returnValue(of([{ id: 10, nombre: 'Empresa', ciclosInfo: [{ siglas: 'DAM' }] } as any]));

    await TestBed.configureTestingModule({
      imports: [AlumnoModalComponent, ReactiveFormsModule],
      providers: [
        { provide: AlertService, useValue: alertSpy },
        { provide: CursosService, useValue: cursosSpy },
        { provide: EmpresasService, useValue: empresasSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlumnoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    expect(cursosSpy.getCursos).toHaveBeenCalled();
    expect(empresasSpy.getEmpresas).toHaveBeenCalled();
    expect(component.todosLosCursos.length).toBe(1);
    expect(component.todasLasEmpresas.length).toBe(1);
  });

  it('should validate valid DNI', () => {
    const control = component.alumnoForm.get('dni');
    control?.setValue('12345678Z');
    expect(control?.errors).toBeNull();
  });

  it('should invalidate incorrect DNI format', () => {
    const control = component.alumnoForm.get('dni');
    control?.setValue('123');
    expect(control?.errors).toEqual({ dniFormato: true });
  });

  it('should invalidate incorrect DNI letter', () => {
    const control = component.alumnoForm.get('dni');
    control?.setValue('12345678A');
    expect(control?.errors).toEqual({ letraInvalida: true });
  });

  it('should filter courses based on coordinados array', () => {
    component.cursosCoordinados = [1];
    component.aplicarFiltroCursos();
    expect(component.cursos.length).toBe(1);

    component.cursosCoordinados = [2];
    component.aplicarFiltroCursos();
    expect(component.cursos.length).toBe(0);
  });

  it('should filter companies based on ciclos coordinados', () => {
    component.ciclosCoordinados = ['DAM'];
    component.aplicarFiltroEmpresas();
    expect(component.empresas.length).toBe(1);

    component.ciclosCoordinados = ['DAW'];
    component.aplicarFiltroEmpresas();
    expect(component.empresas.length).toBe(0);
  });

  it('should emit guardar if valid', () => {
    spyOn(component.guardar, 'emit');
    component.alumnoForm.patchValue({
      nombre: 'Test',
      apellidos: 'Alumno',
      email: 'test@test.com',
      dni: '12345678Z',
      nia: '1234',
      telefono: '666555444',
      repetidor: false,
      idCurso: 1
    });

    component.onGuardar();
    expect(component.guardar.emit).toHaveBeenCalled();
  });

  it('should alert if invalid on save', () => {
    component.alumnoForm.reset();
    component.onGuardar();
    expect(alertSpy.advertencia).toHaveBeenCalled();
  });

  it('should toggle body scroll on visible change', () => {
    const addSpy = spyOn((component as any).renderer, 'addClass');
    component.visible = true;
    component.ngOnChanges({ visible: { currentValue: true, previousValue: false, firstChange: true, isFirstChange: () => true } });
    expect(addSpy).toHaveBeenCalled();
  });
});
