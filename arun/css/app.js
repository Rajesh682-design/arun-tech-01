const storageKeys = {
    applicant: 'arunTechApplicant',
    applications: 'arunTechApplications',
    messages: 'arunTechMessages'
};

const hrCredentials = {
    email: 'rajeshgroot1@gmail.com',
    password: 'Rajesh@2007'
};

function readStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
        return fallback;
    }
}

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value = '') {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[character]));
}

function showFormMessage(form, message, type = 'success') {
    let status = form.querySelector('.form-status');
    if (!status) {
        status = document.createElement('p');
        status.className = 'form-status';
        form.appendChild(status);
    }
    status.className = `form-status ${type}`;
    status.textContent = message;
}

function handleRegistration(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.password !== data.confirmPassword) {
        showFormMessage(form, 'Passwords do not match. Please try again.', 'error');
        return;
    }
    saveStorage(storageKeys.applicant, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        createdAt: new Date().toISOString()
    });
    showFormMessage(form, 'Your applicant account has been saved on this device.');
    form.reset();
}

function handleApplicantLogin(form) {
    const applicant = readStorage(storageKeys.applicant, null);
    const data = Object.fromEntries(new FormData(form).entries());
    if (!applicant || applicant.email !== data.email || applicant.password !== data.password) {
        showFormMessage(form, 'Account not found. Register first or check your details.', 'error');
        return;
    }
    sessionStorage.setItem('arunTechApplicantSession', 'true');
    window.location.href = 'applicant-dashboard.html';
}

function handleAdminLogin(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.email !== hrCredentials.email || data.password !== hrCredentials.password) {
        showFormMessage(form, 'Invalid HR email or password.', 'error');
        return;
    }
    sessionStorage.setItem('arunTechHrSession', 'true');
    window.location.href = 'hr-dashboard.html';
}

function handleApplication(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const applications = readStorage(storageKeys.applications, []);
    applications.push({ ...data, id: `AT-${Date.now().toString().slice(-6)}`, status: 'Under review', submittedAt: new Date().toISOString() });
    saveStorage(storageKeys.applications, applications);
    showFormMessage(form, 'Application saved. HR will review your profile shortly.');
    form.reset();
}

function handleContact(form) {
    const messages = readStorage(storageKeys.messages, []);
    messages.push({ ...Object.fromEntries(new FormData(form).entries()), sentAt: new Date().toISOString() });
    saveStorage(storageKeys.messages, messages);
    showFormMessage(form, 'Thanks for reaching out. Your message has been saved.');
    form.reset();
}

document.querySelectorAll('[data-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const handlers = {
            registration: handleRegistration,
            applicantLogin: handleApplicantLogin,
            adminLogin: handleAdminLogin,
            application: handleApplication,
            contact: handleContact
        };
        handlers[form.dataset.form]?.(form);
    });
});

document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.togglePassword);
        if (!input) return;
        const shouldShow = input.type === 'password';
        input.type = shouldShow ? 'text' : 'password';
        button.textContent = shouldShow ? 'Hide' : 'Show';
        button.setAttribute('aria-label', `${shouldShow ? 'Hide' : 'Show'} password`);
    });
});

if (document.querySelector('[data-admin-dashboard]') && sessionStorage.getItem('arunTechHrSession') !== 'true') {
    window.location.href = 'hr-login.html';
}

document.querySelectorAll('[data-admin-logout]').forEach((button) => {
    button.addEventListener('click', () => {
        sessionStorage.removeItem('arunTechHrSession');
        window.location.href = 'hr-login.html';
    });
});

document.querySelectorAll('[data-application-list]').forEach((list) => {
    const applications = readStorage(storageKeys.applications, []);
    const adminView = list.hasAttribute('data-admin-application-list');
    list.innerHTML = applications.length ? applications.slice().reverse().map((application) => adminView ? `<article class="application-record"><div class="record-heading"><div><strong>${escapeHTML(application.fullName || 'Unnamed applicant')}</strong><span>${escapeHTML(application.id)}</span></div><span class="status-pill status-${String(application.status).toLowerCase().replaceAll(' ', '-')}" data-record-status="${escapeHTML(application.id)}">${escapeHTML(application.status)}</span></div><div class="record-details"><p><b>Role</b>${escapeHTML(application.role || 'Not selected')}</p><p><b>Email</b><a href="mailto:${escapeHTML(application.email || '')}">${escapeHTML(application.email || 'Not provided')}</a></p><p><b>Phone</b>${escapeHTML(application.phone || 'Not provided')}</p><p><b>Experience</b>${escapeHTML(application.experience || 'Not provided')}</p><p><b>Submitted</b>${escapeHTML(new Date(application.submittedAt).toLocaleString())}</p></div><div class="record-note"><b>Applicant note</b><p>${escapeHTML(application.coverNote || 'No cover note provided.')}</p></div><div class="record-actions"><button type="button" class="review-button approve" data-review="approve" data-application-id="${escapeHTML(application.id)}">Approve</button><button type="button" class="review-button reject" data-review="reject" data-application-id="${escapeHTML(application.id)}">Reject</button></div></article>` : `<article class="status-row"><div><strong>${escapeHTML(application.role || 'Application')}</strong><span>${escapeHTML(application.id)}</span></div><span class="status-pill">${escapeHTML(application.status)}</span></article>`).join('') : '<p class="empty-state">No applications submitted yet.</p>';
});

document.querySelectorAll('[data-admin-application-list]').forEach((list) => {
    list.addEventListener('click', (event) => {
        const button = event.target.closest('[data-review]');
        if (!button) return;
        const applications = readStorage(storageKeys.applications, []);
        const application = applications.find((item) => item.id === button.dataset.applicationId);
        if (!application) return;
        application.status = button.dataset.review === 'approve' ? 'Approved' : 'Rejected';
        saveStorage(storageKeys.applications, applications);
        window.location.reload();
    });
});

document.querySelectorAll('[data-admin-summary]').forEach((summary) => {
    const applications = readStorage(storageKeys.applications, []);
    const messages = readStorage(storageKeys.messages, []);
    summary.querySelector('[data-count="applications"]').textContent = applications.length;
    summary.querySelector('[data-count="messages"]').textContent = messages.length;
    summary.querySelector('[data-count="candidates"]').textContent = new Set(applications.map((application) => application.email)).size;
});

document.querySelectorAll('[data-count="applications"]').forEach((count) => {
    count.textContent = readStorage(storageKeys.applications, []).length;
});

document.querySelectorAll('[data-message-list]').forEach((list) => {
    const messages = readStorage(storageKeys.messages, []);
    list.innerHTML = messages.length ? messages.slice().reverse().map((message) => `<article class="message-row"><strong>${escapeHTML(message.name || 'Anonymous visitor')}</strong><a href="mailto:${escapeHTML(message.email || '')}">${escapeHTML(message.email || 'No email provided')}</a><span>${escapeHTML(message.phone || 'No phone provided')}</span><p>${escapeHTML(message.message || 'No message provided')}</p></article>`).join('') : '<p class="empty-state">No contact messages yet.</p>';
});
