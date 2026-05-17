import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActividadDTO } from '../dto/dualex.dto';

/**
 * Servicio para gestionar el catálogo maestro de actividades.
 * Conecta con la tabla ACTIVIDADES de la DB.
 */
@Injectable({
  providedIn: 'root'
})
export class ActividadesService {
  private http = inject(HttpClient);

  // URL de la API PHP (Docker Compose mapea dualex_back directamente al puerto 8080)
  private readonly API_URL = `${environment.apiUrl}/index.php`;

  private cacheActividades: ActividadDTO[] = [];

  /**
   * Obtiene el catálogo completo de actividades desde la base de datos.
   * Almacena el resultado en una caché local para agilizar futuras consultas.
   * 
   * @returns Un `Observable` que emite un array con la lista completa de actividades.
   */
  getActividades(): Observable<ActividadDTO[]> {
    return this.http.get<ActividadDTO[]>(`${this.API_URL}?c=Actividades&m=listar`).pipe(
      tap((data: ActividadDTO[]) => this.cacheActividades = data)
    );
  }

  /**
   * Proporciona soporte para la integración con DataTables, simulando un procesamiento en el servidor 
   * pero utilizando datos reales filtrados de la caché o de la base de datos.
   * 
   * @param dataTablesParameters Parámetros de paginación, búsqueda y ordenación enviados por DataTables.
   * @returns Un `Observable` con la estructura requerida por DataTables (draw, recordsTotal, recordsFiltered, data).
   */
  obtenerActividadesDataTables(dataTablesParameters: any): Observable<any> {
    const start = dataTablesParameters.start || 0;
    const length = dataTablesParameters.length || 10;
    const search = dataTablesParameters.search?.value?.toLowerCase() || '';

    // Si no tenemos cache, cargamos primero
    if (this.cacheActividades.length === 0) {
      return this.getActividades().pipe(
        map((data: ActividadDTO[]) => this.filtrarParaDataTables(data, start, length, search, dataTablesParameters.draw))
      );
    }

    return of(this.filtrarParaDataTables(this.cacheActividades, start, length, search, dataTablesParameters.draw));
  }

  /**
   * Filtra y pagina de forma interna un array de actividades basándose en los parámetros de búsqueda.
   * 
   * @param lista Array completo de actividades a filtrar.
   * @param start Índice de inicio para la paginación.
   * @param length Cantidad de registros por página.
   * @param search Texto de búsqueda introducido por el usuario.
   * @param draw Identificador de la petición para DataTables.
   * @returns Objeto estructurado para la respuesta a DataTables.
   */
  private filtrarParaDataTables(lista: ActividadDTO[], start: number, length: number, search: string, draw: number) {
    let filtradas = lista;
    if (search) {
      filtradas = filtradas.filter(a =>
        a.titulo.toLowerCase().includes(search) ||
        a.descripcion.toLowerCase().includes(search) ||
        a.modulo.toLowerCase().includes(search)
      );
    }

    return {
      draw: draw,
      recordsTotal: lista.length,
      recordsFiltered: filtradas.length,
      data: filtradas.slice(start, start + length)
    };
  }

  /**
   * Registra una nueva actividad en el catálogo maestro y limpia la caché para forzar su recarga.
   * 
   * @param actividad Objeto con los datos de la nueva actividad.
   * @returns Un `Observable` con la respuesta del servidor tras la creación.
   */
  createActividad(actividad: ActividadDTO): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Actividades&m=crear`, actividad).pipe(
      tap(() => this.cacheActividades = []) // Limpiar cache para forzar recarga
    );
  }

  /**
   * Actualiza los datos de una actividad existente y limpia la caché.
   * 
   * @param actividad Objeto con los datos actualizados de la actividad.
   * @returns Un `Observable` con la respuesta del servidor.
   */
  updateActividad(actividad: ActividadDTO): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Actividades&m=actualizar&id=${actividad.id}`, actividad).pipe(
      tap(() => this.cacheActividades = [])
    );
  }

  /**
   * Elimina una actividad del catálogo maestro de forma permanente.
   * 
   * @param id Identificador único de la actividad a eliminar.
   * @returns Un `Observable` con el resultado de la eliminación en base de datos.
   */
  deleteActividad(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}?c=Actividades&m=eliminar&id=${id}`).pipe(
      tap(() => this.cacheActividades = [])
    );
  }
}
