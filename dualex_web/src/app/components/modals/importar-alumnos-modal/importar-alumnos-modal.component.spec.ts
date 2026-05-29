import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportarAlumnosModalComponent } from './importar-alumnos-modal.component';
import { Renderer2 } from '@angular/core';

describe('ImportarAlumnosModalComponent', () => {
  let component: ImportarAlumnosModalComponent;
  let fixture: ComponentFixture<ImportarAlumnosModalComponent>;
  let rendererSpy: jasmine.SpyObj<Renderer2>;

  beforeEach(async () => {
    rendererSpy = jasmine.createSpyObj('Renderer2', ['addClass', 'removeClass']);

    await TestBed.configureTestingModule({
      imports: [ImportarAlumnosModalComponent],
      providers: [
        { provide: Renderer2, useValue: rendererSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImportarAlumnosModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format courses properly on changes', () => {
    component.todosLosCursos = [
      { id: 1, nombre: '1º DAM', ciclo: 'Desarrollo de Aplicaciones Multiplataforma', anio_escolar: '2023' }
    ];
    
    component.ngOnChanges({ todosLosCursos: { currentValue: component.todosLosCursos, previousValue: null, firstChange: true, isFirstChange: () => true } });
    
    expect(component.cursosFormateados.length).toBe(1);
    expect(component.cursosFormateados[0].gradoStr).toBe('1º');
    expect(component.cursosFormateados[0].cicloNombre).toBe('Desarrollo de Aplicaciones Multiplataforma');
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
    component.idCursoSeleccionado = 1;
    
    component.onImportar();
    
    expect(component.importar.emit).toHaveBeenCalledWith({ file, idCurso: 1 });
  });
});
