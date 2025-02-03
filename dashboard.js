document.addEventListener('DOMContentLoaded', () => {
    function customTemplates(template) {
        return {
          item: (classNames, data) => {
            // This template defines the markup for a selected item (including the remove button).
            return template(`
              <div class="${classNames.item} ${data.highlighted ? classNames.highlightedState : ''}" 
                   data-item 
                   data-id="${data.id}" 
                   data-value="${data.value}" 
                   ${data.active ? 'aria-selected="true"' : ''} 
                   ${data.disabled ? 'aria-disabled="true"' : ''}>
                ${data.label}
                <button type="button" 
                        style="color: #1c447f; font-size: 16px; line-height: 20px; background: transparent; border: none; padding: 0; margin-left: 4px;"
                        class="${classNames.button}" 
                        data-button>
                  ×
                </button>
              </div>
            `);
          },
          
        };
      }
    
    // Initialize Choices on the multi‑select fields using the custom template.
const supervisorChoices = new Choices('#filter-supervisor', {
    removeItemButton: true,
    placeholder: true,
    placeholderValue: 'Select Supervisor(s)',
    itemSelectText: '', // Remove default text
    callbackOnCreateTemplates: customTemplates, // Use our custom templates
    classNames: {
      itemChoice: 'custom-choice',
      itemButton: 'custom-remove-button'
    }
  });
  
  const ldapChoices = new Choices('#filter-ldap', {
    removeItemButton: true,
    placeholder: true,
    placeholderValue: 'Select LDAP(s)',
    itemSelectText: '', // Remove default text
    callbackOnCreateTemplates: customTemplates,
    classNames: {
      itemChoice: 'custom-choice',
      itemButton: 'custom-remove-button'
    }
  });
  
  const marketChoices = new Choices('#filter-market', {
    removeItemButton: true,
    placeholder: true,
    placeholderValue: 'Select Market(s)',
    itemSelectText: '', // Remove default text
    callbackOnCreateTemplates: customTemplates,
    classNames: {
      itemChoice: 'custom-choice',
      itemButton: 'custom-remove-button'
    }
  });
  
    // For the date preset dropdown, it's already set:
    const datePresetChoices = new Choices('#date-preset', {
      searchEnabled: false,
      shouldSort: false,
      itemSelectText: '',
      classNames: {
        containerInner: 'custom-date-select',
        itemChoice: 'custom-choice'
      }
    });
        
    // The rest of your dashboard.js code remains unchanged.
    // (Filtering, sorting, export functions, etc.)
  
    // This array will hold all LDAP options (with associated supervisor info)
    let allLdapOptions = [];
  
    // Sorting state
    let currentSortField = 'date_of_test';
    let currentSortOrder = 'desc'; // descending by default
  
    // Store current results (for export if desired)
    let currentResults = [];
  
    loadFilterOptions();
  
    document.getElementById('date-preset').addEventListener('change', handleDatePresetChange);
    // Immediately update the date inputs based on the default preset.
    handleDatePresetChange();
  
    // Remove pagination-related resetting; simply load results on sorting.
    document.querySelectorAll('#results-table th').forEach(th => {
      th.addEventListener('click', () => {
        const sortField = th.dataset.sort;
        if (currentSortField === sortField) {
          currentSortOrder = (currentSortOrder === 'asc') ? 'desc' : 'asc';
        } else {
          currentSortField = sortField;
          currentSortOrder = 'asc';
        }
        loadResults();
      });
    });
  
    document.getElementById('filter-form').addEventListener('submit', (e) => {
      e.preventDefault();
      loadResults();
    });
  
    document.getElementById('filter-supervisor').addEventListener('change', () => {
      const selectedSupervisors = supervisorChoices.getValue(true);
      let filteredLdapOptions;
      if (selectedSupervisors.length > 0) {
        filteredLdapOptions = allLdapOptions.filter(opt => selectedSupervisors.includes(opt.supervisor));
      } else {
        filteredLdapOptions = allLdapOptions;
      }
      ldapChoices.setChoices(filteredLdapOptions, 'value', 'label', true);
    });
  
    document.getElementById('export-csv').addEventListener('click', exportCSV);
    document.getElementById('export-pdf').addEventListener('click', exportPDF);
  
    // --- Added Clear Filters functionality ---
    const clearFiltersBtn = document.getElementById('clear-filters');
    const filterForm = document.getElementById('filter-form');
    if (clearFiltersBtn && filterForm) {
      filterForm.addEventListener('input', checkFilters);
      filterForm.addEventListener('change', checkFilters);
      clearFiltersBtn.addEventListener('click', () => {
        filterForm.reset();
        loadFilterOptions();
        loadResults();
      });
    }
  
    function checkFilters() {
      const formData = new FormData(filterForm);
      let hasValue = false;
      for (let [key, value] of formData.entries()){
        if (value.trim()){
          hasValue = true;
          break;
        }
      }
      clearFiltersBtn.style.display = hasValue ? 'inline-block' : 'none';
    }
    // --- End Clear Filters functionality ---
  
    loadResults();
  
    async function loadFilterOptions() {
      let { data: supervisors, error: supervisorError } = await supabase
        .from('Quiz Results')
        .select('supervisor', { distinct: true });
      if (supervisorError) {
        console.error('Error loading supervisors:', supervisorError);
      } else {
        const supervisorOptions = supervisors
          .filter(item => item.supervisor)
          .map(item => ({ value: item.supervisor, label: item.supervisor }));
        supervisorChoices.setChoices(supervisorOptions, 'value', 'label', true);
      }
  
      let { data: markets, error: marketError } = await supabase
        .from('Quiz Results')
        .select('market', { distinct: true });
      if (marketError) {
        console.error('Error loading markets:', marketError);
      } else {
        const marketOptions = markets
          .filter(item => item.market)
          .map(item => ({ value: item.market, label: item.market }));
        marketChoices.setChoices(marketOptions, 'value', 'label', true);
      }
  
      let { data: ldaps, error: ldapError } = await supabase
        .from('Quiz Results')
        .select('ldap, supervisor', { distinct: true });
      if (ldapError) {
        console.error('Error loading LDAPs:', ldapError);
      } else {
        allLdapOptions = ldaps
          .filter(item => item.ldap)
          .map(item => ({ value: item.ldap, label: item.ldap, supervisor: item.supervisor }));
        ldapChoices.setChoices(allLdapOptions, 'value', 'label', true);
      }
    }
  
    function handleDatePresetChange() {
      const preset = document.getElementById('date-preset').value;
      const startDateInput = document.getElementById('start-date');
      const endDateInput = document.getElementById('end-date');
      const today = new Date();
      let startDate, endDate;
  
      if (preset === 'last_7_days') {
        endDate = today;
        startDate = new Date();
        startDate.setDate(today.getDate() - 7);
      } else if (preset === 'last_month') {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      } else if (preset === 'last_quarter') {
        const currentMonth = today.getMonth();
        const currentQuarter = Math.floor(currentMonth / 3) + 1;
        const lastQuarter = currentQuarter - 1 > 0 ? currentQuarter - 1 : 4;
        let year = today.getFullYear();
        if (currentQuarter === 1) {
          year = year - 1;
        }
        const firstMonthOfLastQuarter = (lastQuarter - 1) * 3;
        startDate = new Date(year, firstMonthOfLastQuarter, 1);
        endDate = new Date(year, firstMonthOfLastQuarter + 3, 0);
      } else {
        return;
      }
      // Format the dates as YYYY-MM-DD
      startDateInput.value = startDate.toISOString().split('T')[0];
      endDateInput.value = endDate.toISOString().split('T')[0];
    }
  
    async function loadResults() {
      let query = supabase.from('Quiz Results').select('*', { count: 'exact' });
  
      const selectedSupervisors = supervisorChoices.getValue(true);
      if (selectedSupervisors.length > 0) {
        query = query.in('supervisor', selectedSupervisors);
      }
      const selectedLdaps = ldapChoices.getValue(true);
      if (selectedLdaps.length > 0) {
        query = query.in('ldap', selectedLdaps);
      }
      const selectedMarkets = marketChoices.getValue(true);
      if (selectedMarkets.length > 0) {
        query = query.in('market', selectedMarkets);
      }
  
      const startDate = document.getElementById('start-date').value;
      const endDate = document.getElementById('end-date').value;
      if (startDate) {
        query = query.gte('date_of_test', startDate);
      }
      if (endDate) {
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        query = query.lt('date_of_test', endDatePlusOne.toISOString().split('T')[0]);
      }
  
      const minScore = document.getElementById('min-score').value;
      const maxScore = document.getElementById('max-score').value;
      if (minScore !== '') {
        query = query.gte('score_value', parseFloat(minScore));
      }
      if (maxScore !== '') {
        query = query.lte('score_value', parseFloat(maxScore));
      }
  
      const minTime = document.getElementById('min-time').value;
      const maxTime = document.getElementById('max-time').value;
      if (minTime !== '') {
        query = query.gte('time_taken', parseInt(minTime, 10));
      }
      if (maxTime !== '') {
        query = query.lte('time_taken', parseInt(maxTime, 10));
      }
  
      query = query.order(currentSortField, { ascending: currentSortOrder === 'asc' });
  
      // Remove the range (pagination) restriction so that all matching results are returned.
      // (If needed, you could add a high range limit here, e.g.: query = query.range(0, 500);)
  
      const { data, error, count } = await query;
      if (error) {
        console.error('Error loading results:', error);
        return;
      }
      currentResults = data;
      renderResults(data);
  
      // Since pagination is removed, the pagination controls are no longer needed.
      // If you want to remove/hide them, do so in your HTML/CSS.
      
      // NEW: If charts.js is loaded, update the charts with the current data.
      if (typeof updateCharts === 'function') {
        updateCharts(data);
      }
    }
  
    function renderResults(data) {
      const tbody = document.getElementById('results-body');
      tbody.innerHTML = '';
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No results found.</td></tr>';
        return;
      }
      data.forEach(item => {
        const date = new Date(item.date_of_test).toLocaleDateString();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${date}</td>
            <td>${item.ldap}</td>
            <td>${item.quiz_type}</td>
            <td>${item.score_text}</td>
            <td>${item.supervisor}</td>
            <td>${item.market}</td>
            <td>${formatTime(item.time_taken)}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  
    // Helper function to convert seconds to Minutes:Seconds (MM:SS)
    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return minutes + ":" + (secs < 10 ? "0" : "") + secs;
    }
  
    async function exportCSV() {
      let query = supabase.from('Quiz Results').select('*');
  
      const selectedSupervisors = supervisorChoices.getValue(true);
      if (selectedSupervisors.length > 0) {
        query = query.in('supervisor', selectedSupervisors);
      }
      const selectedLdaps = ldapChoices.getValue(true);
      if (selectedLdaps.length > 0) {
        query = query.in('ldap', selectedLdaps);
      }
      const selectedMarkets = marketChoices.getValue(true);
      if (selectedMarkets.length > 0) {
        query = query.in('market', selectedMarkets);
      }
      const startDate = document.getElementById('start-date').value;
      const endDate = document.getElementById('end-date').value;
      if (startDate) {
        query = query.gte('date_of_test', startDate);
      }
      if (endDate) {
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        query = query.lt('date_of_test', endDatePlusOne.toISOString().split('T')[0]);
      }
      const minScore = document.getElementById('min-score').value;
      const maxScore = document.getElementById('max-score').value;
      if (minScore !== '') {
        query = query.gte('score_value', parseFloat(minScore));
      }
      if (maxScore !== '') {
        query = query.lte('score_value', parseFloat(maxScore));
      }
      const minTime = document.getElementById('min-time').value;
      const maxTime = document.getElementById('max-time').value;
      if (minTime !== '') {
        query = query.gte('time_taken', parseInt(minTime, 10));
      }
      if (maxTime !== '') {
        query = query.lte('time_taken', parseInt(maxTime, 10));
      }
      query = query.order(currentSortField, { ascending: currentSortOrder === 'asc' });
      const { data, error } = await query;
      if (error) {
        console.error('Error exporting CSV:', error);
        return;
      }
      let csv = 'Date,LDAP,Quiz Type,Score Text,Supervisor,Market,Time Taken\n';
      data.forEach(item => {
        const date = new Date(item.date_of_test).toLocaleDateString();
        csv += `"${date}","${item.ldap}","${item.quiz_type}","${item.score_text}","${item.supervisor}","${item.market}","${formatTime(item.time_taken)}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quiz_results.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  
    function exportPDF() {
      console.log("Export PDF triggered.");
      const element = document.getElementById('dashboard-container');
      if (!element) {
        console.error("dashboard-container element not found.");
        return;
      }
    
      const opt = {
        margin: [10, 15, 10, 15],
        filename: 'quiz_results.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'css', before: '.page-break', avoid: 'tr' }
      };
    
      html2pdf().set(opt).from(element).save()
        .then(() => {
          console.log("PDF export completed successfully.");
        })
        .catch(err => {
          console.error("Error exporting PDF:", err);
        });
    }
  
    // Initialize Flatpickr on the start and end date inputs.
    flatpickr("#start-date", {
      dateFormat: "Y-m-d"
    });
    flatpickr("#end-date", {
      dateFormat: "Y-m-d"
    });
  
    // Function to override the inline width of the Choices.js containers
    function overrideChoicesWidth() {
      // Select the generated Choices containers for Supervisor and LDAP
      document.querySelectorAll('#filter-supervisor + .choices, #filter-ldap + .choices').forEach(el => {
        el.style.width = '250px'; // set your desired fixed width
      });
    }
    
    // Use a timeout to ensure Choices.js has recalculated its styles
    setTimeout(overrideChoicesWidth, 100);

// =====================================================
// REMOVE THE DEFAULT PSEUDO‑ELEMENT AND SET CUSTOM CONTENT
// =====================================================
setTimeout(() => {
    // 1. Inject a CSS rule to hide the default ::after pseudo‑element on the remove buttons.
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      html body #dashboard-container .choices__button::after {
        display: none !important;
      }
    `;
    document.head.appendChild(styleEl);
  
    // 2. Iterate over each remove button and set its text content and inline styles.
    document.querySelectorAll('.choices__button').forEach(btn => {
      // Remove any existing inner HTML and set the text content to our custom "×"
      btn.textContent = '×';
      // Force inline styles so that our remove button uses dark blue
      btn.style.setProperty('color', '#1c447f', 'important');
      btn.style.setProperty('font-size', '16px', 'important');
      btn.style.setProperty('line-height', '20px', 'important');
      btn.style.setProperty('background-color', 'transparent', 'important');
    });
  }, 200);
  });