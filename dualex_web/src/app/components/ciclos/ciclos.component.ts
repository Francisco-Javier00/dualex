import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { Config } from 'datatables.net';
import 'datatables.net-responsive-bs5';
import { CiclosService } from '../../services/ciclos.service';
import { ProfesoresService } from '../../services/profesores.service';
import { CicloDTO } from '../../dto/dualex.dto';
import { AlertService } from '../../services/alert.service';
import { CicloModalComponent } from '../modals/ciclo-modal/ciclo-modal.component';
import { VincularCoordinadorModalComponent } from '../modals/vincular-coordinador-modal/vincular-coordinador-modal.component';

/**
 * Componente para la gestión de Ciclos Formativos.
 * 
 * Permite visualizar, crear, editar y eliminar los ciclos impartidos en el centro educativo.
 */
@Component({
  selector: 'app-ciclos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatatableComponent, ConfirmarBorradoModalComponent, CicloModalComponent, VincularCoordinadorModalComponent],
  templateUrl: './ciclos.component.html',
  styleUrl: './ciclos.component.css'
})
export class CiclosComponent implements OnInit {
  private ciclosService = inject(CiclosService);
  private profesoresService = inject(ProfesoresService);
  private alertService = inject(AlertService);
  private location = inject(Location);

  ciclos: CicloDTO[] = [];

  dtOptions: any = {};
  columnTitles: string[] = [' ', 'Nombre', 'Siglas', 'Grado', 'Cursos', 'Coordinador', 'Acciones'];

  isDeleteModalOpen = false;
  cicloToDelete: any = null;
  isVincularModalOpen = false;
  todosLosProfesores: any[] = [];

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
        { data: 'nombre', className: 'text-truncate', width: '55%', responsivePriority: 2 },
        { data: 'siglas', className: 'text-nowrap', width: '10%', responsivePriority: 3 },
        { data: 'grado', className: 'text-nowrap', width: '10%', responsivePriority: 4 },
        { data: 'Curso', className: 'text-nowrap', width: '15%', responsivePriority: 6 },
        { 
          data: 'nombreCoordinador', 
          className: 'text-nowrap', 
          width: '15%', 
          responsivePriority: 7,
          render: (data: any, type: any, row: any) => data ? `${data} ${row.apellidosCoordinador}` : '<span class="text-muted italic">Sin asignar</span>'
        },
        {
          data: null,
          orderable: false,
          className: 'text-center',
          width: '10%',
          responsivePriority: 5,
          render: () => `
            <div class="d-flex gap-2 justify-content-center align-items-center action-buttons w-100">
              <button class="btn btn-sm btn-outline-info shadow-sm action-link" data-action="link" title="Vincular Coordinador">
                <i class="fa-solid fa-user-tie"></i>
              </button>
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
    } else if (event.action === 'link') {
      this.abrirVincularCoordinador(event.data);
    }
  }

  abrirVincularCoordinador(ciclo: any) {
    this.cicloSeleccionado = ciclo;
    this.profesoresService.getProfesores().subscribe({
      next: (profesores) => {
        this.todosLosProfesores = profesores;
        this.isVincularModalOpen = true;
      },
      error: () => this.alertService.error('Error', 'No se pudo obtener la lista de profesores.')
    });
  }

  guardarCoordinador(idProfesor: number | null) {
    // Need to call a service method here. For now let's assume it exists or call updateCiclo
    // or add a dedicated method in CiclosService.
    this.ciclosService.vincularCoordinador(this.cicloSeleccionado.id, idProfesor).subscribe({
      next: () => {
        this.alertService.exito('Coordinador asignado', 'El coordinador ha sido asignado correctamente.');
        this.isVincularModalOpen = false;
        this.cargarCiclos();
      },
      error: (err) => this.alertService.error('Error', err.error?.mensaje || 'No se pudo asignar el coordinador.')
    });
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

  irAtras(): void {
    this.location.back();
  }
}
