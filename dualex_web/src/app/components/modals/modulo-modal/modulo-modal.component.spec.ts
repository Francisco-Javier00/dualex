import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModuloModalComponent } from './modulo-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';
import { CiclosService } from '../../../services/ciclos.service';
import { CursosService } from '../../../services/cursos.service';
import { of } from 'rxjs';
import { Renderer2 } from '@angular/core';

describe('ModuloModalComponent', () => {
  let component: ModuloModalComponent;
  let fixture: ComponentFixture<ModuloModalComponent>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let ciclosSpy: jasmine.SpyObj<CiclosService>;
  let cursosSpy: jasmine.SpyObj<CursosService>;
  let rendererSpy: jasmine.SpyObj<Renderer2>;

  beforeEach(async () => {
    alertSpy = jasmine.createSpyObj('AlertService', ['advertencia']);
    ciclosSpy = jasmine.createSpyObj('CiclosService', ['getCiclos']);
    cursosSpy = jasmine.createSpyObj('CursosService', ['getCursos']);
    rendererSpy = jasmine.createSpyObj('Renderer2', ['addClass', 'removeClass']);

    ciclosSpy.getCiclos.and.returnValue(of([{ id: 1, nombre: 'DAM', siglas: 'DAM' }]));
    cursosSpy.getCursos.and.returnValue(of([{ id: 10, idCiclo: 1, ciclo: 'DAM' }]));

    await TestBed.configureTestingModule({
      imports: [ModuloModalComponent, ReactiveFormsModule],
      providers: [
        { provide: AlertService, useValue: alertSpy },
        { provide: CiclosService, useValue: ciclosSpy },
        { provide: CursosService, useValue: cursosSpy },
        { provide: Renderer2, useValue: rendererSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModuloModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load ciclos and cursos on init', () => {
    expect(ciclosSpy.getCiclos).toHaveBeenCalled();
    expect(cursosSpy.getCursos).toHaveBeenCalled();
    expect(component.todosLosCiclos.length).toBe(1);
    expect(component.cursos.length).toBe(1);
  });

  it('should filter cursos when idCiclo changes', () => {
    component.cursosFiltrados = [];
    component.moduloForm.patchValue({ idCiclo: 1 });
    
    expect(component.cursosFiltrados.length).toBe(1);
    expect(component.cursosFiltrados[0].id).toBe(10);
  });

  it('should emit on valid submit', () => {
    spyOn(component.guardarEvent, 'emit');
    
    component.moduloForm.patchValue({
      nombre: 'Test',
      sigla: 'TST',
      idCiclo: 1,
      idCurso: 10,
      color: '#000000'
    });
    
    component.onSubmit();
    
    expect(component.guardarEvent.emit).toHaveBeenCalled();
  });

  it('should show alert on invalid submit', () => {
    component.moduloForm.reset();
    component.onSubmit();
    
    expect(alertSpy.advertencia).toHaveBeenCalled();
  });

  it('should toggle body scroll on visible change', () => {
    component.ngOnChanges({ visible: { currentValue: true, previousValue: false, firstChange: true, isFirstChange: () => true } });
    expect(rendererSpy.addClass).toHaveBeenCalled();
  });
});
