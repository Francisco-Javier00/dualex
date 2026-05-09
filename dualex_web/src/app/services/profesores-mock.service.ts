import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ProfesorDTO } from '../dto/dualex.dto';

@Injectable({
  providedIn: 'root'
})
export class ProfesoresMockService {
  private profesoresMock: ProfesorDTO[] = [
    { id: 1, nombre: 'Isabel', apellidos: 'García López', correo: 'isabel.garcia@dualex.com', rol: 'PROFESOR', modulos: 'S.I., SER., B.D.', ciclos: 'SMR, DAW' },
    { id: 2, nombre: 'Alberto', apellidos: 'Martín Pérez', correo: 'alberto.martin@dualex.com', rol: 'PROFESOR', modulos: 'S.I., SER., B.D.', ciclos: 'SMR DAW' },
    { id: 3, nombre: 'Tomás', apellidos: 'Sánchez Ruiz', correo: 'tomas.sanchez@dualex.com', rol: 'PROFESOR', modulos: 'S.I., SER., B.D.', ciclos: 'ME, MI' },
    { id: 4, nombre: 'Paco', apellidos: 'Fernández Díaz', correo: 'paco.fernandez@dualex.com', rol: 'PROFESOR', modulos: 'S.I., SER., B.D.', ciclos: 'SMR' },
    { id: 5, nombre: 'Ernesto', apellidos: 'Romero Castro', correo: 'ernesto.romero@dualex.com', rol: 'COORDINADOR', modulos: 'S.I., SER., B.D.', ciclos: 'GA' },
    { id: 6, nombre: 'Magdalena', apellidos: 'Ortega Molina', correo: 'magdalena.ortega@dualex.com', rol: 'COORDINADOR', modulos: 'S.I., SER., B.D.', ciclos: 'SMR DAW' },
    { id: 7, nombre: 'Luis', apellidos: 'Navarro Gil', correo: 'luis.navarro@dualex.com', rol: 'COORDINADOR', modulos: 'S.I., SER., B.D.', ciclos: 'SMR DAW' },
    { id: 8, nombre: 'Isabel', apellidos: 'Gil Moreno', correo: 'isabel.gil@dualex.com', rol: 'PROFESOR', modulos: 'S.I., SER., B.D.', ciclos: 'DAW, DAM' },
    { id: 9, nombre: 'Alberto', apellidos: 'Vega Torres', correo: 'alberto.vega@dualex.com', rol: 'PROFESOR', modulos: 'S.I., SER., B.D.', ciclos: 'DAW' },
    { id: 10, nombre: 'Tomás', apellidos: 'Iglesias León', correo: 'tomas.iglesias@dualex.com', rol: 'PROFESOR', modulos: 'S.I., SER., B.D.', ciclos: 'SMR, DAW' },
    { id: 11, nombre: 'Paco', apellidos: 'Prieto Ramos', correo: 'paco.prieto@dualex.com', rol: 'COORDINADOR', modulos: 'S.I., SER., B.D.', ciclos: 'GA, MI' },
    { id: 12, nombre: 'Ernesto', apellidos: 'López Marín', correo: 'ernesto.lopez@dualex.com', rol: 'PROFESOR', modulos: 'S.I., SER., B.D.', ciclos: 'SMR' }
  ];

  obtenerProfesoresDataTables(dataTablesParameters: any): Observable<any> {
    const start = dataTablesParameters.start || 0;
    const length = dataTablesParameters.length || 10;
    const search = dataTablesParameters.search?.value?.toLowerCase() || '';

    let filtrados = this.profesoresMock;

    if (search) {
      filtrados = filtrados.filter(profesor =>
        profesor.nombre.toLowerCase().includes(search) ||
        profesor.apellidos.toLowerCase().includes(search) ||
        profesor.correo.toLowerCase().includes(search) ||
        profesor.rol.toLowerCase().includes(search) ||
        profesor.modulos.toLowerCase().includes(search) ||
        profesor.ciclos.toLowerCase().includes(search)
      );
    }

    if (dataTablesParameters.order && dataTablesParameters.order.length > 0) {
      const orderColumnIndex = dataTablesParameters.order[0].column;
      const orderDir = dataTablesParameters.order[0].dir;
      const columnName = dataTablesParameters.columns[orderColumnIndex]?.data;

      if (columnName) {
        filtrados = [...filtrados].sort((a: any, b: any) => {
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
      recordsTotal: this.profesoresMock.length,
      recordsFiltered: filtrados.length,
      data: filtrados.slice(start, start + length)
    }).pipe(delay(400));
  }

  eliminarProfesor(id: number): void {
    this.profesoresMock = this.profesoresMock.filter(profesor => profesor.id !== id);
  }
}
