/**
 * Skill Breaker - Interactive Hero Section Game
 * A Breakout-inspired mini-game where text blocks become destructible
 */

class SkillBreakerGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.state = 'LOADING';
        this.particles = [];
        this.animationId = null;

        this.fireworksActive = false;
        this.fireworkTimeout = null;
        this.manualConfettiTimeout = null;
        this.confettiCleanupTimeout = null;
        this.confettiFadeTimeout = null;

        // Confetti physics system
        this.confettiPieces = [];
        this.confettiColors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#A8E6CF', '#AA96DA', '#F38181', '#F9ED69', '#2ECC71'];
        this.confettiGravity = 110; // stronger pull for quicker fall
        this.confettiAirDrag = 0.97;
        this.confettiSpeedMultiplier = 2;
        this.confettiBurstRepeats = 3;
        this.confettiBurstInterval = 3000;
        this.confettiSequenceTimeouts = [];
        this.confettiLoopActive = false;
        this.confettiFrameId = null;
        this.lastConfettiTick = null;

        // Base dimensions for responsive scaling
        this.basePaddleWidth = 120;
        this.basePaddleHeight = 15;
        this.baseBallRadius = 8;
        this.ballLaunched = false;
        this.ballLaunchTimeout = null;

        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.init();
    }

    applyResponsiveScale() {
        if (!this.canvas) return;
        const scale = this.getResponsiveScale();
        this.currentScale = scale;

        if (this.paddle) {
            const prevCenter = this.paddle.x + this.paddle.width / 2;
            this.paddle.width = Math.max(70, this.basePaddleWidth * scale);
            this.paddle.height = Math.max(10, this.basePaddleHeight * scale);
            this.paddle.y = this.canvas.height - Math.max(35, 70 * scale);
            this.paddle.x = prevCenter - this.paddle.width / 2;
            if (this.paddle.x < 0) this.paddle.x = 0;
            if (this.paddle.x + this.paddle.width > this.canvas.width) {
                this.paddle.x = this.canvas.width - this.paddle.width;
            }
        }

        if (this.ball) {
            this.ball.radius = Math.max(5, this.baseBallRadius * scale);
            if (!this.ballLaunched) {
                this.anchorBallToPaddle();
            }
        }
    }

    anchorBallToPaddle(options = {}) {
        if (!this.paddle || !this.ball) return;
        const { resetVelocity = false } = options;
        this.ball.x = this.paddle.x + this.paddle.width / 2;
        this.ball.y = this.paddle.y - this.ball.radius - 4;
        if (resetVelocity) {
            this.ball.velocityX = 0;
            this.ball.velocityY = 0;
        }
        this.ballLaunched = false;
    }

    scheduleBallLaunch(delay = 2000) {
        this.clearBallLaunchTimer();
        if (delay == null) return;
        this.ballLaunchTimeout = setTimeout(() => {
            this.launchBallFromPaddle();
        }, delay);
    }

    clearBallLaunchTimer() {
        if (this.ballLaunchTimeout) {
            clearTimeout(this.ballLaunchTimeout);
            this.ballLaunchTimeout = null;
        }
    }

    launchBallFromPaddle() {
        if (!this.ball || this.ballLaunched) return;
        const speed = this.ball.speed || 6;
        const angleOffset = (Math.random() - 0.5) * (Math.PI / 6);
        const angle = -Math.PI / 2 + angleOffset;
        this.ball.velocityX = speed * Math.cos(angle);
        this.ball.velocityY = speed * Math.sin(angle);
        if (this.ball.velocityY > -2) {
            this.ball.velocityY = -Math.abs(speed * 0.85);
        }
        this.ballLaunched = true;
        this.clearBallLaunchTimer();
    }

    init() {
        this.setupCanvas();
        this.setupGameObjects();
        this.setupEventListeners();
        this.scheduleBallLaunch(2000);

        if (this.prefersReducedMotion) {
            this.showStaticHero();
        } else {
            this.state = 'PLAYING';
            this.gameLoop();
        }
    }

    setupCanvas() {
        this.handleResize = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;

            if (this.ball) {
                this.ball.x = this.canvas.width / 2;
                this.ball.y = this.canvas.height / 2;
            }

            this.applyResponsiveScale();

            if (this.blocks) {
                this.blocks = this.createBlocks();
            }
        };

        this.handleResize();
        window.addEventListener('resize', this.handleResize);
    }

    setupGameObjects() {
        this.paddle = {
            x: this.canvas.width / 2 - this.basePaddleWidth / 2,
            y: this.canvas.height - 60,
            width: this.basePaddleWidth,
            height: this.basePaddleHeight,
            speed: 8,
            dx: 0
        };

        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: this.baseBallRadius,
            velocityX: 6,
            velocityY: -6,
            speed: 6
        };

        this.applyResponsiveScale();
        this.blocks = this.createBlocks();
        this.anchorBallToPaddle({ resetVelocity: true });
    }

    getResponsiveScale() {
        if (!this.canvas) return 1;
        const baseWidth = 640;
        const minScale = 0.4;
        return Math.max(minScale, Math.min(1, this.canvas.width / baseWidth));
    }

    createBlocks() {
        const scale = this.currentScale ?? this.getResponsiveScale();
        this.currentScale = scale;
        const blocks = [];
        const centerX = this.canvas.width / 2;
        const startY = 120 * scale + 30;
        const gap = 15 * scale;

        const titleTexts = ['Hello,', "I'm", 'Xinyue', 'Wang'];
        const titleY = startY;
        const titleBlockWidth = 110 * scale;
        const titleBlockHeight = 52 * scale;
        const titleFontSize = Math.max(12, 24 * scale);
        const titleTotalWidth = titleTexts.length * titleBlockWidth + (titleTexts.length - 1) * gap;
        let titleX = centerX - titleTotalWidth / 2;

        titleTexts.forEach(text => {
            blocks.push({
                x: titleX,
                y: titleY,
                width: titleBlockWidth,
                height: titleBlockHeight,
                text: text,
                destroyed: false,
                fontSize: titleFontSize,
                color: 'rgba(52, 152, 219, 0.8)'
            });
            titleX += titleBlockWidth + gap;
        });

        const roleTexts = ['Game Designer', 'Level Designer', 'Game Developer'];
        const roleY = titleY + titleBlockHeight + 40 * scale;
        const roleBlockWidth = 150 * scale;
        const roleBlockHeight = 46 * scale;
        const roleFontSize = Math.max(10, 18 * scale);
        const roleTotalWidth = roleTexts.length * roleBlockWidth + (roleTexts.length - 1) * gap;
        let roleX = centerX - roleTotalWidth / 2;

        roleTexts.forEach(text => {
            blocks.push({
                x: roleX,
                y: roleY,
                width: roleBlockWidth,
                height: roleBlockHeight,
                text: text,
                destroyed: false,
                fontSize: roleFontSize,
                color: 'rgba(149, 165, 166, 0.8)'
            });
            roleX += roleBlockWidth + gap;
        });

        return blocks;
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state !== 'PLAYING') return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            this.paddle.x = mouseX - this.paddle.width / 2;
            if (this.paddle.x < 0) this.paddle.x = 0;
            if (this.paddle.x + this.paddle.width > this.canvas.width) {
                this.paddle.x = this.canvas.width - this.paddle.width;
            }
            if (!this.ballLaunched) {
                this.anchorBallToPaddle();
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.state !== 'PLAYING') return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            this.paddle.x = touchX - this.paddle.width / 2;
            if (this.paddle.x < 0) this.paddle.x = 0;
            if (this.paddle.x + this.paddle.width > this.canvas.width) {
                this.paddle.x = this.canvas.width - this.paddle.width;
            }
            if (!this.ballLaunched) {
                this.anchorBallToPaddle();
            }
        }, { passive: false });

        this.keys = {};
        this.handleKeyDown = (e) => {
            this.keys[e.key] = true;
        };
        this.handleKeyUp = (e) => {
            this.keys[e.key] = false;
        };
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        this.updatePaddleFromKeys = () => {
            if (this.state !== 'PLAYING') return;
            if (this.keys['ArrowLeft']) this.paddle.x -= this.paddle.speed;
            if (this.keys['ArrowRight']) this.paddle.x += this.paddle.speed;
            if (this.paddle.x < 0) this.paddle.x = 0;
            if (this.paddle.x + this.paddle.width > this.canvas.width) {
                this.paddle.x = this.canvas.width - this.paddle.width;
            }
            if (!this.ballLaunched) {
                this.anchorBallToPaddle();
            }
        };
    }

    update() {
        if (this.state !== 'PLAYING') return;

        this.updatePaddleFromKeys();

        this.ball.x += this.ball.velocityX;
        this.ball.y += this.ball.velocityY;

        if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
            this.ball.velocityX = -this.ball.velocityX;
        }

        if (this.ball.y - this.ball.radius < 0) {
            this.ball.velocityY = -this.ball.velocityY;
        }

        if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.resetBall();
        }

        if (this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width) {

            this.ball.velocityY = -Math.abs(this.ball.velocityY);
            const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
            this.ball.velocityX = (hitPos - 0.5) * 8;
            this.ball.velocityX *= 1.1;
            this.ball.velocityY *= 1.1;
        }

        this.blocks.forEach(block => {
            if (block.destroyed) return;
            if (this.ball.x + this.ball.radius > block.x &&
                this.ball.x - this.ball.radius < block.x + block.width &&
                this.ball.y + this.ball.radius > block.y &&
                this.ball.y - this.ball.radius < block.y + block.height) {

                this.ball.velocityY = -this.ball.velocityY;
                block.destroyed = true;
                this.createParticles(block.x + block.width / 2, block.y + block.height / 2, block.color);

                if (this.blocks.every(b => b.destroyed)) {
                    this.state = 'COMPLETED';
                    this.showCompletionButton();
                }
            }
        });

        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            return p.life > 0;
        });
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                color: color
            });
        }
    }

    resetBall() {
        const initialSpeed = this.ball.speed || 6;
        const centerX = this.canvas.width / 2;
        const offsetRange = Math.min(this.canvas.width * 0.15, 80);
        const randomOffset = (Math.random() - 0.5) * 2 * offsetRange;

        this.ball.x = Math.max(this.ball.radius, Math.min(this.canvas.width - this.ball.radius, centerX + randomOffset));
        this.ball.y = this.canvas.height / 2;

        const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8);
        this.ball.velocityX = initialSpeed * Math.sin(angle);
        this.ball.velocityY = -initialSpeed * Math.cos(angle);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.blocks.forEach(block => {
            if (block.destroyed) return;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = block.color;
            this.ctx.fillStyle = block.color;
            this.ctx.beginPath();
            this.ctx.roundRect(block.x, block.y, block.width, block.height, 8);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${block.fontSize}px 'Helvetica Neue', sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(block.text, block.x + block.width / 2, block.y + block.height / 2);
        });

        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color.replace('0.8', p.life);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(52, 152, 219, 0.8)';
        this.ctx.fillStyle = '#3498db';
        this.ctx.beginPath();
        this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 8);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        const ballColor = getComputedStyle(document.documentElement).getPropertyValue('--ball-color').trim();
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = ballColor === '#333333' ? 'rgba(51, 51, 51, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillStyle = ballColor;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    gameLoop() {
        this.update();
        this.draw();
        if (this.state === 'PLAYING') {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    showCompletionButton() {
        const button = document.getElementById('hero-cta-button');
        const fireworkContainer = document.getElementById('firework-container');

        if (button) {
            button.classList.add('show');
            button.addEventListener('click', () => {
                this.stopFireworks();
            });
        }

        const celebrationDuration = 8500;

        if (fireworkContainer) {
            this.fireworksActive = true;
            this.startContinuousFireworks(fireworkContainer);
            fireworkContainer.classList.add('show');
            this.scheduleConfettiFade(fireworkContainer, celebrationDuration);
        }

        setTimeout(() => {
            this.stopFireworks();
        }, celebrationDuration);

        setTimeout(() => {
            this.canvas.style.opacity = '0';
        }, 500);
    }

    startContinuousFireworks(container) {
        if (!this.fireworksActive || !container) return;

        // Clear previous scheduled bursts
        this.confettiSequenceTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.confettiSequenceTimeouts = [];

        const repeats = Math.max(1, this.confettiBurstRepeats || 3);
        const interval = Math.max(200, this.confettiBurstInterval || 1000);

        const fireBurst = (remaining) => {
            if (!this.fireworksActive) return;
            this.createConfettiBurst(container);
            if (remaining > 1) {
                const timeoutId = setTimeout(() => fireBurst(remaining - 1), interval);
                this.confettiSequenceTimeouts.push(timeoutId);
            }
        };

        fireBurst(repeats);
    }

    createConfettiBurst(container) {
        const particlesPerBurst = 60;
        const button = document.getElementById('hero-cta-button');
        const containerRect = container.getBoundingClientRect();
        let originX = container.clientWidth / 2;
        let originY = container.clientHeight / 2;

        if (button) {
            const buttonRect = button.getBoundingClientRect();
            originX = buttonRect.left - containerRect.left + buttonRect.width / 2;
            originY = buttonRect.top - containerRect.top + buttonRect.height / 2;
        }

        for (let i = 0; i < particlesPerBurst; i++) {
            const pieceEl = document.createElement('div');
            pieceEl.className = 'firework-particle';

            const color = this.confettiColors[i % this.confettiColors.length];
            pieceEl.style.background = color;

            const width = 4 + Math.random() * 9; // keep large pieces smaller overall
            const height = width * (1.15 + Math.random() * 1.5); // varied rectangular ratios
            pieceEl.style.width = `${width}px`;
            pieceEl.style.height = `${height}px`;

            container.appendChild(pieceEl);

            const spread = (Math.random() - 0.5) * 120;
            const initialSpeed = 195 + Math.random() * 158;
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.7);
            const vx = Math.cos(angle) * initialSpeed + spread * 0.35;
            const vy = Math.sin(angle) * initialSpeed;
            const rotation = Math.random() * 360;
            const rotationVelocity = (Math.random() - 0.5) * 200;
            const drag = 0.985 + Math.random() * 0.01;
            const wind = (Math.random() - 0.5) * 120;

            pieceEl.style.transform = `translate3d(${originX}px, ${originY}px, 0) rotate(${rotation}deg)`;

            this.confettiPieces.push({
                el: pieceEl,
                x: originX + (Math.random() - 0.5) * 30,
                y: originY,
                vx,
                vy,
                rotation,
                rotationVelocity,
                drag,
                wind,
                life: 1.6 + Math.random() * 1.1
            });
        }

        this.ensureConfettiLoop();
    }

    ensureConfettiLoop() {
        if (this.confettiLoopActive) return;
        this.confettiLoopActive = true;
        this.lastConfettiTick = performance.now();

        const step = (timestamp) => {
            if (!this.confettiLoopActive && this.confettiPieces.length === 0) {
                this.confettiFrameId = null;
                return;
            }

            const dt = Math.min(0.05, (timestamp - this.lastConfettiTick) / 1000 || 0.016);
            this.lastConfettiTick = timestamp;
            this.updateConfettiPieces(dt);
            this.confettiFrameId = requestAnimationFrame(step);
        };

        this.confettiFrameId = requestAnimationFrame(step);
    }

    updateConfettiPieces(dt) {
        const container = document.getElementById('firework-container');
        if (!container) return;
        const boundsHeight = container.clientHeight;
        const boundsWidth = container.clientWidth;

        const speedMultiplier = this.confettiSpeedMultiplier || 1;
        const scaledDt = dt * speedMultiplier;

        this.confettiPieces = this.confettiPieces.filter(piece => {
            piece.vx = piece.vx * piece.drag + (piece.wind || 0) * scaledDt * 0.16;
            piece.vy = piece.vy * piece.drag + this.confettiGravity * scaledDt;
            piece.wind *= Math.pow(0.95, speedMultiplier);

            piece.x += piece.vx * scaledDt;
            piece.y += piece.vy * scaledDt;
            piece.rotation += piece.rotationVelocity * scaledDt;
            piece.rotationVelocity *= Math.pow(0.995, speedMultiplier);
            piece.life -= scaledDt * 0.045;

            if (piece.y > boundsHeight + 80 || piece.x < -80 || piece.x > boundsWidth + 80 || piece.life <= 0) {
                if (piece.el.parentNode === container) {
                    container.removeChild(piece.el);
                }
                return false;
            }

            const opacity = Math.max(0, Math.min(1, piece.life));
            piece.el.style.opacity = opacity;
            piece.el.style.transform = `translate3d(${piece.x}px, ${piece.y}px, 0) rotate(${piece.rotation}deg)`;
            return true;
        });

        if (!this.confettiPieces.length && !this.fireworksActive) {
            this.stopConfettiLoop();
        }
    }

    stopConfettiLoop(clearElements = false) {
        this.confettiLoopActive = false;
        if (this.confettiFrameId) {
            cancelAnimationFrame(this.confettiFrameId);
            this.confettiFrameId = null;
        }
        if (clearElements) {
            const container = document.getElementById('firework-container');
            if (container) {
                container.innerHTML = '';
            }
        }
        this.confettiPieces = [];
    }

    triggerManualConfetti(duration = 8500) {
        const container = document.getElementById('firework-container');
        if (!container) return;

        this.stopFireworks({ skipDelayedClear: true });
        this.fireworksActive = true;
        container.classList.add('show');
        this.startContinuousFireworks(container);
        this.scheduleConfettiFade(container, duration);

        if (duration !== null) {
            this.manualConfettiTimeout = setTimeout(() => {
                this.stopFireworks();
            }, duration);
        }
    }

    scheduleConfettiFade(container, duration) {
        if (!container || duration == null) return;
        if (this.confettiFadeTimeout) {
            clearTimeout(this.confettiFadeTimeout);
            this.confettiFadeTimeout = null;
        }
        container.classList.remove('fade-out');
        if (duration <= 500) return;
        this.confettiFadeTimeout = setTimeout(() => {
            container.classList.add('fade-out');
            this.confettiFadeTimeout = null;
        }, duration - 500);
    }

    stopFireworks(options = {}) {
        const { skipDelayedClear = false } = options;
        this.fireworksActive = false;
        if (this.fireworkTimeout) {
            clearTimeout(this.fireworkTimeout);
            this.fireworkTimeout = null;
        }
        if (this.manualConfettiTimeout) {
            clearTimeout(this.manualConfettiTimeout);
            this.manualConfettiTimeout = null;
        }
        if (this.confettiCleanupTimeout) {
            clearTimeout(this.confettiCleanupTimeout);
            this.confettiCleanupTimeout = null;
        }
        if (this.confettiFadeTimeout) {
            clearTimeout(this.confettiFadeTimeout);
            this.confettiFadeTimeout = null;
        }
        if (this.confettiSequenceTimeouts.length) {
            this.confettiSequenceTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
            this.confettiSequenceTimeouts = [];
        }

        const fireworkContainer = document.getElementById('firework-container');
        if (fireworkContainer) {
            fireworkContainer.classList.remove('show');
            fireworkContainer.classList.remove('fade-out');
            this.stopConfettiLoop(true);
            if (skipDelayedClear) {
                fireworkContainer.innerHTML = '';
            } else {
                this.confettiCleanupTimeout = setTimeout(() => {
                    fireworkContainer.innerHTML = '';
                    this.confettiCleanupTimeout = null;
                }, 300);
            }
        }
    }

    showStaticHero() {
        const staticHero = document.getElementById('static-hero');
        if (staticHero) {
            staticHero.style.display = 'block';
        }
        this.canvas.style.display = 'none';
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }
        if (this.handleKeyDown) {
            window.removeEventListener('keydown', this.handleKeyDown);
        }
        if (this.handleKeyUp) {
            window.removeEventListener('keyup', this.handleKeyUp);
        }
    }
}

// Polyfill for roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new SkillBreakerGame('skill-breaker-canvas');
    window.skillBreakerGame = game;

    const confettiBtn = document.getElementById('confetti-test-button');
    if (confettiBtn) {
        confettiBtn.addEventListener('click', () => {
            game.triggerManualConfetti();
        });
    }
});
