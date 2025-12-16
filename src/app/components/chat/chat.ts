import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
    templateUrl: './chat.html',
    styleUrl: './chat.css'
})
export class ChatComponent implements OnInit {
    messages: any[] = [];
    newMessage: string = '';

    ngOnInit() {
        this.messages = [
            { user: 'Mario', text: 'Buona fortuna a tutti! 🍀', time: '11:30' },
            { user: 'Luigi', text: 'Vado per il 2x!', time: '11:31' },
            { user: 'Admin', text: 'Benvenuti su Pizza Express Crash!', time: '11:32', type: 'system' }
        ];
    }

    sendMessage() {
        if (this.newMessage.trim()) {
            this.messages.push({
                user: 'Me',
                text: this.newMessage,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            this.newMessage = '';
        }
    }
}
