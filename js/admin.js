/**
 * ADMIN MODULE - Centro Odontológico Multiprofesional
 * Gestión global de usuarios, roles (Admin, Secretaria, Profesional, Paciente),
 * profesionales del centro, turnos globales, settings y exportación CSV.
 */

class AdminModule {
    constructor() {
        this.appointmentSearch = '';
        this.userSearch = '';
        this.auditSearch = '';
        this.auditFilter = 'all';
    }

    init() {
        this.renderAdminStats();
        this.renderUsersList();
        this.renderProfessionalsList();
        this.renderSpecialtiesList();
        this.renderAllAppointments();
        this.renderAuditLogs();
        this.loadSettingsForm();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const formSettings = document.getElementById('formClinicSettings');
        if (formSettings) {
            formSettings.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveClinicSettings();
            });
        }

        const searchUserInput = document.getElementById('adminSearchUsers');
        if (searchUserInput) {
            searchUserInput.addEventListener('input', (e) => {
                this.userSearch = e.target.value.toLowerCase();
                this.renderUsersList();
            });
        }

        const searchApptInput = document.getElementById('adminSearchAppointments');
        if (searchApptInput) {
            searchApptInput.addEventListener('input', (e) => {
                this.appointmentSearch = e.target.value.toLowerCase();
                this.renderAllAppointments();
            });
        }

        // Búsqueda y filtros del Log de Auditoría (Exclusivo Admin)
        const searchAuditInput = document.getElementById('adminSearchAuditLogs');
        if (searchAuditInput) {
            searchAuditInput.addEventListener('input', (e) => {
                this.auditSearch = e.target.value.toLowerCase().trim();
                this.renderAuditLogs();
            });
        }

        const filterAuditSelect = document.getElementById('adminFilterAuditAction');
        if (filterAuditSelect) {
            filterAuditSelect.addEventListener('change', (e) => {
                this.auditFilter = e.target.value;
                this.renderAuditLogs();
            });
        }

        // Formulario de nuevo profesional
        const formNewProf = document.getElementById('formAddProfessional');
        if (formNewProf) {
            formNewProf.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateProfessional();
            });
        }

        // Pestañas internas de administración: actualizar la vista al hacer clic
        const adminSubTabs = document.getElementById('adminSubTabs');
        if (adminSubTabs) {
            adminSubTabs.addEventListener('shown.bs.tab', (e) => {
                if (typeof window.dismissActiveToasts === 'function') {
                    window.dismissActiveToasts();
                }
                const target = e.target.getAttribute('data-bs-target');
                if (target === '#adminProfsPane') this.renderProfessionalsList();
                else if (target === '#adminUsersPane') this.renderUsersList();
                else if (target === '#adminApptsPane') this.renderAllAppointments();
                else if (target === '#adminAuditLogsPane') this.renderAuditLogs();
                else if (target === '#adminSettingsPane') this.loadSettingsForm();
            });
        }
    }

    renderAdminStats() {
        const appointments = window.storageService.getAppointments();
        const users = window.storageService.getUsers();
        const professionals = window.storageService.getProfessionals();

        const totalAppts = appointments.length;
        const totalPatients = users.filter(u => u.role === 'paciente').length;
        const totalConfirmed = appointments.filter(a => a.status === 'confirmado').length;
        const totalAttended = appointments.filter(a => a.status === 'atendido').length;

        const statTotalEl = document.getElementById('adminStatTotalTurnos');
        const statPatientsEl = document.getElementById('adminStatPacientes');
        const statConfirmedEl = document.getElementById('adminStatConfirmados');
        const statAttendedEl = document.getElementById('adminStatAtendidos');

        if (statTotalEl) statTotalEl.textContent = totalAppts;
        if (statPatientsEl) statPatientsEl.textContent = totalPatients;
        if (statConfirmedEl) statConfirmedEl.textContent = totalConfirmed;
        if (statAttendedEl) statAttendedEl.textContent = totalAttended;

        const statProfsEl = document.getElementById('adminStatProfesionales');
        if (statProfsEl) statProfsEl.textContent = professionals.length;
    }

    // ==========================================
    // USUARIOS Y ROLES
    // ==========================================
    renderUsersList() {
        const container = document.getElementById('adminUsersTableBody');
        if (!container) return;

        let users = window.storageService.getUsers();

        if (this.userSearch) {
            users = users.filter(u => 
                (u.name && u.name.toLowerCase().includes(this.userSearch)) ||
                (u.email && u.email.toLowerCase().includes(this.userSearch)) ||
                (u.role && u.role.toLowerCase().includes(this.userSearch))
            );
        }

        if (users.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        No se encontraron usuarios coincidentes.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        const esc = window.escapeHTML || (s => (s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''));

        users.forEach(u => {
            let roleBadgeClass = 'bg-success-subtle text-success border border-success-subtle';
            if (u.role === 'admin') roleBadgeClass = 'bg-danger-subtle text-danger border border-danger-subtle';
            else if (u.role === 'secretaria') roleBadgeClass = 'bg-info-subtle text-info border border-info-subtle';
            else if (u.role === 'profesional') roleBadgeClass = 'bg-primary-subtle text-primary border border-primary-subtle';

            html += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${u.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name)}" 
                                 class="rounded-circle me-2" width="36" height="36" alt="${esc(u.name)}">
                            <div>
                                <div class="fw-bold">${esc(u.name)}</div>
                                <div class="text-muted small">${esc(u.email)}</div>
                            </div>
                        </div>
                    </td>
                    <td>${u.phone ? esc(u.phone) : '<span class="text-muted small">Sin teléfono</span>'}</td>
                    <td>
                        <span class="badge ${roleBadgeClass}">${window.authService.getRoleBadgeText(u.role)}</span>
                    </td>
                    <td>
                        <select class="form-select form-select-sm w-auto" 
                                onchange="window.adminModule.changeUserRole('${u.id}', this.value)"
                                ${u.id === window.authService.currentUser?.id ? 'disabled title="No puedes cambiar tu propio rol"' : ''}>
                            <option value="paciente" ${u.role === 'paciente' ? 'selected' : ''}>Paciente</option>
                            <option value="secretaria" ${u.role === 'secretaria' ? 'selected' : ''}>Secretaría / Recepción</option>
                            <option value="profesional" ${u.role === 'profesional' ? 'selected' : ''}>Profesional (Odontólogo/a)</option>
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </td>
                    <td class="text-end">
                        ${u.id !== window.authService.currentUser?.id ? `
                            <button class="btn btn-sm btn-outline-danger" onclick="window.adminModule.deleteUser('${u.id}')" title="Eliminar usuario">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : '<span class="badge bg-secondary-subtle text-secondary">Tú</span>'}
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
    }

    changeUserRole(userId, newRole) {
        window.storageService.updateUserRole(userId, newRole);
        window.showToast(`Rol actualizado a: ${newRole.toUpperCase()}`, 'success');
        this.renderUsersList();
        this.renderAdminStats();
    }

    deleteUser(userId) {
        if (!confirm('¿Confirma que desea eliminar este usuario del sistema?')) return;
        let users = window.storageService.getUsers().filter(u => u.id !== userId);
        window.storageService.saveUsers(users);
        window.showToast('Usuario eliminado.', 'info');
        this.renderUsersList();
        this.renderAdminStats();
    }

    // ==========================================
    // PROFESIONALES DEL CENTRO
    // ==========================================
    renderProfessionalsList() {
        const container = document.getElementById('adminProfessionalsList');
        if (!container) return;

        const profs = window.storageService.getProfessionals();
        let html = '';
        const esc = window.escapeHTML || (s => (s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''));

        profs.forEach(p => {
            html += `
                <div class="col-12 col-md-6 col-lg-4 mb-3">
                    <div class="card h-100 shadow-sm border-0 border-top border-4 border-primary">
                        <div class="card-body">
                            <div class="d-flex align-items-center gap-3 mb-3">
                                <img src="${p.picture}" class="rounded-circle border" width="48" height="48" alt="${esc(p.name)}">
                                <div>
                                    <h6 class="fw-bold mb-0 text-primary">${esc(p.name)}</h6>
                                    <span class="badge bg-primary-subtle text-primary small">${esc(p.consultorio || 'Box')}</span>
                                </div>
                            </div>
                            <p class="small text-muted mb-2"><i class="bi bi-journal-medical me-1"></i>${esc(p.specialty)}</p>
                            <p class="small text-muted mb-2"><i class="bi bi-envelope me-1"></i>${esc(p.email)}</p>
                            <p class="small text-muted mb-3"><i class="bi bi-clock me-1"></i>Turnos de: <strong>${p.slotDuration || 30} min</strong></p>
                            <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                                <button class="btn btn-sm btn-outline-primary" onclick="window.professionalModule.setProfessional('${p.id}'); window.app.switchTab('profesional-tab');">
                                    <i class="bi bi-sliders me-1"></i> Ver/Editar Horarios
                                </button>
                                ${profs.length > 1 ? `
                                    <button class="btn btn-sm btn-outline-danger" onclick="window.adminModule.deleteProfessional('${p.id}')" title="Dar de baja profesional">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ==========================================
    // GESTIÓN DE ESPECIALIDADES ODONTOLÓGICAS (ADMIN)
    // ==========================================
    renderSpecialtiesList() {
        const container = document.getElementById('adminSpecialtiesListContainer');
        if (!container) return;

        const list = window.storageService.getSpecialties();
        if (list.length === 0) {
            container.innerHTML = '<span class="text-muted small">No hay especialidades registradas en el sistema.</span>';
            return;
        }

        container.innerHTML = list.map(spec => `
            <span class="badge bg-white text-dark border p-2 d-inline-flex align-items-center gap-2 shadow-sm">
                <i class="bi bi-award text-primary"></i>
                <span class="fw-semibold">${window.escapeHTML(spec)}</span>
                ${list.length > 1 ? `
                    <button type="button" class="btn-close btn-close-sm" style="font-size: 0.65rem;" 
                            onclick="window.adminModule.handleDeleteSpecialty('${window.escapeHTML(spec)}')" 
                            title="Eliminar especialidad"></button>
                ` : ''}
            </span>
        `).join('');
    }

    handleAddSpecialty() {
        const input = document.getElementById('adminNewSpecialtyInput');
        if (!input || !input.value.trim()) return;

        const val = input.value.trim();
        const added = window.storageService.addSpecialty(val);
        if (added) {
            window.showToast(`Especialidad "${val}" agregada con éxito.`, 'success');
            input.value = '';
            this.renderSpecialtiesList();
        } else {
            window.showToast(`La especialidad "${val}" ya se encuentra registrada.`, 'warning');
        }
    }

    handleDeleteSpecialty(name) {
        if (confirm(`¿Desea eliminar la especialidad "${name}"?`)) {
            window.storageService.deleteSpecialty(name);
            window.showToast('Especialidad eliminada del centro.', 'info');
            this.renderSpecialtiesList();
        }
    }

    handleCreateProfessional() {
        const name = document.getElementById('newProfName')?.value?.trim();
        const specialty = document.getElementById('newProfSpecialty')?.value?.trim();
        const email = document.getElementById('newProfEmail')?.value?.trim();
        const consultorio = document.getElementById('newProfConsultorio')?.value?.trim();
        const duration = parseInt(document.getElementById('newProfDuration')?.value || 30, 10);

        if (!name || !email) {
            window.showToast('Por favor complete nombre y correo.', 'warning');
            return;
        }

        const profs = window.storageService.getProfessionals();
        const defaultReasons = [
            `Consulta de ${specialty || 'Odontología'}`,
            'Control y Seguimiento',
            'Tratamiento Específico'
        ];

        const newProf = {
            id: 'prof_' + Date.now(),
            name,
            specialty: specialty || 'Odontología General',
            email,
            phone: '11 0000-0000',
            consultorio: consultorio || 'Consultorio',
            slotDuration: duration,
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`,
            reasons: defaultReasons,
            schedule: {
                0: { enabled: false, shifts: [] },
                1: { enabled: true, shifts: [{ start: '09:00', end: '13:00' }] },
                2: { enabled: true, shifts: [{ start: '09:00', end: '13:00' }] },
                3: { enabled: true, shifts: [{ start: '09:00', end: '13:00' }] },
                4: { enabled: true, shifts: [{ start: '09:00', end: '13:00' }] },
                5: { enabled: true, shifts: [{ start: '09:00', end: '13:00' }] },
                6: { enabled: false, shifts: [] }
            },
            blockedDates: []
        };

        profs.push(newProf);
        window.storageService.saveProfessionals(profs);

        // Crear usuario correspondiente
        window.storageService.upsertUser({
            name,
            email,
            role: 'profesional',
            professionalId: newProf.id,
            picture: newProf.picture
        });

        window.showToast(`Profesional ${name} incorporado/a con éxito.`, 'success');

        // Cerrar modal
        const m = bootstrap.Modal.getInstance(document.getElementById('modalAddProfessional'));
        if (m) m.hide();

        this.renderProfessionalsList();
        this.renderAdminStats();
        if (window.patientModule) window.patientModule.renderProfessionalsSelect();
        if (window.secretaryModule) window.secretaryModule.renderProfessionalsFilter();
    }

    createSecretaryUser(name, email, phone) {
        if (!name || !email) {
            window.showToast('Ingrese nombre y correo para la secretaría.', 'warning');
            return;
        }

        const cleanPhone = phone ? (window.stripCountryCode ? window.stripCountryCode(phone) : phone.trim()) : '';
        const newUser = window.storageService.upsertUser({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: cleanPhone,
            role: 'secretaria',
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d9488&color=fff`
        });

        window.showToast(`Usuario de Secretaría creado exitosamente para ${name}.`, 'success');
        this.renderUsersList();
        this.renderAdminStats();
    }

    deleteProfessional(profId) {
        if (!confirm('¿Confirma que desea eliminar este profesional del centro?')) return;
        let profs = window.storageService.getProfessionals().filter(p => p.id !== profId);
        window.storageService.saveProfessionals(profs);
        window.showToast('Profesional eliminado.', 'info');
        this.renderProfessionalsList();
        this.renderAdminStats();
        if (window.patientModule) {
            window.patientModule.renderCarouselProfessionals();
            window.patientModule.renderProfessionalsSelect();
        }
        if (window.secretaryModule) window.secretaryModule.renderProfessionalsFilter();
    }

    // ==========================================
    // AUDITORÍA GLOBAL DE TURNOS
    // ==========================================
    renderAllAppointments() {
        const container = document.getElementById('adminAppointmentsTableBody');
        if (!container) return;

        let appointments = window.storageService.getAppointments();

        if (this.appointmentSearch) {
            appointments = appointments.filter(a => 
                (a.patientName && a.patientName.toLowerCase().includes(this.appointmentSearch)) ||
                (a.professionalName && a.professionalName.toLowerCase().includes(this.appointmentSearch)) ||
                (a.reason && a.reason.toLowerCase().includes(this.appointmentSearch)) ||
                (a.date && a.date.includes(this.appointmentSearch))
            );
        }

        appointments.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

        if (appointments.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        No se encontraron turnos con los filtros aplicados.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        const esc = window.escapeHTML || (s => (s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''));

        appointments.forEach(a => {
            let statusBadge = '';
            if (a.status === 'confirmado') statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle me-1"></i>Confirmado</span>';
            else if (a.status === 'pendiente') statusBadge = '<span class="badge bg-warning-subtle text-warning border border-warning-subtle"><i class="bi bi-hourglass-split me-1"></i>Pendiente</span>';
            else if (a.status === 'atendido') statusBadge = '<span class="badge bg-info-subtle text-info border border-info-subtle"><i class="bi bi-clipboard2-check me-1"></i>Atendido</span>';
            else statusBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle"><i class="bi bi-x-circle me-1"></i>Cancelado</span>';

            html += `
                <tr class="${a.status === 'cancelado' ? 'opacity-50 table-light' : ''}">
                    <td>
                        <strong>${esc(a.date)}</strong>
                        <div class="small text-muted">${esc(a.time)} hs</div>
                    </td>
                    <td>
                        <span class="badge bg-light text-primary border">${esc(a.professionalName)}</span>
                    </td>
                    <td>
                        <div class="fw-semibold">${esc(a.patientName)}</div>
                        <div class="text-muted small">${esc(a.patientEmail)}</div>
                        ${a.patientPhone ? `<div class="small text-success"><i class="bi bi-whatsapp me-1"></i>${esc(a.patientPhone)}</div>` : ''}
                    </td>
                    <td>
                        <span class="fw-semibold text-dark">${esc(a.reason)}</span>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <select class="form-select form-select-sm" onchange="window.adminModule.changeAppointmentStatus('${a.id}', this.value)">
                            <option value="confirmado" ${a.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                            <option value="pendiente" ${a.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="atendido" ${a.status === 'atendido' ? 'selected' : ''}>Atendido</option>
                            <option value="cancelado" ${a.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger" onclick="window.adminModule.deleteAppointment('${a.id}')" title="Eliminar registro">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
        this.renderAdminStats();
    }

    changeAppointmentStatus(id, newStatus) {
        window.storageService.updateAppointmentStatus(id, newStatus);
        window.showToast('Estado del turno actualizado.', 'success');
        this.renderAllAppointments();
        if (window.secretaryModule) window.secretaryModule.renderDailyDashboard();
        if (window.professionalModule) window.professionalModule.renderAppointmentsList();
    }

    deleteAppointment(id) {
        if (!confirm('¿Confirma que desea borrar permanentemente este turno?')) return;
        window.storageService.deleteAppointment(id);
        window.showToast('Turno eliminado.', 'info');
        this.renderAllAppointments();
        if (window.secretaryModule) window.secretaryModule.renderDailyDashboard();
        if (window.professionalModule) window.professionalModule.renderAppointmentsList();
        if (window.patientModule) window.patientModule.renderAvailableSlots();
    }

    // ==========================================
    // CONFIGURACIÓN GENERAL
    // ==========================================
    loadSettingsForm() {
        const settings = window.storageService.getSettings();
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined) el.value = val;
        };

        setVal('settingClinicName', settings.clinicName);
        const cleanClinicPhone = window.stripCountryCode ? window.stripCountryCode(settings.phone) : settings.phone;
        setVal('settingPhone', cleanClinicPhone);
        setVal('settingAddress', settings.address);
        setVal('settingGoogleClientId', settings.googleClientId || '');

        const autoConfirmCheck = document.getElementById('settingAutoConfirm');
        if (autoConfirmCheck) autoConfirmCheck.checked = !!settings.allowAutoConfirm;
    }

    saveClinicSettings() {
        const getVal = (id) => document.getElementById(id)?.value?.trim() || '';

        const rawPhone = getVal('settingPhone');
        const cleanPhone = window.stripCountryCode ? window.stripCountryCode(rawPhone) : rawPhone;

        const settings = {
            clinicName: getVal('settingClinicName'),
            phone: cleanPhone,
            address: getVal('settingAddress'),
            googleClientId: getVal('settingGoogleClientId'),
            allowAutoConfirm: document.getElementById('settingAutoConfirm')?.checked ?? true
        };

        window.storageService.saveSettings(settings);
        window.showToast('Configuración del centro guardada correctamente.', 'success');
        window.patientModule.renderBookingSection();
        window.app.updateClinicInfo();

        if (window.authService) window.authService.initGoogleClient();
    }

    exportAppointmentsCSV() {
        const appointments = window.storageService.getAppointments();
        if (appointments.length === 0) {
            window.showToast('No hay turnos para exportar', 'warning');
            return;
        }

        const headers = ['ID', 'Fecha', 'Hora', 'Profesional', 'Paciente', 'Email', 'Telefono', 'Motivo', 'Estado'];
        const rows = appointments.map(a => [
            `"${a.id}"`,
            `"${a.date}"`,
            `"${a.time}"`,
            `"${(a.professionalName || '').replace(/"/g, '""')}"`,
            `"${(a.patientName || '').replace(/"/g, '""')}"`,
            `"${(a.patientEmail || '').replace(/"/g, '""')}"`,
            `"${(a.patientPhone || '').replace(/"/g, '""')}"`,
            `"${(a.reason || '').replace(/"/g, '""')}"`,
            `"${a.status}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `turnos_centro_odontologico_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.showToast('Reporte exportado exitosamente a CSV.', 'success');
    }

    // ==========================================
    // LOG DE AUDITORÍA Y ACTIVIDAD (EXCLUSIVO ADMIN)
    // ==========================================
    renderAuditLogs() {
        const container = document.getElementById('adminAuditLogsTableBody');
        const countBadge = document.getElementById('adminAuditLogsCount');
        if (!container) return;

        let logs = window.storageService.getAuditLogs();

        // Filtrar por texto de búsqueda
        if (this.auditSearch) {
            logs = logs.filter(l => 
                (l.details && l.details.toLowerCase().includes(this.auditSearch)) ||
                (l.user && l.user.toLowerCase().includes(this.auditSearch)) ||
                (l.action && l.action.toLowerCase().includes(this.auditSearch)) ||
                (l.formattedDate && l.formattedDate.toLowerCase().includes(this.auditSearch))
            );
        }

        // Filtrar por categoría / acción
        if (this.auditFilter && this.auditFilter !== 'all') {
            logs = logs.filter(l => {
                if (this.auditFilter === 'turnos_creados') {
                    return l.action.includes('TURNO_CREADO');
                } else if (this.auditFilter === 'turnos_cancelados') {
                    return l.action.includes('CANCELADO') || l.action.includes('ELIMINADO');
                } else if (this.auditFilter === 'secretaria') {
                    return (l.role === 'secretaria') || l.action.includes('SECRETARIA');
                } else if (this.auditFilter === 'paciente') {
                    return (l.role === 'paciente') || l.action.includes('PACIENTE');
                } else if (this.auditFilter === 'profesionales') {
                    return l.action.includes('PROFESIONAL');
                }
                return l.action === this.auditFilter;
            });
        }

        if (countBadge) {
            countBadge.textContent = `${logs.length} eventos registrados`;
        }

        if (logs.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-5 text-muted">
                        <i class="bi bi-shield-check display-6 d-block mb-2 text-secondary"></i>
                        No hay eventos registrados que coincidan con los criterios de búsqueda.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        const esc = window.escapeHTML || (s => (s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''));

        logs.forEach(log => {
            let actionBadge = '';
            let roleBadge = '';

            // Color del tipo de acción
            if (log.action.includes('CANCELADO') || log.action.includes('ELIMINADO')) {
                actionBadge = `<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="bi bi-x-circle me-1"></i>${esc(log.action)}</span>`;
            } else if (log.action.includes('TURNO_CREADO_SECRETARIA')) {
                actionBadge = `<span class="badge bg-info-subtle text-info border border-info-subtle"><i class="bi bi-clipboard2-plus me-1"></i>TURNO (SECRETARÍA)</span>`;
            } else if (log.action.includes('TURNO_CREADO')) {
                actionBadge = `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle me-1"></i>${esc(log.action)}</span>`;
            } else if (log.action.includes('PROFESIONAL')) {
                actionBadge = `<span class="badge bg-primary-subtle text-primary border border-primary-subtle"><i class="bi bi-person-gear me-1"></i>${esc(log.action)}</span>`;
            } else {
                actionBadge = `<span class="badge bg-secondary-subtle text-dark border border-secondary-subtle"><i class="bi bi-info-circle me-1"></i>${esc(log.action)}</span>`;
            }

            // Badge del rol
            if (log.role === 'admin') {
                roleBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle ms-1">Admin</span>';
            } else if (log.role === 'secretaria') {
                roleBadge = '<span class="badge bg-info-subtle text-info border border-info-subtle ms-1">Secretaría</span>';
            } else if (log.role === 'profesional') {
                roleBadge = '<span class="badge bg-primary-subtle text-primary border border-primary-subtle ms-1">Profesional</span>';
            } else {
                roleBadge = '<span class="badge bg-secondary-subtle text-dark border border-secondary-subtle ms-1">Paciente</span>';
            }

            html += `
                <tr>
                    <td class="text-nowrap small text-muted">
                        <i class="bi bi-clock me-1"></i>${esc(log.formattedDate || log.timestamp)}
                    </td>
                    <td>${actionBadge}</td>
                    <td>
                        <strong class="small">${esc(log.user || 'Sistema')}</strong>
                        ${roleBadge}
                    </td>
                    <td class="small text-secondary">${esc(log.details)}</td>
                </tr>
            `;
        });

        container.innerHTML = html;
    }

    clearAuditLogs() {
        if (!confirm('¿Confirma que desea vaciar el historial de auditoría? Esta acción es irreversible y solo permitida para el Administrador.')) return;
        window.storageService.clearAuditLogs();
        window.showToast('Historial de auditoría vaciado.', 'info');
        this.renderAuditLogs();
    }

    resetDatabase() {
        if (!confirm('¿ATENCIÓN: Desea restaurar todos los datos a los valores iniciales de prueba?')) return;
        window.storageService.resetToDefaults();
        window.showToast('Base de datos restaurada.', 'info');
        setTimeout(() => window.location.reload(), 800);
    }
}

window.adminModule = new AdminModule();
