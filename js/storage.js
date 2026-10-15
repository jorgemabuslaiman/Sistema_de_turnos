/**
 * STORAGE SERVICE - Centro Odontológico Multiprofesional
 * Gestión de 5 profesionales con motivos de consulta personalizados,
 * tiempos de consulta configurables (15, 30, 45, 60 min), control estricto de roles por Admin
 * y cálculo dinámico de turnos disponibles.
 */

const STORAGE_KEYS = {
    SETTINGS: 'dental_center_settings_v3',
    PROFESSIONALS: 'dental_professionals_v3',
    APPOINTMENTS: 'dental_appointments_v3',
    USERS: 'dental_users_v3',
    CURRENT_USER: 'dental_current_user_v3',
    AUDIT_LOGS: 'dental_audit_logs_v3',
    SPECIALTIES: 'dental_specialties_v3'
};

const DEFAULT_SETTINGS = {
    clinicName: 'Centro Odontológico Sonrisas & Salud',
    phone: '11 4455-6677',
    address: 'Av. Santa Fe 2450, Piso 3 - Consultorios A, B, C, D y E',
    googleClientId: '',
    allowAutoConfirm: true
};

const DEFAULT_SPECIALTIES = [
    'Ortodoncia y Ortopedia Maxilar',
    'Implantología y Cirugía Oral',
    'Odontopediatría y Prevención Infantil',
    'Endodoncia y Tratamiento de Conducto',
    'Periodoncia y Estética Dental',
    'Odontología General y Prótesis',
    'Cirugía Maxilofacial',
    'Estética Dental y Blanqueamiento'
];

// 5 Profesionales de distintas especialidades con motivos y tiempos configurables
const DEFAULT_PROFESSIONALS = [
    {
        id: 'prof_1',
        name: 'Dra. María Elena Gómez',
        specialty: 'Ortodoncia y Ortopedia Maxilar',
        email: 'dra.gomez@dental.com',
        phone: '11 4455-6677',
        consultorio: 'Consultorio A',
        slotDuration: 30, // 15, 30, 45 o 60 min
        picture: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300',
        reasons: [
            'Consulta Inicial de Ortodoncia',
            'Ajuste y Control de Brackets',
            'Control y Entrega de Alineadores Invisibles',
            'Retiro de Aparatología y Colocación de Retenedor',
            'Urgencia (Bracket suelto o alambre pinchando)'
        ],
        schedule: {
            0: { enabled: false, shifts: [] },
            1: { enabled: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }] },
            2: { enabled: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }] },
            3: { enabled: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }] },
            4: { enabled: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }] },
            5: { enabled: true, shifts: [{ start: '09:00', end: '14:00' }] },
            6: { enabled: false, shifts: [] }
        },
        blockedDates: []
    },
    {
        id: 'prof_2',
        name: 'Dr. Javier Morales',
        specialty: 'Implantología y Cirugía Oral',
        email: 'dr.morales@dental.com',
        phone: '11 5566-7788',
        consultorio: 'Consultorio B',
        slotDuration: 45,
        picture: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
        reasons: [
            'Evaluación Diagnóstica para Implantes Dentales',
            'Cirugía de Colocación de Implante Dental',
            'Control Postoperatorio y Retiro de Puntos',
            'Extracción Simple o Tercer Molar (Muela de Juicio)',
            'Rehabilitación Protésica y Corona sobre Implante'
        ],
        schedule: {
            0: { enabled: false, shifts: [] },
            1: { enabled: false, shifts: [] },
            2: { enabled: true, shifts: [{ start: '09:00', end: '13:30' }, { start: '14:30', end: '18:00' }] },
            3: { enabled: false, shifts: [] },
            4: { enabled: true, shifts: [{ start: '09:00', end: '13:30' }, { start: '14:30', end: '18:00' }] },
            5: { enabled: false, shifts: [] },
            6: { enabled: true, shifts: [{ start: '09:00', end: '13:30' }] }
        },
        blockedDates: []
    },
    {
        id: 'prof_3',
        name: 'Dra. Sofía Valenzuela',
        specialty: 'Odontopediatría y Prevención Infantil',
        email: 'dra.valenzuela@dental.com',
        phone: '11 6677-8899',
        consultorio: 'Consultorio C',
        slotDuration: 30,
        picture: 'https://images.unsplash.com/photo-1594824813622-487373f7c9e0?w=300',
        reasons: [
            'Primera Visita al Odontopediatra (Bebés y Niños)',
            'Control y Detección Temprana de Caries Infantil',
            'Limpieza, Profilaxis y Fluoración',
            'Selladores Preventivos de Fosas y Fisuras',
            'Urgencia Infantil (Traumatismo, Golpe o Dolor)'
        ],
        schedule: {
            0: { enabled: false, shifts: [] },
            1: { enabled: true, shifts: [{ start: '14:00', end: '19:30' }] },
            2: { enabled: false, shifts: [] },
            3: { enabled: true, shifts: [{ start: '14:00', end: '19:30' }] },
            4: { enabled: false, shifts: [] },
            5: { enabled: true, shifts: [{ start: '14:00', end: '19:30' }] },
            6: { enabled: false, shifts: [] }
        },
        blockedDates: []
    },
    {
        id: 'prof_4',
        name: 'Dr. Fernando Rossi',
        specialty: 'Endodoncia y Tratamiento de Conducto',
        email: 'dr.rossi@dental.com',
        phone: '11 7788-1122',
        consultorio: 'Consultorio D',
        slotDuration: 60,
        picture: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300',
        reasons: [
            'Evaluación de Dolor Pulpar Agudo / Endodoncia',
            'Tratamiento de Conducto Diente Anterior o Premolar',
            'Tratamiento de Conducto Molar (Multirradicular)',
            'Retratamiento de Conducto Complejo',
            'Urgencia por Absceso o Infección Aguda'
        ],
        schedule: {
            0: { enabled: false, shifts: [] },
            1: { enabled: true, shifts: [{ start: '10:00', end: '17:00' }] },
            2: { enabled: true, shifts: [{ start: '10:00', end: '17:00' }] },
            3: { enabled: true, shifts: [{ start: '10:00', end: '17:00' }] },
            4: { enabled: false, shifts: [] },
            5: { enabled: false, shifts: [] },
            6: { enabled: false, shifts: [] }
        },
        blockedDates: []
    },
    {
        id: 'prof_5',
        name: 'Dra. Luciana Benítez',
        specialty: 'Periodoncia y Estética Dental',
        email: 'dra.benitez@dental.com',
        phone: '11 8899-3344',
        consultorio: 'Consultorio E',
        slotDuration: 30,
        picture: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300',
        reasons: [
            'Consulta de Estética y Diseño de Sonrisa',
            'Limpieza Profunda, Raspaje y Alisado Radicular',
            'Blanqueamiento Dental LED en Consultorio',
            'Evaluación para Carillas Dentales de Porcelana',
            'Tratamiento de Encías Sangrantes (Gingivitis)'
        ],
        schedule: {
            0: { enabled: false, shifts: [] },
            1: { enabled: false, shifts: [] },
            2: { enabled: true, shifts: [{ start: '09:00', end: '14:00' }] },
            3: { enabled: false, shifts: [] },
            4: { enabled: true, shifts: [{ start: '09:00', end: '14:00' }] },
            5: { enabled: true, shifts: [{ start: '09:00', end: '14:00' }] },
            6: { enabled: false, shifts: [] }
        },
        blockedDates: []
    }
];

const DEFAULT_USERS = [
    {
        id: 'usr_admin',
        name: 'Martín Bossi (Administrador)',
        email: 'admin@clinica.com',
        role: 'admin',
        phone: '11 1111-2222',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    },
    {
        id: 'usr_sec',
        name: 'Ana Laura López (Secretaría y Recepción)',
        email: 'secretaria@clinica.com',
        role: 'secretaria',
        phone: '11 2222-3333',
        picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    },
    {
        id: 'usr_prof_1',
        name: 'Dra. María Elena Gómez',
        email: 'dra.gomez@dental.com',
        role: 'profesional',
        professionalId: 'prof_1',
        phone: '11 4455-6677',
        picture: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'
    },
    {
        id: 'usr_prof_2',
        name: 'Dr. Javier Morales',
        email: 'dr.morales@dental.com',
        role: 'profesional',
        professionalId: 'prof_2',
        phone: '11 5566-7788',
        picture: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'
    },
    {
        id: 'usr_prof_3',
        name: 'Dra. Sofía Valenzuela',
        email: 'dra.valenzuela@dental.com',
        role: 'profesional',
        professionalId: 'prof_3',
        phone: '11 6677-8899',
        picture: 'https://images.unsplash.com/photo-1594824813622-487373f7c9e0?w=150'
    },
    {
        id: 'usr_prof_4',
        name: 'Dr. Fernando Rossi',
        email: 'dr.rossi@dental.com',
        role: 'profesional',
        professionalId: 'prof_4',
        phone: '11 7788-1122',
        picture: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150'
    },
    {
        id: 'usr_prof_5',
        name: 'Dra. Luciana Benítez',
        email: 'dra.benitez@dental.com',
        role: 'profesional',
        professionalId: 'prof_5',
        phone: '11 8899-3344',
        picture: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150'
    },
    {
        id: 'usr_paciente_1',
        name: 'Lucas Martínez',
        email: 'lucas.martinez@gmail.com',
        role: 'paciente',
        phone: '11 9876-5432',
        picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
        id: 'usr_paciente_2',
        name: 'Camila Rodriguez',
        email: 'camila.rodriguez@gmail.com',
        role: 'paciente',
        phone: '11 3344-5566',
        picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    }
];

function generateInitialAppointments() {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    const addDays = (d, count) => {
        const res = new Date(d);
        res.setDate(res.getDate() + count);
        return res;
    };

    const d0 = formatDate(today);
    const d1 = formatDate(addDays(today, 1));
    const d2 = formatDate(addDays(today, 2));

    return [
        {
            id: 'trn_100',
            patientUserId: 'usr_paciente_1',
            professionalId: 'prof_1',
            professionalName: 'Dra. María Elena Gómez',
            patientName: 'Lucas Martínez',
            patientEmail: 'lucas.martinez@gmail.com',
            patientPhone: '11 9876-5432',
            date: formatDate(addDays(today, -7)),
            time: '09:30',
            duration: 30,
            reason: 'Consulta Odontológica General',
            status: 'atendido',
            createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString()
        },
        {
            id: 'trn_101',
            patientUserId: 'usr_paciente_1',
            professionalId: 'prof_1',
            professionalName: 'Dra. María Elena Gómez',
            patientName: 'Lucas Martínez',
            patientEmail: 'lucas.martinez@gmail.com',
            patientPhone: '11 9876-5432',
            date: d0,
            time: '10:00',
            duration: 30,
            reason: 'Ajuste y Control de Brackets',
            status: 'confirmado',
            createdAt: new Date().toISOString()
        },
        {
            id: 'trn_102',
            patientUserId: 'usr_paciente_2',
            professionalId: 'prof_2',
            professionalName: 'Dr. Javier Morales',
            patientName: 'Camila Rodriguez',
            patientEmail: 'camila.rodriguez@gmail.com',
            patientPhone: '11 3344-5566',
            date: d0,
            time: '11:15',
            duration: 45,
            reason: 'Evaluación para Implantes Dentales',
            status: 'confirmado',
            createdAt: new Date().toISOString()
        },
        {
            id: 'trn_103',
            professionalId: 'prof_4',
            professionalName: 'Dr. Fernando Rossi',
            patientName: 'Martín Pérez',
            patientEmail: 'martin.perez@gmail.com',
            patientPhone: '11 7788-9900',
            date: d1,
            time: '11:00',
            duration: 60,
            reason: 'Evaluación de Endodoncia',
            status: 'pendiente',
            createdAt: new Date().toISOString()
        },
        {
            id: 'trn_104',
            professionalId: 'prof_5',
            professionalName: 'Dra. Luciana Benítez',
            patientName: 'Ana Clara Bianchi',
            patientEmail: 'ana.bianchi@gmail.com',
            patientPhone: '11 2233-4455',
            date: d2,
            time: '10:30',
            duration: 30,
            reason: 'Blanqueamiento Dental LED en Consultorio',
            status: 'confirmado',
            createdAt: new Date().toISOString()
        }
    ];
}

function generateInitialAuditLogs() {
    return [
        {
            id: 'log_init_1',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
            formattedDate: new Date(Date.now() - 3600000 * 24).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' }),
            action: 'SISTEMA_INICIALIZADO',
            details: 'Inicialización de la agenda virtual con 5 especialistas odontológicos y secretaría.',
            user: 'Martín Bossi',
            role: 'admin'
        },
        {
            id: 'log_init_2',
            timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
            formattedDate: new Date(Date.now() - 3600000 * 12).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' }),
            action: 'CONFIGURACION_MEDICA',
            details: 'Dra. María Elena Gómez configuró tiempos de consulta de 30 min y 5 motivos de ortodoncia.',
            user: 'Dra. María Elena Gómez',
            role: 'profesional'
        },
        {
            id: 'log_init_3',
            timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
            formattedDate: new Date(Date.now() - 3600000 * 4).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' }),
            action: 'USUARIO_CREADO',
            details: 'Cuenta de recepción asignada a Ana López (secretaría general).',
            user: 'Martín Bossi',
            role: 'admin'
        }
    ];
}

class StorageService {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        } else {
            try {
                const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
                if (s && s.phone && (s.phone.includes('+54') || s.phone.startsWith('549'))) {
                    s.phone = this.cleanLocalPhone(s.phone);
                    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
                }
            } catch {}
        }
        if (!localStorage.getItem(STORAGE_KEYS.PROFESSIONALS)) {
            localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(DEFAULT_PROFESSIONALS));
        } else {
            try {
                const profs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFESSIONALS));
                if (Array.isArray(profs)) {
                    let changed = false;
                    profs.forEach(p => {
                        if (p.phone && (p.phone.includes('+54') || p.phone.startsWith('549'))) {
                            p.phone = this.cleanLocalPhone(p.phone);
                            changed = true;
                        }
                    });
                    if (changed) localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(profs));
                }
            } catch {}
        }
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        } else {
            try {
                const usrs = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
                if (Array.isArray(usrs)) {
                    let changed = false;
                    usrs.forEach(u => {
                        if (u.phone && (u.phone.includes('+54') || u.phone.startsWith('549'))) {
                            u.phone = this.cleanLocalPhone(u.phone);
                            changed = true;
                        }
                    });
                    if (changed) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usrs));
                }
            } catch {}
        }
        if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(generateInitialAppointments()));
        } else {
            // Garantizar que la agenda de turnos no retenga diagnósticos ni notas en turnos previos y limpie teléfonos
            try {
                const rawAppts = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS));
                if (Array.isArray(rawAppts)) {
                    let changed = false;
                    rawAppts.forEach(a => {
                        if (a.diagnosis !== undefined) { delete a.diagnosis; changed = true; }
                        if (a.treatment !== undefined) { delete a.treatment; changed = true; }
                        if (a.nextControl !== undefined) { delete a.nextControl; changed = true; }
                        if (a.notes !== undefined) { delete a.notes; changed = true; }
                        if (a.patientPhone && (a.patientPhone.includes('+54') || a.patientPhone.startsWith('549'))) {
                            a.patientPhone = this.cleanLocalPhone(a.patientPhone);
                            changed = true;
                        }
                    });
                    if (changed) {
                        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(rawAppts));
                    }
                }
            } catch {}
        }
        if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
            localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(generateInitialAuditLogs()));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SPECIALTIES)) {
            localStorage.setItem(STORAGE_KEYS.SPECIALTIES, JSON.stringify(DEFAULT_SPECIALTIES));
        }
    }

    // Configuración General
    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    }

    saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }

    // Profesionales
    getProfessionals() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFESSIONALS));
            return Array.isArray(data) ? data : DEFAULT_PROFESSIONALS;
        } catch {
            return DEFAULT_PROFESSIONALS;
        }
    }

    saveProfessionals(list) {
        localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(list));
    }

    getProfessionalById(profId) {
        if (!profId) return null;
        const list = this.getProfessionals();
        return list.find(p => p.id === profId) || null;
    }

    getProfessionalByEmail(email) {
        const list = this.getProfessionals();
        return list.find(p => p.email.toLowerCase() === email.toLowerCase());
    }

    // Guardar configuración propia del profesional (horarios, duración 15/30/45/60 y motivos)
    saveProfessionalConfig(profId, { schedule, slotDuration, reasons }) {
        const list = this.getProfessionals();
        const prof = list.find(p => p.id === profId);
        if (prof) {
            if (schedule) prof.schedule = schedule;
            if (slotDuration) prof.slotDuration = parseInt(slotDuration, 10);
            if (reasons && Array.isArray(reasons)) prof.reasons = reasons;
            this.saveProfessionals(list);
            return prof;
        }
        return null;
    }

    cleanLocalPhone(rawPhone) {
        if (!rawPhone) return '';
        let p = String(rawPhone).trim();
        p = p.replace(/^(\+?54[\s-]*9|\+?54|0054[\s-]*9|0054|54[\s-]*9|549)[\s-]*/i, '').trim();
        return p;
    }

    // Actualizar datos de perfil del profesional (nombre, consultorio, especialidad, mail, teléfono para WhatsApp)
    updateProfessionalProfile(profId, { name, consultorio, specialty, email, phone }) {
        const list = this.getProfessionals();
        const prof = list.find(p => p.id === profId);
        if (!prof) return null;

        const oldEmail = prof.email;

        if (name) prof.name = name.trim();
        if (consultorio !== undefined) prof.consultorio = consultorio.trim();
        if (specialty) prof.specialty = specialty.trim();
        if (email) prof.email = email.trim();
        if (phone !== undefined) prof.phone = this.cleanLocalPhone(phone);

        this.saveProfessionals(list);

        // Actualizar usuario en lista de usuarios
        const users = this.getUsers();
        const user = users.find(u => (u.professionalId === profId) || (u.email && u.email.toLowerCase() === oldEmail.toLowerCase()));
        if (user) {
            if (name) user.name = name.trim();
            if (email) user.email = email.trim();
            if (phone !== undefined) user.phone = this.cleanLocalPhone(phone);
            this.saveUsers(users);

            // Si es la sesión activa en authService, sincronizar de inmediato
            if (window.authService && window.authService.currentUser && window.authService.currentUser.id === user.id) {
                window.authService.currentUser.name = user.name;
                window.authService.currentUser.email = user.email;
                window.authService.currentUser.phone = user.phone;
                window.authService.saveSession(window.authService.currentUser);
                if (typeof window.authService.updateNavbarUser === 'function') {
                    window.authService.updateNavbarUser();
                }
            }
        }

        // Mantener sincronizados los turnos con el nuevo nombre y especialidad del profesional
        const appointments = this.getAppointments();
        let apptsChanged = false;
        appointments.forEach(a => {
            if (a.professionalId === profId) {
                if (name) a.professionalName = name.trim();
                if (specialty) a.professionalSpecialty = specialty.trim();
                apptsChanged = true;
            }
        });
        if (apptsChanged) {
            this.saveAppointments(appointments);
        }

        this.addAuditLog('PERFIL_PROFESIONAL_ACTUALIZADO', `El profesional ${prof.name} actualizó sus datos (Consultorio: ${prof.consultorio}, Especialidad: ${prof.specialty}, Teléfono WhatsApp: ${prof.phone}).`);

        return prof;
    }

    // Gestión de Especialidades Odontológicas (Cargadas por el Administrador)
    getSpecialties() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALTIES));
            if (Array.isArray(data) && data.length > 0) return data;
        } catch {}
        const profs = this.getProfessionals();
        const profSpecialties = profs.map(p => p.specialty).filter(Boolean);
        const list = Array.from(new Set([...DEFAULT_SPECIALTIES, ...profSpecialties]));
        this.saveSpecialties(list);
        return list;
    }

    saveSpecialties(list) {
        localStorage.setItem(STORAGE_KEYS.SPECIALTIES, JSON.stringify(list));
    }

    addSpecialty(name) {
        const trimmed = (name || '').trim();
        if (!trimmed) return false;
        const list = this.getSpecialties();
        if (!list.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
            list.push(trimmed);
            this.saveSpecialties(list);
            this.addAuditLog('ESPECIALIDAD_AGREGADA', `Administración agregó la especialidad: ${trimmed}`);
            return true;
        }
        return false;
    }

    deleteSpecialty(name) {
        let list = this.getSpecialties();
        const initialLen = list.length;
        list = list.filter(s => s.toLowerCase() !== (name || '').toLowerCase());
        if (list.length !== initialLen) {
            this.saveSpecialties(list);
            this.addAuditLog('ESPECIALIDAD_ELIMINADA', `Administración eliminó la especialidad: ${name}`);
            return true;
        }
        return false;
    }

    addProfessionalBlockedDate(profId, dateStr, reason) {
        const list = this.getProfessionals();
        const prof = list.find(p => p.id === profId);
        if (prof) {
            if (!prof.blockedDates) prof.blockedDates = [];
            if (!prof.blockedDates.some(b => b.date === dateStr)) {
                prof.blockedDates.push({ date: dateStr, reason: reason || 'Día no laboral' });
                this.saveProfessionals(list);
            }
        }
    }

    removeProfessionalBlockedDate(profId, dateStr) {
        const list = this.getProfessionals();
        const prof = list.find(p => p.id === profId);
        if (prof && prof.blockedDates) {
            prof.blockedDates = prof.blockedDates.filter(b => b.date !== dateStr);
            this.saveProfessionals(list);
        }
    }

    // GESTIÓN DE PACIENTES EXCLUSIVOS POR PROFESIONAL
    // Cada nuevo paciente que pide turno habilita a ese profesional a tenerlo en su lista
    getPatientsForProfessional(profId) {
        if (!profId) return [];
        const appts = this.getAppointments() || [];
        const users = this.getUsers() || [];
        const map = new Map();

        // 1. Pacientes que tienen o han tenido turnos agendados con este profesional
        const profAppts = appts.filter(a => a.professionalId === profId);
        profAppts.forEach(a => {
            const emailKey = (a.patientEmail || '').toLowerCase().trim();
            if (!emailKey) return;
            if (!map.has(emailKey)) {
                const matchedUser = users.find(u => 
                    (a.patientUserId && u.id === a.patientUserId) || 
                    (u.email && u.email.toLowerCase().trim() === emailKey)
                );
                map.set(emailKey, {
                    id: a.patientUserId || (matchedUser ? matchedUser.id : null),
                    name: (matchedUser && matchedUser.name) || a.patientName || 'Paciente',
                    email: a.patientEmail,
                    phone: (matchedUser && matchedUser.phone) || a.patientPhone || '',
                    picture: (matchedUser && matchedUser.picture) || a.patientPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.patientName || 'Paciente')}&background=0d6efd&color=fff`
                });
            }
        });

        // 2. Pacientes cargados o habilitados manualmente por este profesional
        try {
            const manualList = JSON.parse(localStorage.getItem('dental_prof_patients_' + profId)) || [];
            if (Array.isArray(manualList)) {
                manualList.forEach(p => {
                    const emailKey = (p.email || '').toLowerCase().trim();
                    if (emailKey && !map.has(emailKey)) {
                        map.set(emailKey, p);
                    }
                });
            }
        } catch {}

        return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    addPatientToProfessional(profId, patient) {
        if (!profId || !patient || !patient.email) return;
        try {
            const key = 'dental_prof_patients_' + profId;
            const list = JSON.parse(localStorage.getItem(key)) || [];
            const emailKey = (patient.email || '').toLowerCase().trim();
            if (!list.some(p => (p.email || '').toLowerCase().trim() === emailKey)) {
                list.push({
                    id: patient.id || null,
                    name: patient.name || 'Paciente',
                    email: patient.email,
                    phone: this.cleanLocalPhone(patient.phone || ''),
                    picture: patient.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name || 'Paciente')}&background=0d6efd&color=fff`
                });
                localStorage.setItem(key, JSON.stringify(list));
            }
        } catch {}
    }

    // Turnos
    getAppointments() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS));
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    saveAppointments(appointments) {
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    }

    createAppointment(data) {
        const currentUser = window.authService?.currentUser;

        const appointments = this.getAppointments();
        const prof = this.getProfessionalById(data.professionalId);

        const exists = appointments.find(a => 
            a.professionalId === data.professionalId &&
            a.date === data.date && 
            a.time === data.time && 
            a.status !== 'cancelado'
        );

        if (exists) {
            throw new Error(`El turno de las ${data.time} hs con ${prof ? prof.name : 'el profesional'} ya fue reservado. Por favor seleccione otro horario.`);
        }

        const settings = this.getSettings();

        // Determinar patientUserId y patientPicture
        let patientUserId = data.patientUserId || null;
        let patientPicture = data.patientPicture || '';
        if (!patientUserId && currentUser && currentUser.role === 'paciente') {
            patientUserId = currentUser.id;
            patientPicture = currentUser.picture || '';
        }
        if (!patientPicture && (patientUserId || data.patientEmail)) {
            const users = this.getUsers();
            const matchedUser = users.find(u => 
                (patientUserId && u.id === patientUserId) || 
                (data.patientEmail && u.email && u.email.toLowerCase() === data.patientEmail.toLowerCase())
            );
            if (matchedUser) {
                if (!patientUserId) patientUserId = matchedUser.id;
                if (matchedUser.picture) patientPicture = matchedUser.picture;
            }
        }

        const cleanPatientPhone = this.cleanLocalPhone(data.patientPhone || '');

        const newAppointment = {
            id: 'trn_' + Date.now(),
            patientUserId: patientUserId,
            patientPicture: patientPicture,
            professionalId: data.professionalId,
            professionalName: prof ? prof.name : 'Odontólogo/a del Centro',
            professionalSpecialty: prof ? prof.specialty : '',
            professionalPicture: prof ? prof.picture : '',
            professionalConsultorio: prof ? prof.consultorio : '',
            patientName: data.patientName,
            patientEmail: data.patientEmail,
            patientPhone: cleanPatientPhone,
            date: data.date,
            time: data.time,
            duration: parseInt((prof && prof.slotDuration) || 30, 10),
            reason: data.reason || 'Consulta General',
            status: settings.allowAutoConfirm ? 'confirmado' : 'pendiente',
            createdAt: new Date().toISOString()
        };

        appointments.push(newAppointment);
        this.saveAppointments(appointments);

        // Asociar este paciente permanentemente a la cartera de este profesional
        this.addPatientToProfessional(data.professionalId, {
            id: patientUserId,
            name: data.patientName,
            email: data.patientEmail,
            phone: cleanPatientPhone,
            picture: patientPicture
        });

        // Registrar en Auditoría Exclusiva de Administración
        let auditAction = 'TURNO_CREADO_PACIENTE';
        let actorLabel = 'Paciente';
        if (currentUser) {
            if (currentUser.role === 'secretaria' || currentUser.role === 'admin') {
                auditAction = 'TURNO_CREADO_SECRETARIA';
                actorLabel = 'Secretaría';
            } else if (currentUser.role === 'profesional') {
                auditAction = 'TURNO_CREADO_PROFESIONAL';
                actorLabel = 'Profesional';
            }
        }

        this.addAuditLog({
            action: auditAction,
            details: `${actorLabel} agendó turno para ${data.patientName} (${data.patientEmail}) con ${prof ? prof.name : data.professionalId} el ${data.date} a las ${data.time} hs (${data.reason || 'Consulta'}).`,
            user: currentUser ? currentUser.name : data.patientName,
            role: currentUser ? currentUser.role : 'paciente'
        });

        return newAppointment;
    }

    updateAppointmentStatus(id, newStatus, cancellationReason = '') {
        const appointments = this.getAppointments();
        const appt = appointments.find(a => a.id === id);
        if (appt) {
            const oldStatus = appt.status;
            appt.status = newStatus;
            if (cancellationReason) appt.cancellationReason = cancellationReason;
            appt.updatedAt = new Date().toISOString();
            this.saveAppointments(appointments);

            const currentUser = window.authService?.currentUser;
            this.addAuditLog({
                action: newStatus === 'cancelado' ? 'TURNO_CANCELADO' : 'TURNO_ESTADO_' + newStatus.toUpperCase(),
                details: `Turno de ${appt.patientName} con ${appt.professionalName} (${appt.date} a las ${appt.time} hs) cambió de [${oldStatus}] a [${newStatus}]. Motivo: ${cancellationReason || 'Sin motivo especificado'}.`,
                user: currentUser ? currentUser.name : appt.patientName,
                role: currentUser ? currentUser.role : 'paciente'
            });

            return appt;
        }
        return null;
    }

    // Comprobar si el paciente ya canceló un turno con un profesional específico en cierta fecha
    hasPatientCancelledOnDateWithProf(patientId, patientEmail, profId, date) {
        if (!profId || !date) return false;
        const cleanEmail = (patientEmail || '').toLowerCase().trim();
        const appts = this.getAppointments();
        return appts.some(a => 
            a.status === 'cancelado' &&
            a.professionalId === profId &&
            a.date === date &&
            (
                (patientId && a.patientUserId === patientId) ||
                (cleanEmail && a.patientEmail && a.patientEmail.toLowerCase().trim() === cleanEmail)
            )
        );
    }

    // Reprogramar / modificar un turno existente del paciente
    rescheduleAppointment(id, newDate, newTime, newReason) {
        const appointments = this.getAppointments();
        const appt = appointments.find(a => a.id === id);
        if (!appt) throw new Error('Turno no encontrado.');

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (newDate < todayStr) {
            throw new Error('No es posible reprogramar un turno a una fecha pasada.');
        }

        // Si el turno original es para hoy, verificar estrictamente que falten al menos 3 horas
        if (appt.date === todayStr) {
            const [apptHour, apptMin] = appt.time.split(':').map(Number);
            const apptTotalMins = apptHour * 60 + apptMin;
            const currentTotalMins = now.getHours() * 60 + now.getMinutes();
            const diffHours = (apptTotalMins - currentTotalMins) / 60;
            if (diffHours < 3) {
                throw new Error('La modificación de turnos para el mismo día solo puede realizarse con al menos 3 horas de anticipación.');
            }
        }

        // Verificar que no esté en conflicto con otro turno activo
        const conflict = appointments.find(a => 
            a.id !== id &&
            a.professionalId === appt.professionalId &&
            a.date === newDate &&
            a.time === newTime &&
            a.status !== 'cancelado'
        );

        if (conflict) {
            throw new Error(`El horario de las ${newTime} hs ya fue reservado por otro paciente. Por favor elija otro horario.`);
        }

        const oldDate = appt.date;
        const oldTime = appt.time;
        appt.date = newDate;
        appt.time = newTime;
        if (newReason) appt.reason = newReason;
        appt.updatedAt = new Date().toISOString();

        this.saveAppointments(appointments);

        const currentUser = window.authService?.currentUser;
        this.addAuditLog({
            action: 'TURNO_MODIFICADO_PACIENTE',
            details: `Turno de ${appt.patientName} (${appt.patientEmail}) con ${appt.professionalName} modificado de ${oldDate} ${oldTime} hs a ${newDate} ${newTime} hs (${newReason || appt.reason}).`,
            user: currentUser ? currentUser.name : appt.patientName,
            role: currentUser ? currentUser.role : 'paciente'
        });

        return appt;
    }

    deleteAppointment(id) {
        let appointments = this.getAppointments();
        const appt = appointments.find(a => a.id === id);
        appointments = appointments.filter(a => a.id !== id);
        this.saveAppointments(appointments);

        const currentUser = window.authService?.currentUser;
        this.addAuditLog({
            action: 'TURNO_ELIMINADO',
            details: `Turno eliminado del sistema: ${appt ? `${appt.patientName} con ${appt.professionalName} (${appt.date} ${appt.time} hs)` : id}`,
            user: currentUser ? currentUser.name : 'Administrador',
            role: currentUser ? currentUser.role : 'admin'
        });
    }

    // ==========================================
    // REGISTRO DE AUDITORÍA (EXCLUSIVO ADMINISTRADOR)
    // ==========================================
    getAuditLogs() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    saveAuditLogs(logs) {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    }

    addAuditLog({ action, details, user, role }) {
        const logs = this.getAuditLogs();
        const currentUser = window.authService?.currentUser;
        const userName = user || (currentUser ? currentUser.name : 'Usuario Web / Paciente');
        const userRole = role || (currentUser ? currentUser.role : 'paciente');
        
        const newLog = {
            id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            formattedDate: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' }),
            action: action,
            details: details,
            user: userName,
            role: userRole
        };

        logs.unshift(newLog);
        if (logs.length > 300) logs.pop();
        this.saveAuditLogs(logs);

        // Notificar en tiempo real al panel admin si está activo
        if (window.adminModule && typeof window.adminModule.renderAuditLogs === 'function') {
            window.adminModule.renderAuditLogs();
        }

        return newLog;
    }

    clearAuditLogs() {
        this.saveAuditLogs([]);
    }

    // Usuarios y Roles
    getUsers() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    saveUsers(users) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    findUserByEmail(email) {
        const users = this.getUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    upsertUser(userData) {
        const users = this.getUsers();
        const cleanData = { ...userData };
        if (cleanData.phone !== undefined) {
            cleanData.phone = this.cleanLocalPhone(cleanData.phone);
        }
        const index = users.findIndex(u => u.email.toLowerCase() === cleanData.email.toLowerCase());
        if (index >= 0) {
            users[index] = { ...users[index], ...cleanData };
            this.saveUsers(users);
            return users[index];
        } else {
            const newUser = {
                id: 'usr_' + Date.now(),
                name: cleanData.name || 'Usuario',
                email: cleanData.email,
                role: cleanData.role || 'paciente',
                phone: cleanData.phone || '',
                picture: cleanData.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanData.name || 'U')}&background=0d6efd&color=fff`,
                createdAt: new Date().toISOString()
            };
            if (cleanData.professionalId) newUser.professionalId = cleanData.professionalId;
            users.push(newUser);
            this.saveUsers(users);
            return newUser;
        }
    }

    updateUserRole(userId, newRole) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.role = newRole;
            this.saveUsers(users);
            return user;
        }
        return null;
    }

    // Sesión
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
        } catch {
            return null;
        }
    }

    setCurrentUser(user) {
        if (!user) {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        } else {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        }
    }

    // ==========================================
    // CÁLCULO DE DISPONIBILIDAD (15, 30, 45, 60 MIN)
    // ==========================================
    getAvailableSlots(dateString, professionalId) {
        if (!professionalId) return { available: false, reason: 'Seleccione un profesional odontólogo/a para consultar horarios.', slots: [] };
        if (!dateString) return { available: false, reason: 'Seleccione una fecha.', slots: [] };

        const prof = this.getProfessionalById(professionalId);
        if (!prof) return { available: false, reason: 'Profesional no encontrado.', slots: [] };

        const [year, month, day] = dateString.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();

        if (prof.blockedDates && prof.blockedDates.some(b => b.date === dateString)) {
            return {
                available: false,
                reason: `${prof.name} no atiende en esta fecha (Día no laboral / Vacaciones).`,
                slots: []
            };
        }

        const schedule = prof.schedule;
        const dayConfig = schedule ? schedule[dayOfWeek] : null;

        if (!dayConfig || !dayConfig.enabled || !dayConfig.shifts || dayConfig.shifts.length === 0) {
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            return {
                available: false,
                reason: `${prof.name} no atiende los días ${dayNames[dayOfWeek]}.`,
                slots: []
            };
        }

        // Duración configurada por el profesional (15, 30, 45 o 60 min)
        const slotDuration = parseInt(prof.slotDuration || 30, 10);

        const appointments = this.getAppointments().filter(a => 
            a.professionalId === prof.id &&
            a.date === dateString && 
            a.status !== 'cancelado'
        );
        const occupiedTimes = new Set(appointments.map(a => a.time));

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (dateString < todayStr) {
            return {
                available: false,
                reason: 'No es posible agendar turnos en fechas pasadas.',
                slots: []
            };
        }

        const isToday = (
            now.getFullYear() === year &&
            now.getMonth() === (month - 1) &&
            now.getDate() === day
        );
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const generatedSlots = [];

        dayConfig.shifts.forEach(shift => {
            const [startHour, startMin] = shift.start.split(':').map(Number);
            const [endHour, endMin] = shift.end.split(':').map(Number);

            let slotStartMinutes = startHour * 60 + startMin;
            const shiftEndMinutes = endHour * 60 + endMin;

            while (slotStartMinutes + slotDuration <= shiftEndMinutes) {
                const h = Math.floor(slotStartMinutes / 60);
                const m = slotStartMinutes % 60;
                const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

                const isPast = isToday && (slotStartMinutes <= currentMinutes + 15);
                const isBooked = occupiedTimes.has(timeString);

                generatedSlots.push({
                    time: timeString,
                    isAvailable: !isPast && !isBooked,
                    isBooked: isBooked,
                    isPast: isPast
                });

                slotStartMinutes += slotDuration;
            }
        });

        return {
            available: true,
            slots: generatedSlots,
            professional: prof
        };
    }

    resetToDefaults() {
        localStorage.clear();
        this.init();
    }
}

window.storageService = new StorageService();
