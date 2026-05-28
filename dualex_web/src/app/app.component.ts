import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/shared/header/header.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { AlertsComponent } from './components/shared/alerts/alerts.component';
import { PruebasSistemaComponent } from './components/shared/pruebas-sistema/pruebas-sistema.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, AlertsComponent, PruebasSistemaComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Dualex v19';
  developerMode = environment.developerMode;
  private router = inject(Router);

  ngOnInit() {
    // Si estamos en el navegador, gestionar el estado de navegación
    if (typeof window !== 'undefined' && window.sessionStorage) {
      // Restaurar la última ruta si existe en sessionStorage y estamos en la ruta principal
      const savedRoute = sessionStorage.getItem('currentRoute');
      if (savedRoute && savedRoute !== '/' && window.location.pathname === '/') {
        // Redirigimos internamente sin afectar a la URL del navegador
        this.router.navigateByUrl(savedRoute);
      }

      // Guardar la ruta actual en cada navegación exitosa
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          sessionStorage.setItem('currentRoute', event.urlAfterRedirects);
        }
      });
    }
  }
}
