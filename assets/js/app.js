document.addEventListener('DOMContentLoaded', function () {
    const epochInput = document.getElementById("epochInput");
    const localOutput = document.getElementById("localOutput");
    const utcOutput = document.getElementById("utcOutput");
    const dateInput = document.getElementById("dateInput");
    const timeInput = document.getElementById("timeInput");
    const epochOutput = document.getElementById("epochOutput");

    function convertEpochToLocal() {
        const epochValue = parseInt(epochInput.value);
        if (isNaN(epochValue)) {
            localOutput.textContent = "Epoch Time: Invalid value provided";
            return;
        }
        const date = new Date(epochValue * 1000);
        const localTime = formatDate(date);
        const utcTime = formatDate(date, true);

        displayTime(localOutput, "Local Time: ", localTime);
        displayTime(utcOutput, "UTC Time: ", utcTime);
    }

    function formatDate(date, isUTC = false) {
        return date.toLocaleString('en-US', {
            timeZone: isUTC ? 'UTC' : undefined,
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    }

    function convertLocalToEpoch() {
        const localInput = dateInput.value + "T" + timeInput.value + getTimezoneOffsetString();
        const epochTime = Date.parse(localInput) / 1000;

        if (isNaN(epochTime)) {
            displayTime(epochOutput, "Epoch Time: Invalid date or time format");
        } else {
            displayTime(epochOutput, "Epoch Time: ", epochTime);
        }
    }

    function displayTime(element, label, time) {
        element.textContent = label + time;
    }

    function setQuickOption(hours) {
        const date = new Date();
        date.setHours(date.getHours() - hours);

        const formattedTime = date.toLocaleTimeString([], { hour12: false });
        const formattedDate = formatDateToString(date);
        
        dateInput.value = formattedDate;
        timeInput.value = formattedTime;
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
        const offsetHours = offsetMinutes / 60;
        const sign = offsetHours <= 0 ? '+' : '-';
        const absOffsetHours = Math.abs(offsetHours);
        const formattedOffset = `${sign}${pad(absOffsetHours)}:${pad(offsetMinutes % 60)}`;
        return formattedOffset;
    }

    document.getElementById("convertEpochToLocalBtn").addEventListener("click", convertEpochToLocal);
    document.getElementById("convertLocalToEpochBtn").addEventListener("click", convertLocalToEpoch);

    const quickOptions = document.querySelectorAll(".quick-option");
    quickOptions.forEach(option => {
        option.addEventListener("click", function () {
            setQuickOption(parseInt(option.dataset.hours));
        });
    });

    setQuickOption(0);
});
