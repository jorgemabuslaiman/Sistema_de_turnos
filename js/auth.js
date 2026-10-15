/**
 * AUTH SERVICE - Centro Odontológico
 * Autenticación con Google y Sistema de Roles (Admin, Secretaria, Profesional, Paciente)
 */

class AuthService {
    constructor() {
        this.currentUser = null;
        this.authCallbacks = [];
        this.init();
    }

    init() {
        this.currentUser = window.storageService.getCurrentUser();
        window.addEventListener('load', () => {
            this.initGoogleClient();
        });
    }

    onAuthStateChanged(callback) {
        this.authCallbacks.push(callback);
        callback(this.currentUser);
    }

    notifyAuthChange() {
        this.authCallbacks.forEach(cb => cb(this.currentUser));
    }

    initGoogleClient() {
        const settings = window.storageService.getSettings();
        const clientId = settings.googleClientId;
        const googleBtnContainer = document.getElementById('googleSignInBtnContainer');
        if (!googleBtnContainer) return;

        if (window.google && clientId && clientId.trim() !== '') {
            try {
                window.google.accounts.id.initialize({
                    client_id: clientId.trim(),
                    callback: (response) => this.handleGoogleCredentialResponse(response),
                    auto_select: false
                });

                window.google.accounts.id.renderButton(
                    googleBtnContainer,
                    { 
                        theme: 'outline', 
                        size: 'large', 
                        width: '100%',
                        text: 'continue_with',
                        shape: 'rectangular',
                        logo_alignment: 'left'
                    }
                );
            } catch (err) {
                console.warn('Error al inicializar Google Sign-In:', err);
                this.renderGoogleMockFallback(googleBtnContainer);
            }
        } else {
            this.renderGoogleMockFallback(googleBtnContainer);
        }
    }

    renderGoogleMockFallback(container) {
        container.innerHTML = `
            <div class="d-grid gap-2">
                <button type="button" class="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold" id="btnGoogleSimulation">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z"/>
                        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                        <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.4 0 10.6 0 12s.6 3.6 1.6 5.6l3.7-2.9z"/>
                        <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z"/>
                    </svg>
                    <span>Iniciar sesión con Google</span>
                </button>
                <small class="text-muted text-center" style="font-size: 0.78rem;">
                    <i class="bi bi-info-circle me-1"></i>Modo de prueba activo o configure el <strong>Client ID</strong> en Administración.
                </small>
            </div>
        `;

        const btn = document.getElementById('btnGoogleSimulation');
        if (btn) {
            btn.onclick = () => {
                const modal = new bootstrap.Modal(document.getElementById('demoLoginModal'));
                modal.show();
            };
        }
    }

    decodeJwtResponse(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error al decodificar JWT de Google:', e);
            return null;
        }
    }

    handleGoogleCredentialResponse(response) {
        const payload = this.decodeJwtResponse(response.credential);
        if (!payload) {
            window.showToast('Error al autenticar con Google', 'danger');
            return;
        }

        this.loginOrCreateUser({
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        });
    }

    loginOrCreateUser(profileData) {
        let existingUser = window.storageService.findUserByEmail(profileData.email);
        const professionals = window.storageService.getProfessionals();
        const matchedProf = professionals.find(p => p.email.toLowerCase() === profileData.email.toLowerCase());

        let role = 'paciente';
        let professionalId = null;

        if (matchedProf) {
            role = 'profesional';
            professionalId = matchedProf.id;
        } else if (profileData.email.toLowerCase().includes('admin')) {
            role = 'admin';
        } else if (profileData.email.toLowerCase().includes('secretaria') || profileData.email.toLowerCase().includes('recepcion')) {
            role = 'secretaria';
        }

        if (existingUser) {
            role = existingUser.role;
            if (existingUser.professionalId) professionalId = existingUser.professionalId;
        }

        const user = window.storageService.upsertUser({
            name: profileData.name,
            email: profileData.email,
            picture: profileData.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=0d6efd&color=fff`,
            phone: profileData.phone || (existingUser ? existingUser.phone : ''),
            role: role,
            professionalId: professionalId
        });

        this.currentUser = user;
        window.storageService.setCurrentUser(user);
        this.notifyAuthChange();

        // Cerrar modales
        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl) {
            const m = bootstrap.Modal.getInstance(loginModalEl);
            if (m) m.hide();
        }
        const demoModalEl = document.getElementById('demoLoginModal');
        if (demoModalEl) {
            const m = bootstrap.Modal.getInstance(demoModalEl);
            if (m) m.hide();
        }

        window.showToast(`¡Bienvenido/a, ${user.name}! (${this.getRoleBadgeText(user.role)})`, 'success');
        if (window.accessibilityModule) {
            window.accessibilityModule.speak(`Sesión iniciada con éxito como ${user.name}. Rol: ${this.getRoleBadgeText(user.role)}.`);
        }
    }

    loginAs(roleOrEmail) {
        // Perfil para pruebas: Usuario sin cuenta registrada (visitante)
        if (roleOrEmail === 'invitado' || roleOrEmail === 'sin_cuenta' || roleOrEmail === 'anonimo') {
            this.currentUser = null;
            window.storageService.setCurrentUser(null);
            this.notifyAuthChange();

            // Limpiar cualquier backdrop modal congelado
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(b => b.remove());
            document.body.classList.remove('modal-open');

            const loginModalEl = document.getElementById('loginModal');
            if (loginModalEl) {
                const m = bootstrap.Modal.getInstance(loginModalEl);
                if (m) m.hide();
            }
            const demoModalEl = document.getElementById('demoLoginModal');
            if (demoModalEl) {
                const m = bootstrap.Modal.getInstance(demoModalEl);
                if (m) m.hide();
            }

            if (window.app) {
                window.app.switchTab('reserva-tab');
            }

            window.showToast('Perfil de prueba activo: Usuario sin cuenta registrada (Solo landing y pedido de turno).', 'info');
            if (window.accessibilityModule) {
                window.accessibilityModule.speak('Perfil de prueba activo: Usuario sin cuenta registrada. Solo visible el landing con pedido de turno.');
            }
            return;
        }

        const users = window.storageService.getUsers();
        let user;

        if (roleOrEmail === 'admin') {
            user = users.find(u => u.role === 'admin') || users[0];
        } else if (roleOrEmail === 'secretaria') {
            user = users.find(u => u.role === 'secretaria') || users.find(u => u.id === 'usr_sec');
        } else if (roleOrEmail === 'profesional' || roleOrEmail === 'profesional_1' || roleOrEmail === 'prof_1') {
            user = users.find(u => u.id === 'usr_prof_1') || users.find(u => u.role === 'profesional');
        } else if (roleOrEmail === 'profesional_2' || roleOrEmail === 'prof_2') {
            user = users.find(u => u.id === 'usr_prof_2');
        } else if (roleOrEmail === 'profesional_3' || roleOrEmail === 'prof_3') {
            user = users.find(u => u.id === 'usr_prof_3') || users.find(u => u.email === 'dra.valenzuela@dental.com');
        } else if (roleOrEmail === 'profesional_4' || roleOrEmail === 'prof_4') {
            user = users.find(u => u.id === 'usr_prof_4') || users.find(u => u.email === 'dr.rossi@dental.com');
        } else if (roleOrEmail === 'profesional_5' || roleOrEmail === 'prof_5') {
            user = users.find(u => u.id === 'usr_prof_5') || users.find(u => u.email === 'dra.benitez@dental.com');
        } else if (roleOrEmail === 'paciente') {
            user = users.find(u => u.role === 'paciente') || users[users.length - 1];
        } else {
            user = users.find(u => u.email.toLowerCase() === roleOrEmail.toLowerCase());
        }

        if (!user) {
            window.showToast('Usuario no encontrado', 'warning');
            return;
        }

        this.currentUser = user;
        window.storageService.setCurrentUser(user);
        this.notifyAuthChange();

        // Limpiar cualquier backdrop modal congelado
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
        document.body.classList.remove('modal-open');

        const demoModalEl = document.getElementById('demoLoginModal');
        if (demoModalEl) {
            const m = bootstrap.Modal.getInstance(demoModalEl);
            if (m) m.hide();
        }
        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl) {
            const m = bootstrap.Modal.getInstance(loginModalEl);
            if (m) m.hide();
        }

        // Si es profesional, sincronizar el panel profesional con este doctor específico
        if (user.role === 'profesional' && window.professionalModule) {
            if (user.professionalId) {
                window.professionalModule.setProfessional(user.professionalId);
            }
        }

        // Navegar a la pestaña correspondiente al rol seleccionado
        if (window.app) {
            if (user.role === 'secretaria') window.app.switchTab('secretaria-tab');
            else if (user.role === 'profesional') window.app.switchTab('profesional-tab');
            else if (user.role === 'admin') window.app.switchTab('admin-tab');
            else if (user.role === 'paciente') window.app.switchTab('reserva-tab');
        }

        window.showToast(`Sesión activa: ${user.name} (${this.getRoleBadgeText(user.role)})`, 'info');
        if (window.accessibilityModule) {
            window.accessibilityModule.speak(`Sesión activa como ${user.name}, ${this.getRoleBadgeText(user.role)}.`);
        }
    }

    loginWithCustomPatient(name, email, phone) {
        if (!email || !name) {
            window.showToast('Por favor ingrese nombre y correo electrónico', 'warning');
            return;
        }

        this.loginOrCreateUser({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : '',
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=198754&color=fff`
        });
    }

    logout() {
        this.currentUser = null;
        window.storageService.setCurrentUser(null);
        this.notifyAuthChange();
        window.showToast('Sesión finalizada exitosamente.', 'info');
        if (window.accessibilityModule) {
            window.accessibilityModule.speak('Sesión cerrada.');
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getRole() {
        return this.currentUser ? this.currentUser.role : null;
    }

    isAdmin() {
        return this.getRole() === 'admin';
    }

    isSecretary() {
        return this.getRole() === 'secretaria';
    }

    isProfessional() {
        return this.getRole() === 'profesional';
    }

    isPatient() {
        return this.getRole() === 'paciente';
    }

    getRoleBadgeText(role) {
        switch (role) {
            case 'admin': return 'Administrador';
            case 'secretaria': return 'Secretaría';
            case 'profesional': return 'Profesional';
            case 'paciente': return 'Paciente';
            default: return 'Invitado';
        }
    }
}

window.authService = new AuthService();
