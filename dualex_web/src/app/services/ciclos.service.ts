import { Injectable } from '@angular/core';
import { Ciclo } from '../dto/ciclo.dto';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CiclosService {
  private ciclos: Ciclo[] = [
    { nombre: 'Desarrollo de Aplicaciones Web', siglas: 'DAW', grado: 'Grado Superior' },
    { nombre: 'Electromecánica de Vehículos', siglas: 'EMV', grado: 'Grado Medio' },
    { nombre: 'Sistemas Microinformáticos y Redes', siglas: 'SMR', grado: 'Grado Medio' },
    { nombre: 'Mecatrónica Industrial', siglas: 'MI', grado: 'Grado Superior' },
    { nombre: 'Gestión Administrativa', siglas: 'GA', grado: 'Grado Medio' }
  ];

  constructor() {}

  getCiclos(): Observable<Ciclo[]> {
    return of([...this.ciclos]);
  }

  addCiclo(ciclo: Ciclo): Observable<Ciclo> {
    this.ciclos.push(ciclo);
    return of(ciclo);
  }

  updateCiclo(siglasOriginales: string, cicloActualizado: Ciclo): Observable<Ciclo> {
    const index = this.ciclos.findIndex(c => c.siglas === siglasOriginales);
    if (index !== -1) {
      this.ciclos[index] = cicloActualizado;
    }
    return of(cicloActualizado);
  }

  deleteCiclo(siglas: string): Observable<boolean> {
    this.ciclos = this.ciclos.filter(c => c.siglas !== siglas);
    return of(true);
  }

  // Helper para el selector en cursos
  getCiclosExistentes() {
    return this.ciclos.map(c => ({ nombre: c.nombre, siglas: c.siglas }));
  }
}
