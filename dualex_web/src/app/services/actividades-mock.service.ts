import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface ActividadDTO {
  id: number;
  titulo: string;
  descripcion: string;
  modulo: string;       // Nombre del módulo relacionado (join de MODULO_ACTIVIDADES + MODULOS)
  coordinador: string;  // Nombre del coordinador que la creó (join de USUARIOS)
}

@Injectable({
  providedIn: 'root'
})
export class ActividadesMockService {

  private actividadesMocks: ActividadDTO[] = [
    { id: 1, titulo: 'Configuración de entorno de desarrollo', descripcion: 'Instalar y configurar IDE, Git y entorno local.', modulo: 'Sistemas Informáticos', coordinador: 'Juan Carlos Díaz del Castillo' },
    { id: 2, titulo: 'Análisis de requisitos del sistema', descripcion: 'Identificar y documentar los requisitos funcionales y no funcionales.', modulo: 'Entornos de Desarrollo', coordinador: 'Juan Carlos Díaz del Castillo' },
    { id: 3, titulo: 'Diseño de modelo de datos', descripcion: 'Crear el modelo entidad-relación y el esquema de base de datos.', modulo: 'Base de Datos', coordinador: 'Juan Carlos Díaz del Castillo' },
    { id: 4, titulo: 'Implementación de API REST', descripcion: 'Desarrollar los endpoints REST siguiendo el estándar OpenAPI.', modulo: 'Acceso a Datos', coordinador: 'Juan Carlos Díaz del Castillo' },
    { id: 5, titulo: 'Pruebas unitarias y de integración', descripcion: 'Redactar y ejecutar casos de prueba automatizados con JUnit.', modulo: 'Programación', coordinador: 'Juan Carlos Díaz del Castillo' },
    { id: 6, titulo: 'Despliegue en servidor de producción', descripcion: 'Publicar la aplicación en un servidor cloud con CI/CD.', modulo: 'Sistemas Informáticos', coordinador: 'Juan Carlos Díaz del Castillo' },
    { id: 7, titulo: 'Documentación técnica del proyecto', descripcion: 'Redactar la memoria técnica y el manual de usuario.', modulo: 'Proyecto de Desarrollo', coordinador: 'Juan Carlos Díaz del Castillo' },
    { id: 8, titulo: 'Revisión de código y refactorización', descripcion: 'Aplicar principios SOLID y patrones de diseño al código existente.', modulo: 'Programación', coordinador: 'Juan Carlos Díaz del Castillo' },
    { id: 9, titulo: 'Gestión de incidencias con Jira', descripcion: 'Registrar y gestionar el backlog del sprint en Jira.', modulo: 'Entornos de Desarrollo', coordinador: 'Juan Carlos Díaz del Castillo' },
    { id: 10, titulo: 'Optimización de consultas SQL', descripcion: 'Analizar y mejorar el rendimiento de las consultas a la base de datos.', modulo: 'Base de Datos', coordinador: 'Juan Carlos Díaz del Castillo' }
  ];

  obtenerActividadesDataTables(dataTablesParameters: any): Observable<any> {
    const start = dataTablesParameters.start || 0;
    const length = dataTablesParameters.length || 10;
    const search = dataTablesParameters.search?.value?.toLowerCase() || '';

    let filtradas = this.actividadesMocks;
    if (search) {
      filtradas = filtradas.filter(a =>
        a.titulo.toLowerCase().includes(search) ||
        a.descripcion.toLowerCase().includes(search) ||
        a.modulo.toLowerCase().includes(search) ||
        a.coordinador.toLowerCase().includes(search)
      );
    }

    if (dataTablesParameters.order && dataTablesParameters.order.length > 0) {
      const orderColumnIndex = dataTablesParameters.order[0].column;
      const orderDir = dataTablesParameters.order[0].dir;
      const columnName = dataTablesParameters.columns[orderColumnIndex]?.data;

      if (columnName) {
        filtradas.sort((a: any, b: any) => {
          const valA = a[columnName]?.toString().toLowerCase() ?? '';
          const valB = b[columnName]?.toString().toLowerCase() ?? '';
          if (valA < valB) return orderDir === 'asc' ? -1 : 1;
          if (valA > valB) return orderDir === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    return of({
      draw: dataTablesParameters.draw,
      recordsTotal: this.actividadesMocks.length,
      recordsFiltered: filtradas.length,
      data: filtradas.slice(start, start + length)
    }).pipe(delay(400));
  }
}
