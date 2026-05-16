import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, Renderer2, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModuloDTO, CicloDTO } from '../../../dto/dualex.dto';
import { CiclosService } from '../../../services/ciclos.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-modulo-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modulo-modal.component.html',
  styleUrls: ['./modulo-modal.component.css']
})
export class ModuloModalComponent implements OnInit, OnChanges, OnDestroy {
  private fb = inject(FormBuilder);
  private renderer = inject(Renderer2);
  private ciclosService = inject(CiclosService);
  private alertService = inject(AlertService);

  @Input() visible = false;
  @Input() modulo: any | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardarEvent = new EventEmitter<any>();
  @Output() cancelarEvent = new EventEmitter<void>();

  ciclos: CicloDTO[] = [];
  moduloForm: FormGroup;

  constructor() {
    this.moduloForm = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      sigla: ['', [Validators.required, Validators.maxLength(5)]],
      idCiclo: [null, [Validators.required]],
      color: ['#4e73df', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.cargarCiclos();
  }

  cargarCiclos(): void {
    this.ciclosService.getCiclos().subscribe(ciclos => {
      this.ciclos = ciclos;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.toggleBodyScroll(changes['visible'].currentValue);
    }

    if (changes['modulo'] && this.modulo) {
      this.moduloForm.patchValue({
        id: this.modulo.id,
        nombre: this.modulo.nombre,
        sigla: this.modulo.sigla,
        idCiclo: this.modulo.idCiclo,
        color: this.modulo.color || '#4e73df'
      });
    } else if (changes['visible'] && changes['visible'].currentValue === true && !this.modulo) {
      this.moduloForm.reset({
        color: '#4e73df'
      });
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
    } else {
      this.moduloForm.markAllAsTouched();
      this.alertService.advertencia('Formulario Incompleto', 'Por favor, rellena todos los campos obligatorios.');
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
