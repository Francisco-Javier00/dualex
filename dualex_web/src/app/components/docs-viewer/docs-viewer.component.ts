import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

/**
 * Componente que embebe la documentación técnica (Frontend o Backend)
 * dentro de un iframe, manteniendo la URL limpia en la barra del navegador.
 */
@Component({
  selector: 'app-docs-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs-viewer.component.html',
  styleUrls: ['./docs-viewer.component.css']
})
export class DocsViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  docUrl: SafeResourceUrl = '';
  titulo = '';

  ngOnInit(): void {
    const tipo = this.route.snapshot.paramMap.get('tipo');
    if (tipo === 'backend') {
      this.titulo = 'API Backend – phpDocumentor';
      this.docUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/assets/docs/backend/index.html');
    } else {
      this.titulo = 'Frontend – TypeDoc';
      this.docUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/assets/docs/frontend/index.html');
    }
  }
}
