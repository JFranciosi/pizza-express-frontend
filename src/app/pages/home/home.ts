import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { GameSocketService, GameState } from '../../services/game-socket.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule],
    templateUrl: './home.html',
    styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    private ctx!: CanvasRenderingContext2D;

    gameState: GameState = GameState.WAITING;
    multiplier: number = 1.00;
    timeLeft: number = 0;

    private subs: Subscription[] = [];
    private animationFrameId: number | null = null;

    // Costante di crescita identica al backend per predizione clientside
    private readonly GROWTH_RATE = 0.00006;

    // Tempo di avvio virtuale del round corrente (per sincronizzare la curva)
    private roundStartTime: number = 0;
    // Tempo di fine attesa (per smooth countdown)
    private waitingEndTime: number = 0;

    constructor(
        private authService: AuthService,
        private router: Router,
        private gameSocket: GameSocketService
    ) { }

    ngOnInit() {
        this.subs.push(
            this.gameSocket.gameState$.subscribe(state => {
                this.gameState = state;
                if (state === GameState.FLYING) {
                    this.startDrawing();
                } else if (state === GameState.CRASHED) {
                    this.stopDrawing();
                    this.drawCrash();
                } else {
                    this.startDrawing(); // WAITING: avvia loop per animazione fluida
                }
            }),
            this.gameSocket.multiplier$.subscribe(serverMultiplier => {
                if (serverMultiplier > 1.0) {
                    const timeElapsed = Math.log(serverMultiplier) / this.GROWTH_RATE;
                    this.roundStartTime = Date.now() - timeElapsed;
                } else {
                    this.roundStartTime = Date.now();
                }
                this.multiplier = serverMultiplier;
            }),
            this.gameSocket.timeLeft$.subscribe(t => {
                this.timeLeft = t;
                // Sincronizza il tempo di fine attesa
                const estimatedEnd = Date.now() + t * 1000;
                // Aggiorna solo se drift significativo (>500ms) o non impostato
                if (Math.abs(estimatedEnd - this.waitingEndTime) > 500 || this.waitingEndTime === 0) {
                    this.waitingEndTime = estimatedEnd;
                }
            })
        );
    }

    ngAfterViewInit() {
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d')!;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Avvia loop se siamo già in waiting
        if (this.gameState === GameState.WAITING) {
            this.startDrawing();
        } else {
            this.drawWaiting();
        }
    }

    resizeCanvas() {
        const canvas = this.canvasRef.nativeElement;
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = 400; // Altezza fissa o dinamica
        }
        if (this.gameState === GameState.FLYING) {
            // Non facciamo nulla, il loop ridisegnerà
        } else if (this.gameState === GameState.CRASHED) {
            this.drawCrash();
        } else {
            this.drawWaiting();
        }
    }

    startDrawing() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

        const draw = () => {
            if (this.gameState === GameState.FLYING) {
                const now = Date.now();
                const elapsed = now - this.roundStartTime;
                const predictedMultiplier = Math.exp(this.GROWTH_RATE * elapsed);
                this.multiplier = Math.max(this.multiplier, predictedMultiplier);
                this.drawGame();
                this.animationFrameId = requestAnimationFrame(draw);
            } else if (this.gameState === GameState.WAITING) {
                this.drawWaiting();
                this.animationFrameId = requestAnimationFrame(draw);
            }
        };
        this.animationFrameId = requestAnimationFrame(draw);
    }

    stopDrawing() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    drawGame() {
        const w = this.canvasRef.nativeElement.width;
        const h = this.canvasRef.nativeElement.height;
        this.ctx.clearRect(0, 0, w, h);

        // Disegna assi
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(40, h - 40);
        this.ctx.lineTo(w, h - 40); // X axis
        this.ctx.moveTo(40, h - 40);
        this.ctx.lineTo(40, 0); // Y axis
        this.ctx.stroke();

        // Calcola la curva
        // La curva è esponenziale. Per visualizzarla bene, mappiamo X come tempo e Y come moltiplicatore

        const maxY = Math.max(2.0, this.multiplier * 1.2); // Scala dinamica Y

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e91e63'; // Colore principale (rosa/rosso)
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';

        // Disegniamo la curva
        this.ctx.moveTo(40, h - 40);

        const normalizedY = (this.multiplier - 1) / (maxY - 1);
        const yPos = (h - 40) - (normalizedY * (h - 60));

        this.ctx.quadraticCurveTo(w / 2, h - 40, w - 50, yPos);
        this.ctx.stroke();

        // Disegna il "Razzo"
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(w - 50, yPos, 6, 0, Math.PI * 2);
        this.ctx.fill();

        // Disegna il valore grande al centro
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.multiplier.toFixed(2) + 'x', w / 2, h / 2);

        // Stato
        this.ctx.font = '20px Inter, sans-serif';
        this.ctx.fillStyle = '#4caf50';
        this.ctx.fillText('FLYING', w / 2, h / 2 + 30);
    }

    drawCrash() {
        const w = this.canvasRef.nativeElement.width;
        const h = this.canvasRef.nativeElement.height;
        this.ctx.clearRect(0, 0, w, h);

        // Background rossastro per crash
        this.ctx.fillStyle = 'rgba(233, 30, 99, 0.1)';
        this.ctx.fillRect(0, 0, w, h);

        this.ctx.fillStyle = '#e91e63';
        this.ctx.font = 'bold 48px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.multiplier.toFixed(2) + 'x', w / 2, h / 2);

        this.ctx.font = 'bold 24px Inter, sans-serif';
        this.ctx.fillText('CRASHED', w / 2, h / 2 + 40);
    }

    drawWaiting() {
        const w = this.canvasRef.nativeElement.width;
        const h = this.canvasRef.nativeElement.height;
        this.ctx.clearRect(0, 0, w, h);

        const centerX = w / 2;
        const centerY = h / 2;
        // Calcolo fluido del tempo rimanente
        const now = Date.now();
        const remainingMs = Math.max(0, this.waitingEndTime - now);
        const remainingSecs = Math.ceil(remainingMs / 1000);
        const maxTimeMs = 10000;
        const progress = Math.min(1, Math.max(0, remainingMs / maxTimeMs));

        // Testo "WAITING"
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('WAITING FOR NEXT ROUND', centerX, centerY - 40);

        // Numero secondi grande
        this.ctx.font = 'bold 64px Inter, sans-serif';
        this.ctx.fillText(remainingSecs.toString(), centerX, centerY + 20);

        // Progress Bar Lineare
        const barWidth = 300;
        const barHeight = 6;
        const barX = centerX - barWidth / 2;
        const barY = centerY + 80;

        // Background bar
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Foreground bar (progress)
        const currentBarWidth = barWidth * progress;
        this.ctx.fillStyle = '#e91e63'; // Theme color

        // Shadow/Glow per effetto neon
        this.ctx.shadowColor = '#e91e63';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(barX, barY, currentBarWidth, barHeight);

        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
        this.stopDrawing();
        window.removeEventListener('resize', () => this.resizeCanvas());
    }
}
