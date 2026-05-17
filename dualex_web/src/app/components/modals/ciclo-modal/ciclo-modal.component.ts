import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-ciclo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ciclo-modal.component.html',
  styleUrl: './ciclo-modal.component.css'
})
export class CicloModalComponent implements OnInit, OnDestroy {
  private renderer = inject(Renderer2);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);

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

  cicloForm: FormGroup = this.fb.group({
    id: [null],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    siglas: ['', [Validators.required, Validators.maxLength(5)]],
    grado: ['superior', [Validators.required]]
  });

  ngOnInit(): void {
    this.toggleBodyScroll(true);
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

  private syncCiclo(ciclo: any): void {
    this.cicloForm.patchValue({
      id: ciclo.id,
      nombre: ciclo.nombre || '',
      siglas: ciclo.siglas || '',
      grado: ciclo.grado || 'superior'
    });
  }

  private resetForm(): void {
    if (this.cicloForm) {
      this.cicloForm.reset({
        grado: 'superior'
      });
    }
  }

  onGuardar(): void {
    if (this.cicloForm.valid) {
      this.guardar.emit(this.cicloForm.value);
    } else {
      this.cicloForm.markAllAsTouched();
      this.alertService.advertencia('Formulario Incompleto', 'Por favor, revisa los campos marcados en rojo antes de continuar.');
    }
  }

  formatearCursos(siglas: string): string {
    return siglas ? `1º ${siglas.toUpperCase()}, 2º ${siglas.toUpperCase()}` : '';
  }
}
