import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfesorDTO } from '../../../dto/dualex.dto';

@Component({
  selector: 'app-profesor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profesor-modal.component.html',
  styleUrls: ['./profesor-modal.component.css']
})
export class ProfesorModalComponent implements OnInit {
  private _profesor: any | null = null;
  @Input() modo: 'crear' | 'editar' = 'crear';
  
  @Input() set profesor(val: any | null) {
    this._profesor = val;
    if (val) {
      this.syncProfesor(val);
    } else if (this.modo === 'crear') {
      this.resetForm();
    }
  }

  get profesor(): any | null {
    return this._profesor;
  }

  @Input() ciclosDisponibles: string[] = [];
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  nuevoProfesor: any = {
    nombre: '',
    apellidos: '',
    correo: '',
    rol: 'PROFESOR',
    ciclos: [] as string[]
  };

  ngOnInit(): void {
    // Si ya había datos al inicializar, sincronizamos
    if (this.profesor) this.syncProfesor(this.profesor);
  }

  private syncProfesor(profesor: any): void {
    let listaCiclos: string[] = [];
    if (Array.isArray(profesor.ciclos)) {
      listaCiclos = [...profesor.ciclos];
    } else if (typeof profesor.ciclos === 'string' && profesor.ciclos.trim() !== '') {
      listaCiclos = profesor.ciclos.split(',').map((c: string) => c.trim());
    }

    this.nuevoProfesor = {
      id: profesor.id,
      nombre: profesor.nombre || '',
      apellidos: profesor.apellidos || '',
      correo: profesor.correo || '',
      rol: profesor.rol || 'PROFESOR',
      ciclos: listaCiclos
    };
  }

  private resetForm(): void {
    this.nuevoProfesor = {
      nombre: '',
      apellidos: '',
      correo: '',
      rol: 'PROFESOR',
      ciclos: []
    };
  }

  onToggleCiclo(ciclo: string, checked: boolean): void {
    if (checked) {
      if (!this.nuevoProfesor.ciclos.includes(ciclo)) {
        this.nuevoProfesor.ciclos.push(ciclo);
      }
    } else {
      this.nuevoProfesor.ciclos = this.nuevoProfesor.ciclos.filter((c: string) => c !== ciclo);
    }
  }

  onGuardar(): void {
    this.guardar.emit(this.nuevoProfesor);
  }
}
