/**
 * MAIN APP CONTROLLER - Centro Odontológico
 * Enrutador de pestañas, barra de navegación móvil, roles y notificaciones accesibles
 */

class AppController {
    constructor() {
        this.currentTab = 'reserva-tab';
    }

    init() {
        window.authService.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });

        this.setupNavigation();

        // Inicializar módulos
        window.patientModule.init();
        window.secretaryModule.init();
        window.professionalModule.init();
        window.adminModule.init();

        this.updateClinicInfo();
    }

    updateClinicInfo() {
        const settings = window.storageService.getSettings();
        document.querySelectorAll('.brand-clinic-name').forEach(el => el.textContent = settings.clinicName);
        document.querySelectorAll('.brand-phone').forEach(el => el.textContent = settings.phone);
        document.querySelectorAll('.brand-address').forEach(el => el.textContent = settings.address);
    }

    setupNavigation() {
        // Enlazar enlaces con data-tab tanto en navbar superior como en bottom bar móvil
        const navLinks = document.querySelectorAll('[data-tab]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.getAttribute('data-tab');
                if (tabId) this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        const currentUser = window.authService?.currentUser;
        // Usuario sin cuenta registrada: Solo puede ver el landing con pedido de turno
        if (!currentUser && tabId !== 'reserva-tab') {
            window.showToast('El usuario sin cuenta registrada solo puede ver el landing y solicitar turnos.', 'warning');
            tabId = 'reserva-tab';
        }

        if (tabId === 'reserva-tab' && currentUser && currentUser.role === 'profesional') {
            window.showToast('Los profesionales no pueden agendar turnos. Solo pacientes, secretaría y administradores tienen acceso a la reserva.', 'warning');
            tabId = 'profesional-tab';
        }

        this.currentTab = tabId;

        // Descartar popups flotantes previos al cambiar de sección
        if (typeof window.dismissActiveToasts === 'function') {
            window.dismissActiveToasts();
        }

        // Limpiar cualquier backdrop residual y desbloquear scroll
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');

        // Scroll suave al inicio de página
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Ocultar todas las secciones
        const sections = document.querySelectorAll('.app-section');
        sections.forEach(sec => sec.classList.add('d-none'));

        // Desactivar todos los links en navbar y mobile bar
        const navLinks = document.querySelectorAll('[data-tab]');
        navLinks.forEach(link => {
            if (link.getAttribute('data-tab') === tabId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Mostrar sección destino
        const targetSection = document.getElementById(tabId);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }

        // Actualización y sincronización completa de la sección
        this.refreshSectionData(tabId);

        // Colapsar navbar en móviles
        const navbarCollapse = document.getElementById('navbarMain');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) bsCollapse.hide();
        }

        // Si el asistente de voz está activo, leer el título de la nueva sección
        if (window.accessibilityModule && window.accessibilityModule.isScreenReaderActive) {
            window.accessibilityModule.readCurrentSectionSummary();
        }
    }

    refreshSectionData(tabId) {
        if (tabId === 'secretaria-tab') {
            if (window.secretaryModule) {
                window.secretaryModule.renderProfessionalsCardsGrid();
                window.secretaryModule.renderProfessionalsFilter();
                window.secretaryModule.renderDailyDashboard();
            }
        } else if (tabId === 'profesional-tab') {
            if (window.professionalModule) {
                window.professionalModule.detectCurrentProfessional();
                window.professionalModule.renderScheduleConfigForm();
                window.professionalModule.renderReasonsAndDurationConfig();
                window.professionalModule.renderBlockedDatesList();
                window.professionalModule.renderAppointmentsList();
                window.professionalModule.renderStats();
            }
        } else if (tabId === 'admin-tab') {
            if (window.adminModule) {
                window.adminModule.renderAdminStats();
                window.adminModule.renderUsersList();
                window.adminModule.renderProfessionalsList();
                window.adminModule.renderAllAppointments();
                window.adminModule.renderAuditLogs();
                window.adminModule.loadSettingsForm();
            }
        } else if (tabId === 'misturnos-tab') {
            if (window.patientModule) {
                window.patientModule.renderMyTurnos();
            }
        } else if (tabId === 'reserva-tab') {
            if (window.patientModule) {
                if (typeof window.patientModule.renderSpecialistsCarousel === 'function') {
                    window.patientModule.renderSpecialistsCarousel();
                }
                if (typeof window.patientModule.renderProfessionalsSelect === 'function') {
                    window.patientModule.renderProfessionalsSelect();
                }
                if (window.patientModule.selectedProfId && typeof window.patientModule.updateDoctorCard === 'function') {
                    const prof = window.storageService.getProfessionalById(window.patientModule.selectedProfId);
                    if (prof) window.patientModule.updateDoctorCard(prof);
                }
                if (typeof window.patientModule.renderAvailableSlots === 'function') {
                    window.patientModule.renderAvailableSlots();
                }
            }
        }
    }

    // ==========================================
    // VISTAS LIMPIAS DEL PACIENTE (RESERVAR / MIS TURNOS)
    // ==========================================
    showBookingView() {
        const currentUser = window.authService?.currentUser;
        if (currentUser && currentUser.role === 'profesional') {
            window.showToast('Los profesionales no pueden agendar turnos. Solo pacientes, secretaría y administradores tienen acceso a la reserva.', 'warning');
            this.switchTab('profesional-tab');
            return;
        }

        this.switchTab('reserva-tab');
        const bookingSection = document.getElementById('patientBookingSection');
        if (bookingSection) bookingSection.classList.remove('d-none');

        const btnBook = document.getElementById('btnActionBook');
        const btnMyTurnos = document.getElementById('btnActionMyTurnos');

        if (btnBook) {
            btnBook.classList.add('btn-primary', 'shadow');
            btnBook.classList.remove('btn-outline-primary');
        }
        if (btnMyTurnos) {
            btnMyTurnos.classList.remove('btn-primary', 'shadow');
            btnMyTurnos.classList.add('btn-outline-primary');
        }

        if (window.patientModule) {
            window.patientModule.backToStep1();
            window.patientModule.renderProfessionalsSelect();
            window.patientModule.renderAvailableSlots();
        }

        bookingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showCancelView() {
        // Redirigir de forma segura y unificada a "Mis Turnos", donde se gestionan cancelaciones y modificaciones
        this.switchTab('misturnos-tab');
    }

    handleAuthStateChange(user) {
        const userNavContainer = document.getElementById('userNavContainer');
        const loginBtnNav = document.getElementById('btnLoginNav');

        const navReservaItem = document.getElementById('navItemReserva');
        const navSecItem = document.getElementById('navItemSecretary');
        const navProfItem = document.getElementById('navItemProf');
        const navAdminItem = document.getElementById('navItemAdmin');
        const navMisTurnosItem = document.getElementById('navItemMisTurnos');

        // Bottom mobile nav items
        const btmReserva = document.getElementById('mobileNavReserva');
        const btmSec = document.getElementById('mobileNavSecretary');
        const btmProf = document.getElementById('mobileNavProf');
        const btmAdmin = document.getElementById('mobileNavAdmin');
        const btmMisTurnos = document.getElementById('mobileNavMisTurnos');

        if (user) {
            if (loginBtnNav) loginBtnNav.classList.add('d-none');
            if (userNavContainer) {
                userNavContainer.classList.remove('d-none');
                
                const userAvatar = document.getElementById('navUserAvatar');
                const userName = document.getElementById('navUserName');
                const userRoleBadge = document.getElementById('navUserRoleBadge');

                if (userAvatar) userAvatar.src = user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`;
                if (userName) userName.textContent = user.name;
                if (userRoleBadge) {
                    userRoleBadge.textContent = window.authService.getRoleBadgeText(user.role);
                    let badgeColor = 'bg-success';
                    if (user.role === 'admin') badgeColor = 'bg-danger';
                    else if (user.role === 'secretaria') badgeColor = 'bg-info text-dark';
                    else if (user.role === 'profesional') badgeColor = 'bg-primary';
                    userRoleBadge.className = `badge ms-1 ${badgeColor}`;
                }
            }

            if (navMisTurnosItem) navMisTurnosItem.classList.remove('d-none');
            if (btmMisTurnos) btmMisTurnos.classList.remove('d-none');

            // Permisos según rol
            if (user.role === 'admin') {
                if (navReservaItem) navReservaItem.classList.remove('d-none');
                if (navSecItem) navSecItem.classList.remove('d-none');
                if (navProfItem) navProfItem.classList.remove('d-none');
                if (navAdminItem) navAdminItem.classList.remove('d-none');
                if (btmReserva) btmReserva.classList.remove('d-none');
                if (btmSec) btmSec.classList.remove('d-none');
                if (btmProf) btmProf.classList.remove('d-none');
                if (btmAdmin) btmAdmin.classList.remove('d-none');
            } else if (user.role === 'secretaria') {
                if (navReservaItem) navReservaItem.classList.remove('d-none');
                if (navSecItem) navSecItem.classList.remove('d-none');
                if (navProfItem) navProfItem.classList.add('d-none');
                if (navAdminItem) navAdminItem.classList.add('d-none');
                if (btmReserva) btmReserva.classList.remove('d-none');
                if (btmSec) btmSec.classList.remove('d-none');
                if (btmProf) btmProf.classList.add('d-none');
                if (btmAdmin) btmAdmin.classList.add('d-none');
            } else if (user.role === 'profesional') {
                // REGLA: Los profesionales NO pueden agendar turnos
                if (navReservaItem) navReservaItem.classList.add('d-none');
                if (navSecItem) navSecItem.classList.add('d-none');
                if (navProfItem) navProfItem.classList.remove('d-none');
                if (navAdminItem) navAdminItem.classList.add('d-none');
                if (btmReserva) btmReserva.classList.add('d-none');
                if (btmSec) btmSec.classList.add('d-none');
                if (btmProf) btmProf.classList.remove('d-none');
                if (btmAdmin) btmAdmin.classList.add('d-none');
            } else {
                // Paciente
                if (navReservaItem) navReservaItem.classList.remove('d-none');
                if (navSecItem) navSecItem.classList.add('d-none');
                if (navProfItem) navProfItem.classList.add('d-none');
                if (navAdminItem) navAdminItem.classList.add('d-none');
                if (btmReserva) btmReserva.classList.remove('d-none');
                if (btmSec) btmSec.classList.add('d-none');
                if (btmProf) btmProf.classList.add('d-none');
                if (btmAdmin) btmAdmin.classList.add('d-none');
            }

            // Redirigir si estaba en pestaña no permitida
            if (user.role === 'paciente' && ['secretaria-tab', 'profesional-tab', 'admin-tab'].includes(this.currentTab)) {
                this.switchTab('reserva-tab');
            } else if (user.role === 'secretaria' && ['profesional-tab', 'admin-tab'].includes(this.currentTab)) {
                this.switchTab('secretaria-tab');
            } else if (user.role === 'profesional' && ['reserva-tab', 'secretaria-tab', 'admin-tab'].includes(this.currentTab)) {
                this.switchTab('profesional-tab');
            }

        } else {
            // Usuario sin cuenta registrada (visitante): Solo ve el landing con pedido de turno
            if (loginBtnNav) loginBtnNav.classList.remove('d-none');
            if (userNavContainer) userNavContainer.classList.add('d-none');

            // Solo visible la sección de pedido de turno (landing)
            if (navReservaItem) navReservaItem.classList.remove('d-none');
            if (navSecItem) navSecItem.classList.add('d-none');
            if (navProfItem) navProfItem.classList.add('d-none');
            if (navAdminItem) navAdminItem.classList.add('d-none');
            if (navMisTurnosItem) navMisTurnosItem.classList.add('d-none');

            if (btmReserva) btmReserva.classList.remove('d-none');
            if (btmSec) btmSec.classList.add('d-none');
            if (btmProf) btmProf.classList.add('d-none');
            if (btmAdmin) btmAdmin.classList.add('d-none');
            if (btmMisTurnos) btmMisTurnos.classList.add('d-none');

            // El usuario sin cuenta solo permanece en el landing de reserva
            if (this.currentTab !== 'reserva-tab') {
                this.switchTab('reserva-tab');
            }
        }

        window.patientModule.renderBookingSection();
        window.patientModule.renderMyTurnos();
    }
}

window.escapeHTML = function(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// ==========================================
// FORMATEO INTERNO DE WHATSAPP Y TELÉFONOS (ARGENTINA)
// El código de país (+54 ni 9) permanece 100% oculto en todo el sistema.
// La normalización internacional se hace únicamente de manera interna para la API de WhatsApp.
// ==========================================
window.stripCountryCode = function(rawPhone) {
    if (!rawPhone) return '';
    let p = String(rawPhone).trim();
    // Remover prefijos de país +54 9, +549, 0054 9, 0054, +54, 54 9, 549, etc.
    p = p.replace(/^(\+?54[\s-]*9|\+?54|0054[\s-]*9|0054|54[\s-]*9|549)[\s-]*/i, '');
    return p.trim();
};

window.normalizeArgentinePhone = function(rawPhone) {
    if (!rawPhone) return '';
    let d = String(rawPhone).replace(/\D/g, '');
    if (!d) return '';

    // Si ya viene con prefijo internacional
    if (d.startsWith('0054')) d = d.substring(4);
    if (d.startsWith('54')) d = d.substring(2);
    if (d.startsWith('9')) d = d.substring(1);
    if (d.startsWith('0')) d = d.substring(1);

    // Detección de prefijo celular tradicional argentino '15':
    // Área 11 (AMBA): 11 15 xxxx xxxx
    if (d.startsWith('11') && d.substring(2, 4) === '15') {
        d = '11' + d.substring(4);
    }
    // Área de 3 dígitos (ej: 341, 351, 221): xxx 15 xxx xxxx
    else if (d.length >= 11 && d.substring(3, 5) === '15') {
        d = d.substring(0, 3) + d.substring(5);
    }
    // Área de 4 dígitos (ej: 2944, 3875): xxxx 15 xx xxxx
    else if (d.length >= 12 && d.substring(4, 6) === '15') {
        d = d.substring(0, 4) + d.substring(6);
    }

    return '549' + d;
};

window.formatWhatsAppUrl = function(phone, message = '') {
    const norm = window.normalizeArgentinePhone(phone);
    if (!norm) return '#';
    if (!message) return `https://wa.me/${norm}`;
    let raw = message;
    try {
        if (message.includes('%')) {
            raw = decodeURIComponent(message);
        }
    } catch (e) {
        raw = message;
    }
    return `https://wa.me/${norm}?text=${encodeURIComponent(raw)}`;
};

window.dismissActiveToasts = function() {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const existingToasts = toastContainer.querySelectorAll('.toast');
    existingToasts.forEach(t => {
        if (window.bootstrap && bootstrap.Toast) {
            const instance = bootstrap.Toast.getInstance(t);
            if (instance) instance.dispose();
        }
        t.remove();
    });
};

let lastToastTimestamp = 0;

window.showToast = function(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    // Asegurar que aparezca siempre ÚNICAMENTE 1 popup a la vez
    window.dismissActiveToasts();

    lastToastTimestamp = Date.now();

    const toastId = 'toast_' + Date.now();
    const bgClass = {
        'success': 'bg-success text-white',
        'danger': 'bg-danger text-white',
        'warning': 'bg-warning text-dark border border-warning-subtle',
        'info': 'bg-primary text-white'
    }[type] || 'bg-dark text-white';

    const iconClass = {
        'success': 'bi-check-circle-fill',
        'danger': 'bi-exclamation-triangle-fill',
        'warning': 'bi-exclamation-circle-fill',
        'info': 'bi-info-circle-fill'
    }[type] || 'bi-bell-fill';

    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg mb-2" role="alert" aria-live="assertive" aria-atomic="true" style="pointer-events: auto; min-width: 320px; max-width: 520px; border-radius: 14px; font-size: 1rem;">
            <div class="d-flex align-items-center p-3">
                <i class="bi ${iconClass} fs-3 me-3 flex-shrink-0" aria-hidden="true"></i>
                <div class="toast-body fw-semibold py-1 flex-grow-1" style="line-height: 1.4;">
                    ${message}
                </div>
                <button type="button" class="btn-close ${type === 'warning' ? '' : 'btn-close-white'} me-1 m-auto flex-shrink-0" data-bs-dismiss="toast" aria-label="Cerrar notificación"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    if (toastEl && window.bootstrap) {
        const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
        bsToast.show();

        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }
};

// Si hay un popup activo y el usuario hace clic en otra sección de la página,
// se descarta el popup. Se previene descartarlo en el mismo clic que lo disparó (margen de 350ms).
document.addEventListener('click', (e) => {
    if (Date.now() - lastToastTimestamp < 350) {
        return;
    }
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer && toastContainer.children.length > 0) {
        if (!e.target.closest('#toastContainer')) {
            window.dismissActiveToasts();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
    window.app.init();
});
