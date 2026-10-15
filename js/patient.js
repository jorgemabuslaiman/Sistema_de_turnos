/**
 * PATIENT MODULE - Centro Odontológico
 * Intro con Carrusel automático de 5 profesionales, 2 botones de acción limpia
 * (Reservar y Cancelar), motivos de consulta dinámicos por profesional y cancelación directa.
 */

class PatientModule {
    constructor() {
        this.selectedProfId = '';
        this.selectedReason = '';
        this.selectedDate = this.getTomorrowDateString();
        this.selectedSlot = null;
        this.cancelSearchEmail = '';
        this.myTurnosSearchEmail = localStorage.getItem('dental_last_booking_email') || '';
        this.appointmentToCancelId = null;
        this.appointmentToModifyId = null;
        this.modifySelectedDate = '';
        this.modifySelectedSlot = null;
        this.modifySelectedReason = '';
        this.lastBookedAppointment = null;
        this.isSubmittingBooking = false;
        // Estado de Nuevo Turno desde Vista Profesional
        this.profBookingDoctor = null;
        this.profBookingSelectedPatient = null;
        this.profBookingSelectedSlot = null;
        // Filtros de navegación y UX en Mis Turnos
        this.myTurnosFilterTab = 'upcoming';
        this.expandedCardAdviceIds = new Set();
    }

    init() {
        this.renderCarouselProfessionals();
        this.renderProfessionalsSelect();
        this.setupEventListeners();
        this.renderAvailableSlots();
        this.updateBookingFlowForAuthState();
        this.renderMyTurnos();
        this.updateDateBadges();
    }

    renderBookingSection() {
        this.renderCarouselProfessionals();
        this.renderProfessionalsSelect();
        this.renderAvailableSlots();
        this.updateBookingFlowForAuthState();
        this.updateDateBadges();
    }

    updateBookingFlowForAuthState() {
        const currentUser = window.authService?.currentUser;
        const btnNextText = document.getElementById('btnStep1NextText');
        const step2Title = document.getElementById('step2CardTitleText');
        const stepperStep2Label = document.getElementById('stepperStep2Subtitle');
        const loggedInCard = document.getElementById('bookingLoggedInUserCard');
        const contactFields = document.getElementById('bookingContactFieldsContainer');

        if (currentUser) {
            if (btnNextText) btnNextText.textContent = 'Siguiente: Confirmar Turno';
            if (step2Title) step2Title.textContent = 'Paso 2: Confirme su Turno Odontológico';
            if (stepperStep2Label) stepperStep2Label.textContent = 'Confirmación Directa';
            if (contactFields) contactFields.classList.add('d-none');
            if (loggedInCard) {
                loggedInCard.classList.remove('d-none');
                const avatar = currentUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=198754&color=fff`;
                loggedInCard.innerHTML = `
                    <div class="card bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 p-3 shadow-sm">
                        <div class="d-flex align-items-center gap-3">
                            <img src="${avatar}" 
                                 class="rounded-circle border border-2 border-success shadow-sm" 
                                 width="52" height="52" 
                                 style="object-fit: cover; min-width: 52px;" 
                                 alt="${currentUser.name}">
                            <div class="flex-grow-1 overflow-hidden">
                                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                                    <h6 class="fw-bold text-dark mb-0 fs-5">${currentUser.name}</h6>
                                    <span class="badge bg-success text-white px-2 py-1">
                                        <i class="bi bi-person-check-fill me-1"></i>${window.authService.getRoleBadgeText(currentUser.role)}
                                    </span>
                                </div>
                                <div class="text-muted small mt-1">
                                    <i class="bi bi-envelope me-1 text-primary"></i>${currentUser.email}
                                    ${currentUser.phone ? ` &bull; <i class="bi bi-whatsapp text-success me-1"></i>${currentUser.phone}` : ''}
                                </div>
                                <div class="small text-success fw-semibold mt-1">
                                    <i class="bi bi-shield-check me-1"></i>Sus datos de contacto ya están registrados en su cuenta. No es necesario volver a completarlos.
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            if (btnNextText) btnNextText.textContent = 'Siguiente: Datos de Contacto';
            if (step2Title) step2Title.textContent = 'Paso 2: Complete sus Datos y Confirme el Turno';
            if (stepperStep2Label) stepperStep2Label.textContent = 'Datos y Confirmación';
            if (contactFields) contactFields.classList.remove('d-none');
            if (loggedInCard) {
                loggedInCard.classList.add('d-none');
                loggedInCard.innerHTML = '';
            }
        }
    }

    getTomorrowDateString() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }

    getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    }

    formatDateFriendly(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' });
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        const dayNum = d.getDate();
        const monthName = d.toLocaleDateString('es-ES', { month: 'long' });
        return `${capitalizedDay}, ${dayNum} de ${monthName}`;
    }

    updateDateBadges() {
        const badge1 = document.getElementById('bookingDateFriendlyBadge');
        if (badge1 && this.selectedDate) {
            badge1.innerHTML = `<i class="bi bi-calendar2-check me-1"></i>${this.formatDateFriendly(this.selectedDate)}`;
        }
        const badge2 = document.getElementById('modifyAppointmentDateBadge');
        if (badge2 && this.modifySelectedDate) {
            badge2.innerHTML = `<i class="bi bi-calendar2-check me-1"></i>${this.formatDateFriendly(this.modifySelectedDate)}`;
        }
    }

    // ==========================================
    // CARRUSEL AUTOMÁTICO DE LOS 5 PROFESIONALES (ADAPTADO BOOTSTRAP)
    // ==========================================
    renderCarouselProfessionals() {
        const carouselInner = document.getElementById('carouselProfessionalsInner');
        const indicators = document.getElementById('carouselProfessionalsIndicators');
        if (!carouselInner) return;

        const professionals = window.storageService.getProfessionals();

        let innerHtml = '';
        let indicatorsHtml = '';

        professionals.forEach((p, idx) => {
            const isActive = idx === 0 ? 'active' : '';
            indicatorsHtml += `
                <button type="button" data-bs-target="#carouselProfessionals" data-bs-slide-to="${idx}" class="${isActive}" aria-label="Profesional ${idx + 1}: ${p.name}"></button>
            `;

            innerHtml += `
                <div class="carousel-item ${isActive}" data-bs-interval="4500">
                    <div class="prof-slide-card rounded-5 overflow-hidden shadow-sm mx-auto bg-white border">
                        <div class="prof-slide-media position-relative">
                            <img src="${p.picture}" 
                                 class="prof-slide-img" 
                                 alt="${p.name}" 
                                 loading="${idx === 0 ? 'eager' : 'lazy'}"
                                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800';">
                            <span class="badge bg-primary position-absolute top-0 end-0 m-3 px-3 py-2 rounded-pill shadow-sm fw-semibold">
                                ${p.consultorio || 'Consultorio Central'}
                            </span>
                        </div>
                        <div class="prof-slide-info p-3 p-md-4 text-center bg-white">
                            <h3 class="fw-bold mb-1 text-primary">${p.name}</h3>
                            <p class="text-secondary mb-2 fw-medium">${p.specialty}</p>
                            <div class="d-flex align-items-center justify-content-center gap-2">
                                <span class="badge bg-light text-dark border px-3 py-1 small">
                                    <i class="bi bi-clock me-1 text-primary"></i>Turnos de ${p.slotDuration || 30} min
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        carouselInner.innerHTML = innerHtml;
        if (indicators) indicators.innerHTML = indicatorsHtml;

        // Refrescar o asegurar la instancia de Bootstrap Carousel
        const carouselEl = document.getElementById('carouselProfessionals');
        if (carouselEl && window.bootstrap && window.bootstrap.Carousel) {
            window.bootstrap.Carousel.getOrCreateInstance(carouselEl, {
                interval: 4500,
                ride: 'carousel',
                touch: true
            });
        }
    }

    quickSelectProfessional(profId) {
        if (window.app) window.app.showBookingView();
        this.handleProfessionalChange(profId);
        const bookingSection = document.getElementById('patientBookingSection');
        bookingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ==========================================
    // SELECTOR DE PROFESIONAL Y MOTIVOS DINÁMICOS
    // ==========================================
    renderProfessionalsSelect() {
        const select = document.getElementById('bookingProfSelect');
        if (!select) return;

        const professionals = window.storageService.getProfessionals();
        let html = `<option value="" disabled ${!this.selectedProfId ? 'selected' : ''}>-- Seleccione Profesional Odontólogo/a --</option>`;
        professionals.forEach(p => {
            html += `
                <option value="${p.id}" ${p.id === this.selectedProfId ? 'selected' : ''}>
                    ${p.name} - ${p.specialty} (${p.consultorio || 'Box Odontológico'})
                </option>
            `;
        });
        select.innerHTML = html;

        this.updateSelectedProfessionalBadge();
        this.renderReasonsForSelectedProfessional();
    }

    handleProfessionalChange(profId) {
        this.selectedProfId = profId;
        this.selectedSlot = null;
        this.selectedReason = '';

        // Limpiar estilos y mensajes de error del selector de profesional
        const select = document.getElementById('bookingProfSelect');
        if (select) {
            select.value = profId;
            select.classList.remove('is-invalid');
        }
        const errorEl = document.getElementById('error-bookingProfSelect');
        if (errorEl) {
            errorEl.classList.add('d-none');
            errorEl.style.display = 'none';
        }

        // Actualizar tarjeta con nombre, foto y duración de la consulta
        this.updateSelectedProfessionalBadge();

        // Actualizar motivos de consulta para este odontólogo
        this.renderReasonsForSelectedProfessional();

        // Actualizar horarios disponibles
        this.renderAvailableSlots();

        // Limpiar errores en slots si los hubiera
        const slotError = document.getElementById('error-bookingSlot');
        const slotsContainer = document.getElementById('availableSlotsContainer');
        if (slotsContainer) slotsContainer.classList.remove('border-danger', 'bg-danger-subtle');
        if (slotError) {
            slotError.classList.add('d-none');
            slotError.style.display = 'none';
        }

        if (window.accessibilityModule) {
            const prof = window.storageService.getProfessionalById(this.selectedProfId);
            if (prof) {
                window.accessibilityModule.speak(`Profesional seleccionado: ${prof.name}, ${prof.specialty}, duración de consulta ${prof.slotDuration || 30} minutos.`);
            }
        }
    }

    updateSelectedProfessionalBadge() {
        const cardEl = document.getElementById('selectedProfCard');
        if (!cardEl) return;

        if (!this.selectedProfId) {
            cardEl.innerHTML = `
                <div class="alert alert-secondary py-3 px-3 mb-0 small text-center text-muted border-dashed" role="status">
                    <i class="bi bi-person-badge fs-4 d-block text-secondary mb-1"></i>
                    <span>Seleccione un profesional odontólogo/a arriba para consultar su especialidad, consultorio y duración de turno.</span>
                </div>
            `;
            return;
        }

        const prof = window.storageService.getProfessionalById(this.selectedProfId);
        if (!prof) {
            cardEl.innerHTML = '';
            return;
        }

        cardEl.innerHTML = `
            <div class="card bg-white border border-primary-subtle shadow-sm p-3">
                <div class="d-flex align-items-center gap-3">
                    <img src="${prof.picture}" 
                         class="rounded-circle border border-2 border-primary shadow-sm" 
                         width="65" height="65" 
                         style="object-fit: cover; min-width: 65px;" 
                         alt="${prof.name}"
                         onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300';">
                    <div class="flex-grow-1">
                        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                            <h6 class="fw-bold text-primary mb-0 fs-5">${prof.name}</h6>
                            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-semibold">
                                <i class="bi bi-door-open me-1"></i>${prof.consultorio || 'Consultorio Odontológico'}
                            </span>
                        </div>
                        <div class="text-muted small mt-1">${prof.specialty}</div>
                        <div class="d-flex flex-wrap align-items-center gap-2 mt-2">
                            <span class="badge bg-primary text-white px-2 py-1">
                                <i class="bi bi-clock-history me-1"></i>Duración de Consulta: <strong>${prof.slotDuration || 30} minutos</strong>
                            </span>
                            <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                <i class="bi bi-check2-circle me-1"></i>Días y horarios configurados
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderReasonsForSelectedProfessional() {
        const selectReason = document.getElementById('bookingReasonSelect');
        if (!selectReason) return;

        if (!this.selectedProfId) {
            selectReason.innerHTML = '<option value="" disabled selected>-- Seleccione primero un profesional --</option>';
            this.selectedReason = '';
            return;
        }

        const prof = window.storageService.getProfessionalById(this.selectedProfId);
        const reasons = (prof && prof.reasons && prof.reasons.length > 0) 
            ? prof.reasons 
            : ['Consulta Odontológica General'];

        // Auto-seleccionar primer motivo por defecto para evitar validaciones fallidas innecesarias
        if (!this.selectedReason || !reasons.includes(this.selectedReason)) {
            this.selectedReason = reasons[0];
        }

        let html = '';
        reasons.forEach((r) => {
            html += `<option value="${r}" ${r === this.selectedReason ? 'selected' : ''}>${r}</option>`;
        });
        selectReason.innerHTML = html;
    }

    handleReasonChange(reason) {
        this.selectedReason = reason;
        const select = document.getElementById('bookingReasonSelect');
        if (select) select.classList.remove('is-invalid');
        const err = document.getElementById('error-bookingReasonSelect');
        if (err) {
            err.classList.add('d-none');
            err.style.display = 'none';
        }
    }

    handleDateChange(date) {
        this.selectedDate = date;
        this.selectedSlot = null;

        const dateInput = document.getElementById('bookingDateInput');
        if (dateInput) dateInput.classList.remove('is-invalid');
        const err = document.getElementById('error-bookingDateInput');
        if (err) {
            err.classList.add('d-none');
            err.style.display = 'none';
        }

        this.updateDateBadges();
        this.renderAvailableSlots();
    }

    handleInputClearError(inputEl, errorId) {
        if (inputEl) inputEl.classList.remove('is-invalid');
        const err = document.getElementById(errorId);
        if (err) {
            err.classList.add('d-none');
            err.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Selector de Profesional
        const profSelect = document.getElementById('bookingProfSelect');
        if (profSelect) {
            profSelect.addEventListener('change', (e) => {
                this.handleProfessionalChange(e.target.value);
            });
        }

        // Selector de Fecha
        const dateInput = document.getElementById('bookingDateInput');
        if (dateInput) {
            dateInput.min = this.getTodayDateString();
            dateInput.value = this.selectedDate;
            dateInput.addEventListener('change', (e) => {
                this.handleDateChange(e.target.value);
            });
        }

        // Selector de Motivo
        const reasonSelect = document.getElementById('bookingReasonSelect');
        if (reasonSelect) {
            reasonSelect.addEventListener('change', (e) => {
                this.handleReasonChange(e.target.value);
            });
        }

        // Búsqueda de turnos para cancelar
        const inputCancelEmail = document.getElementById('inputCancelSearchEmail');
        if (inputCancelEmail) {
            inputCancelEmail.addEventListener('input', (e) => {
                this.cancelSearchEmail = e.target.value.trim().toLowerCase();
                this.renderCancelAppointmentsList();
            });
        }

        // Limpieza garantizada de backdrop al cerrar el modal de éxito de turno y paso a Mis Turnos
        const successModalEl = document.getElementById('bookingSuccessModal');
        if (successModalEl) {
            successModalEl.addEventListener('hidden.bs.modal', () => {
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                document.body.classList.remove('modal-open');
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('padding-right');
                if (window.app) window.app.switchTab('misturnos-tab');
            });
        }

        // Botón de confirmación definitiva del modal de cancelación
        const btnConfirmCancel = document.getElementById('btnConfirmCancelPatientAppt');
        if (btnConfirmCancel) {
            btnConfirmCancel.addEventListener('click', () => {
                this.executePatientCancellation();
            });
        }

        // Limpieza de modal de cancelación al cerrarse
        const cancelModalEl = document.getElementById('modalConfirmPatientCancellation');
        if (cancelModalEl) {
            cancelModalEl.addEventListener('hidden.bs.modal', () => {
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                document.body.classList.remove('modal-open');
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('padding-right');
            });
        }

        // Limpieza de modal de modificación al cerrarse
        const modifyModalEl = document.getElementById('modalModifyPatientAppointment');
        if (modifyModalEl) {
            modifyModalEl.addEventListener('hidden.bs.modal', () => {
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                document.body.classList.remove('modal-open');
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('padding-right');
            });
        }

        // Búsqueda en tiempo real de pacientes para modal de profesional
        const profPatientSearch = document.getElementById('profBookingPatientSearch');
        if (profPatientSearch) {
            profPatientSearch.addEventListener('input', (e) => {
                this.filterProfPatientSearchResults(e.target.value);
            });
        }

        // Cambio de fecha en modal de profesional (soporta change e input en date picker)
        const profBookingDate = document.getElementById('profBookingDateInput');
        if (profBookingDate) {
            profBookingDate.addEventListener('change', () => {
                this.updateProfNewBookingSlots();
            });
            profBookingDate.addEventListener('input', () => {
                this.updateProfNewBookingSlots();
            });
        }

        // Limpieza de modal de profesional al cerrarse
        const modalProfNewBookingEl = document.getElementById('modalProfNewBooking');
        if (modalProfNewBookingEl) {
            modalProfNewBookingEl.addEventListener('hidden.bs.modal', () => {
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                document.body.classList.remove('modal-open');
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('padding-right');
            });
        }
    }

    // ==========================================
    // SLOTS DISPONIBLES EN TIEMPO REAL
    // ==========================================
    renderAvailableSlots() {
        const container = document.getElementById('availableSlotsContainer');
        if (!container) return;

        if (!this.selectedProfId) {
            container.innerHTML = `
                <div class="alert alert-info py-3 text-center mb-0" role="alert">
                    <i class="bi bi-person-badge me-2"></i> Seleccione un profesional odontólogo/a arriba para consultar sus turnos disponibles.
                </div>
            `;
            return;
        }

        if (!this.selectedDate) {
            container.innerHTML = `
                <div class="alert alert-info py-3 text-center mb-0" role="alert">
                    <i class="bi bi-calendar3 me-2"></i> Seleccione una fecha para consultar los turnos disponibles.
                </div>
            `;
            return;
        }

        // REGLA: Si el paciente ya canceló un turno con este profesional en esta misma fecha, bloquear turnos
        const currentUser = window.authService?.currentUser;
        const patientEmail = currentUser ? currentUser.email : (localStorage.getItem('dental_last_booking_email') || this.myTurnosSearchEmail);
        const patientId = currentUser ? currentUser.id : null;

        if (window.storageService.hasPatientCancelledOnDateWithProf(patientId, patientEmail, this.selectedProfId, this.selectedDate)) {
            const prof = window.storageService.getProfessionalById(this.selectedProfId);
            const profName = prof ? prof.name : 'este profesional';
            container.innerHTML = `
                <div class="alert alert-danger py-4 text-center mb-0 border-2 shadow-sm rounded-3" role="alert">
                    <i class="bi bi-shield-x fs-1 text-danger d-block mb-2"></i>
                    <h5 class="fw-bold text-danger mb-2">Reserva no permitida para esta fecha</h5>
                    <p class="mb-2">
                        Usted ya ha cancelado un turno con <strong>${profName}</strong> para el día <strong>${this.selectedDate}</strong>.
                    </p>
                    <div class="alert alert-warning py-2 px-3 small d-inline-block text-start mb-0">
                        <i class="bi bi-info-circle-fill me-1"></i> Por política del centro odontológico, para este mismo día debe elegir a otro/a profesional de nuestro equipo o seleccionar otra fecha disponible con ${profName}.
                    </div>
                </div>
            `;
            return;
        }

        const slotInfo = window.storageService.getAvailableSlots(this.selectedDate, this.selectedProfId);

        if (!slotInfo.available) {
            container.innerHTML = `
                <div class="alert alert-warning py-3 text-center mb-0" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i> ${slotInfo.reason}
                    <div class="mt-2 text-muted small">Por favor elija otro día en el calendario o consulte otro profesional.</div>
                </div>
            `;
            return;
        }

        if (!slotInfo.slots || slotInfo.slots.length === 0) {
            container.innerHTML = `
                <div class="alert alert-secondary py-3 text-center mb-0" role="alert">
                    <i class="bi bi-clock-history me-2"></i> No hay franjas horarias configuradas para este día.
                </div>
            `;
            return;
        }

        let availableCount = 0;
        const renderSlotButtons = (slots) => {
            let out = '<div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-2" role="group" aria-label="Horarios disponibles">';
            slots.forEach(slot => {
                const isSelected = this.selectedSlot === slot.time;
                if (slot.isAvailable) {
                    availableCount++;
                    const btnClass = isSelected 
                        ? 'btn-primary active text-white fw-bold shadow-sm' 
                        : 'btn-outline-primary';

                    out += `
                        <div class="col">
                            <button type="button" 
                                    class="btn ${btnClass} w-100 py-3 d-flex flex-column align-items-center justify-content-center slot-btn"
                                    aria-label="Turno disponible a las ${slot.time} horas"
                                    aria-pressed="${isSelected}"
                                    onclick="window.patientModule.selectSlot('${slot.time}')">
                                <span class="fs-6 fw-bold"><i class="bi bi-clock me-1"></i>${slot.time} hs</span>
                                <span class="badge ${isSelected ? 'bg-white text-primary' : 'bg-success-subtle text-success'} small mt-1">
                                    ${isSelected ? '✓ Seleccionado' : '[Disponible]'}
                                </span>
                            </button>
                        </div>
                    `;
                } else {
                    const badgeText = slot.isBooked ? '[Ocupado]' : '[Pasado]';
                    out += `
                        <div class="col">
                            <button type="button" 
                                    class="btn btn-outline-secondary opacity-50 disabled-slot w-100 py-3 d-flex flex-column align-items-center justify-content-center slot-btn"
                                    disabled
                                    aria-disabled="true"
                                    tabindex="-1"
                                    aria-label="Turno no disponible a las ${slot.time} horas">
                                <span class="fs-6 text-muted"><i class="bi bi-dash-circle me-1"></i>${slot.time} hs</span>
                                <span class="badge bg-secondary-subtle text-secondary small mt-1">${badgeText}</span>
                            </button>
                        </div>
                    `;
                }
            });
            out += '</div>';
            return out;
        };

        const morningSlots = slotInfo.slots.filter(s => parseInt(s.time.split(':')[0], 10) < 13);
        const afternoonSlots = slotInfo.slots.filter(s => parseInt(s.time.split(':')[0], 10) >= 13);

        let slotsHtml = '';
        if (morningSlots.length > 0) {
            slotsHtml += `
                <div class="mb-3">
                    <div class="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom border-light-subtle slot-group-header">
                        <i class="bi bi-sun-fill text-warning fs-5"></i>
                        <span class="fw-bold text-dark small text-uppercase">Turno Mañana (08:00 a 13:00 hs)</span>
                    </div>
                    ${renderSlotButtons(morningSlots)}
                </div>
            `;
        }
        if (afternoonSlots.length > 0) {
            slotsHtml += `
                <div class="mb-2">
                    <div class="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom border-light-subtle slot-group-header">
                        <i class="bi bi-sunset-fill text-warning-emphasis fs-5"></i>
                        <span class="fw-bold text-dark small text-uppercase">Turno Tarde (14:00 a 20:00 hs)</span>
                    </div>
                    ${renderSlotButtons(afternoonSlots)}
                </div>
            `;
        }

        if (availableCount === 0) {
            slotsHtml = `
                <div class="alert alert-secondary py-3 text-center mb-3">
                    <i class="bi bi-info-circle me-2"></i> Todos los turnos de este profesional para esta fecha están ocupados.
                </div>
            ` + slotsHtml;
        }

        container.innerHTML = slotsHtml;
    }

    selectSlot(time) {
        this.selectedSlot = time;

        const slotsContainer = document.getElementById('availableSlotsContainer');
        if (slotsContainer) slotsContainer.classList.remove('border-danger', 'bg-danger-subtle');
        const slotError = document.getElementById('error-bookingSlot');
        if (slotError) {
            slotError.classList.add('d-none');
            slotError.style.display = 'none';
        }

        this.renderAvailableSlots();

        if (window.accessibilityModule) {
            window.accessibilityModule.speak(`Horario seleccionado: ${time} horas.`);
        }
    }

    // ==========================================
    // CONTROL DEL STEPPER: PASO 1 -> PASO 2 CON VALIDACIÓN Y FOCO
    // ==========================================
    goToStep2() {
        let firstInvalid = null;

        // Comprobar política de turno cancelado para esta misma fecha y profesional
        const currentUser = window.authService?.currentUser;
        const patientEmail = currentUser ? currentUser.email : (localStorage.getItem('dental_last_booking_email') || this.myTurnosSearchEmail);
        const patientId = currentUser ? currentUser.id : null;

        if (this.selectedProfId && this.selectedDate && window.storageService.hasPatientCancelledOnDateWithProf(patientId, patientEmail, this.selectedProfId, this.selectedDate)) {
            const prof = window.storageService.getProfessionalById(this.selectedProfId);
            const profName = prof ? prof.name : 'el profesional seleccionado';
            window.showToast(`Ya canceló un turno con ${profName} para el día ${this.selectedDate}. Debe elegir a otro profesional o seleccionar otra fecha.`, 'danger');
            return false;
        }

        // 1. Validar Profesional
        const profSelect = document.getElementById('bookingProfSelect');
        const profError = document.getElementById('error-bookingProfSelect');
        if (!this.selectedProfId || this.selectedProfId.trim() === '') {
            if (profSelect) profSelect.classList.add('is-invalid');
            if (profError) {
                profError.classList.remove('d-none');
                profError.style.display = 'block';
            }
            if (!firstInvalid) firstInvalid = profSelect;
        } else {
            if (profSelect) profSelect.classList.remove('is-invalid');
            if (profError) {
                profError.classList.add('d-none');
                profError.style.display = 'none';
            }
        }

        // 2. Validar Motivo
        const reasonSelect = document.getElementById('bookingReasonSelect');
        const reasonError = document.getElementById('error-bookingReasonSelect');
        if (!this.selectedReason || this.selectedReason.trim() === '') {
            if (reasonSelect) reasonSelect.classList.add('is-invalid');
            if (reasonError) {
                reasonError.classList.remove('d-none');
                reasonError.style.display = 'block';
            }
            if (!firstInvalid) firstInvalid = reasonSelect;
        } else {
            if (reasonSelect) reasonSelect.classList.remove('is-invalid');
            if (reasonError) {
                reasonError.classList.add('d-none');
                reasonError.style.display = 'none';
            }
        }

        // 3. Validar Fecha / Día
        const dateInput = document.getElementById('bookingDateInput');
        const dateError = document.getElementById('error-bookingDateInput');
        const todayStr = this.getTodayDateString();
        const isPastDate = this.selectedDate && (this.selectedDate < todayStr);

        if (!this.selectedDate || this.selectedDate.trim() === '' || isPastDate) {
            if (dateInput) dateInput.classList.add('is-invalid');
            if (dateError) {
                dateError.textContent = isPastDate 
                    ? 'No es posible agendar turnos para fechas pasadas.' 
                    : 'Por favor seleccione una fecha válida.';
                dateError.classList.remove('d-none');
                dateError.style.display = 'block';
            }
            if (!firstInvalid) firstInvalid = dateInput;
        } else {
            if (dateInput) dateInput.classList.remove('is-invalid');
            if (dateError) {
                dateError.classList.add('d-none');
                dateError.style.display = 'none';
            }
        }

        // 4. Validar Horario
        const slotsContainer = document.getElementById('availableSlotsContainer');
        const slotError = document.getElementById('error-bookingSlot');
        if (!this.selectedSlot || this.selectedSlot.trim() === '') {
            if (slotsContainer) {
                slotsContainer.classList.add('border-danger', 'bg-danger-subtle');
            }
            if (slotError) {
                slotError.classList.remove('d-none');
                slotError.style.display = 'block';
            }
            if (!firstInvalid) firstInvalid = slotsContainer;
        } else {
            if (slotsContainer) {
                slotsContainer.classList.remove('border-danger', 'bg-danger-subtle');
            }
            if (slotError) {
                slotError.classList.add('d-none');
                slotError.style.display = 'none';
            }
        }

        // Si faltó algún elemento del Paso 1:
        if (firstInvalid) {
            window.showToast('Por favor complete todos los datos requeridos marcados en rojo.', 'warning');

            if (firstInvalid.tagName === 'DIV' && !firstInvalid.hasAttribute('tabindex')) {
                firstInvalid.setAttribute('tabindex', '-1');
            }

            if (typeof firstInvalid.focus === 'function') {
                firstInvalid.focus();
            }

            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });

            if (window.accessibilityModule) {
                window.accessibilityModule.speak('Falta completar información obligatoria. El cursor se ha situado en el primer campo faltante.');
            }
            return false;
        }

        // Avanzar al Paso 2
        this.displayStep2();
        return true;
    }

    displayStep2() {
        const currentUser = window.authService?.currentUser;
        if (currentUser && currentUser.role === 'profesional') {
            window.showToast('Los profesionales no pueden agendar turnos. Solo pacientes, secretaría y administradores tienen acceso a la reserva.', 'warning');
            if (window.app) window.app.switchTab('profesional-tab');
            return;
        }

        const step1El = document.getElementById('bookingStep1Container');
        const step2El = document.getElementById('bookingStep2Container');
        const step1Badge = document.getElementById('stepperIndicatorStep1');
        const step2Badge = document.getElementById('stepperIndicatorStep2');
        const progressBar = document.getElementById('bookingProgressBar');

        if (step1El) step1El.classList.add('d-none');
        if (step2El) {
            step2El.classList.remove('d-none');
            step2El.classList.remove('step-animated');
            void step2El.offsetWidth;
            step2El.classList.add('step-animated');
        }

        // Actualizar Stepper Header
        if (step1Badge) {
            step1Badge.className = 'd-flex align-items-center gap-2 text-success';
            step1Badge.innerHTML = `
                <span class="badge bg-success rounded-circle p-2 px-3 fs-6" id="badgeStep1Icon"><i class="bi bi-check-lg"></i></span>
                <div>
                    <span class="d-block fw-bold text-success small">Paso 1 Completado</span>
                    <span class="fw-semibold text-dark">Turno Elegido</span>
                </div>
            `;
        }
        if (step2Badge) {
            step2Badge.className = 'd-flex align-items-center gap-2 text-primary fw-bold';
            const step2Label = currentUser ? 'Confirmación Directa' : 'Datos y Confirmación';
            step2Badge.innerHTML = `
                <span class="badge bg-primary rounded-circle p-2 px-3 fs-6" id="badgeStep2Icon">2</span>
                <div>
                    <span class="d-block fw-bold text-primary small">Paso 2 Activo</span>
                    <span class="fw-semibold text-dark">${step2Label}</span>
                </div>
            `;
        }
        if (progressBar) progressBar.style.width = '100%';

        // Configurar vista del Paso 2 según autenticación
        this.updateBookingFlowForAuthState();

        // Renderizar el resumen detallado en Paso 2
        this.updateStep2Summary();

        // Scroll al paso 2 y situar foco inteligentemente
        step2El?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (currentUser) {
            setTimeout(() => {
                const btnConfirm = document.getElementById('btnConfirmBooking');
                if (btnConfirm) btnConfirm.focus();
            }, 200);

            if (window.accessibilityModule) {
                window.accessibilityModule.speak('Paso 2 activo: Revise el resumen de su turno y presione Confirmar Turno Odontológico.');
            }
        } else {
            const nameInput = document.getElementById('bookingPatientName');
            const emailInput = document.getElementById('bookingPatientEmail');
            const phoneInput = document.getElementById('bookingPatientPhone');

            setTimeout(() => {
                if (nameInput && !nameInput.value.trim()) {
                    nameInput.focus();
                } else if (phoneInput && !phoneInput.value.trim()) {
                    phoneInput.focus();
                } else if (nameInput) {
                    nameInput.focus();
                }
            }, 200);

            if (window.accessibilityModule) {
                window.accessibilityModule.speak('Paso 2 activo: Complete sus datos de contacto y presione Confirmar Turno.');
            }
        }
    }

    backToStep1() {
        const step1El = document.getElementById('bookingStep1Container');
        const step2El = document.getElementById('bookingStep2Container');
        const step1Badge = document.getElementById('stepperIndicatorStep1');
        const step2Badge = document.getElementById('stepperIndicatorStep2');
        const progressBar = document.getElementById('bookingProgressBar');
        const currentUser = window.authService?.currentUser;

        if (step2El) step2El.classList.add('d-none');
        if (step1El) {
            step1El.classList.remove('d-none');
            step1El.classList.remove('step-animated');
            void step1El.offsetWidth;
            step1El.classList.add('step-animated');
        }

        // Restaurar Stepper Header
        if (step1Badge) {
            step1Badge.className = 'd-flex align-items-center gap-2 text-primary';
            step1Badge.innerHTML = `
                <span class="badge bg-primary rounded-circle p-2 px-3 fs-6" id="badgeStep1Icon">1</span>
                <div>
                    <span class="d-block fw-bold text-primary small">Paso 1 Activo</span>
                    <span class="fw-semibold text-dark">Elección de Turno</span>
                </div>
            `;
        }
        if (step2Badge) {
            step2Badge.className = 'd-flex align-items-center gap-2 text-muted';
            const step2Label = currentUser ? 'Confirmación Directa' : 'Datos y Confirmación';
            step2Badge.innerHTML = `
                <span class="badge bg-secondary rounded-circle p-2 px-3 fs-6" id="badgeStep2Icon">2</span>
                <div>
                    <span class="d-block fw-semibold text-muted small">Paso 2</span>
                    <span class="text-muted">${step2Label}</span>
                </div>
            `;
        }
        if (progressBar) progressBar.style.width = '50%';

        this.updateBookingFlowForAuthState();
        step1El?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    updateStep2Summary() {
        const summaryEl = document.getElementById('step2AppointmentSummary');
        if (!summaryEl) return;

        const prof = window.storageService.getProfessionalById(this.selectedProfId);
        if (!prof) return;

        let dateFormatted = this.selectedDate;
        if (this.selectedDate) {
            const parts = this.selectedDate.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateFormatted = d.toLocaleDateString('es-ES', options);
        }

        summaryEl.innerHTML = `
            <div class="card bg-light border-primary border-opacity-25 shadow-sm p-3">
                <div class="row align-items-center g-3">
                    <div class="col-auto">
                        <img src="${prof.picture}" 
                             class="rounded-circle border border-2 border-primary shadow-sm" 
                             width="68" height="68" 
                             style="object-fit: cover;" 
                             alt="${prof.name}"
                             onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300';">
                    </div>
                    <div class="col">
                        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                            <h5 class="fw-bold text-primary mb-0">${prof.name}</h5>
                            <span class="badge bg-primary px-3 py-1">
                                <i class="bi bi-clock me-1"></i>Consulta de ${prof.slotDuration || 30} min
                            </span>
                        </div>
                        <div class="text-muted small">${prof.specialty} &bull; <strong>${prof.consultorio || 'Box Odontológico'}</strong></div>
                        <hr class="my-2 opacity-25">
                        <div class="row g-2 small">
                            <div class="col-md-6">
                                <span class="text-muted d-block">Motivo:</span>
                                <strong class="text-dark">${this.selectedReason || 'Consulta Odontológica'}</strong>
                            </div>
                            <div class="col-md-6">
                                <span class="text-muted d-block">Fecha y Horario:</span>
                                <span class="badge bg-success fs-6 px-2 py-1">
                                    <i class="bi bi-calendar3 me-1"></i>${dateFormatted} &bull; ${this.selectedSlot} hs
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    resetBookingForm() {
        this.selectedProfId = '';
        this.selectedReason = '';
        this.selectedDate = this.getTomorrowDateString();
        this.selectedSlot = null;

        // Limpiar Paso 1 en el DOM
        const profSelect = document.getElementById('bookingProfSelect');
        if (profSelect) {
            profSelect.value = '';
            profSelect.classList.remove('is-invalid');
        }
        const profErr = document.getElementById('error-bookingProfSelect');
        if (profErr) {
            profErr.classList.add('d-none');
            profErr.style.display = 'none';
        }

        const selectedProfCard = document.getElementById('selectedProfCard');
        if (selectedProfCard) selectedProfCard.innerHTML = '';

        const reasonSelect = document.getElementById('bookingReasonSelect');
        if (reasonSelect) {
            reasonSelect.innerHTML = '<option value="" disabled selected>-- Primero seleccione un/a profesional --</option>';
            reasonSelect.classList.remove('is-invalid');
        }
        const reasonErr = document.getElementById('error-bookingReasonSelect');
        if (reasonErr) {
            reasonErr.classList.add('d-none');
            reasonErr.style.display = 'none';
        }

        const dateInput = document.getElementById('bookingDateInput');
        if (dateInput) {
            dateInput.value = this.getTomorrowDateString();
            dateInput.classList.remove('is-invalid');
        }
        const dateErr = document.getElementById('error-bookingDateInput');
        if (dateErr) {
            dateErr.classList.add('d-none');
            dateErr.style.display = 'none';
        }

        const slotsContainer = document.getElementById('availableSlotsContainer');
        if (slotsContainer) {
            slotsContainer.classList.remove('border-danger', 'bg-danger-subtle');
            slotsContainer.innerHTML = `
                <div class="alert alert-info py-3 text-center mb-0" role="alert">
                    <i class="bi bi-calendar3 me-2"></i> Seleccione un/a profesional odontólogo/a para ver los horarios disponibles.
                </div>
            `;
        }
        const slotErr = document.getElementById('error-bookingSlot');
        if (slotErr) {
            slotErr.classList.add('d-none');
            slotErr.style.display = 'none';
        }

        // Limpiar Paso 2 en el DOM
        const nameInput = document.getElementById('bookingPatientName');
        if (nameInput) {
            nameInput.value = '';
            nameInput.classList.remove('is-invalid');
        }
        const emailInput = document.getElementById('bookingPatientEmail');
        if (emailInput) {
            emailInput.value = '';
            emailInput.classList.remove('is-invalid');
        }
        const phoneInput = document.getElementById('bookingPatientPhone');
        if (phoneInput) {
            phoneInput.value = '';
            phoneInput.classList.remove('is-invalid');
        }

        this.backToStep1();
        this.renderProfessionalsSelect();
        this.updateDateBadges();
    }

    handleBookingSubmit() {
        if (this.isSubmittingBooking) return;
        this.isSubmittingBooking = true;

        const currentUser = window.authService?.currentUser;
        let nameVal = '';
        let emailVal = '';
        let phoneVal = '';

        if (currentUser) {
            // Usuario con sesión iniciada: se asocian sus datos directamente sin requerir volver a cargarlos
            nameVal = currentUser.name;
            emailVal = (currentUser.email || '').toLowerCase().trim();
            phoneVal = window.stripCountryCode ? window.stripCountryCode(currentUser.phone || '') : (currentUser.phone || '');
        } else {
            // Paciente por primera vez: validar campos de contacto
            let firstInvalid = null;
            const nameInput = document.getElementById('bookingPatientName');
            const emailInput = document.getElementById('bookingPatientEmail');
            const phoneInput = document.getElementById('bookingPatientPhone');

            const nameErr = document.getElementById('error-bookingPatientName');
            const emailErr = document.getElementById('error-bookingPatientEmail');
            const phoneErr = document.getElementById('error-bookingPatientPhone');

            nameVal = nameInput ? nameInput.value.trim() : '';
            emailVal = emailInput ? emailInput.value.trim().toLowerCase() : '';
            phoneVal = phoneInput ? (window.stripCountryCode ? window.stripCountryCode(phoneInput.value) : phoneInput.value.trim()) : '';

            // 1. Validar Nombre
            if (!nameVal || nameVal.length < 2) {
                if (nameInput) nameInput.classList.add('is-invalid');
                if (nameErr) {
                    nameErr.classList.remove('d-none');
                    nameErr.style.display = 'block';
                }
                if (!firstInvalid) firstInvalid = nameInput;
            } else {
                if (nameInput) nameInput.classList.remove('is-invalid');
                if (nameErr) {
                    nameErr.classList.add('d-none');
                    nameErr.style.display = 'none';
                }
            }

            // 2. Validar Email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailVal || !emailRegex.test(emailVal)) {
                if (emailInput) emailInput.classList.add('is-invalid');
                if (emailErr) {
                    emailErr.classList.remove('d-none');
                    emailErr.style.display = 'block';
                }
                if (!firstInvalid) firstInvalid = emailInput;
            } else {
                if (emailInput) emailInput.classList.remove('is-invalid');
                if (emailErr) {
                    emailErr.classList.add('d-none');
                    emailErr.style.display = 'none';
                }
            }

            // 3. Validar Teléfono / WhatsApp
            if (!phoneVal || phoneVal.length < 6) {
                if (phoneInput) phoneInput.classList.add('is-invalid');
                if (phoneErr) {
                    phoneErr.classList.remove('d-none');
                    phoneErr.style.display = 'block';
                }
                if (!firstInvalid) firstInvalid = phoneInput;
            } else {
                if (phoneInput) phoneInput.classList.remove('is-invalid');
                if (phoneErr) {
                    phoneErr.classList.add('d-none');
                    phoneErr.style.display = 'none';
                }
            }

            // Si hay campos faltantes en el Paso 2:
            if (firstInvalid) {
                window.showToast('Por favor complete sus datos de contacto marcados en rojo.', 'warning');
                if (typeof firstInvalid.focus === 'function') firstInvalid.focus();
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (window.accessibilityModule) {
                    window.accessibilityModule.speak('Por favor complete los campos obligatorios de contacto marcados en rojo.');
                }
                this.isSubmittingBooking = false;
                return;
            }

            // Registrar cuenta de paciente automáticamente para futuras reservas
            window.authService.loginOrCreateUser({
                name: nameVal,
                email: emailVal,
                phone: phoneVal
            });
        }

        // Recuperación defensiva de variables del turno en caso de desincronización
        if (!this.selectedProfId) {
            const profSelect = document.getElementById('bookingProfSelect');
            if (profSelect && profSelect.value) this.selectedProfId = profSelect.value;
        }
        if (!this.selectedDate) {
            const dateInput = document.getElementById('bookingDateInput');
            if (dateInput && dateInput.value) this.selectedDate = dateInput.value;
        }
        if (!this.selectedReason) {
            const reasonSelect = document.getElementById('bookingReasonSelect');
            if (reasonSelect && reasonSelect.value) this.selectedReason = reasonSelect.value;
        }
        if (!this.selectedSlot) {
            const activeSlotBtn = document.querySelector('#availableSlotsContainer .slot-btn.active, #availableSlotsContainer .slot-btn.btn-primary');
            if (activeSlotBtn) {
                const timeText = activeSlotBtn.getAttribute('data-time') || activeSlotBtn.textContent.trim().split(' ')[0];
                if (timeText) this.selectedSlot = timeText;
            }
        }

        // Verificar consistencia del turno
        if (!this.selectedProfId || !this.selectedDate || !this.selectedSlot) {
            window.showToast('Información de turno incompleta. Por favor vuelva al Paso 1.', 'warning');
            this.backToStep1();
            this.isSubmittingBooking = false;
            return;
        }

        const activeUser = window.authService?.currentUser;

        // REGLA: Los profesionales NO pueden agendar turnos (solo pacientes, secretaría y admin)
        if (activeUser && activeUser.role === 'profesional') {
            window.showToast('Los profesionales no pueden agendar turnos. Esta función es exclusiva para pacientes, secretaría y administración.', 'warning');
            this.isSubmittingBooking = false;
            if (window.app) window.app.switchTab('profesional-tab');
            return;
        }

        // Verificar si el paciente ya canceló un turno con este profesional para esta fecha
        if (window.storageService.hasPatientCancelledOnDateWithProf(activeUser ? activeUser.id : null, emailVal, this.selectedProfId, this.selectedDate)) {
            const prof = window.storageService.getProfessionalById(this.selectedProfId);
            const profName = prof ? prof.name : 'este profesional';
            window.showToast(`Ya canceló un turno con ${profName} para el día ${this.selectedDate}. Debe elegir a otro profesional o seleccionar otra fecha.`, 'danger');
            this.isSubmittingBooking = false;
            return;
        }

        const btnConfirm = document.getElementById('btnConfirmBooking');
        let originalBtnHtml = '';
        if (btnConfirm) {
            btnConfirm.disabled = true;
            originalBtnHtml = btnConfirm.innerHTML;
            btnConfirm.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Confirmando Turno...';
        }

        try {
            const appt = window.storageService.createAppointment({
                patientUserId: activeUser ? activeUser.id : null,
                professionalId: this.selectedProfId,
                patientName: nameVal,
                patientEmail: emailVal,
                patientPhone: phoneVal,
                date: this.selectedDate,
                time: this.selectedSlot,
                reason: this.selectedReason
            });

            // Guardar correo para facilitar consulta inmediata en Mis Turnos
            localStorage.setItem('dental_last_booking_email', emailVal);
            this.myTurnosSearchEmail = emailVal;

            window.showToast('¡Turno reservado exitosamente! Pasando a Mis Turnos...', 'success');

            if (window.accessibilityModule) {
                window.accessibilityModule.speak(`¡Felicitaciones! Turno reservado para el ${appt.date} a las ${appt.time} horas con ${appt.professionalName}.`);
            }

            // 1. Limpiar y resetear el formulario de reserva por completo
            this.resetBookingForm();

            // 2. Pasar de inmediato a la sección de turnos para ver el turno creado
            if (window.app) {
                window.app.switchTab('misturnos-tab');
            }
            this.renderMyTurnos();

            if (window.secretaryModule) window.secretaryModule.renderDailyDashboard();
            if (window.professionalModule) window.professionalModule.renderAppointmentsList();

            // 3. Abrir modal interactivo con comprobante, WhatsApp y calendarios
            this.showSuccessModal(appt);

        } catch (error) {
            window.showToast(error.message, 'danger');
            this.selectedSlot = null;
            this.renderAvailableSlots();
            this.backToStep1();
        } finally {
            this.isSubmittingBooking = false;
            if (btnConfirm) {
                setTimeout(() => {
                    btnConfirm.disabled = false;
                    btnConfirm.innerHTML = originalBtnHtml;
                }, 400);
            }
        }
    }

    getPreConsultationAdvice(profId, specialty = '') {
        switch (profId) {
            case 'prof_1':
                return {
                    title: 'Indicaciones para Ortodoncia (Dra. Gómez):',
                    text: 'Traiga sus alineadores o placas previas si ya utiliza. Cepille sus dientes normalmente antes de la consulta. Si un bracket o alambre le causa molestias, avíselo al ingresar al consultorio.'
                };
            case 'prof_2':
                return {
                    title: 'Indicaciones para Cirugía / Implantes (Dr. Morales):',
                    text: 'Traiga estudios radiográficos o tomografías previas. Desayune o almuerce liviano previo al turno. Asista con ropa cómoda y, si es posible, acompañado/a en caso de requerir anestesia quirúrgica.'
                };
            case 'prof_3':
                return {
                    title: 'Guía para Madres/Padres (Dra. Valenzuela - Odontopediatría):',
                    text: 'Cuéntele al niño/a sobre la visita como una experiencia divertida de cuidado dental. Evite frases de alerta como "no te va a doler". Traiga su cepillo habitual si desea aprender técnicas de cepillado.'
                };
            case 'prof_4':
                return {
                    title: 'Indicaciones para Endodoncia y Dolor (Dr. Rossi):',
                    text: 'Informe en recepción y al doctor si está tomando antibióticos o analgésicos (nombre y dosis). Evite masticar alimentos duros del lado del diente afectado antes de la atención.'
                };
            case 'prof_5':
                return {
                    title: 'Indicaciones para Estética y Limpieza (Dra. Benítez):',
                    text: 'Realice un cepillado prolijo previo. Para blanqueamiento o limpieza profunda, evite consumir café, mate, té o alimentos con colorantes intensos durante las 2 horas previas a su turno.'
                };
            default:
                return {
                    title: 'Recomendaciones previas a su turno odontológico:',
                    text: 'Sugerimos presentarse 10 minutos antes del horario acordado con su DNI y carnet de cobertura médica. Realice un cepillado habitual antes de asistir.'
                };
        }
    }

    showSuccessModal(appt) {
        const modalEl = document.getElementById('bookingSuccessModal');
        if (!modalEl) return;

        this.lastBookedAppointment = appt;
        const settings = window.storageService.getSettings();

        // Re-disparar microinteracción "Smile Sparkle"
        const sparkleIcon = document.getElementById('successModalSparkleIcon');
        if (sparkleIcon) {
            sparkleIcon.style.animation = 'none';
            void sparkleIcon.offsetWidth;
            sparkleIcon.style.animation = 'sparklePop 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
        }

        document.getElementById('successModalDate').textContent = appt.date;
        document.getElementById('successModalTime').textContent = `${appt.time} hs`;
        document.getElementById('successModalReason').textContent = appt.reason;
        document.getElementById('successModalProfessional').textContent = appt.professionalName;
        document.getElementById('successModalAddress').textContent = settings.address;

        // Configurar Tarjeta de Consejos Pre-Consulta Dinámicos
        const advice = this.getPreConsultationAdvice(appt.professionalId, appt.professionalSpecialty);
        const adviceTitle = document.getElementById('successModalAdviceTitle');
        const adviceText = document.getElementById('successModalAdviceText');
        if (adviceTitle) adviceTitle.textContent = advice.title;
        if (adviceText) adviceText.textContent = advice.text;

        // Enlace a Google Calendar
        const gCalBtn = document.getElementById('btnAddToGoogleCalendar');
        if (gCalBtn) {
            const [y, m, d] = appt.date.split('-');
            const [h, min] = appt.time.split(':');
            const startDateTime = `${y}${m}${d}T${h}${min}00`;
            const endD = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min) + (appt.duration || 30));
            const ey = endD.getFullYear();
            const em = String(endD.getMonth() + 1).padStart(2, '0');
            const ed = String(endD.getDate()).padStart(2, '0');
            const eh = String(endD.getHours()).padStart(2, '0');
            const emin = String(endD.getMinutes()).padStart(2, '0');
            const endDateTime = `${ey}${em}${ed}T${eh}${emin}00`;

            const title = encodeURIComponent(`Turno Dental: ${appt.reason} - ${appt.professionalName}`);
            const details = encodeURIComponent(`Turno en ${settings.clinicName} con ${appt.professionalName}.\nMotivo: ${appt.reason}\nIndicaciones: ${advice.text}`);
            const location = encodeURIComponent(settings.address);

            gCalBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
        }

        // Enlace para Salida Automática de Comprobante / Confirmación por WhatsApp hacia el paciente
        const waBtn = document.getElementById('btnShareWhatsAppReceipt');
        if (waBtn) {
            const prof = window.storageService.getProfessionalById(appt.professionalId);
            const profPhoneText = (prof && prof.phone) ? `\n📱 *WhatsApp del Profesional:* ${prof.phone}` : '';
            const profName = (prof && prof.name) || appt.professionalName;
            const profSpecialty = (prof && prof.specialty) || appt.professionalSpecialty || 'Odontología';
            const profConsultorio = (prof && prof.consultorio) || 'Consultorio Odontológico';

            const shareText = `🦷 *Centro Odontológico Sonrisas & Salud* - Confirmación de Turno\n\n` +
                `¡Hola ${appt.patientName}! Tu turno odontológico ha sido registrado con éxito:\n\n` +
                `👨‍⚕️ *Profesional:* ${profName} (${profSpecialty})\n` +
                `📅 *Fecha:* ${appt.date}\n` +
                `⏰ *Horario:* ${appt.time} hs\n` +
                `🏥 *Lugar:* ${profConsultorio} (${settings.address})\n` +
                `📋 *Motivo:* ${appt.reason}${profPhoneText}\n\n` +
                `💡 *Indicación previa:* ${advice.text}\n\n` +
                `_Por favor presentarse 10 minutos antes de su horario asignado._`;

            if (appt.patientPhone && window.formatWhatsAppUrl) {
                waBtn.href = window.formatWhatsAppUrl(appt.patientPhone, shareText);
            } else {
                waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
            }
        }

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    downloadAppointmentICS(apptId) {
        let appt = null;
        if (apptId) {
            appt = window.storageService.getAppointments().find(a => a.id === apptId);
        }
        if (!appt && this.lastBookedAppointment) {
            appt = this.lastBookedAppointment;
        }
        if (!appt) {
            window.showToast('No se encontró el turno para exportar.', 'warning');
            return;
        }

        const settings = window.storageService.getSettings();
        const advice = this.getPreConsultationAdvice(appt.professionalId);
        const [y, m, d] = appt.date.split('-');
        const [h, min] = appt.time.split(':');
        const startDateTime = `${y}${m}${d}T${h}${min}00`;
        const endD = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min) + (appt.duration || 30));
        const ey = endD.getFullYear();
        const em = String(endD.getMonth() + 1).padStart(2, '0');
        const ed = String(endD.getDate()).padStart(2, '0');
        const eh = String(endD.getHours()).padStart(2, '0');
        const emin = String(endD.getMinutes()).padStart(2, '0');
        const endDateTime = `${ey}${em}${ed}T${eh}${emin}00`;
        const nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Centro Odontologico Sonrisas y Salud//Agenda Virtual//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:turno-${appt.id}@sonrisasysalud.com`,
            `DTSTAMP:${nowIso}`,
            `DTSTART:${startDateTime}`,
            `DTEND:${endDateTime}`,
            `SUMMARY:Turno Dental: ${appt.reason} - ${appt.professionalName}`,
            `DESCRIPTION:Turno odontologico con ${appt.professionalName} en ${settings.clinicName}. Motivo: ${appt.reason}. Indicaciones: ${advice.text}`,
            `LOCATION:${settings.address}`,
            'STATUS:CONFIRMED',
            'BEGIN:VALARM',
            'TRIGGER:-PT2H',
            'ACTION:DISPLAY',
            'DESCRIPTION:Recordatorio de Turno Dental en 2 horas',
            'END:VALARM',
            'BEGIN:VALARM',
            'TRIGGER:-P1D',
            'ACTION:DISPLAY',
            'DESCRIPTION:Recordatorio de Turno Dental manana',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Turno-Dental-${appt.date}-${appt.time.replace(':', '')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        window.showToast('¡Archivo .ics descargado para Apple Calendar y Outlook!', 'success');
        if (window.accessibilityModule) {
            window.accessibilityModule.speak('Archivo de calendario descargado con éxito.');
        }
    }

    // ==========================================
    // SECCIÓN CANCELAR TURNO DIRECTA (SIN INFO EXTRA)
    // ==========================================
    renderCancelAppointmentsList() {
        const container = document.getElementById('cancelTurnosListContainer');
        if (!container) return;

        const allAppointments = window.storageService.getAppointments();
        const currentUser = window.authService.currentUser;

        // Determinar qué turnos mostrar para cancelar
        let searchEmail = (this.cancelSearchEmail || '').trim().toLowerCase();
        if (!searchEmail && currentUser && currentUser.email) {
            searchEmail = currentUser.email.toLowerCase().trim();
            const input = document.getElementById('inputCancelSearchEmail');
            if (input && !input.value) input.value = currentUser.email;
        }

        if (!searchEmail && !currentUser) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-search display-6 text-primary d-block mb-2"></i>
                    <p class="mb-0">Ingrese su correo electrónico en el campo superior para encontrar sus turnos y proceder a cancelarlos.</p>
                </div>
            `;
            return;
        }

        const activeAppts = allAppointments.filter(a => {
            const matchUser = currentUser && currentUser.id && a.patientUserId === currentUser.id;
            const matchEmail = searchEmail && a.patientEmail && a.patientEmail.toLowerCase().trim() === searchEmail;
            return (matchUser || matchEmail) && a.status !== 'cancelado' && a.status !== 'atendido';
        });

        if (activeAppts.length === 0) {
            container.innerHTML = `
                <div class="alert alert-secondary py-3 text-center mb-0">
                    <i class="bi bi-info-circle me-1"></i> No se encontraron turnos activos pendientes para <strong>${currentUser ? currentUser.name + ' (' + currentUser.email + ')' : searchEmail}</strong>.
                </div>
            `;
            return;
        }

        let html = '<div class="list-group shadow-sm">';
        activeAppts.forEach(appt => {
            const prof = window.storageService.getProfessionalById(appt.professionalId);
            const profName = appt.professionalName || (prof && prof.name) || 'Odontólogo/a';
            const profSpecialty = (prof && prof.specialty) || appt.professionalSpecialty || 'Odontología';
            const profPicture = (prof && prof.picture) || appt.professionalPicture || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150';
            const profConsultorio = (prof && prof.consultorio) || appt.professionalConsultorio || 'Consultorio';

            html += `
                <div class="list-group-item d-flex flex-wrap justify-content-between align-items-center py-3 px-3 gap-2">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${profPicture}" 
                             class="rounded-circle border border-2 border-primary shadow-sm" 
                             width="52" height="52" 
                             style="object-fit: cover; min-width: 52px;" 
                             alt="${profName}"
                             onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150';">
                        <div>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-primary fs-6">${appt.time} hs</span>
                                <span class="fw-bold">${appt.date}</span>
                                <span class="badge bg-success-subtle text-success border border-success-subtle">[Confirmado]</span>
                            </div>
                            <div class="fw-bold text-primary mt-1">${appt.reason}</div>
                            <div class="small text-muted">
                                <i class="bi bi-person-badge text-primary me-1"></i><strong>${profName}</strong> &bull; ${profSpecialty} (${profConsultorio})
                            </div>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-danger btn-sm px-3 fw-bold shadow-sm" onclick="window.patientModule.openCancelConfirmationModal('${appt.id}')">
                            <i class="bi bi-x-circle me-1"></i> Cancelar Turno
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    // ==========================================
    // BADGE DINÁMICO REACTIVO DE MIS TURNOS
    // ==========================================
    // BADGES Y CONTADORES DE TURNOS ACTIVOS
    // ==========================================
    updateTurnosNavBadge(appointments = null) {
        const navBadge = document.getElementById('navBadgeMyTurnosCount');
        const mobileBadge = document.getElementById('mobileBadgeMyTurnosCount');
        const homeBadge = document.getElementById('homeBadgeMyTurnosCount');
        if (!navBadge && !mobileBadge && !homeBadge) return;

        let activeCount = 0;
        if (appointments && Array.isArray(appointments)) {
            activeCount = appointments.filter(a => a.status !== 'cancelado' && a.status !== 'atendido').length;
        } else {
            const currentUser = window.authService?.currentUser;
            const allAppointments = window.storageService?.getAppointments() || [];
            let targetEmail = '';
            if (currentUser && currentUser.email) {
                targetEmail = currentUser.email.toLowerCase().trim();
            } else {
                targetEmail = (this.myTurnosSearchEmail || localStorage.getItem('dental_last_booking_email') || '').toLowerCase().trim();
            }

            if (currentUser) {
                activeCount = allAppointments.filter(a => {
                    const matchUser = currentUser.id && a.patientUserId === currentUser.id;
                    const matchEmail = a.patientEmail && a.patientEmail.toLowerCase().trim() === targetEmail;
                    const isActive = a.status !== 'cancelado' && a.status !== 'atendido';
                    return (matchUser || matchEmail) && isActive;
                }).length;
            } else if (targetEmail) {
                activeCount = allAppointments.filter(a => 
                    a.patientEmail && 
                    a.patientEmail.toLowerCase().trim() === targetEmail && 
                    a.status !== 'cancelado' && 
                    a.status !== 'atendido'
                ).length;
            }
        }

        if (activeCount > 0) {
            if (navBadge) {
                navBadge.textContent = activeCount;
                navBadge.classList.remove('d-none');
            }
            if (mobileBadge) {
                mobileBadge.textContent = activeCount;
                mobileBadge.classList.remove('d-none');
            }
            if (homeBadge) {
                homeBadge.textContent = activeCount;
                homeBadge.classList.remove('d-none');
            }
        } else {
            if (navBadge) navBadge.classList.add('d-none');
            if (mobileBadge) mobileBadge.classList.add('d-none');
            if (homeBadge) homeBadge.classList.add('d-none');
        }
    }

    // ==========================================
    // MIS TURNOS HISTÓRICOS & CONSULTA DE TURNO
    // ==========================================
    renderMyTurnos() {
        const container = document.getElementById('myTurnosListContainer');
        if (!container) return;

        const currentUser = window.authService.currentUser;
        const allAppointments = window.storageService.getAppointments();
        const isProfessional = (currentUser && currentUser.role === 'profesional');

        // Determinar email de búsqueda
        let targetEmail = '';
        if (currentUser && currentUser.email) {
            targetEmail = currentUser.email.toLowerCase().trim();
        } else {
            targetEmail = (this.myTurnosSearchEmail || localStorage.getItem('dental_last_booking_email') || '').toLowerCase().trim();
        }

        // Header de estado o buscador en modo de prueba
        // REGLA: Si el usuario es un PROFESIONAL, NO se muestra la tarjeta de datos del profesional debajo del título
        let headerHtml = '';
        if (!isProfessional) {
            if (currentUser) {
                const avatar = currentUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=198754&color=fff`;
                headerHtml = `
                    <div class="card border-0 shadow-sm p-3 mb-4 bg-light rounded-4 border">
                        <div class="d-flex align-items-center gap-3">
                            <img src="${avatar}" 
                                 class="rounded-circle border border-2 border-primary shadow-sm" 
                                 width="54" height="54" 
                                 style="object-fit: cover; min-width: 54px;" 
                                 alt="${currentUser.name}">
                            <div>
                                <div class="d-flex align-items-center gap-2">
                                    <h5 class="fw-bold mb-0 text-dark">${currentUser.name}</h5>
                                    <span class="badge bg-success text-white small px-2 py-1">
                                        <i class="bi bi-person-check-fill me-1"></i>${window.authService.getRoleBadgeText(currentUser.role)}
                                    </span>
                                </div>
                                <div class="small text-muted mt-1">
                                    <i class="bi bi-envelope me-1 text-primary"></i>${currentUser.email}
                                    ${currentUser.phone ? ` &bull; <i class="bi bi-whatsapp text-success me-1"></i>${currentUser.phone}` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                headerHtml = `
                    <div class="card border-0 shadow-sm p-3 mb-4 bg-light border-start border-4 border-primary">
                        <div class="row g-2 align-items-center">
                            <div class="col-12 col-md-8">
                                <label class="form-label small fw-bold text-dark mb-1" for="inputMyTurnosEmail">
                                    <i class="bi bi-search me-1 text-primary"></i> Consultar Mis Turnos por Correo:
                                </label>
                                <div class="input-group">
                                    <input type="email" id="inputMyTurnosEmail" class="form-control" 
                                           placeholder="Ingrese su correo (ej. paciente@gmail.com)" 
                                           value="${window.escapeHTML(targetEmail)}">
                                    <button class="btn btn-primary fw-bold" onclick="window.patientModule.searchMyTurnosByEmail()">
                                        <i class="bi bi-search me-1"></i> Buscar
                                    </button>
                                    ${targetEmail ? `
                                        <button class="btn btn-outline-secondary" onclick="window.patientModule.clearMyTurnosSearch()" title="Limpiar filtro de búsqueda">
                                            <i class="bi bi-x-lg"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="col-12 col-md-4 text-md-end">
                                <span class="badge bg-success-subtle text-success p-2 small border border-success-subtle">
                                    <i class="bi bi-shield-check me-1"></i> Modo Prueba Activo (Sin login obligatorio)
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        const todayStr = this.getTodayDateString();

        // Actualizar subtítulo descriptivo según el rol
        const subTitleEl = document.getElementById('myTurnosSubtitleText');
        if (subTitleEl) {
            if (isProfessional) {
                subTitleEl.innerHTML = `<span class="badge bg-primary text-white me-2 shadow-sm"><i class="bi bi-calendar-check me-1"></i>Agenda de Hoy</span><strong>${this.formatDateFriendly(todayStr)}</strong> &bull; Turnos del día actual ordenados por horario.`;
            } else {
                subTitleEl.textContent = 'Consulte el estado de sus turnos registrados.';
            }
        }

        // Filtrar turnos:
        let myAppointments = [];
        if (isProfessional) {
            // REGLA: Para el profesional, mostrar ÚNICAMENTE los turnos del DÍA ACTUAL y ordenados por horario
            let prof = null;
            if (currentUser.email) prof = window.storageService.getProfessionalByEmail(currentUser.email);
            if (!prof && currentUser.professionalId) prof = window.storageService.getProfessionalById(currentUser.professionalId);
            const profId = prof ? prof.id : 'prof_1';

            myAppointments = allAppointments.filter(a => 
                a.professionalId === profId && 
                a.date === todayStr
            ).sort((a, b) => a.time.localeCompare(b.time));
        } else if (currentUser) {
            myAppointments = allAppointments.filter(a => {
                const matchUser = currentUser.id && a.patientUserId === currentUser.id;
                const matchEmail = a.patientEmail && a.patientEmail.toLowerCase().trim() === targetEmail;
                return matchUser || matchEmail;
            }).sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));
        } else if (targetEmail) {
            myAppointments = allAppointments.filter(a => 
                a.patientEmail && a.patientEmail.toLowerCase().trim() === targetEmail
            ).sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));
        } else {
            // Protección de datos: Si el usuario anónimo no buscó email, no mostrar datos de otros pacientes
            myAppointments = [];
        }

        // Actualizar badges en navbar superior y mobile bottom bar
        this.updateTurnosNavBadge(myAppointments);

        if (myAppointments.length === 0) {
            let emptyContent = '';
            if (isProfessional) {
                emptyContent = `
                    <div class="card p-5 text-center border-0 shadow-sm bg-light rounded-4">
                        <div class="py-3">
                            <i class="bi bi-calendar2-check text-primary display-4 mb-3"></i>
                            <h5 class="fw-bold text-dark">No tiene turnos programados para hoy</h5>
                            <p class="text-muted small mx-auto mb-3" style="max-width: 520px;">
                                No hay pacientes agendados para el día de hoy (<strong>${this.formatDateFriendly(todayStr)}</strong>). Puede agendar un nuevo turno para un paciente con el botón superior "+ Nuevo Turno".
                            </p>
                            <div class="d-flex justify-content-center gap-2">
                                <button class="btn btn-primary px-4 fw-bold shadow-sm" onclick="window.patientModule.openProfNewBookingModal()">
                                    <i class="bi bi-plus-circle me-1"></i> Agendar Turno para Paciente
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else if (!currentUser && !targetEmail) {
                emptyContent = `
                    <div class="card p-5 text-center border-0 shadow-sm bg-light rounded-4">
                        <div class="py-3">
                            <i class="bi bi-shield-lock-fill text-primary display-4 mb-3" aria-hidden="true"></i>
                            <h5 class="fw-bold text-dark">Consulte sus Turnos</h5>
                            <p class="text-muted small mx-auto mb-4" style="max-width: 520px;">
                                Por motivos de privacidad, ingrese su correo electrónico en el buscador superior o inicie sesión con su cuenta de Google para visualizar sus turnos reservados.
                            </p>
                            <div class="d-flex flex-wrap justify-content-center gap-2">
                                <button class="btn btn-primary px-4 fw-bold" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModal')).show()">
                                    <i class="bi bi-google me-1"></i> Iniciar Sesión con Google
                                </button>
                                <button class="btn btn-outline-primary px-4 fw-semibold" onclick="window.app.showBookingView()">
                                    <i class="bi bi-calendar-plus me-1"></i> Solicitar Nuevo Turno
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                emptyContent = `
                    <div class="card p-4 text-center border-0 shadow-sm">
                        <div class="py-4">
                            <i class="bi bi-calendar-x text-muted display-4"></i>
                            <h5 class="mt-3">No se encontraron turnos</h5>
                            <p class="text-muted">
                                ${targetEmail ? `No hay turnos odontológicos registrados para <strong>${window.escapeHTML(targetEmail)}</strong>.` : 'Aún no se han reservado turnos para su cuenta.'}
                            </p>
                            <div class="d-flex justify-content-center gap-2">
                                ${targetEmail ? `
                                    <button class="btn btn-outline-secondary" onclick="window.patientModule.clearMyTurnosSearch()">
                                        <i class="bi bi-arrow-clockwise me-1"></i> Limpiar Búsqueda
                                    </button>
                                ` : ''}
                                <button class="btn btn-primary" onclick="window.app.showBookingView()">
                                    <i class="bi bi-calendar-plus me-1"></i> Reservar Mi Turno
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = `
                ${headerHtml}
                ${emptyContent}
            `;
            return;
        }

        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        // Identificar el próximo turno activo (el más próximo a ocurrir en el futuro o hoy más tarde)
        const upcomingAppointments = myAppointments
            .filter(a => (a.status === 'confirmado' || a.status === 'pendiente') && ((a.date > todayStr) || (a.date === todayStr && a.time > currentHours)))
            .sort((a, b) => (a.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));
        const nextUpcomingId = upcomingAppointments.length > 0 ? upcomingAppointments[0].id : null;

        let html = headerHtml;

        if (isProfessional) {
            // ==========================================================================
            // VISTA PROFESIONAL: AGENDA DE HOY COMO TIMELINE VISUAL CRONOLÓGICO
            // ==========================================================================
            html += '<div class="prof-timeline">';

            myAppointments.forEach((appt, idx) => {
                const isPastAppointment = (appt.date < todayStr) || (appt.date === todayStr && appt.time <= currentHours);
                const isNextUpcoming = (appt.id === nextUpcomingId);

                let statusBadge = '';
                if (appt.status === 'confirmado') {
                    statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle me-1"></i>Confirmado</span>';
                } else if (appt.status === 'pendiente') {
                    statusBadge = '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"><i class="bi bi-hourglass-split me-1"></i>Pendiente</span>';
                } else if (appt.status === 'atendido') {
                    statusBadge = '<span class="badge bg-info-subtle text-info border border-info-subtle"><i class="bi bi-clipboard2-check me-1"></i>Atendido</span>';
                } else {
                    statusBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle"><i class="bi bi-x-circle me-1"></i>Cancelado</span>';
                }

                let cardFloatingClass = '';
                if (appt.status === 'cancelado') {
                    cardFloatingClass = 'is-canceled-turn';
                } else if (isNextUpcoming) {
                    cardFloatingClass = 'is-next-turn';
                } else if (isPastAppointment) {
                    cardFloatingClass = 'is-past-turn';
                }

                let nextBadgeHtml = '';
                if (isNextUpcoming) {
                    nextBadgeHtml = '<span class="badge bg-primary text-white shadow-sm"><i class="bi bi-bell-fill me-1"></i>Próximo Paciente</span>';
                }

                let patientAvatar = appt.patientPicture || '';
                if (!patientAvatar) {
                    const allUsers = window.storageService.getUsers() || [];
                    const matchedUser = allUsers.find(u => 
                        (appt.patientUserId && u.id === appt.patientUserId) || 
                        (appt.patientEmail && u.email && u.email.toLowerCase() === appt.patientEmail.toLowerCase())
                    );
                    if (matchedUser && matchedUser.picture) {
                        patientAvatar = matchedUser.picture;
                    }
                }
                if (!patientAvatar) {
                    patientAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientName || 'Paciente')}&background=0d6efd&color=fff`;
                }

                html += `
                    <div class="prof-timeline-item ${isPastAppointment ? 'is-past' : ''} ${isNextUpcoming ? 'is-current' : ''}">
                        <div class="prof-timeline-marker">
                            <i class="bi ${isPastAppointment ? 'bi-check-lg' : isNextUpcoming ? 'bi-clock-fill' : 'bi-circle'}"></i>
                        </div>
                        <div class="card prof-timeline-card card-turno-floating ${cardFloatingClass}">
                            <div class="card-body p-3 p-md-4">
                                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                                    <div class="d-flex flex-wrap align-items-center gap-2">
                                        <span class="badge bg-primary text-white fs-6 px-3 py-1 shadow-sm">
                                            <i class="bi bi-clock me-1"></i>${appt.time} hs
                                        </span>
                                        <span class="badge bg-light text-dark border">
                                            <i class="bi bi-calendar3 me-1"></i>${appt.date}
                                        </span>
                                        ${nextBadgeHtml}
                                    </div>
                                    ${statusBadge}
                                </div>

                                <!-- Ficha del Paciente Solicitante con Foto (Google / Avatar) -->
                                <div class="d-flex align-items-center gap-3 turno-inner-profile my-2">
                                    <img src="${patientAvatar}" 
                                         class="rounded-circle border border-2 border-primary shadow-sm" 
                                         width="52" height="52" 
                                         style="object-fit: cover; min-width: 52px;" 
                                         alt="${window.escapeHTML(appt.patientName)}"
                                         onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientName || 'Paciente')}&background=0d6efd&color=fff';">
                                    <div class="flex-grow-1 overflow-hidden">
                                        <div class="fw-bold text-dark text-truncate fs-5">${window.escapeHTML(appt.patientName)}</div>
                                        <div class="small text-muted text-truncate"><i class="bi bi-envelope me-1"></i>${window.escapeHTML(appt.patientEmail)}</div>
                                        ${appt.patientPhone ? `
                                            <div class="small text-success text-truncate mt-1">
                                                <i class="bi bi-telephone me-1"></i>${window.escapeHTML(appt.patientPhone)}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <span class="small text-muted d-block">Motivo de consulta:</span>
                                    <span class="fw-bold text-dark fs-6">${window.escapeHTML(appt.reason)}</span>
                                    <div class="small text-muted mt-1">
                                        <i class="bi bi-door-open me-1"></i>${window.escapeHTML(appt.professionalConsultorio || 'Consultorio')} &bull; ${appt.duration || 30} min
                                    </div>
                                </div>

                                <div class="d-flex flex-column gap-2 pt-2 border-top">
                                    ${isPastAppointment && appt.status !== 'cancelado' ? `
                                        <div class="w-100 text-center py-1">
                                            <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle w-100 py-2">
                                                <i class="bi bi-clock-history me-1"></i>Turno Pasado / Finalizado
                                            </span>
                                        </div>
                                    ` : ''}

                                    <div class="row g-2">
                                        ${appt.status === 'pendiente' ? `
                                            <div class="col-12 col-sm-6">
                                                <button class="btn btn-sm btn-outline-success w-100 fw-semibold" onclick="window.professionalModule.changeStatus('${appt.id}', 'confirmado')">
                                                    <i class="bi bi-check-lg me-1"></i> Confirmar
                                                </button>
                                            </div>
                                        ` : ''}
                                        ${appt.status !== 'atendido' && appt.status !== 'cancelado' ? `
                                            <div class="${appt.status === 'pendiente' ? 'col-12 col-sm-6' : 'col-12 col-sm-6'}">
                                                <button class="btn btn-sm btn-outline-primary w-100 fw-semibold" onclick="window.professionalModule.changeStatus('${appt.id}', 'atendido')">
                                                    <i class="bi bi-clipboard2-check me-1"></i> Atendido
                                                </button>
                                            </div>
                                            <div class="${appt.status === 'pendiente' ? 'col-12 col-sm-6' : 'col-12 col-sm-6'}">
                                                <button class="btn btn-sm btn-outline-danger w-100 fw-semibold" onclick="window.professionalModule.promptCancel('${appt.id}')">
                                                    <i class="bi bi-x-circle me-1"></i> Cancelar
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>

                                    ${appt.patientPhone ? `
                                        <div>
                                            <a href="${window.formatWhatsAppUrl ? window.formatWhatsAppUrl(appt.patientPhone, `Hola ${appt.patientName}, me comunico del Centro Odontológico Sonrisas & Salud respecto a su turno del ${appt.date} a las ${appt.time} hs.`) : `https://api.whatsapp.com/send?phone=549${appt.patientPhone.replace(/\D/g, '')}`}" 
                                               target="_blank" 
                                               class="btn btn-sm btn-outline-success w-100 fw-semibold">
                                                <i class="bi bi-whatsapp me-1"></i> Contactar por WhatsApp
                                            </a>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
        } else {
            // ==========================================================================
            // VISTA PACIENTE: SEGMENTED PILLS Y TARJETAS CON CONSEJOS PRE-CONSULTA
            // ==========================================================================
            const upcomingCount = myAppointments.filter(a => (a.status === 'confirmado' || a.status === 'pendiente') && ((a.date > todayStr) || (a.date === todayStr && a.time > currentHours))).length;
            const pastCount = myAppointments.filter(a => (a.date < todayStr) || (a.date === todayStr && a.time <= currentHours) || a.status === 'atendido' || a.status === 'cancelado').length;
            const totalCount = myAppointments.length;

            const filterTab = this.myTurnosFilterTab || 'upcoming';

            // Segmented Pills Bar
            html += `
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                    <div class="segmented-turnos-pills shadow-sm" role="tablist" aria-label="Filtro de mis turnos">
                        <button type="button" class="segmented-pill-btn ${filterTab === 'upcoming' ? 'active' : ''}" 
                                onclick="window.patientModule.setMyTurnosFilter('upcoming')" 
                                role="tab" aria-selected="${filterTab === 'upcoming'}">
                            <i class="bi bi-clock-history"></i> Próximos Turnos
                            <span class="segmented-pill-badge">${upcomingCount}</span>
                        </button>
                        <button type="button" class="segmented-pill-btn ${filterTab === 'past' ? 'active' : ''}" 
                                onclick="window.patientModule.setMyTurnosFilter('past')" 
                                role="tab" aria-selected="${filterTab === 'past'}">
                            <i class="bi bi-archive"></i> Historial Pasado
                            <span class="segmented-pill-badge">${pastCount}</span>
                        </button>
                        <button type="button" class="segmented-pill-btn ${filterTab === 'all' ? 'active' : ''}" 
                                onclick="window.patientModule.setMyTurnosFilter('all')" 
                                role="tab" aria-selected="${filterTab === 'all'}">
                            <i class="bi bi-list-check"></i> Todos
                            <span class="segmented-pill-badge">${totalCount}</span>
                        </button>
                    </div>
                    <div class="small text-muted d-none d-sm-block">
                        Filtro activo: <strong>${filterTab === 'upcoming' ? 'Próximos Turnos' : filterTab === 'past' ? 'Historial Pasado' : 'Todos los Turnos'}</strong>
                    </div>
                </div>
            `;

            // Filtrar turnos según tab seleccionado
            let displayedAppointments = myAppointments;
            if (filterTab === 'upcoming') {
                displayedAppointments = myAppointments.filter(a => (a.status === 'confirmado' || a.status === 'pendiente') && ((a.date > todayStr) || (a.date === todayStr && a.time > currentHours)));
            } else if (filterTab === 'past') {
                displayedAppointments = myAppointments.filter(a => (a.date < todayStr) || (a.date === todayStr && a.time <= currentHours) || a.status === 'atendido' || a.status === 'cancelado');
            }

            if (displayedAppointments.length === 0) {
                html += `
                    <div class="card p-4 text-center border-0 shadow-sm bg-light rounded-4">
                        <div class="py-3">
                            <i class="bi bi-filter-circle text-muted display-4 mb-2"></i>
                            <h6 class="fw-bold text-dark">No hay turnos en esta categoría (${filterTab === 'upcoming' ? 'Próximos' : 'Historial'})</h6>
                            <p class="text-muted small mb-3">Puede consultar el resto de sus turnos cambiando el filtro de arriba o agendar un nuevo turno.</p>
                            <div class="d-flex justify-content-center gap-2">
                                <button class="btn btn-sm btn-outline-primary fw-semibold" onclick="window.patientModule.setMyTurnosFilter('all')">
                                    <i class="bi bi-list-check me-1"></i> Ver Todos los Turnos
                                </button>
                                <button class="btn btn-sm btn-primary fw-bold" onclick="window.app.showBookingView()">
                                    <i class="bi bi-calendar-plus me-1"></i> Reservar Nuevo Turno
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                html += '<div class="row g-3">';

                displayedAppointments.forEach(appt => {
                    const isPastAppointment = (appt.date < todayStr) || (appt.date === todayStr && appt.time <= currentHours);
                    const isNextUpcoming = (appt.id === nextUpcomingId);

                    let statusBadge = '';
                    if (appt.status === 'confirmado') {
                        statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle me-1"></i>Confirmado</span>';
                    } else if (appt.status === 'pendiente') {
                        statusBadge = '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"><i class="bi bi-hourglass-split me-1"></i>Pendiente</span>';
                    } else if (appt.status === 'atendido') {
                        statusBadge = '<span class="badge bg-info-subtle text-info border border-info-subtle"><i class="bi bi-clipboard2-check me-1"></i>Atendido</span>';
                    } else {
                        statusBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle"><i class="bi bi-x-circle me-1"></i>Cancelado</span>';
                    }

                    const canModifyOrCancel = !isPastAppointment && (appt.status === 'confirmado' || appt.status === 'pendiente');

                    let cardFloatingClass = '';
                    if (appt.status === 'cancelado') {
                        cardFloatingClass = 'is-canceled-turn';
                    } else if (isNextUpcoming) {
                        cardFloatingClass = 'is-next-turn';
                    } else if (isPastAppointment) {
                        cardFloatingClass = 'is-past-turn';
                    }

                    let nextBadgeHtml = '';
                    if (isNextUpcoming) {
                        if (appt.date === todayStr) {
                            nextBadgeHtml = '<span class="badge bg-primary text-white shadow-sm"><i class="bi bi-bell-fill me-1"></i>¡Turno Hoy!</span>';
                        } else {
                            nextBadgeHtml = '<span class="badge bg-success text-white shadow-sm"><i class="bi bi-star-fill me-1"></i>Próximo Turno</span>';
                        }
                    }

                    const prof = window.storageService.getProfessionalById(appt.professionalId);
                    const profName = appt.professionalName || (prof && prof.name) || 'Odontólogo/a del Centro';
                    const profSpecialty = (prof && prof.specialty) || appt.professionalSpecialty || 'Odontología General';
                    const profPicture = (prof && prof.picture) || appt.professionalPicture || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150';
                    const profConsultorio = (prof && prof.consultorio) || appt.professionalConsultorio || 'Consultorio Dental';
                    const duration = appt.duration || (prof && prof.slotDuration) || 30;

                    // Consejos pre-consulta
                    const advice = this.getPreConsultationAdvice(appt.professionalId, profSpecialty);
                    const isAdviceExpanded = this.expandedCardAdviceIds.has(appt.id);

                    html += `
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card h-100 card-turno-floating ${cardFloatingClass}">
                                <div class="card-body d-flex flex-column p-3 p-md-4">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div class="d-flex flex-wrap gap-1 align-items-center">
                                            <span class="badge bg-light text-dark border me-1"><i class="bi bi-calendar3 me-1 text-primary"></i>${appt.date}</span>
                                            <span class="badge bg-light text-dark border"><i class="bi bi-clock me-1 text-primary"></i>${appt.time} hs</span>
                                            ${nextBadgeHtml}
                                        </div>
                                        ${statusBadge}
                                    </div>

                                    <!-- Ficha visible del Odontólogo Asignado -->
                                    <div class="d-flex align-items-center gap-3 turno-inner-profile my-2">
                                        <img src="${profPicture}" 
                                             class="rounded-circle border border-2 border-primary shadow-sm" 
                                             width="48" height="48" 
                                             style="object-fit: cover; min-width: 48px;" 
                                             alt="${profName}"
                                             onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150';">
                                        <div class="flex-grow-1 overflow-hidden">
                                            <div class="fw-bold text-primary text-truncate">${profName}</div>
                                            <div class="small text-muted text-truncate">${profSpecialty}</div>
                                            <div class="d-flex align-items-center gap-2 mt-1">
                                                <span class="badge bg-primary-subtle text-primary border border-primary-subtle" style="font-size: 0.72rem;">
                                                    <i class="bi bi-door-open me-1"></i>${profConsultorio}
                                                </span>
                                                <span class="badge bg-secondary-subtle text-dark" style="font-size: 0.72rem;">
                                                    <i class="bi bi-stopwatch me-1"></i>${duration} min
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mb-2">
                                        <span class="small text-muted d-block">Motivo de consulta:</span>
                                        <span class="fw-bold text-dark">${window.escapeHTML(appt.reason)}</span>
                                    </div>

                                    <!-- Tarjeta Desplegable de Consejos Pre-Consulta -->
                                    <div class="mt-1 pt-2 border-top">
                                        <button type="button" class="pre-advice-btn" onclick="window.patientModule.toggleCardAdvice('${appt.id}')">
                                            <i class="bi ${isAdviceExpanded ? 'bi-chevron-up text-success' : 'bi-info-circle text-success'}"></i>
                                            <span>${isAdviceExpanded ? 'Ocultar recomendaciones' : '¿Cómo prepararme para mi turno?'}</span>
                                        </button>
                                        ${isAdviceExpanded ? `
                                            <div class="pre-advice-box p-3 mt-2 small">
                                                <div class="fw-bold text-success mb-1">
                                                    <i class="bi bi-lightbulb-fill text-warning me-1"></i>${advice.title}
                                                </div>
                                                <p class="text-dark mb-0">${advice.text}</p>
                                            </div>
                                        ` : ''}
                                    </div>

                                    <div class="d-flex flex-column gap-2 mt-auto pt-3">
                                        ${isPastAppointment && appt.status !== 'cancelado' ? `
                                            <div class="w-100 text-center py-1">
                                                <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle w-100 py-2">
                                                    <i class="bi bi-clock-history me-1"></i>Turno Finalizado / Pasado
                                                </span>
                                            </div>
                                        ` : ''}

                                        ${canModifyOrCancel ? `
                                            <div class="row g-2">
                                                <div class="col-6">
                                                    <button class="btn btn-sm btn-outline-primary w-100 fw-semibold" onclick="window.patientModule.openModifyAppointmentModal('${appt.id}')" title="Modificar fecha u horario del turno">
                                                        <i class="bi bi-pencil-square me-1"></i> Modificar
                                                    </button>
                                                </div>
                                                <div class="col-6">
                                                    <button class="btn btn-sm btn-outline-danger w-100 fw-semibold" onclick="window.patientModule.openCancelConfirmationModal('${appt.id}')" title="Cancelar este turno">
                                                        <i class="bi bi-calendar-x me-1"></i> Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ` : ''}

                                        ${appt.status !== 'cancelado' && !isPastAppointment ? `
                                            <div>
                                                <button class="btn btn-sm btn-outline-secondary w-100 fw-semibold" title="Añadir este turno a Google Calendar" onclick="window.patientModule.openGoogleCalendar('${appt.id}')">
                                                    <i class="bi bi-google me-1"></i> Google Calendar
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });

                html += '</div>';
            }
        }

        container.innerHTML = html;
    }

    setMyTurnosFilter(tab) {
        this.myTurnosFilterTab = tab;
        this.renderMyTurnos();
    }

    toggleCardAdvice(apptId) {
        if (this.expandedCardAdviceIds.has(apptId)) {
            this.expandedCardAdviceIds.delete(apptId);
        } else {
            this.expandedCardAdviceIds.add(apptId);
        }
        this.renderMyTurnos();
    }

    handleContactInputLive(inputEl, fieldType) {
        if (!inputEl) return;
        const val = inputEl.value.trim();
        const errorEl = document.getElementById(`error-${inputEl.id}`);
        if (errorEl) errorEl.classList.add('d-none');
        inputEl.classList.remove('is-invalid');

        let isValid = false;
        if (fieldType === 'name') {
            isValid = val.length >= 3;
        } else if (fieldType === 'email') {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = regex.test(val);
        } else if (fieldType === 'phone') {
            const digits = val.replace(/\D/g, '');
            isValid = digits.length >= 7;
        }

        if (isValid) {
            inputEl.classList.add('is-valid');
        } else {
            inputEl.classList.remove('is-valid');
        }
    }

    // ==========================================
    // POPUP LLAMATIVO DE CANCELACIÓN DE TURNO
    // ==========================================
    openCancelConfirmationModal(id) {
        const appt = window.storageService.getAppointments().find(a => a.id === id);
        if (!appt) {
            window.showToast('No se encontró el turno solicitado.', 'warning');
            return;
        }

        this.appointmentToCancelId = id;

        const modalEl = document.getElementById('modalConfirmPatientCancellation');
        if (!modalEl) {
            // En caso excepcional sin modal, fallback seguro
            if (confirm(`¿Confirma que desea cancelar su turno del ${appt.date} a las ${appt.time} hs con ${appt.professionalName}?`)) {
                this.executePatientCancellation();
            }
            return;
        }

        const settings = window.storageService.getSettings();

        const nameEl = document.getElementById('cancelModalPatientName');
        const dateEl = document.getElementById('cancelModalDateTime');
        const docEl = document.getElementById('cancelModalDoctor');
        const reasonEl = document.getElementById('cancelModalReason');
        const locEl = document.getElementById('cancelModalLocation');

        if (nameEl) nameEl.textContent = appt.patientName || 'Paciente';
        if (dateEl) dateEl.textContent = `${appt.date} a las ${appt.time} hs`;
        if (docEl) docEl.textContent = appt.professionalName || 'Odontólogo/a';
        if (reasonEl) reasonEl.textContent = appt.reason || 'Consulta Odontológica General';
        if (locEl) locEl.textContent = `${settings.clinicName} (${settings.address})`;

        const reasonSelect = document.getElementById('cancelModalSelectReason');
        if (reasonSelect) reasonSelect.selectedIndex = 0;

        let modal = bootstrap.Modal.getInstance(modalEl);
        if (!modal) modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    executePatientCancellation() {
        if (!this.appointmentToCancelId) return;

        const id = this.appointmentToCancelId;
        const appt = window.storageService.getAppointments().find(a => a.id === id);
        if (!appt) return;

        const reasonSelect = document.getElementById('cancelModalSelectReason');
        const userCancellationReason = reasonSelect ? reasonSelect.value : 'Cancelado por el paciente';

        // Actualizar estado en storage (registra automáticamente en el log de auditoría exclusivo del admin)
        window.storageService.updateAppointmentStatus(id, 'cancelado', `Cancelado por el paciente. Motivo: ${userCancellationReason}`);

        // Ocultar modal de confirmación
        const modalEl = document.getElementById('modalConfirmPatientCancellation');
        if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }

        // Limpiar backdrops y bloqueos de scroll
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');

        // Mostrar aviso llamativo de turno cancelado con opción a nuevo turno
        this.showCancellationSuccessNotice(appt);

        // Actualizar vistas en tiempo real
        this.renderMyTurnos();
        this.renderCancelAppointmentsList();
        this.renderAvailableSlots();
        if (window.secretaryModule) {
            window.secretaryModule.renderDailyDashboard();
            window.secretaryModule.renderProfessionalsCardsGrid();
        }
        if (window.professionalModule) {
            window.professionalModule.renderAppointmentsList();
            window.professionalModule.renderStats();
        }

        this.appointmentToCancelId = null;
    }

    showCancellationSuccessNotice(appt) {
        const modalEl = document.getElementById('modalCancellationSuccessNotice');
        if (modalEl) {
            const dateEl = document.getElementById('cancelSuccessDate');
            const doctorEl = document.getElementById('cancelSuccessDoctor');
            if (dateEl) dateEl.textContent = `${appt.date} - ${appt.time} hs`;
            if (doctorEl) doctorEl.textContent = appt.professionalName;

            let modal = bootstrap.Modal.getInstance(modalEl);
            if (!modal) modal = new bootstrap.Modal(modalEl);
            modal.show();
        } else {
            window.showToast('Su turno fue cancelado correctamente.', 'info');
        }
    }

    cancelMyAppointment(id) {
        // Redirige al modal interactivo de cancelación
        this.openCancelConfirmationModal(id);
    }

    openGoogleCalendar(id) {
        const appt = window.storageService.getAppointments().find(a => a.id === id);
        if (!appt) return;

        const settings = window.storageService.getSettings();
        const [y, m, d] = appt.date.split('-');
        const [h, min] = appt.time.split(':');
        const startDateTime = `${y}${m}${d}T${h}${min}00`;
        const endD = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min) + (appt.duration || 30));
        const ey = endD.getFullYear();
        const em = String(endD.getMonth() + 1).padStart(2, '0');
        const ed = String(endD.getDate()).padStart(2, '0');
        const eh = String(endD.getHours()).padStart(2, '0');
        const emin = String(endD.getMinutes()).padStart(2, '0');
        const endDateTime = `${ey}${em}${ed}T${eh}${emin}00`;

        const title = encodeURIComponent(`Turno Dental: ${appt.reason} - ${appt.professionalName}`);
        const details = encodeURIComponent(`Turno en ${settings.clinicName} con ${appt.professionalName}.\nMotivo: ${appt.reason}`);
        const location = encodeURIComponent(settings.address);

        window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`, '_blank');
    }

    // ==========================================
    // MODIFICAR TURNO (REGLA DE 3 HORAS Y OTRO DÍA)
    // ==========================================
    openModifyAppointmentModal(id) {
        const appt = window.storageService.getAppointments().find(a => a.id === id);
        if (!appt) {
            window.showToast('No se encontró el turno solicitado.', 'warning');
            return;
        }

        if (appt.status === 'cancelado' || appt.status === 'atendido') {
            window.showToast('Solo se pueden modificar turnos confirmados o pendientes.', 'warning');
            return;
        }

        this.appointmentToModifyId = id;
        this.modifySelectedDate = appt.date;
        this.modifySelectedSlot = null;
        this.modifySelectedReason = appt.reason || 'Consulta Odontológica General';

        const modalEl = document.getElementById('modalModifyPatientAppointment');
        if (!modalEl) return;

        const prof = window.storageService.getProfessionalById(appt.professionalId);
        const profName = appt.professionalName || (prof && prof.name) || 'Odontólogo/a';
        const profSpecialty = (prof && prof.specialty) || 'Odontología';
        const profPicture = (prof && prof.picture) || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150';
        const profConsultorio = (prof && prof.consultorio) || 'Consultorio';

        // Resumen del turno actual
        const currentSummary = document.getElementById('modifyApptCurrentSummary');
        if (currentSummary) {
            currentSummary.innerHTML = `
                <div class="card border border-primary-subtle bg-primary bg-opacity-10 p-3 rounded-3">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${profPicture}" 
                             class="rounded-circle border border-2 border-primary shadow-sm" 
                             width="55" height="55" 
                             style="object-fit: cover;" 
                             alt="${profName}">
                        <div class="flex-grow-1">
                            <div class="d-flex flex-wrap justify-content-between align-items-center">
                                <h6 class="fw-bold text-primary mb-0 fs-5">${profName}</h6>
                                <span class="badge bg-primary px-2 py-1">Turno Actual</span>
                            </div>
                            <div class="text-muted small">${profSpecialty} &bull; ${profConsultorio}</div>
                            <div class="d-flex flex-wrap align-items-center gap-2 mt-2">
                                <span class="badge bg-white text-dark border">
                                    <i class="bi bi-calendar3 me-1 text-primary"></i>${appt.date}
                                </span>
                                <span class="badge bg-white text-dark border">
                                    <i class="bi bi-clock me-1 text-primary"></i>${appt.time} hs
                                </span>
                                <span class="badge bg-white text-dark border">
                                    <i class="bi bi-journal-check me-1 text-primary"></i>${appt.reason}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Evaluar la regla de 3 horas para el turno actual
        const todayStr = this.getTodayDateString();
        const noticeEl = document.getElementById('modifyApptWarningNotice');
        
        // Calcular horas restantes
        const now = new Date();
        const [aYear, aMonth, aDay] = appt.date.split('-').map(Number);
        const [aHours, aMins] = appt.time.split(':').map(Number);
        const apptDateObj = new Date(aYear, aMonth - 1, aDay, aHours, aMins);
        const diffHours = (apptDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);

        const dateInput = document.getElementById('modifyAppointmentDateInput');
        if (dateInput) {
            dateInput.min = todayStr;
            
            // Si el turno es hoy y faltan menos de 3 horas, no permitir elegir hoy: debe elegir otro día
            if (appt.date === todayStr && diffHours < 3) {
                const tomorrowStr = this.getTomorrowDateString();
                this.modifySelectedDate = tomorrowStr;
                dateInput.value = tomorrowStr;
                if (noticeEl) {
                    noticeEl.className = 'alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3';
                    noticeEl.innerHTML = `
                        <i class="bi bi-exclamation-triangle-fill fs-5 text-warning flex-shrink-0"></i>
                        <div><strong>Atención:</strong> Faltan menos de 3 horas para su turno de hoy (${diffHours <= 0 ? 'horario ya transcurrido' : diffHours.toFixed(1) + ' horas restantes'}). Por política del centro, no es posible cambiarlo para hoy. Por favor seleccione otro día disponible a partir de mañana con ${profName}.</div>
                    `;
                    noticeEl.classList.remove('d-none');
                }
            } else {
                this.modifySelectedDate = appt.date;
                dateInput.value = appt.date;
                if (noticeEl) {
                    noticeEl.className = 'd-none';
                    noticeEl.innerHTML = '';
                }
            }
        }

        // Motivos del profesional
        const reasonSelect = document.getElementById('modifyAppointmentReasonSelect');
        if (reasonSelect) {
            const reasons = (prof && prof.reasons && prof.reasons.length > 0) ? prof.reasons : ['Consulta Odontológica General'];
            let html = '';
            reasons.forEach(r => {
                html += `<option value="${r}" ${r === appt.reason ? 'selected' : ''}>${r}</option>`;
            });
            reasonSelect.innerHTML = html;
            reasonSelect.onchange = (e) => {
                this.modifySelectedReason = e.target.value;
            };
        }

        this.renderModifySlots();
        this.updateDateBadges();

        let modal = bootstrap.Modal.getInstance(modalEl);
        if (!modal) modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    handleModifyDateChange(newDate) {
        this.modifySelectedDate = newDate;
        this.modifySelectedSlot = null;
        this.updateDateBadges();

        const noticeEl = document.getElementById('modifyApptWarningNotice');
        const appt = window.storageService.getAppointments().find(a => a.id === this.appointmentToModifyId);
        const todayStr = this.getTodayDateString();

        if (appt && appt.date === todayStr && newDate === todayStr) {
            const now = new Date();
            const [aYear, aMonth, aDay] = appt.date.split('-').map(Number);
            const [aHours, aMins] = appt.time.split(':').map(Number);
            const apptDateObj = new Date(aYear, aMonth - 1, aDay, aHours, aMins);
            const diffHours = (apptDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (diffHours < 3 && noticeEl) {
                noticeEl.className = 'alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3';
                noticeEl.innerHTML = `
                    <i class="bi bi-exclamation-triangle-fill fs-5 text-warning flex-shrink-0"></i>
                    <div><strong>Atención:</strong> Faltan menos de 3 horas para su turno de hoy. Para hoy no es posible modificarlo; elija otra fecha a partir de mañana.</div>
                `;
                noticeEl.classList.remove('d-none');
            } else if (noticeEl) {
                noticeEl.classList.add('d-none');
            }
        } else if (noticeEl) {
            noticeEl.classList.add('d-none');
        }

        this.renderModifySlots();
    }

    renderModifySlots() {
        const container = document.getElementById('modifyAppointmentSlotsContainer');
        if (!container || !this.appointmentToModifyId) return;

        const appt = window.storageService.getAppointments().find(a => a.id === this.appointmentToModifyId);
        if (!appt) return;

        const todayStr = this.getTodayDateString();
        const now = new Date();

        // Si la fecha elegida es hoy, verificar regla de 3 horas
        const isSelectedDateToday = (this.modifySelectedDate === todayStr);

        // Si el turno original era hoy y faltaban menos de 3 horas, bloquear hoy
        const [aYear, aMonth, aDay] = appt.date.split('-').map(Number);
        const [aHours, aMins] = appt.time.split(':').map(Number);
        const originalApptObj = new Date(aYear, aMonth - 1, aDay, aHours, aMins);
        const origDiffHours = (originalApptObj.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (isSelectedDateToday && appt.date === todayStr && origDiffHours < 3) {
            container.innerHTML = `
                <div class="alert alert-danger py-3 text-center mb-0">
                    <i class="bi bi-x-octagon fs-4 d-block mb-1"></i>
                    <strong>Modificación en el mismo día no disponible</strong>
                    <div class="small mt-1">El turno de hoy tenía menos de 3 horas de anticipación. Debe seleccionar otra fecha a partir de mañana con este/a profesional.</div>
                </div>
            `;
            return;
        }

        const slotInfo = window.storageService.getAvailableSlots(this.modifySelectedDate, appt.professionalId);

        if (!slotInfo.available) {
            container.innerHTML = `
                <div class="alert alert-warning py-3 text-center mb-0">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i> ${slotInfo.reason}
                    <div class="small mt-1 text-muted">Por favor elija otra fecha en el calendario.</div>
                </div>
            `;
            return;
        }

        if (!slotInfo.slots || slotInfo.slots.length === 0) {
            container.innerHTML = `
                <div class="alert alert-secondary py-3 text-center mb-0">
                    <i class="bi bi-clock-history me-1"></i> No hay franjas horarias configuradas para esta fecha.
                </div>
            `;
            return;
        }

        let availableCount = 0;
        const renderModifySlotButtons = (slots) => {
            let out = '<div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-2" role="group" aria-label="Horarios disponibles para modificación">';
            slots.forEach(slot => {
                const isCurrentSlot = (this.modifySelectedDate === appt.date && slot.time === appt.time);
                const isSelected = (this.modifySelectedSlot === slot.time);

                let violates3HourLeadTime = false;
                if (isSelectedDateToday) {
                    const [sH, sM] = slot.time.split(':').map(Number);
                    const slotObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sH, sM);
                    const leadHours = (slotObj.getTime() - now.getTime()) / (1000 * 60 * 60);
                    if (leadHours < 3) {
                        violates3HourLeadTime = true;
                    }
                }

                const canSelect = (slot.isAvailable || isCurrentSlot) && !violates3HourLeadTime;

                if (canSelect) {
                    availableCount++;
                    const btnClass = isSelected 
                        ? 'btn-primary active text-white fw-bold shadow-sm'
                        : (isCurrentSlot ? 'btn-outline-success' : 'btn-outline-primary');
                    
                    let badgeText = '[Disponible]';
                    if (isSelected) badgeText = '✓ Nuevo Horario';
                    else if (isCurrentSlot) badgeText = 'Turno Actual';

                    out += `
                        <div class="col">
                            <button type="button" 
                                    class="btn ${btnClass} w-100 py-2 d-flex flex-column align-items-center justify-content-center slot-btn"
                                    aria-label="Turno ${isCurrentSlot ? 'actual' : 'disponible'} a las ${slot.time} horas"
                                    aria-pressed="${isSelected}"
                                    onclick="window.patientModule.selectModifySlot('${slot.time}')">
                                <span class="fs-6 fw-bold"><i class="bi bi-clock me-1"></i>${slot.time} hs</span>
                                <span class="badge ${isSelected ? 'bg-white text-primary' : (isCurrentSlot ? 'bg-success text-white' : 'bg-success-subtle text-success')} small mt-1">
                                    ${badgeText}
                                </span>
                            </button>
                        </div>
                    `;
                } else {
                    let badgeText = '[Ocupado]';
                    if (violates3HourLeadTime) badgeText = '< 3 hs ant.';
                    else if (slot.isPast) badgeText = '[Pasado]';

                    out += `
                        <div class="col">
                            <button type="button" 
                                    class="btn btn-outline-secondary opacity-50 disabled-slot w-100 py-2 d-flex flex-column align-items-center justify-content-center slot-btn"
                                    disabled
                                    aria-disabled="true"
                                    tabindex="-1"
                                    aria-label="Turno no seleccionable a las ${slot.time} horas">
                                <span class="fs-6 text-muted"><i class="bi bi-dash-circle me-1"></i>${slot.time} hs</span>
                                <span class="badge bg-secondary-subtle text-secondary small mt-1">${badgeText}</span>
                            </button>
                        </div>
                    `;
                }
            });
            out += '</div>';
            return out;
        };

        const morningSlots = slotInfo.slots.filter(s => parseInt(s.time.split(':')[0], 10) < 13);
        const afternoonSlots = slotInfo.slots.filter(s => parseInt(s.time.split(':')[0], 10) >= 13);

        let html = '';
        if (morningSlots.length > 0) {
            html += `
                <div class="mb-3">
                    <div class="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom border-light-subtle slot-group-header">
                        <i class="bi bi-sun-fill text-warning fs-5"></i>
                        <span class="fw-bold text-dark small text-uppercase">Turno Mañana (08:00 a 13:00 hs)</span>
                    </div>
                    ${renderModifySlotButtons(morningSlots)}
                </div>
            `;
        }
        if (afternoonSlots.length > 0) {
            html += `
                <div class="mb-2">
                    <div class="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom border-light-subtle slot-group-header">
                        <i class="bi bi-sunset-fill text-warning-emphasis fs-5"></i>
                        <span class="fw-bold text-dark small text-uppercase">Turno Tarde (14:00 a 20:00 hs)</span>
                    </div>
                    ${renderModifySlotButtons(afternoonSlots)}
                </div>
            `;
        }

        if (availableCount === 0) {
            html = `
                <div class="alert alert-secondary py-2 text-center mb-2 small">
                    <i class="bi bi-info-circle me-1"></i> No hay horarios disponibles que cumplan con la regla de 3 horas para esta fecha.
                </div>
            ` + html;
        }

        container.innerHTML = html;
    }

    selectModifySlot(time) {
        this.modifySelectedSlot = time;
        this.renderModifySlots();
        if (window.accessibilityModule) {
            window.accessibilityModule.speak(`Nuevo horario de turno seleccionado: ${time} horas.`);
        }
    }

    executeModifyAppointment() {
        if (!this.appointmentToModifyId) return;

        const appt = window.storageService.getAppointments().find(a => a.id === this.appointmentToModifyId);
        if (!appt) {
            window.showToast('No se encontró el turno a modificar.', 'warning');
            return;
        }

        const reasonSelect = document.getElementById('modifyAppointmentReasonSelect');
        const newReason = reasonSelect ? reasonSelect.value : (this.modifySelectedReason || appt.reason);

        if (!this.modifySelectedSlot) {
            window.showToast('Por favor seleccione un horario disponible para su nuevo turno.', 'warning');
            return;
        }

        // Si eligió el mismo día, la misma hora y el mismo motivo
        if (this.modifySelectedDate === appt.date && this.modifySelectedSlot === appt.time && newReason === appt.reason) {
            window.showToast('No ha realizado cambios en la fecha, hora o motivo de su turno.', 'info');
            return;
        }

        // Re-validación estricta de 3 horas de anticipación para el mismo día
        const now = new Date();
        const todayStr = this.getTodayDateString();
        if (this.modifySelectedDate === todayStr) {
            const [slotH, slotM] = this.modifySelectedSlot.split(':').map(Number);
            const slotTotalMins = slotH * 60 + slotM;
            const currentTotalMins = now.getHours() * 60 + now.getMinutes();
            const diffHours = (slotTotalMins - currentTotalMins) / 60;
            if (diffHours < 3) {
                window.showToast('La modificación para el mismo día solo puede realizarse con al menos 3 horas de anticipación.', 'danger');
                return;
            }
        }

        // Prevención de doble clic
        const btnConfirm = document.getElementById('btnConfirmModifyPatientAppt');
        if (btnConfirm && btnConfirm.disabled) return;
        let originalBtnHtml = '';
        if (btnConfirm) {
            btnConfirm.disabled = true;
            originalBtnHtml = btnConfirm.innerHTML;
            btnConfirm.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Confirmando Cambio...';
        }

        try {
            const updated = window.storageService.rescheduleAppointment(
                appt.id,
                this.modifySelectedDate,
                this.modifySelectedSlot,
                newReason
            );

            // Ocultar modal
            const modalEl = document.getElementById('modalModifyPatientAppointment');
            if (modalEl) {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.hide();
            }

            // Limpieza de backdrop
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');

            window.showToast(`¡Turno modificado con éxito para el ${updated.date} a las ${updated.time} hs!`, 'success');

            if (window.accessibilityModule) {
                window.accessibilityModule.speak(`Su turno ha sido modificado exitosamente para el día ${updated.date} a las ${updated.time} horas con ${updated.professionalName}.`);
            }

            // Actualizar vistas
            this.renderMyTurnos();
            this.renderCancelAppointmentsList();
            this.renderAvailableSlots();

            if (window.secretaryModule) {
                window.secretaryModule.renderDailyDashboard();
                window.secretaryModule.renderProfessionalsCardsGrid();
            }
            if (window.professionalModule) {
                window.professionalModule.renderAppointmentsList();
                window.professionalModule.renderStats();
            }

            this.appointmentToModifyId = null;
            this.modifySelectedDate = '';
            this.modifySelectedSlot = null;

        } catch (error) {
            window.showToast(error.message, 'danger');
        } finally {
            if (btnConfirm) {
                setTimeout(() => {
                    btnConfirm.disabled = false;
                    btnConfirm.innerHTML = originalBtnHtml;
                }, 800);
            }
        }
    }

    searchMyTurnosByEmail() {
        const input = document.getElementById('inputMyTurnosEmail');
        if (input && input.value.trim()) {
            this.myTurnosSearchEmail = input.value.trim().toLowerCase();
            localStorage.setItem('dental_last_booking_email', this.myTurnosSearchEmail);
            this.renderMyTurnos();
            window.showToast(`Consultando turnos para: ${this.myTurnosSearchEmail}`, 'info');
        } else {
            window.showToast('Por favor ingrese un correo para buscar.', 'warning');
        }
    }

    clearMyTurnosSearch() {
        this.myTurnosSearchEmail = '';
        localStorage.removeItem('dental_last_booking_email');
        const input = document.getElementById('inputMyTurnosEmail');
        if (input) input.value = '';
        this.renderMyTurnos();
        window.showToast('Búsqueda de turnos restablecida.', 'info');
    }

    // ==========================================
    // AGENDAR NUEVO TURNO DESDE LA VISTA DEL PROFESIONAL
    // ==========================================
    handleTopNewTurnoClick() {
        const currentUser = window.authService?.currentUser;
        if (currentUser && currentUser.role === 'profesional') {
            this.openProfNewBookingModal();
        } else if (currentUser && (currentUser.role === 'secretaria' || currentUser.role === 'admin')) {
            if (window.secretaryModule) {
                window.secretaryModule.openNewBookingModal();
            } else {
                window.app.showBookingView();
            }
        } else {
            window.app.showBookingView();
        }
    }

    openProfNewBookingModal() {
        const currentUser = window.authService?.currentUser;
        let prof = null;
        if (currentUser?.email) prof = window.storageService.getProfessionalByEmail(currentUser.email);
        if (!prof && currentUser?.professionalId) prof = window.storageService.getProfessionalById(currentUser.professionalId);
        if (!prof) prof = window.storageService.getProfessionals()[0];

        this.profBookingDoctor = prof;
        this.profBookingSelectedPatient = null;
        this.profBookingSelectedSlot = null;

        // Subtítulo del modal
        const subTitle = document.getElementById('profBookingDoctorSubtitle');
        if (subTitle) subTitle.textContent = `${prof.name} (${prof.specialty} - ${prof.consultorio || 'Consultorio Dental'})`;

        const badge = document.getElementById('profBookingDurationBadge');
        if (badge) badge.textContent = `${prof.slotDuration || 30} min por consulta`;

        // Motivos de consulta
        const reasonSelect = document.getElementById('profBookingReasonSelect');
        if (reasonSelect) {
            const reasons = (prof.reasons && prof.reasons.length > 0) ? prof.reasons : ['Consulta Odontológica General'];
            reasonSelect.innerHTML = reasons.map((r, i) => `<option value="${window.escapeHTML(r)}" ${i === 0 ? 'selected' : ''}>${window.escapeHTML(r)}</option>`).join('');
        }

        // Fecha por defecto: hoy (o fecha seleccionada válida)
        const dateInput = document.getElementById('profBookingDateInput');
        if (dateInput) {
            dateInput.min = this.getTodayDateString();
            dateInput.value = this.getTodayDateString();
        }

        // Reset paciente
        const searchInput = document.getElementById('profBookingPatientSearch');
        if (searchInput) searchInput.value = '';

        this.deselectProfPatient();
        this.filterProfPatientSearchResults('');
        this.updateProfNewBookingSlots();

        // Mostrar modal
        const modalEl = document.getElementById('modalProfNewBooking');
        if (modalEl) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    }

    getAllPatientsForLookup() {
        const currentUser = window.authService?.currentUser;
        let prof = this.profBookingDoctor;
        if (!prof) {
            if (currentUser?.email) prof = window.storageService.getProfessionalByEmail(currentUser.email);
            if (!prof && currentUser?.professionalId) prof = window.storageService.getProfessionalById(currentUser.professionalId);
            if (!prof) prof = window.storageService.getProfessionals()[0];
            this.profBookingDoctor = prof;
        }
        const profId = prof ? prof.id : 'prof_1';

        // REGLA: Cada profesional maneja sus propios pacientes, no pueden ver los pacientes de otro profesional.
        return window.storageService.getPatientsForProfessional(profId);
    }

    filterProfPatientSearchResults(query = '') {
        const container = document.getElementById('profPatientSearchResults');
        if (!container) return;

        const allPatients = this.getAllPatientsForLookup();
        const q = (query || '').toLowerCase().trim();

        const filtered = allPatients.filter(p => {
            if (!q) return true;
            return (p.name && p.name.toLowerCase().includes(q)) || 
                   (p.email && p.email.toLowerCase().includes(q)) ||
                   (p.phone && p.phone.includes(q));
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="p-3 text-center text-muted small">
                    <i class="bi bi-person-x me-1"></i> No se encontraron pacientes en su lista médica asignada que coincidan con "<strong>${window.escapeHTML(query)}</strong>".
                    <div class="mt-2">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="window.patientModule.toggleNewPatientManualForm(true)">
                            <i class="bi bi-person-plus me-1"></i> Registrar nuevo paciente para mi consultorio
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(p => {
            const avatar = p.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0d6efd&color=fff`;
            const jsonStr = encodeURIComponent(JSON.stringify(p));
            html += `
                <button type="button" class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-2" 
                        onclick="window.patientModule.selectProfPatientFromData('${jsonStr}')">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${avatar}" 
                             class="rounded-circle border" 
                             width="38" height="38" 
                             style="object-fit: cover; min-width: 38px;" 
                             alt="${window.escapeHTML(p.name)}"
                             onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0d6efd&color=fff';">
                        <div>
                            <div class="fw-bold small text-dark">${window.escapeHTML(p.name)}</div>
                            <div class="text-muted" style="font-size: 0.78rem;">
                                <i class="bi bi-envelope me-1"></i>${window.escapeHTML(p.email)}
                                ${p.phone ? ` &bull; <i class="bi bi-whatsapp text-success me-1"></i>${window.escapeHTML(p.phone)}` : ''}
                            </div>
                        </div>
                    </div>
                    <span class="btn btn-sm btn-outline-primary py-0 px-2 small fw-semibold">
                        Seleccionar
                    </span>
                </button>
            `;
        });

        container.innerHTML = html;
    }

    selectProfPatientFromData(encodedJson) {
        try {
            const patient = JSON.parse(decodeURIComponent(encodedJson));
            this.selectProfPatient(patient);
        } catch (e) {
            console.error('Error selecting patient:', e);
        }
    }

    selectProfPatient(patient) {
        this.profBookingSelectedPatient = patient;

        const container = document.getElementById('profSelectedPatientContainer');
        const results = document.getElementById('profPatientSearchResults');
        const manualForm = document.getElementById('profManualPatientForm');

        if (container) {
            container.classList.remove('d-none');
            container.classList.remove('step-animated');
            void container.offsetWidth;
            container.classList.add('step-animated');
            const avatarEl = document.getElementById('profSelectedPatientAvatar');
            const nameEl = document.getElementById('profSelectedPatientName');
            const detailsEl = document.getElementById('profSelectedPatientDetails');

            const avatar = patient.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0d6efd&color=fff`;
            if (avatarEl) avatarEl.src = avatar;
            if (nameEl) nameEl.textContent = patient.name;
            if (detailsEl) detailsEl.innerHTML = `<i class="bi bi-envelope me-1"></i>${window.escapeHTML(patient.email)} ${patient.phone ? ` &bull; <i class="bi bi-whatsapp text-success me-1"></i>${window.escapeHTML(patient.phone)}` : ''}`;
        }

        if (results) results.classList.add('d-none');
        if (manualForm) manualForm.classList.add('d-none');

        const searchInput = document.getElementById('profBookingPatientSearch');
        if (searchInput) {
            searchInput.value = patient.name;
            searchInput.classList.remove('is-invalid');
        }

        // Auto-enfoque ergonómico a la fecha del turno
        setTimeout(() => {
            const dateInput = document.getElementById('profBookingDateInput');
            if (dateInput) {
                dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                dateInput.focus();
            }
        }, 180);
    }

    deselectProfPatient() {
        this.profBookingSelectedPatient = null;

        const container = document.getElementById('profSelectedPatientContainer');
        if (container) container.classList.add('d-none');

        const results = document.getElementById('profPatientSearchResults');
        if (results) results.classList.remove('d-none');

        const searchInput = document.getElementById('profBookingPatientSearch');
        if (searchInput) searchInput.value = '';

        this.filterProfPatientSearchResults('');
    }

    clearProfPatientSearch() {
        const searchInput = document.getElementById('profBookingPatientSearch');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        this.deselectProfPatient();
    }

    toggleNewPatientManualForm(show) {
        const manualForm = document.getElementById('profManualPatientForm');
        const results = document.getElementById('profPatientSearchResults');
        if (!manualForm) return;

        const isVisible = !manualForm.classList.contains('d-none');
        const willShow = (show !== undefined) ? show : !isVisible;

        if (willShow) {
            manualForm.classList.remove('d-none');
            if (results) results.classList.add('d-none');
            const nameInput = document.getElementById('manualPatientName');
            if (nameInput) nameInput.focus();
        } else {
            manualForm.classList.add('d-none');
            if (results) results.classList.remove('d-none');
        }
    }

    saveManualPatientForBooking() {
        const nameInput = document.getElementById('manualPatientName');
        const emailInput = document.getElementById('manualPatientEmail');
        const phoneInput = document.getElementById('manualPatientPhone');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        const phone = phoneInput ? (window.stripCountryCode ? window.stripCountryCode(phoneInput.value) : phoneInput.value.trim()) : '';

        if (!name || name.length < 2) {
            window.showToast('Por favor ingrese el nombre y apellido del paciente.', 'warning');
            if (nameInput) nameInput.focus();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            window.showToast('Por favor ingrese un correo electrónico válido para el paciente.', 'warning');
            if (emailInput) emailInput.focus();
            return;
        }

        const user = window.authService.loginOrCreateUser({
            name: name,
            email: email,
            phone: phone
        });

        const profId = this.profBookingDoctor ? this.profBookingDoctor.id : 'prof_1';
        const patientData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || phone,
            picture: user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0d6efd&color=fff`
        };

        // Habilitar a este paciente en la cartera médica exclusiva de este profesional
        window.storageService.addPatientToProfessional(profId, patientData);

        this.selectProfPatient(patientData);

        window.showToast(`Paciente "${name}" agregado a su lista y listo para agendar.`, 'info');
    }

    updateProfNewBookingSlots() {
        const container = document.getElementById('profBookingSlotsContainer');
        const dateInput = document.getElementById('profBookingDateInput');
        const hiddenSlot = document.getElementById('profBookingSelectedSlot');
        if (!container) return;

        const date = dateInput ? dateInput.value : '';
        const currentUser = window.authService?.currentUser;
        let prof = this.profBookingDoctor;
        if (!prof) {
            if (currentUser?.email) prof = window.storageService.getProfessionalByEmail(currentUser.email);
            if (!prof && currentUser?.professionalId) prof = window.storageService.getProfessionalById(currentUser.professionalId);
            if (!prof) prof = window.storageService.getProfessionals()[0];
            this.profBookingDoctor = prof;
        }
        const profId = prof ? prof.id : 'prof_1';

        this.profBookingSelectedSlot = null;
        if (hiddenSlot) hiddenSlot.value = '';

        if (!date) {
            container.innerHTML = `
                <div class="text-center text-muted small py-2">
                    <i class="bi bi-calendar3 me-1"></i> Seleccione una fecha para ver los horarios disponibles.
                </div>
            `;
            return;
        }

        const slotInfo = window.storageService.getAvailableSlots(date, profId);

        if (!slotInfo.available) {
            container.innerHTML = `
                <div class="alert alert-warning py-2 px-3 small text-center mb-0">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i> ${slotInfo.reason}
                </div>
            `;
            return;
        }

        // REGLA FUNDAMENTAL: Filtrar ÚNICAMENTE los turnos que están disponibles (isAvailable: true)
        // No mostrar turnos ya reservados por otros pacientes ni turnos que ya hayan pasado hoy
        const availableSlots = (slotInfo.slots || []).filter(s => s.isAvailable);

        if (availableSlots.length === 0) {
            container.innerHTML = `
                <div class="alert alert-secondary py-3 text-center mb-0">
                    <i class="bi bi-clock-history me-1"></i> No quedan horarios disponibles para el <strong>${this.formatDateFriendly(date)}</strong>.
                    <div class="small text-muted mt-1">Todos los turnos de este día ya han sido ocupados o ya ha transcurrido el horario de atención. Por favor elija otra fecha.</div>
                </div>
            `;
            return;
        }

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-2 px-1">
                <span class="small fw-semibold text-success">
                    <i class="bi bi-check-circle me-1"></i>${availableSlots.length} horarios disponibles
                </span>
                <span class="small text-muted">Duración: ${prof.slotDuration || 30} min</span>
            </div>
            <div class="d-flex flex-wrap gap-2 justify-content-center">
        `;
        availableSlots.forEach(slot => {
            html += `
                <button type="button" class="btn btn-outline-primary btn-sm slot-btn prof-slot-btn px-3 py-2 fw-semibold" 
                        data-time="${slot.time}" 
                        onclick="window.patientModule.selectProfBookingSlot(this, '${slot.time}')">
                    <i class="bi bi-clock me-1"></i>${slot.time} hs
                </button>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    selectProfBookingSlot(btn, time) {
        document.querySelectorAll('#profBookingSlotsContainer .prof-slot-btn').forEach(b => {
            b.classList.remove('active', 'btn-primary');
            b.classList.add('btn-outline-primary');
        });

        btn.classList.remove('btn-outline-primary');
        btn.classList.add('active', 'btn-primary');

        this.profBookingSelectedSlot = time;
        const hiddenSlot = document.getElementById('profBookingSelectedSlot');
        if (hiddenSlot) hiddenSlot.value = time;
    }

    submitProfNewBooking() {
        if (!this.profBookingSelectedPatient) {
            // Verificar si completó el formulario manual
            const name = document.getElementById('manualPatientName')?.value.trim();
            const email = document.getElementById('manualPatientEmail')?.value.trim();
            if (name && email) {
                this.saveManualPatientForBooking();
            }
        }

        if (!this.profBookingSelectedPatient) {
            window.showToast('Por favor busque y seleccione el paciente para agendar el turno.', 'warning');
            const searchInput = document.getElementById('profBookingPatientSearch');
            if (searchInput) searchInput.focus();
            return;
        }

        const dateInput = document.getElementById('profBookingDateInput');
        const date = dateInput ? dateInput.value : '';
        if (!date) {
            window.showToast('Por favor seleccione la fecha del turno.', 'warning');
            return;
        }

        const time = this.profBookingSelectedSlot || document.getElementById('profBookingSelectedSlot')?.value;
        if (!time) {
            window.showToast('Por favor seleccione un horario disponible.', 'warning');
            return;
        }

        const reasonSelect = document.getElementById('profBookingReasonSelect');
        const reason = reasonSelect ? reasonSelect.value : 'Consulta Odontológica General';

        const profId = this.profBookingDoctor ? this.profBookingDoctor.id : 'prof_1';

        try {
            const newAppt = window.storageService.createAppointment({
                patientUserId: this.profBookingSelectedPatient.id || null,
                patientName: this.profBookingSelectedPatient.name,
                patientEmail: this.profBookingSelectedPatient.email,
                patientPhone: this.profBookingSelectedPatient.phone || '',
                patientPicture: this.profBookingSelectedPatient.picture || '',
                professionalId: profId,
                date: date,
                time: time,
                reason: reason
            });

            // Cerrar modal
            const modalEl = document.getElementById('modalProfNewBooking');
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                document.body.classList.remove('modal-open');
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('padding-right');
            }

            // Notificación única de confirmación
            window.showToast(`¡Turno agendado exitosamente para ${newAppt.patientName} el ${newAppt.date} a las ${newAppt.time} hs!`, 'success');

            // Refrescar vistas en tiempo real
            this.renderMyTurnos();
            if (window.professionalModule) {
                window.professionalModule.renderAppointmentsList();
                window.professionalModule.renderStats();
            }
            if (window.secretaryModule) {
                window.secretaryModule.renderDailyDashboard();
            }
        } catch (err) {
            window.showToast(err.message || 'Error al agendar el turno.', 'danger');
        }
    }
}

window.patientModule = new PatientModule();
