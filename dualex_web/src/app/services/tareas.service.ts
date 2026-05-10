import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Tarea } from '../dto/dualex.dto';
import { ActividadesService } from './actividades.service';

/**
 * Servicio encargado de la gestión de Tareas de los alumnos.
 * Preparado para comunicarse con conTareas.php (o similar).
 */
@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private http = inject(HttpClient);
  private actividadesService = inject(ActividadesService);
  
  // URL de la API PHP
  private readonly API_URL = 'api/conTareas.php';

  /**
   * DATOS DE PRUEBA (MOCK)
   */
  private tareas: Tarea[] = [
    {
      id: 1,
      modulos: ['DWEC'],
      titulo: 'Desarrollo de Interfaz de Usuario',
      fechaLimite: '01-01-2027',
      calificacion: 'Bien',
      progreso: { actual: 1, total: 1 },
      fechaIni: '2026-05-01',
      fechaFin: '2026-05-15',
      descripcion: '<p>Desarrollar una interfaz moderna utilizando CSS Grid y Flexbox.</p>',
      actividadesSeleccionadas: [1, 2],
      idAlumno: 1
    },
    {
      id: 2,
      modulos: ['SI', 'RL', 'SOR'],
      titulo: 'Configuración de Servidor Web',
      fechaLimite: '01-01-2027',
      calificacion: 'No superado',
      progreso: { actual: 3, total: 3 },
      fechaIni: '2026-04-20',
      fechaFin: '2026-05-10',
      descripcion: '<p>Configuración completa de un entorno LAMP en Ubuntu Server.</p>',
      actividadesSeleccionadas: [3],
      idAlumno: 1
    },
    {
      id: 3,
      modulos: ['DWEC'],
      titulo: 'Consumo de API REST',
      fechaLimite: '01-01-2027',
      calificacion: 'Sin calificar',
      progreso: { actual: 0, total: 2 },
      fechaIni: '2026-06-01',
      fechaFin: '2026-06-10',
      descripcion: '<p>Implementar servicios de Angular para consumir endpoints externos.</p>',
      actividadesSeleccionadas: [],
      idAlumno: 2
    }
  ];

  /**
   * Obtiene todas las tareas (vista de administrador/profesor).
   * API: return this.http.get<Tarea[]>(this.API_URL);
   */
  getTareas(): Observable<Tarea[]> {
    return of([...this.tareas]).pipe(delay(300));
  }

  /**
   * Filtra las tareas de un alumno concreto.
   * API: return this.http.get<Tarea[]>(`${this.API_URL}?idAlumno=${alumnoId}`);
   */
  getTareasByAlumno(alumnoId: number): Observable<Tarea[]> {
    return of(this.tareas.filter(t => t.idAlumno === alumnoId)).pipe(delay(300));
  }

  /**
   * Recupera una tarea específica por su ID.
   * API: return this.http.get<Tarea>(`${this.API_URL}?id=${id}`);
   */
  getTareaById(id: number): Observable<Tarea | undefined> {
    const tarea = this.tareas.find(t => t.id === id);
    return of(tarea ? { ...tarea } : undefined).pipe(delay(200));
  }

  /**
   * Persiste una nueva tarea en el sistema.
   * API: return this.http.post<Tarea>(this.API_URL, tarea);
   */
  createTarea(tarea: Tarea): Observable<Tarea> {
    const nuevaTarea = { 
      ...tarea, 
      id: this.tareas.length > 0 ? Math.max(...this.tareas.map(t => t.id)) + 1 : 1,
      progreso: tarea.progreso || { actual: 0, total: 1 }
    };
    this.tareas.push(nuevaTarea);
    return of(nuevaTarea).pipe(delay(500));
  }

  /**
   * Actualiza una tarea existente.
   * API: return this.http.put<Tarea>(this.API_URL, tarea);
   */
  updateTarea(tarea: Tarea): Observable<Tarea> {
    const index = this.tareas.findIndex(t => t.id === tarea.id);
    if (index !== -1) {
      this.tareas[index] = { ...tarea };
    }
    return of(tarea).pipe(delay(500));
  }

  /**
   * Elimina una tarea del registro.
   * API: return this.http.delete<boolean>(`${this.API_URL}?id=${id}`);
   */
  deleteTarea(id: number): Observable<boolean> {
    const index = this.tareas.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tareas.splice(index, 1);
      return of(true).pipe(delay(400));
    }
    return of(false);
  }

  /**
   * Proxy para obtener el catálogo de actividades disponibles.
   */
  getActividades(): Observable<any[]> {
    return this.actividadesService.getActividades();
  }
}
