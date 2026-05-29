import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeleccionActividadesModalComponent } from './seleccion-actividades-modal.component';
import { Renderer2 } from '@angular/core';
import { ActividadDTO } from '../../../../dto/dualex.dto';

describe('SeleccionActividadesModalComponent', () => {
  let component: SeleccionActividadesModalComponent;
  let fixture: ComponentFixture<SeleccionActividadesModalComponent>;
  let rendererSpy: jasmine.SpyObj<Renderer2>;

  beforeEach(async () => {
    rendererSpy = jasmine.createSpyObj('Renderer2', ['addClass', 'removeClass']);

    await TestBed.configureTestingModule({
      imports: [SeleccionActividadesModalComponent],
      providers: [
        { provide: Renderer2, useValue: rendererSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SeleccionActividadesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter activities based on search term', () => {
    component.todasLasActividades = [
      { id: 1, titulo: 'Actividad Angular', modulo: 'Programacion' } as ActividadDTO,
      { id: 2, titulo: 'Actividad React', modulo: 'Diseno' } as ActividadDTO
    ];
    
    component.busqueda = 'angular';
    component.filtrar();
    
    expect(component.actividadesFiltradas.length).toBe(1);
    expect(component.actividadesFiltradas[0].id).toBe(1);
  });

  it('should correctly toggle selection of activity', () => {
    spyOn(component.seleccionChange, 'emit');
    
    // Select
    component.toggle(10);
    expect(component.seleccionadasLocal).toContain(10);
    expect(component.estaSeleccionada(10)).toBeTrue();
    expect(component.seleccionChange.emit).toHaveBeenCalledWith([10]);
    
    // Deselect
    component.toggle(10);
    expect(component.seleccionadasLocal).not.toContain(10);
    expect(component.estaSeleccionada(10)).toBeFalse();
    expect(component.seleccionChange.emit).toHaveBeenCalledWith([]);
  });

  it('should sync local selection array on changes', () => {
    component.seleccionadas = [1, 2, 3];
    component.ngOnChanges();
    
    expect(component.seleccionadasLocal).toEqual([1, 2, 3]);
    expect(component.estaSeleccionada(2)).toBeTrue();
  });
});
