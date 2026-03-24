document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const msValue = params.get('ms');

    if (msValue) {
        const ms = parseInt(msValue, 10);
        if (!isNaN(ms)) {
            showMsReferenceGuide(ms);
        }
    }

    function showMsReferenceGuide(ms) {
        const sections = document.querySelectorAll('.converter-section');
        sections.forEach(section => section.style.display = 'none');

        const referenceSection = document.getElementById('msReferenceSection');
        referenceSection.style.display = 'block';

        const msValueInput = document.getElementById('msValueInput');
        msValueInput.value = ms;

        updateConversions(ms);

        msValueInput.addEventListener('input', function() {
            const newMs = parseInt(this.value, 10);
            if (!isNaN(newMs)) {
                updateConversions(newMs);
            }
        });

        msValueInput.addEventListener('blur', function() {
            const newMs = parseInt(this.value, 10);
            if (!isNaN(newMs) && newMs >= 0) {
                window.location.href = '?ms=' + newMs;
            }
        });
    }

    function updateConversions(ms) {
        const msValueEl = document.getElementById('msValueDisplay');
        msValueEl.textContent = ms.toLocaleString();

        const conversions = [
            { unit: 'milliseconds', value: ms, symbol: 'ms' },
            { unit: 'seconds', value: ms / 1000, symbol: 's' },
            { unit: 'minutes', value: ms / 60000, symbol: 'min' },
            { unit: 'hours', value: ms / 3600000, symbol: 'hr' },
            { unit: 'days', value: ms / 86400000, symbol: 'day' },
            { unit: 'months', value: ms / 2629800000, symbol: 'mo' },
            { unit: 'years', value: ms / 31557600000, symbol: 'yr' }
        ];

        const tableBody = document.getElementById('msConversionsBody');
        tableBody.innerHTML = '';

        conversions.forEach((conv, index) => {
            const row = document.createElement('tr');
            row.className = index % 2 === 0 ? 'bg-gray-50' : 'bg-white';

            const unitCell = document.createElement('td');
            unitCell.className = 'px-4 py-2 border-b border-gray-200 font-medium';
            unitCell.textContent = conv.unit.charAt(0).toUpperCase() + conv.unit.slice(1);

            const valueCell = document.createElement('td');
            valueCell.className = 'px-4 py-2 border-b border-gray-200 font-mono text-sm';

            let displayValue;
            if (conv.value >= 1) {
                displayValue = conv.value.toLocaleString(undefined, { maximumFractionDigits: 6 });
            } else {
                displayValue = conv.value.toPrecision(6);
            }
            valueCell.textContent = displayValue + ' ' + conv.symbol;

            row.appendChild(unitCell);
            row.appendChild(valueCell);
            tableBody.appendChild(row);
        });
    }
});
