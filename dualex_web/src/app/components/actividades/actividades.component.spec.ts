import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActividadesComponent } from './actividades.component';
import { ActividadesService } from '../../services/actividades.service';
import { AlertService } from '../../services/alert.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Location } from '@angular/common';
import { of } from 'rxjs';

describe('ActividadesComponent', () => {
  let component: ActividadesComponent;
  let fixture: ComponentFixture<ActividadesComponent>;
  let actSpy: jasmine.SpyObj<ActividadesService>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    actSpy = jasmine.createSpyObj('ActividadesService', [
      'obtenerActividadesDataTables', 'updateActividad', 'createActividad', 'deleteActividad'
    ]);
    alertSpy = jasmine.createSpyObj('AlertService', ['exito', 'error']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [ActividadesComponent, HttpClientTestingModule],
      providers: [
        { provide: ActividadesService, useValue: actSpy },
        { provide: AlertService, useValue: alertSpy },
        { provide: Location, useValue: locationSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActividadesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    component.datatable = jasmine.createSpyObj('DatatableComponent', ['refrescar']);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('crearNueva should show modal', () => {
    component.crearNueva();
    expect(component.actividadSeleccionada).toBeNull();
    expect(component.modalActividadVisible).toBeTrue();
  });

  it('onTableAction should handle edit', () => {
    component.onTableAction({ action: 'edit', data: { id: 1 } });
    expect(component.actividadSeleccionada?.id).toBe(1);
    expect(component.modalActividadVisible).toBeTrue();
  });

  it('onTableAction should handle delete', () => {
    component.onTableAction({ action: 'delete', data: { id: 1 } });
    expect(component.actividadSeleccionada?.id).toBe(1);
    expect(component.modalBorradoVisible).toBeTrue();
  });

  it('onGuardarActividad should create if no id', () => {
    actSpy.createActividad.and.returnValue(of({}));
    component.onGuardarActividad({ titulo: 'Test' } as any);
    
    expect(actSpy.createActividad).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.datatable.refrescar).toHaveBeenCalled();
  });

  it('onGuardarActividad should update if has id', () => {
    actSpy.updateActividad.and.returnValue(of({}));
    component.onGuardarActividad({ id: 1, titulo: 'Test' } as any);
    
    expect(actSpy.updateActividad).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.datatable.refrescar).toHaveBeenCalled();
  });

  it('onConfirmarBorrado should delete and refresh', () => {
    component.actividadSeleccionada = { id: 1 } as any;
    actSpy.deleteActividad.and.returnValue(of({}));
    
    component.onConfirmarBorrado();
    
    expect(actSpy.deleteActividad).toHaveBeenCalledWith(1);
    expect(alertSpy.exito).toHaveBeenCalled();
    expect(component.modalBorradoVisible).toBeFalse();
  });
});
