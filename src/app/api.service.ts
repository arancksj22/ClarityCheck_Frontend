import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';

export interface AgentResponse {
  agentName: string;
  analysis: string;
}

export interface BiasReport {
  responses: AgentResponse[];
}

export interface AnalysisResponse {
  ethics_chunks: string[];
  bias_chunks: string[];
  fallacy_chunks: string[];
  total_chunks_found: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly textUrl = `${this.baseUrl}/api/chat`;
  private readonly s3UploadUrl = `${this.baseUrl}/s3/upload`;
  private readonly s3ListUrl = `${this.baseUrl}/s3/files`;

  constructor(private http: HttpClient) {}

  // Public endpoint - no authentication
  analyzeText(text: string): Observable<BiasReport> {
    return this.http.post<BiasReport>(this.textUrl, { text });
  }

  // S3 endpoints - require authentication (credentials: include)
  uploadPdf(file: File): Observable<HttpEvent<any>> {
    const maxBytes = 10 * 1024 * 1024; // 10MB
    const isPdf = file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    
    if (!file || !isPdf) {
      return throwError(() => new Error('Please upload a valid PDF file.'));
    }
    if (file.size > maxBytes) {
      return throwError(() => new Error('File too large. Max size is 10MB.'));
    }

    const form = new FormData();
    form.append('file', file);

    return this.http.post<any>(this.s3UploadUrl, form, {
      reportProgress: true,
      observe: 'events',
      withCredentials: true
    });
  }

  listFiles(): Observable<string[]> {
    return this.http.get<string[]>(this.s3ListUrl, {
      withCredentials: true
    });
  }

  deleteFile(fileName: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/s3/delete/${fileName}`, {
      withCredentials: true
    });
  }

  downloadFile(fileName: string): void {
    window.open(`${this.baseUrl}/s3/download/${fileName}`, '_blank');
  }
}
