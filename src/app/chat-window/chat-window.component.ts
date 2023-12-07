// src/app/chat-window/chat-window.component.ts

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit {
  userMessage: string = '';
  messages: Message[] = [];
  isProcessing = false;
  aiMessageIndex: number | null = null;
  readonly messagesSubject = new BehaviorSubject<Message[]>([]);
  readonly messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }
  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
  handleUpdateMessage(index: number, updatedContent: string): void {
    // Update the content of the message that was edited.
    const updatedMessages = this.messages.map((msg, i) => 
      i === index ? { ...msg, content: updatedContent } : msg
    );
  
    // Remove all messages after the edited message.
    this.messages = updatedMessages.slice(0, index + 1);
    this.messagesSubject.next(this.messages);
  
    // Assuming the role of the edited message is 'user' and the system is not currently processing.
    if (this.messages[index].role === 'user' && !this.isProcessing) {
      // Resend messages to the server for processing.
      this.resendMessagesUpToIndex(index);
    }
  }
  

  async resendMessagesUpToIndex(index: number): Promise<void> {
    this.isProcessing = true;
    const requestDataMessages: Message[] = this.messages.slice(0, index + 1).concat({ role: 'system', content: '### Instruction: You know full form of all the short forms. your job is to provide full forms and nothing else. PLEASE KEEP YOUR ANSWER AS SHORT AS POSSIBLE.' });
    await this.sendRequestToServer(requestDataMessages);
  }

  async sendRequestToServer(requestDataMessages: Message[]): Promise<void> {
    const requestData = {
      messages: requestDataMessages,
      stop: ["### Instruction:"],
      temperature: 0.7,
      max_tokens: 30,
      stream: true
    };

    try {
      const response = await fetch('http://localhost:1234/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.body) {
        console.error('No response body');
        return;
      }
      const reader = response.body.getReader();
      let decoder = new TextDecoder();
      let data = '';

      this.aiMessageIndex = this.messages.length;
      this.messages.push({ role: 'assistant', content: '' });
      this.messagesSubject.next(this.messages);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        data += decoder.decode(value, { stream: true });

        let lines = data.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
          let line = lines[i];
          if (line.startsWith('data: ')) {
            let jsonText = line.substring(6);
            let chunk = JSON.parse(jsonText);
            const aiMessageFragment = chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content ? chunk.choices[0].delta.content : '';

            this.messages[this.aiMessageIndex!] = {
              role: 'assistant',
              content: this.messages[this.aiMessageIndex!].content + aiMessageFragment
            };
            this.messagesSubject.next(this.messages);
          }
        }
        data = lines[lines.length - 1];
      }

    } catch (error) {
      if (error instanceof Error) {
          console.error('Error:', error.message);
          this.messages.push({ role: 'assistant', content: 'Error: ' + error.message });
          this.messagesSubject.next(this.messages);
      } else {
          // handle other potential thrown values (strings, numbers, etc.)
          console.error('An error occurred:', error);
          this.messages.push({ role: 'assistant', content: 'An error occurred: ' + error });
          this.messagesSubject.next(this.messages);
      }
  }

    this.isProcessing = false;
  }

  async sendMessage(): Promise<void> {
    if (this.isProcessing || !this.userMessage.trim()) return;

    this.isProcessing = true;
    this.messages.push({ role: 'user', content: this.userMessage });
    this.userMessage = '';
    const requestDataMessages: Message[] = [...this.messages, { role: 'system', content: '### Instruction: You know full form of all the short forms. your job is to provide full forms and nothing else. PLEASE KEEP YOUR ANSWER AS SHORT AS POSSIBLE.' }];
    await this.sendRequestToServer(requestDataMessages);
  }
}
