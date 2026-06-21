document.addEventListener('DOMContentLoaded', function () {
    const elements = {
        epochInput: document.getElementById("epochInput"),
        epochMsInput: document.getElementById("epochMsInput"),
        localOutput12hr: document.getElementById("localOutput12hr"),
        localOutput24hr: document.getElementById("localOutput24hr"),
        utcOutput: document.getElementById("utcOutput"),
        utcOutput24hr: document.getElementById("utcOutput24hr"),
        isoTZOutput: document.getElementById("isoTZOutput"),
        isoUTCOutput: document.getElementById("isoUTCOutput"),
        dateInput: document.getElementById("dateInput"),
        timeInput: document.getElementById("timeInput"),
        isoInput: document.getElementById("isoInput"),
        localOutputISO: document.getElementById("localOutputISO"),
        utcOutputISO: document.getElementById("utcOutputISO"),
        UUIDv7Output: document.getElementById("UUIDv7Output"),
        UUIDv7RandomizeBtn: document.getElementById("generateUUIDv7Btn"),
        copyEpochBtn: document.getElementById("copyEpochBtn"),
        copyEpochMsBtn: document.getElementById("copyEpochMsBtn"),
        copyUUIDBtn: document.getElementById("copyUUIDBtn"),
        clearLocalBtn: document.getElementById("clearLocalBtn"),
        clearISOBtn: document.getElementById("clearISOBtn"),
        clearEpochBtn: document.getElementById("clearEpochBtn"),
        toast: document.getElementById("toast")
    };

    let toastTimeout = null;

    const urlParams = new URLSearchParams(window.location.search);
    let initialEpochFromUrl = null;

    if (!urlParams.has('ms')) {
        const epochParam = urlParams.get('epoch');
        if (epochParam !== null) {
            const epoch = parseNumber(epochParam);
            if (epoch !== null) {
                const epochMs = Math.round(epoch * 1000);
                if (Number.isSafeInteger(epochMs)) {
                    initialEpochFromUrl = epoch;
                    elements.epochInput.value = formatEpochSeconds(epochMs);
                    elements.epochMsInput.value = epochMs;
                    convertEpochToLocal(epoch);
                }
            }
        }
    }

    elements.UUIDv7RandomizeBtn.addEventListener("click", generateRandomUUIDv7);
    elements.copyEpochBtn.addEventListener("click", () => copyToClipboard(elements.epochInput.value));
    elements.copyEpochMsBtn.addEventListener("click", () => copyToClipboard(elements.epochMsInput.value));
    elements.copyUUIDBtn.addEventListener("click", () => copyToClipboard(elements.UUIDv7Output.value));

    elements.clearLocalBtn.addEventListener("click", () => {
        clearEpochDerivedFields();
        clearEpochParam();
        setQuickOption(0);
    });

    elements.clearISOBtn.addEventListener("click", () => {
        clearEpochDerivedFields();
        clearEpochParam();
        setQuickOption(0);
    });

    elements.clearEpochBtn.addEventListener("click", () => {
        clearEpochDerivedFields();
        clearEpochParam();
        setQuickOption(0);
    });

    elements.epochInput.addEventListener("input", () => {
        const rawValue = elements.epochInput.value;
        const epochSeconds = parseNumber(rawValue);

        if (epochSeconds === null) {
            if (rawValue.trim() === '') {
                clearEpochDerivedFields();
            } else {
                clearEpochResults({ keepEpochInput: true });
                showError(elements.localOutput12hr, "Invalid epoch time");
            }

            clearEpochParam();
            return;
        }

        const epochMs = Math.round(epochSeconds * 1000);
        if (!Number.isSafeInteger(epochMs)) {
            clearEpochResults();
            showError(elements.localOutput12hr, "Invalid epoch time");
            clearEpochParam();
            return;
        }

        elements.epochMsInput.value = epochMs;
        convertEpochToLocal(epochSeconds);
        clearEpochParam();
    });

    elements.epochMsInput.addEventListener("input", () => {
        msToEpoch();
        clearEpochParam();
    });

    elements.localOutput12hr.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace(/^\s*Local 12hr:\s*/, ''));
    });

    elements.localOutput24hr.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace(/^\s*Local 24hr:\s*/, ''));
    });

    elements.utcOutput.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace(/^\s*UTC 12hr:\s*/, ''));
    });

    elements.utcOutput24hr.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace(/^\s*UTC 24hr:\s*/, ''));
    });

    elements.isoTZOutput.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace(/^\s*ISO Local:\s*/, ''));
    });

    elements.isoUTCOutput.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace(/^\s*ISO UTC:\s*/, ''));
    });

    elements.localOutputISO.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace(/^\s*Local:\s*/, ''));
    });

    elements.utcOutputISO.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace(/^\s*UTC:\s*/, ''));
    });

    elements.UUIDv7Output.addEventListener("input", () => {
        convertUUIDv7ToEpoch();
        clearEpochParam();
    });

    elements.isoInput.addEventListener("input", () => {
        convertISOToLocal();
        clearEpochParam();
    });

    [elements.dateInput, elements.timeInput].forEach(input => {
        input.addEventListener("change", () => {
            convertLocalToEpoch();
            clearEpochParam();
        });

        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                convertLocalToEpoch();
                clearEpochParam();
            }
        });
    });

    if (initialEpochFromUrl === null) {
        setQuickOption(0);
        generateRandomUUIDv7();
    }

    function clearEpochParam() {
        const params = new URLSearchParams(window.location.search);
        if (!params.has('epoch')) return;

        params.delete('epoch');

        const query = params.toString();
        const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;

        try {
            window.history.pushState({}, '', newUrl);
        } catch (error) {
            console.error('Failed to clear epoch URL parameter:', error);
        }

        initialEpochFromUrl = null;
    }

    function msToEpoch() {
        const rawValue = elements.epochMsInput.value;
        const epochMs = parseInteger(rawValue);

        if (epochMs === null) {
            if (rawValue.trim() === '') {
                clearEpochDerivedFields();
            } else {
                clearEpochResults();
                showError(elements.localOutput12hr, "Invalid epoch milliseconds");
            }

            return false;
        }

        elements.epochInput.value = formatEpochSeconds(epochMs);
        return convertEpochToLocal(epochMs / 1000);
    }

    function generateUUIDv7(timestampMs = null) {
        if (timestampMs !== null && timestampMs !== undefined && timestampMs < 0) {
            throw new RangeError('UUIDv7 timestamp must be non-negative');
        }

        const ms = timestampMs === null || timestampMs === undefined ? BigInt(Date.now()) : BigInt(timestampMs);
        const timeHex = ms.toString(16).padStart(12, '0').slice(-12);
        const randomBytes = crypto.getRandomValues(new Uint8Array(10));

        randomBytes[0] = (randomBytes[0] & 0x0f) | 0x70;
        randomBytes[2] = (randomBytes[2] & 0x3f) | 0x80;

        const parts = [
            timeHex.slice(0, 8),
            timeHex.slice(8, 12),
            [...randomBytes.slice(0, 2)].map(b => b.toString(16).padStart(2, '0')).join(''),
            [...randomBytes.slice(2, 4)].map(b => b.toString(16).padStart(2, '0')).join(''),
            [...randomBytes.slice(4)].map(b => b.toString(16).padStart(2, '0')).join('')
        ];

        return parts.join('-');
    }

    function generateRandomUUIDv7() {
        elements.UUIDv7Output.value = generateUUIDv7();
    }

    function convertUUIDv7ToEpoch() {
        const rawUuid = elements.UUIDv7Output.value;
        const uuid = rawUuid.trim();

        if (!uuid) {
            clearEpochDerivedFields();
            return false;
        }

        const timestampMs = parseUUIDv7(uuid);
        if (timestampMs === null) {
            clearEpochResults({ keepUUIDInput: true });
            showError(elements.localOutput12hr, "Invalid UUIDv7");
            return false;
        }

        const date = new Date(timestampMs);
        if (isNaN(date.getTime())) {
            clearEpochResults({ keepUUIDInput: true });
            showError(elements.localOutput12hr, "Invalid UUIDv7 timestamp");
            return false;
        }

        elements.epochInput.value = formatEpochSeconds(timestampMs);
        elements.epochMsInput.value = timestampMs;
        elements.isoInput.value = formatISOUTC(date);
        elements.dateInput.value = formatDateToString(date);
        elements.timeInput.value = formatTime(date);

        updateOutputs(date, { preserveUUID: true });
        return true;
    }

    function convertEpochToLocal(epochSeconds = null) {
        const rawValue = epochSeconds === null ? elements.epochInput.value : null;
        const seconds = epochSeconds === null ? parseNumber(rawValue) : epochSeconds;

        if (seconds === null || !Number.isFinite(seconds)) {
            showError(elements.localOutput12hr, "Invalid epoch time");
            return false;
        }

        const epochMs = Math.round(seconds * 1000);
        if (!Number.isSafeInteger(epochMs)) {
            showError(elements.localOutput12hr, "Invalid epoch time");
            return false;
        }

        elements.epochInput.value = formatEpochSeconds(epochMs);
        elements.epochMsInput.value = epochMs;

        const date = new Date(epochMs);
        if (isNaN(date.getTime())) {
            showError(elements.localOutput12hr, "Invalid date");
            return false;
        }

        updateOutputs(date);
        elements.isoInput.value = formatISOUTC(date);
        elements.dateInput.value = formatDateToString(date);
        elements.timeInput.value = formatTime(date);

        return true;
    }

    function convertLocalToEpoch() {
        const dateVal = elements.dateInput.value;
        const timeVal = elements.timeInput.value;

        if (!dateVal || !timeVal) {
            clearEpochDerivedFields();
            return false;
        }

        const date = parseLocalDateTime(dateVal, timeVal);
        if (!date) {
            clearEpochResults({ keepLocalInputs: true });
            showError(elements.localOutput12hr, "Invalid local date/time");
            return false;
        }

        const epochMs = date.getTime();
        if (!Number.isSafeInteger(epochMs)) {
            clearEpochResults({ keepLocalInputs: true });
            showError(elements.localOutput12hr, "Invalid local date/time");
            return false;
        }

        elements.isoInput.value = formatISOTZ(date);
        elements.epochInput.value = formatEpochSeconds(epochMs);
        elements.epochMsInput.value = epochMs;

        updateOutputs(date);
        return true;
    }

    function convertISOToLocal() {
        const isoString = elements.isoInput.value.trim();

        if (!isoString) {
            clearEpochDerivedFields();
            return false;
        }

        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            clearEpochResults({ keepIsoInput: true });
            showError(elements.localOutputISO, "Invalid ISO 8601 string");
            return false;
        }

        const epochMs = date.getTime();
        if (!Number.isSafeInteger(epochMs)) {
            clearEpochResults({ keepIsoInput: true });
            showError(elements.localOutputISO, "Invalid ISO 8601 string");
            return false;
        }

        elements.isoInput.value = isoString;
        elements.dateInput.value = formatDateToString(date);
        elements.timeInput.value = formatTime(date);
        elements.epochInput.value = formatEpochSeconds(epochMs);
        elements.epochMsInput.value = epochMs;

        updateOutputs(date);
        updateISOOutputs(date);

        return true;
    }

    function updateOutputs(date, options = {}) {
        const { preserveUUID = false } = options;
        const epochMs = date.getTime();

        clearISOOutputs();

        setHTML(elements.localOutput12hr, `<strong>Local 12hr:</strong> ${formatDate(date, false, true)}`);
        setHTML(elements.localOutput24hr, `<strong>Local 24hr:</strong> ${formatDate(date, false, false)}`);
        setHTML(elements.isoTZOutput, `<strong>ISO Local:</strong> ${formatISOTZ(date)}`);
        setHTML(elements.utcOutput, `<strong>UTC 12hr:</strong> ${formatDate(date, true, true)}`);
        setHTML(elements.utcOutput24hr, `<strong>UTC 24hr:</strong> ${formatDate(date, true, false)}`);
        setHTML(elements.isoUTCOutput, `<strong>ISO UTC:</strong> ${formatISOUTC(date)}`);

        if (!preserveUUID) {
            elements.UUIDv7Output.value = generateUUIDv7(epochMs);
        }
    }

    function updateISOOutputs(date) {
        setHTML(elements.localOutputISO, `<strong>Local:</strong> ${formatDate(date, false, true)}`);
        setHTML(elements.utcOutputISO, `<strong>UTC:</strong> ${formatDate(date, true, true)}`);
    }

    function parseUUIDv7(uuid) {
        const normalized = uuid.trim().toLowerCase();
        const match = normalized.match(/^([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})$/);

        if (!match) return null;

        const version = match[3][0];
        const variant = match[4][0];

        if (version !== '7' || !/^[89ab]$/.test(variant)) {
            return null;
        }

        const timestampMs = Number.parseInt(`${match[1]}${match[2]}`, 16);
        return Number.isSafeInteger(timestampMs) ? timestampMs : null;
    }

    function parseLocalDateTime(dateValue, timeValue) {
        const dateParts = dateValue.trim().split('-').map(Number);
        const timeParts = timeValue.trim().split(':').map(Number);

        if (dateParts.length !== 3 || timeParts.length < 2 || timeParts.length > 3) {
            return null;
        }

        const [year, month, day] = dateParts;
        const [hour, minute, second = 0] = timeParts;

        if (![year, month, day, hour, minute, second].every(Number.isInteger)) {
            return null;
        }

        const date = new Date(year, month - 1, day, hour, minute, second, 0);

        if (
            date.getFullYear() !== year ||
            date.getMonth() + 1 !== month ||
            date.getDate() !== day ||
            date.getHours() !== hour ||
            date.getMinutes() !== minute ||
            date.getSeconds() !== second
        ) {
            return null;
        }

        return date;
    }

    function formatISOTZ(date) {
        const year = padYear(date.getFullYear());
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        const milliseconds = pad(date.getMilliseconds(), 3);

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${getTimezoneOffsetString(date)}`;
    }

    function formatISOUTC(date) {
        const year = padYear(date.getUTCFullYear());
        const month = pad(date.getUTCMonth() + 1);
        const day = pad(date.getUTCDate());
        const hours = pad(date.getUTCHours());
        const minutes = pad(date.getUTCMinutes());
        const seconds = pad(date.getUTCSeconds());
        const milliseconds = pad(date.getUTCMilliseconds(), 3);

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+00:00`;
    }

    function showError(element, message) {
        setHTML(element, `<span class="text-red-600">${message}</span>`);
    }

    function clearEpochDerivedFields() {
        clearEpochResults();
    }

    function clearEpochResults(options = {}) {
        const {
            keepEpochInput = false,
            keepEpochMsInput = false,
            keepLocalInputs = false,
            keepIsoInput = false,
            keepUUIDInput = false
        } = options;

        if (!keepEpochInput) {
            elements.epochInput.value = '';
        }

        if (!keepEpochMsInput) {
            elements.epochMsInput.value = '';
        }

        if (!keepLocalInputs) {
            elements.dateInput.value = '';
            elements.timeInput.value = '';
        }

        if (!keepIsoInput) {
            elements.isoInput.value = '';
        }

        clearEpochOutputs();
        clearISOOutputs();

        if (!keepUUIDInput) {
            elements.UUIDv7Output.value = '';
        }
    }

    function clearEpochOutputs() {
        setText(elements.localOutput12hr);
        setText(elements.localOutput24hr);
        setText(elements.isoTZOutput);
        setText(elements.utcOutput);
        setText(elements.utcOutput24hr);
        setText(elements.isoUTCOutput);
    }

    function clearISOOutputs() {
        setText(elements.localOutputISO);
        setText(elements.utcOutputISO);
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

    function formatEpochSeconds(ms) {
        const seconds = ms / 1000;

        if (Object.is(seconds, -0)) {
            return '0';
        }

        if (Number.isInteger(seconds)) {
            return String(seconds);
        }

        return seconds.toFixed(3).replace(/\.?0+$/, '');
    }

    function pad(value, length = 2) {
        return value.toString().padStart(length, '0');
    }

    function padYear(value) {
        const sign = value < 0 ? '-' : '';
        return `${sign}${Math.abs(value).toString().padStart(4, '0')}`;
    }

    function getTimezoneOffsetString(date = new Date()) {
        const offsetMinutes = date.getTimezoneOffset();
        const sign = offsetMinutes <= 0 ? '+' : '-';
        const hours = Math.abs(Math.floor(offsetMinutes / 60));
        const minutes = Math.abs(offsetMinutes % 60);

        return `${sign}${pad(hours)}:${pad(minutes)}`;
    }

    function parseNumber(value) {
        const trimmed = String(value ?? '').trim();

        if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) {
            return null;
        }

        const number = Number(trimmed);
        return Number.isFinite(number) ? number : null;
    }

    function parseInteger(value) {
        const trimmed = String(value ?? '').trim();

        if (!/^[+-]?\d+$/.test(trimmed)) {
            return null;
        }

        const number = Number(trimmed);
        return Number.isSafeInteger(number) ? number : null;
    }

    function copyToClipboard(text) {
        if (!text) return;

        const notify = () => showToast();

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(notify)
                .catch(() => fallbackCopyToClipboard(text, notify));
            return;
        }

        fallbackCopyToClipboard(text, notify);
    }

    function fallbackCopyToClipboard(text, done) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.left = '-9999px';

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            if (!successful) {
                throw new Error('Copy command was unsuccessful');
            }

            done();
        } catch (err) {
            console.error('Failed to copy:', err);
        } finally {
            document.body.removeChild(textarea);
        }
    }

    function showToast() {
        const toast = elements.toast;
        if (!toast) return;

        toast.classList.remove('opacity-0');

        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }

        toastTimeout = setTimeout(() => {
            toast.classList.add('opacity-0');
        }, 2000);
    }

    function setText(element, value = '') {
        if (element) {
            element.textContent = value;
        }
    }

    function setHTML(element, value = '') {
        if (element) {
            element.innerHTML = value;
        }
    }
});
