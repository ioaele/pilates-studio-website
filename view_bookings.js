let bookingsData = [];
let currentDate = new Date(); // arrows change this day-by-day

// Language switcher (kratame tin domi, alla xrisimopoioume mono ellhnika)
function setLang(lang) {
    // Mono ellhnika
    const titleEl = document.getElementById('Title');
    if (titleEl) titleEl.textContent = 'Οι Κρατήσεις μου';

    updateDateHeader();
    renderBookings();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setLang('el');  // set initial language (moni glwssa)
    loadBookings();
});

// Load bookings from PHP using session (users_id)
async function loadBookings() {
    const container = document.getElementById('bookingList');

    if (!container) return;
    container.innerHTML = `<div class="loading">Φόρτωση κρατήσεων...</div>`;

    try {
        const response = await fetch('view_bookings.php?action=get_bookings', {
            credentials: 'same-origin'
        });

        let data = {};
        try {
            data = await response.json();
        } catch (e) {}

        if (response.status === 401) {
            console.error('Not authenticated:', data.error || '');
            container.innerHTML = `<div class="error-message">Παρακαλώ συνδεθείτε για να δείτε τις κρατήσεις σας.</div>`;
            return;
        }

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load bookings');
        }

        bookingsData = data.bookings || [];

        updateDateHeader();
        renderBookings();

    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = `<div class="error-message">Σφάλμα φόρτωσης κρατήσεων. Παρακαλώ δοκιμάστε ξανά.</div>`;
    }
}

// Change day (left / right arrow)
function changeDay(direction) {
    currentDate.setDate(currentDate.getDate() + direction);
    updateDateHeader();
    renderBookings();
}

// Update the date header in the middle
function updateDateHeader() {
    const dateHeader = document.getElementById('dateHeader');
    if (!dateHeader) return;

    if (!currentDate || isNaN(currentDate.getTime())) {
        dateHeader.textContent = 'Όλες οι Ημερομηνίες';
        return;
    }

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const locale = 'el-GR';

    dateHeader.textContent = currentDate.toLocaleDateString(locale, options);
}

// Render bookings for currentDate
function renderBookings() {
    const container = document.getElementById('bookingList');
    if (!container) return;

    if (!bookingsData) {
        container.innerHTML = `<div class="loading">Φόρτωση κρατήσεων...</div>`;
        return;
    }

    const selectedDateKey = toDateKey(currentDate);

    const filteredBookings = (bookingsData || []).filter(b => {
        const bookingKey = toDateKey(new Date(b.date));
        return bookingKey === selectedDateKey;
    });

    if (filteredBookings.length === 0) {
        container.innerHTML = `<div class="no-bookings"><p>Δεν υπάρχουν κρατήσεις για αυτή την ημερομηνία.</p></div>`;
        return;
    }

    let html = '';
    const todayKey = toDateKey(new Date());
    const currentTime = Date.now();

    filteredBookings.forEach(booking => {
        const bookingDateObj = new Date(booking.date);
        const bookingDateKey = toDateKey(bookingDateObj);

        const sessionDateTime = new Date(booking.time_start);
        const hoursDifference = (sessionDateTime.getTime() - currentTime) / (1000 * 60 * 60);

        let canCancel;
        if (bookingDateKey < todayKey) {
            canCancel = false;
        } else {
            canCancel = hoursDifference > 24;
        }

        const displayDate      = formatDate(booking.date); // mono ellhnika
        const displayTimeStart = formatTime(booking.time_start);
        const displayTimeEnd   = formatTime(booking.time_end);

        let statusClass = 'status-active';
        const status = (booking.status || '').toLowerCase();
        if (status === 'cancelled') {
            statusClass = 'status-cancelled';
        } else if (status === 'completed' || bookingDateKey < todayKey) {
            statusClass = 'status-completed';
        }

        html += `
            <div class="booking-item">
                <div class="booking-time">
                    <span>${escapeHtml(displayTimeStart)}</span>
                    <span class="time-separator">-</span>
                    <span>${escapeHtml(displayTimeEnd)}</span>
                </div>
                <div class="booking-details">
                    <div class="detail-row">
                        <strong>Ημερομηνία:</strong> ${escapeHtml(displayDate)}
                    </div>
                    <div class="detail-row">
                        <strong>Επίπεδο:</strong> ${escapeHtml(booking.level)}</div>
                    <div class="detail-row">
                        <strong>Κατάσταση:</strong>
                        <span class="${statusClass}">${escapeHtml(booking.status)}</span>
                    </div>
                </div>
                <div class="booking-actions">
                    <button class="cancel-btn"
                            ${!canCancel ? 'disabled' : ''} 
                            onclick="cancelBooking(${booking.booking_id})"
                            title="${!canCancel ? 'Δεν μπορείτε να ακυρώσετε κρατήσεις εντός 24 ωρών' : 'Διαγραφή αυτής της κράτησης'}">
                        ${canCancel ? 'Ακύρωση' : 'Δεν Μπορεί να Ακυρωθεί'}
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}
// Cancel booking via separate PHP file
async function cancelBooking(bookingId) {

    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την κράτηση;')) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('delete_id', bookingId);

        console.log('Sending delete request for booking:', bookingId);  // DEBUG

        const response = await fetch('delete_booking.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        // Διάβασε την απάντηση ως JSON
        const data = await response.json();
        console.log('Server response:', data);  // DEBUG

        if (!data.success) {
            alert('Σφάλμα: ' + (data.error || 'Άγνωστο σφάλμα'));
            return;
        }

        // Επιτυχία - ξαναφόρτωσε
        loadBookings();

    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Error: ' + error.message);
    }
}

// Helper: YYYY-MM-DD string
function toDateKey(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Helper: format date
function formatDate(dateStr, lang) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('el-GR', options);
}

// Helper: format time
function formatTime(datetimeStr) {
    if (!datetimeStr) return '';
    const date = new Date(datetimeStr);

    if (isNaN(date.getTime())) {
        const parts = datetimeStr.toString().split(':');
        if (parts.length >= 2) {
            return `${parts[0].slice(-2)}:${parts[1]}`;
        }
        return datetimeStr;
    }

    const hours   = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Helper: escape HTML
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
