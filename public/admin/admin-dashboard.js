(function () {
  'use strict';

  var token = localStorage.getItem('cc_admin_token');
  if (!token) {
    window.location.href = '/admin';
    return;
  }

  document.getElementById('adminEmailLabel').textContent = localStorage.getItem('cc_admin_email') || 'Admin';

  function authHeaders() {
    return { Authorization: 'Bearer ' + token };
  }

  function logout() {
    localStorage.removeItem('cc_admin_token');
    localStorage.removeItem('cc_admin_email');
    window.location.href = '/admin';
  }
  document.getElementById('logoutBtn').addEventListener('click', logout);

  var toast = document.getElementById('toast');
  var toastMsg = document.getElementById('toastMsg');
  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add('active');
    setTimeout(function () { toast.classList.remove('active'); }, 3000);
  }

  function handleAuthFailure(status) {
    if (status === 401) {
      showToast('Session expired — please log in again.');
      setTimeout(logout, 1200);
      return true;
    }
    return false;
  }

  var allEnquiries = [];
  var tbody = document.getElementById('enquiriesBody');
  var searchInput = document.getElementById('searchInput');
  var statusFilter = document.getElementById('statusFilter');

  function fmtDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function statusClass(status) {
    return status.replace(/\s+/g, '-');
  }

  function renderStats() {
    document.getElementById('statTotal').textContent = allEnquiries.length;
    document.getElementById('statPending').textContent = allEnquiries.filter(function (e) { return e.status === 'Pending'; }).length;
    document.getElementById('statWorking').textContent = allEnquiries.filter(function (e) { return e.status === 'Working On'; }).length;
    document.getElementById('statCompleted').textContent = allEnquiries.filter(function (e) { return e.status === 'Completed'; }).length;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function renderTable() {
    var q = searchInput.value.trim().toLowerCase();
    var statusQ = statusFilter.value;

    var filtered = allEnquiries.filter(function (e) {
      var matchesQ = !q || [e.fullName, e.businessName, e.email, e.phone].join(' ').toLowerCase().indexOf(q) !== -1;
      var matchesStatus = statusQ === 'all' || e.status === statusQ;
      return matchesQ && matchesStatus;
    });

    if (!filtered.length) {
      tbody.innerHTML =
        '<tr><td colspan="7"><div class="empty-state">' +
        '<svg viewBox="0 0 24 24" fill="none"><path d="M3 7h18M3 12h18M3 17h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
        '<div>No enquiries match your search.</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (e) {
      var desc = escapeHtml(e.description || '');
      var isLong = desc.length > 90;
      var shortDesc = isLong ? desc.slice(0, 90) + '…' : desc;
      var descHtml = isLong
        ? '<span class="short">' + shortDesc + '</span><span class="full">' + desc + '</span><button type="button" class="toggle-desc">Read more</button>'
        : desc;

      return '' +
        '<tr data-id="' + e._id + '">' +
          '<td data-label="Date">' + fmtDate(e.createdAt) + '</td>' +
          '<td data-label="Contact"><div class="td-name">' + escapeHtml(e.fullName) + '</div><div class="td-sub">' + escapeHtml(e.phone) + ' · ' + escapeHtml(e.email) + '</div></td>' +
          '<td data-label="Business"><div class="td-name">' + escapeHtml(e.businessName) + '</div><div class="td-sub">' + escapeHtml(e.category) + '</div></td>' +
          '<td data-label="Service">' + escapeHtml(e.service) + '</td>' +
          '<td data-label="Message"><div class="td-desc">' + descHtml + '</div></td>' +
          '<td data-label="Status">' +
            '<select class="status-pill-select ' + statusClass(e.status) + '" data-id="' + e._id + '">' +
              ['Pending', 'Working On', 'Completed'].map(function (s) {
                return '<option value="' + s + '"' + (s === e.status ? ' selected' : '') + '>' + s + '</option>';
              }).join('') +
            '</select>' +
          '</td>' +
          '<td data-label="">' +
            '<div class="row-actions">' +
              '<button class="icon-btn delete-btn" data-id="' + e._id + '" aria-label="Delete enquiry">' +
                '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
              '</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
    }).join('');

    // wire up read-more toggles
    tbody.querySelectorAll('.toggle-desc').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wrap = btn.closest('.td-desc');
        wrap.classList.toggle('expanded');
        btn.textContent = wrap.classList.contains('expanded') ? 'Show less' : 'Read more';
      });
    });

    // wire up status changes
    tbody.querySelectorAll('.status-pill-select').forEach(function (sel) {
      sel.addEventListener('change', function () { updateStatus(sel.getAttribute('data-id'), sel.value, sel); });
    });

    // wire up delete
    tbody.querySelectorAll('.delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { deleteEnquiry(btn.getAttribute('data-id')); });
    });
  }

  function loadEnquiries() {
    fetch('/api/admin/enquiries', { headers: authHeaders() })
      .then(function (r) {
        if (handleAuthFailure(r.status)) return null;
        return r.json().then(function (data) { return { ok: r.ok, data: data }; });
      })
      .then(function (res) {
        if (!res) return;
        if (!res.ok) throw new Error(res.data.error || 'Could not load enquiries.');
        allEnquiries = res.data;
        renderStats();
        renderTable();
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">' + escapeHtml(err.message) + '</div></td></tr>';
      });
  }

  function updateStatus(id, status, selectEl) {
    selectEl.className = 'status-pill-select ' + statusClass(status);
    fetch('/api/admin/enquiries/' + id, {
      method: 'PATCH',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({ status: status })
    })
      .then(function (r) {
        if (handleAuthFailure(r.status)) return null;
        return r.json().then(function (data) { return { ok: r.ok, data: data }; });
      })
      .then(function (res) {
        if (!res) return;
        if (!res.ok) throw new Error(res.data.error || 'Could not update status.');
        var idx = allEnquiries.findIndex(function (e) { return e._id === id; });
        if (idx > -1) allEnquiries[idx].status = status;
        renderStats();
        showToast('Status updated.');
      })
      .catch(function (err) {
        showToast(err.message || 'Could not update status.');
        loadEnquiries();
      });
  }

  function deleteEnquiry(id) {
    if (!window.confirm('Delete this enquiry permanently?')) return;
    fetch('/api/admin/enquiries/' + id, { method: 'DELETE', headers: authHeaders() })
      .then(function (r) {
        if (handleAuthFailure(r.status)) return null;
        return r.json().then(function (data) { return { ok: r.ok, data: data }; });
      })
      .then(function (res) {
        if (!res) return;
        if (!res.ok) throw new Error(res.data.error || 'Could not delete enquiry.');
        allEnquiries = allEnquiries.filter(function (e) { return e._id !== id; });
        renderStats();
        renderTable();
        showToast('Enquiry deleted.');
      })
      .catch(function (err) { showToast(err.message || 'Could not delete enquiry.'); });
  }

  function downloadWithAuth(url, filename) {
    fetch(url, { headers: authHeaders() })
      .then(function (r) {
        if (handleAuthFailure(r.status)) return null;
        if (!r.ok) throw new Error('Export failed.');
        return r.blob();
      })
      .then(function (blob) {
        if (!blob) return;
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(function (err) { showToast(err.message || 'Export failed.'); });
  }

  document.getElementById('exportExcel').addEventListener('click', function () {
    downloadWithAuth('/api/admin/export/excel', 'content-crafters-enquiries.xlsx');
  });
  document.getElementById('exportPdf').addEventListener('click', function () {
    downloadWithAuth('/api/admin/export/pdf', 'content-crafters-enquiries.pdf');
  });

  searchInput.addEventListener('input', renderTable);
  statusFilter.addEventListener('change', renderTable);

  /* ---------------- ADD CLIENT MODAL ---------------- */
  var addClientOverlay = document.getElementById('addClientOverlay');
  var addClientForm = document.getElementById('addClientForm');
  var addClientError = document.getElementById('addClientError');
  var addClientSubmit = document.getElementById('addClientSubmit');

  function openAddClientModal() {
    addClientForm.reset();
    addClientError.classList.remove('active');
    addClientOverlay.classList.add('active');
  }
  function closeAddClientModal() {
    addClientOverlay.classList.remove('active');
  }

  document.getElementById('addClientBtn').addEventListener('click', openAddClientModal);
  document.getElementById('addClientClose').addEventListener('click', closeAddClientModal);
  addClientOverlay.addEventListener('click', function (e) {
    if (e.target === addClientOverlay) closeAddClientModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && addClientOverlay.classList.contains('active')) closeAddClientModal();
  });

  addClientForm.addEventListener('submit', function (e) {
    e.preventDefault();
    addClientError.classList.remove('active');

    var payload = {
      fullName: document.getElementById('acFullName').value.trim(),
      businessName: document.getElementById('acBusinessName').value.trim(),
      phone: document.getElementById('acPhone').value.trim(),
      email: document.getElementById('acEmail').value.trim(),
      category: document.getElementById('acCategory').value.trim(),
      service: document.getElementById('acService').value,
      description: document.getElementById('acDescription').value.trim(),
      status: document.getElementById('acStatus').value
    };

    addClientSubmit.disabled = true;
    addClientSubmit.textContent = 'Adding…';

    fetch('/api/admin/enquiries', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (handleAuthFailure(r.status)) return null;
        return r.json().then(function (data) { return { ok: r.ok, data: data }; });
      })
      .then(function (res) {
        if (!res) return;
        if (!res.ok) throw new Error(res.data.error || 'Could not add client.');
        allEnquiries.unshift(res.data);
        renderStats();
        renderTable();
        closeAddClientModal();
        showToast('Client added.');
      })
      .catch(function (err) {
        addClientError.textContent = err.message || 'Could not add client.';
        addClientError.classList.add('active');
      })
      .finally(function () {
        addClientSubmit.disabled = false;
        addClientSubmit.textContent = 'Add Client';
      });
  });

  loadEnquiries();
})();
