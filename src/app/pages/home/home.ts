import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { GameSocketService, GameState } from '../../services/game-socket.service';
import { Subscription } from 'rxjs';
import { CrashHistory } from '../../components/crash-history/crash-history';
import { PlayerBets } from '../../components/player-bets/player-bets';
import { BetControls } from '../../components/bet-controls/bet-controls';
import { TopBar } from '../../components/top-bar/top-bar';
import { SoundService } from '../../services/sound.service';
import { ProvablyFairFooter } from '../../components/provably-fair-footer/provably-fair-footer';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        CrashHistory,
        PlayerBets,
        BetControls,
        TopBar,
        ProvablyFairFooter
    ],
    templateUrl: './home.html',
    styleUrl: './home.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    private ctx!: CanvasRenderingContext2D;
    multiplier: number = 1.00;
    private animationFrameId: number | null = null;
    private crashTimeout: any = null;
    private readonly GROWTH_RATE = 0.00006;
    private readonly CLIENT_LATENCY_MS = 600;
    private roundStartTime: number = 0;
    private visualStartTime: number = 0;
    private waitingEndTime: number = 0;
    private rocketImage: HTMLImageElement = new Image();

    private gridScrollX: number = 0;
    private gridScrollY: number = 0;
    private crashStartTime: number = 0;
    private lastFrameTime: number = 0;

    private readonly RAMP_TIME = 6000;

    winToastVisible: boolean = false;
    winAmount: number = 0;
    private toastTimeout: any = null;
    private prevState: GameState = GameState.WAITING;

    constructor(
        private authService: AuthService,
        private router: Router,
        private gameSocket: GameSocketService,
        private soundService: SoundService,
        private cdr: ChangeDetectorRef,
        private injector: Injector
    ) {
        this.rocketImage.src = 'assets/vespa.png';

        effect(() => {
            const state = this.gameSocket.gameState();
            this.handleStateChange(state);
        }, { injector: this.injector });

        effect(() => {
            const serverMultiplier = this.gameSocket.multiplier();
            this.handleMultiplierUpdate(serverMultiplier);
        }, { injector: this.injector });

        effect(() => {
            const t = this.gameSocket.timeLeft();
            const estimatedEnd = Date.now() + t * 1000;
            if (this.waitingEndTime === 0 || Math.abs(estimatedEnd - this.waitingEndTime) > 500) {
                this.waitingEndTime = estimatedEnd;
            }
            this.cdr.markForCheck();
        }, { injector: this.injector });

        effect(() => {
            const bets = this.gameSocket.bets();
            const user = this.authService.getUser();
            if (user) {
                const myWinningBets = bets.filter(b => b.userId === user.id && b.profit && b.profit > 0);
                if (myWinningBets.length > 0) {
                    const totalProfit = myWinningBets.reduce((acc, b) => acc + (b.profit || 0), 0);
                    if (!this.winToastVisible || this.winAmount !== totalProfit) {
                        this.showWinToast(totalProfit);
                    }
                }
            }
        }, { injector: this.injector });
    }

    ngOnInit() {
        // Signals handle logic now
    }

    handleStateChange(state: GameState) {
        if (this.crashTimeout) {
            if (state === GameState.WAITING || state === GameState.CRASHED) {
                return;
            }
            clearTimeout(this.crashTimeout);
            this.crashTimeout = null;
        }

        if (this.prevState === GameState.CRASHED && state === GameState.WAITING) {
            this.crashTimeout = setTimeout(() => {
                this.crashTimeout = null;
                this.resetAnimationState();
                this.startDrawing();
                this.soundService.playIdle();
                this.cdr.markForCheck();
            }, 1000);
        } else {
            if (state === GameState.FLYING) {
                const now = Date.now();
                this.roundStartTime = now + this.CLIENT_LATENCY_MS;
                this.visualStartTime = now;
                this.multiplier = 1.00;
                this.resetAnimationState();
                this.startDrawing();
                this.soundService.playTakeoff();
            } else if (state === GameState.CRASHED) {
                this.crashStartTime = Date.now();
                this.multiplier = this.gameSocket.multiplier();
                this.soundService.playCrash();
            } else if (state === GameState.WAITING) {
                this.winToastVisible = false;
                if (this.toastTimeout) clearTimeout(this.toastTimeout);
                this.startDrawing();
                if (this.prevState !== GameState.CRASHED) {
                    this.soundService.playIdle();
                }
            } else {
                this.startDrawing();
            }
            this.cdr.markForCheck();
        }
        this.prevState = state;
    }

    handleMultiplierUpdate(serverMultiplier: number) {
        if (serverMultiplier > 1.0) {
            const timeElapsed = Math.log(serverMultiplier) / this.GROWTH_RATE;
            const calculatedStartTime = Date.now() - timeElapsed + this.CLIENT_LATENCY_MS;

            if (this.roundStartTime === 0 || Math.abs(this.roundStartTime - calculatedStartTime) > 500) {
                this.roundStartTime = calculatedStartTime;
            }

            if (this.gameSocket.gameState() === GameState.CRASHED) {
                this.multiplier = serverMultiplier;
            }
        } else {
            this.roundStartTime = Date.now();
            this.multiplier = 1.00;
        }
    }

    showWinToast(amount: number) {
        this.winAmount = amount;
        this.winToastVisible = true;
        this.cdr.markForCheck();

        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.winToastVisible = false;
            this.cdr.markForCheck();
        }, 3000);
    }

    ngAfterViewInit() {
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.startDrawing();
    }

    resizeCanvas() {
        const canvas = this.canvasRef.nativeElement;
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
        if (!this.animationFrameId) this.drawFrame();
    }

    resetAnimationState() {
        this.gridScrollX = 0;
        this.gridScrollY = 0;
        this.crashStartTime = 0;
        this.lastFrameTime = Date.now();
    }

    startDrawing() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.lastFrameTime = Date.now();
        const draw = () => {
            this.drawFrame();
            this.animationFrameId = requestAnimationFrame(draw);
        };
        this.animationFrameId = requestAnimationFrame(draw);
    }

    stopDrawing() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    drawFrame() {
        const now = Date.now();
        const dt = (now - this.lastFrameTime) / 16.666;
        this.lastFrameTime = now;

        const currentState = this.gameSocket.gameState();

        if (currentState === GameState.FLYING) {
            this.updateMultiplier();
            this.drawGame(dt, now);
        } else if (currentState === GameState.CRASHED) {
            this.drawCrashSequence(dt, now);
        } else {
            this.drawWaiting(now);
        }
        this.cdr.detectChanges();
    }

    updateMultiplier() {
        const elapsed = Date.now() - this.roundStartTime;
        const predictedMultiplier = Math.exp(this.GROWTH_RATE * elapsed);
        this.multiplier = Math.max(this.multiplier, predictedMultiplier);
    }



    getCubicBezier(t: number, p0: any, p1: any, p2: any, p3: any) {
        const oneMinusT = 1 - t;
        const fn = (axis: 'x' | 'y') =>
            Math.pow(oneMinusT, 3) * p0[axis] +
            3 * Math.pow(oneMinusT, 2) * t * p1[axis] +
            3 * oneMinusT * Math.pow(t, 2) * p2[axis] +
            Math.pow(t, 3) * p3[axis];
        return { x: fn('x'), y: fn('y') };
    }

    drawGame(dt: number, now: number) {
        const w = this.canvasRef.nativeElement.width;
        const h = this.canvasRef.nativeElement.height;

        const visualElapsed = Math.max(0, now - this.visualStartTime);
        let t = Math.min(1, visualElapsed / this.RAMP_TIME);

        const p0 = { x: 0.05, y: 0.1 };
        const p1 = { x: 0.4, y: 0.1 };
        const p2 = { x: 0.7, y: 0.5 };
        const p3 = { x: 0.85, y: 0.8 };

        const pos = this.getCubicBezier(t, p0, p1, p2, p3);

        let vx, vy;
        if (t < 1) {
            const nextT = Math.min(1, t + 0.01);
            const nextPos = this.getCubicBezier(nextT, p0, p1, p2, p3);
            vx = (nextPos.x - pos.x) * 100;
            vy = (nextPos.y - pos.y) * 100;
        } else {
            vx = (p3.x - p2.x) * 40;
            vy = (p3.y - p2.y) * 40;
            const speedBoost = Math.min(2, 1 + (this.multiplier - 1.5) * 0.1);
            vx *= speedBoost;
            vy *= speedBoost;
        }

        this.gridScrollX -= vx * dt;
        this.gridScrollY += vy * dt;

        const zoom = Math.max(0.6, 1 - (this.multiplier - 1) * 0.1);
        const gridSize = 80 * zoom;
        this.drawGrid(w, h, gridSize);

        const canvasX = pos.x * w;
        const canvasY = h - (pos.y * h);

        const nextPos = t < 1
            ? this.getCubicBezier(Math.min(1, t + 0.01), p0, p1, p2, p3)
            : { x: pos.x + (p3.x - p2.x), y: pos.y + (p3.y - p2.y) };

        let angle = Math.atan2(-(nextPos.y - pos.y), (nextPos.x - pos.x));

        let offsetX = 0, offsetY = 0;
        if (t >= 1) {
            offsetX = (Math.random() - 0.5) * 2;
            offsetY = (Math.random() - 0.5) * 2;
        }

        this.drawVespa(canvasX + offsetX, canvasY + offsetY, angle, 1.2 * (1 / zoom));
        this.drawHUD(w, h, true);
    }

    drawCrashSequence(dt: number, now: number) {
        const w = this.canvasRef.nativeElement.width;
        const h = this.canvasRef.nativeElement.height;
        const elapsedCrash = now - this.crashStartTime;
        const FLY_AWAY_DURATION = 400;

        this.gridScrollX -= 1 * dt;
        this.gridScrollY += 1 * dt;

        this.drawGrid(w, h, 80 * 0.6);

        if (elapsedCrash < FLY_AWAY_DURATION) {
            const progress = elapsedCrash / FLY_AWAY_DURATION;
            const ease = progress * progress * progress;

            const p3 = { x: 0.85, y: 0.8 };
            const startX = p3.x * w;
            const startY = h - (p3.y * h);

            const endX = w + 200;
            const endY = -200;

            const curX = startX + (endX - startX) * ease;
            const curY = startY + (endY - startY) * ease;

            const angle = -Math.PI / 4;
            this.drawVespa(curX, curY, angle, 1.2);

            this.drawHUD(w, h, false);

        } else {
            this.drawCrashUI(w, h);
        }
    }

    drawWaiting(now: number) {
        const w = this.canvasRef.nativeElement.width;
        const h = this.canvasRef.nativeElement.height;

        this.gridScrollX = 0;
        this.gridScrollY = 0;
        this.drawGrid(w, h, 80);

        const startX = 0.05 * w;
        const startY = h - (0.1 * h);
        const breathY = Math.sin(now / 400) * 5;

        this.drawVespa(startX, startY + breathY, 0, 1.2);

        this.drawWaitingUI(w, h, now);
    }

    drawGrid(w: number, h: number, size: number) {
        this.ctx.fillStyle = '#101010';
        this.ctx.fillRect(0, 0, w, h);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        const infoX = this.gridScrollX % size;
        const infoY = this.gridScrollY % size;

        for (let x = infoX; x < w; x += size) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
        }
        for (let y = infoY; y < h; y += size) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
        }
        this.ctx.stroke();

        const rad = Math.min(w, h) * 0.8;
        const grad = this.ctx.createRadialGradient(w / 2, h / 2, rad * 0.2, w / 2, h / 2, rad);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, w, h);
    }

    getScaleFactor(): number {
        const w = this.canvasRef.nativeElement.width;
        return Math.min(1.2, Math.max(0.5, w / 1200));
    }

    drawVespa(x: number, y: number, angle: number, baseScale: number) {
        if (!this.rocketImage.complete) {
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 10, 0, Math.PI * 2);
            this.ctx.fill();
            return;
        }

        const responsiveScale = this.getScaleFactor();
        const finalScale = baseScale * responsiveScale;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        const baseWidth = 140;
        const renderWidth = baseWidth * finalScale;
        const ratio = this.rocketImage.naturalHeight / this.rocketImage.naturalWidth;
        const renderHeight = renderWidth * ratio;

        this.ctx.shadowColor = 'rgba(0, 230, 118, 0.6)';
        this.ctx.shadowBlur = 20 * responsiveScale;

        if (this.gameSocket.gameState() === GameState.FLYING || this.crashStartTime > 0) {
            const scaledOffsetX = 22.4 * finalScale;
            const scaledOffsetY = 15 * finalScale;

            const mufflerX = -renderWidth / 2 + scaledOffsetX;
            const mufflerY = scaledOffsetY;

            const pulse = 1 + Math.sin(Date.now() / 60) * 0.15;
            const flameScale = finalScale * (.9 + Math.sin(Date.now() / 60) * 0.1);

            const flameCenterY = mufflerY + (1.5 * flameScale);

            const flameLen = 100 * flameScale;
            const flameGrad = this.ctx.createLinearGradient(mufflerX, 0, mufflerX - flameLen, 0);
            flameGrad.addColorStop(0, '#FFFFCC');
            flameGrad.addColorStop(0.3, '#FFD700');
            flameGrad.addColorStop(1, '#FF0000');

            this.ctx.fillStyle = flameGrad;
            this.ctx.shadowColor = '#FF8C00';
            this.ctx.shadowBlur = 40 * responsiveScale;
            this.ctx.beginPath();

            this.ctx.moveTo(mufflerX, flameCenterY - 9 * flameScale);

            this.ctx.quadraticCurveTo(
                mufflerX - 40 * flameScale, flameCenterY - 24 * flameScale,
                mufflerX - 110 * flameScale, flameCenterY
            );

            this.ctx.quadraticCurveTo(
                mufflerX - 40 * flameScale, flameCenterY + 24 * flameScale,
                mufflerX, flameCenterY + 9 * flameScale
            );

            this.ctx.closePath();
            this.ctx.fill();

            const coreFlow = (Math.sin(Date.now() / 60) + 1) * 15 * flameScale;

            const coreGrad = this.ctx.createLinearGradient(mufflerX, 0, mufflerX - (40 * flameScale) - coreFlow, 0);
            coreGrad.addColorStop(0, '#404040');
            coreGrad.addColorStop(1, '#000000');

            this.ctx.fillStyle = coreGrad;
            this.ctx.shadowBlur = 0;

            this.ctx.beginPath();
            this.ctx.moveTo(mufflerX, flameCenterY - 4 * flameScale);

            this.ctx.quadraticCurveTo(
                mufflerX - 20 * flameScale, flameCenterY - 5 * flameScale,
                mufflerX - (40 * flameScale) - coreFlow, flameCenterY
            );
            this.ctx.quadraticCurveTo(
                mufflerX - 20 * flameScale, flameCenterY + 5 * flameScale,
                mufflerX, flameCenterY + 4 * flameScale
            );

            this.ctx.fill();
        }

        this.ctx.drawImage(this.rocketImage, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);

        this.ctx.restore();
    }

    drawHUD(w: number, h: number, isFlying: boolean) {
        const scale = this.getScaleFactor();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = `800 ${100 * scale}px "JetBrains Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 10 * scale;
        this.ctx.fillText(this.multiplier.toFixed(2) + 'x', w / 2, h / 2 - (50 * scale));
        this.ctx.shadowBlur = 0;

        if (isFlying) {
            this.ctx.font = `700 ${24 * scale}px "Outfit", sans-serif`;
            this.ctx.fillStyle = '#00e676';
            this.ctx.shadowColor = 'rgba(0, 230, 118, 0.4)';
            this.ctx.shadowBlur = 15 * scale;
            this.ctx.fillText('DELIVERING...', w / 2, h / 2 + (20 * scale));
            this.ctx.shadowBlur = 0;
        }

        if (this.gameSocket.showPing()) {
            const ping = this.gameSocket.ping();
            this.ctx.font = `600 ${16 * scale}px "Outfit", sans-serif`;
            this.ctx.fillStyle = ping > 200 ? '#f44336' : '#b0b0b0';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`PING: ${ping}ms`, w - (20 * scale), (30 * scale));
        }
    }

    drawCrashUI(w: number, h: number) {
        const scale = this.getScaleFactor();

        this.ctx.save();
        this.ctx.translate(w / 2, h / 2);

        this.ctx.font = `800 ${50 * scale}px "Outfit", sans-serif`;
        this.ctx.fillStyle = '#f44336';
        this.ctx.shadowColor = 'rgba(244, 67, 54, 0.5)';
        this.ctx.shadowBlur = 20 * scale;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FLEW AWAY', 0, -(80 * scale));

        this.ctx.font = `800 ${100 * scale}px "JetBrains Mono", monospace`;
        this.ctx.fillStyle = '#f44336';
        this.ctx.fillText(this.multiplier.toFixed(2) + 'x', 0, (20 * scale));

        this.ctx.restore();
    }

    drawWaitingUI(w: number, h: number, now: number) {
        const scale = this.getScaleFactor();
        const remainingMs = Math.max(0, this.waitingEndTime - now);
        const remainingSecs = Math.ceil(remainingMs / 1000);
        const maxTimeMs = 10000;
        const progress = Math.min(1, Math.max(0, remainingMs / maxTimeMs));

        this.ctx.fillStyle = '#b0b0b0';
        this.ctx.font = `500 ${24 * scale}px "Outfit", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NEXT ROUND IN', w / 2, h / 2 - (50 * scale));

        this.ctx.font = `800 ${80 * scale}px "JetBrains Mono", monospace`;
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(remainingSecs.toString(), w / 2, h / 2 + (20 * scale));

        const barWidth = 300 * scale;
        const barHeight = 4 * scale;
        const barX = w / 2 - barWidth / 2;
        const barY = h / 2 + (80 * scale);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 10 * scale;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        this.ctx.shadowBlur = 0;
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    ngOnDestroy() {
        this.soundService.stopAll();
        if (this.crashTimeout) clearTimeout(this.crashTimeout);
        this.stopDrawing();
        window.removeEventListener('resize', () => this.resizeCanvas());
    }
}
