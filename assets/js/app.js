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

    elements.UUIDv7RandomizeBtn.addEventListener("click", generateRandomUUIDv7);
    elements.copyEpochBtn.addEventListener("click", () => copyToClipboard(elements.epochInput.value));
    elements.copyEpochMsBtn.addEventListener("click", () => copyToClipboard(elements.epochMsInput.value));
    elements.copyUUIDBtn.addEventListener("click", () => copyToClipboard(elements.UUIDv7Output.value));
    elements.clearLocalBtn.addEventListener("click", () => {
        clearLocal();
        setQuickOption(0);
        if (initialEpochFromUrl !== null) {
            clearEpochParam();
        }
    });
    elements.clearISOBtn.addEventListener("click", () => {
        clearISO();
        setQuickOption(0);
        if (initialEpochFromUrl !== null) {
            clearEpochParam();
        }
    });
    elements.clearEpochBtn.addEventListener("click", () => {
        elements.epochInput.value = '';
        elements.epochMsInput.value = '';
        elements.localOutput12hr.innerHTML = '';
        elements.localOutput24hr.innerHTML = '';
        elements.isoTZOutput.innerHTML = '';
        elements.utcOutput.innerHTML = '';
        elements.utcOutput24hr.innerHTML = '';
        elements.isoUTCOutput.innerHTML = '';
        clearEpochParam();
        setQuickOption(0);
    });

    const urlParams = new URLSearchParams(window.location.search);
    let initialEpochFromUrl = null;

    if (!urlParams.has('ms')) {
        const epochParam = urlParams.get('epoch');
        if (epochParam) {
            const epoch = parseInt(epochParam, 10);
            if (!isNaN(epoch)) {
                initialEpochFromUrl = epoch;
                elements.epochInput.value = epoch;
                elements.epochMsInput.value = epoch * 1000;
                convertEpochToLocal();
            }
        }
    }

    function clearEpochParam() {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete('epoch');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.pushState({}, '', newUrl);
        initialEpochFromUrl = null;
    }

    elements.epochInput.addEventListener("input", () => {
        if (elements.epochInput.value.length > 0) {
            elements.epochMsInput.value = Math.floor(parseInt(elements.epochInput.value, 10) * 1000);
            convertEpochToLocal();
            if (initialEpochFromUrl !== null && parseInt(elements.epochInput.value, 10) !== initialEpochFromUrl) {
                clearEpochParam();
            }
        }
    });

    elements.epochMsInput.addEventListener("input", () => {
        if (elements.epochMsInput.value.length > 0) {
            elements.epochInput.value = Math.floor(parseInt(elements.epochMsInput.value, 10) / 1000);
            convertEpochToLocal();
            if (initialEpochFromUrl !== null && parseInt(elements.epochMsInput.value, 10) !== initialEpochFromUrl * 1000) {
                clearEpochParam();
            }
        }
    });
    elements.localOutput24hr.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace('Local 24hr: ', ''));
    });
    elements.utcOutput.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace('UTC 12hr: ', ''));
    });
    elements.utcOutput24hr.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace('UTC 24hr: ', ''));
    });
    elements.isoTZOutput.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace('ISO Local: ', ''));
    });
    elements.isoUTCOutput.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace('ISO UTC: ', ''));
    });

    elements.localOutputISO.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace('Local: ', ''));
    });
    elements.utcOutputISO.addEventListener("click", function() {
        copyToClipboard(this.textContent.replace('UTC 12hr: ', ''));
    });

    elements.epochInput.addEventListener("input", () => {
        if (elements.epochInput.value.length > 0) {
            elements.epochMsInput.value = Math.floor(parseInt(elements.epochInput.value, 10) * 1000);
            convertEpochToLocal();
        }
    });

    elements.epochMsInput.addEventListener("input", () => {
        if (elements.epochMsInput.value.length > 0) {
            elements.epochInput.value = Math.floor(parseInt(elements.epochMsInput.value, 10) / 1000);
            convertEpochToLocal();
        }
    });

    elements.UUIDv7Output.addEventListener("input", () => {
        if (elements.UUIDv7Output.value.length > 0) {
            convertUUIDv7ToEpoch();
            if (initialEpochFromUrl !== null) {
                clearEpochParam();
            }
        }
    });

    elements.isoInput.addEventListener("input", () => {
        if (elements.isoInput.value.length > 0) {
            convertISOToLocal();
            if (initialEpochFromUrl !== null) {
                clearEpochParam();
            }
        }
    });

    [elements.dateInput, elements.timeInput].forEach(input => {
        input.addEventListener("change", () => {
            convertLocalToEpoch();
            if (initialEpochFromUrl !== null) {
                clearEpochParam();
            }
        });
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") convertLocalToEpoch();
        });
    });

    if (!initialEpochFromUrl) {
        setQuickOption(0);
    }

    generateRandomUUIDv7();

    function msToEpoch() {
        const msValue = parseInt(elements.epochMsInput.value, 10);
        if (isNaN(msValue)) return showError(elements.localOutput12hr, "Invalid time provided");
        elements.epochInput.value = Math.floor(msValue / 1000);
        convertEpochToLocal();
        
        // Also update Local Date and Time input fields
        const date = new Date(msValue);
        if (!isNaN(date.getTime())) {
            elements.dateInput.value = formatDateToString(date);
            elements.timeInput.value = formatTime(date);
        }
    }

    function generateUUIDv7(timestampMs = null) {
        const ms = timestampMs ? BigInt(timestampMs) : BigInt(Date.now());
        const timeHex = ms.toString(16).padStart(12, '0');
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
        const uuid = elements.UUIDv7Output.value;
        if (!uuid || uuid.length < 10) return;
        
        try {
            const timeHex = uuid.replace(/-/g, '').slice(0, 12);
            const epochMs = parseInt(timeHex, 16);
            
            if (isNaN(epochMs) || epochMs <= 0) {
                console.error('Invalid UUIDv7 timestamp:', timeHex);
                return;
            }
            
            const epochSeconds = Math.floor(epochMs / 1000);
            elements.epochInput.value = epochSeconds;
            elements.epochMsInput.value = epochMs;
            
            // Create date object and update all outputs
            const date = new Date(epochMs);
            if (isNaN(date.getTime())) {
                console.error('Invalid date from UUIDv7 timestamp:', epochMs);
                return;
            }
            
            updateOutputs(date);
            elements.isoInput.value = formatISOUTC(date);
            
            // Update Local Date and Time input fields
            elements.dateInput.value = formatDateToString(date);
            elements.timeInput.value = formatTime(date);
        } catch (error) {
            console.error('Error converting UUIDv7 to epoch:', error);
        }
    }

    function convertEpochToLocal() {
        const epochValue = parseInt(elements.epochInput.value, 10);
        if (isNaN(epochValue)) return showError(elements.localOutput12hr, "Invalid epoch time");

        const date = new Date(epochValue * 1000);
        if (isNaN(date.getTime())) return showError(elements.localOutput12hr, "Invalid date");
        
        updateOutputs(date);
        elements.isoInput.value = formatISOUTC(date)
        
        // Update Local Date and Time input fields
        elements.dateInput.value = formatDateToString(date);
        elements.timeInput.value = formatTime(date);
    }

    function convertLocalToEpoch() {
        const dateVal = elements.dateInput.value;
        const timeVal = elements.timeInput.value;
        
        if (!dateVal || !timeVal) return;

        const localInput = `${dateVal}T${timeVal}.000${getTimezoneOffsetString()}`;
        const epochTime = Date.parse(localInput) / 1000;

        if (isNaN(epochTime)) return;
        
        elements.isoInput.value = localInput;
        elements.epochInput.value = epochTime;
        elements.epochMsInput.value = epochTime * 1000;

        const date = new Date(epochTime * 1000);
        updateOutputs(date);
    }

    function convertISOToLocal() {
        const isoString = elements.isoInput.value.replace(/\s/g, '');
        if (!isoString) return clearISO();

        const date = new Date(isoString);
        if (isNaN(date.getTime())) return showError(elements.localOutputISO, "Invalid ISO 8601 string");

        const epochTime = Math.floor(date.getTime() / 1000);
        updateISOOutputs(date);
        elements.dateInput.value = formatDateToString(date);
        elements.timeInput.value = formatTime(date);
        elements.epochInput.value = epochTime;
        elements.epochMsInput.value = date.getTime();
        updateOutputs(date);
    }

    function updateOutputs(date) {
        const epochSeconds = Math.floor(date.getTime() / 1000);
        const epochMs = date.getTime();
        elements.localOutput12hr.innerHTML = `<strong>Local 12hr:</strong> ${formatDate(date, false, true)}`;
        elements.localOutput24hr.innerHTML = `<strong>Local 24hr:</strong> ${formatDate(date, false, false)}`;
        elements.isoTZOutput.innerHTML = `<strong>ISO Local:</strong> ${formatISOTZ(date)}`;
        elements.utcOutput.innerHTML = `<strong>UTC 12hr:</strong> ${formatDate(date, true, true)}`;
        elements.utcOutput24hr.innerHTML = `<strong>UTC 24hr:</strong> ${formatDate(date, true, false)}`;
        elements.isoUTCOutput.innerHTML = `<strong>ISO UTC:</strong> ${formatISOUTC(date)}`;
        elements.UUIDv7Output.value = generateUUIDv7(date.getTime());
    }

    function updateISOOutputs(date) {
        elements.localOutputISO.innerHTML = `<strong>Local:</strong> ${formatDate(date, false, true)}`;
        elements.utcOutputISO.innerHTML = `<strong>UTC:</strong> ${formatDate(date, true, true)}`;
    }

    function formatISOTZ(date) {
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        const offset = date.getTimezoneOffset();
        const sign = offset <= 0 ? '+' : '-';
        const offsetHours = pad(Math.abs(Math.floor(offset / 60)));
        const offsetMinutes = pad(Math.abs(offset % 60));
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000${sign}${offsetHours}:${offsetMinutes}`;
    }

    function formatISOUTC(date) {
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1);
        const day = pad(date.getUTCDate());
        const hours = pad(date.getUTCHours());
        const minutes = pad(date.getUTCMinutes());
        const seconds = pad(date.getUTCSeconds());
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000+00:00`;
    }

    function showError(element, message) {
        element.innerHTML = `<span class="text-red-600">${message}</span>`;
    }

    function clearLocal() {
        elements.dateInput.value = '';
        elements.timeInput.value = '';
        elements.epochInput.value = '';
        elements.epochMsInput.value = '';
    }

    function clearISO() {
        elements.isoInput.value = '';
        elements.localOutputISO.textContent = '';
        elements.utcOutputISO.textContent = '';
        elements.isoTZOutput.textContent = '';
        elements.isoUTCOutput.textContent = '';
        elements.epochInput.value = '';
        elements.epochMsInput.value = '';
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

    function copyToClipboard(text) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            showToast();
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    function showToast() {
        const toast = elements.toast;
        toast.classList.remove('opacity-0');
        setTimeout(() => {
            toast.classList.add('opacity-0');
        }, 2000);
    }
});

