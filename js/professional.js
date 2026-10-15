/**
 * PROFESSIONAL MODULE - Panel de Odontólogos/as
 * Permite configurar:
 * 1. Sus propios motivos de consulta personalizados.
 * 2. El tiempo de duración de sus turnos (15, 30, 45 o 60 minutos).
 * 3. Sus días y horarios fijos semanales.
 * 4. Sus días no laborables o vacaciones.
 * 5. Gestión de su agenda de pacientes.
 */

class ProfessionalModule {
    constructor() {
        this.currentProfId = 'prof_1';
        this.filterPeriod = 'all';
        this.filterStatus = 'all';
        this.filterDate = '';
        this.dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        this.appointmentToCancelId = null;
    }

    init() {
        this.detectCurrentProfessional();
        this.renderScheduleConfigForm();
        this.renderReasonsAndDurationConfig();
        this.renderBlockedDatesList();
        this.updateFilterButtonsActive();
        this.renderAppointmentsList();
        this.renderStats();
        this.setupEventListeners();
    }

    detectCurrentProfessional() {
        const user = window.authService.currentUser;
        if (user && user.role === 'profesional') {
            const prof = window.storageService.getProfessionalByEmail(user.email);
            if (prof) {
                this.currentProfId = prof.id;
            } else if (user.professionalId) {
                this.currentProfId = user.professionalId;
            }
        }
        
        const prof = window.storageService.getProfessionalById(this.currentProfId);
        if (prof) {
            const avatarEl = document.getElementById('profPanelDoctorAvatar');
            const nameEl = document.getElementById('profPanelCurrentDoctorName');
            const specialtyEl = document.getElementById('profPanelSpecialtyText');
            const consultorioEl = document.getElementById('profPanelConsultorioBadge');
            const durationEl = document.getElementById('profPanelDurationText');
            const emailEl = document.getElementById('profPanelEmailText');

            if (avatarEl) avatarEl.src = prof.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}`;
            if (nameEl) nameEl.textContent = prof.name;
            if (specialtyEl) specialtyEl.textContent = prof.specialty;
            if (consultorioEl) consultorioEl.textContent = prof.consultorio || 'Box Odontológico';
            if (durationEl) durationEl.textContent = `${prof.slotDuration || 30} min`;
            if (emailEl) emailEl.textContent = prof.email;
            const phoneEl = document.getElementById('profPanelPhoneText');
            if (phoneEl) {
                const cleanPhone = window.stripCountryCode ? window.stripCountryCode(prof.phone) : (prof.phone || '');
                phoneEl.textContent = cleanPhone || 'Sin registrar';
            }
        }

        // CONTROL DE ACCESO AL SELECTOR:
        // Solo la secretaría o el administrador pueden ver el selector para cambiar de profesional (Modo Supervisor).
        // Los profesionales quedan restringidos exclusivamente a su propia agenda sin selector.
        const selectorContainer = document.getElementById('profDoctorSelectorContainer');
        if (selectorContainer) {
            if (user && (user.role === 'admin' || user.role === 'secretaria')) {
                selectorContainer.classList.remove('d-none');
            } else {
                selectorContainer.classList.add('d-none');
            }
        }

        const doctorSelect = document.getElementById('profDoctorSelector');
        if (doctorSelect) {
            const profs = window.storageService.getProfessionals();
            doctorSelect.innerHTML = profs.map(p => `<option value="${p.id}" ${p.id === this.currentProfId ? 'selected' : ''}>${p.name} (${p.specialty} - ${p.consultorio || 'Box'})</option>`).join('');
            doctorSelect.value = this.currentProfId;
        }
    }

    setProfessional(profId) {
        const user = window.authService.currentUser;
        // Si el usuario autenticado es un profesional, se bloquea el cambio a otros médicos
        if (user && user.role === 'profesional') {
            const ownProf = window.storageService.getProfessionalByEmail(user.email);
            if (ownProf) {
                this.currentProfId = ownProf.id;
            } else if (user.professionalId) {
                this.currentProfId = user.professionalId;
            }
        } else {
            this.currentProfId = profId;
        }

        this.detectCurrentProfessional();
        this.renderScheduleConfigForm();
        this.renderReasonsAndDurationConfig();
        this.renderBlockedDatesList();
        this.renderAppointmentsList();
        this.renderStats();
    }

    setupEventListeners() {
        // Formulario de horarios semanales
        const formSchedule = document.getElementById('formWeeklySchedule');
        if (formSchedule) {
            formSchedule.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveScheduleFromForm();
            });
        }

        // Formulario de agregar motivo de consulta
        const formAddReason = document.getElementById('formAddCustomReason');
        if (formAddReason) {
            formAddReason.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddReason();
            });
        }

        // Formulario de guardar duración y motivos con protección anti-doble clic
        const btnSaveReasonsDuration = document.getElementById('btnSaveReasonsAndDuration');
        if (btnSaveReasonsDuration) {
            btnSaveReasonsDuration.addEventListener('click', () => {
                btnSaveReasonsDuration.disabled = true;
                this.saveReasonsAndDuration();
                setTimeout(() => {
                    btnSaveReasonsDuration.disabled = false;
                }, 400);
            });
        }

        // Pestañas internas del panel profesional: actualizar la vista al hacer clic
        const profSubTabs = document.getElementById('profSubTabs');
        if (profSubTabs) {
            profSubTabs.addEventListener('shown.bs.tab', (e) => {
                if (typeof window.dismissActiveToasts === 'function') {
                    window.dismissActiveToasts();
                }
                const target = e.target.getAttribute('data-bs-target');
                if (target === '#profAgendaPane') {
                    this.renderAppointmentsList();
                    this.renderStats();
                } else if (target === '#profReasonsPane') {
                    this.renderReasonsAndDurationConfig();
                } else if (target === '#profSchedulePane') {
                    this.renderScheduleConfigForm();
                    this.renderBlockedDatesList();
                }
            });
        }

        // Formulario de bloqueo de fechas
        const formBlocked = document.getElementById('formAddBlockedDate');
        if (formBlocked) {
            formBlocked.addEventListener('submit', (e) => {
                e.preventDefault();
                const dateInput = document.getElementById('blockedDateInput');
                const reasonInput = document.getElementById('blockedReasonInput');
                if (dateInput && dateInput.value) {
                    window.storageService.addProfessionalBlockedDate(
                        this.currentProfId, 
                        dateInput.value, 
                        reasonInput ? reasonInput.value : ''
                    );
                    window.showToast('Fecha no laborable agregada con éxito.', 'success');
                    dateInput.value = '';
                    if (reasonInput) reasonInput.value = '';
                    this.renderBlockedDatesList();
                    if (window.patientModule) window.patientModule.renderAvailableSlots();
                }
            });
        }

        // Filtro de fecha en lista de turnos
        const dateFilterInput = document.getElementById('profFilterDate');
        if (dateFilterInput) {
            dateFilterInput.addEventListener('change', (e) => {
                this.filterDate = e.target.value;
                this.filterPeriod = 'custom';
                this.updateFilterButtonsActive();
                this.renderAppointmentsList();
            });
        }

        // Filtro de estado
        const statusFilterSelect = document.getElementById('profFilterStatus');
        if (statusFilterSelect) {
            statusFilterSelect.addEventListener('change', (e) => {
                this.filterStatus = e.target.value;
                this.renderAppointmentsList();
            });
        }
    }

    // ==========================================
    // MOTIVOS DE CONSULTA Y TIEMPOS (15, 30, 45, 60 MIN)
    // ==========================================
    renderReasonsAndDurationConfig() {
        const prof = window.storageService.getProfessionalById(this.currentProfId);
        if (!prof) return;

        // 1. Selector de duración de consulta
        const durationSelect = document.getElementById('profConfigDurationSelect');
        if (durationSelect) {
            durationSelect.value = String(prof.slotDuration || 30);
        }

        // 2. Lista de motivos de consulta personalizados
        const container = document.getElementById('profReasonsListContainer');
        if (!container) return;

        const reasons = prof.reasons || [];
        if (reasons.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning py-2 small mb-0">
                    No tiene motivos de consulta cargados. Los pacientes necesitan elegir al menos un motivo para reservar.
                </div>
            `;
            return;
        }

        let html = '<div class="list-group shadow-sm">';
        reasons.forEach((r, idx) => {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-check2-circle text-primary"></i>
                        <span class="fw-semibold">${r}</span>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" 
                            title="Eliminar motivo" 
                            onclick="window.professionalModule.deleteReason(${idx})">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    handleAddReason() {
        const input = document.getElementById('newReasonInput');
        if (!input || !input.value.trim()) return;

        const newReasonText = input.value.trim();
        const prof = window.storageService.getProfessionalById(this.currentProfId);
        if (!prof.reasons) prof.reasons = [];

        if (prof.reasons.includes(newReasonText)) {
            window.showToast('Este motivo de consulta ya existe en su lista.', 'warning');
            return;
        }

        prof.reasons.push(newReasonText);
        window.storageService.saveProfessionalConfig(this.currentProfId, { reasons: prof.reasons });

        input.value = '';
        this.renderReasonsAndDurationConfig();
        window.showToast('Motivo de consulta añadido.', 'success');

        if (window.patientModule) window.patientModule.renderProfessionalsSelect();
    }

    deleteReason(index) {
        const prof = window.storageService.getProfessionalById(this.currentProfId);
        if (!prof || !prof.reasons) return;

        if (prof.reasons.length <= 1) {
            window.showToast('Debe conservar al menos un motivo de consulta activo.', 'warning');
            return;
        }

        prof.reasons.splice(index, 1);
        window.storageService.saveProfessionalConfig(this.currentProfId, { reasons: prof.reasons });
        this.renderReasonsAndDurationConfig();
        window.showToast('Motivo de consulta eliminado.', 'info');

        if (window.patientModule) window.patientModule.renderProfessionalsSelect();
    }

    saveReasonsAndDuration() {
        const durationSelect = document.getElementById('profConfigDurationSelect');
        const duration = durationSelect ? parseInt(durationSelect.value, 10) : 30;

        window.storageService.saveProfessionalConfig(this.currentProfId, { slotDuration: duration });

        // Actualizar de inmediato la ficha cabecera y estadísticas del profesional
        this.detectCurrentProfessional();
        this.renderStats();

        // Mostrar solo 1 notificación emergente
        window.showToast(`Duración configurada a ${duration} minutos por turno.`, 'success');

        // Sincronizar módulos de paciente y secretaría en tiempo real
        if (window.patientModule) {
            if (typeof window.patientModule.renderSpecialistsCarousel === 'function') {
                window.patientModule.renderSpecialistsCarousel();
            }
            if (typeof window.patientModule.renderProfessionalsSelect === 'function') {
                window.patientModule.renderProfessionalsSelect();
            }
            if (window.patientModule.selectedProfId === this.currentProfId && typeof window.patientModule.updateDoctorCard === 'function') {
                const updatedProf = window.storageService.getProfessionalById(this.currentProfId);
                if (updatedProf) window.patientModule.updateDoctorCard(updatedProf);
            }
            if (typeof window.patientModule.renderAvailableSlots === 'function') {
                window.patientModule.renderAvailableSlots();
            }
        }
        if (window.secretaryModule) {
            if (typeof window.secretaryModule.renderProfessionalsCardsGrid === 'function') {
                window.secretaryModule.renderProfessionalsCardsGrid();
            }
            if (typeof window.secretaryModule.renderProfessionalsFilter === 'function') {
                window.secretaryModule.renderProfessionalsFilter();
            }
        }
    }

    // ==========================================
    // CONFIGURACIÓN DE HORARIOS SEMANALES FIJOS
    // ==========================================
    renderScheduleConfigForm() {
        const container = document.getElementById('weeklyScheduleContainer');
        if (!container) return;

        const prof = window.storageService.getProfessionalById(this.currentProfId);
        if (!prof) return;

        const schedule = prof.schedule || {};

        let html = '';
        const daysOrder = [1, 2, 3, 4, 5, 6, 0];

        daysOrder.forEach(dayIndex => {
            const dayName = this.dayNames[dayIndex];
            const dayData = schedule[dayIndex] || { enabled: false, shifts: [] };
            const isEnabled = dayData.enabled;

            const shift1 = dayData.shifts && dayData.shifts[0] ? dayData.shifts[0] : { start: '09:00', end: '13:00' };
            const shift2 = dayData.shifts && dayData.shifts[1] ? dayData.shifts[1] : null;
            const hasShift2 = !!shift2;

            html += `
                <div class="card mb-3 border schedule-day-card ${isEnabled ? 'border-primary-subtle bg-white' : 'bg-light border-0'}">
                    <div class="card-body py-3">
                        <div class="row align-items-center g-3">
                            <div class="col-12 col-md-3">
                                <div class="form-check form-switch fs-5">
                                    <input class="form-check-input" type="checkbox" id="dayToggle_${dayIndex}" 
                                           ${isEnabled ? 'checked' : ''} 
                                           onchange="window.professionalModule.toggleDayEnabled(${dayIndex}, this.checked)">
                                    <label class="form-check-label fw-bold ${isEnabled ? 'text-primary' : 'text-muted'}" for="dayToggle_${dayIndex}">
                                        ${dayName}
                                    </label>
                                </div>
                                <span class="badge ${isEnabled ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} small">
                                    ${isEnabled ? 'Atención activa' : 'No atiende'}
                                </span>
                            </div>

                            <div class="col-12 col-md-9 ${!isEnabled ? 'd-none' : ''}" id="dayControls_${dayIndex}">
                                <!-- Franja 1 -->
                                <div class="row g-2 align-items-center mb-2">
                                    <div class="col-auto">
                                        <span class="badge bg-primary text-white"><i class="bi bi-sun me-1"></i>Franja 1</span>
                                    </div>
                                    <div class="col-auto">
                                        <label class="small text-muted me-1">Desde:</label>
                                        <input type="time" class="form-control form-control-sm d-inline-block w-auto" 
                                               id="shift1_start_${dayIndex}" value="${shift1.start}">
                                    </div>
                                    <div class="col-auto">
                                        <label class="small text-muted me-1">Hasta:</label>
                                        <input type="time" class="form-control form-control-sm d-inline-block w-auto" 
                                               id="shift1_end_${dayIndex}" value="${shift1.end}">
                                    </div>
                                </div>

                                <!-- Franja 2 -->
                                <div class="row g-2 align-items-center">
                                    <div class="col-auto">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="shift2_enable_${dayIndex}" 
                                                   ${hasShift2 ? 'checked' : ''} 
                                                   onchange="window.professionalModule.toggleShift2(${dayIndex}, this.checked)">
                                            <label class="form-check-label small fw-semibold text-secondary" for="shift2_enable_${dayIndex}">
                                                <i class="bi bi-moon-stars me-1"></i>Franja 2 (Tarde)
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-auto ${!hasShift2 ? 'd-none' : ''}" id="shift2_inputs_${dayIndex}">
                                        <label class="small text-muted me-1">Desde:</label>
                                        <input type="time" class="form-control form-control-sm d-inline-block w-auto" 
                                               id="shift2_start_${dayIndex}" value="${shift2 ? shift2.start : '15:00'}">
                                        <label class="small text-muted ms-2 me-1">Hasta:</label>
                                        <input type="time" class="form-control form-control-sm d-inline-block w-auto" 
                                               id="shift2_end_${dayIndex}" value="${shift2 ? shift2.end : '19:00'}">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    toggleDayEnabled(dayIndex, isChecked) {
        const controls = document.getElementById(`dayControls_${dayIndex}`);
        if (controls) {
            controls.classList.toggle('d-none', !isChecked);
        }
    }

    toggleShift2(dayIndex, isChecked) {
        const inputs = document.getElementById(`shift2_inputs_${dayIndex}`);
        if (inputs) {
            inputs.classList.toggle('d-none', !isChecked);
        }
    }

    saveScheduleFromForm() {
        const newSchedule = {};
        const daysOrder = [0, 1, 2, 3, 4, 5, 6];

        daysOrder.forEach(dayIndex => {
            const toggle = document.getElementById(`dayToggle_${dayIndex}`);
            const isEnabled = toggle ? toggle.checked : false;
            const shifts = [];

            if (isEnabled) {
                const s1Start = document.getElementById(`shift1_start_${dayIndex}`)?.value || '09:00';
                const s1End = document.getElementById(`shift1_end_${dayIndex}`)?.value || '13:00';
                shifts.push({ start: s1Start, end: s1End });

                const s2Toggle = document.getElementById(`shift2_enable_${dayIndex}`);
                if (s2Toggle && s2Toggle.checked) {
                    const s2Start = document.getElementById(`shift2_start_${dayIndex}`)?.value || '15:00';
                    const s2End = document.getElementById(`shift2_end_${dayIndex}`)?.value || '19:00';
                    shifts.push({ start: s2Start, end: s2End });
                }
            }

            newSchedule[dayIndex] = {
                enabled: isEnabled,
                shifts: shifts
            };
        });

        window.storageService.saveProfessionalConfig(this.currentProfId, { schedule: newSchedule });
        window.showToast('¡Horarios fijos semanales guardados exitosamente!', 'success');

        if (window.patientModule) window.patientModule.renderAvailableSlots();
        if (window.secretaryModule) window.secretaryModule.renderDailyDashboard();
    }

    // ==========================================
    // DÍAS BLOQUEADOS
    // ==========================================
    renderBlockedDatesList() {
        const container = document.getElementById('blockedDatesList');
        if (!container) return;

        const prof = window.storageService.getProfessionalById(this.currentProfId);
        const list = (prof && prof.blockedDates) ? prof.blockedDates : [];

        if (list.length === 0) {
            container.innerHTML = `
                <div class="text-muted small text-center py-2">
                    <i class="bi bi-calendar-check me-1"></i> No tiene fechas no laborables registradas.
                </div>
            `;
            return;
        }

        let html = '<div class="list-group list-group-flush">';
        list.forEach(item => {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                    <div>
                        <strong class="text-danger"><i class="bi bi-calendar-x me-1"></i>${item.date}</strong>
                        <div class="text-muted small">${item.reason || 'Día no laboral'}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.professionalModule.removeBlockedDate('${item.date}')" title="Desbloquear fecha">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    removeBlockedDate(dateStr) {
        window.storageService.removeProfessionalBlockedDate(this.currentProfId, dateStr);
        window.showToast(`Fecha ${dateStr} desbloqueada.`, 'info');
        this.renderBlockedDatesList();
        if (window.patientModule) window.patientModule.renderAvailableSlots();
    }

    // ==========================================
    // AGENDA DEL PROFESIONAL
    // ==========================================
    setFilterPeriod(period) {
        this.filterPeriod = period;
        this.filterDate = '';
        const dateInput = document.getElementById('profFilterDate');
        if (dateInput) dateInput.value = '';

        this.updateFilterButtonsActive();
        this.renderAppointmentsList();
    }

    updateFilterButtonsActive() {
        ['today', 'week', 'all'].forEach(p => {
            const btn = document.getElementById(`btnFilter_${p}`);
            if (btn) {
                if (this.filterPeriod === p) {
                    btn.classList.add('btn-primary');
                    btn.classList.remove('btn-outline-primary');
                } else {
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline-primary');
                }
            }
        });
    }

    renderAppointmentsList() {
        const container = document.getElementById('profAppointmentsContainer');
        if (!container) return;

        const all = window.storageService.getAppointments();
        const todayStr = new Date().toISOString().split('T')[0];

        let filtered = all.filter(a => a.professionalId === this.currentProfId);

        if (this.filterPeriod === 'today') {
            filtered = filtered.filter(a => a.date === todayStr);
        } else if (this.filterPeriod === 'week') {
            const now = new Date();
            filtered = filtered.filter(a => {
                const apptDate = new Date(a.date + 'T00:00:00');
                const diffTime = apptDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= -1 && diffDays <= 7;
            });
        } else if (this.filterPeriod === 'custom' && this.filterDate) {
            filtered = filtered.filter(a => a.date === this.filterDate);
        }

        if (this.filterStatus !== 'all') {
            filtered = filtered.filter(a => a.status === this.filterStatus);
        }

        filtered.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-calendar-check text-muted display-4"></i>
                    <h5 class="mt-3">No hay turnos registrados para este criterio</h5>
                    <p class="text-muted small">Consulte turnos de otras fechas o verifique sus horarios.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="table-responsive"><table class="table table-hover align-middle mb-0">';
        html += `
            <thead class="table-light">
                <tr>
                    <th>Fecha & Horario</th>
                    <th>Paciente</th>
                    <th>Motivo de Consulta</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                    <th class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody>
        `;

        filtered.forEach(appt => {
            let statusBadge = '';
            if (appt.status === 'confirmado') {
                statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle me-1"></i>Confirmado</span>';
            } else if (appt.status === 'atendido') {
                statusBadge = '<span class="badge bg-info-subtle text-info border border-info-subtle"><i class="bi bi-clipboard2-check me-1"></i>Atendido</span>';
            } else {
                statusBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="bi bi-x-circle me-1"></i>Cancelado</span>';
            }

            html += `
                <tr class="${appt.status === 'cancelado' ? 'opacity-50' : ''}">
                    <td>
                        <div class="fw-bold">${appt.date}</div>
                        <span class="badge bg-light text-primary border"><i class="bi bi-clock me-1"></i>${appt.time} hs</span>
                    </td>
                    <td>
                        <div class="fw-bold">${appt.patientName}</div>
                        <div class="text-muted small">${appt.patientEmail}</div>
                    </td>
                    <td>
                        <span class="fw-semibold text-dark">${window.escapeHTML(appt.reason)}</span>
                    </td>
                    <td>
                        ${appt.patientPhone ? `
                            <div class="small fw-semibold mb-1 text-nowrap"><i class="bi bi-telephone text-muted me-1"></i>${window.escapeHTML(appt.patientPhone)}</div>
                            <div class="dropdown d-inline-block">
                                <button class="btn btn-sm btn-outline-success dropdown-toggle py-0 px-2 rounded-pill small fw-semibold" 
                                        type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-whatsapp me-1"></i> WhatsApp
                                </button>
                                <ul class="dropdown-menu dropdown-menu-start shadow-sm border-0 small">
                                    <li>
                                        <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="${this.generateWhatsAppReminderUrl(appt)}" target="_blank">
                                            <i class="bi bi-alarm text-primary fs-5"></i>
                                            <div>
                                                <div class="fw-bold">Recordar Turno</div>
                                                <small class="text-muted">Recordatorio con fecha, horario y consultorio</small>
                                            </div>
                                        </a>
                                    </li>
                                    <li><hr class="dropdown-divider my-1"></li>
                                    <li>
                                        <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="${this.generateWhatsAppConfirmationUrl(appt)}" target="_blank">
                                            <i class="bi bi-patch-check text-success fs-5"></i>
                                            <div>
                                                <div class="fw-bold">Pedir Confirmación de Asistencia</div>
                                                <small class="text-muted">Solicitar al paciente confirmar si asistirá</small>
                                            </div>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        ` : '<span class="text-muted small">Sin teléfono</span>'}
                    </td>
                    <td>${statusBadge}</td>
                    <td class="text-end">
                        <div class="btn-group btn-group-sm">
                            ${appt.status !== 'atendido' && appt.status !== 'cancelado' ? `
                                <button class="btn btn-outline-primary" title="Marcar Turno como Atendido" onclick="window.professionalModule.changeStatus('${appt.id}', 'atendido')">
                                    <i class="bi bi-clipboard2-check me-1"></i>Atendido
                                </button>
                                <button class="btn btn-outline-danger" title="Cancelar Turno" onclick="window.professionalModule.openCancelModal('${appt.id}')">
                                    <i class="bi bi-x-lg me-1"></i>Cancelar
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;

        this.renderStats();
    }

    generateWhatsAppReminderUrl(appt) {
        const settings = window.storageService.getSettings();
        const prof = window.storageService.getProfessionalById(this.currentProfId);
        const profPhone = (prof && prof.phone) ? `\n📱 *Teléfono de contacto:* ${prof.phone}` : '';
        const profName = (prof && prof.name) || 'su profesional';

        const msg = `🦷 *Centro Odontológico Sonrisas & Salud*\n\n` +
            `¡Hola ${appt.patientName}! Le recordamos su próximo turno odontológico con ${profName} (${(prof && prof.consultorio) || 'Consultorio'}):\n\n` +
            `📅 *Fecha:* ${appt.date}\n` +
            `⏰ *Horario:* ${appt.time} hs\n` +
            `📋 *Motivo:* ${appt.reason}\n` +
            `📍 *Dirección:* ${settings.address}${profPhone}\n\n` +
            `Le sugerimos asistir 10 minutos antes de su turno. ¡Lo/a esperamos!`;

        return window.formatWhatsAppUrl(appt.patientPhone, msg);
    }

    generateWhatsAppConfirmationUrl(appt) {
        const settings = window.storageService.getSettings();
        const prof = window.storageService.getProfessionalById(this.currentProfId);
        const profPhone = (prof && prof.phone) ? `\n📱 *WhatsApp del Profesional:* ${prof.phone}` : '';
        const profName = (prof && prof.name) || 'su profesional';

        const msg = `🦷 *Centro Odontológico Sonrisas & Salud* - Solicitud de Confirmación\n\n` +
            `¡Hola ${appt.patientName}! Nos comunicamos desde el consultorio de ${profName} para solicitar la *confirmación de su turno odontológico*:\n\n` +
            `📅 *Fecha:* ${appt.date}\n` +
            `⏰ *Horario:* ${appt.time} hs\n` +
            `📋 *Motivo:* ${appt.reason}\n` +
            `📍 *Lugar:* ${(prof && prof.consultorio) || 'Consultorio'} - ${settings.address}${profPhone}\n\n` +
            `👉 *Por favor responda a este mensaje indicando si asistirá:* \n` +
            `1️⃣ *SÍ, CONFIRMO MI ASISTENCIA*\n` +
            `2️⃣ *NO PUEDO ASISTIR* (avísenos para reprogramar o liberar su lugar)\n\n` +
            `¡Muchas gracias por su respuesta!`;

        return window.formatWhatsAppUrl(appt.patientPhone, msg);
    }

    generateWhatsAppMessage(appt) {
        return this.generateWhatsAppReminderUrl(appt);
    }

    // ==========================================
    // EDICIÓN DE PERFIL DEL PROFESIONAL
    // ==========================================
    openEditProfileModal() {
        const prof = window.storageService.getProfessionalById(this.currentProfId);
        if (!prof) return;

        const nameInput = document.getElementById('editProfName');
        const consultorioInput = document.getElementById('editProfConsultorio');
        const specialtySelect = document.getElementById('editProfSpecialty');
        const emailInput = document.getElementById('editProfEmail');
        const phoneInput = document.getElementById('editProfPhone');

        if (nameInput) nameInput.value = prof.name || '';
        if (consultorioInput) consultorioInput.value = prof.consultorio || '';
        if (emailInput) emailInput.value = prof.email || '';
        if (phoneInput) {
            phoneInput.value = window.stripCountryCode ? window.stripCountryCode(prof.phone) : (prof.phone || '');
        }

        if (specialtySelect) {
            const specialties = window.storageService.getSpecialties();
            if (prof.specialty && !specialties.includes(prof.specialty)) {
                specialties.push(prof.specialty);
            }
            specialtySelect.innerHTML = specialties.map(s => 
                `<option value="${window.escapeHTML(s)}" ${s === prof.specialty ? 'selected' : ''}>${window.escapeHTML(s)}</option>`
            ).join('');
        }

        const modalEl = document.getElementById('modalEditProfessionalProfile');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    }

    saveProfileData() {
        const nameInput = document.getElementById('editProfName');
        const consultorioInput = document.getElementById('editProfConsultorio');
        const specialtySelect = document.getElementById('editProfSpecialty');
        const emailInput = document.getElementById('editProfEmail');
        const phoneInput = document.getElementById('editProfPhone');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const consultorio = consultorioInput ? consultorioInput.value.trim() : '';
        const specialty = specialtySelect ? specialtySelect.value.trim() : '';
        let phone = phoneInput ? phoneInput.value.trim() : '';

        // Mantener el código de país (+54 9) oculto: sanitizar en caso de que se haya pegado con prefijo
        if (phone) {
            phone = window.stripCountryCode ? window.stripCountryCode(phone) : phone.replace(/^(\+?54\s*9|\+?54|0054\s*9|0054|54\s*9|549)\s*/i, '').trim();
        }

        if (!name) {
            window.showToast('Por favor ingrese el nombre del profesional.', 'warning');
            return;
        }
        if (!email || !email.includes('@')) {
            window.showToast('Por favor ingrese un correo electrónico válido.', 'warning');
            return;
        }
        if (!specialty) {
            window.showToast('Por favor seleccione una especialidad.', 'warning');
            return;
        }

        window.storageService.updateProfessionalProfile(this.currentProfId, {
            name,
            consultorio,
            specialty,
            email,
            phone
        });

        // 1. Cerrar el modal de formulario de edición
        const editModalEl = document.getElementById('modalEditProfessionalProfile');
        if (editModalEl && typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(editModalEl);
            if (modalInstance) modalInstance.hide();
        }

        // 2. Mostrar Popup de confirmación: "Cambios guardados"
        const savedModalEl = document.getElementById('modalProfileChangesSaved');
        if (savedModalEl && typeof bootstrap !== 'undefined') {
            const savedModal = bootstrap.Modal.getOrCreateInstance(savedModalEl);
            savedModal.show();
        } else {
            alert('¡Cambios guardados!');
        }

        // 3. Actualización automática de la página luego de un breve intervalo
        const timerFn = (typeof window !== 'undefined' && window.setTimeout) ? window.setTimeout : setTimeout;
        timerFn(() => {
            if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
                window.location.reload();
            }
        }, 1200);
    }

    changeStatus(id, newStatus) {
        window.storageService.updateAppointmentStatus(id, newStatus);
        window.showToast(`Estado actualizado a: ${newStatus}`, 'success');
        this.renderAppointmentsList();
        if (window.secretaryModule) window.secretaryModule.renderDailyDashboard();
        if (window.patientModule) window.patientModule.renderMyTurnos();
    }

    openCancelModal(id) {
        this.appointmentToCancelId = id;
        const appt = window.storageService.getAppointments().find(a => a.id === id);
        if (!appt) return;

        const patientNameEl = document.getElementById('profCancelPatientName');
        const dateTimeEl = document.getElementById('profCancelDateTime');
        const reasonBadgeEl = document.getElementById('profCancelApptReason');
        const reasonInput = document.getElementById('profCancelReasonInput');

        if (patientNameEl) patientNameEl.textContent = appt.patientName;
        if (dateTimeEl) dateTimeEl.textContent = `${appt.date} a las ${appt.time} hs`;
        if (reasonBadgeEl) reasonBadgeEl.textContent = appt.reason || 'Consulta Odontológica';
        if (reasonInput) reasonInput.value = '';

        const modalEl = document.getElementById('modalProfCancelAppointment');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
            modalInstance.show();
        }
    }

    confirmCancelAppointment() {
        if (!this.appointmentToCancelId) return;

        const reasonInput = document.getElementById('profCancelReasonInput');
        const reason = reasonInput ? reasonInput.value.trim() : '';

        window.storageService.updateAppointmentStatus(
            this.appointmentToCancelId,
            'cancelado',
            reason || 'Cancelado por el profesional'
        );

        const modalEl = document.getElementById('modalProfCancelAppointment');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }

        this.appointmentToCancelId = null;
        window.showToast('El turno ha sido cancelado.', 'warning');
        this.renderAppointmentsList();
        if (window.secretaryModule) window.secretaryModule.renderDailyDashboard();
        if (window.patientModule) {
            window.patientModule.renderMyTurnos();
            window.patientModule.renderAvailableSlots();
        }
    }

    promptCancel(id) {
        this.openCancelModal(id);
    }

    renderStats() {
        const all = window.storageService.getAppointments().filter(a => a.professionalId === this.currentProfId);
        const todayStr = new Date().toISOString().split('T')[0];

        const totalCount = all.filter(a => a.status !== 'cancelado').length;
        const todayCount = all.filter(a => a.date === todayStr && a.status !== 'cancelado').length;
        const canceledCount = all.filter(a => a.status === 'cancelado').length;
        const attendedTotal = all.filter(a => a.status === 'atendido').length;

        const elTotal = document.getElementById('statProfTotal');
        const elToday = document.getElementById('statProfToday');
        const elCanceled = document.getElementById('statProfCanceled') || document.getElementById('statProfPending');
        const elAttended = document.getElementById('statProfAttended');

        if (elTotal) elTotal.textContent = totalCount;
        if (elToday) elToday.textContent = todayCount;
        if (elCanceled) elCanceled.textContent = canceledCount;
        if (elAttended) elAttended.textContent = attendedTotal;
    }
}

window.professionalModule = new ProfessionalModule();
