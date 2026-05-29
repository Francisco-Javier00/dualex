import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CiclosComponent } from './ciclos.component';
import { CiclosService } from '../../services/ciclos.service';
import { AlertService } from '../../services/alert.service';
import { Location } from '@angular/common';
import { of } from 'rxjs';

describe('CiclosComponent', () => {
  let component: CiclosComponent;
  let fixture: ComponentFixture<CiclosComponent>;
  let ciclosSpy: jasmine.SpyObj<CiclosService>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    ciclosSpy = jasmine.createSpyObj('CiclosService', ['getCiclos', 'addCiclo', 'updateCiclo', 'deleteCiclo']);
    alertSpy = jasmine.createSpyObj('AlertService', ['exito', 'error']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    ciclosSpy.getCiclos.and.returnValue(of([{ id: 1, nombre: 'Test', siglas: 'TST' } as any]));

    await TestBed.configureTestingModule({
      imports: [CiclosComponent],
      providers: [
        { provide: CiclosService, useValue: ciclosSpy },
        { provide: AlertService, useValue: alertSpy },
        { provide: Location, useValue: locationSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CiclosComponent);
    component = fixture.componentInstance;
    component.sharedDatatable = {
      dtElement: {
        dtInstance: Promise.resolve({
          clear: jasmine.createSpy('clear'),
          rows: { add: jasmine.createSpy('add') },
          draw: jasmine.createSpy('draw')
        })
      }
    } as any;
  });

  it('should create and load ciclos on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(ciclosSpy.getCiclos).toHaveBeenCalled();
    expect(component.ciclos.length).toBe(1);
  });

  it('handleAction should handle edit', () => {
    component.handleAction({ action: 'edit', data: { id: 1 } });
    expect(component.isEditing).toBeTrue();
    expect(component.cicloSeleccionado?.id).toBe(1);
    expect(component.isEditModalOpen).toBeTrue();
  });

  it('handleAction should handle delete', () => {
    component.handleAction({ action: 'delete', data: { id: 1 } });
    expect(component.cicloToDelete?.id).toBe(1);
    expect(component.isDeleteModalOpen).toBeTrue();
  });

  it('guardarCiclo should prevent duplicates', () => {
    component.ciclos = [{ id: 1, nombre: 'Test', siglas: 'TST' } as any];
    component.guardarCiclo({ nombre: 'Test', siglas: 'TST2' }); // Same nombre
    
    expect(alertSpy.error).toHaveBeenCalledWith('Duplicado', jasmine.any(String));
  });

  it('guardarCiclo should add new ciclo', () => {
    component.ciclos = [];
    ciclosSpy.addCiclo.and.returnValue(of({} as any));
    
    component.guardarCiclo({ nombre: 'Nuevo', siglas: 'NVO' });
    
    expect(ciclosSpy.addCiclo).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
  });

  it('guardarCiclo should update ciclo', () => {
    component.ciclos = [];
    component.isEditing = true;
    component.cicloSeleccionado = { id: 1 };
    ciclosSpy.updateCiclo.and.returnValue(of({} as any));
    
    component.guardarCiclo({ id: 1, nombre: 'Nuevo', siglas: 'NVO' });
    
    expect(ciclosSpy.updateCiclo).toHaveBeenCalledWith(1, jasmine.any(Object));
    expect(alertSpy.exito).toHaveBeenCalled();
  });

  it('confirmarEliminar should delete ciclo', () => {
    component.cicloToDelete = { id: 1 };
    ciclosSpy.deleteCiclo.and.returnValue(of(true));
    
    component.confirmarEliminar();
    
    expect(ciclosSpy.deleteCiclo).toHaveBeenCalledWith(1);
    expect(component.isDeleteModalOpen).toBeFalse();
  });
});
