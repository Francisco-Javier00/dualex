import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ModuloDTO } from '../dto/dualex.dto';

@Injectable({
  providedIn: 'root'
})
export class ModulosService {
  private http = inject(HttpClient);
  
  private readonly API_URL = 'api/conModulos.php';

  // Datos de prueba (MOCK)
  private modulos: ModuloDTO[] = [
    { id: 1, nombre: 'Sistemas Informáticos', siglas: 'SI', ciclo: 'DAW' },
    { id: 2, nombre: 'Base de Datos', siglas: 'BD', ciclo: 'DAW' },
    { id: 3, nombre: 'Programación', siglas: 'PRO', ciclo: 'DAW' },
    { id: 4, nombre: 'Entornos de Desarrollo', siglas: 'ED', ciclo: 'DAW' },
    { id: 5, nombre: 'Desarrollo Web en Entorno Cliente', siglas: 'DWEC', ciclo: 'DAW' },
    { id: 6, nombre: 'Sistemas Gestores de Bases de Datos', siglas: 'SGBD', ciclo: 'ASIR' },
    { id: 7, nombre: 'Seguridad y Alta Disponibilidad', siglas: 'SAD', ciclo: 'ASIR' }
  ];

  getModulos(): Observable<ModuloDTO[]> {
    return of([...this.modulos]).pipe(delay(300));
  }

  obtenerModulosDataTables(dataTablesParameters: any): Observable<any> {
    const start = dataTablesParameters.start || 0;
    const length = dataTablesParameters.length || 10;
    const search = dataTablesParameters.search?.value?.toLowerCase() || '';

    let filtrados = this.modulos;
    if (search) {
      filtrados = filtrados.filter(m =>
        m.nombre.toLowerCase().includes(search) ||
        m.siglas.toLowerCase().includes(search) ||
        m.ciclo.toLowerCase().includes(search)
      );
    }

    return of({
      draw: dataTablesParameters.draw,
      recordsTotal: this.modulos.length,
      recordsFiltered: filtrados.length,
      data: filtrados.slice(start, start + length)
    }).pipe(delay(400));
  }

  createModulo(modulo: ModuloDTO): Observable<ModuloDTO> {
    const nuevo = { ...modulo, id: this.modulos.length > 0 ? Math.max(...this.modulos.map(m => m.id)) + 1 : 1 };
    this.modulos.unshift(nuevo);
    return of(nuevo).pipe(delay(500));
  }

  updateModulo(modulo: ModuloDTO): Observable<ModuloDTO> {
    const index = this.modulos.findIndex(m => m.id === modulo.id);
    if (index !== -1) {
      this.modulos[index] = { ...modulo };
    }
    return of(modulo).pipe(delay(500));
  }

  deleteModulo(id: number): Observable<boolean> {
    const index = this.modulos.findIndex(m => m.id === id);
    if (index !== -1) {
      this.modulos.splice(index, 1);
      return of(true).pipe(delay(400));
    }
    return of(false);
  }
}
