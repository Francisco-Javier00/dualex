import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
  
  // URL de la API PHP
  private readonly API_URL = 'api/conActividades.php';

  /**
   * DATOS DE PRUEBA (MOCK)
   */
  private actividades: ActividadDTO[] = [
    { id: 1, titulo: 'Configuración de entorno de desarrollo', descripcion: 'Instalar y configurar IDE, Git y entorno local.', modulo: 'Sistemas Informáticos' },
    { id: 2, titulo: 'Análisis de requisitos del sistema', descripcion: 'Identificar y documentar los requisitos funcionales y no funcionales.', modulo: 'Entornos de Desarrollo' },
    { id: 3, titulo: 'Diseño de modelo de datos', descripcion: 'Crear el modelo entidad-relación y el esquema de base de datos.', modulo: 'Base de Datos' },
    { id: 4, titulo: 'Implementación de API REST', descripcion: 'Desarrollar los endpoints REST siguiendo el estándar OpenAPI.', modulo: 'Acceso a Datos' },
    { id: 5, titulo: 'Pruebas unitarias y de integración', descripcion: 'Redactar y ejecutar casos de prueba automatizados con JUnit.', modulo: 'Programación' },
    { id: 6, titulo: 'Despliegue en servidor de producción', descripcion: 'Publicar la aplicación en un servidor cloud con CI/CD.', modulo: 'Sistemas Informáticos' },
    { id: 7, titulo: 'Documentación técnica del proyecto', descripcion: 'Redactar la memoria técnica y el manual de usuario.', modulo: 'Proyecto de Desarrollo' },
    { id: 8, titulo: 'Revisión de código y refactorización', descripcion: 'Aplicar principios SOLID y patrones de diseño al código existente.', modulo: 'Programación' },
    { id: 9, titulo: 'Gestión de incidencias con Jira', descripcion: 'Registrar y gestionar el backlog del sprint en Jira.', modulo: 'Entornos de Desarrollo' },
    { id: 10, titulo: 'Optimización de consultas SQL', descripcion: 'Analizar y mejorar el rendimiento de las consultas a la base de datos.', modulo: 'Base de Datos' }
  ];

  /**
   * Obtiene el catálogo completo de actividades.
   * API: return this.http.get<ActividadDTO[]>(this.API_URL);
   */
  getActividades(): Observable<ActividadDTO[]> {
    return of([...this.actividades]).pipe(delay(200));
  }

  /**
   * Soporte para DataTables (procesamiento en servidor).
   */
  obtenerActividadesDataTables(dataTablesParameters: any): Observable<any> {
    const start = dataTablesParameters.start || 0;
    const length = dataTablesParameters.length || 10;
    const search = dataTablesParameters.search?.value?.toLowerCase() || '';

    let filtradas = this.actividades;
    if (search) {
      filtradas = filtradas.filter(a =>
        a.titulo.toLowerCase().includes(search) ||
        a.descripcion.toLowerCase().includes(search) ||
        a.modulo.toLowerCase().includes(search)
      );
    }

    return of({
      draw: dataTablesParameters.draw,
      recordsTotal: this.actividades.length,
      recordsFiltered: filtradas.length,
      data: filtradas.slice(start, start + length)
    }).pipe(delay(400));
  }
}
