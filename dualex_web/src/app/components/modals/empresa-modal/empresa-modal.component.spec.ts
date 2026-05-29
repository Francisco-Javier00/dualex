import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmpresaModalComponent } from './empresa-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';
import { Renderer2 } from '@angular/core';
import { EmpresaDTO } from '../../../dto/dualex.dto';

describe('EmpresaModalComponent', () => {
  let component: EmpresaModalComponent;
  let fixture: ComponentFixture<EmpresaModalComponent>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let rendererSpy: jasmine.SpyObj<Renderer2>;

  beforeEach(async () => {
    alertSpy = jasmine.createSpyObj('AlertService', ['advertencia']);
    rendererSpy = jasmine.createSpyObj('Renderer2', ['addClass', 'removeClass']);

    await TestBed.configureTestingModule({
      imports: [EmpresaModalComponent, ReactiveFormsModule],
      providers: [
        { provide: AlertService, useValue: alertSpy },
        { provide: Renderer2, useValue: rendererSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmpresaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add and remove additional contacts', () => {
    expect(component.contactosAdicionales.length).toBe(0);
    
    component.addContacto('Test', '123456789', 'test@test.com', 'Cargo');
    expect(component.contactosAdicionales.length).toBe(1);
    
    component.removeContacto(0);
    expect(component.contactosAdicionales.length).toBe(0);
  });

  it('should emit guardar payload with correct date format', () => {
    spyOn(component.guardar, 'emit');
    
    component.empresaForm.patchValue({
      siglas: 'TEST',
      nombre: 'Test S.L.',
      convenioUrl: 'http://test.com',
      inicioConvenio: '2023-01-01',
      contacto: 'Test Contact',
      cargo: 'CEO',
      numeroContacto: '123456789',
      correo: 'test@test.com'
    });

    component.onSubmit();
    
    expect(component.guardar.emit).toHaveBeenCalled();
    const payload = (component.guardar.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(payload.inicioConvenio).toBe('01/01/2023');
  });

  it('should only emit id and ciclos in enlazar mode', () => {
    spyOn(component.guardar, 'emit');
    component.modo = 'enlazar';
    component.ciclosSeleccionados = [{ sigla: 'DAM', tutor: 'Test Tutor' }];
    
    // Asignar empresa para tener un id
    const empresaDto: any = { id: 5, siglas: 'TEST', nombre: 'Test', convenioUrl: '', inicioConvenio: '', contacto: '', correo: '', numeroContacto: '' };
    component.empresa = empresaDto;

    component.onSubmit();
    
    expect(component.guardar.emit).toHaveBeenCalledWith({ id: 5, ciclos: [{ sigla: 'DAM', tutor: 'Test Tutor' }] });
  });

  it('should show alert on invalid form submit (crear/editar)', () => {
    component.modo = 'crear';
    component.empresaForm.reset();
    
    component.onSubmit();
    
    expect(alertSpy.advertencia).toHaveBeenCalled();
  });
});
