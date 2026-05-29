import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmarBorradoModalComponent } from './confirmar-borrado-modal.component';
import { Renderer2 } from '@angular/core';

describe('ConfirmarBorradoModalComponent', () => {
  let component: ConfirmarBorradoModalComponent;
  let fixture: ComponentFixture<ConfirmarBorradoModalComponent>;
  let rendererSpy: jasmine.SpyObj<Renderer2>;

  beforeEach(async () => {
    rendererSpy = jasmine.createSpyObj('Renderer2', ['addClass', 'removeClass']);

    await TestBed.configureTestingModule({
      imports: [ConfirmarBorradoModalComponent],
      providers: [
        { provide: Renderer2, useValue: rendererSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfirmarBorradoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('puedeConfirmar should return true if input matches palabraClave', () => {
    component.palabraClave = 'BORRAR';
    component.textoInput = ' borrar '; // Should ignore case and spaces
    expect(component.puedeConfirmar).toBeTrue();
  });

  it('puedeConfirmar should return false if input does not match palabraClave', () => {
    component.palabraClave = 'BORRAR';
    component.textoInput = 'borrar123';
    expect(component.puedeConfirmar).toBeFalse();
  });

  it('should emit confirmarEvent if puedeConfirmar is true', () => {
    spyOn(component.confirmarEvent, 'emit');
    
    component.palabraClave = 'OK';
    component.textoInput = 'OK';
    
    component.onConfirmar();
    
    expect(component.confirmarEvent.emit).toHaveBeenCalled();
  });

  it('should not emit confirmarEvent if puedeConfirmar is false', () => {
    spyOn(component.confirmarEvent, 'emit');
    
    component.palabraClave = 'OK';
    component.textoInput = 'NO';
    
    component.onConfirmar();
    
    expect(component.confirmarEvent.emit).not.toHaveBeenCalled();
  });

  it('should emit cancelarEvent on cancelar', () => {
    spyOn(component.cancelarEvent, 'emit');
    component.onCancelar();
    expect(component.cancelarEvent.emit).toHaveBeenCalled();
  });
});
