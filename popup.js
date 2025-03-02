document.addEventListener('DOMContentLoaded', function() {
    loadTemplates();
    loadHistory();
    setupTabButtons();

    document.getElementById('utmForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const source = document.getElementById('source').value;
        const medium = document.getElementById('medium').value;
        const campaign = document.getElementById('campaign').value;
        const customParamKey = document.getElementById('customParamKey').value;
        const customParamValue = document.getElementById('customParamValue').value;

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            const url = new URL(tab.url);

            url.searchParams.set('utm_source', source);
            url.searchParams.set('utm_medium', medium);
            url.searchParams.set('utm_campaign', campaign);

            if (customParamKey && customParamValue) {
                url.searchParams.set(customParamKey, customParamValue);
            }

            const resultElement = document.getElementById('result');
            resultElement.textContent = url.toString();

            document.getElementById('copyButton').style.display = 'block';

            saveToHistory(url.toString());
        });
    });

    document.getElementById('copyButton').addEventListener('click', function() {
        const result = document.getElementById('result').textContent;
        navigator.clipboard.writeText(result).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Error copying text: ', err);
        });
    });

    document.getElementById('saveTemplateButton').addEventListener('click', function() {
        const source = document.getElementById('source').value;
        const medium = document.getElementById('medium').value;
        const campaign = document.getElementById('campaign').value;
        const templateName = prompt("Enter template name:");
        if (templateName) {
            saveTemplate(templateName, source, medium, campaign);
            loadTemplates(); // Refresh the template list in the Templates tab
            alert('Template saved successfully!');
        }
    });

    document.getElementById('clearHistoryButton').addEventListener('click', function() {
        localStorage.removeItem('utmHistory');
        document.getElementById('historyList').innerHTML = ''; // Clear the displayed history
    });

    document.getElementById('customParamToggle').addEventListener('change', function() {
        const customParamContainer = document.getElementById('customParamContainer');
        customParamContainer.style.display = this.checked ? 'block' : 'none';
    });

    document.getElementById('loadTemplateButton').addEventListener('click', function() {
        const selectedCheckbox = document.querySelector('#templateList input[type=checkbox]:checked');
        if (selectedCheckbox) {
            const templateName = selectedCheckbox.dataset.templateName;
            loadSelectedTemplate(templateName);

            // Switch to the "Generate UTM" tab
            switchToTab("generate");
        }
    });

    document.getElementById('deleteTemplateButton').addEventListener('click', function() {
        const selectedCheckboxes = Array.from(document.querySelectorAll('#templateList input[type=checkbox]:checked'));
        selectedCheckboxes.forEach((checkbox) => {
            deleteTemplate(checkbox.dataset.templateName);
        });
        loadTemplates();
    });

    function setupTabButtons() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                switchToTab(this.dataset.tab);
            });
        });
    }

    function switchToTab(tabId) {
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => button.classList.remove('active'));

        document.getElementById(tabId).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    }

    // Function to save a template
    function saveTemplate(name, source, medium, campaign) {
        let templates = localStorage.getItem('utmTemplates');
        templates = templates ? JSON.parse(templates) : []; // Ensure it's an array
        templates.push({ name, source, medium, campaign });
        localStorage.setItem('utmTemplates', JSON.stringify(templates));
    }

    // Function to load templates and display in the Templates tab
    function loadTemplates() {
        let templates = localStorage.getItem('utmTemplates');
        templates = templates ? JSON.parse(templates) : [];
        const templateList = document.getElementById('templateList');
        templateList.innerHTML = ''; // Clear existing list

        templates.forEach(template => {
            const row = document.createElement('tr');
            const templateCell = document.createElement('td');
            templateCell.textContent = `${template.name} (Source: ${template.source}, Medium: ${template.medium}, Campaign: ${template.campaign})`;
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.templateName = template.name;
            checkbox.addEventListener('change', function() {
                const checkedCheckboxes = Array.from(document.querySelectorAll('#templateList input[type=checkbox]:checked'));
                if (checkedCheckboxes.length > 1) {
                    document.getElementById('loadTemplateButton').classList.add('disabled');
                } else {
                    document.getElementById('loadTemplateButton').classList.remove('disabled');
                }
            });
            checkboxCell.appendChild(checkbox);
            row.appendChild(templateCell);
            row.appendChild(checkboxCell);
            templateList.insertBefore(row, templateList.firstChild); // Add to the top
        });
    }

    // Function to load a selected template
    function loadSelectedTemplate(selectedTemplateName) {
        const templates = JSON.parse(localStorage.getItem('utmTemplates'));
        const selectedTemplate = templates.find(template => template.name === selectedTemplateName);
        if (selectedTemplate) {
            document.getElementById('source').value = selectedTemplate.source;
            document.getElementById('medium').value = selectedTemplate.medium;
            document.getElementById('campaign').value = selectedTemplate.campaign;
        }
    }

    // Function to delete a template
    function deleteTemplate(selectedTemplateName) {
        const templates = JSON.parse(localStorage.getItem('utmTemplates'));
        const updatedTemplates = templates.filter(template => template.name !== selectedTemplateName);
        localStorage.setItem('utmTemplates', JSON.stringify(updatedTemplates));
    }

    // Function to save URL to history
    function saveToHistory(url) {
        let history = localStorage.getItem('utmHistory');
        history = history ? JSON.parse(history) : [];
        history.push(url);
        localStorage.setItem('utmHistory', JSON.stringify(history));
        loadHistory();
    }

    // Function to load history and display it
    function loadHistory() {
        let history = localStorage.getItem('utmHistory');
        history = history ? JSON.parse(history) : [];
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        history.forEach((url, index) => {
            const row = document.createElement('tr');
            const urlCell = document.createElement('td');
            urlCell.style.wordBreak = 'break-all'; // Ensure long URLs wrap
            urlCell.textContent = url;
            const copyCell = document.createElement('td');
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy';
            copyButton.addEventListener('click', function() {
                navigator.clipboard.writeText(url).then(() => {
                    alert('Copied to clipboard!');
                }).catch(err => {
                    console.error('Error copying text: ', err);
                });
            });
            copyCell.appendChild(copyButton);
            row.appendChild(urlCell);
            row.appendChild(copyCell);
            historyList.insertBefore(row, historyList.firstChild); // Add to the top

            if (index === history.length - 1) return; // Skip adding divider for the last item
            const dividerRow = document.createElement('tr');
            const dividerCell = document.createElement('td');
            dividerCell.colSpan = 2;
            dividerCell.style.borderBottom = '1px solid #ccc';
            dividerRow.appendChild(dividerCell);
            historyList.insertBefore(dividerRow, historyList.firstChild); // Add divider before the new row
        });
    }
});
