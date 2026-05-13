import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { ModuloModalComponent } from '../modals/modulo-modal/modulo-modal.component';
import { ModulosService } from '../../services/modulos.service';
import { AlertService } from '../../services/alert.service';
import { ModuloDTO } from '../../dto/dualex.dto';
import { Config } from 'datatables.net';

@Component({
  selector: 'app-modulos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatatableComponent,
    ConfirmarBorradoModalComponent,
    ModuloModalComponent
  ],
  templateUrl: './modulos.component.html'
})
export class ModulosComponent implements OnInit {
  private modulosService = inject(ModulosService);
  private alertService = inject(AlertService);

  @ViewChild(DatatableComponent) datatable!: DatatableComponent;

  dtOptions: Config = {};
  modalBorradoVisible = false;
  modalModuloVisible = false;
  moduloSeleccionado: ModuloDTO | null = null;

  ngOnInit(): void {
    this.dtOptions = {
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback: any) => {
        this.modulosService.obtenerModulosDataTables(dataTablesParameters).subscribe(resp => {
          callback({
            recordsTotal: resp.recordsTotal,
            recordsFiltered: resp.recordsFiltered,
            data: resp.data
          });
        });
      },
      columns: [
        { data: 'nombre' },
        { data: 'siglas' },
        { data: 'ciclo' },
        {
          data: null,
          orderable: false,
          searchable: false,
          render: () => `
            <div class="d-flex gap-2 justify-content-center">
              <button class="btn btn-sm btn-outline-primary shadow-sm" data-action="edit" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger shadow-sm" data-action="delete" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `
        }
      ],
      language: {
        emptyTable: 'No hay módulos registrados',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ módulos',
        infoEmpty: 'Mostrando 0 a 0 de 0 módulos',
        infoFiltered: '(filtrado de _MAX_ módulos en total)',
        lengthMenu: 'Mostrar _MENU_ módulos',
        loadingRecords: 'Cargando...',
        processing: 'Procesando...',
        search: 'Buscar:',
        zeroRecords: 'No se encontraron módulos',
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

  crearNuevo(): void {
    this.moduloSeleccionado = null;
    this.modalModuloVisible = true;
  }

  onTableAction(event: { action: string, data: any }): void {
    if (event.action === 'edit') {
      this.moduloSeleccionado = { ...event.data };
      this.modalModuloVisible = true;
    } else if (event.action === 'delete') {
      this.moduloSeleccionado = event.data;
      this.modalBorradoVisible = true;
    }
  }

  onGuardarModulo(modulo: ModuloDTO): void {
    if (modulo.id) {
      this.modulosService.updateModulo(modulo).subscribe(() => {
        this.alertService.exito('Actualizado', 'Módulo actualizado correctamente.');
        this.recargarTabla();
      });
    } else {
      this.modulosService.createModulo(modulo).subscribe(() => {
        this.alertService.exito('Creado', 'Nuevo módulo registrado con éxito.');
        this.recargarTabla();
      });
    }
  }

  onConfirmarBorrado(): void {
    if (this.moduloSeleccionado) {
      this.modulosService.deleteModulo(this.moduloSeleccionado.id).subscribe(() => {
        this.alertService.exito('Eliminado', 'El módulo ha sido eliminado.');
        this.recargarTabla();
        this.modalBorradoVisible = false;
        this.moduloSeleccionado = null;
      });
    }
  }

  onCancelarBorrado(): void {
    this.modalBorradoVisible = false;
    this.moduloSeleccionado = null;
  }

  private recargarTabla(): void {
    this.datatable.refrescar();
  }
}
