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
        
        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupGameObjects();
        this.setupEventListeners();
        
        if (this.prefersReducedMotion) {
            this.showStaticHero();
        } else {
            this.state = 'PLAYING';
            this.gameLoop();
        }
    }
    
    setupCanvas() {
        const updateCanvasSize = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            
            // Recalculate positions if objects exist
            if (this.paddle) {
                this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
                this.paddle.y = this.canvas.height - 60;
            }
        };
        
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }
    
    setupGameObjects() {
        // Paddle
        this.paddle = {
            x: this.canvas.width / 2 - 60,
            y: this.canvas.height - 60,
            width: 120,
            height: 15,
            speed: 8,
            dx: 0
        };
        
        // Ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 8,
            velocityX: 4,
            velocityY: -4,
            speed: 4
        };
        
        // Blocks - text elements
        this.blocks = this.createBlocks();
    }
    
    createBlocks() {
        const blocks = [];
        const centerX = this.canvas.width / 2;
        const startY = 150;
        const gap = 15;
        
        // Title blocks: "Hello", ", I'm", "Xinyue", "Wang"
        const titleTexts = ['Hello', ", I'm", 'Xinyue', 'Wang'];
        const titleY = startY;
        const titleBlockWidth = 100;
        const titleTotalWidth = titleTexts.length * titleBlockWidth + (titleTexts.length - 1) * gap;
        let titleX = centerX - titleTotalWidth / 2;
        
        titleTexts.forEach(text => {
            blocks.push({
                x: titleX,
                y: titleY,
                width: titleBlockWidth,
                height: 50,
                text: text,
                destroyed: false,
                fontSize: 24,
                color: 'rgba(52, 152, 219, 0.8)'
            });
            titleX += titleBlockWidth + gap;
        });
        
        // Role blocks: "Game Designer", "Level Designer", "Game Developer"
        const roleTexts = ['Game Designer', 'Level Designer', 'Game Developer'];
        const roleY = startY + 80;
        const roleBlockWidth = 140;
        const roleTotalWidth = roleTexts.length * roleBlockWidth + (roleTexts.length - 1) * gap;
        let roleX = centerX - roleTotalWidth / 2;
        
        roleTexts.forEach(text => {
            blocks.push({
                x: roleX,
                y: roleY,
                width: roleBlockWidth,
                height: 50,
                text: text,
                destroyed: false,
                fontSize: 18,
                color: 'rgba(149, 165, 166, 0.8)'
            });
            roleX += roleBlockWidth + gap;
        });
        
        return blocks;
    }
    
    setupEventListeners() {
        // Mouse movement
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state !== 'PLAYING') return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            this.paddle.x = mouseX - this.paddle.width / 2;
            
            // Keep paddle within bounds
            if (this.paddle.x < 0) this.paddle.x = 0;
            if (this.paddle.x + this.paddle.width > this.canvas.width) {
                this.paddle.x = this.canvas.width - this.paddle.width;
            }
        });
        
        // Touch movement for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.state !== 'PLAYING') return;
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            this.paddle.x = touchX - this.paddle.width / 2;
            
            // Keep paddle within bounds
            if (this.paddle.x < 0) this.paddle.x = 0;
            if (this.paddle.x + this.paddle.width > this.canvas.width) {
                this.paddle.x = this.canvas.width - this.paddle.width;
            }
        }, { passive: false });
        
        // Keyboard controls
        const keys = {};
        window.addEventListener('keydown', (e) => {
            keys[e.key] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });
        
        // Update paddle based on arrow keys
        this.updatePaddleFromKeys = () => {
            if (this.state !== 'PLAYING') return;
            
            if (keys['ArrowLeft']) {
                this.paddle.x -= this.paddle.speed;
            }
            if (keys['ArrowRight']) {
                this.paddle.x += this.paddle.speed;
            }
            
            // Keep paddle within bounds
            if (this.paddle.x < 0) this.paddle.x = 0;
            if (this.paddle.x + this.paddle.width > this.canvas.width) {
                this.paddle.x = this.canvas.width - this.paddle.width;
            }
        };
    }
    
    update() {
        if (this.state !== 'PLAYING') return;
        
        // Update paddle from keyboard
        this.updatePaddleFromKeys();
        
        // Update ball position
        this.ball.x += this.ball.velocityX;
        this.ball.y += this.ball.velocityY;
        
        // Wall collision
        if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
            this.ball.velocityX = -this.ball.velocityX;
        }
        
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.velocityY = -this.ball.velocityY;
        }
        
        // Bottom wall - reset ball
        if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.x = this.canvas.width / 2;
            this.ball.y = this.canvas.height / 2;
            this.ball.velocityY = -Math.abs(this.ball.velocityY);
        }
        
        // Paddle collision
        if (this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width) {
            
            this.ball.velocityY = -Math.abs(this.ball.velocityY);
            
            // Add angle based on where ball hits paddle
            const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
            this.ball.velocityX = (hitPos - 0.5) * 8;
        }
        
        // Block collision
        this.blocks.forEach(block => {
            if (block.destroyed) return;
            
            if (this.ball.x + this.ball.radius > block.x &&
                this.ball.x - this.ball.radius < block.x + block.width &&
                this.ball.y + this.ball.radius > block.y &&
                this.ball.y - this.ball.radius < block.y + block.height) {
                
                // Reverse ball direction
                this.ball.velocityY = -this.ball.velocityY;
                
                // Destroy block
                block.destroyed = true;
                
                // Create particles
                this.createParticles(block.x + block.width / 2, block.y + block.height / 2, block.color);
                
                // Check win condition
                if (this.blocks.every(b => b.destroyed)) {
                    this.state = 'COMPLETED';
                    this.showCompletionButton();
                }
            }
        });
        
        // Update particles
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
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw blocks
        this.blocks.forEach(block => {
            if (block.destroyed) return;
            
            // Block background with glow
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = block.color;
            this.ctx.fillStyle = block.color;
            this.ctx.beginPath();
            this.ctx.roundRect(block.x, block.y, block.width, block.height, 8);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // Block text
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${block.fontSize}px 'Helvetica Neue', sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(block.text, block.x + block.width / 2, block.y + block.height / 2);
        });
        
        // Draw particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color.replace('0.8', p.life);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw paddle
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(52, 152, 219, 0.8)';
        this.ctx.fillStyle = '#3498db';
        this.ctx.beginPath();
        this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 8);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Draw ball
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillStyle = '#ffffff';
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
        if (button) {
            button.classList.add('show');
        }
        
        // Hide canvas after a short delay
        setTimeout(() => {
            this.canvas.style.opacity = '0';
        }, 500);
    }
    
    showStaticHero() {
        // For users who prefer reduced motion, show static hero
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
    }
}

// Polyfill for roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
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

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new SkillBreakerGame('skill-breaker-canvas');
});
