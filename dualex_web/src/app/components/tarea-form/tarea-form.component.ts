import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

/**
 * IMPORTACIÓN DE COMPONENTES DE CKEDITOR 5
 * Se cargan todos los plugins necesarios para habilitar funciones avanzadas como
 * tablas, imágenes (Base64), redimensionamiento, alineación, etc.
 */
import { 
  ClassicEditor, 
  Bold, 
  Essentials, 
  Italic, 
  Paragraph, 
  Link, 
  List, 
  Image, 
  ImageToolbar, 
  ImageCaption, 
  ImageStyle, 
  ImageUpload, 
  ImageResize, 
  MediaEmbed,
  Table,
  TableToolbar,
  TableColumnResize,
  Heading,
  Indent,
  BlockQuote,
  Autoformat,
  Underline,
  Strikethrough,
  Font,
  Alignment,
  Highlight,
  RemoveFormat,
  Base64UploadAdapter
} from 'ckeditor5';

// Estilos base y traducciones al español para CKEditor
import 'ckeditor5/ckeditor5.css';
import translations from 'ckeditor5/translations/es.js';

// Servicios y DTOs
import { TareasService } from '../../services/tareas.service';
import { ActividadesService } from '../../services/actividades.service';
import { ActividadDTO, Tarea } from '../../dto/dualex.dto';

// Componentes compartidos
import { SeleccionActividadesModalComponent } from '../shared/modals/seleccion-actividades-modal/seleccion-actividades-modal.component';

/**
 * TareaFormComponent
 * Componente dinámico que sirve tanto para CREAR como para EDITAR tareas del cuaderno del alumno.
 * Utiliza un formulario reactivo para la persistencia de datos complejos.
 */
@Component({
  selector: 'app-tarea-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    CKEditorModule, 
    SeleccionActividadesModalComponent
  ],
  templateUrl: './tarea-form.component.html',
  styleUrls: ['./tarea-form.component.css']
})
export class TareaFormComponent implements OnInit {
  // Inyección de servicios utilizando la sintaxis 'inject' (Angular 16+)
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tareasService = inject(TareasService);
  public location = inject(Location);

  // Variables de Estado
  tareaForm!: FormGroup;               // Objeto raíz del formulario reactivo
  esEdicion = false;                    // Flag para diferenciar entre Crear y Editar
  idTarea: number | null = null;        // Almacena el ID si estamos editando
  actividades: ActividadDTO[] = [];     // Catálogo maestro de actividades recuperado del servicio
  modalActividadesVisible = false;      // Controla la visibilidad del modal de selección

  // Instancia del editor CKEditor
  public Editor = ClassicEditor;
  
  /**
   * CONFIGURACIÓN DE CKEDITOR 5
   * Define la barra de herramientas, plugins y comportamientos de imágenes/tablas.
   */
  public config = {
    licenseKey: 'GPL',
    language: 'es',
    translations: [translations],
    plugins: [
      Essentials, Paragraph, Bold, Italic, Link, List, 
      Image, ImageToolbar, ImageCaption, ImageStyle, ImageUpload, ImageResize,
      MediaEmbed, Table, TableToolbar, TableColumnResize, Heading, Indent, BlockQuote, Autoformat,
      Underline, Strikethrough, Font, Alignment, Highlight, RemoveFormat,
      Base64UploadAdapter // Permite subir imágenes directamente como cadenas Base64
    ],
    toolbar: [
      'undo', 'redo', '|', 
      'heading', '|', 
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'fontSize', 'fontColor', 'fontBackgroundColor', 'highlight', '|',
      'alignment', '|',
      'bulletedList', 'numberedList', 'blockQuote', '|',
      'insertTable', 'uploadImage', 'mediaEmbed', '|', 
      'outdent', 'indent', '|',
      'removeFormat'
    ],
    image: {
      toolbar: [
        'imageStyle:inline', 'imageStyle:block', 'imageStyle:side',
        '|', 'toggleImageCaption', 'imageTextAlternative',
        '|', 'resizeImage'
      ]
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
    }
  };

  // Opciones para el selector de evaluación de la empresa (según normativa Dualex)
  evaluacionEmpresaOptions = [
    'Sin Calificar', 
    'Superado', 
    'Bien', 
    'Notable', 
    'Excelente', 
    'No Superado'
  ];

  /**
   * INICIALIZACIÓN DEL COMPONENTE
   */
  ngOnInit(): void {
    this.crearFormulario();
    this.cargarActividades(); // Cargamos el catálogo para mapear IDs a Títulos
    
    // Detectamos si la URL contiene un ID para activar el modo edición
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'nueva') {
        this.esEdicion = true;
        this.idTarea = +id;
        this.cargarDatosTarea(this.idTarea);
      }
    });
  }

  /**
   * Recupera el catálogo de actividades desde el servicio.
   */
  cargarActividades(): void {
    this.tareasService.getActividades().subscribe(data => {
      this.actividades = data;
    });
  }

  /**
   * Recupera los datos de una tarea específica y los carga en el formulario.
   */
  cargarDatosTarea(id: number): void {
    this.tareasService.getTareaById(id).subscribe(tarea => {
      if (tarea) {
        // Mapeamos los datos del objeto al formulario reactivo
        this.tareaForm.patchValue(tarea);
        // Regeneramos el listado de módulos revisables según las actividades cargadas
        if (tarea.actividadesSeleccionadas) {
          this.actualizarRevisionesModulos(tarea.actividadesSeleccionadas);
        }
      }
    });
  }

  /**
   * Define la estructura y validaciones del formulario reactivo.
   */
  crearFormulario(): void {
    this.tareaForm = this.fb.group({
      titulo: ['', Validators.required],
      fechaIni: ['', Validators.required],
      fechaFin: ['', Validators.required],
      descripcion: [''],
      actividadesSeleccionadas: [[]],
      evaluacionEmpresa: ['Sin Calificar'],
      comentarioEmpresa: [''],
      moduloEvaluacion: [''],
      revisionesModulos: this.fb.array([]), // Array dinámico de revisiones por módulo
      revisadoProfesor: [false],
      comentarioProfesor: ['']
    });
  }

  /**
   * Gestión del Modal de Actividades
   */
  abrirModalActividades(): void {
    this.modalActividadesVisible = true;
  }

  /**
   * Se ejecuta cuando el modal de selección emite una nueva lista de IDs.
   */
  onSeleccionChange(ids: number[]): void {
    this.tareaForm.get('actividadesSeleccionadas')?.setValue(ids);
    this.actualizarRevisionesModulos(ids);
  }

  /**
   * Lógica de Módulos Dinámicos:
   * Calcula los módulos únicos presentes en las actividades seleccionadas y crea 
   * un control de revisión (checkbox) para cada uno de ellos.
   */
  private actualizarRevisionesModulos(ids: number[]): void {
    if (!ids || ids.length === 0) {
      this.revisionesModulosArray.clear();
      return;
    }

    // Identificamos los nombres de los módulos únicos implicados
    const modulosSeleccionados = this.actividades
      .filter(a => ids.includes(a.id))
      .map(a => a.modulo);

    const modulosUnicos = [...new Set(modulosSeleccionados)];
    
    // Mantenemos el estado de los checkboxes actuales para no resetearlos al añadir/quitar actividades
    const estadosActuales = new Map<string, boolean>();
    this.revisionesModulosArray.controls.forEach(ctrl => {
      const val = ctrl.value;
      estadosActuales.set(val.modulo, val.revisado);
    });

    // Reconstruimos el FormArray con los módulos únicos detectados
    this.revisionesModulosArray.clear();
    modulosUnicos.forEach(mod => {
      this.revisionesModulosArray.push(this.fb.group({
        modulo: [mod],
        revisado: [estadosActuales.get(mod) || false]
      }));
    });
  }

  /**
   * Getter para acceder fácilmente al FormArray de revisiones desde el HTML.
   */
  get revisionesModulosArray(): FormArray {
    return this.tareaForm.get('revisionesModulos') as FormArray;
  }

  /**
   * Devuelve los objetos ActividadDTO completos de las seleccionadas en el formulario.
   */
  getActividadesSeleccionadas(): ActividadDTO[] {
    const ids = this.tareaForm.get('actividadesSeleccionadas')?.value as number[];
    return this.actividades.filter(a => ids?.includes(a.id));
  }

  /**
   * Permite añadir o quitar una actividad individualmente desde los badges de la UI.
   */
  toggleActividad(id: number): void {
    const seleccionadas = this.tareaForm.get('actividadesSeleccionadas')?.value as number[];
    const index = seleccionadas.indexOf(id);
    if (index > -1) {
      seleccionadas.splice(index, 1);
    } else {
      seleccionadas.push(id);
    }
    const nuevasSeleccionadas = [...seleccionadas];
    this.tareaForm.get('actividadesSeleccionadas')?.setValue(nuevasSeleccionadas);
    this.actualizarRevisionesModulos(nuevasSeleccionadas);
  }

  /**
   * Persistencia de Datos
   * Llama al servicio para Crear o Actualizar la tarea actual.
   */
  guardar(): void {
    if (this.tareaForm.valid) {
      const datos = { 
        ...this.tareaForm.value,
        id: this.idTarea
      };

      if (this.esEdicion) {
        this.tareasService.updateTarea(datos).subscribe(() => {
          alert('Tarea actualizada correctamente.');
          this.volver();
        });
      } else {
        this.tareasService.createTarea(datos).subscribe(() => {
          alert('Tarea registrada correctamente.');
          this.volver();
        });
      }
    } else {
      alert('Por favor, completa los campos obligatorios antes de continuar.');
    }
  }

  /**
   * Navegación hacia atrás.
   */
  volver(): void {
    this.location.back();
  }
}
