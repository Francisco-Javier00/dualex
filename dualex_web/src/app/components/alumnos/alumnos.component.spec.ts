import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AlumnosComponent } from './alumnos.component';
import { AlumnosService } from '../../services/alumnos.service';
import { ModulosService } from '../../services/modulos.service';
import { ProfesoresService } from '../../services/profesores.service';
import { CursosService } from '../../services/cursos.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../auth/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';

describe('AlumnosComponent', () => {
  let component: AlumnosComponent;
  let fixture: ComponentFixture<AlumnosComponent>;
  let alumnosSpy: jasmine.SpyObj<AlumnosService>;
  let modulosSpy: jasmine.SpyObj<ModulosService>;
  let profesoresSpy: jasmine.SpyObj<ProfesoresService>;
  let cursosSpy: jasmine.SpyObj<CursosService>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    alumnosSpy = jasmine.createSpyObj('AlumnosService', ['deleteAlumno', 'updateAlumno', 'createAlumno', 'importarAlumnosExcel']);
    modulosSpy = jasmine.createSpyObj('ModulosService', ['getModuloById']);
    profesoresSpy = jasmine.createSpyObj('ProfesoresService', ['getProfesorByEmail']);
    cursosSpy = jasmine.createSpyObj('CursosService', ['getCursosByProfesor']);
    alertSpy = jasmine.createSpyObj('AlertService', ['exito', 'error', 'advertencia']);
    authSpy = jasmine.createSpyObj('AuthService', [], {
      perfilUsuario$: of({ rol: 'COORDINADOR' }),
      currentUserValue: { rol: 'COORDINADOR', email: 'test@test.com' }
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    profesoresSpy.getProfesorByEmail.and.returnValue(of({ id: 1, ciclos: 'DAM' } as any));
    cursosSpy.getCursosByProfesor.and.returnValue(of([{ id: 10, siglasCiclo: 'DAM' } as any]));
    modulosSpy.getModuloById.and.returnValue(of({ nombre: 'DAM' } as any));

    await TestBed.configureTestingModule({
      imports: [AlumnosComponent],
      providers: [
        { provide: AlumnosService, useValue: alumnosSpy },
        { provide: ModulosService, useValue: modulosSpy },
        { provide: ProfesoresService, useValue: profesoresSpy },
        { provide: CursosService, useValue: cursosSpy },
        { provide: AlertService, useValue: alertSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: locationSpy },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(new Map([['moduloId', '1']])) }
        }
      ]
    })
    .overrideComponent(AlumnosComponent, {
      remove: { imports: [] }
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlumnosComponent);
    component = fixture.componentInstance;
    
    // Mock Datatable
    component.datatable = jasmine.createSpyObj('DatatableComponent', ['refrescar']);
  });

  it('should create and load data for COORDINADOR', fakeAsync(() => {
    fixture.detectChanges();
    tick(200); // Wait for route params timeout
    
    expect(component).toBeTruthy();
    expect(profesoresSpy.getProfesorByEmail).toHaveBeenCalled();
    expect(cursosSpy.getCursosByProfesor).toHaveBeenCalled();
    expect(component.todosLosCursos.length).toBe(1);
  }));

  it('crearNuevo should open modal if authorized', () => {
    component.rolUsuarioActual = 'COORDINADOR';
    component.moduloId = null; // not from mis modulos
    component.crearNuevo();
    
    expect(component.modalAlumnoVisible).toBeTrue();
  });

  it('crearNuevo should NOT open modal if unauthorized', () => {
    component.rolUsuarioActual = 'PROFESOR';
    component.crearNuevo();
    
    expect(component.modalAlumnoVisible).toBeFalse();
  });

  it('onTableAction should handle tasks routing', () => {
    component.onTableAction({ action: 'tasks', data: { id: 5 } });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tareas', 5]);
  });

  it('onTableAction should handle edit', () => {
    component.rolUsuarioActual = 'COORDINADOR';
    component.moduloId = null;
    component.onTableAction({ action: 'edit', data: { id: 5 } });
    expect(component.alumnoSeleccionado?.id).toBe(5);
    expect(component.modalAlumnoVisible).toBeTrue();
  });

  it('onTableAction should handle delete', () => {
    component.rolUsuarioActual = 'COORDINADOR';
    component.moduloId = null;
    component.onTableAction({ action: 'delete', data: { id: 5 } });
    expect(component.alumnoSeleccionado?.id).toBe(5);
    expect(component.modalBorradoVisible).toBeTrue();
  });

  it('onConfirmarBorrado should delete and refresh', () => {
    component.rolUsuarioActual = 'COORDINADOR';
    component.moduloId = null;
    component.alumnoSeleccionado = { id: 5, nombre: 'Test' } as any;
    alumnosSpy.deleteAlumno.and.returnValue(of(true));
    
    component.onConfirmarBorrado();
    
    expect(alumnosSpy.deleteAlumno).toHaveBeenCalledWith(5);
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.datatable.refrescar).toHaveBeenCalled();
    expect(component.modalBorradoVisible).toBeFalse();
  });

  it('onGuardarAlumno should create new if no id', () => {
    component.rolUsuarioActual = 'COORDINADOR';
    component.moduloId = null;
    alumnosSpy.createAlumno.and.returnValue(of({} as any));
    
    component.onGuardarAlumno({ nombre: 'Nuevo' } as any);
    
    expect(alumnosSpy.createAlumno).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.datatable.refrescar).toHaveBeenCalled();
  });
  
  it('onGuardarAlumno should update if has id', () => {
    component.rolUsuarioActual = 'COORDINADOR';
    component.moduloId = null;
    alumnosSpy.updateAlumno.and.returnValue(of({} as any));
    
    component.onGuardarAlumno({ id: 5, nombre: 'Update' } as any);
    
    expect(alumnosSpy.updateAlumno).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.datatable.refrescar).toHaveBeenCalled();
  });

  it('onConfirmarImportar should handle success', () => {
    alumnosSpy.importarAlumnosExcel.and.returnValue(of({ imported: 5, skipped: 1, errors: [] }));
    
    component.onConfirmarImportar({ file: new File([], 'a.xlsx'), idCurso: 1 });
    
    expect(alumnosSpy.importarAlumnosExcel).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.modalImportarVisible).toBeFalse();
    expect(component.datatable.refrescar).toHaveBeenCalled();
  });
});
