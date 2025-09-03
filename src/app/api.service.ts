import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface AgentResponse {
  agentName: string;
  analysis: string;
}

export interface BiasReport {
  responses: AgentResponse[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly textUrl = 'http://localhost:8080/api/chat';
  private readonly pdfUrl = 'http://localhost:8080/api/pdf';

  constructor(private http: HttpClient) {}

  analyzeText(text: string): Observable<BiasReport> {
    return this.http.post<BiasReport>(this.textUrl, { text });
  }

  analyzePdf(file: File): Observable<HttpEvent<BiasReport>> {
    // Client-side validation: PDF and <= 5MB
    const maxBytes = 2 * 1024 * 1024;
    const isPdf = file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (!file || !isPdf) {
      return throwError(() => new Error('Please upload a valid PDF file.'));
    }
    if (file.size > maxBytes) {
      return throwError(() => new Error('File too large. Max size is 2MB.'));
    }

    const form = new FormData();
    form.append('file', file);

    return this.http.post<BiasReport>(this.pdfUrl, form, {
      reportProgress: true,
      observe: 'events'
    });
  }
}
