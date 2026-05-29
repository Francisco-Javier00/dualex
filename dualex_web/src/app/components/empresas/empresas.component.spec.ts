import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EmpresasComponent } from './empresas.component';
import { EmpresasService } from '../../services/empresas.service';
import { ConfiguracionService } from '../../services/configuracion.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../auth/services/auth.service';
import { CiclosService } from '../../services/ciclos.service';
import { Location } from '@angular/common';
import { of } from 'rxjs';

describe('EmpresasComponent', () => {
  let component: EmpresasComponent;
  let fixture: ComponentFixture<EmpresasComponent>;
  let empSpy: jasmine.SpyObj<EmpresasService>;
  let configSpy: jasmine.SpyObj<ConfiguracionService>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let ciclosSpy: jasmine.SpyObj<CiclosService>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    empSpy = jasmine.createSpyObj('EmpresasService', ['obtenerEmpresasDataTables', 'agregarEmpresa', 'actualizarEmpresa', 'eliminarEmpresa']);
    configSpy = jasmine.createSpyObj('ConfiguracionService', ['esGeneral', 'getConfiguracion', 'updateConfiguracion']);
    alertSpy = jasmine.createSpyObj('AlertService', ['exito', 'error', 'advertencia', 'informacion']);
    authSpy = jasmine.createSpyObj('AuthService', ['setEsGeneral'], {
      currentUserValue: { rol: 'COORDINADOR' }
    });
    ciclosSpy = jasmine.createSpyObj('CiclosService', ['getCiclos']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    configSpy.esGeneral.and.returnValue(of({ esGeneral: true }));
    configSpy.getConfiguracion.and.returnValue(of({ diasAvisoCaducidad: 30, tiempoFinalizacionConvenio: 4, urlConvenio: 'test' }));
    ciclosSpy.getCiclos.and.returnValue(of([{ siglas: 'DAM' } as any]));

    await TestBed.configureTestingModule({
      imports: [EmpresasComponent],
      providers: [
        { provide: EmpresasService, useValue: empSpy },
        { provide: ConfiguracionService, useValue: configSpy },
        { provide: AlertService, useValue: alertSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: CiclosService, useValue: ciclosSpy },
        { provide: Location, useValue: locationSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmpresasComponent);
    component = fixture.componentInstance;
    
    // Mock Datatable
    component.datatable = jasmine.createSpyObj('DatatableComponent', ['refrescar']);
  });

  it('should create and load config on init', () => {
    fixture.detectChanges();
    
    expect(component).toBeTruthy();
    expect(component.puedeEditar).toBeTrue();
    expect(configSpy.esGeneral).toHaveBeenCalled();
    expect(authSpy.setEsGeneral).toHaveBeenCalledWith(true);
    expect(configSpy.getConfiguracion).toHaveBeenCalled();
    expect(ciclosSpy.getCiclos).toHaveBeenCalled();
  });

  it('onTableAction should handle viewContacts', () => {
    component.onTableAction({ action: 'viewContacts', data: { id: 1 } });
    expect(component.empresaSeleccionada?.id).toBe(1);
    expect(component.modalContactosVisible).toBeTrue();
  });

  it('onTableAction should handle delete', () => {
    component.onTableAction({ action: 'delete', data: { id: 1 } });
    expect(component.empresaSeleccionada?.id).toBe(1);
    expect(component.modalBorradoVisible).toBeTrue();
  });

  it('onTableAction should handle edit async', fakeAsync(() => {
    component.onTableAction({ action: 'edit', data: { id: 1 } });
    tick(0);
    expect(component.modoFormulario).toBe('editar');
    expect(component.empresaSeleccionada?.id).toBe(1);
    expect(component.modalCrearVisible).toBeTrue();
  }));

  it('onConfirmarBorrado should delete and refresh', () => {
    component.empresaSeleccionada = { id: 1, nombre: 'Test' } as any;
    empSpy.eliminarEmpresa.and.returnValue(of({}));
    
    component.onConfirmarBorrado();
    
    expect(empSpy.eliminarEmpresa).toHaveBeenCalledWith(1);
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.datatable?.refrescar).toHaveBeenCalled();
  });

  it('guardarConfiguracion should update config', () => {
    component.configuracionEmpresa = { diasAvisoCaducidad: 30, tiempoFinalizacionConvenio: 4, urlConvenio: 'http://test' };
    configSpy.updateConfiguracion.and.returnValue(of({}));
    
    component.guardarConfiguracion();
    
    expect(configSpy.updateConfiguracion).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
  });

  it('guardarEmpresa should validate fields', () => {
    // Empty form
    component.guardarEmpresa();
    expect(alertSpy.error).toHaveBeenCalledWith('Datos incompletos', jasmine.any(String));
  });

  it('guardarEmpresa should create valid empresa', () => {
    component.nuevaEmpresa = {
      siglas: 'TEST',
      nombre: 'Test S.L.',
      convenioUrl: 'http://test.com',
      inicioConvenio: '2020-01-01',
      finConvenio: '',
      contacto: 'Paco',
      cargo: 'Jefe',
      numeroContacto: '123456789',
      correo: 'test@test.com'
    };
    component.modoFormulario = 'crear';
    empSpy.agregarEmpresa.and.returnValue(of({}));
    
    component.guardarEmpresa();
    
    expect(empSpy.agregarEmpresa).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
  });
});
