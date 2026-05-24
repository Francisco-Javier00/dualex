import { Injectable, Injector, inject } from '@angular/core';
import { Location, LocationStrategy } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CustomLocation extends Location {
  private history: string[] = [];
  private injector = inject(Injector);

  private get router(): Router {
    return this.injector.get(Router);
  }

  constructor(platformStrategy: LocationStrategy) {
    super(platformStrategy);

    // Defer the subscription to avoid circular dependency during application bootstrapping
    setTimeout(() => {
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          const url = event.urlAfterRedirects;
          // Avoid pushing duplicate routes next to each other
          if (this.history.length === 0 || this.history[this.history.length - 1] !== url) {
            this.history.push(url);
          }
        }
      });
    });
  }

  override back(): void {
    if (this.history.length > 1) {
      this.history.pop(); // Remove the current URL
      const prevUrl = this.history.pop(); // Retrieve the previous URL
      if (prevUrl) {
        this.router.navigateByUrl(prevUrl);
        return;
      }
    }

    // Default fallback: Go to the root route '/' which handles role-based redirection
    this.router.navigateByUrl('/');
  }
}
