import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TareaFormComponent } from './tarea-form.component';
import { TareasService } from '../../services/tareas.service';
import { ModulosService } from '../../services/modulos.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../auth/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

describe('TareaFormComponent', () => {
  let component: TareaFormComponent;
  let fixture: ComponentFixture<TareaFormComponent>;
  let tareasSpy: jasmine.SpyObj<TareasService>;
  let modulosSpy: jasmine.SpyObj<ModulosService>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    tareasSpy = jasmine.createSpyObj('TareasService', [
      'getActividades', 'getTareaById', 'updateTarea', 
      'createTarea', 'subirDocumento', 'getTareasByAlumno'
    ]);
    modulosSpy = jasmine.createSpyObj('ModulosService', ['getModulosProfesor']);
    alertSpy = jasmine.createSpyObj('AlertService', ['exito', 'error', 'advertencia']);
    authSpy = jasmine.createSpyObj('AuthService', ['getCookieNativa'], {
      currentUserValue: { rol: 'PROFESOR', email: 'prof@test.com' }
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    tareasSpy.getActividades.and.returnValue(of([
      { id: 1, titulo: 'Act 1', modulo: 'DAM' },
      { id: 2, titulo: 'Act 2', modulo: 'DAW' }
    ]));
    modulosSpy.getModulosProfesor.and.returnValue(of([{ nombre: 'DAM', sigla: 'DAM' }]));

    await TestBed.configureTestingModule({
      imports: [TareaFormComponent, ReactiveFormsModule, CKEditorModule],
      providers: [
        FormBuilder,
        { provide: TareasService, useValue: tareasSpy },
        { provide: ModulosService, useValue: modulosSpy },
        { provide: AlertService, useValue: alertSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: locationSpy },
        {
          provide: ActivatedRoute,
          useValue: { 
            queryParams: of({ alumnoId: 5 }),
            paramMap: of(new Map([['id', '10']]))
          }
        }
      ]
    })
    .compileComponents();
  });

  const setupComponent = (rol = 'PROFESOR', isNew = false) => {
    Object.defineProperty(authSpy, 'currentUserValue', { get: () => ({ rol, email: 'test@test.com' }) });
    const paramMap = new Map();
    if (!isNew) paramMap.set('id', '10');
    else paramMap.set('id', 'nueva');

    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { 
        queryParams: of({ alumnoId: 5 }),
        paramMap: of(paramMap)
      }
    });

    if (!isNew) {
      tareasSpy.getTareaById.and.returnValue(of({
        id: 10, 
        titulo: 'Tarea Test',
        fechaIni: '2020-01-01',
        fechaFin: '2099-01-02',
        actividadesSeleccionadas: [1],
        revisionesModulos: [{ modulo: 'DAM', revisado: true, comentario: 'OK' }]
      } as any));
    }

    fixture = TestBed.createComponent(TareaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should initialize and load data in edit mode', () => {
    setupComponent('PROFESOR', false);
    expect(component.esEdicion).toBeTrue();
    expect(component.idTarea).toBe(10);
    expect(tareasSpy.getTareaById).toHaveBeenCalledWith(10);
    expect(component.tareaForm.get('titulo')?.value).toBe('Tarea Test');
  });

  it('should toggle actividad and update modules', () => {
    setupComponent('PROFESOR', true);
    expect(component.getActividadesSeleccionadasIds()).toEqual([]);
    
    component.toggleActividad(1); // Modulo DAM
    expect(component.getActividadesSeleccionadasIds()).toEqual([1]);
    expect(component.revisionesModulosArray.length).toBe(1);
    
    component.toggleActividad(1);
    expect(component.getActividadesSeleccionadasIds()).toEqual([]);
    expect(component.revisionesModulosArray.length).toBe(0);
  });

  it('should apply correct permissions for PROFESOR', () => {
    setupComponent('PROFESOR', false);
    // DAM is taught by professor, DAW is not (we mocked DAM above)
    component.toggleActividad(2); // DAW
    
    const damCtrl = component.revisionesModulosArray.controls.find(c => c.value.modulo === 'DAM');
    const dawCtrl = component.revisionesModulosArray.controls.find(c => c.value.modulo === 'DAW');
    
    expect(damCtrl?.disabled).toBeFalse();
    expect(dawCtrl?.disabled).toBeTrue(); // Professor doesn't teach DAW
    
    expect(component.tareaForm.get('titulo')?.disabled).toBeTrue();
  });

  it('should apply correct permissions for ALUMNO', () => {
    setupComponent('ALUMNO', true);
    
    component.toggleActividad(1);
    const damCtrl = component.revisionesModulosArray.controls.find(c => c.value.modulo === 'DAM');
    expect(damCtrl?.disabled).toBeTrue(); // Student cannot check revisiones
    
    expect(component.tareaForm.get('titulo')?.disabled).toBeFalse();
    expect(component.tareaForm.get('comentarioProfesor')?.disabled).toBeTrue();
  });

  it('onFilesSelected should handle valid PDF', () => {
    setupComponent('ALUMNO', true);
    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    
    const event = { target: { files: [file], value: 'test' } } as any;
    component.onFilesSelected(event);
    
    expect(component.documentoFile).toBeTruthy();
    expect(event.target.value).toBe(''); // Input reset
  });

  it('onFilesSelected should reject large PDF', () => {
    setupComponent('ALUMNO', true);
    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 30 * 1024 * 1024 }); // 30 MB
    
    component.onFilesSelected({ target: { files: [file] } } as any);
    
    expect(component.documentoFile).toBeNull();
    expect(alertSpy.advertencia).toHaveBeenCalled();
  });

  it('guardar should create when form valid', () => {
    setupComponent('ALUMNO', true);
    component.tareaForm.patchValue({
      titulo: 'New', fechaIni: '2020', fechaFin: '2020'
    });
    tareasSpy.createTarea.and.returnValue(of({ id: 11 } as any));
    
    component.guardar();
    
    expect(tareasSpy.createTarea).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
  });

  it('guardar should update when in edit mode', () => {
    setupComponent('ALUMNO', false); // Edits tarea 10
    component.tareaForm.patchValue({
      titulo: 'Update', fechaIni: '2020', fechaFin: '2020'
    });
    tareasSpy.updateTarea.and.returnValue(of({} as any));
    
    component.guardar();
    
    expect(tareasSpy.updateTarea).toHaveBeenCalled();
    expect(alertSpy.exito).toHaveBeenCalled();
  });

  it('formatFileSize should return correct strings', () => {
    setupComponent('ALUMNO', true);
    expect(component.formatFileSize(500)).toBe('500 B');
    expect(component.formatFileSize(1536)).toBe('1.5 KB');
    expect(component.formatFileSize(1572864)).toBe('1.5 MB');
  });
});
