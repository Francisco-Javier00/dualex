import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareasTodosComponent } from './tareas-todos.component';
import { AlumnosService } from '../../services/alumnos.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';

describe('TareasTodosComponent', () => {
  let component: TareasTodosComponent;
  let fixture: ComponentFixture<TareasTodosComponent>;
  let alumnosSpy: jasmine.SpyObj<AlumnosService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    alumnosSpy = jasmine.createSpyObj('AlumnosService', ['obtenerTodosDataTables']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [TareasTodosComponent],
      providers: [
        { provide: AlumnosService, useValue: alumnosSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: locationSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TareasTodosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onTableAction should navigate to tasks', () => {
    component.onTableAction({ action: 'tasks', data: { id: 5 } });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tareas', 5]);
  });

  it('irAtras should go back', () => {
    component.irAtras();
    expect(locationSpy.back).toHaveBeenCalled();
  });
});
