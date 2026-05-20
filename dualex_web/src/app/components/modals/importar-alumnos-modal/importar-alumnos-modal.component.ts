import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, Renderer2, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursoDTO } from '../../../dto/dualex.dto';

interface CursoFormateado {
  id: number;
  gradoStr: string; // "1º" o "2º"
  cicloNombre: string; // e.g. "Desarrollo de Aplicaciones Web"
  anoEscolar: string;
}

@Component({
  selector: 'app-importar-alumnos-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './importar-alumnos-modal.component.html',
  styleUrls: ['./importar-alumnos-modal.component.css']
})
export class ImportarAlumnosModalComponent implements OnChanges, OnDestroy {
  private renderer = inject(Renderer2);

  @Input() visible = false;
  @Input() todosLosCursos: CursoDTO[] = [];
  @Input() importando = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() importar = new EventEmitter<{ file: File, idCurso: number }>();

  cursosFormateados: CursoFormateado[] = [];
  idCursoSeleccionado: number | null = null;
  archivoSeleccionado: File | null = null;
  submitted = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['todosLosCursos'] && this.todosLosCursos) {
      this.cursosFormateados = this.todosLosCursos.map(c => {
        // Obtenemos el grado a partir de la primera letra del nombre del curso
        const gradoStr = c.nombre.trim().startsWith('1') ? '1º' : c.nombre.trim().startsWith('2') ? '2º' : c.nombre;
        return {
          id: c.id,
          gradoStr: gradoStr,
          cicloNombre: c.ciclo || 'Ciclo Formativo',
          anoEscolar: c.anoEscolar || c.anio_escolar || ''
        };
      });
    }

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
    this.idCursoSeleccionado = null;
    this.archivoSeleccionado = null;
    this.submitted = false;
  }

  seleccionarCurso(id: number): void {
    this.idCursoSeleccionado = id;
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      this.archivoSeleccionado = file;
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
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
    if (this.idCursoSeleccionado && this.archivoSeleccionado) {
      this.importar.emit({
        file: this.archivoSeleccionado,
        idCurso: this.idCursoSeleccionado
      });
    }
  }
}
