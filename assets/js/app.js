document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const elements = {
        epochInput: document.getElementById("epochInput"),
        localOutput: document.getElementById("localOutput"),
        utcOutput: document.getElementById("utcOutput"),
        utcOutput24hr: document.getElementById("utcOutput24hr"),
        dateInput: document.getElementById("dateInput"),
        timeInput: document.getElementById("timeInput"),
        epochOutput: document.getElementById("epochOutput"),
        isoInput: document.getElementById("isoInput"),
        convertISOToLocalBtn: document.getElementById("convertISOToLocalBtn"),
        convertEpochToLocalBtn: document.getElementById("convertEpochToLocalBtn"),
        convertMsToLocalBtn: document.getElementById("convertMsToLocalBtn"),
        convertLocalToEpochBtn: document.getElementById("convertLocalToEpochBtn"),
        quickOptions: document.querySelectorAll(".quick-option"),
        UUIDv7Output: document.getElementById("UUIDv7Output"),
        UUIDv7ReverseBtn: document.getElementById("reverseUUIDv7Btn"),
        UUIDv7RandomizeBtn: document.getElementById("generateUUIDv7Btn")
    };

    // Event Listeners
    elements.convertEpochToLocalBtn.addEventListener("click", convertEpochToLocal);
    elements.convertMsToLocalBtn.addEventListener("click", msToEpoch);
    elements.convertLocalToEpochBtn.addEventListener("click", convertLocalToEpoch);
    elements.convertISOToLocalBtn.addEventListener("click", convertISOToEpoch);
    elements.quickOptions.forEach(option => option.addEventListener("click", () => setQuickOption(parseInt(option.dataset.hours, 10))));
    elements.UUIDv7RandomizeBtn.addEventListener("click", () => elements.UUIDv7Output.value = format_UUIDv7());
    elements.UUIDv7ReverseBtn.addEventListener("click", convertUUIDv7ToEpoch);

    // Initialize
    setQuickOption(0);

    // Functions
    function msToEpoch() {
        const msValue = parseInt(elements.epochInput.value, 10);
        if (isNaN(msValue)) return showError(elements.localOutput, "Invalid time provided");
        elements.epochInput.value = Math.floor(msValue / 1000);
        convertEpochToLocal();
    }

    function format_UUIDv7() {
    const epochSeconds = parseInt(elements.epochInput.value, 10);
    const ms = BigInt(epochSeconds) * 1000n; // seconds to milliseconds
    const timeHex = ms.toString(16).padStart(12, '0'); // 12 char = 48 bits
    const time = timeHex.padStart(12, '0'); // 12 char = 48 bits | timeHex
    const randomBytes = crypto.getRandomValues(new Uint8Array(10)); // random 80 bits
    randomBytes[0] = (randomBytes[0] & 0x0f) | 0x70; // version 7
    randomBytes[2] = (randomBytes[2] & 0x3f) | 0x80; // variant 10xx

    const parts = [  // assemble the UUIDv7
        time.slice(0, 8),
        time.slice(8, 12),
        [...randomBytes.slice(0, 2)].map(b => b.toString(16).padStart(2, '0')).join(''),
        [...randomBytes.slice(2, 4)].map(b => b.toString(16).padStart(2, '0')).join(''),
        [...randomBytes.slice(4)].map(b => b.toString(16).padStart(2, '0')).join('')
    ];

    return parts.join('-');
    }

    function convertUUIDv7ToEpoch() {
        let ogUUIDv7 = elements.UUIDv7Output.value.slice();
        let time = elements.UUIDv7Output.value.replace(/-/g, '').slice(0, 12); // 12 char = 48 bits
        elements.epochInput.value = parseInt(time, 16) / 1000;
        convertEpochToLocal();
        convertISOToEpoch();
        elements.UUIDv7Output.value = ogUUIDv7;
    }

    function convertEpochToLocal() {
        const epochValue = parseInt(elements.epochInput.value, 10);
        if (isNaN(epochValue)) return showError(elements.localOutput, "Invalid time provided");

        const date = new Date(epochValue * 1000);
        updateOutputs(date);
        elements.isoInput.value = formatISOUTC(date);
    }

    function convertLocalToEpoch() {
        const localInput = `${elements.dateInput.value}T${elements.timeInput.value}.000${getTimezoneOffsetString()}`;
        const epochTime = Date.parse(localInput) / 1000;

        if (isNaN(epochTime)) return showError(elements.epochOutput, "Invalid date or time format");
        elements.isoInput.value = localInput;
        elements.epochInput.value = epochTime;
        elements.epochOutput.textContent = `Epoch Time: ${epochTime}`;

        // display local time
        const date = new Date(epochTime * 1000);
        updateOutputs(date);
    }

    function convertISOToEpoch() {
        const isoString = elements.isoInput.value.replace(/\s/g, '');
        const date = new Date(isoString);

        if (isNaN(date.getTime())) return showError(elements.localOutput, "Invalid ISO 8601 string");

        const epochTime = Math.floor(date.getTime() / 1000);
        updateOutputs(date);
        elements.epochOutput.textContent = `Epoch Time: ${epochTime}`;

        // Update Local Date and Time inputs
        elements.dateInput.value = formatDateToString(date);
        elements.timeInput.value = formatTime(date);
        elements.epochInput.value = epochTime;
    }

    function updateOutputs(date) {
        elements.localOutput.textContent = formatDate(date = date, isUTC = false, hour12 = true);
        elements.utcOutput.textContent = formatDate(date = date, isUTC = true, hour12 = true);
        elements.utcOutput24hr.textContent = formatDate(date = date, isUTC = true, hour12 = false);
        elements.UUIDv7Output.value = format_UUIDv7();
    }

    function showError(element, message) {
        element.textContent = `Conversion Error: ${message}`;
        elements.utcOutput.textContent = "";
    }

    function formatDate(date, isUTC = false, hour12 = true) {
        return date.toLocaleString('en-US', {
            timeZone: isUTC ? 'UTC' : undefined,
            hour12: hour12,
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    }

    function formatISOUTC(date) {
        return date.toISOString().split('Z')[0] + "+0000";
    }

    function formatTime(date) {
        return date.toTimeString().split(' ')[0];
    }

    function setQuickOption(hours) {
        const date = new Date();
        date.setHours(date.getHours() - hours);

        elements.dateInput.value = formatDateToString(date);
        elements.timeInput.value = formatTime(date);
        convertLocalToEpoch();
    }

    function formatDateToString(date) {
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        return `${year}-${month}-${day}`;
    }

    function pad(value) {
        return value.toString().padStart(2, '0');
    }

    function getTimezoneOffsetString() {
        const offsetMinutes = new Date().getTimezoneOffset();
        const sign = offsetMinutes <= 0 ? '+' : '-';
        const hours = Math.abs(Math.floor(offsetMinutes / 60));
        const minutes = Math.abs(offsetMinutes % 60);
        return `${sign}${pad(hours)}:${pad(minutes)}`;
    }

    function formatTimezoneOffset() {
        return getTimezoneOffsetString().replace(/:/g, '');
    }
});
