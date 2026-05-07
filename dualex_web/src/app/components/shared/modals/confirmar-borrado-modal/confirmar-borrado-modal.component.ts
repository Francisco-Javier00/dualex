import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirmar-borrado-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmar-borrado-modal.component.html',
  styleUrls: ['./confirmar-borrado-modal.component.css']
})
export class ConfirmarBorradoModalComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() titulo: string = 'Eliminar';
  @Input() mensaje: string = '¿Estás seguro de que deseas eliminar este elemento?';
  @Input() palabraClave: string = 'confirmar';

  @Output() confirmarEvent = new EventEmitter<void>();
  @Output() cancelarEvent = new EventEmitter<void>();

  textoInput: string = '';

  get puedeConfirmar(): boolean {
    return this.textoInput.toLowerCase().trim() === this.palabraClave.toLowerCase().trim();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Limpiar el input cada vez que el modal se abre
    if (changes['visible'] && changes['visible'].currentValue === true) {
      this.textoInput = '';
    }
  }

  onConfirmar(): void {
    if (this.puedeConfirmar) {
      this.confirmarEvent.emit();
      this.textoInput = '';
    }
  }

  onCancelar(): void {
    this.textoInput = '';
    this.cancelarEvent.emit();
  }
}
