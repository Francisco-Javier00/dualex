import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareasComponent } from './tareas.component';
import { TareasService } from '../../services/tareas.service';
import { AuthService } from '../../auth/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';

describe('TareasComponent', () => {
  let component: TareasComponent;
  let fixture: ComponentFixture<TareasComponent>;
  let tareasSpy: jasmine.SpyObj<TareasService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    tareasSpy = jasmine.createSpyObj('TareasService', [
      'getTareasByAlumno', 'getTareas', 'getDocumentoUrl', 
      'getDocumentoBlob', 'deleteTarea'
    ]);
    authSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: { rol: 'PROFESOR' }
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    tareasSpy.getTareas.and.returnValue(of([{ id: 1, titulo: 'Global', modulos: [], progreso: { actual: 0, total: 1 } } as any]));
    tareasSpy.getTareasByAlumno.and.returnValue(of([{ id: 2, titulo: 'Alumno', modulos: [], progreso: { actual: 0, total: 1 } } as any]));

    await TestBed.configureTestingModule({
      imports: [TareasComponent],
      providers: [
        { provide: TareasService, useValue: tareasSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: locationSpy },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(new Map()) }
        }
      ]
    })
    .compileComponents();
  });

  const setupComponent = (routeParams = new Map()) => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { paramMap: of(routeParams) }
    });
    fixture = TestBed.createComponent(TareasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should load global tareas if no alumnoId', () => {
    setupComponent();
    expect(component.alumnoId).toBeNull();
    expect(tareasSpy.getTareas).toHaveBeenCalled();
    expect(component.tareas[0].titulo).toBe('Global');
  });

  it('should load alumno tareas if alumnoId present', () => {
    setupComponent(new Map([['alumnoId', '5']]));
    expect(component.alumnoId).toBe(5);
    expect(tareasSpy.getTareasByAlumno).toHaveBeenCalledWith(5);
    expect(component.tareas[0].titulo).toBe('Alumno');
  });

  it('stripHtmlTags should remove tags and decode entities', () => {
    setupComponent();
    expect(component.stripHtmlTags('<p>Hola &amp; adios</p>')).toBe('Hola & adios');
    expect(component.stripHtmlTags('')).toBe('');
  });

  it('crearTarea should navigate without queryParams if no alumnoId', () => {
    setupComponent();
    component.crearTarea();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tarea/nueva']);
  });

  it('crearTarea should navigate with queryParams if alumnoId exists', () => {
    setupComponent(new Map([['alumnoId', '5']]));
    component.crearTarea();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tarea/nueva'], { queryParams: { alumnoId: 5 } });
  });

  it('verTarea should navigate to tarea details', () => {
    setupComponent();
    component.verTarea({ id: 10 } as any);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tarea', 10]);
  });

  it('eliminarTarea should open modal', () => {
    setupComponent();
    component.eliminarTarea({ id: 10 } as any);
    expect(component.tareaSeleccionada?.id).toBe(10);
    expect(component.modalBorradoVisible).toBeTrue();
  });

  it('onConfirmarBorrado should delete and reload', () => {
    setupComponent();
    component.tareaSeleccionada = { id: 10 } as any;
    tareasSpy.deleteTarea.and.returnValue(of(true));
    
    component.onConfirmarBorrado();
    
    expect(tareasSpy.deleteTarea).toHaveBeenCalledWith(10);
    expect(component.modalBorradoVisible).toBeFalse();
  });

  it('abrirDocumento should open blob in new window', () => {
    setupComponent();
    const blob = new Blob([''], { type: 'application/pdf' });
    tareasSpy.getDocumentoBlob.and.returnValue(of(blob));
    spyOn(window, 'open');
    spyOn(URL, 'createObjectURL').and.returnValue('blob:url');

    component.abrirDocumento({ id: 10, documento: 'file.pdf' } as any);

    expect(tareasSpy.getDocumentoBlob).toHaveBeenCalledWith(10);
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(window.open).toHaveBeenCalledWith('blob:url', '_blank');
  });
});
