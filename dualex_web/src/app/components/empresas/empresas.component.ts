import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Config } from 'datatables.net';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { EmpresaModalComponent } from '../modals/empresa-modal/empresa-modal.component';
import { AlertService } from '../../services/alert.service';
import { EmpresasService } from '../../services/empresas.service';
import { ContactoEmpresaDTO, EmpresaDTO, ConfiguracionDTO } from '../../dto/dualex.dto';
import { ConfiguracionService } from '../../services/configuracion.service';
import { AuthService } from '../../auth/services/auth.service';
import { CiclosService } from '../../services/ciclos.service';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatatableComponent, ConfirmarBorradoModalComponent, EmpresaModalComponent],
  templateUrl: './empresas.component.html',
  styleUrl: './empresas.component.css'
})
export class EmpresasComponent implements OnInit {
  private empresasService = inject(EmpresasService);
  private configuracionService = inject(ConfiguracionService);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  private ciclosService = inject(CiclosService);

  @ViewChild(DatatableComponent) datatable?: DatatableComponent;

  puedeEditar = false;

  dtOptions: Config = {};
  modalConfiguracionVisible = false;
  modalContactosVisible = false;
  modalBorradoVisible = false;
  modalCrearVisible = false;
  modoFormulario: 'crear' | 'editar' | 'enlazar' = 'crear';
  empresaEditandoId: number | null = null;
  empresaSeleccionada: EmpresaDTO | null = null;

  configuracionEmpresa: ConfiguracionDTO = {
    diasAvisoCaducidad: 30,
    tiempoFinalizacionConvenio: 4
  };

  contactosAdicionales: ContactoEmpresaDTO[] = [];
  ciclosDisponibles: string[] = [];

  nuevaEmpresa = {
    siglas: '',
    nombre: '',
    convenioUrl: '',
    inicioConvenio: '',
    finConvenio: '',
    contacto: '',
    numeroContacto: ''
  };

  ngOnInit(): void {
    this.puedeEditar = this.authService.currentUserValue?.rol === 'COORDINADOR';
    this.cargarConfiguracion();
    this.cargarCiclos();

    this.dtOptions = {
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback: any) => {
        this.empresasService.obtenerEmpresasDataTables(dataTablesParameters).subscribe({
          next: (resp) => {
            callback({
              draw: resp.draw,
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: resp.data
            });
          },
          error: () => {
            callback({ recordsTotal: 0, recordsFiltered: 0, data: [] });
          }
        });
      },
      columns: [
        { data: 'siglas' },
        {
          data: 'nombre',
          render: (data: string) => `
            <button
              type="button"
              class="btn btn-link p-0 text-decoration-none empresa-nombre-link"
              data-action="viewContacts"
              title="Ver contactos">
              ${data}
            </button>
          `
        },
        { 
          data: 'ciclos',
          render: (data: string) => data ? data : '<span class="text-muted italic">No asignado</span>'
        },
        {
          data: 'convenioUrl',
          render: (data: string) => {
            return `
              <a class="btn btn-sm btn-outline-primary shadow-sm" href="${data}" target="_blank">
                <i class="fa-solid fa-up-right-from-square me-1"></i> Ver convenio
              </a>
            `;
          }
        },
        { data: 'inicioConvenio' },
        { data: 'finConvenio' },
        ...(this.puedeEditar ? [{
          data: null,
          className: 'text-center',
          orderable: false,
          searchable: false,
          render: () => `
            <div class="d-flex justify-content-center align-items-center gap-2 action-buttons w-100">
              <button class="btn btn-sm btn-outline-info shadow-sm action-link" data-action="link" title="Enlazar">
                <i class="fa-solid fa-link"></i>
              </button>
              <button class="btn btn-sm btn-outline-primary shadow-sm action-edit" data-action="edit" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger shadow-sm action-delete" data-action="delete" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `
        }] : [])
      ],
      language: {
        emptyTable: 'No hay empresas disponibles',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ empresas',
        infoEmpty: 'Mostrando 0 a 0 de 0 empresas',
        infoFiltered: '(filtrado de _MAX_ empresas en total)',
        lengthMenu: 'Mostrar _MENU_ empresas',
        loadingRecords: 'Cargando...',
        processing: 'Procesando...',
        search: 'Buscar:',
        zeroRecords: 'No se encontraron empresas',
        paginate: {
          first: 'Primero',
          last: 'Último',
          next: 'Siguiente',
          previous: 'Anterior'
        }
      },
      pageLength: 10,
      lengthMenu: [5, 10, 25, 50]
    };
  }

  crearNuevaEntrada(): void {
    this.modoFormulario = 'crear';
    this.empresaSeleccionada = null;
    this.modalCrearVisible = true;
  }

  abrirEdicionEmpresa(empresa: EmpresaDTO): void {
    this.modoFormulario = 'editar';
    this.empresaSeleccionada = { ...empresa };
    this.modalCrearVisible = true;
  }

  onTableAction(event: { action: string, data: any }): void {
    if (event.action === 'edit') {
      this.empresaSeleccionada = null;
      setTimeout(() => {
        this.modoFormulario = 'editar';
        this.empresaSeleccionada = { ...event.data };
        this.modalCrearVisible = true;
      }, 0);
      return;
    }

    if (event.action === 'link') {
      this.empresaSeleccionada = null; // Limpiamos para forzar el refresco
      setTimeout(() => {
        this.modoFormulario = 'enlazar';
        this.empresaSeleccionada = { ...event.data };
        this.modalCrearVisible = true;
      }, 0);
      return;
    }

    if (event.action === 'viewContacts') {
      this.abrirContactosEmpresa(event.data);
      return;
    }

    if (event.action === 'delete') {
      this.empresaSeleccionada = event.data;
      this.modalBorradoVisible = true;
    }
  }

  abrirContactosEmpresa(empresa: EmpresaDTO): void {
    this.empresaSeleccionada = empresa;
    this.modalContactosVisible = true;
  }

  onGuardarEmpresa(empresaData: any): void {
    const obs = this.modoFormulario === 'crear'
      ? this.empresasService.agregarEmpresa(empresaData)
      : this.empresasService.actualizarEmpresa(empresaData.id, empresaData);

    obs.subscribe({
      next: () => {
        const msg = this.modoFormulario === 'crear' ? 'Empresa creada con éxito.' : 'Empresa actualizada con éxito.';
        this.alertService.exito('Éxito', msg);
        this.modalCrearVisible = false;
        this.refrescarTabla();
      },
      error: (err: any) => {
        this.alertService.error('Error', err.error?.message || 'Error al procesar la empresa.');
      }
    });
  }

  /**
   * Ejecuta el borrado definitivo de una empresa a través del servicio llamando a la API.
   */
  onConfirmarBorrado(): void {
    if (!this.empresaSeleccionada) return;

    this.empresasService.eliminarEmpresa(this.empresaSeleccionada.id).subscribe({
      next: () => {
        this.alertService.exito('Empresa eliminada', `${this.empresaSeleccionada!.nombre} ha sido eliminada.`);
        this.modalBorradoVisible = false;
        this.empresaSeleccionada = null;
        this.refrescarTabla();
      },
      error: (err) => this.alertService.error('Error', err.error?.message || 'No se pudo eliminar la empresa')
    });
  }

  onCancelarBorrado(): void {
    this.modalBorradoVisible = false;
    this.empresaSeleccionada = null;
  }

  cerrarContactosEmpresa(): void {
    this.modalContactosVisible = false;
    this.empresaSeleccionada = null;
  }

  /**
   * Recopila, valida y formatea los datos del formulario (incluyendo contactos).
   * Llama a los endpoints de creación o actualización de la API a través de EmpresasService.
   * Valida estrictamente que las longitudes no superen los límites de la base de datos MySQL.
   */
  guardarEmpresa(): void {
    if (
      !this.nuevaEmpresa.siglas.trim() ||
      !this.nuevaEmpresa.nombre.trim() ||
      !this.nuevaEmpresa.convenioUrl.trim() ||
      !this.nuevaEmpresa.inicioConvenio.trim() ||
      !this.nuevaEmpresa.contacto.trim() ||
      !this.nuevaEmpresa.numeroContacto.trim() ||
      this.contactosAdicionales.some(contacto => !contacto.contacto.trim() || !contacto.numeroContacto.trim())
    ) {
      this.alertService.error('Datos incompletos', 'Rellena todos los campos antes de guardar.');
      return;
    }

    const payload: any = {
      siglas: this.nuevaEmpresa.siglas.trim().toUpperCase(),
      nombre: this.nuevaEmpresa.nombre.trim(),
      convenioUrl: this.nuevaEmpresa.convenioUrl.trim(),
      inicioConvenio: this.formatearFechaParaGuardar(this.nuevaEmpresa.inicioConvenio),
      contacto: this.nuevaEmpresa.contacto.trim(),
      numeroContacto: this.nuevaEmpresa.numeroContacto.trim(),
      contactosAdicionales: this.contactosAdicionales.map(contacto => ({
        contacto: contacto.contacto.trim(),
        numeroContacto: contacto.numeroContacto.trim()
      }))
    };

    // Validaciones de longitud según base de datos
    if (payload.siglas.length > 6) {
      this.alertService.error('Error de validación', 'Las siglas no pueden tener más de 6 caracteres.');
      return;
    }
    if (payload.nombre.length > 50) {
      this.alertService.error('Error de validación', 'El nombre de la empresa no puede superar los 50 caracteres.');
      return;
    }
    if (payload.convenioUrl.length > 100) {
      this.alertService.error('Error de validación', 'La URL del convenio no puede superar los 100 caracteres.');
      return;
    }
    if (payload.contacto.length > 50 || payload.numeroContacto.length > 15) {
      this.alertService.error('Error de validación', 'El nombre del contacto (máx 50) o teléfono (máx 15) superan el límite permitido.');
      return;
    }
    for (const add of payload.contactosAdicionales) {
      if (add.contacto.length > 50 || add.numeroContacto.length > 15) {
        this.alertService.error('Error de validación', 'El nombre de un contacto adicional o su teléfono superan el límite permitido.');
        return;
      }
    }

    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlRegex.test(payload.convenioUrl)) {
      this.alertService.error('URL inválida', 'Introduce una dirección web válida para el convenio (ej: https://www.ejemplo.com).');
      return;
    }

    const telefonoRegex = /^[+0-9\s\-]+$/;
    if (!telefonoRegex.test(payload.numeroContacto)) {
      this.alertService.error('Teléfono inválido', 'El número de contacto solo puede contener números, espacios, guiones o el signo +.');
      return;
    }

    for (const add of payload.contactosAdicionales) {
      if (!telefonoRegex.test(add.numeroContacto)) {
        this.alertService.error('Teléfono inválido', `El número del contacto adicional "${add.contacto}" solo puede contener números, espacios, guiones o el signo +.`);
        return;
      }
    }

    const finConvenioCalculado = this.calcularFinConvenio(this.nuevaEmpresa.inicioConvenio);
    if (!finConvenioCalculado) {
      this.alertService.error('Datos incompletos', 'La fecha de inicio no es válida.');
      return;
    }
    payload.finConvenio = finConvenioCalculado;

    if (this.modoFormulario === 'editar' && this.empresaEditandoId !== null) {
      this.empresasService.actualizarEmpresa(this.empresaEditandoId, payload).subscribe({
        next: () => {
          this.alertService.exito('Empresa actualizada', `${payload.nombre} se ha actualizado correctamente.`);
          this.cerrarModalYRefrescar();
        },
        error: (err) => this.alertService.error('Error', err.error?.message || 'No se pudo actualizar la empresa')
      });
    } else {
      this.empresasService.agregarEmpresa(payload).subscribe({
        next: () => {
          this.alertService.exito('Empresa creada', `${payload.nombre} se ha añadido correctamente.`);
          this.cerrarModalYRefrescar();
        },
        error: (err) => this.alertService.error('Error', err.error?.message || 'No se pudo crear la empresa')
      });
    }
  }

  /**
   * Método auxiliar que cierra el modal de edición/creación, resetea el estado y recarga DataTables.
   */
  private cerrarModalYRefrescar(): void {
    this.modalCrearVisible = false;
    this.empresaEditandoId = null;
    this.refrescarTabla();
  }

  onCancelarCreacion(): void {
    this.modalCrearVisible = false;
    this.empresaEditandoId = null;
    this.modoFormulario = 'crear';
    this.contactosAdicionales = [];
  }

  abrirConfiguracion(): void {
    this.cargarConfiguracion();
    this.modalConfiguracionVisible = true;
  }

  private cargarConfiguracion(): void {
    this.configuracionService.getConfiguracion().subscribe({
      next: (config) => {
        if (config) {
          this.configuracionEmpresa = config;
        }
      },
      error: () => {
        this.alertService.error('Error', 'No se pudo cargar la configuración del servidor.');
      }
    });
  }

  private cargarCiclos(): void {
    this.ciclosService.getCiclos().subscribe({
      next: (ciclos) => {
        this.ciclosDisponibles = ciclos.map(c => c.siglas);
      }
    });
  }

  explicarConvenioUrl(): void {
    // Ayuda contextual: la ubicación real del convenio aún está pendiente de definir.
    this.alertService.informacion(
      'Convenio URL',
      'Aquí va la ubicación del convenio. Por ahora estoy a la espera de que me indiquen dónde está exactamente.'
    );
  }

  guardarConfiguracion(): void {
    const diasAviso = Number(this.configuracionEmpresa.diasAvisoCaducidad);
    const tiempoFinalizacion = Number(this.configuracionEmpresa.tiempoFinalizacionConvenio);

    if (!Number.isFinite(diasAviso) || diasAviso <= 0 || diasAviso > 255 || 
        !Number.isFinite(tiempoFinalizacion) || tiempoFinalizacion <= 0 || tiempoFinalizacion > 255) {
      this.alertService.error('Datos inválidos', 'Los valores deben ser números positivos entre 1 y 255.');
      return;
    }

    // Ahora guardamos en la base de datos a través del servicio
    this.configuracionService.updateConfiguracion(this.configuracionEmpresa).subscribe({
      next: () => {
        this.alertService.exito(
          'Configuración guardada',
          'Los valores de aviso y finalización del convenio se han actualizado en el servidor.'
        );
        this.modalConfiguracionVisible = false;
      },
      error: () => {
        this.alertService.error('Error', 'No se pudo guardar la configuración en el servidor.');
      }
    });
  }

  cerrarConfiguracion(): void {
    // Si el usuario cancela, recargamos la configuración del servidor para descartar los cambios locales no guardados
    this.cargarConfiguracion();
    this.modalConfiguracionVisible = false;
  }

  agregarContactoAdicional(): void {
    this.contactosAdicionales = [
      ...this.contactosAdicionales,
      { contacto: '', numeroContacto: '' }
    ];
  }

  quitarContactoAdicional(index: number): void {
    this.contactosAdicionales = this.contactosAdicionales.filter((_, currentIndex) => currentIndex !== index);
  }

  obtenerFinConvenioCalculado(): string {
    return this.calcularFinConvenio(this.nuevaEmpresa.inicioConvenio);
  }

  private refrescarTabla(): void {
    this.datatable?.refrescar();
  }

  private formatearFechaParaInput(valor: string): string {
    if (!valor) return '';

    const partes = valor.split('/');
    if (partes.length === 3) {
      const [dia, mes, anio] = partes;
      return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    return valor;
  }

  private formatearFechaParaGuardar(valor: string): string {
    if (!valor) return '';

    const partes = valor.split('-');
    if (partes.length === 3) {
      const [anio, mes, dia] = partes;
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio}`;
    }

    return valor.trim();
  }

  private calcularFinConvenio(fechaInicio: string): string {
    if (!fechaInicio) return '';

    const partes = fechaInicio.split('-');
    if (partes.length !== 3) return '';

    const [anioStr, mesStr, diaStr] = partes;
    const anio = Number(anioStr);
    const mes = Number(mesStr);
    const dia = Number(diaStr);

    if (!Number.isFinite(anio) || !Number.isFinite(mes) || !Number.isFinite(dia)) return '';

    const fecha = new Date(anio, mes - 1, dia);
    if (Number.isNaN(fecha.getTime())) return '';

    // El fin del convenio se calcula automáticamente a partir de la fecha de inicio y la duración configurada.
    fecha.setFullYear(fecha.getFullYear() + Number(this.configuracionEmpresa.tiempoFinalizacionConvenio || 0));

    const diaFinal = String(fecha.getDate()).padStart(2, '0');
    const mesFinal = String(fecha.getMonth() + 1).padStart(2, '0');
    const anioFinal = String(fecha.getFullYear());

    return `${diaFinal}/${mesFinal}/${anioFinal}`;
  }
}
