import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Config } from 'datatables.net';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { AlertService } from '../../services/alert.service';
import { EmpresasMockService } from '../../services/empresas-mock.service';
import { ContactoEmpresaDTO, EmpresaDTO } from '../../dto/dualex.dto';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatatableComponent, ConfirmarBorradoModalComponent],
  templateUrl: './empresas.component.html',
  styleUrl: './empresas.component.css'
})
export class EmpresasComponent implements OnInit {
  private empresasMockService = inject(EmpresasMockService);
  private alertService = inject(AlertService);

  @ViewChild(DatatableComponent) datatable?: DatatableComponent;

  dtOptions: Config = {};
  modalConfiguracionVisible = false;
  modalBorradoVisible = false;
  modalCrearVisible = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  empresaEditandoId: number | null = null;
  empresaSeleccionada: EmpresaDTO | null = null;

  configuracionEmpresa = {
    diasAvisoCaducidad: 30,
    tiempoFinalizacionConvenio: 4
  };

  contactosAdicionales: ContactoEmpresaDTO[] = [];

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
    this.dtOptions = {
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback: any) => {
        this.empresasMockService.obtenerEmpresasDataTables(dataTablesParameters).subscribe(resp => {
          callback({
            recordsTotal: resp.recordsTotal,
            recordsFiltered: resp.recordsFiltered,
            data: resp.data
          });
        });
      },
      columns: [
        { data: 'siglas' },
        { data: 'nombre' },
        {
          data: 'convenioUrl',
          render: (data: string) => {
            return `
              <a class="btn btn-sm btn-outline-primary shadow-sm" href="/empresas">
                <i class="fa-solid fa-up-right-from-square me-1"></i> Ver convenio
              </a>
            `;
          }
        },
        { data: 'inicioConvenio' },
        { data: 'finConvenio' },
        { data: 'contacto' },
        { data: 'numeroContacto', className: 'text-start' },
        {
          data: null,
          className: 'text-center',
          orderable: false,
          searchable: false,
          render: () => `
            <div class="d-flex justify-content-center align-items-center gap-2 action-buttons w-100">
              <button class="btn btn-sm btn-outline-primary shadow-sm action-edit" data-action="edit" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger shadow-sm action-delete" data-action="delete" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `
        }
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
    this.empresaEditandoId = null;
    this.contactosAdicionales = [];
    this.nuevaEmpresa = {
      siglas: '',
      nombre: '',
      convenioUrl: '',
      inicioConvenio: '',
      finConvenio: '',
      contacto: '',
      numeroContacto: ''
    };
    this.modalCrearVisible = true;
  }

  abrirEdicionEmpresa(empresa: EmpresaDTO): void {
    this.modoFormulario = 'editar';
    this.empresaEditandoId = empresa.id;
    this.contactosAdicionales = (empresa.contactosAdicionales ?? []).map(contacto => ({ ...contacto }));
    this.nuevaEmpresa = {
      siglas: empresa.siglas,
      nombre: empresa.nombre,
      convenioUrl: empresa.convenioUrl,
      inicioConvenio: this.formatearFechaParaInput(empresa.inicioConvenio),
      finConvenio: this.formatearFechaParaInput(empresa.finConvenio),
      contacto: empresa.contacto,
      numeroContacto: empresa.numeroContacto
    };
    this.modalCrearVisible = true;
  }

  onTableAction(event: { action: string, data: any }): void {
    if (event.action === 'edit') {
      this.abrirEdicionEmpresa(event.data);
      return;
    }

    if (event.action === 'delete') {
      this.empresaSeleccionada = event.data;
      this.modalBorradoVisible = true;
    }
  }

  onConfirmarBorrado(): void {
    if (!this.empresaSeleccionada) return;

    this.empresasMockService.eliminarEmpresa(this.empresaSeleccionada.id);
    this.alertService.exito('Empresa eliminada', `${this.empresaSeleccionada.nombre} ha sido eliminada.`);
    this.modalBorradoVisible = false;
    this.empresaSeleccionada = null;
    this.refrescarTabla();
  }

  onCancelarBorrado(): void {
    this.modalBorradoVisible = false;
    this.empresaSeleccionada = null;
  }

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

    const finConvenioCalculado = this.calcularFinConvenio(this.nuevaEmpresa.inicioConvenio);
    if (!finConvenioCalculado) {
      this.alertService.error('Datos incompletos', 'La fecha de inicio no es válida.');
      return;
    }

    const payload = {
      siglas: this.nuevaEmpresa.siglas.trim(),
      nombre: this.nuevaEmpresa.nombre.trim(),
      convenioUrl: this.nuevaEmpresa.convenioUrl.trim(),
      inicioConvenio: this.formatearFechaParaGuardar(this.nuevaEmpresa.inicioConvenio),
      finConvenio: finConvenioCalculado,
      contacto: this.nuevaEmpresa.contacto.trim(),
      numeroContacto: this.nuevaEmpresa.numeroContacto.trim(),
      contactosAdicionales: this.contactosAdicionales.map(contacto => ({
        contacto: contacto.contacto.trim(),
        numeroContacto: contacto.numeroContacto.trim()
      }))
    };

    if (this.modoFormulario === 'editar' && this.empresaEditandoId !== null) {
      this.empresasMockService.actualizarEmpresa(this.empresaEditandoId, payload);
      this.alertService.exito('Empresa actualizada', `${payload.nombre} se ha actualizado correctamente.`);
    } else {
      this.empresasMockService.agregarEmpresa(payload);
      this.alertService.exito('Empresa creada', `${payload.nombre} se ha añadido correctamente.`);
    }

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
    this.modalConfiguracionVisible = true;
  }

  explicarConvenioUrl(): void {
    this.alertService.informacion(
      'Convenio URL',
      'Aquí va la ubicación del convenio. Por ahora estoy a la espera de que me indiquen dónde está exactamente.'
    );
  }

  guardarConfiguracion(): void {
    const diasAviso = Number(this.configuracionEmpresa.diasAvisoCaducidad);
    const tiempoFinalizacion = Number(this.configuracionEmpresa.tiempoFinalizacionConvenio);

    if (!Number.isFinite(diasAviso) || diasAviso <= 0 || !Number.isFinite(tiempoFinalizacion) || tiempoFinalizacion <= 0) {
      this.alertService.error('Datos incompletos', 'No puedes dejar ningún valor vacío en la configuración.');
      return;
    }

    this.alertService.exito(
      'Configuración guardada',
      'Los valores de aviso y finalización del convenio se han actualizado.'
    );
    this.modalConfiguracionVisible = false;
  }

  cerrarConfiguracion(): void {
    const diasAviso = Number(this.configuracionEmpresa.diasAvisoCaducidad);
    const tiempoFinalizacion = Number(this.configuracionEmpresa.tiempoFinalizacionConvenio);

    if (!Number.isFinite(diasAviso) || diasAviso <= 0 || !Number.isFinite(tiempoFinalizacion) || tiempoFinalizacion <= 0) {
      this.alertService.error('Datos incompletos', 'No puedes cerrar la configuración dejando valores vacíos.');
      return;
    }

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
    this.datatable?.dtElement?.dtInstance.then((dtInstance: any) => {
      dtInstance.ajax.reload(null, false);
    });
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

    fecha.setFullYear(fecha.getFullYear() + Number(this.configuracionEmpresa.tiempoFinalizacionConvenio || 0));

    const diaFinal = String(fecha.getDate()).padStart(2, '0');
    const mesFinal = String(fecha.getMonth() + 1).padStart(2, '0');
    const anioFinal = String(fecha.getFullYear());

    return `${diaFinal}/${mesFinal}/${anioFinal}`;
  }
}
