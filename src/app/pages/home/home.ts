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
                    // Se non abbiamo ancora un tempo di start (es. join in ritardo), lo stimiamo
                    // Ma idealmente 'startDrawing' lo gestisce
                    this.startDrawing();
                } else if (state === GameState.CRASHED) {
                    this.stopDrawing();
                    this.drawCrash();
                } else {
                    this.stopDrawing();
                    this.drawWaiting();
                }
            }),
            this.gameSocket.multiplier$.subscribe(serverMultiplier => {
                // Sincronizziamo il moltiplicatore.
                // Se stiamo volando, calcoliamo il roundStartTime basato su questo tick
                // per correggere eventuali drift, ma usiamo la predizione per il render.

                // t = ln(m) / k
                // startTime = now - t
                if (serverMultiplier > 1.0) {
                    const timeElapsed = Math.log(serverMultiplier) / this.GROWTH_RATE;
                    // Aggiorniamo il tempo di start stimato, usando una media mobile o direttamente
                    // Per semplicità, ci fidiamo dell'ultimo tick del server per ri-allineare la curva
                    this.roundStartTime = Date.now() - timeElapsed;
                } else {
                    this.roundStartTime = Date.now();
                }

                // Backup nel caso il loop grafico non stia girando o per stato crash
                this.multiplier = serverMultiplier;
            }),
            this.gameSocket.timeLeft$.subscribe(t => {
                this.timeLeft = t;
            })
        );
    }

    ngAfterViewInit() {
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d')!;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Disegno iniziale
        this.drawWaiting();
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
            // Loop grafico sempre attivo in FLYING
            if (this.gameState === GameState.FLYING) {
                // Calcola moltiplicatore "smooth" basato sul tempo
                const now = Date.now();
                const elapsed = now - this.roundStartTime;
                // m = e^(k*t)
                const predictedMultiplier = Math.exp(this.GROWTH_RATE * elapsed);

                // Usiamo il massimo tra quello predetto e quello del server
                this.multiplier = Math.max(this.multiplier, predictedMultiplier);

                this.drawGame();
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

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('WAITING FOR NEXT ROUND', w / 2, h / 2);

        if (this.timeLeft > 0) {
            this.ctx.font = 'bold 48px Inter, sans-serif';
            this.ctx.fillText(this.timeLeft.toString(), w / 2, h / 2 + 50);
        }

        // Loading bar
        const barWidth = 200;
        const barHeight = 4;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(w / 2 - barWidth / 2, h / 2 + 70, barWidth, barHeight);
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
