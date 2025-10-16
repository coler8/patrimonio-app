import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatrimonioApiService {
  private readonly apiUrl = 'https://api.jsonbin.io/v3/b'; // endpoint base
  private readonly binId = '68f1470243b1c97be96bea3e'; // 👈 pon aquí el ID que te da JSONBin
  private readonly apiKey = '$2a$10$J1RgE369aeBh7IDZZV6F4u0HEqcjQUWE7RF.cYZo3d3cht8mfXEdC'; // 👈 pon tu API Key

  constructor(private http: HttpClient) {}

  private get headers() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Master-Key': this.apiKey,
    });
  }

  /** 🔹 Obtener tu patrimonio completo */
  getPatrimonio(): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/${this.binId}`, { headers: this.headers })
      .pipe(map((res: any) => res.record)); // JSONBin devuelve {record: {...}}
  }

  /** 🔹 Actualizar todo el JSON (por ejemplo, añadir mes nuevo) */
  updatePatrimonio(patrimonio: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${this.binId}`, patrimonio, {
      headers: this.headers,
    });
  }
}
