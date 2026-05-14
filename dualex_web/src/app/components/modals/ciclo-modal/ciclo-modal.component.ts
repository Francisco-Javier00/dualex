import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ciclo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ciclo-modal.component.html',
  styleUrl: './ciclo-modal.component.css'
})
export class CicloModalComponent {
  private _ciclo: any | null = null;
  @Input() modo: 'crear' | 'editar' = 'crear';
  
  @Input() set ciclo(val: any | null) {
    this._ciclo = val;
    if (val) {
      this.syncCiclo(val);
    } else {
      this.resetForm();
    }
  }

  get ciclo(): any | null {
    return this._ciclo;
  }

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  cicloForm: any = {
    nombre: '',
    siglas: '',
    grado: 'superior',
    cursos: ''
  };

  private syncCiclo(ciclo: any): void {
    this.cicloForm = {
      id: ciclo.id,
      nombre: ciclo.nombre || '',
      siglas: ciclo.siglas || '',
      grado: ciclo.grado || 'superior',
      cursos: ciclo.cursos || ''
    };
  }

  private resetForm(): void {
    this.cicloForm = {
      nombre: '',
      siglas: '',
      grado: 'superior',
      cursos: ''
    };
  }

  onGuardar(): void {
    this.guardar.emit(this.cicloForm);
  }

  formatearCursos(siglas: string): string {
    return siglas ? `1º ${siglas.toUpperCase()}, 2º ${siglas.toUpperCase()}` : '';
  }
}
