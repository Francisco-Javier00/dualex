import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { AlumnoDTO } from '../dto/dualex.dto';

/**
 * Servicio encargado de la gestión de Alumnos.
 */
@Injectable({
  providedIn: 'root'
})
export class AlumnosService {
  private http = inject(HttpClient);

  // URL base para la API PHP (ajustar según entorno)
  private readonly API_URL = 'api/alumnos.php';

  /**
   * DATOS DE PRUEBA (MOCK)
   * Estos datos se utilizan mientras la API REST no esté disponible.
   */
  private alumnos: AlumnoDTO[] = [
    { id: 1, nombre: 'Ana', apellidos: 'García López', email: 'ana.garcia@dualex.es', nia: '12345678', nuss: '281234567890', dni: '12345678A', telefono: '600111222', ciclo: 'DAW', curso: '2º', estado: 'Activo' },
    { id: 2, nombre: 'Juan', apellidos: 'Martínez Ruiz', email: 'juan.martinez@dualex.es', nia: '23456789', nuss: '282345678901', dni: '23456789B', telefono: '600222333', ciclo: 'DAM', curso: '1º', estado: 'Activo' },
    { id: 3, nombre: 'Elena', apellidos: 'Sánchez Pérez', email: 'elena.sanchez@dualex.es', nia: '34567890', nuss: '283456789012', dni: '34567890C', telefono: '600333444', ciclo: 'DAW', curso: '2º', estado: 'Activo' },
    { id: 4, nombre: 'Marcos', apellidos: 'Rodríguez Toribio', email: 'marcos.rodriguez@dualex.es', nia: '45678901', nuss: '284567890123', dni: '45678901D', telefono: '600444555', ciclo: 'ASIR', curso: '2º', estado: 'Activo' },
    { id: 5, nombre: 'Lucía', apellidos: 'Jiménez Cano', email: 'lucia.jimenez@dualex.es', nia: '56789012', nuss: '285678901234', dni: '56789012E', telefono: '600555666', ciclo: 'DAW', curso: '1º', estado: 'Inactivo' }
  ];

  /**
   * Obtiene la lista completa de alumnos.
   * Conexión API: return this.http.get<AlumnoDTO[]>(this.API_URL);
   */
  getAlumnos(): Observable<AlumnoDTO[]> {
    return of([...this.alumnos]).pipe(delay(300));
  }

  /**
   * Obtiene un alumno por su ID.
   * Conexión API: return this.http.get<AlumnoDTO>(`${this.API_URL}?id=${id}`);
   */
  getAlumnoById(id: number): Observable<AlumnoDTO | undefined> {
    const alumno = this.alumnos.find(a => a.id === id);
    return of(alumno).pipe(delay(200));
  }

  /**
   * Procesa la solicitud de DataTables de forma asíncrona.
   * Ideal para integrarse con el procesamiento en el lado del servidor de PHP.
   */
  obtenerAlumnosDataTables(dataTablesParameters: any): Observable<any> {
    // Simulación de procesamiento de servidor (filtros, orden, paginación)
    const start = dataTablesParameters.start || 0;
    const length = dataTablesParameters.length || 10;
    const search = dataTablesParameters.search?.value?.toLowerCase() || '';

    let filtradas = [...this.alumnos];

    // Filtro de búsqueda
    if (search) {
      filtradas = filtradas.filter(a =>
        a.nombre.toLowerCase().includes(search) ||
        a.apellidos.toLowerCase().includes(search) ||
        a.dni.toLowerCase().includes(search) ||
        a.email.toLowerCase().includes(search)
      );
    }

    // Ordenación
    if (dataTablesParameters.order && dataTablesParameters.order.length > 0) {
      const colIdx = dataTablesParameters.order[0].column;
      const dir = dataTablesParameters.order[0].dir;
      const colName = dataTablesParameters.columns[colIdx].data;

      filtradas.sort((a: any, b: any) => {
        const valA = (a[colName] || '').toString().toLowerCase();
        const valB = (b[colName] || '').toString().toLowerCase();
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    // Respuesta en el formato que espera DataTables
    return of({
      draw: dataTablesParameters.draw,
      recordsTotal: this.alumnos.length,
      recordsFiltered: filtradas.length,
      data: filtradas.slice(start, start + length)
    }).pipe(delay(400));
  }

  /**
   * Registra un nuevo alumno.
   * Conexión API: return this.http.post<AlumnoDTO>(this.API_URL, alumno);
   */
  createAlumno(alumno: AlumnoDTO): Observable<AlumnoDTO> {
    const nuevo = { ...alumno, id: Math.max(...this.alumnos.map(a => a.id)) + 1 };
    this.alumnos.push(nuevo);
    return of(nuevo).pipe(delay(500));
  }

  /**
   * Actualiza los datos de un alumno existente.
   * Conexión API: return this.http.put<AlumnoDTO>(this.API_URL, alumno);
   */
  updateAlumno(alumno: AlumnoDTO): Observable<AlumnoDTO> {
    const index = this.alumnos.findIndex(a => a.id === alumno.id);
    if (index !== -1) this.alumnos[index] = { ...alumno };
    return of(alumno).pipe(delay(500));
  }

  /**
   * Elimina un alumno (o lo marca como inactivo).
   * Conexión API: return this.http.delete<boolean>(`${this.API_URL}?id=${id}`);
   */
  deleteAlumno(id: number): Observable<boolean> {
    const index = this.alumnos.findIndex(a => a.id === id);
    if (index !== -1) {
      this.alumnos.splice(index, 1);
      return of(true).pipe(delay(500));
    }
    return of(false);
  }
}
