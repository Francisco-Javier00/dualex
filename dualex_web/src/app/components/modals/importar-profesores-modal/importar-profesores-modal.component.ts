import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, Renderer2, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-importar-profesores-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './importar-profesores-modal.component.html',
  styleUrls: ['./importar-profesores-modal.component.css']
})
export class ImportarProfesoresModalComponent implements OnChanges, OnDestroy {
  private renderer = inject(Renderer2);

  @Input() visible = false;
  @Input() importando = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() importar = new EventEmitter<File>();

  archivoSeleccionado: File | null = null;
  submitted = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.toggleBodyScroll(this.visible);
      if (!this.visible) {
        this.resetForm();
      }
    }
  }

  ngOnDestroy(): void {
    this.toggleBodyScroll(false);
  }

  private toggleBodyScroll(isVisible: boolean): void {
    if (isVisible) {
      this.renderer.addClass(document.documentElement, 'modal-open');
      this.renderer.addClass(document.body, 'modal-open');
    } else {
      this.renderer.removeClass(document.documentElement, 'modal-open');
      this.renderer.removeClass(document.body, 'modal-open');
    }
  }

  resetForm(): void {
    this.archivoSeleccionado = null;
    this.submitted = false;
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))) {
      this.archivoSeleccionado = file;
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))) {
      this.archivoSeleccionado = file;
    }
  }

  quitarArchivo(event: Event): void {
    event.stopPropagation();
    this.archivoSeleccionado = null;
  }

  onCerrar(): void {
    this.cerrar.emit();
  }

  onImportar(): void {
    this.submitted = true;
    if (this.archivoSeleccionado) {
      this.importar.emit(this.archivoSeleccionado);
    }
  }
}
