// Lista me ta wriaia time slots pou emfanizontai sto calendar
const TIME_SLOTS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00'
];

// Lista me tis hmera tis vdomadas se sira Monday–Sunday
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Oros gia na krataei pia vdomada deixnoume sto calendar
let currentWeekStart = getMonday(new Date());

// Pinakas pou gemizei me ola ta sessions pou fernei h vasi
let allSessions = [];

// Kratame to session pou exoume epileksei gia action modal
let selectedSessionId = null;

// Arxikopoiisi tis selidas. Kleinei past sessions kai fortonei tin vdomada.
async function init() {
    await closePastSessions();
    await loadWeek();
}

// Kaloume to init amesws wste na trexei molis fortwsei h selida
init();

// Vriskei to Monday tis vdomadas apo mia δοσμενη imerominia
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// Allazei tin vdomada me direction (+1 epomeni, -1 prohgoumeni)
function changeWeek(direction) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
    loadWeek();
}

// Fortmatarisma imerominias se YYYY-MM-DD (pou thelei h vasi)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Ananewnei to label panw pou deixnei Monday - Sunday tis evdomadas
function updateWeekLabel() {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);

    const startStr = currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    document.getElementById('weekLabel').textContent = `${startStr} - ${endStr}`;
}

// Fortonei sessions gia tin trexousa vdomada — 7 calls, ena gia kathe imera
async function loadWeek() {
    updateWeekLabel();

    try {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() + i);
            dates.push(formatDate(d));
        }

        // Fetch all dates in parallel
        const fetches = dates.map(dateStr =>
            fetch(`get_all_day_sessions.php?date=${dateStr}`)
                .then(r => r.json())
                .catch(e => ({ success: false, error: String(e) }))
        );

        const results = await Promise.all(fetches);

        const collected = [];
        for (const res of results) {
            if (!res || !res.success) {
                // skip but log so admin can inspect console
                console.warn('get_all_day_sessions error for a date:', res && res.error ? res.error : res);
                continue;
            }
            const daySessions = (res.sessions || []).map(s => {
                const copy = Object.assign({}, s);
                if (typeof copy.booked_count === 'undefined' && typeof copy.spots_left !== 'undefined' && typeof copy.capacity !== 'undefined') {
                    copy.booked_count = Math.max(0, (parseInt(copy.capacity, 10) || 0) - (parseInt(copy.spots_left, 10) || 0));
                }
                return copy;
            });
            collected.push(...daySessions);
        }

        allSessions = collected;
        renderWeeklyCalendar();

    } catch (error) {
        console.error('Error in loadWeek:', error);
        const alertDiv = document.getElementById('alert');
        if (alertDiv) alertDiv.innerHTML = `<div class="alert alert-error">Error loading sessions: ${error.message || error}</div>`;
    }
}
// Ftiaxnei to weekly calendar sto DOM
function renderWeeklyCalendar() {
    const calendar = document.getElementById('weeklyCalendar');

    // Prwti kenh gwnia sto grid (keno koutaki panw aristera)
    let html = '<div class="calendar-header" style="grid-column: 1;"></div>';

    // Ftiaxnoume ta header cells gia tis 7 hmeres tis vdomadas
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        const dayName = DAYS[i];
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        // Prosthetoume to header tou kathe day
        html += `<div class="calendar-header">${dayName}<br>${dateStr}</div>`;
    }

    // To "tora" gia na checkarei past sessions
    const now = new Date();

    // Gia kathe time slot (07:00 - 21:00)
    TIME_SLOTS.forEach(timeSlot => {

        // Deixnoume thn ora sto aristero pleuro tou grid
        html += `<div class="time-label">${timeSlot}</div>`;

        // Ftiaxnoume 7 cells, mia gia kathe imera
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            const dateStr = formatDate(date);

            // Briskoume posa sessions yparxoun sto sygkekrimeno slot
            const sessionsInSlot = getSessionsForSlot(dateStr, timeSlot);

            // Ftiaxnoume to slot (box) pou otan kaneis click anoigei to add modal
            html += `<div class="time-slot" onclick="openAddModal('${dateStr}', '${timeSlot}')">`;

            // An yparxoun sessions sto slot, ta deixnoume
            if (sessionsInSlot.length > 0) {

                sessionsInSlot.forEach(session => {
                    const booked = session.booked_count || 0;
                    const available = session.capacity - booked;

                    // Ftiaxnoume class gia closed/cancelled/past sessions
                    let statusClass = '';
                    if (session.status === 'closed') {
                        statusClass = 'closed';
                    } else if (session.status === 'cancelled') {
                        statusClass = 'cancelled';
                    }

                    // Check an to session einai sto parelthon
                    const sessionEnd = new Date(session.time_end);
                    if (sessionEnd < now) {
                        statusClass += (statusClass ? ' ' : '') + 'past';
                    }

                    // Ftiaxnoume to session card mesa sto slot
                    html += `
                        <div class="session-card ${statusClass}" 
                             onclick="event.stopPropagation(); openSessionActionModal(${session.session_id || 0})">
                            <div class="level">${session.level}</div>
                            <div class="capacity">${available}/${session.capacity} spots</div>
                        </div>
                    `;
                });
            }

            // Kleinoume to time-slot box
            html += '</div>';
        }
    });

    // Bazoume to teliko HTML sto calendar
    calendar.innerHTML = html;

    // Bazoume to class gia na energopoihsei to CSS grid
    calendar.className = 'weekly-calendar';
}

// Vriskei ola ta sessions pou anikoun se sygkekrimeni imera + ora
function getSessionsForSlot(date, time) {

    // Filtraroume ola ta sessions pou exoume ginei fetch apo tin vasi
    return allSessions.filter(session => {

        // Pernoume tin imerominia tou session
        const sessionDate = new Date(session.date);
        const sessionDateStr = formatDate(sessionDate);

        // Pernoume tin ora enarxis tou session (HH:MM)
        const sessionTime = new Date(session.time_start).toTimeString().slice(0, 5);

        // Epistrofi mono an h imera kai ora einai idia me to slot
        return sessionDateStr === date && sessionTime === time;
    });
}
// Anoigei to Session Action Modal gia to sygkekrimeno session
function openSessionActionModal(sessionId) {

    // Debug sto console gia na vlepeis poio session anoigei
    console.log('Opening session action modal for session:', sessionId);

    // Vriskoume apo ton pinaka to session pou antistoixei sto ID
    const session = allSessions.find(s => s.session_id === sessionId);

    // An den brethei, bgazei error
    if (!session) {
        console.error('Session not found:', sessionId);
        return;
    }

    // Apothikeuoume to epilegmeno sessionId gia xrisi stin synexeia
    selectedSessionId = sessionId;

    // Debug stin konsola wste na blepeis poio session epilexthike
    console.log('Selected session:', session);

    // Pernoume imerominia kai fortmataroume pio omorfa
    const infoBox = document.getElementById('actionModalSessionInfo');
    const sessionDate = new Date(session.date);
    const dateStr = sessionDate.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    // Ftiaxnoume ta times pou tha emfanistoun sto modal
    const startTime = new Date(session.time_start).toTimeString().slice(0, 5);
    const endTime = new Date(session.time_end).toTimeString().slice(0, 5);
    const booked = session.booked_count || 0;

    // Emfanizoume tis plhrofories tou session mesa sto box
    infoBox.innerHTML = `
        <p><strong>Level:</strong> ${session.level}</p>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p><strong>Capacity:</strong> ${booked}/${session.capacity} booked</p>
        <p><strong>Status:</strong> ${session.status}</p>
    `;

    // Energo poioume to modal
    document.getElementById('sessionActionModal').classList.add('active');
}

// Kleinei to Session Action Modal
function closeSessionActionModal() {

    // Debug sto console
    console.log('Closing session action modal');

    // Afairei to "active" class
    document.getElementById('sessionActionModal').classList.remove('active');

    // Katharizei to epilegmeno session
    selectedSessionId = null;
}

// Klik sto koumpi Edit mesa apo to Action Modal
function editSessionFromAction() {
    console.log('Edit session from action clicked, sessionId:', selectedSessionId);

    // Elegxos oti exoume epile3ei kapoio session
    if (!selectedSessionId) {
        console.error('No session selected');
        return;
    }

    const id = selectedSessionId;

    // Kleinei to action modal
    closeSessionActionModal();

    // Anoigei to edit session modal
    editSession(id);
}

// Klik sto koumpi "View Booked Clients" sto action modal
function viewSessionClients() {

    console.log('View session clients clicked, sessionId:', selectedSessionId);

    // Logika elegxou oti exoume session epilegmeno
    if (!selectedSessionId) {
        console.error('No session selected');
        return;
    }

    const id = selectedSessionId;

    // Kleinei to action modal
    closeSessionActionModal();

    // Anoigei modal me tous clients
    openSessionClientsModal(id);
}

// Anoigei to Session Clients Modal
async function openSessionClientsModal(sessionId) {

    console.log('Opening session clients modal for session:', sessionId);

    // Vriskoume to session pou antistoixei sto ID
    const session = allSessions.find(s => s.session_id === sessionId);
    if (!session) {
        console.error('Session not found:', sessionId);
        return;
    }

    // Pairnoume tis plhrofories tou session
    const infoBox = document.getElementById('sessionClientsInfo');
    const sessionDate = new Date(session.date);

    // Format wraias imeras gia display
    const dateStr = sessionDate.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    // Ora enarksis + lixis
    const startTime = new Date(session.time_start).toTimeString().slice(0, 5);
    const endTime = new Date(session.time_end).toTimeString().slice(0, 5);

    // Posoi exoun kleisei
    const booked = session.booked_count || 0;

    // Emfanizei basic session info sto modal
    infoBox.innerHTML = `
        <p><strong>Session:</strong> ${session.level}</p>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p><strong>Booked:</strong> ${booked}/${session.capacity}</p>
    `;

    // Anoigei modal
    document.getElementById('sessionClientsModal').classList.add('active');

    // Katharizoume alerts apo prohgoume xrhsh
    document.getElementById('sessionClientsAlert').innerHTML = '';

    // Fortonei tous clients tou session
    await loadSessionClients(sessionId);
}

// Kleinei to Session Clients modal
function closeSessionClientsModal() {
    console.log('Closing session clients modal');

    // Kleinoume to modal
    document.getElementById('sessionClientsModal').classList.remove('active');

    // Katharizoume alert
    document.getElementById('sessionClientsAlert').innerHTML = '';
}

// Fortonei clients pou exoun kleisei se ena sygkekrimeno session
async function loadSessionClients(sessionId) {

    console.log('Fetching clients for session:', sessionId);

    const tbody = document.getElementById('sessionClientsTableBody');
    const alertDiv = document.getElementById('sessionClientsAlert');

    // Minima "Loading..."
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center;">Loading clients...</td>
        </tr>
    `;
    alertDiv.innerHTML = '';

    try {
        // Ftiaxnoume to URL pou xrisimopoiei to PHP
        const url = `admin_get_session_clients.php?session_id=${sessionId}`;
        console.log('Fetching from URL:', url);

        // Zhtame ta dedomena apo to backend
        const response = await fetch(url);
        console.log('Response status:', response.status);

        // Metaferoume apo JSON se JS object
        const data = await response.json();
        console.log('Response data:', data);

        // An exei error, to deixnoume
        if (!data.success) {
            alertDiv.innerHTML = `<div class="alert alert-error">Error loading clients: ${data.error || 'Unknown error'}</div>`;
            tbody.innerHTML = '';
            return;
        }

        // Pairnoume tin lista me tous clients
        const clients = data.clients || [];
        console.log('Loaded clients:', clients.length);

        // An den exei clients, deixnoume minima
        if (clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="no-clients-message">
                            No clients have booked this session yet.
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Katharizoume ton pinaka
        tbody.innerHTML = '';

        // Ftiaxnoume mia grammi gia kathe client
        clients.forEach(client => {
            const tr = document.createElement('tr');

            const username = client.username || '';
            const firstName = client.first_name || client['First Name'] || '';
            const lastName = client.last_name || client['Last Name'] || '';
            const email = client.email || '';
            const phone = client.phone_number || client.phone || '';
            const bookingTime = client.booking_time ? new Date(client.booking_time).toLocaleString() : 'N/A';

            // Ftiaxnoume ta columns tou pinaka
            tr.innerHTML = `
                <td>${username}</td>
                <td>${firstName}</td>
                <td>${lastName}</td>
                <td>${email}</td>
                <td>${phone}</td>
                <td>${bookingTime}</td>
            `;

            tbody.appendChild(tr);
        });

    } catch (error) {

        // Print error stin konsola gia debugging
        console.error('Error loading clients:', error);

        // Deixnoume error sto UI
        alertDiv.innerHTML = `<div class="alert alert-error">Error loading clients: ${error.message}</div>`;

        // Ftiaxnoume fallback row
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">Failed to load clients.</td>
            </tr>
        `;
    }
}
// Anoigei to Generate Sessions modal (gia dimiourgia standard weekly sessions)
function openGenerateModal() {
    // Emfanizei to modal
    document.getElementById('generateModal').classList.add('active');

    // Katharizei alerts apo prohgoumenh xrisi
    document.getElementById('generateAlert').innerHTML = '';
}

// Kleinei to Generate Sessions modal
function closeGenerateModal() {
    document.getElementById('generateModal').classList.remove('active');
}


// Kuriws function pou kanei generate sessions tis vdomadas
async function generateStandardSessions(event) {
    // Apotrwpei to form na kanei page reload
    event.preventDefault();

    // Pairnei tis imeres pou epilexe o admin me checkboxes
    const selectedDays = Array.from(document.querySelectorAll('input[name="days"]:checked'))
        .map(cb => parseInt(cb.value));

    // An den exei epileksei oute mia imera
    if (selectedDays.length === 0) {
        showGenerateAlert('Please select at least one day', 'error');
        return;
    }

    // Pairnoume times apo form inputs
    const startTime = document.getElementById('genStartTime').value;
    const endTime = document.getElementById('genEndTime').value;
    const level = document.getElementById('genLevel').value;
    const duration = parseInt(document.getElementById('genDuration').value);
    const capacity = parseInt(document.getElementById('genCapacity').value);

    // Kanoume split tis wres se arithmous
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    // Elegxos oti h ora enarxis einai prin apo tin ora lixis
    if (startHour >= endHour) {
        showGenerateAlert('End time must be after start time', 'error');
        return;
    }

    // Pinakas me sessions pou tha dhmiourgithoun
    const sessionsToCreate = [];
    let skippedCount = 0;

    // Gia kathe imera pou epilexthike
    selectedDays.forEach(dayOffset => {

        // Metatrepoume to offset se pragmatiki imera
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + (dayOffset === 0 ? 6 : dayOffset - 1));

        const dateStr = formatDate(date);

        // Dhmiourgoume sessions ana wra
        for (let hour = startHour; hour < endHour; hour++) {

            const timeStr = `${String(hour).padStart(2, '0')}:00`;

            // Elegxoume an yparxei hdh session sto idio slot
            const existingSessions = getSessionsForSlot(dateStr, timeStr);
            if (existingSessions.length > 0) {
                skippedCount++; // Den dimiourgoume diplo session
                continue;
            }

            // Ypologismos wras lixis
            const endMinutes = (hour * 60) + duration;
            const endHourCalc = Math.floor(endMinutes / 60);
            const endMinuteCalc = endMinutes % 60;

            const endTimeStr = `${String(endHourCalc).padStart(2, '0')}:${String(endMinuteCalc).padStart(2, '0')}`;

            // Prosthiki sto sessionsToCreate
            sessionsToCreate.push({
                level: level,
                capacity: capacity,
                date: dateStr,
                time_start: `${dateStr} ${timeStr}:00`,
                time_end: `${dateStr} ${endTimeStr}:00`,
                status: 'open',
                is_private: capacity === 1 ? 1 : 0
            });
        }
    });

    // An den exei tipota gia dhmiourgia
    if (sessionsToCreate.length === 0) {
        showGenerateAlert('No sessions to create. All selected time slots already have sessions.', 'warning');
        return;
    }

    // Prompt gia epivevaiwsi
    const message = `This will create ${sessionsToCreate.length} new sessions${skippedCount > 0 ? ` (${skippedCount} slots skipped due to existing sessions)` : ''}. Continue?`;

    if (!window.confirm(message)) {
        return;
    }

    try {
        let successCount = 0;
        let errorCount = 0;

        // Stelnoume ena-ena ta sessions sto backend
        for (const sessionData of sessionsToCreate) {

            const response = await fetch('admin_create_session.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
            });

            const result = await response.json();

            // An apetyxe, metrame error
            if (result.success) {
                successCount++;
            } else {
                errorCount++;
            }
        }

        // Kleinoume modal
        closeGenerateModal();

        // Deixnoume success message
        showAlert(
            `✅ Generated ${successCount} sessions successfully!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`, 
            'success'
        );

        // Ananewsi calendar
        loadWeek();

    } catch (error) {
        // Fereinoume error sto alert
        showGenerateAlert('Error generating sessions: ' + error.message, 'error');
    }
}
// Custom confirmation dialog
function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const yesBtn = document.getElementById('confirmYes');
        const noBtn = document.getElementById('confirmNo');

        // Fallback to native confirm if custom modal isn't present
        if (!modal || !messageEl || !yesBtn || !noBtn) {
            resolve(window.confirm(message));
            return;
        }

        messageEl.textContent = message;
        modal.classList.add('active');

        const handleYes = () => {
            cleanup();
            resolve(true);
        };

        const handleNo = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            modal.classList.remove('active');
            yesBtn.removeEventListener('click', handleYes);
            noBtn.removeEventListener('click', handleNo);
        };

        yesBtn.addEventListener('click', handleYes);
        noBtn.addEventListener('click', handleNo);
    });
}

 // Kleinei provlimatika sessions pou einai sto parelthon
async function closePastSessions() {
    try {
        // Stelnoume aitima sto backend gia na kleinei autos ta past sessions
        const response = await fetch('past_sessions.php');
        const data = await response.json();

        // An to backend epestrepse oti kleise kapoia sessions
        if (data.success && data.updated_count > 0) {
            console.log("Auto closed " + data.updated_count + " past sessions");
        }

    } catch (error) {
        // Emfanizei error stin konsola an kati pige lathos
        console.error('Error closing past sessions:', error);
    }
}

// Anoigei to modal gia prosthiki neou session
function openAddModal(date, time) {

    // Allazoume ton titlo tou modal se Add Session
    document.getElementById('modalTitle').textContent = 'Add Session';

    // Katharizoume tin forma gia kainourio session
    document.getElementById('sessionForm').reset();

    // Katharizoume sessionId afou einai Add
    document.getElementById('sessionId').value = '';

    // Apothikeuoume tin imera kai ora tou neou session
    document.getElementById('sessionDate').value = date;
    document.getElementById('sessionTimeStart').value = time;

    // Kruboume to koumpi delete giati einai neo session
    document.getElementById('deleteBtn').style.display = 'none';

    // Emfanizoume tin imerominia gia ton admin se friendly morfi
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    document.getElementById('displayDateTime').value = dateStr + " at " + time;

    // Ypologizoume tin ora lixis basei tis diarkeias
    updateEndTime();

    // Sync capacity with type gia συμβατότητα
    syncTypeWithCapacity();

    // Emfanizoume modal
    document.getElementById('sessionModal').classList.add('active');
}

// Anoigei session sto modal gia edit
function editSession(sessionId) {

    // Vriskei apo ton pinaka to session pou exei auto ID
    const session = allSessions.find(s => s.session_id === sessionId);
    if (!session) return;

    // Allazoume ton titlo tou modal
    document.getElementById('modalTitle').textContent = 'Edit Session';

    // Apothikeuoume session id
    document.getElementById('sessionId').value = session.session_id;

    // Pairnoume imera kai wra tou session
    const sessionDate = new Date(session.date);
    const sessionTime = new Date(session.time_start);
    const sessionEnd = new Date(session.time_end);

    const dateStr = formatDate(sessionDate);
    const timeStr = sessionTime.toTimeString().slice(0, 5);

    // Ypologizoume diarkeia se lepta
    const duration = (sessionEnd - sessionTime) / 60000;

    // Bazoume ta values sti forma
    document.getElementById('sessionDate').value = dateStr;
    document.getElementById('sessionTimeStart').value = timeStr;
    document.getElementById('level').value = session.level;
    document.getElementById('duration').value = duration;
    document.getElementById('capacity').value = session.capacity;
    document.getElementById('status').value = session.status;

    // Deixnoume tin imera friendly sta matia tou admin
    const dateObj = new Date(session.date);
    const displayDateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    document.getElementById('displayDateTime').value = displayDateStr + " at " + timeStr;

    // Deixnoume to koumpi delete gia ta yparxonta sessions
    document.getElementById('deleteBtn').style.display = 'inline-block';

    // Sync capacity type for compatibility
    syncTypeWithCapacity();

    // Anoigoume modal
    document.getElementById('sessionModal').classList.add('active');
}

// Ypologizei tin ora lixis analloga me ti diarkeia
function updateEndTime() {

    // Wra enarxis apo to input
    const startTime = document.getElementById('sessionTimeStart').value;

    // Diarkeia se lepta
    const duration = parseInt(document.getElementById('duration').value);

    // An exoume wra kai diarkeia
    if (startTime && duration) {

        // Spaei tin wra se wres kai lepta
        const parts = startTime.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);

        // Ftiaxnoume neo Date object gia ypologismo wras lixis
        const endDate = new Date();
        endDate.setHours(hours, minutes + duration);

        // Pairnoume to end time se format HHMM
        const endTime = endDate.toTimeString().slice(0, 5);

        // Pairnoume tin imera gia na diatirisoume tin morfi
        const dateStr = document.getElementById('displayDateTime').value.split(' at ')[0];

        // Emfanizoume "Monday at 0700 - 0745"
        document.getElementById('displayDateTime').value = dateStr + " at " + startTime + " - " + endTime;
    }
}

// Elegxei an ena session kanei overlap me allo session stin idia imera
function checkTimeConflict(date, timeStart, timeEnd, excludeSessionId = null) {

    // Filtraroume ola ta sessions pou exoun idia imera
    const conflicts = allSessions.filter(session => {

        // An epxei eksairethei auto to ID, to skiparoume
        if (excludeSessionId && session.session_id === excludeSessionId) {
            return false;
        }

        // Metatrepoume tin imera tou session
        const sessionDate = formatDate(new Date(session.date));

        // An einai diaforetiki imera, den mas noiazei
        if (sessionDate !== date) return false;

        // Pairnoume wres tou yparxontos session
        const existingStart = new Date(session.time_start).getTime();
        const existingEnd = new Date(session.time_end).getTime();

        // Metatrepoume tis times tou neou session
        const newStart = new Date(date + " " + timeStart).getTime();
        const newEnd = new Date(date + " " + timeEnd).getTime();

        // Elegxoume an kanei overlap
        return (newStart < existingEnd && newEnd > existingStart);
    });

    return conflicts;
}
// Apothikeuei neo session i kanei update yparxon session
async function saveSession(event) {

    // Stamataei to default submit gia na min kanei refresh i selida
    event.preventDefault();

    // Pairnoume ta vasika dedomena tou session apo ta inputs
    const sessionId = document.getElementById('sessionId').value;
    const date = document.getElementById('sessionDate').value;
    const timeStart = document.getElementById('sessionTimeStart').value;

    // Metatrepoume ti diarkeia se minutes
    const duration = parseInt(document.getElementById('duration').value);

    // Spaei tin ora se wres kai lepta
    const parts = timeStart.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);

    // Ftiaxnoume neo Date object gia na ypologisoume tin ora lixis
    const endDate = new Date();
    endDate.setHours(hours, minutes + duration);

    // Pairnoume to end time se morfi HHMM
    const timeEnd = endDate.toTimeString().slice(0, 5);

    // Elegxoume gia time conflict me all sessions tis idias imeras
    const conflicts = checkTimeConflict(date, timeStart, timeEnd, sessionId ? parseInt(sessionId) : null);

    // An vrethei conflict pou kanei overlap me allo session
    if (conflicts.length > 0) {
        showModalAlert("Time conflict. This time overlaps with existing " + conflicts[0].level + " session.", 'warning');
        return;
    }

    // Metatrepoume to capacity se number
    let capacity = parseInt(document.getElementById('capacity').value);

    // Ftiaxnoume to payload gia to backend
    const data = {
        session_id: sessionId || null,
        level: document.getElementById('level').value,
        capacity: capacity,
        is_private: capacity === 1 ? 1 : 0,
        date: date,
        time_start: date + " " + timeStart + ":00",
        time_end: date + " " + timeEnd + ":00",
        status: document.getElementById('status').value
    };

    try {
        // Stelnoume request sto backend gia create i update
        const response = await fetch('admin_create_session.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        // An piga ola kala
        if (result.success) {
            showAlert(sessionId ? "Session updated successfully." : "Session created successfully.", 'success');

            // Kleinoume modal
            closeModal();

            // Fortonei ksana tin vdomada
            loadWeek();

        } else {
            // Emfanizei error mesa sto modal
            showModalAlert("Error saving session. " + result.error, 'error');
        }

    } catch (error) {
        // Emfanisi error gia rechtimes problimata
        showModalAlert("Error saving session. " + error.message, 'error');
    }
}

// Diagrafei to session pou einai anoigmeno sto modal
async function deleteCurrentSession() {

    // Pairnoume to ID
    const sessionId = document.getElementById('sessionId').value;
    if (!sessionId) return;

    // Prompt gia epivevaiwsi diagrafis
    const c = confirm("Are you sure you want to delete this session?");
    if (!c) return;

    try {
        // Stelnoume sto backend to ID pou diagrafetai
        const response = await fetch('admin_delete_session.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: parseInt(sessionId) })
        });

        const result = await response.json();

        // An diagraftike epitixos
        if (result.success) {
            showAlert(result.message, 'success');

            // Kleinei modal
            closeModal();

            // Ananewsi calendar
            loadWeek();

        } else {
            showModalAlert("Error deleting session. " + result.error, 'error');
        }

    } catch (error) {
        showModalAlert("Error deleting session. " + error.message, 'error');
    }
}

// Kleinei to session modal kai katharizei alerts
function closeModal() {
    document.getElementById('sessionModal').classList.remove('active');
    document.getElementById('modalAlert').innerHTML = '';
}

// Deixnei alert pano apo to calendar
function showAlert(message, type) {
    const alertDiv = document.getElementById('alert');

    alertDiv.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';

    // Afairieitai meta apo 5 seconds
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 5000);
}

// Deixnei alert mesa sto session modal
function showModalAlert(message, type) {
    const alertDiv = document.getElementById('modalAlert');
    alertDiv.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
}

// Deixnei alert mesa sto generate modal
function showGenerateAlert(message, type) {
    const alertDiv = document.getElementById('generateAlert');
    alertDiv.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
}

// Compatibility function pou de kanei kati pleon
function syncTypeWithCapacity() {
    // Kratai tin function gia palia layout logic
}

// Anoigei modal me olous tous pelates tou systimatos
function openClientsModal() {
    document.getElementById('clientsModal').classList.add('active');
    document.getElementById('clientsAlert').innerHTML = '';
    loadClients();
}

// Kleinei to modal me olous tous clients
function closeClientsModal() {
    document.getElementById('clientsModal').classList.remove('active');
    document.getElementById('clientsAlert').innerHTML = '';
}

// Fortonei olous tous clients kai tous emfanizei ston pinaka
async function loadClients() {

    const tbody = document.getElementById('clientsTableBody');
    const alertDiv = document.getElementById('clientsAlert');

    // Emfanizei loading minima
    tbody.innerHTML = '<tr><td colspan="8">Loading clients...</td></tr>';
    alertDiv.innerHTML = '';

    try {
        // Zitaei apo to backend ti lista twn clients
        const response = await fetch('admin_get_clients.php');
        const data = await response.json();

        // An exei error
        if (!data.success) {
            alertDiv.innerHTML = '<div class="alert alert-error">Error loading clients. ' + (data.error || "Unknown error") + '</div>';
            tbody.innerHTML = '';
            return;
        }

        const clients = data.clients || [];

        // An den vrethoun clients
        if (clients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No clients found.</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        // Ftiaxnoume mia grammi gia kathe client
        clients.forEach(client => {
            const tr = document.createElement('tr');

            const username = client.username || '';
            const firstName = client.first_name || client["First Name"] || '';
            const lastName = client.last_name || client["Last Name"] || '';
            const email = client.email || '';
            const phone = client.phone_number || client.phone || '';
            let timeCreate = '';
            if (client.time_create) {
                const raw = String(client.time_create).trim();
                const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
                const d = new Date(normalized);
                timeCreate = isNaN(d.getTime()) ? raw : d.toLocaleString();
            }
            const datebirth = client.datebirth ? new Date(client.datebirth).toLocaleDateString() : '';

            // Escape apostrofos sto username
            const safeUsername = username.replace(/'/g, "\\'");

            // Ftiaxnoume ta columns
            tr.innerHTML = `
                <td>${username}</td>
                <td>${firstName}</td>
                <td>${lastName}</td>
                <td>${email}</td>
                <td>${timeCreate}</td>
                <td>${phone}</td>
                <td>${datebirth}</td>
                <td>
                    <button class="btn btn-danger btn-small" onclick="banClient('${safeUsername}')">
                        Ban
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });

    } catch (error) {
        alertDiv.innerHTML = '<div class="alert alert-error">Error loading clients. ' + error.message + '</div>';
        tbody.innerHTML = '<tr><td colspan="8">Failed to load clients.</td></tr>';
    }
}

// Kanei ban enan client apo to systima
async function banClient(username) {

    const alertDiv = document.getElementById('clientsAlert');

    // Elegxos giati mporei kapoio username na einai kenoulo
    if (!username) {
        alertDiv.innerHTML = '<div class="alert alert-error">Invalid username.</div>';
        return;
    }

    // Prevent banning self or the admin account (client-side guard)
    const getCurrentUser = () => {
        const meta = document.querySelector('meta[name="current-user"]');
        if (meta && meta.content) return meta.content;
        if (document.body && document.body.dataset && document.body.dataset.currentUser) return document.body.dataset.currentUser;
        return null;
    };

    const currentUser = getCurrentUser();
    if (currentUser && username === currentUser) {
        alertDiv.innerHTML = '<div class="alert alert-warning">You cannot ban yourself.</div>';
        return;
    }
    if (typeof username === 'string' && username.toLowerCase() === 'admin') {
        alertDiv.innerHTML = '<div class="alert alert-warning">You cannot ban the admin account.</div>';
        return;
    }

    // Prompt gia epivevaiwsi diagrafis pelati
    const confirmed = confirm(
        "Are you sure you want to ban or delete client " + username + " This action cannot be undone."
    );

    if (!confirmed) return;

    alertDiv.innerHTML = '';

    try {
        // Stelnoume sto backend to username pou diagrafetai
        const response = await fetch('admin_ban_client.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username })
        });

        const data = await response.json();

        // An piga ola kala
        // An piga ola kala
        if (data.success) {
            alertDiv.innerHTML = '<div class="alert alert-success">' + (data.message || "Client banned successfully.") + '</div>';
            loadClients();
        } 
        else {
            alertDiv.innerHTML = '<div class="alert alert-error">Error banning client. ' + (data.error || "Unknown error") + '</div>';
        }

    } catch (error) {
        alertDiv.innerHTML = '<div class="alert alert-error">Error banning client. ' + error.message + '</div>';
    }
}

// Kleinei action modal otan ginei click ekso apo to content
document.getElementById("sessionActionModal").addEventListener("click", function(e) {
    if (e.target === this) closeSessionActionModal();
});

// Kleinei clients modal otan patiseis ekso apo to content
document.getElementById("sessionClientsModal").addEventListener("click", function(e) {
    if (e.target === this) closeSessionClientsModal();
});

// Kleinei clients modal otan patiseis ekso apo to content (overlay click)
const clientsModalEl = document.getElementById("clientsModal");
if (clientsModalEl) {
    clientsModalEl.addEventListener("click", function(e) {
        if (e.target === this) closeClientsModal();
    });
}