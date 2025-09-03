import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, BiasReport } from './api.service';
import { HttpEventType, HttpEvent } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { NavbarComponent } from './navbar/navbar.component';
import { HeroComponent } from './hero/hero.component';
import { DemoComponent } from './demo/demo.component';
import { CardsComponent } from './cards/cards.component';
import { WhyClarityCards } from './why-clarity-cards/why-clarity-cards';
import { PricingComponent } from './pricing/pricing.component';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, HeroComponent, DemoComponent, CardsComponent, WhyClarityCards, PricingComponent, FooterComponent],
  // App is now a simple shell composing feature components
  template: `
<app-navbar></app-navbar>
<app-hero></app-hero>
<app-demo></app-demo>
<app-cards></app-cards>
<app-why-clarity-cards></app-why-clarity-cards>
<app-pricing></app-pricing>
<app-footer></app-footer>
  `,
  styleUrl: './app.css'
})
export class App {}
