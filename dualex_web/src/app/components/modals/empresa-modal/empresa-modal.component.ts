import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { EmpresaDTO } from '../../../dto/dualex.dto';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-empresa-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './empresa-modal.component.html',
  styleUrl: './empresa-modal.component.css'
})
export class EmpresaModalComponent implements OnInit, OnDestroy {
  private renderer = inject(Renderer2);
  private alertService = inject(AlertService);
  private _empresa: EmpresaDTO | null = null;

  @Input() set empresa(val: EmpresaDTO | null) {
    this._empresa = val;
    if (val) {
      this.patchForm(val);
    } else {
      this.resetForm();
    }
  }

  get empresa(): EmpresaDTO | null {
    return this._empresa;
  }

  @Input() modo: 'crear' | 'editar' | 'enlazar' = 'crear';
  @Input() ciclosDisponibles: string[] = [];
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  empresaForm: FormGroup;
  ciclosSeleccionados: { sigla: string, tutor: string }[] = [];

  // Patrones de validación
  urlPattern = /^https?:\/\/.*$/;
  telefonoPattern = /^[0-9+ \-]+$/;
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  constructor(private fb: FormBuilder) {
    this.empresaForm = this.fb.group({
      siglas: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(6)]],
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      convenioUrl: ['', [Validators.required, Validators.pattern(this.urlPattern)]],
      inicioConvenio: ['', Validators.required],
      finConvenio: [{ value: '', disabled: true }],
      contacto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      numeroContacto: ['', [Validators.required, Validators.pattern(this.telefonoPattern), Validators.minLength(9), Validators.maxLength(15)]],
      correo: ['', [Validators.required, Validators.pattern(this.emailPattern), Validators.maxLength(100)]],
      contactosAdicionales: this.fb.array([])
    });
  }

  // Getters dinámicos para la cabecera
  get tituloModal(): string {
    if (this.modo === 'crear') return 'Nueva Empresa';
    if (this.modo === 'editar') return 'Modificar Empresa';
    return 'Enlazar Ciclos';
  }

  get iconoModal(): string {
    if (this.modo === 'crear') return 'fa-plus-circle text-success';
    if (this.modo === 'editar') return 'fa-pen-to-square text-primary';
    return 'fa-link text-info';
  }

  get contactosAdicionales(): FormArray {
    return this.empresaForm.get('contactosAdicionales') as FormArray;
  }

  ngOnInit(): void {
    this.toggleBodyScroll(true);
    if (this.empresa) this.patchForm(this.empresa);
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

  private resetForm(): void {
    if (this.empresaForm) {
      this.empresaForm.reset();
      this.contactosAdicionales.clear();
      this.ciclosSeleccionados = [];
    }
  }

  private patchForm(empresa: EmpresaDTO): void {
    if (!this.empresaForm) return;

    this.contactosAdicionales.clear();
    this.empresaForm.patchValue({
      siglas: empresa.siglas,
      nombre: empresa.nombre,
      convenioUrl: empresa.convenioUrl,
      inicioConvenio: this.formatearFechaParaInput(empresa.inicioConvenio),
      contacto: empresa.contacto,
      numeroContacto: empresa.numeroContacto,
      correo: empresa.correo
    });

    if (empresa.contactosAdicionales && Array.isArray(empresa.contactosAdicionales)) {
      empresa.contactosAdicionales.forEach(c => this.addContacto(c.contacto, c.numeroContacto, c.correo));
    }

    // Cargamos la información detallada de los ciclos (sigla + tutor)
    if (empresa.ciclosInfo && Array.isArray(empresa.ciclosInfo)) {
      this.ciclosSeleccionados = empresa.ciclosInfo.map(c => ({
        sigla: c.siglas,
        tutor: c.tutor || ''
      }));
    } else {
      this.ciclosSeleccionados = [];
    }

    this.actualizarFinConvenio();
  }

  onToggleCiclo(sigla: string, checked: boolean): void {
    if (checked) {
      if (!this.ciclosSeleccionados.find(c => c.sigla === sigla)) {
        this.ciclosSeleccionados.push({ sigla, tutor: '' });
      }
    } else {
      this.ciclosSeleccionados = this.ciclosSeleccionados.filter(c => c.sigla !== sigla);
    }
  }

  actualizarTutor(sigla: string, tutor: string): void {
    const ciclo = this.ciclosSeleccionados.find(c => c.sigla === sigla);
    if (ciclo) {
      ciclo.tutor = tutor;
    }
  }

  isCicloSeleccionado(sigla: string): boolean {
    return !!this.ciclosSeleccionados.find(c => c.sigla === sigla);
  }

  addContacto(nombre = '', telefono = '', correo = ''): void {
    this.contactosAdicionales.push(this.fb.group({
      contacto: [nombre, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      numeroContacto: [telefono, [Validators.required, Validators.pattern(this.telefonoPattern), Validators.minLength(9), Validators.maxLength(15)]],
      correo: [correo, [Validators.required, Validators.pattern(this.emailPattern), Validators.maxLength(100)]]
    }));
  }

  removeContacto(index: number): void {
    this.contactosAdicionales.removeAt(index);
  }

  onInicioConvenioChange(): void {
    this.actualizarFinConvenio();
  }

  private actualizarFinConvenio(): void {
    const inicio = this.empresaForm.get('inicioConvenio')?.value;
    if (inicio) {
      const fecha = new Date(inicio);
      fecha.setFullYear(fecha.getFullYear() + 4);
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const anio = String(fecha.getFullYear());
      this.empresaForm.get('finConvenio')?.setValue(`${dia}/${mes}/${anio}`);
    }
  }

  private formatearFechaParaInput(valor: string): string {
    if (!valor) return '';
    if (valor.includes('/')) {
      const partes = valor.split('/');
      if (partes.length === 3) {
        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
      }
    }
    return valor.substring(0, 10);
  }

  private formatearFechaParaGuardar(valor: string): string {
    if (!valor) return '';
    const partes = valor.split('-');
    if (partes.length === 3) {
      return `${partes[2].padStart(2, '0')}/${partes[1].padStart(2, '0')}/${partes[0]}`;
    }
    return valor;
  }

  onSubmit(): void {
    // Si estamos en modo enlazar, solo enviamos el ID y los ciclos seleccionados
    if (this.modo === 'enlazar') {
      const payload = {
        id: this.empresa?.id || 0,
        ciclos: this.ciclosSeleccionados
      };
      this.guardar.emit(payload);
      return;
    }

    if (this.empresaForm.valid) {
      const formValue = this.empresaForm.getRawValue();
      const payload = {
        ...formValue,
        id: this.empresa?.id || 0,
        inicioConvenio: this.formatearFechaParaGuardar(formValue.inicioConvenio),
        finConvenio: formValue.finConvenio,
        ciclos: this.ciclosSeleccionados
      };
      this.guardar.emit(payload);
    } else {
      this.empresaForm.markAllAsTouched();
      this.alertService.advertencia('Formulario Incompleto', 'Por favor, revisa los campos marcados en rojo antes de continuar.');
    }
  }

  // Helpers para el HTML
  isInvalid(field: string): boolean {
    const control = this.empresaForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.empresaForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['pattern']) {
      if (field === 'convenioUrl') return 'Introduce una URL válida (ej: https://google.com)';
      if (field === 'correo' || field.includes('correo')) return 'Introduce un correo electrónico válido';
      if (field.includes('numeroContacto')) return 'Solo números, espacios, - o +';
    }
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;

    return 'Campo no válido';
  }
}
