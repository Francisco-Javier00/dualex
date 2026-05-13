import { Injectable } from '@angular/core';
import { CursoDTO } from '../dto/dualex.dto';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CursosService {
  private cursos: CursoDTO[] = [
    { id: 2, nombre: '1º DAW', curso: 1, anoEscolar: '25-26', ciclo: 'Desarrollo de Aplicaciones Web' },
    { id: 3, nombre: '1º SMR', curso: 1, anoEscolar: '25-26', ciclo: 'Sistemas Microinformáticos y Redes' },
    { id: 4, nombre: '2º SMR', curso: 2, anoEscolar: '25-26', ciclo: 'Sistemas Microinformáticos y Redes' },
    { id: 5, nombre: '2º DAW', curso: 2, anoEscolar: '25-26', ciclo: 'Desarrollo de Aplicaciones Web' },
    { id: 6, nombre: '1º EMV', curso: 1, anoEscolar: '25-26', ciclo: 'Electromecánica de Vehículos' },
    { id: 7, nombre: '1º MI', curso: 1, anoEscolar: '25-26', ciclo: 'Mecatrónica Industrial' }
  ];

  constructor() { }

  getCursos(): Observable<CursoDTO[]> {
    return of([...this.cursos]);
  }

  addCurso(curso: CursoDTO): Observable<CursoDTO> {
    this.cursos.push(curso);
    return of(curso);
  }

  updateCurso(id: number, cursoActualizado: CursoDTO): Observable<CursoDTO> {
    const index = this.cursos.findIndex(c => c.id === id);
    if (index !== -1) {
      this.cursos[index] = cursoActualizado;
    }
    return of(cursoActualizado);
  }

  deleteCurso(id: number): Observable<boolean> {
    this.cursos = this.cursos.filter(c => c.id !== id);
    return of(true);
  }
}
