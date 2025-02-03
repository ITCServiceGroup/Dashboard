document.addEventListener('DOMContentLoaded', () => {
   // Initialize Choices on the multi‑select fields
const supervisorChoices = new Choices('#filter-supervisor', {
  removeItemButton: true,
  placeholder: true,
  placeholderValue: 'Select Supervisor(s)',
  itemSelectText: '', // <-- Remove default text here
  classNames: {
    itemChoice: 'custom-choice'
  }
});

const ldapChoices = new Choices('#filter-ldap', {
  removeItemButton: true,
  placeholder: true,
  placeholderValue: 'Select LDAP(s)',
  itemSelectText: '', // <-- Remove default text here
  classNames: {
    itemChoice: 'custom-choice'
  }
});

const marketChoices = new Choices('#filter-market', {
  removeItemButton: true,
  placeholder: true,
  placeholderValue: 'Select Market(s)',
  itemSelectText: '', // <-- Remove default text here
  classNames: {
    itemChoice: 'custom-choice'
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
    // (Filtering, sorting, pagination, export functions, etc.)
    
    // This array will hold all LDAP options (with associated supervisor info)
    let allLdapOptions = [];
    
    // Pagination and sorting state
    let currentPage = 1;
    const pageSize = 10;
    let currentSortField = 'date_of_test';
    let currentSortOrder = 'desc'; // descending by default
    
    // Store current page results (for export if desired)
    let currentResults = [];
    
    loadFilterOptions();
    
    document.getElementById('date-preset').addEventListener('change', handleDatePresetChange);
    // Immediately update the date inputs based on the default preset.
    handleDatePresetChange();

    document.querySelectorAll('#results-table th').forEach(th => {
      th.addEventListener('click', () => {
        const sortField = th.dataset.sort;
        if (currentSortField === sortField) {
          currentSortOrder = (currentSortOrder === 'asc') ? 'desc' : 'asc';
        } else {
          currentSortField = sortField;
          currentSortOrder = 'asc';
        }
        currentPage = 1;
        loadResults();
      });
    });
    
    document.getElementById('filter-form').addEventListener('submit', (e) => {
      e.preventDefault();
      currentPage = 1;
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
          currentPage = 1;
          loadResults();
      });
    }
    
    function checkFilters() {
      const formData = new FormData(filterForm);
      let hasValue = false;
      for (let [key, value] of formData.entries()){
         if(value.trim()){
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
    
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    
      const { data, error, count } = await query;
      if (error) {
        console.error('Error loading results:', error);
        return;
      }
      currentResults = data;
      renderResults(data);
      updatePaginationControls(count);
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
    
    function updatePaginationControls(totalCount) {
      const paginationDiv = document.getElementById('pagination-controls');
      paginationDiv.innerHTML = '';
      const totalPages = Math.ceil(totalCount / pageSize);
    
      const prevButton = document.createElement('button');
      prevButton.textContent = 'Previous';
      prevButton.disabled = currentPage === 1;
      prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          loadResults();
        }
      });
      paginationDiv.appendChild(prevButton);
    
      const pageButtonsToShow = 5;
      let startPage = Math.max(1, currentPage - Math.floor(pageButtonsToShow / 2));
      let endPage = Math.min(totalPages, startPage + pageButtonsToShow - 1);
      startPage = Math.max(1, endPage - pageButtonsToShow + 1);
    
      for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) {
          btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
          currentPage = i;
          loadResults();
        });
        paginationDiv.appendChild(btn);
      }
    
      const nextButton = document.createElement('button');
      nextButton.textContent = 'Next';
      nextButton.disabled = currentPage === totalPages;
      nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          loadResults();
        }
      });
      paginationDiv.appendChild(nextButton);
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

});