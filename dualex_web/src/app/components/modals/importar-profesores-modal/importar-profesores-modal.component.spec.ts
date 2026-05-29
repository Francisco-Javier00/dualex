import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportarProfesoresModalComponent } from './importar-profesores-modal.component';
import { Renderer2 } from '@angular/core';

describe('ImportarProfesoresModalComponent', () => {
  let component: ImportarProfesoresModalComponent;
  let fixture: ComponentFixture<ImportarProfesoresModalComponent>;
  let rendererSpy: jasmine.SpyObj<Renderer2>;

  beforeEach(async () => {
    rendererSpy = jasmine.createSpyObj('Renderer2', ['addClass', 'removeClass']);

    await TestBed.configureTestingModule({
      imports: [ImportarProfesoresModalComponent],
      providers: [
        { provide: Renderer2, useValue: rendererSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImportarProfesoresModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept excel files on change', () => {
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const event = { target: { files: [file] } };
    
    component.onFileChange(event);
    
    expect(component.archivoSeleccionado).toBe(file);
  });

  it('should emit on valid submit', () => {
    spyOn(component.importar, 'emit');
    
    const file = new File([''], 'test.xlsx');
    component.archivoSeleccionado = file;
    
    component.onImportar();
    
    expect(component.importar.emit).toHaveBeenCalledWith(file);
  });

  it('should toggle body scroll on visible change', () => {
    component.ngOnChanges({ visible: { currentValue: true, previousValue: false, firstChange: true, isFirstChange: () => true } });
    expect(rendererSpy.addClass).toHaveBeenCalled();
  });
});
