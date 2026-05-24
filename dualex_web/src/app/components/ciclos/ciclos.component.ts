import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { Config } from 'datatables.net';
import 'datatables.net-responsive-bs5';
import { CiclosService } from '../../services/ciclos.service';
import { CicloDTO } from '../../dto/dualex.dto';
import { AlertService } from '../../services/alert.service';
import { CicloModalComponent } from '../modals/ciclo-modal/ciclo-modal.component';

@Component({
  selector: 'app-ciclos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatatableComponent, ConfirmarBorradoModalComponent, CicloModalComponent],
  templateUrl: './ciclos.component.html',
  styleUrl: './ciclos.component.css'
})
export class CiclosComponent implements OnInit {
  private ciclosService = inject(CiclosService);
  private alertService = inject(AlertService);

  ciclos: CicloDTO[] = [];

  dtOptions: Config = {};
  columnTitles: string[] = [' ', 'Nombre', 'Siglas', 'Grado', 'Cursos', 'Módulos', 'Acciones'];

  isDeleteModalOpen = false;
  cicloToDelete: any = null;

  isEditModalOpen = false;
  isEditing = false;
  cicloSeleccionado: any = null;

  @ViewChild(DatatableComponent) sharedDatatable!: DatatableComponent;

  ngOnInit(): void {
    this.cargarCiclos();

    this.dtOptions = {
      order: [],
      responsive: true,
      data: this.ciclos,
      columns: [
        {
          title: ' ',
          className: 'dtr-control all',
          orderable: false,
          data: null,
          defaultContent: '',
          responsivePriority: 1
        },
        { data: 'nombre', className: 'text-truncate', responsivePriority: 2 },
        { data: 'siglas', responsivePriority: 3 },
        { data: 'grado', responsivePriority: 4 },
        { data: 'Curso', responsivePriority: 6 },
        { data: null, defaultContent: 'Gestionar Módulos', responsivePriority: 7 },
        {
          data: null,
          orderable: false,
          className: 'text-center',
          responsivePriority: 5,
          render: () => `
            <div class="d-flex gap-2 justify-content-center align-items-center action-buttons w-100">
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
        processing: "Procesando...",
        search: "Buscar:",
        lengthMenu: "Mostrar _MENU_ elementos",
        info: "Mostrando del _START_ al _END_ de un total de _TOTAL_ elementos",
        infoEmpty: "Mostrando 0 de 0 de un total de 0 elementos",
        infoFiltered: "(filtrado de un total de _MAX_ elementos)",
        loadingRecords: "Cargando...",
        zeroRecords: "No se han encontrado resultados",
        emptyTable: "No hay datos disponibles en la tabla",
        paginate: {
          first: "Primero",
          previous: "Anterior",
          next: "Siguiente",
          last: "Último"
        }
      }
    };
  }

  cargarCiclos() {
    this.ciclosService.getCiclos().subscribe(ciclos => {
      this.ciclos = ciclos;
      if (this.sharedDatatable) {
        this.actualizarTabla();
      }
    });
  }

  handleAction(event: { action: string, data: any }) {
    if (event.action === 'delete') {
      this.cicloToDelete = event.data;
      this.isDeleteModalOpen = true;
    } else if (event.action === 'edit') {
      this.abrirEditModal(event.data);
    }
  }

  abrirEditModal(ciclo?: any) {
    if (ciclo) {
      this.isEditing = true;
      this.cicloSeleccionado = { ...ciclo };
    } else {
      this.isEditing = false;
      this.cicloSeleccionado = null;
    }
    this.isEditModalOpen = true;
  }

  cerrarEditModal() {
    this.isEditModalOpen = false;
    this.cicloSeleccionado = null;
  }

  guardarCiclo(datos: any) {
    const nombreForm = datos.nombre?.trim().toLowerCase() || '';
    const siglasForm = datos.siglas?.trim().toLowerCase() || '';

    if (!nombreForm || !siglasForm) {
      this.alertService.error('Error', 'El nombre y las siglas son obligatorios.');
      return;
    }

    // Comprobar duplicados
    const duplicado = this.ciclos.find(c => {
      if (this.isEditing && this.cicloSeleccionado && c.id === this.cicloSeleccionado.id) return false;
      return (c.nombre?.trim().toLowerCase() === nombreForm) || (c.siglas?.trim().toLowerCase() === siglasForm);
    });

    if (duplicado) {
      this.alertService.error('Duplicado', 'Ya existe un ciclo con ese nombre o siglas.');
      return;
    }

    if (this.isEditing && this.cicloSeleccionado) {
      this.ciclosService.updateCiclo(this.cicloSeleccionado.id, datos).subscribe(() => {
        this.alertService.exito('¡Actualizado!', 'El ciclo se ha actualizado correctamente.');
        this.cargarCiclos();
        this.cerrarEditModal();
      });
    } else {
      this.ciclosService.addCiclo(datos).subscribe(() => {
        this.alertService.exito('¡Creado!', 'El nuevo ciclo se ha registrado correctamente.');
        this.cargarCiclos();
        this.cerrarEditModal();
      });
    }
  }

  confirmarEliminar() {
    if (this.cicloToDelete) {
      this.ciclosService.deleteCiclo(this.cicloToDelete.id).subscribe(() => {
        this.cargarCiclos();
        this.cerrarDeleteModal();
      });
    }
  }

  private actualizarTabla() {
    if (this.sharedDatatable && this.sharedDatatable.dtElement) {
      this.sharedDatatable.dtElement.dtInstance.then((dtInstance: any) => {
        dtInstance.clear();
        dtInstance.rows.add(this.ciclos);
        dtInstance.draw();
      });
    }
  }

  cerrarDeleteModal() {
    this.isDeleteModalOpen = false;
    this.cicloToDelete = null;
  }

  formatearCursos(siglas: string): string {
    return siglas ? `1º ${siglas.toUpperCase()}, 2º ${siglas.toUpperCase()}` : '';
  }
}
