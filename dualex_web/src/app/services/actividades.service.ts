import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { delay } from 'rxjs/operators';

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
  private readonly API_URL = 'http://localhost:8080/index.php';

  private cacheActividades: ActividadDTO[] = [];

  /**
   * Obtiene el catálogo completo de actividades desde la DB.
   */
  getActividades(): Observable<ActividadDTO[]> {
    return this.http.get<ActividadDTO[]>(`${this.API_URL}?c=Actividades&m=listar`).pipe(
      tap(data => this.cacheActividades = data)
    );
  }

  /**
   * Soporte para DataTables (procesamiento en servidor simulado con datos reales).
   */
  obtenerActividadesDataTables(dataTablesParameters: any): Observable<any> {
    const start = dataTablesParameters.start || 0;
    const length = dataTablesParameters.length || 10;
    const search = dataTablesParameters.search?.value?.toLowerCase() || '';

    // Si no tenemos cache, cargamos primero
    if (this.cacheActividades.length === 0) {
      return this.getActividades().pipe(
        map(data => this.filtrarParaDataTables(data, start, length, search, dataTablesParameters.draw))
      );
    }

    return of(this.filtrarParaDataTables(this.cacheActividades, start, length, search, dataTablesParameters.draw));
  }

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
   * Registra una nueva actividad en el catálogo.
   */
  createActividad(actividad: ActividadDTO): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Actividades&m=crear`, actividad).pipe(
      tap(() => this.cacheActividades = []) // Limpiar cache para forzar recarga
    );
  }

  /**
   * Actualiza los datos de una actividad existente.
   */
  updateActividad(actividad: ActividadDTO): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Actividades&m=actualizar&id=${actividad.id}`, actividad).pipe(
      tap(() => this.cacheActividades = [])
    );
  }

  /**
   * Elimina una actividad del catálogo.
   */
  deleteActividad(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}?c=Actividades&m=eliminar&id=${id}`).pipe(
      tap(() => this.cacheActividades = [])
    );
  }
}
