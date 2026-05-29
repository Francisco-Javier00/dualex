import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModulosComponent } from './modulos.component';
import { ModulosService } from '../../services/modulos.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../auth/services/auth.service';
import { ProfesoresService } from '../../services/profesores.service';
import { CursosService } from '../../services/cursos.service';
import { CiclosService } from '../../services/ciclos.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Location } from '@angular/common';
import { of } from 'rxjs';

describe('ModulosComponent', () => {
  let component: ModulosComponent;
  let fixture: ComponentFixture<ModulosComponent>;
  let modSpy: jasmine.SpyObj<ModulosService>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let profesSpy: jasmine.SpyObj<ProfesoresService>;
  let cursosSpy: jasmine.SpyObj<CursosService>;
  let ciclosSpy: jasmine.SpyObj<CiclosService>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    modSpy = jasmine.createSpyObj('ModulosService', ['obtenerModulosDataTables', 'updateModulo', 'createModulo', 'deleteModulo']);
    alertSpy = jasmine.createSpyObj('AlertService', ['exito', 'error']);
    authSpy = jasmine.createSpyObj('AuthService', [], {
      perfilUsuario$: of({ rol: 'COORDINADOR' }),
      currentUserValue: { rol: 'COORDINADOR', email: 'test@test.com' }
    });
    profesSpy = jasmine.createSpyObj('ProfesoresService', ['getProfesorByEmail']);
    cursosSpy = jasmine.createSpyObj('CursosService', ['getCursosByProfesor', 'getCursos']);
    ciclosSpy = jasmine.createSpyObj('CiclosService', ['getCiclos']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    profesSpy.getProfesorByEmail.and.returnValue(of({ id: 1, ciclos: 'DAM' } as any));
    cursosSpy.getCursosByProfesor.and.returnValue(of([{ id: 10, siglasCiclo: 'DAM' } as any]));
    cursosSpy.getCursos.and.returnValue(of([]));
    ciclosSpy.getCiclos.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ModulosComponent, HttpClientTestingModule],
      providers: [
        { provide: ModulosService, useValue: modSpy },
        { provide: AlertService, useValue: alertSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ProfesoresService, useValue: profesSpy },
        { provide: CursosService, useValue: cursosSpy },
        { provide: CiclosService, useValue: ciclosSpy },
        { provide: Location, useValue: locationSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModulosComponent);
    component = fixture.componentInstance;
    // mock dtOptions to avoid DataTables init errors
    component.dtOptions = {};
  });

  it('should create and load data for COORDINADOR', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(profesSpy.getProfesorByEmail).toHaveBeenCalled();
    expect(cursosSpy.getCursosByProfesor).toHaveBeenCalled();
    expect(component.todosLosCursos.length).toBe(1);
  });

  it('crearNuevo should open modal', () => {
    component.crearNuevo();
    expect(component.moduloSeleccionado).toBeNull();
    expect(component.modalModuloVisible).toBeTrue();
  });

  it('onTableAction should handle edit', () => {
    component.onTableAction({ action: 'edit', data: { id: 1 } });
    expect(component.moduloSeleccionado?.id).toBe(1);
    expect(component.modalModuloVisible).toBeTrue();
  });

  it('onTableAction should handle delete', () => {
    component.onTableAction({ action: 'delete', data: { id: 1 } });
    expect(component.moduloSeleccionado?.id).toBe(1);
    expect(component.modalBorradoVisible).toBeTrue();
  });

  it('onGuardarModulo should update if has id', () => {
    fixture.detectChanges();
    spyOn(component.datatable, 'refrescar');
    modSpy.updateModulo.and.returnValue(of({} as any));
    component.onGuardarModulo({ id: 1, nombre: 'Test' });
    
    expect(modSpy.updateModulo).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.datatable.refrescar).toHaveBeenCalled();
  });

  it('onGuardarModulo should create if no id', () => {
    fixture.detectChanges();
    spyOn(component.datatable, 'refrescar');
    modSpy.createModulo.and.returnValue(of({} as any));
    component.onGuardarModulo({ nombre: 'Test' });
    
    expect(modSpy.createModulo).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.datatable.refrescar).toHaveBeenCalled();
  });

  it('onConfirmarBorrado should delete and refresh', () => {
    fixture.detectChanges();
    spyOn(component.datatable, 'refrescar');
    component.moduloSeleccionado = { id: 1 } as any;
    modSpy.deleteModulo.and.returnValue(of(true));
    
    component.onConfirmarBorrado();
    
    expect(modSpy.deleteModulo).toHaveBeenCalledWith(1);
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.modalBorradoVisible).toBeFalse();
    expect(component.datatable.refrescar).toHaveBeenCalled();
  });
});
