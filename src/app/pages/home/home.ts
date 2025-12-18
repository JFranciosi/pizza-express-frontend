import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { GameSocketService, GameState } from '../../services/game-socket.service';
import { Subscription } from 'rxjs';

import { CrashHistoryComponent } from '../../components/crash-history/history';
import { PlayerBetsComponent } from '../../components/player-bets/player-bets';
import { BetControlsComponent } from '../../components/bet-controls/bet-controls';

import { TopBarComponent } from '../../components/top-bar/top-bar';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        CrashHistoryComponent,
        PlayerBetsComponent,
        BetControlsComponent,

        TopBarComponent
    ],
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
    private crashTimeout: any = null;
    private readonly GROWTH_RATE = 0.00006;
    private roundStartTime: number = 0;
    private waitingEndTime: number = 0;
    private rocketImage: HTMLImageElement = new Image();

    constructor(
        private authService: AuthService,
        private router: Router,
        private gameSocket: GameSocketService
    ) {
        this.rocketImage.src = 'vespa.png';
    }

    ngOnInit() {
        this.subs.push(
            this.gameSocket.gameState$.subscribe(state => {
                if (this.crashTimeout) {
                    if (state === GameState.WAITING || state === GameState.CRASHED) {
                        return;
                    }
                    clearTimeout(this.crashTimeout);
                    this.crashTimeout = null;
                }

                if (this.gameState === GameState.CRASHED && state === GameState.WAITING) {
                    this.crashTimeout = setTimeout(() => {
                        this.crashTimeout = null;
                        this.gameState = state;
                        this.startDrawing();
                    }, 1000);
                } else {
                    this.gameState = state;
                    if (state === GameState.FLYING) {
                        this.startDrawing();
                    } else if (state === GameState.CRASHED) {
                        this.stopDrawing();
                        this.drawCrash();
                    } else {
                        this.startDrawing();
                    }
                }
            }),
            this.gameSocket.multiplier$.subscribe(serverMultiplier => {
                // Se siamo all'inizio (o molto vicini), sincronizziamo il tempo di start
                // Altrimenti ci fidiamo del loop locale per la fluidità
                if (serverMultiplier > 1.0) {
                    const timeElapsed = Math.log(serverMultiplier) / this.GROWTH_RATE;
                    const calculatedStartTime = Date.now() - timeElapsed;

                    // Sincronizza solo se non l'abbiamo ancora fatto o se c'è drift eccessivo (>100ms)
                    if (this.roundStartTime === 0 || Math.abs(this.roundStartTime - calculatedStartTime) > 100) {
                        this.roundStartTime = calculatedStartTime;
                    }

                    // Always sync multiplier if server is ahead or if CRASHED (to fix overshoot)
                    if (serverMultiplier > this.multiplier || this.gameState === GameState.CRASHED) {
                        this.multiplier = serverMultiplier;
                        if (this.gameState === GameState.CRASHED) {
                            this.drawCrash(); // Redraw with precise server value
                        }
                    }
                } else {
                    // Reset per nuovo round
                    this.roundStartTime = Date.now();
                    this.multiplier = 1.00;
                }
            }),
            this.gameSocket.timeLeft$.subscribe(t => {
                this.timeLeft = t;
                const estimatedEnd = Date.now() + t * 1000;
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
            canvas.height = parent.clientHeight;
        }
        if (this.gameState === GameState.FLYING) {
            this.drawGame();
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

        const gradient = this.ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, 'rgba(0, 140, 69, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(227, 27, 35, 0.1)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, w, h);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 1; i < 5; i++) {
            const y = h - (h / 5) * i;
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
        }
        this.ctx.stroke();

        const padding = 50;
        const drawingW = w - (padding * 2);
        const drawingH = h - (padding * 2);

        const maxVisibleX = 15000;
        const now = Date.now();
        const elapsed = Math.max(0, now - this.roundStartTime);

        const progressX = Math.min(1, elapsed / maxVisibleX);

        const maxShownMult = Math.max(3, this.multiplier * 2);
        const normY = (this.multiplier - 1) / (maxShownMult - 1);

        const px = padding + (drawingW * progressX);
        const py = (h - padding) - (normY * drawingH);

        const trailGradient = this.ctx.createLinearGradient(0, h, px, py);
        trailGradient.addColorStop(0, 'rgba(233, 30, 99, 0)');
        trailGradient.addColorStop(1, '#e91e63');

        this.ctx.beginPath();
        this.ctx.strokeStyle = trailGradient;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';

        const speedFactor = Math.max(1, Math.log(this.multiplier) * 2);
        const dashOffset = (Date.now() / 10) * speedFactor;

        this.ctx.setLineDash([20, 20]);
        this.ctx.lineDashOffset = -dashOffset;

        this.ctx.moveTo(0, h);
        this.ctx.quadraticCurveTo(px * 0.5, h, px, py);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        this.ctx.shadowColor = '#e91e63';
        this.ctx.shadowBlur = 10 + (speedFactor * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        if (this.rocketImage.complete && this.rocketImage.naturalWidth > 0) {
            const scale = 140 / this.rocketImage.naturalWidth;
            const dWidth = 140;
            const dHeight = this.rocketImage.naturalHeight * scale;

            this.ctx.save();
            this.ctx.translate(px, py);
            const angle = -Math.atan2(h - py, px) * 0.5;
            this.ctx.rotate(angle);
            this.ctx.drawImage(this.rocketImage, -dWidth / 2, -dHeight / 2, dWidth, dHeight);
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(px, py, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Testo Moltiplicatore Centrale -> SOPRA tutto
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 80px Inter, sans-serif'; // Più grande
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText(this.multiplier.toFixed(2) + 'x', w / 2, h / 2 - 50);
        this.ctx.shadowBlur = 0;

        // Stato
        this.ctx.font = 'bold 24px Inter, sans-serif';
        this.ctx.fillStyle = '#008C45';
        this.ctx.fillText('DELIVERING...', w / 2, h / 2 + 30);
    }

    drawCrash() {
        const w = this.canvasRef.nativeElement.width;
        const h = this.canvasRef.nativeElement.height;
        this.ctx.clearRect(0, 0, w, h);
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
        const now = Date.now();
        const remainingMs = Math.max(0, this.waitingEndTime - now);
        const remainingSecs = Math.ceil(remainingMs / 1000);
        const maxTimeMs = 10000;
        const progress = Math.min(1, Math.max(0, remainingMs / maxTimeMs));

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('WAITING FOR NEXT ROUND', centerX, centerY - 40);

        this.ctx.font = 'bold 64px Inter, sans-serif';
        this.ctx.fillText(remainingSecs.toString(), centerX, centerY + 20);

        const barWidth = 300;
        const barHeight = 6;
        const barX = centerX - barWidth / 2;
        const barY = centerY + 80;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        const currentBarWidth = barWidth * progress;
        this.ctx.fillStyle = '#e91e63';

        this.ctx.shadowColor = '#e91e63';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(barX, barY, currentBarWidth, barHeight);

        this.ctx.shadowBlur = 0;
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    ngOnDestroy() {
        if (this.crashTimeout) clearTimeout(this.crashTimeout);
        this.subs.forEach(s => s.unsubscribe());
        this.stopDrawing();
        window.removeEventListener('resize', () => this.resizeCanvas());
    }
}
