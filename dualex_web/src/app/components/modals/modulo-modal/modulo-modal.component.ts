import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModuloDTO } from '../../../dto/dualex.dto';

@Component({
  selector: 'app-modulo-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modulo-modal.component.html',
  styleUrls: ['./modulo-modal.component.css']
})
export class ModuloModalComponent implements OnChanges, OnDestroy {
  private fb = inject(FormBuilder);
  private renderer = inject(Renderer2);

  @Input() visible = false;
  @Input() modulo: ModuloDTO | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardarEvent = new EventEmitter<ModuloDTO>();
  @Output() cancelarEvent = new EventEmitter<void>();

  moduloForm: FormGroup;

  constructor() {
    this.moduloForm = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required]],
      siglas: ['', [Validators.required]],
      ciclo: ['', [Validators.required]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.toggleBodyScroll(changes['visible'].currentValue);
    }

    if (changes['modulo'] && this.modulo) {
      this.moduloForm.patchValue(this.modulo);
    } else if (changes['visible'] && changes['visible'].currentValue === true && !this.modulo) {
      this.moduloForm.reset();
    }
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

  onSubmit(): void {
    if (this.moduloForm.valid) {
      this.guardarEvent.emit(this.moduloForm.value);
      this.cerrar();
    } else {
      this.moduloForm.markAllAsTouched();
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancelarEvent.emit();
    this.toggleBodyScroll(false);
  }

  ngOnDestroy(): void {
    this.toggleBodyScroll(false);
  }
}
