import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vincular-coordinador-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vincular-coordinador-modal.component.html'
})
export class VincularCoordinadorModalComponent {
  @Input() visible = false;
  @Input() ciclo: any = null;
  @Input() todosLosProfesores: any[] = [];
  @Input() coordinadorId: number | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardarEvent = new EventEmitter<number | null>();
  @Output() cancelarEvent = new EventEmitter<void>();

  tempCoordinadorId: number | null = null;
  filtroProfesor = '';

  get profesoresFiltrados(): any[] {
    const busqueda = this.filtroProfesor.toLowerCase().trim();
    if (!busqueda) return this.todosLosProfesores;
    return this.todosLosProfesores.filter(p =>
      p.nombre.toLowerCase().includes(busqueda) ||
      p.apellidos.toLowerCase().includes(busqueda) ||
      p.correo.toLowerCase().includes(busqueda)
    );
  }

  ngOnChanges() {
    this.tempCoordinadorId = this.coordinadorId;
  }

  seleccionarCoordinador(id: number | null) {
    this.tempCoordinadorId = id;
  }

  isCoordinador(id: number | null) {
    return this.tempCoordinadorId === id;
  }

  cerrar() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancelarEvent.emit();
  }

  guardar() {
    // Permitir guardar null explícitamente si se seleccionó 'Sin Coordinador'
    if (this.tempCoordinadorId !== undefined) {
      this.guardarEvent.emit(this.tempCoordinadorId);
    }
  }
}
