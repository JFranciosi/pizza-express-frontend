import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SoundService {
    private engineIdle: HTMLAudioElement;
    private engineStart: HTMLAudioElement;
    private engineLoop: HTMLAudioElement;
    private crashSound: HTMLAudioElement;
    private cashoutSound: HTMLAudioElement;
    private clickSound: HTMLAudioElement;

    private isFlying: boolean = false;
    private isMuted: boolean = true;

    constructor() {
        this.engineIdle = new Audio('assets/Vespa-Waiting.mp3');
        this.engineIdle.loop = true;
        this.engineIdle.volume = 0.4;

        this.engineStart = new Audio('assets/Vespa-Start.mp3');
        this.engineStart.volume = 0.6;

        this.engineLoop = new Audio('assets/Vespa-Flying.wav');
        this.engineLoop.loop = true;
        this.engineLoop.volume = 0.5;

        this.crashSound = new Audio('assets/Vespa-Crash.mp3');
        this.crashSound.volume = 0.7;

        this.cashoutSound = new Audio('assets/Cashout.mp3');
        this.cashoutSound.volume = 0.8;

        this.clickSound = new Audio('assets/Click-buttons.mp3');
        this.clickSound.volume = 0.5;


        this.engineStart.onended = () => {
            if (this.isFlying && !this.isMuted) {
                this.engineLoop.currentTime = 0;
                this.engineLoop.play().catch(() => { });
            }
        };


        window.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.clickable') || target.classList.contains('p-button')) {
                this.playClick();
            }
        });
    }

    setMuted(muted: boolean) {
        this.isMuted = muted;
        if (muted) {
            this.stopAll();
        }
    }

    playClick() {
        if (this.isMuted) return;

        const clone = this.clickSound.cloneNode() as HTMLAudioElement;
        clone.volume = this.clickSound.volume;
        clone.play().catch(() => { });
    }

    playIdle() {
        if (this.isMuted) return;
        this.stopAll();
        this.engineIdle.play().catch(e => console.log('Autoplay blocked', e));
        this.isFlying = false;
    }

    playTakeoff() {
        if (this.isMuted) return;

        this.engineIdle.pause();
        this.engineIdle.currentTime = 0;

        this.isFlying = true;
        this.engineStart.currentTime = 0;
        this.engineStart.play().catch(e => console.log('Play start error', e));

    }

    playCrash() {
        if (this.isMuted) return;
        this.isFlying = false;
        this.engineStart.pause();
        this.engineLoop.pause();
        this.crashSound.currentTime = 0;
        this.crashSound.play().catch(e => console.log('Play crash error', e));
    }

    playCashout() {
        if (this.isMuted) return;
        this.cashoutSound.currentTime = 0;
        this.cashoutSound.play().catch(e => console.log('Play cashout error', e));
    }

    stopAll() {
        this.isFlying = false;
        this.engineIdle.pause();
        this.engineStart.pause();
        this.engineLoop.pause();
        this.crashSound.pause();

        this.engineIdle.currentTime = 0;
        this.engineStart.currentTime = 0;
        this.engineLoop.currentTime = 0;
        this.crashSound.currentTime = 0;
    }
}
