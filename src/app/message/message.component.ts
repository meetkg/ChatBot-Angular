// message.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent {
  @Input() role!: string;
  @Input() content!: string;
  @Output() update = new EventEmitter<string>();
  
  isEditing = false;
  editedContent: string = '';


  handleEdit() {
    this.isEditing = true;
    this.editedContent = this.content;
  }

  handleSave() {
    this.isEditing = false;
    this.update.emit(this.editedContent);
  }
}
