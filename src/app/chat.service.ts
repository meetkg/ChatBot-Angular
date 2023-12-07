import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = 'http://localhost:1234/v1/chat/completions';

  constructor(private http: HttpClient) {}

  sendMessage(userMessage: string): Observable<any> {
    const requestData = {
      messages: [{ role: 'user', content: userMessage }],
      stop: ['### Instruction:'],
      temperature: 0.7,
      max_tokens: -1,
      stream: true,
    };

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };

    return this.http.post(this.apiUrl, requestData, httpOptions);
  }
}
