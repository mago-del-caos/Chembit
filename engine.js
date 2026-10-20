class ChembitEngine {
    constructor() {
        // Estadísticas Base
        this.stats = {
            hambre: 100,
            felicidad: 100,
            higiene: 100,
            estudio: 0,
            peso: 5,
            edad: 0, // En días simulados
            fase: 'Huevo', // Huevo, Bebé, Niño, Adolescente, Adulto, Especial
            variante: 'Huevo', // Nombre específico de la evolución
            enfermo: false,
            sucio: false
        };

        // Variables Ocultas (El Filtro de Cuidado)
        this.hidden = {
            careMistakes: 0, // Fallos de Cuidado
            ticksTotales: 0, // Ciclos de tiempo transcurridos
            estudioAltoTicks: 0, // Cuánto tiempo ha estado el estudio > 80%
            // Contadores de los minijuegos
            juegosJugados: {
                ladrillos: 0,
                operando: 0,
                ruleta: 0,
                dibujar: 0
            }
        };

        this.lastSave = Date.now();
    }

    // Inicialización y Carga (Integración con LocalForage)
    async init() {
        const savedData = await localforage.getItem('chembit_save');
        if (savedData) {
            this.stats = savedData.stats;
            this.hidden = savedData.hidden;
            this.calculateRetroactiveTicks(savedData.lastSave);
        }
        
        // Iniciar el Game Loop (1 tick = 1 minuto simulado, ejecutado cada segundo en la vida real para pruebas, 
        // o ajustado a tiempo real dependiendo de la dificultad)
        // Para esta demo PWA: 1 minuto real = 1 tick.
        setInterval(() => this.tick(), 60000); 
    }

    async save() {
        this.lastSave = Date.now();
        await localforage.setItem('chembit_save', {
            stats: this.stats,
            hidden: this.hidden,
            lastSave: this.lastSave
        });
        // Emitir evento para que la UI se actualice
        document.dispatchEvent(new CustomEvent('chembitUpdate'));
    }

    calculateRetroactiveTicks(lastSaveTime) {
        const now = Date.now();
        const minsPassed = Math.floor((now - lastSaveTime) / 60000);
        if (minsPassed > 0) {
            for(let i = 0; i < minsPassed; i++) {
                this.tick(true); // true = tick silencioso, sin UI inmediata
            }
        }
    }

    // El ciclo vital de Chembit
    tick(isRetroactive = false) {
        this.hidden.ticksTotales++;

        // Aumento de edad (ej. 1 día = 24 ticks para simplificar pruebas)
        if (this.hidden.ticksTotales % 24 === 0) {
            this.stats.edad++;
            this.checkEvolution();
        }

        // Desgaste de estadísticas
        if (!this.stats.enfermo) {
            this.stats.hambre = Math.max(0, this.stats.hambre - 1);
            this.stats.felicidad = Math.max(0, this.stats.felicidad - 0.5);
            this.stats.estudio = Math.max(0, this.stats.estudio - 1);
        } else {
            // Enfermo baja estadísticas más rápido
            this.stats.hambre = Math.max(0, this.stats.hambre - 2);
            this.stats.felicidad = Math.max(0, this.stats.felicidad - 2);
        }

        // Generación de suciedad aleatoria basada en la higiene
        if (Math.random() < 0.1 && this.stats.higiene < 50) {
            this.stats.sucio = true;
        }

        if (this.stats.sucio) {
            this.stats.higiene = Math.max(0, this.stats.higiene - 2);
        }

        // Riesgo de enfermarse si higiene o hambre están en 0
        if ((this.stats.higiene === 0 || this.stats.hambre === 0) && Math.random() < 0.2) {
            this.stats.enfermo = true;
        }

        // Registro de Fallos de Cuidado (Care Mistakes)
        if (this.stats.hambre === 0 || this.stats.higiene === 0) {
            // Cada tick en cero suma un "castigo" fraccional. 15 ticks = 1 Care Mistake completo.
            this.hidden.careMistakes += (1/15); 
        }

        // Registro de Estudio
        if (this.stats.estudio > 80) {
            this.hidden.estudioAltoTicks++;
        }

        if (!isRetroactive) this.save();
    }

    // ACCIONES DEL USUARIO
    feed(type) {
        if (type === 'meal') {
            this.stats.hambre = Math.min(100, this.stats.hambre + 30);
            this.stats.peso += 2;
            this.stats.higiene -= 5;
        } else if (type === 'snack') {
            this.stats.felicidad = Math.min(100, this.stats.felicidad + 20);
            this.stats.peso += 5; // Sube mucho el peso
        }
        this.save();
    }

    clean() {
        this.stats.higiene = 100;
        this.stats.sucio = false;
        this.save();
    }

    heal() {
        if (this.stats.enfermo) {
            this.stats.enfermo = false;
            this.stats.felicidad = Math.max(0, this.stats.felicidad - 10); // Curar duele un poco
            this.save();
        }
    }

    study() {
        this.stats.estudio = Math.min(100, this.stats.estudio + 25);
        this.stats.felicidad = Math.max(0, this.stats.felicidad - 5);
        this.save();
    }

    // JUGAR - Recibe el nombre del minijuego para la estadística oculta
    play(gameName) {
        this.stats.felicidad = Math.min(100, this.stats.felicidad + 30);
        this.stats.peso = Math.max(5, this.stats.peso - 3);
        this.stats.hambre -= 10;
        
        // Sumar al registro oculto
        if (this.hidden.juegosJugados.hasOwnProperty(gameName)) {
            this.hidden.juegosJugados[gameName]++;
        }
        this.save();
    }

    // ==========================================
    // SISTEMA DE EVOLUCIÓN
    // ==========================================
    checkEvolution() {
        const { edad, fase } = this.stats;
        const FC = Math.floor(this.hidden.careMistakes);

        if (fase === 'Huevo' && this.hidden.ticksTotales >= 5) { // 5 ticks
            this.evolveTo('Bebé', 'Chembit Bit');
        } 
        else if (fase === 'Bebé' && edad >= 1) {
            if (FC <= 1) this.evolveTo('Niño', 'Chembit Byte');
            else this.evolveTo('Niño', 'Chembit Bug');
        } 
        else if (fase === 'Niño' && edad >= 3) {
            if (this.stats.variante === 'Chembit Byte') {
                if (this.stats.estudio > 70 && this.stats.peso < 15) this.evolveTo('Adolescente', 'Chembit Beta');
                else this.evolveTo('Adolescente', 'Chembit Arcade');
            } else { // Viene de Bug
                if (this.stats.estudio > 60) this.evolveTo('Adolescente', 'Chembit Hacker');
                else this.evolveTo('Adolescente', 'Chembit Glotón');
            }
        } 
        else if (fase === 'Adolescente' && edad >= 5) {
            // Evolución a Adulto (AQUÍ ACTÚA LA LÓGICA OCULTA)
            if (FC > 5 || this.stats.peso > 50) {
                // Ruta de Negligencia
                if (this.stats.peso > 50) this.evolveTo('Adulto', 'Chembit Spam');
                else this.evolveTo('Adulto', 'Chembit Troyano');
            } else {
                // Ruta de Especialización basada en juegos
                const adultoEspecializado = this.determinarEvolucionPorJuego();
                this.evolveTo('Adulto', adultoEspecializado);
            }
        }
        else if (fase === 'Adulto' && edad >= 12) {
            // Fase Trascendencia
            if (FC === 0) this.evolveTo('Especial', 'Chembit IA');
            else if (['Chembit Spam', 'Chembit Troyano'].includes(this.stats.variante)) this.evolveTo('Especial', 'Chembit Glitch Cero');
            else if (this.stats.felicidad === 100) this.evolveTo('Especial', 'Chembit Fantasma');
        }
    }

    determinarEvolucionPorJuego() {
        let maxJuegos = 0;
        let juegoFavorito = 'empate';

        for (const [juego, cantidad] of Object.entries(this.hidden.juegosJugados)) {
            if (cantidad > maxJuegos) {
                maxJuegos = cantidad;
                juegoFavorito = juego;
            } else if (cantidad === maxJuegos && cantidad > 0) {
                juegoFavorito = 'empate'; // Empate anula la especialización
            }
        }

        const diccionarioEvoluciones = {
            'ladrillos': 'Chembit Constructor',
            'operando': 'Chembit Medico',
            'ruleta': 'Chembit Magnate',
            'dibujar': 'Chembit Creador',
            'empate': 'Chembit Compilado' // Forma estándar
        };

        return diccionarioEvoluciones[juegoFavorito] || 'Chembit Compilado';
    }

    evolveTo(nuevaFase, nuevaVariante) {
        this.stats.fase = nuevaFase;
        this.stats.variante = nuevaVariante;
        
        // Efecto visual/sonoro disparado al UI
        document.dispatchEvent(new CustomEvent('chembitEvolve', { 
            detail: { fase: nuevaFase, variante: nuevaVariante } 
        }));
        
        this.save();
    }
}

// Instanciar globalmente
window.chembit = new ChembitEngine();
