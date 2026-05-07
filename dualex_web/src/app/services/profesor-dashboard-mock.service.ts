import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ModuloProfesor } from '../dto/dualex.dto';

@Injectable({
  providedIn: 'root'
})
export class ProfesorDashboardMockService {

  // Datos de prueba que simulan los módulos asignados al profesor (JOIN MODULOS + MODULO_PROFESOR)
  private modulosMock: ModuloProfesor[] = [
    { idModulo: 1, nombre: 'Sistemas Informáticos',     sigla: 'SI',  color: '#1565C0', numAlumnos: 24, numActividades: 8 },
    { idModulo: 2, nombre: 'Base de Datos',             sigla: 'BD',  color: '#2E7D32', numAlumnos: 24, numActividades: 12 },
    { idModulo: 3, nombre: 'Programación',              sigla: 'PRO', color: '#6A1B9A', numAlumnos: 24, numActividades: 15 },
    { idModulo: 4, nombre: 'Entornos de Desarrollo',    sigla: 'ED',  color: '#E65100', numAlumnos: 24, numActividades: 6 },
    { idModulo: 5, nombre: 'Acceso a Datos',            sigla: 'AD',  color: '#00695C', numAlumnos: 22, numActividades: 10 }
  ];

  obtenerModulosDelProfesor(): Observable<ModuloProfesor[]> {
    // TODO: reemplazar con llamada real al backend: GET /api/profesor/{id}/modulos
    return of(this.modulosMock).pipe(delay(300));
  }
}
