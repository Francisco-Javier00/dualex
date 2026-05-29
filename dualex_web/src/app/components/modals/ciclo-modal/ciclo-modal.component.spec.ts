import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CicloModalComponent } from './ciclo-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';
import { Renderer2 } from '@angular/core';

describe('CicloModalComponent', () => {
  let component: CicloModalComponent;
  let fixture: ComponentFixture<CicloModalComponent>;
  let alertSpy: jasmine.SpyObj<AlertService>;

  beforeEach(async () => {
    alertSpy = jasmine.createSpyObj('AlertService', ['advertencia']);

    await TestBed.configureTestingModule({
      imports: [CicloModalComponent, ReactiveFormsModule],
      providers: [
        { provide: AlertService, useValue: alertSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CicloModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should patch form when ciclo input is set', () => {
    const dummyCiclo = { id: 1, nombre: 'Test', siglas: 'TST', grado: 'superior' };
    component.ciclo = dummyCiclo;
    
    expect(component.cicloForm.value).toEqual(dummyCiclo);
  });

  it('should reset form when ciclo input is null', () => {
    component.cicloForm.patchValue({ nombre: 'Test', siglas: 'TST' });
    component.ciclo = null;
    
    expect(component.cicloForm.value.nombre).toBeNull();
    expect(component.cicloForm.value.grado).toBe('superior');
  });

  it('should emit guardar if form is valid', () => {
    spyOn(component.guardar, 'emit');
    component.cicloForm.patchValue({ nombre: 'Test', siglas: 'TST', grado: 'medio' });
    
    component.onGuardar();
    
    expect(component.guardar.emit).toHaveBeenCalled();
  });

  it('should show alert if form is invalid', () => {
    component.cicloForm.reset();
    component.onGuardar();
    
    expect(alertSpy.advertencia).toHaveBeenCalled();
  });

  it('should toggle body scroll on init and destroy', () => {
    const addSpy = spyOn((component as any).renderer, 'addClass');
    const removeSpy = spyOn((component as any).renderer, 'removeClass');
    component.ngOnInit();
    expect(addSpy).toHaveBeenCalled();
    
    component.ngOnDestroy();
    expect(removeSpy).toHaveBeenCalled();
  });
});
