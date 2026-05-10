import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { Config } from 'datatables.net';
import { Router } from '@angular/router';
import { CiclosService } from '../../services/ciclos.service';
import { Ciclo } from '../../dto/ciclo.dto';

@Component({
  selector: 'app-ciclos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatatableComponent],
  templateUrl: './ciclos.component.html',
  styleUrl: './ciclos.component.css'
})
export class CiclosComponent implements OnInit {
  private ciclosService = inject(CiclosService);
  private router = inject(Router);

  ciclos: Ciclo[] = [];

  dtOptions: Config = {};
  columnTitles: string[] = ['Nombre', 'Siglas', 'Grado', 'Módulos', 'Acciones'];

  isModalOpen = false;
  selectedCiclo: any = null;
  cursoSeleccionado: string = '1';

  isDeleteModalOpen = false;
  cicloToDelete: any = null;

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
            <div style="display: flex; gap: 15px; justify-content: center; align-items: center;">
              <button class="btn-icon delete-icon" data-action="delete" title="Eliminar" style="background:none;border:none;color:#4da6ff;font-size:18px;cursor:pointer;transition:transform 0.1s;"><i class="fa-solid fa-trash-can"></i></button>
              <button class="btn-icon edit-icon" data-action="edit" title="Editar" style="background:none;border:none;color:#d4a017;font-size:18px;cursor:pointer;transition:transform 0.1s;"><i class="fa-solid fa-pencil"></i></button>
              <button class="btn-icon view-icon" data-action="view" title="Ver Cursos" style="background:none;border:none;color:#555;font-size:18px;cursor:pointer;transition:transform 0.1s;"><i class="fa-solid fa-eye"></i></button>
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
      this.abrirModal(event.data);
    } else if (event.action === 'delete') {
      this.cicloToDelete = event.data;
      this.isDeleteModalOpen = true;
    } else if (event.action === 'edit') {
      this.abrirEditModal(event.data);
    }
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

  abrirModal(ciclo: any) {
    this.selectedCiclo = ciclo;
    this.cursoSeleccionado = '1';
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.selectedCiclo = null;
  }

  accederCurso() {
    this.router.navigate(['/alumnos'], { 
      queryParams: { 
        ciclo: this.selectedCiclo?.siglas, 
        curso: this.cursoSeleccionado 
      } 
    });
    this.cerrarModal();
  }
}
