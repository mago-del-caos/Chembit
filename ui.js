class ChembitUI {
    constructor() {
        // Elementos del DOM - Barras y Textos
        this.bars = {
            hambre: document.getElementById('bar-hambre'),
            felicidad: document.getElementById('bar-felicidad'),
            higiene: document.getElementById('bar-higiene'),
            estudio: document.getElementById('bar-estudio')
        };
        this.info = {
            edad: document.getElementById('info-edad'),
            peso: document.getElementById('info-peso')
        };
        
        // Elementos Visuales
        this.sprite = document.getElementById('chembit-sprite');
        this.dirtLayer = document.getElementById('dirt-layer');
        this.sickLayer = document.getElementById('sick-layer');
        this.notificationArea = document.getElementById('notification-area');

        // Botones de Acción
        this.btnAlimentar = document.getElementById('btn-alimentar');
        this.btnJugar = document.getElementById('btn-jugar');
        this.btnLimpiar = document.getElementById('btn-limpiar');
        this.btnEstudiar = document.getElementById('btn-estudiar');
        this.btnCurar = document.getElementById('btn-curar');

        // Modal de Juegos
        this.modalJuegos = document.getElementById('modal-juegos');

        // Configurar Audios (usando Howler.js)
        this.sounds = {
            beep: new Howl({ src: ['assets/audio/beep.mp3'], volume: 0.5 }), // Opcional: añade un mp3 corto en esa ruta
            evolve: new Howl({ src: ['assets/audio/evolve.mp3'], volume: 0.7 }),
            alert: new Howl({ src: ['assets/audio/alert.mp3'], volume: 0.5 })
        };

        this.initListeners();
    }

    initListeners() {
        // Escuchar actualizaciones del Engine
        document.addEventListener('chembitUpdate', () => this.updateUI());
        
        // Escuchar evolución
        document.addEventListener('chembitEvolve', (e) => this.handleEvolve(e.detail.variante));

        // Eventos de botones
        this.btnAlimentar.addEventListener('click', () => {
            this.playBeep();
            // Menú rápido: Meal o Snack (para simplificar, click normal = meal, doble click = snack)
            // Aquí lo hacemos aleatorio o preguntamos, pero hagámoslo directo: 
            // Si la felicidad es baja le damos snack, si el hambre es baja le damos meal.
            if (window.chembit.stats.hambre < 50) {
                window.chembit.feed('meal');
                this.notify("¡Chembit comió un bloque de datos!");
            } else {
                window.chembit.feed('snack');
                this.notify("¡Chembit comió un pixel dulce!");
            }
        });

        this.btnLimpiar.addEventListener('click', () => {
            this.playBeep();
            window.chembit.clean();
            this.notify("¡Pantalla limpia!");
        });

        this.btnCurar.addEventListener('click', () => {
            this.playBeep();
            if (window.chembit.stats.enfermo) {
                window.chembit.heal();
                this.notify("¡Chembit ha sido desinfectado!");
            } else {
                this.notify("Chembit ya está sano.");
            }
        });

        this.btnEstudiar.addEventListener('click', () => {
            this.playBeep();
            window.chembit.study();
            this.notify("Chembit está procesando información...");
        });

        // Abrir modal de juegos
        this.btnJugar.addEventListener('click', () => {
            this.playBeep();
            this.modalJuegos.showModal();
        });
    }

    updateUI() {
        const stats = window.chembit.stats;

        // Actualizar barras
        this.bars.hambre.value = stats.hambre;
        this.bars.felicidad.value = stats.felicidad;
        this.bars.higiene.value = stats.higiene;
        this.bars.estudio.value = stats.estudio;

        // Cambiar color de barras NES.css según el nivel (Rojo si es bajo)
        this.updateBarColor(this.bars.hambre, stats.hambre);
        this.updateBarColor(this.bars.felicidad, stats.felicidad);
        this.updateBarColor(this.bars.higiene, stats.higiene);

        // Actualizar textos
        this.info.edad.innerText = `Edad: ${stats.edad}d`;
        this.info.peso.innerText = `Peso: ${stats.peso}g`;

        // Capas visuales (Enfermo / Sucio)
        if (stats.sucio) {
            this.dirtLayer.classList.remove('hidden');
        } else {
            this.dirtLayer.classList.add('hidden');
        }

        if (stats.enfermo) {
            this.sickLayer.classList.remove('hidden');
        } else {
            this.sickLayer.classList.add('hidden');
        }

        // Alertas audibles si está crítico
        if ((stats.hambre < 15 || stats.higiene < 15) && !stats.enfermo) {
            // Suena la alerta solo de vez en cuando (probabilidad simple para no saturar)
            if (Math.random() < 0.2) {
                try { this.sounds.alert.play(); } catch(e){}
            }
        }
    }

    updateBarColor(barElement, value) {
        barElement.classList.remove('is-error', 'is-warning', 'is-success', 'is-primary');
        if (value > 60) barElement.classList.add('is-success');
        else if (value > 25) barElement.classList.add('is-warning');
        else barElement.classList.add('is-error');
    }

    handleEvolve(variante) {
        try { this.sounds.evolve.play(); } catch(e){}
        
        // Formatear el nombre para usarlo como clase CSS (ej. "Chembit Byte" -> "chembit-byte")
        const className = variante.toLowerCase().replace(' ', '-');
        
        // Quitar clases anteriores y añadir la nueva
        this.sprite.className = `sprite phase-${className}`;
        
        this.notify(`¡Evolución! Ahora es ${variante}`);
    }

    notify(message) {
        this.notificationArea.innerText = message;
        // Borrar el mensaje después de 3 segundos
        clearTimeout(this.notificationTimer);
        this.notificationTimer = setTimeout(() => {
            this.notificationArea.innerText = "";
        }, 3000);
    }

    playBeep() {
        try { this.sounds.beep.play(); } catch(e){}
    }
}

// Instanciar la UI una vez que el DOM cargue (esto se llamará desde app.js)
