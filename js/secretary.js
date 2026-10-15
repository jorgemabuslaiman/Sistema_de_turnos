/**
 * SECRETARY MODULE - Panel de Secretaría y Recepción
 * Permite visualizar las agendas y turnos de todos los profesionales del centro,
 * filtrar turnos por profesional y fecha, despachar recordatorios por WhatsApp,
 * agendar nuevos turnos para pacientes y cancelar turnos.
 * Todo cambio genera un registro de auditoría exclusivo para el Administrador.
 */

class SecretaryModule {
    constructor() {
        this.selectedProfId = 'all';
        this.selectedDate = this.getTodayDateString();
        this.statusFilter = 'all';
        this.searchQuery = '';
    }

    getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    }

    getTomorrowDateString() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }

    init() {
        this.setupEventListeners();
        this.renderProfessionalsCardsGrid();
        this.renderProfessionalsFilter();
        this.renderDailyDashboard();
    }

    setupEventListeners() {
        // Selector de profesional
        const profSelect = document.getElementById('secFilterProf');
        if (profSelect) {
            profSelect.addEventListener('change', (e) => {
                this.selectedProfId = e.target.value;
                this.renderProfessionalsCardsGrid();
                this.renderDailyDashboard();
            });
        }

        // Selector de fecha
        const dateInput = document.getElementById('secFilterDate');
        if (dateInput) {
            dateInput.value = this.selectedDate;
            dateInput.addEventListener('change', (e) => {
                this.selectedDate = e.target.value;
                this.renderProfessionalsCardsGrid();
                this.renderDailyDashboard();
            });
        }

        // Selector de estado
        const statusSelect = document.getElementById('secFilterStatus');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.renderDailyDashboard();
            });
        }

        // Búsqueda de paciente
        const searchInput = document.getElementById('secSearchPatient');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderDailyDashboard();
            });
        }

        // Formulario de nueva reserva por secretaría
        const formSecretaryBooking = document.getElementById('formSecretaryNewBooking');
        if (formSecretaryBooking) {
            formSecretaryBooking.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSecretaryBookingSubmit();
            });
        }

        // Modal booking: cambio de profesional
        const modalProfSelect = document.getElementById('secModalBookingProf');
        if (modalProfSelect) {
            modalProfSelect.addEventListener('change', (e) => {
                this.onSecretaryModalProfChange(e.target.value);
            });
        }

        // Modal booking: cambio de fecha
        const modalDateInput = document.getElementById('secModalBookingDate');
        if (modalDateInput) {
            modalDateInput.addEventListener('change', () => {
                this.updateSecretaryBookingSlots();
            });
        }
    }

    // ==========================================
    // TARJETAS / ICONOS DE PROFESIONALES EN PANTALLA PRINCIPAL
    // ==========================================
    renderProfessionalsCardsGrid() {
        const grid = document.getElementById('secProfessionalsGrid');
        if (!grid) return;

        const professionals = window.storageService.getProfessionals();
        const allAppointments = window.storageService.getAppointments();

        // Tarjeta para "Todos los Profesionales"
        const isAllActive = this.selectedProfId === 'all';
        const totalActiveAppts = allAppointments.filter(a => a.status !== 'cancelado').length;

        let html = `
            <div class="col-12 col-sm-6 col-md-4 col-xl-2 mb-3">
                <div class="card h-100 shadow-sm border-0 border-top border-4 ${isAllActive ? 'border-primary shadow bg-primary-subtle bg-opacity-25' : 'border-secondary'} text-center p-3 transition-card">
                    <div class="card-body p-0 d-flex flex-column align-items-center">
                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm mb-2" style="width: 64px; height: 64px; font-size: 1.8rem;">
                            <i class="bi bi-hospital"></i>
                        </div>
                        <h6 class="fw-bold text-dark mb-1">Todos los Médicos</h6>
                        <span class="badge bg-secondary mb-2">Visión Global</span>
                        <div class="small text-muted mb-3">
                            <i class="bi bi-calendar2-check me-1"></i><strong>${totalActiveAppts}</strong> turnos activos
                        </div>
                        <div class="d-grid w-100 mt-auto gap-1">
                            <button class="btn btn-sm ${isAllActive ? 'btn-primary' : 'btn-outline-primary'} fw-bold" onclick="window.secretaryModule.selectDoctorAgenda('all')">
                                <i class="bi bi-eye me-1"></i> Ver Todos
                            </button>
                            <button class="btn btn-sm btn-outline-success fw-bold" onclick="window.secretaryModule.openNewBookingModal()">
                                <i class="bi bi-plus-circle me-1"></i> Agendar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Tarjetas individuales para cada uno de los 5 profesionales
        professionals.forEach(p => {
            const isDoctorActive = this.selectedProfId === p.id;
            const doctorApptsCount = allAppointments.filter(a => a.professionalId === p.id && a.status !== 'cancelado').length;

            html += `
                <div class="col-12 col-sm-6 col-md-4 col-xl-2 mb-3">
                    <div class="card h-100 shadow-sm border-0 border-top border-4 ${isDoctorActive ? 'border-primary shadow bg-primary-subtle bg-opacity-25' : 'border-info-subtle'} text-center p-3 transition-card">
                        <div class="card-body p-0 d-flex flex-column align-items-center">
                            <div class="position-relative mb-2">
                                <img src="${p.picture}" 
                                     class="rounded-circle border border-2 ${isDoctorActive ? 'border-primary' : 'border-white'} shadow-sm object-fit-cover" 
                                     width="64" height="64" 
                                     alt="${p.name}"
                                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300';">
                                <span class="position-absolute bottom-0 end-0 badge rounded-pill bg-primary border border-white" style="font-size: 0.68rem;" title="Turnos activos">
                                    ${doctorApptsCount}
                                </span>
                            </div>
                            <h6 class="fw-bold text-primary mb-1 text-truncate w-100" title="${p.name}">${p.name}</h6>
                            <span class="badge bg-light text-dark border small text-truncate w-100 mb-1" title="${p.specialty}">${p.specialty}</span>
                            <span class="small text-muted mb-3"><i class="bi bi-door-open me-1"></i>${p.consultorio || 'Box'}</span>
                            
                            <div class="d-grid w-100 mt-auto gap-1">
                                <button class="btn btn-sm ${isDoctorActive ? 'btn-primary' : 'btn-outline-primary'} fw-bold" 
                                        onclick="window.secretaryModule.selectDoctorAgenda('${p.id}')">
                                    <i class="bi bi-calendar3 me-1"></i> Ver Agenda
                                </button>
                                <button class="btn btn-sm btn-success fw-bold" 
                                        onclick="window.secretaryModule.openNewBookingModal('${p.id}')">
                                    <i class="bi bi-calendar-plus me-1"></i> Agendar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
    }

    selectDoctorAgenda(profId) {
        this.selectedProfId = profId;
        const select = document.getElementById('secFilterProf');
        if (select) select.value = profId;

        this.renderProfessionalsCardsGrid();
        this.renderDailyDashboard();

        // Scroll suave hacia la tabla
        const tableCard = document.getElementById('secAppointmentsTableCard');
        if (tableCard) {
            tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    renderProfessionalsFilter() {
        const select = document.getElementById('secFilterProf');
        if (!select) return;

        const professionals = window.storageService.getProfessionals();
        let options = '<option value="all">🏥 Todos los Profesionales del Centro</option>';
        professionals.forEach(p => {
            options += `<option value="${p.id}" ${p.id === this.selectedProfId ? 'selected' : ''}>👩‍⚕️ ${p.name} (${p.specialty} - ${p.consultorio || 'Consultorio'})</option>`;
        });
        select.innerHTML = options;
    }

    renderDailyDashboard() {
        const container = document.getElementById('secAppointmentsTableBody');
        const statsContainer = document.getElementById('secStatsSummary');
        if (!container) return;

        const allAppointments = window.storageService.getAppointments();
        const professionals = window.storageService.getProfessionals();

        // Filtrar turnos
        let filtered = allAppointments.filter(a => {
            // Filtro por profesional
            if (this.selectedProfId !== 'all' && a.professionalId !== this.selectedProfId) {
                return false;
            }
            // Filtro por fecha (si está vacía, no filtra por fecha)
            if (this.selectedDate && a.date !== this.selectedDate) {
                return false;
            }
            // Filtro por estado
            if (this.statusFilter !== 'all' && a.status !== this.statusFilter) {
                return false;
            }
            // Filtro de búsqueda de paciente
            if (this.searchQuery) {
                const matchName = a.patientName && a.patientName.toLowerCase().includes(this.searchQuery);
                const matchEmail = a.patientEmail && a.patientEmail.toLowerCase().includes(this.searchQuery);
                const matchPhone = a.patientPhone && a.patientPhone.includes(this.searchQuery);
                const matchReason = a.reason && a.reason.toLowerCase().includes(this.searchQuery);
                if (!matchName && !matchEmail && !matchPhone && !matchReason) return false;
            }
            return true;
        });

        // Ordenar por hora y fecha
        filtered.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

        // Render stats
        if (statsContainer) {
            const totalForDay = filtered.length;
            const confirmedCount = filtered.filter(a => a.status === 'confirmado').length;
            const pendingCount = filtered.filter(a => a.status === 'pendiente').length;
            const attendedCount = filtered.filter(a => a.status === 'atendido').length;
            const cancelledCount = filtered.filter(a => a.status === 'cancelado').length;

            statsContainer.innerHTML = `
                <div class="row g-2 mb-3">
                    <div class="col-6 col-md-3">
                        <div class="card border-0 bg-primary-subtle p-2 text-center rounded-3 shadow-sm">
                            <span class="small text-muted fw-bold">Turnos Filtrados</span>
                            <span class="fs-4 fw-bold text-primary">${totalForDay}</span>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card border-0 bg-success-subtle p-2 text-center rounded-3 shadow-sm">
                            <span class="small text-muted fw-bold">Confirmados</span>
                            <span class="fs-4 fw-bold text-success">${confirmedCount}</span>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card border-0 bg-warning-subtle p-2 text-center rounded-3 shadow-sm">
                            <span class="small text-muted fw-bold">Pendientes</span>
                            <span class="fs-4 fw-bold text-warning">${pendingCount}</span>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card border-0 bg-info-subtle p-2 text-center rounded-3 shadow-sm">
                            <span class="small text-muted fw-bold">Atendidos / Cancelados</span>
                            <span class="fs-4 fw-bold text-info">${attendedCount} <span class="text-danger small fs-6">(${cancelledCount} canc.)</span></span>
                        </div>
                    </div>
                </div>
            `;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5 text-muted">
                        <i class="bi bi-calendar-x display-6 d-block mb-2 text-secondary"></i>
                        No se registraron turnos para los criterios seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        const esc = window.escapeHTML || (s => (s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''));

        filtered.forEach(appt => {
            const prof = professionals.find(p => p.id === appt.professionalId) || { name: appt.professionalName || 'Odontólogo/a', consultorio: 'Consultorio Central' };
            const cleanPhone = (appt.patientPhone || '').replace(/[^0-9]/g, '');

            let badgeStatus = '';
            if (appt.status === 'confirmado') {
                badgeStatus = '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle me-1"></i>Confirmado</span>';
            } else if (appt.status === 'pendiente') {
                badgeStatus = '<span class="badge bg-warning-subtle text-warning border border-warning-subtle"><i class="bi bi-hourglass-split me-1"></i>Pendiente</span>';
            } else if (appt.status === 'atendido') {
                badgeStatus = '<span class="badge bg-info-subtle text-info border border-info-subtle"><i class="bi bi-clipboard2-check me-1"></i>Atendido</span>';
            } else {
                badgeStatus = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle"><i class="bi bi-x-circle me-1"></i>Cancelado</span>';
            }

            const isCancelled = appt.status === 'cancelado';

            html += `
                <tr class="${isCancelled ? 'opacity-50 table-light' : ''}">
                    <td>
                        <div class="fw-bold fs-6"><i class="bi bi-clock me-1 text-primary"></i>${esc(appt.time)} hs</div>
                        <div class="small text-muted">${esc(appt.date)}</div>
                    </td>
                    <td>
                        <div class="fw-semibold text-primary">${esc(prof.name)}</div>
                        <span class="badge bg-light text-dark border small">${esc(prof.consultorio || 'Box')}</span>
                    </td>
                    <td>
                        <div class="fw-bold">${esc(appt.patientName)}</div>
                        <div class="small text-muted">${esc(appt.patientEmail)}</div>
                        ${appt.patientPhone ? `<div class="small text-muted"><i class="bi bi-telephone me-1"></i>${esc(appt.patientPhone)}</div>` : ''}
                    </td>
                    <td>
                        <span class="small fw-semibold text-dark">${esc(appt.reason)}</span>
                    </td>
                    <td>
                        <div class="mb-1">${badgeStatus}</div>
                        ${!isCancelled ? `
                            <select class="form-select form-select-sm" style="font-size: 0.75rem;" 
                                    onchange="window.secretaryModule.changeAppointmentStatus('${appt.id}', this.value)">
                                <option value="confirmado" ${appt.status === 'confirmado' ? 'selected' : ''}>Confirmar</option>
                                <option value="pendiente" ${appt.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="atendido" ${appt.status === 'atendido' ? 'selected' : ''}>Marcar Atendido</option>
                            </select>
                        ` : ''}
                    </td>
                    <td class="text-end">
                        <div class="d-inline-flex gap-1">
                            ${appt.patientPhone && !isCancelled ? `
                                <a href="${window.formatWhatsAppUrl(appt.patientPhone, this.generateSecretaryReminder(appt, prof))}" 
                                   target="_blank" 
                                   class="btn btn-sm btn-success d-inline-flex align-items-center gap-1 shadow-sm"
                                   title="Enviar Recordatorio de Turno por WhatsApp">
                                    <i class="bi bi-whatsapp"></i>
                                    <span class="d-none d-md-inline">WhatsApp</span>
                                </a>
                            ` : ''}
                            ${!isCancelled ? `
                                <button class="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1" 
                                        onclick="window.secretaryModule.cancelAppointment('${appt.id}')"
                                        title="Cancelar Turno">
                                    <i class="bi bi-x-circle"></i>
                                    <span class="d-none d-md-inline">Cancelar</span>
                                </button>
                            ` : '<span class="badge bg-secondary-subtle text-muted">Cancelado</span>'}
                        </div>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
    }

    changeAppointmentStatus(id, newStatus) {
        window.storageService.updateAppointmentStatus(id, newStatus, `Modificado desde Secretaría.`);
        window.showToast(`Estado del turno actualizado a: ${newStatus.toUpperCase()}`, 'info');
        this.renderDailyDashboard();
        this.renderProfessionalsCardsGrid();
        if (window.professionalModule) window.professionalModule.renderAppointmentsList();
        if (window.patientModule) window.patientModule.renderMyTurnos();
    }

    cancelAppointment(id) {
        const appt = window.storageService.getAppointments().find(a => a.id === id);
        if (!appt) return;

        if (!confirm(`¿Confirma que desea cancelar el turno de ${appt.patientName} con ${appt.professionalName || 'el odontólogo'} el día ${appt.date} a las ${appt.time} hs?`)) {
            return;
        }

        window.storageService.updateAppointmentStatus(id, 'cancelado', 'Cancelado directamente por Secretaría / Recepción.');
        window.showToast('El turno fue cancelado y registrado en la auditoría.', 'warning');

        this.renderDailyDashboard();
        this.renderProfessionalsCardsGrid();
        if (window.professionalModule) window.professionalModule.renderAppointmentsList();
        if (window.patientModule) {
            window.patientModule.renderMyTurnos();
            window.patientModule.renderAvailableSlots();
        }
    }

    // ==========================================
    // AGENDAR NUEVO TURNO DESDE SECRETARÍA
    // ==========================================
    openNewBookingModal(profId = '') {
        const user = window.authService?.currentUser;
        if (user && user.role === 'profesional') {
            window.showToast('Los profesionales no pueden agendar turnos. Solo pacientes, secretaría y administradores tienen acceso a la reserva.', 'warning');
            return;
        }

        const modalEl = document.getElementById('modalSecretaryNewBooking');
        if (!modalEl) return;

        const profSelect = document.getElementById('secModalBookingProf');
        const dateInput = document.getElementById('secModalBookingDate');
        const professionals = window.storageService.getProfessionals();

        if (profSelect) {
            profSelect.innerHTML = professionals.map(p => 
                `<option value="${p.id}" ${(profId === p.id || (!profId && p.id === professionals[0].id)) ? 'selected' : ''}>
                    ${p.name} - ${p.specialty} (${p.consultorio || 'Box'})
                </option>`
            ).join('');
        }

        const selectedProf = profId || (professionals[0] ? professionals[0].id : '');

        if (dateInput) {
            dateInput.min = this.getTodayDateString();
            dateInput.value = this.getTomorrowDateString();
        }

        this.onSecretaryModalProfChange(selectedProf);

        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
    }

    onSecretaryModalProfChange(profId) {
        const prof = window.storageService.getProfessionalById(profId);
        const reasonSelect = document.getElementById('secModalBookingReason');
        if (reasonSelect && prof) {
            const reasons = prof.reasons || ['Consulta Odontológica General'];
            reasonSelect.innerHTML = reasons.map(r => `<option value="${r}">${r}</option>`).join('');
        }
        this.updateSecretaryBookingSlots();
    }

    updateSecretaryBookingSlots() {
        const profSelect = document.getElementById('secModalBookingProf');
        const dateInput = document.getElementById('secModalBookingDate');
        const timeSelect = document.getElementById('secModalBookingTime');
        const durationBadge = document.getElementById('secModalBookingDurationBadge');

        if (!profSelect || !dateInput || !timeSelect) return;

        const profId = profSelect.value;
        const date = dateInput.value;
        const prof = window.storageService.getProfessionalById(profId);

        if (durationBadge && prof) {
            durationBadge.textContent = `Turnos de ${prof.slotDuration || 30} min`;
        }

        if (!profId || !date) {
            timeSelect.innerHTML = '<option value="" disabled selected>Seleccione profesional y fecha primero</option>';
            return;
        }

        const slotInfo = window.storageService.getAvailableSlots(date, profId);

        if (!slotInfo.available || !slotInfo.slots || slotInfo.slots.length === 0) {
            timeSelect.innerHTML = `<option value="" disabled selected>${slotInfo.reason || 'Sin horarios disponibles'}</option>`;
            return;
        }

        timeSelect.innerHTML = slotInfo.slots.map(s => 
            `<option value="${s.time}">${s.time} hs (Disponible)</option>`
        ).join('');
    }

    handleSecretaryBookingSubmit() {
        const profId = document.getElementById('secModalBookingProf')?.value;
        const reason = document.getElementById('secModalBookingReason')?.value;
        const date = document.getElementById('secModalBookingDate')?.value;
        const time = document.getElementById('secModalBookingTime')?.value;
        const patientName = document.getElementById('secModalBookingPatientName')?.value?.trim();
        const patientEmail = document.getElementById('secModalBookingPatientEmail')?.value?.trim();
        const rawSecPhone = document.getElementById('secModalBookingPatientPhone')?.value?.trim() || '';
        const patientPhone = window.stripCountryCode ? window.stripCountryCode(rawSecPhone) : rawSecPhone;

        if (!profId || !reason || !date || !time || !patientName || !patientEmail) {
            window.showToast('Por favor complete todos los datos obligatorios.', 'warning');
            return;
        }

        if (date < this.getTodayDateString()) {
            window.showToast('No es posible agendar turnos para fechas pasadas.', 'warning');
            return;
        }

        // Restricción de re-agenda si ya canceló con el mismo profesional en la misma fecha
        if (window.storageService.hasPatientCancelledOnDateWithProf(null, patientEmail, profId, date)) {
            const prof = window.storageService.getProfessionalById(profId);
            const profName = prof ? prof.name : 'este profesional';
            window.showToast(`El paciente canceló previamente un turno con ${profName} para el ${date}. Las políticas de la clínica impiden re-agendar con el mismo profesional en la misma fecha.`, 'warning');
            return;
        }

        try {
            const appt = window.storageService.createAppointment({
                professionalId: profId,
                patientName,
                patientEmail,
                patientPhone,
                date,
                time,
                reason
            });

            window.showToast(`¡Turno agendado con éxito para ${appt.patientName}!`, 'success');

            // Cerrar modal de forma segura
            const modalEl = document.getElementById('modalSecretaryNewBooking');
            if (modalEl) {
                const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
                if (bsModal) bsModal.hide();
            }

            // Limpieza de backdrop
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');

            // Limpiar campos del form
            document.getElementById('secModalBookingPatientName').value = '';
            document.getElementById('secModalBookingPatientEmail').value = '';
            if (document.getElementById('secModalBookingPatientPhone')) document.getElementById('secModalBookingPatientPhone').value = '';

            // Refrescar vistas
            this.renderDailyDashboard();
            this.renderProfessionalsCardsGrid();
            if (window.professionalModule) window.professionalModule.renderAppointmentsList();
            if (window.patientModule) {
                window.patientModule.renderMyTurnos();
                window.patientModule.renderAvailableSlots();
            }

        } catch (error) {
            window.showToast(error.message, 'danger');
        }
    }

    generateSecretaryReminder(appt, prof) {
        const settings = window.storageService.getSettings();
        const msg = `Hola ${appt.patientName}! Te contactamos desde la secretaría de ${settings.clinicName} para recordarte tu turno odontológico del día ${appt.date} a las ${appt.time} hs con ${prof.name} (${prof.consultorio || 'Consultorio Central'}). Dirección: ${settings.address}. Por favor confirmanos si asistirás. ¡Muchas gracias!`;
        return encodeURIComponent(msg);
    }
}

window.secretaryModule = new SecretaryModule();
