/**
 * ACCESSIBILITY MODULE (a11y) - Centro Odontológico
 * Soporte para daltonismo, discapacidad visual/ceguera (Lector de pantalla por voz Web Speech API),
 * control de tamaño de texto, alto contraste y navegación accesible por teclado.
 */

class AccessibilityModule {
    constructor() {
        this.speechSynthesis = window.speechSynthesis || null;
        this.speechVoice = null;
        this.isScreenReaderActive = false;
        this.fontSizeLevel = 0; // -1: 85%, 0: 100%, 1: 115%, 2: 130%, 3: 150%
        this.fontSizes = ['font-size-sm', '', 'font-size-lg', 'font-size-xl', 'font-size-2xl'];
        this.currentColorFilter = 'normal'; // 'normal', 'high-contrast', 'protanopia', 'tritanopia', 'monochrome'
        this.isDyslexicFont = false;
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupSpeechSynthesis();
        this.setupKeyboardShortcuts();
    }

    loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem('dental_accessibility_settings')) || {};
            if (saved.fontSizeLevel !== undefined) this.setFontSize(saved.fontSizeLevel);
            if (saved.currentColorFilter) this.setColorFilter(saved.currentColorFilter);
            if (saved.isDyslexicFont) this.setDyslexicFont(saved.isDyslexicFont);
            if (saved.isScreenReaderActive) this.toggleScreenReader(saved.isScreenReaderActive);
        } catch (e) {
            console.warn('Error al cargar configuración de accesibilidad:', e);
        }
    }

    saveSettings() {
        const settings = {
            fontSizeLevel: this.fontSizeLevel,
            currentColorFilter: this.currentColorFilter,
            isDyslexicFont: this.isDyslexicFont,
            isScreenReaderActive: this.isScreenReaderActive
        };
        localStorage.setItem('dental_accessibility_settings', JSON.stringify(settings));
    }

    // ==========================================
    // LECTOR DE PANTALLA POR VOZ (TEXT-TO-SPEECH)
    // ==========================================
    setupSpeechSynthesis() {
        if (!this.speechSynthesis) return;

        const updateVoices = () => {
            const voices = this.speechSynthesis.getVoices();
            // Buscar voz en español
            this.speechVoice = voices.find(v => v.lang.startsWith('es') || v.lang.includes('Spanish')) || voices[0];
        };

        updateVoices();
        if (this.speechSynthesis.onvoiceschanged !== undefined) {
            this.speechSynthesis.onvoiceschanged = updateVoices;
        }
    }

    speak(text) {
        if (!this.speechSynthesis || !text) return;

        // Estricto: el asistente de voz solo habla si fue activado explícitamente desde las opciones de accesibilidad
        if (!this.isScreenReaderActive) return;

        this.speechSynthesis.cancel(); // Detener locución previa
        const utterance = new SpeechSynthesisUtterance(text);
        if (this.speechVoice) utterance.voice = this.speechVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = 'es-ES';
        this.speechSynthesis.speak(utterance);
    }

    stopSpeech() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
    }

    toggleScreenReader(forceState = null) {
        this.isScreenReaderActive = forceState !== null ? forceState : !this.isScreenReaderActive;
        const btn = document.getElementById('btnToggleVoiceAssistant');
        const badge = document.getElementById('voiceAssistantStatusBadge');

        if (this.isScreenReaderActive) {
            document.body.classList.add('voice-assistant-active');
            if (btn) btn.classList.add('active');
            if (badge) {
                badge.textContent = 'Activado';
                badge.className = 'badge bg-success';
            }
            this.speak('Asistente de voz y lectura activado. Al seleccionar o enfocar elementos, se leerán en voz alta.');
            this.enableHoverFocusReading();
        } else {
            document.body.classList.remove('voice-assistant-active');
            if (btn) btn.classList.remove('active');
            if (badge) {
                badge.textContent = 'Desactivado';
                badge.className = 'badge bg-secondary';
            }
            this.stopSpeech();
            this.disableHoverFocusReading();
        }
        this.saveSettings();
    }

    enableHoverFocusReading() {
        // Al pasar el foco con tab o teclado, leer el elemento
        document.addEventListener('focusin', (e) => {
            if (!this.isScreenReaderActive) return;
            const target = e.target;
            const textToRead = target.getAttribute('aria-label') || target.innerText || target.getAttribute('title') || target.placeholder;
            if (textToRead && textToRead.trim().length > 0) {
                this.speak(textToRead.trim());
            }
        });
    }

    readCurrentSectionSummary() {
        const activeSection = document.querySelector('.app-section:not(.d-none)');
        if (!activeSection) return;

        const title = activeSection.querySelector('h1, h2, h3')?.innerText || 'Sección';
        const description = activeSection.querySelector('p')?.innerText || '';
        this.speak(`Usted está en: ${title}. ${description}`, true);
    }

    // ==========================================
    // DALTONISMO & ALTO CONTRASTE
    // ==========================================
    setColorFilter(filterName) {
        this.currentColorFilter = filterName;

        // Remover clases previas
        document.body.classList.remove(
            'theme-high-contrast', 
            'theme-protanopia', 
            'theme-tritanopia', 
            'theme-monochrome'
        );

        if (filterName !== 'normal') {
            document.body.classList.add(`theme-${filterName}`);
        }

        // Actualizar select en la UI si existe
        const select = document.getElementById('selectColorTheme');
        if (select) select.value = filterName;

        this.saveSettings();

        // Notificar en voz si está activo
        if (this.isScreenReaderActive) {
            const filterNamesMap = {
                'normal': 'Color original clínico',
                'high-contrast': 'Modo de alto contraste activado',
                'protanopia': 'Modo adaptado para daltonismo rojo-verde',
                'tritanopia': 'Modo adaptado para daltonismo azul-amarillo',
                'monochrome': 'Modo monocromático en escala de grises'
            };
            this.speak(filterNamesMap[filterName] || filterName, true);
        }
    }

    // ==========================================
    // TAMAÑO DE TEXTO (ZOOM)
    // ==========================================
    setFontSize(level) {
        this.fontSizeLevel = Math.max(-1, Math.min(3, level));

        // Quitar clases previas
        this.fontSizes.forEach(cls => {
            if (cls) document.body.classList.remove(cls);
        });

        const newCls = this.fontSizes[this.fontSizeLevel + 1];
        if (newCls) document.body.classList.add(newCls);

        const label = document.getElementById('fontSizeDisplay');
        if (label) {
            const percentMap = ['85%', '100%', '115%', '130%', '150%'];
            label.textContent = percentMap[this.fontSizeLevel + 1];
        }

        this.saveSettings();
    }

    increaseFontSize() {
        this.setFontSize(this.fontSizeLevel + 1);
        if (this.isScreenReaderActive) {
            this.speak(`Tamaño de texto aumentado a ${document.getElementById('fontSizeDisplay')?.textContent || ''}`, true);
        }
    }

    decreaseFontSize() {
        this.setFontSize(this.fontSizeLevel - 1);
        if (this.isScreenReaderActive) {
            this.speak(`Tamaño de texto reducido a ${document.getElementById('fontSizeDisplay')?.textContent || ''}`, true);
        }
    }

    resetFontSize() {
        this.setFontSize(0);
        if (this.isScreenReaderActive) {
            this.speak('Tamaño de texto restablecido a 100%', true);
        }
    }

    // ==========================================
    // TIPOGRAFÍA PARA DISLEXIA
    // ==========================================
    setDyslexicFont(enable) {
        this.isDyslexicFont = !!enable;
        if (this.isDyslexicFont) {
            document.body.classList.add('font-dyslexic');
        } else {
            document.body.classList.remove('font-dyslexic');
        }

        const chk = document.getElementById('chkDyslexicFont');
        if (chk) chk.checked = this.isDyslexicFont;

        this.saveSettings();
    }

    // ==========================================
    // ATAJOS DE TECLADO ACCESIBLES
    // ==========================================
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + A: Abrir panel de accesibilidad
            if (e.altKey && (e.key === 'a' || e.key === 'A')) {
                e.preventDefault();
                const offcanvasEl = document.getElementById('offcanvasAccessibility');
                if (offcanvasEl) {
                    const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
                    bsOffcanvas.toggle();
                }
            }
            // Alt + V: Toggle asistente de voz
            if (e.altKey && (e.key === 'v' || e.key === 'V')) {
                e.preventDefault();
                this.toggleScreenReader();
            }
            // Alt + L: Leer sección activa
            if (e.altKey && (e.key === 'l' || e.key === 'L')) {
                e.preventDefault();
                this.readCurrentSectionSummary();
            }
        });
    }
}

window.accessibilityModule = new AccessibilityModule();
