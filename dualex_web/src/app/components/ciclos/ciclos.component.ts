import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { Config } from 'datatables.net';
import { CiclosService } from '../../services/ciclos.service';
import { Ciclo } from '../../dto/ciclo.dto';

@Component({
  selector: 'app-ciclos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatatableComponent, ConfirmarBorradoModalComponent],
  templateUrl: './ciclos.component.html',
  styleUrl: './ciclos.component.css'
})
export class CiclosComponent implements OnInit {
  private ciclosService = inject(CiclosService);
  private router = inject(Router);

  ciclos: Ciclo[] = [];

  dtOptions: Config = {};
  columnTitles: string[] = ['Nombre', 'Siglas', 'Grado', 'Módulos', 'Acciones'];

  isDeleteModalOpen = false;
  cicloToDelete: any = null;

  isCursoModalOpen = false;
  cicloParaCursos: Ciclo | null = null;
  cursoSeleccionado: string | null = null;
  opcionesCurso: string[] = [];

  isEditModalOpen = false;
  isEditing = false;
  cicloForm: any = {
    nombre: '',
    siglas: '',
    grado: 'Grado Medio',
    anoEscolar: '',
    colorFondo1: '#ffffff',
    colorTexto1: '#000000',
    colorFondo2: '#ffffff',
    colorTexto2: '#000000'
  };
  editingOriginalSiglas: string | null = null;

  @ViewChild(DatatableComponent) sharedDatatable!: DatatableComponent;

  ngOnInit(): void {
    this.cargarCiclos();
    
    this.dtOptions = {
      data: this.ciclos,
      columns: [
        { data: 'nombre' },
        { data: 'siglas' },
        { data: 'grado' },
        { data: null, defaultContent: 'Gestionar Módulos' },
        { 
          data: null, 
          orderable: false, 
          className: 'text-center',
          render: () => `
            <div class="d-flex gap-2 justify-content-center align-items-center action-buttons w-100">
              <button class="btn btn-sm btn-outline-primary shadow-sm action-edit" data-action="edit" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger shadow-sm action-delete" data-action="delete" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
              <button class="btn btn-sm btn-outline-secondary shadow-sm action-view" data-action="view" title="Ver cursos">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          `
        }
      ],
      language: {
        url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
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
    if (event.action === 'view') {
      this.abrirSelectorCursos(event.data);
    } else if (event.action === 'delete') {
      this.cicloToDelete = event.data;
      this.isDeleteModalOpen = true;
    } else if (event.action === 'edit') {
      this.abrirEditModal(event.data);
    }
  }

  abrirCursos() {
    this.router.navigate(['/cursos']);
  }

  abrirSelectorCursos(ciclo: Ciclo) {
    this.cicloParaCursos = ciclo;
    this.cursoSeleccionado = null;
    this.opcionesCurso = ciclo.siglas === 'SMR'
      ? ['1SMR', '2SMR']
      : [`1${ciclo.siglas}`, `2${ciclo.siglas}`];
    this.isCursoModalOpen = true;
  }

  cerrarSelectorCursos() {
    this.isCursoModalOpen = false;
    this.cicloParaCursos = null;
    this.cursoSeleccionado = null;
    this.opcionesCurso = [];
  }

  seleccionarCurso(curso: string) {
    this.cursoSeleccionado = curso;
  }

  aceptarSelectorCursos() {
    if (!this.cursoSeleccionado) {
      return;
    }
    this.cerrarSelectorCursos();
  }

  abrirEditModal(ciclo?: any) {
    if (ciclo) {
      this.isEditing = true;
      this.editingOriginalSiglas = ciclo.siglas;
      this.cicloForm = { 
        ...ciclo, 
        anoEscolar: ciclo.anoEscolar || '', 
        colorFondo1: ciclo.colorFondo1 || '#ffffff', 
        colorTexto1: ciclo.colorTexto1 || '#000000', 
        colorFondo2: ciclo.colorFondo2 || '#ffffff', 
        colorTexto2: ciclo.colorTexto2 || '#000000' 
      };
    } else {
      this.isEditing = false;
      this.editingOriginalSiglas = null;
      this.cicloForm = {
        nombre: '',
        siglas: '',
        grado: 'Grado Medio',
        anoEscolar: '',
        colorFondo1: '#ffffff',
        colorTexto1: '#000000',
        colorFondo2: '#ffffff',
        colorTexto2: '#000000'
      };
    }
    this.isEditModalOpen = true;
  }

  cerrarEditModal() {
    this.isEditModalOpen = false;
  }

  guardarCiclo() {
    if (this.isEditing && this.editingOriginalSiglas) {
      this.ciclosService.updateCiclo(this.editingOriginalSiglas, { ...this.cicloForm }).subscribe(() => {
        this.cargarCiclos();
        this.cerrarEditModal();
      });
    } else {
      this.ciclosService.addCiclo({ ...this.cicloForm }).subscribe(() => {
        this.cargarCiclos();
        this.cerrarEditModal();
      });
    }
  }

  confirmarEliminar() {
    if (this.cicloToDelete) {
      this.ciclosService.deleteCiclo(this.cicloToDelete.siglas).subscribe(() => {
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
}
