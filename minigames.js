class MinigameManager {
    constructor() {
        this.modal = document.getElementById('modal-juegos');
        this.container = document.getElementById('minigame-container');
        this.canvas = document.getElementById('minigame-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.btnExit = document.getElementById('btn-exit-game');
        
        // Botones de selección de juego
        this.btns = {
            ladrillos: document.getElementById('btn-game-ladrillos'),
            operando: document.getElementById('btn-game-operando'),
            ruleta: document.getElementById('btn-game-ruleta'),
            dibujar: document.getElementById('btn-game-dibujar')
        };

        this.animationId = null;
        this.currentGame = null;
        this.gameActive = false;

        this.initListeners();
    }

    initListeners() {
        // Asignar eventos a los botones del menú modal
        this.btns.ladrillos.addEventListener('click', (e) => { e.preventDefault(); this.startGame('ladrillos'); });
        this.btns.operando.addEventListener('click', (e) => { e.preventDefault(); this.startGame('operando'); });
        this.btns.ruleta.addEventListener('click', (e) => { e.preventDefault(); this.startGame('ruleta'); });
        this.btns.dibujar.addEventListener('click', (e) => { e.preventDefault(); this.startGame('dibujar'); });

        // Evento principal de interacción (Tap/Click) en el canvas
        this.canvas.addEventListener('mousedown', (e) => this.handleInput(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput(e.touches[0]);
        });

        // Botón de salir anticipadamente
        this.btnExit.addEventListener('click', () => this.endGame(false));
    }

    startGame(gameName) {
        this.modal.close();
        this.container.classList.remove('hidden');
        this.currentGame = gameName;
        this.gameActive = true;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Variables comunes de estado
        this.state = {
            x: 0, y: 0, speed: 3, score: 0, time: 10,
            direction: 1, color: '#000'
        };

        // Arrancar el bucle específico
        if (gameName === 'ruleta') this.loopRuleta();
        if (gameName === 'ladrillos') this.loopLadrillos();
        if (gameName === 'operando') this.loopOperando();
        if (gameName === 'dibujar') this.initDibujar();
    }

    handleInput(event) {
        if (!this.gameActive) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        if (this.currentGame === 'ruleta') {
            // Verificar si detuvo la línea en la zona verde (centro)
            const isWin = (this.state.x > 120 && this.state.x < 180);
            this.endGame(isWin);
        }
        else if (this.currentGame === 'ladrillos') {
            // Dejar caer el ladrillo
            this.state.y += 20;
            this.state.score++;
            if (this.state.score >= 5) this.endGame(true); // Gana al apilar 5
        }
        else if (this.currentGame === 'operando') {
            // Tocar el "virus" rojo
            const dx = mouseX - this.state.x;
            const dy = mouseY - this.state.y;
            if (Math.sqrt(dx*dx + dy*dy) < 30) {
                this.state.score++;
                this.state.x = Math.random() * 250;
                this.state.y = Math.random() * 250;
                if (this.state.score >= 3) this.endGame(true);
            }
        }
        else if (this.currentGame === 'dibujar') {
            // Pintar un pixel de 30x30
            const gridX = Math.floor(mouseX / 30) * 30;
            const gridY = Math.floor(mouseY / 30) * 30;
            this.ctx.fillStyle = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'][Math.floor(Math.random() * 4)];
            this.ctx.fillRect(gridX, gridY, 30, 30);
            this.state.score++;
            if (this.state.score >= 10) this.endGame(true); // Termina tras dibujar 10 píxeles
        }
    }

    endGame(isWin) {
        this.gameActive = false;
        cancelAnimationFrame(this.animationId);
        
        if (isWin) {
            // AQUÍ CONECTA CON LA LÓGICA OCULTA DE EVOLUCIÓN
            window.chembit.play(this.currentGame);
            this.ctx.fillStyle = "#8bac0f"; // Color NES success
            this.ctx.fillRect(0, 0, 300, 300);
            this.ctx.fillStyle = "#0f380f";
            this.ctx.font = "20px 'Press Start 2P'";
            this.ctx.fillText("¡BIEN!", 100, 150);
        }

        // Regresar a la pantalla principal tras un breve retraso
        setTimeout(() => {
            this.container.classList.add('hidden');
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }, 1500);
    }

    // ==========================================
    // BUCLES DE RENDERIZADO DE LOS JUEGOS
    // ==========================================

    loopRuleta() {
        if (!this.gameActive) return;
        this.ctx.clearRect(0, 0, 300, 300);

        // Dibujar zona objetivo
        this.ctx.fillStyle = "#2ecc71";
        this.ctx.fillRect(120, 100, 60, 100);

        // Dibujar cursor moviéndose
        this.ctx.fillStyle = "#e74c3c";
        this.ctx.fillRect(this.state.x, 90, 5, 120);

        this.state.x += this.state.speed * this.state.direction;
        if (this.state.x > 295 || this.state.x < 0) this.state.direction *= -1;

        this.animationId = requestAnimationFrame(() => this.loopRuleta());
    }

    loopLadrillos() {
        if (!this.gameActive) return;
        this.ctx.clearRect(0, 0, 300, 300);

        // Base estática
        this.ctx.fillStyle = "#0f380f";
        this.ctx.fillRect(100, 250, 100, 20);

        // Ladrillo moviéndose
        this.ctx.fillRect(this.state.x, this.state.y || 50, 40, 20);
        
        this.state.x += this.state.speed * this.state.direction;
        if (this.state.x > 260 || this.state.x < 0) this.state.direction *= -1;

        this.animationId = requestAnimationFrame(() => this.loopLadrillos());
    }

    loopOperando() {
        if (!this.gameActive) return;
        this.ctx.clearRect(0, 0, 300, 300);

        // Dibujar el "virus" (cuadrado rojo que huye o se mueve erráticamente)
        if(this.state.x === 0) { this.state.x = 150; this.state.y = 150; }
        
        this.ctx.fillStyle = "#e74c3c";
        this.ctx.fillRect(this.state.x, this.state.y, 20, 20);

        this.state.x += (Math.random() - 0.5) * 10;
        this.state.y += (Math.random() - 0.5) * 10;

        // Mantener dentro del canvas
        this.state.x = Math.max(0, Math.min(280, this.state.x));
        this.state.y = Math.max(0, Math.min(280, this.state.y));

        this.animationId = requestAnimationFrame(() => this.loopOperando());
    }

    initDibujar() {
        // No requiere bucle, se basa en eventos click de handleInput
        this.ctx.clearRect(0, 0, 300, 300);
        this.ctx.fillStyle = "#0f380f";
        this.ctx.font = "10px 'Press Start 2P'";
        this.ctx.fillText("Toca para dibujar", 40, 150);
    }
}

// Inicializar cuando esté listo
window.addEventListener('DOMContentLoaded', () => {
    window.minigameManager = new MinigameManager();
});
