import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfesoresComponent } from './profesores.component';
import { ProfesoresService } from '../../services/profesores.service';
import { AlertService } from '../../services/alert.service';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';

describe('ProfesoresComponent', () => {
  let component: ProfesoresComponent;
  let fixture: ComponentFixture<ProfesoresComponent>;
  let profesSpy: jasmine.SpyObj<ProfesoresService>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    profesSpy = jasmine.createSpyObj('ProfesoresService', [
      'obtenerProfesoresDataTables', 'importarProfesoresExcel', 
      'agregarProfesor', 'actualizarProfesor', 'eliminarProfesor'
    ]);
    alertSpy = jasmine.createSpyObj('AlertService', ['exito', 'error', 'advertencia']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [ProfesoresComponent],
      providers: [
        { provide: ProfesoresService, useValue: profesSpy },
        { provide: AlertService, useValue: alertSpy },
        { provide: Location, useValue: locationSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfesoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    component.datatable = jasmine.createSpyObj('DatatableComponent', ['refrescar']);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('crearNuevaEntrada should set modo crear and show modal', () => {
    component.crearNuevaEntrada();
    expect(component.modoFormulario).toBe('crear');
    expect(component.profesorSeleccionado).toBeNull();
    expect(component.modalCrearVisible).toBeTrue();
  });

  it('onTableAction should handle edit', () => {
    component.onTableAction({ action: 'edit', data: { id: 1 } });
    expect(component.modoFormulario).toBe('editar');
    expect(component.profesorSeleccionado?.id).toBe(1);
    expect(component.modalCrearVisible).toBeTrue();
  });

  it('onTableAction should handle delete', () => {
    component.onTableAction({ action: 'delete', data: { id: 1 } });
    expect(component.profesorSeleccionado?.id).toBe(1);
    expect(component.modalBorradoVisible).toBeTrue();
  });

  it('onConfirmarBorrado should delete and refresh', () => {
    component.profesorSeleccionado = { id: 5 } as any;
    profesSpy.eliminarProfesor.and.returnValue(of({}));
    
    component.onConfirmarBorrado();
    
    expect(profesSpy.eliminarProfesor).toHaveBeenCalledWith(5);
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.datatable?.refrescar).toHaveBeenCalled();
    expect(component.modalBorradoVisible).toBeFalse();
  });

  it('onGuardarProfesor should call agregarProfesor if modo crear', () => {
    component.modoFormulario = 'crear';
    profesSpy.agregarProfesor.and.returnValue(of({}));
    
    component.onGuardarProfesor({ nombre: 'Test' });
    
    expect(profesSpy.agregarProfesor).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
  });

  it('onGuardarProfesor should call actualizarProfesor if modo editar', () => {
    component.modoFormulario = 'editar';
    profesSpy.actualizarProfesor.and.returnValue(of({}));
    
    component.onGuardarProfesor({ id: 5, nombre: 'Test' });
    
    expect(profesSpy.actualizarProfesor).toHaveBeenCalledWith(5, jasmine.any(Object));
    expect(alertSpy.exito).toHaveBeenCalled();
  });

  it('onConfirmarImportar should handle success', () => {
    profesSpy.importarProfesoresExcel.and.returnValue(of({ imported: 3, errors: [] }));
    
    component.onConfirmarImportar(new File([], 'a.xlsx'));
    
    expect(profesSpy.importarProfesoresExcel).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.modalImportarVisible).toBeFalse();
  });
  
  it('onConfirmarImportar should handle errors', () => {
    profesSpy.importarProfesoresExcel.and.returnValue(throwError(() => ({ error: { message: 'err' } })));
    
    component.onConfirmarImportar(new File([], 'a.xlsx'));
    
    expect(alertSpy.error).toHaveBeenCalled();
    expect(component.importandoExcel).toBeFalse();
  });
});
