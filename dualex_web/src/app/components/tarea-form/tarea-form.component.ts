import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

// Traducciones al español para CKEditor
import translations from 'ckeditor5/translations/es.js';

// Servicios y DTOs
import { TareasService } from '../../services/tareas.service';
import { ActividadesService } from '../../services/actividades.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../auth/services/auth.service';
import { ModulosService } from '../../services/modulos.service';
import { ActividadDTO, TareaDTO } from '../../dto/dualex.dto';

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
  imports: [CommonModule, ReactiveFormsModule, CKEditorModule, SeleccionActividadesModalComponent],
  templateUrl: './tarea-form.component.html',
  styleUrls: ['./tarea-form.component.css']
})
export class TareaFormComponent implements OnInit {
  // Inyección de servicios utilizando la sintaxis 'inject' (Angular 16+)
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public tareasService = inject(TareasService);
  private modulosService = inject(ModulosService);
  public location = inject(Location);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  get jwtToken(): string | null {
    return this.authService.getCookieNativa('auth_token');
  }

  // Variables de Estado
  tareaForm!: FormGroup;               // Objeto raíz del formulario reactivo
  esEdicion = false;                    // Flag para diferenciar entre Crear y Editar
  idTarea: number | null = null;        // Almacena el ID si estamos editando
  idAlumno: number | null = null;       // Almacena el ID del alumno si lo estamos especificando
  actividades: ActividadDTO[] = [];     // Catálogo maestro de actividades recuperado del servicio
  modalActividadesVisible = false;      // Controla la visibilidad del modal de selección
  esAlumno = false;                     // Flag para identificar si es un alumno
  esProfesor = false;                   // Flag para identificar si es un profesor/coordinador
  modulosTutor: any[] = [];             // Listado de módulos que imparte el profesor
  tareaBloqueada = false;               // Flag para saber si la tarea está bloqueada
  codigoTarea = '';                     // Código auto-generado de la tarea
  documentoFile: File | null = null;    // PDF nuevo seleccionado por el alumno
  documentoActual: string | null = null; // Nombre del PDF ya guardado
  modalSiguienteTareaVisible = false;
  siguienteTareaPendienteId: number | null = null;
  noHayMasTareas = false;

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
    const user = this.authService.currentUserValue;
    this.esAlumno = user?.rol === 'ALUMNO';
    this.esProfesor = user?.rol === 'PROFESOR' || (user?.rol === 'COORDINADOR' || user?.rol === 'COORDINADOR_GENERAL');
    this.crearFormulario();

    if (this.esProfesor && user?.email) {
      this.modulosService.getModulosProfesor(user.email)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(mods => {
          this.modulosTutor = mods || [];
          this.actualizarControlesPorTutor();
        });
    }

    // Detectamos el alumnoId en los queryParams (si viene de la vista de un alumno)
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const aId = params['alumnoId'];
      if (aId) {
        this.idAlumno = +aId;
      } else if (this.esAlumno) {
        this.idAlumno = user?.id ?? null;
      }
      
      if (!this.esEdicion) {
        this.cargarActividades();
      }
    });

    // Detectamos si la URL contiene un ID para activar el modo edición
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
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
    this.tareasService.getActividades(this.idAlumno ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        // Normalizar IDs por si el backend los devuelve como string
        this.actividades = (data || []).map((a: any) => ({
          ...a,
          id: typeof a?.id === 'number' ? a.id : Number(a?.id)
        }));
        const ids = this.getActividadesSeleccionadasIds();
        if (ids.length > 0) {
          this.actualizarRevisionesModulos(ids);
        }
      });
  }

  /**
   * Recupera los datos de una tarea específica y los carga en el formulario.
   */
  cargarDatosTarea(id: number): void {
    this.tareasService.getTareaById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tarea => {
        if (tarea) {
          if (tarea.idAlumno) {
            this.idAlumno = tarea.idAlumno;
          }
          this.cargarActividades();

          if (tarea.codigo_auto) {
            this.codigoTarea = tarea.codigo_auto;
          }
          this.documentoActual = tarea.documento ?? null;
          this.documentoFile = null;
          // Mapeamos los datos del objeto al formulario reactivo
          const actividadesNorm = this.normalizarIds(tarea.actividadesSeleccionadas);
          this.tareaForm.patchValue({ ...tarea, actividadesSeleccionadas: actividadesNorm });
          // Regeneramos el listado de módulos revisables según las actividades cargadas
          if (actividadesNorm.length > 0) {
            this.actualizarRevisionesModulos(actividadesNorm, tarea.revisionesModulos);
          }
          // Aplicamos la lógica de bloqueo y permisos
          this.aplicarBloqueos(tarea);
        }
      });
  }

  private normalizarIds(ids: unknown): number[] {
    const arr = Array.isArray(ids) ? ids : [];
    return arr
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((n) => Number.isFinite(n));
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
      revisionesModulos: this.fb.array([]), // Array dinámico de revisiones por módulo
      revisadoProfesor: [false],
      comentarioProfesor: ['']
    });

    if (this.esAlumno) {
      this.tareaForm.get('comentarioProfesor')?.disable();
    }

    if (this.esProfesor) {
      this.aplicarPermisosProfesor();
    }
  }

  private aplicarPermisosProfesor(): void {
    if (!this.esProfesor) return;

    this.tareaForm.get('titulo')?.disable({ emitEvent: false });
    this.tareaForm.get('fechaIni')?.disable({ emitEvent: false });
    this.tareaForm.get('fechaFin')?.disable({ emitEvent: false });
    this.tareaForm.get('descripcion')?.disable({ emitEvent: false });
    this.tareaForm.get('evaluacionEmpresa')?.disable({ emitEvent: false });
    this.tareaForm.get('comentarioEmpresa')?.disable({ emitEvent: false });
    this.tareaForm.get('comentarioProfesor')?.disable({ emitEvent: false });
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
    const normalizadas = this.normalizarIds(ids);
    this.tareaForm.get('actividadesSeleccionadas')?.setValue(normalizadas);
    this.actualizarRevisionesModulos(normalizadas);
  }

  /**
   * Comprueba si un módulo (por nombre o siglas) pertenece al profesor actual.
   */
  perteneceAlTutor(nombreModulo: string): boolean {
    if (!this.esProfesor) return true;
    return this.modulosTutor.some(m =>
      m.nombre?.toLowerCase() === nombreModulo.toLowerCase() ||
      m.sigla?.toLowerCase() === nombreModulo.toLowerCase()
    );
  }

  /**
   * Recorre la lista de controles de revisión y deshabilita los que no pertenecen al tutor.
   */
  actualizarControlesPorTutor(): void {
    if (!this.esProfesor) return;
    this.revisionesModulosArray.controls.forEach(ctrl => {
      const modName = ctrl.get('modulo')?.value;
      if (modName && !this.perteneceAlTutor(modName)) {
        ctrl.disable({ emitEvent: false });
      } else {
        if (!this.esAlumno) {
          ctrl.enable({ emitEvent: false });
        }
      }
    });
  }

  /**
   * Comprueba si la tarea debe bloquearse según las reglas del negocio:
   * - Si está totalmente revisada (todas las revisiones de módulos están en 'true')
   * - O si se ha superado la fecha límite (fechaFin).
   */
  checkBloqueada(tarea: TareaDTO): boolean {
    if (!tarea) return false;

    // 1. Revisada por completo
    const revisada = !!tarea.revisadoProfesor;

    // 2. Pasada de fecha
    let pasadaFecha = false;
    if (tarea.fechaFin) {
      const fechaFinDate = new Date(tarea.fechaFin);
      fechaFinDate.setHours(23, 59, 59, 999);
      pasadaFecha = new Date() > fechaFinDate;
    }

    return revisada || pasadaFecha;
  }

  /**
   * Comprueba si el usuario actual tiene permisos para modificar la sección
   * de actividades relacionadas.
   */
  puedoEditarActividades(): boolean {
    if (this.esAlumno) {
      return !this.tareaBloqueada;
    }
    return true;
  }

  /**
   * Aplica la lógica de bloqueo sobre los controles del formulario según el rol y estado.
   */
  aplicarBloqueos(tarea: TareaDTO): void {
    this.tareaBloqueada = this.checkBloqueada(tarea);

    if (this.esAlumno) {
      if (this.tareaBloqueada) {
        this.tareaForm.disable();
      } else {
        this.tareaForm.enable();
        this.tareaForm.get('comentarioProfesor')?.disable();
        this.revisionesModulosArray.disable();
      }
      return;
    }

    if (this.esProfesor) {
      this.tareaForm.enable({ emitEvent: false });
      this.aplicarPermisosProfesor();
      this.actualizarControlesPorTutor();
      return;
    }

    this.tareaForm.enable();
  }

  /**
   * Lógica de Módulos Dinámicos:
   * Calcula los módulos únicos presentes en las actividades seleccionadas y crea 
   * un control de revisión (checkbox) para cada uno de ellos.
   */
  private actualizarRevisionesModulos(ids: number[], revisionesCargadas?: any[]): void {
    const idsNormalizadas = this.normalizarIds(ids);
    if (!idsNormalizadas || idsNormalizadas.length === 0) {
      this.revisionesModulosArray.clear();
      return;
    }

    // Identificamos los nombres de los módulos únicos implicados
    const modulosSeleccionados: string[] = [];
    this.actividades
      .filter(a => idsNormalizadas.includes(a.id))
      .forEach(a => {
        if (a.modulo) {
          a.modulo.split(',').forEach(m => {
            const trimmed = m.trim();
            if (trimmed && trimmed !== 'Sin módulos') {
              modulosSeleccionados.push(trimmed);
            }
          });
        }
      });

    const modulosUnicos = [...new Set(modulosSeleccionados)];

    // Mantenemos el estado de los checkboxes y comentarios actuales para no resetearlos al añadir/quitar actividades
    const estadosActuales = new Map<string, boolean>();
    const comentariosActuales = new Map<string, string>();

    // Si hay revisiones previamente cargadas desde el backend, las sembramos primero
    if (revisionesCargadas && revisionesCargadas.length > 0) {
      revisionesCargadas.forEach(rev => {
        estadosActuales.set(rev.modulo, rev.revisado);
        comentariosActuales.set(rev.modulo, rev.comentario || '');
      });
    }

    // También mantenemos el estado de los checkboxes y comentarios en pantalla si ya existen controles en el FormArray
    this.revisionesModulosArray.controls.forEach(ctrl => {
      const val = ctrl.value;
      estadosActuales.set(val.modulo, val.revisado);
      comentariosActuales.set(val.modulo, val.comentario || '');
    });

    // Reconstruimos el FormArray con los módulos únicos detectados
    this.revisionesModulosArray.clear();
    modulosUnicos.forEach(mod => {
      const grupo = this.fb.group({
        modulo: [mod],
        revisado: [estadosActuales.get(mod) || false],
        comentario: [comentariosActuales.get(mod) || '']
      });

      let disableControl = false;
      if (this.esAlumno) {
        disableControl = true;
      } else if (this.esProfesor) {
        if (!this.perteneceAlTutor(mod)) {
          disableControl = true;
        }
      }

      if (disableControl) {
        grupo.disable();
      }

      this.revisionesModulosArray.push(grupo);
    });
  }

  /**
   * Getter para acceder fácilmente al FormArray de revisiones desde el HTML.
   */
  get revisionesModulosArray(): FormArray {
    return this.tareaForm.get('revisionesModulos') as FormArray;
  }

  getActividadesSeleccionadasIds(): number[] {
    return this.normalizarIds(this.tareaForm.get('actividadesSeleccionadas')?.value);
  }

  /**
   * Devuelve los objetos ActividadDTO completos de las seleccionadas en el formulario.
   */
  getActividadesSeleccionadas(): ActividadDTO[] {
    const ids = this.getActividadesSeleccionadasIds();
    return this.actividades.filter(a => ids.includes(a.id));
  }

  /**
   * Permite añadir o quitar una actividad individualmente desde los badges de la UI.
   */
  toggleActividad(id: number): void {
    const seleccionadas = this.getActividadesSeleccionadasIds();
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
    // Validación específica de profesor: si marca un módulo como revisado,
    // el comentario asociado no puede ir vacío y debe tener mínimo 10 caracteres.
    this.validarComentariosProfesor();

    if (this.tareaForm.valid) {
      const datos = {
        ...this.tareaForm.getRawValue(),
        id: this.idTarea,
        idAlumno: this.idAlumno
      };

      if (this.esEdicion) {
        this.tareasService.updateTarea(datos).subscribe({
          next: () => {
            if (this.documentoFile && this.idTarea) {
              this.tareasService.subirDocumento(this.idTarea, this.documentoFile).subscribe({
                next: () => {
                  this.gestionarPostGuardado();
                },
                error: (err) => {
                  const msg = err?.error?.message || err?.message || 'No se pudo subir el documento.';
                  this.alertService.error('Error al subir el documento', msg);
                }
              });
            } else {
              this.gestionarPostGuardado();
            }
          },
          error: (err) => {
            const msg = err?.error?.message || err?.message || 'No se pudo guardar la tarea.';
            this.alertService.error('Error al guardar', msg);
          }
        });
      } else {
        this.tareasService.createTarea(datos).subscribe({
          next: (res: any) => {
            const nuevoId = res.id || res.idTarea; // Depending on backend response
            if (this.documentoFile && nuevoId) {
              this.tareasService.subirDocumento(nuevoId, this.documentoFile).subscribe({
                next: () => {
                  this.alertService.exito('Tarea registrada', 'La tarea se ha creado correctamente.');
                  this.volver();
                },
                error: (err) => {
                  const msg = err?.error?.message || err?.message || 'No se pudo subir el documento.';
                  this.alertService.error('Error al subir el documento', msg);
                }
              });
            } else {
              this.alertService.exito('Tarea registrada', 'La tarea se ha creado correctamente.');
              this.volver();
            }
          },
          error: (err) => {
            const msg = err?.error?.message || err?.message || 'No se pudo crear la tarea.';
            this.alertService.error('Error al guardar', msg);
          }
        });
      }
    } else {
      this.tareaForm.markAllAsTouched();
      this.alertService.advertencia('Formulario no válido', 'Por favor, completa los campos obligatorios antes de continuar.');
    }
  }

  private gestionarPostGuardado(): void {
    this.alertService.exito('Tarea actualizada', 'La tarea se ha guardado correctamente.');

    if (!this.esProfesor || !this.idAlumno || !this.idTarea) {
      this.volver();
      return;
    }

    this.tareasService.getTareasByAlumno(this.idAlumno)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tareas) => {
          const siguiente = [...(tareas || [])]
            .filter((tarea) => tarea.id !== this.idTarea)
            .filter((tarea) => (tarea.progreso?.actual ?? 0) < (tarea.progreso?.total ?? 1))
            .sort((a, b) => {
              const fechaA = a.fechaFin ? new Date(a.fechaFin).getTime() : Number.MAX_SAFE_INTEGER;
              const fechaB = b.fechaFin ? new Date(b.fechaFin).getTime() : Number.MAX_SAFE_INTEGER;
              if (fechaA !== fechaB) return fechaA - fechaB;
              return a.id - b.id;
            })[0];
  
          if (!siguiente) {
            this.siguienteTareaPendienteId = null;
            this.modalSiguienteTareaVisible = true;
            return;
          }
  
          this.siguienteTareaPendienteId = siguiente.id;
          this.modalSiguienteTareaVisible = true;
        },
  
        error: () => {
          this.volver();
        }
      });
  }

  irASiguienteTareaPendiente(): void {
    if (!this.siguienteTareaPendienteId || !this.idAlumno) {
      this.cerrarModalSiguienteTarea();
      this.volver();
      return;
    }

    const siguienteId = this.siguienteTareaPendienteId;
    this.cerrarModalSiguienteTarea();
    this.router.navigate(['/tarea', siguienteId], { queryParams: { alumnoId: this.idAlumno }, replaceUrl: true });
  }

  cerrarModalSiguienteTarea(): void {
    this.modalSiguienteTareaVisible = false;
    this.siguienteTareaPendienteId = null;
  }

  cancelarPasoASiguienteTarea(): void {
    this.cerrarModalSiguienteTarea();
    this.volver();
  }

  private validarComentariosProfesor(): void {
    if (!this.esProfesor) return;

    this.revisionesModulosArray.controls.forEach(ctrl => {
      // Respetar controles deshabilitados (p.ej. módulos que no son del tutor)
      if (ctrl.disabled) return;

      const comentarioCtrl = ctrl.get('comentario');
      if (!comentarioCtrl) return;

      comentarioCtrl.setValidators([Validators.required, Validators.minLength(10)]);

      comentarioCtrl.updateValueAndValidity({ emitEvent: false });
    });

    // Forzar feedback visual si el usuario intenta guardar sin cumplir validación
    if (this.tareaForm.invalid) {
      this.tareaForm.markAllAsTouched();
      this.revisionesModulosArray.controls.forEach(ctrl => {
        ctrl.get('comentario')?.markAsDirty();
      });
    }
  }

  /**
   * Navegación hacia atrás.
   */
  volver(): void {
    this.location.back();
  }

  // â”€â”€â”€ Gestión de Adjuntos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Se ejecuta cuando el usuario selecciona archivos con el input nativo.
   */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.asignarDocumento(input.files[0] ?? null);
      // Resetear input para permitir re-seleccionar el mismo archivo
      input.value = '';
    }
  }

  /**
   * Se ejecuta cuando el usuario arrastra y suelta archivos en la zona de drop.
   */
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.asignarDocumento(event.dataTransfer.files[0] ?? null);
    }
  }

  /**
   * Valida y asigna el PDF seleccionado por el alumno.
   */
  private asignarDocumento(archivo: File | null): void {
    const MAX_SIZE_MB = 20;
    if (!archivo) {
      return;
    }

    const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    const mimeValido = archivo.type === 'application/pdf' || archivo.type === '';

    if (extension !== 'pdf' || !mimeValido) {
      this.alertService.advertencia(
        'Formato no permitido',
        'Solo se permite subir un archivo PDF.'
      );
      return;
    }

    if (archivo.size > MAX_SIZE_MB * 1024 * 1024) {
      this.alertService.advertencia(
        'Archivo demasiado grande',
        ('"' + archivo.name + '" supera el limite de ' + MAX_SIZE_MB + ' MB.')
      );
      return;
    }

    this.documentoFile = archivo;
  }

  /**
   * Elimina el PDF nuevo seleccionado.
   */
  eliminarAdjunto(): void {
    this.documentoFile = null;
  }

  /**
   * (Nota) El "Abrir" del PDF en este formulario se ha eliminado a petición.
   * La visualización del PDF se mantiene en "Gestión de Tareas".
   */
  /**
   * Devuelve la clase CSS del icono según la extensión del archivo.
   */
  getAdjuntoIconClass(nombre: string): string {
    const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
    if (['pdf'].includes(ext))                        return 'adjunto-icon--pdf';
    if (['doc', 'docx'].includes(ext))               return 'adjunto-icon--word';
    if (['xls', 'xlsx'].includes(ext))               return 'adjunto-icon--excel';
    if (['ppt', 'pptx'].includes(ext))               return 'adjunto-icon--ppt';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'adjunto-icon--img';
    if (['zip', 'rar', '7z'].includes(ext))          return 'adjunto-icon--zip';
    return 'adjunto-icon--generic';
  }

  /**
   * Devuelve la clase del icono Font Awesome según la extensión del archivo.
   */
  getAdjuntoIcon(nombre: string): string {
    const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
    if (['pdf'].includes(ext))                        return 'fa-solid fa-file-pdf';
    if (['doc', 'docx'].includes(ext))               return 'fa-solid fa-file-word';
    if (['xls', 'xlsx'].includes(ext))               return 'fa-solid fa-file-excel';
    if (['ppt', 'pptx'].includes(ext))               return 'fa-solid fa-file-powerpoint';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'fa-solid fa-file-image';
    if (['zip', 'rar', '7z'].includes(ext))          return 'fa-solid fa-file-zipper';
    if (['txt'].includes(ext))                        return 'fa-solid fa-file-lines';
    return 'fa-solid fa-file';
  }

  /**
   * Formatea el tamaño de un archivo en bytes a una representación legible.
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

