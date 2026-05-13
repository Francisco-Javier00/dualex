import { Injectable } from '@angular/core';
import { CicloDTO } from '../dto/dualex.dto';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CiclosService {
  private ciclos: CicloDTO[] = [
    this.crearCiclo({ nombre: 'Desarrollo de Aplicaciones Web', siglas: 'DAW', grado: 'Grado Superior' }),
    this.crearCiclo({ nombre: 'Electromecánica de Vehículos', siglas: 'EMV', grado: 'Grado Medio' }),
    this.crearCiclo({ nombre: 'Sistemas Microinformáticos y Redes', siglas: 'SMR', grado: 'Grado Medio' }),
    this.crearCiclo({ nombre: 'Mecatrónica Industrial', siglas: 'MI', grado: 'Grado Superior' }),
    this.crearCiclo({ nombre: 'Gestión Administrativa', siglas: 'GA', grado: 'Grado Medio' })
  ];

  constructor() { }

  getCiclos(): Observable<CicloDTO[]> {
    return of([...this.ciclos]);
  }

  addCiclo(ciclo: CicloDTO): Observable<CicloDTO> {
    const nuevoCiclo = this.crearCiclo(ciclo);
    this.ciclos.push(nuevoCiclo);
    return of(nuevoCiclo);
  }

  updateCiclo(siglasOriginales: string, cicloActualizado: CicloDTO): Observable<CicloDTO> {
    const cicloNormalizado = this.crearCiclo(cicloActualizado);
    const index = this.ciclos.findIndex(c => c.siglas === siglasOriginales);
    if (index !== -1) {
      this.ciclos[index] = cicloNormalizado;
    }
    return of(cicloNormalizado);
  }

  deleteCiclo(siglas: string): Observable<boolean> {
    this.ciclos = this.ciclos.filter(c => c.siglas !== siglas);
    return of(true);
  }

  // Helper para el selector en cursos
  getCiclosExistentes() {
    return this.ciclos.map(c => ({ nombre: c.nombre, siglas: c.siglas }));
  }

  private crearCiclo(ciclo: CicloDTO): CicloDTO {
    return {
      ...ciclo,
      cursos: this.formatearCursos(ciclo.siglas)
    };
  }

  private formatearCursos(siglas: string): string {
    return `1${siglas}, 2${siglas}`;
  }
}
