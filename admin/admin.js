let adminUser = null;

function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    if(!toast) return;
    toast.innerText = msg;
    toast.style.background = type === "error" ? "rgba(255,59,48,0.95)" : "rgba(52,199,89,0.95)";
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 3000);
}

function btnLoading(btn, isLoading) {
    const ts = btn.querySelector('.btn-text'), sp = btn.querySelector('.spinner');
    if (isLoading) { btn.disabled = true; ts.style.display = 'none'; sp.style.display = 'block'; }
    else { btn.disabled = false; ts.style.display = 'block'; sp.style.display = 'none'; }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('mobile-open'); document.querySelector('.sidebar-overlay').classList.toggle('mobile-open'); }
function closeModal(event, id) { if(event.target.id === id) document.getElementById(id).style.display = 'none'; }
function forceCloseModal(id) { document.getElementById(id).style.display = 'none'; }

async function handleLogin(btn) {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-pass').value;
    btnLoading(btn, true);
    try {
        const cred = await firebase.auth().signInWithEmailAndPassword(email, pass);
        adminUser = cred.user;
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-layout').style.display = 'flex';
        showToast("Login Successful!");
        loadAllData();
    } catch(e) { showToast("Invalid Credentials!", "error"); }
    btnLoading(btn, false);
}

function switchTab(tabId, element) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(window.innerWidth <= 768) toggleSidebar();
}

function logout() { firebase.auth().signOut(); adminUser = null; localStorage.removeItem('admin_token'); location.reload(); }

function filterUsers() {
    const q = document.getElementById('search-users').value.toLowerCase();
    document.querySelectorAll('#user-list tr').forEach(r => { r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none'; });
}

function filterTrx() {
    const q = document.getElementById('search-trx').value.toLowerCase();
    const typeF = document.getElementById('filter-trx-type').value;
    const statusF = document.getElementById('filter-trx-status').value;
    document.querySelectorAll('#trx-list tr').forEach(r => {
        let show = r.innerText.toLowerCase().includes(q);
        if(typeF && !r.dataset.type?.includes(typeF)) show = false;
        if(statusF && !r.dataset.status?.includes(statusF)) show = false;
        r.style.display = show ? '' : 'none';
    });
}

async function loadAllData() {
    try { const stats = await FB.getStats(); document.getElementById('stat-users').innerText = stats.users; document.getElementById('stat-deposit').innerText = '₹' + stats.deposits; document.getElementById('stat-withdraw').innerText = '₹' + stats.withdrawals; document.getElementById('stat-tournaments').innerText = stats.tournaments; } catch(e) {}

    try {
        const txs = await FB.getAllTransactions();
        let pendingDep = 0, pendingWit = 0;
        txs.forEach(tx => { if(tx.status === 'Pending' && tx.type === 'Deposit') pendingDep++; if(tx.status === 'Pending' && tx.type === 'Withdraw') pendingWit++; });
        document.getElementById('stat-pending-dep').innerText = pendingDep;
        document.getElementById('stat-pending-wit').innerText = pendingWit;
        const tbody = document.getElementById('recent-trx-list'); tbody.innerHTML = '';
        txs.slice(0, 10).forEach(tx => { let badgeColor = tx.status === 'Success' ? 'var(--success)' : tx.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)'; tbody.innerHTML += `<tr><td>${tx.user_id}</td><td style="color:var(--primary); font-weight:700;">${tx.type}</td><td><strong>₹${tx.amount}</strong></td><td><span style="color:${badgeColor}; font-weight:bold; font-size:12px;">${tx.status}</span></td></tr>`; });
    } catch(e) {}

    try { const polls = await FB.getPolls(); let activePolls = polls.filter(p => p.status === 'active').length; document.getElementById('stat-active-polls').innerText = activePolls; } catch(e) {}
    try { const tours = await FB.getTournaments(); let completed = 0; tours.forEach(t => { if(t.status === 'completed') completed++; }); document.getElementById('stat-completed-tour').innerText = completed; } catch(e) {}

    loadUsers(); loadTransactions(); loadTournaments(); loadPolls(); loadSettings();
}

async function loadUsers() {
    try {
        const users = await FB.getAllUsers();
        const tbody = document.getElementById('user-list'); tbody.innerHTML = '';
        if(!users.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No Users</td></tr>'; return; }
        users.forEach(u => {
            const sc = u.status === 'Blocked' ? 'var(--danger)' : 'var(--success)';
            const bt = u.status === 'Blocked' ? 'Unblock' : 'Block';
            tbody.innerHTML += `<tr>
                <td><strong>${u.name}</strong><br><span style="font-size:11px; color:var(--text-muted);">ID: ${u.id}</span></td>
                <td style="font-size:12px;">${u.phone || '-'}<br>${u.email || '-'}</td>
                <td><strong>₹${u.balance || 0}</strong></td>
                <td><span style="font-size:11px; padding:3px 8px; border-radius:6px; background:${u.login_method === 'google' ? 'rgba(66,133,244,0.1); color:#4285f4' : 'rgba(0,0,0,0.05); color:var(--text-muted)'};">${u.login_method || 'local'}</span></td>
                <td><span style="color:${sc}; font-weight:bold; font-size:12px;">${u.status}</span></td>
                <td class="action-btns">
                    <button class="btn" style="padding:4px 10px; font-size:11px;" onclick="showUserDetail('${u.id}')"><i class="fas fa-eye"></i> View</button>
                    <button class="btn btn-warning" style="padding:4px 10px; font-size:11px;" onclick="openBalanceEdit('${u.id}', '${u.name}', ${u.balance || 0})">Edit Bal</button>
                    <button class="btn btn-danger" style="padding:4px 10px; font-size:11px;" onclick="toggleBlockUser('${u.id}', '${u.status}')">${bt}</button>
                    <button class="btn btn-danger" style="padding:4px 10px; font-size:11px; background:#cc0000;" onclick="deleteUser('${u.id}', '${u.name}')"><i class="fas fa-trash"></i></button>
                </td></tr>`;
        });
    } catch(e) {}
}

function openBalanceEdit(userId, name, currentBal) { document.getElementById('edit-u-name').innerText = name + ' (ID: ' + userId + ')'; document.getElementById('edit-u-id').value = userId; document.getElementById('edit-u-bal').value = currentBal; document.getElementById('edit-balance-modal').style.display = 'flex'; }

async function saveBalance(btn) {
    const bal = document.getElementById('edit-u-bal').value;
    const id = document.getElementById('edit-u-id').value;
    if(bal === "") { showToast("Enter amount", "error"); return; }
    btnLoading(btn, true);
    try { await FB.updateUser(id, { balance: Number(bal) }); showToast("Balance Updated!"); forceCloseModal('edit-balance-modal'); loadUsers(); } catch(e) { showToast("Error", "error"); }
    btnLoading(btn, false);
}

async function toggleBlockUser(id, currentStatus) {
    const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    try { await FB.updateUser(id, { status: newStatus }); showToast(`User ${newStatus}`); loadUsers(); } catch(e) { showToast("Error", "error"); }
}

async function deleteUser(id, name) {
    if(!confirm(`Delete user "${name}"? This action cannot be undone!`)) return;
    try { await FB.deleteUser(id); showToast("User deleted!"); loadUsers(); loadAllData(); } catch(e) { showToast("Error", "error"); }
}

// ==================== USER DETAIL MODAL ====================
let currentDetailUserId = null;

function switchUdTab(tab, el) {
    document.querySelectorAll('.ud-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.ud-pane').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById('ud-pane-' + tab);
    if(pane) pane.classList.add('active');
    if(tab === 'wallet' && currentDetailUserId) loadWalletTab(currentDetailUserId);
    if(tab === 'referral' && currentDetailUserId) loadReferralTab(currentDetailUserId);
}

async function showUserDetail(uid) {
    currentDetailUserId = uid;
    document.getElementById('user-detail-modal').style.display = 'flex';

    // Show loading
    document.getElementById('ud-body').innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i><p style="margin-top:10px;">Loading user data...</p></div>`;

    try {
        const user = await FB.getUser(uid);
        if(!user) { document.getElementById('ud-body').innerHTML = '<div style="text-align:center;padding:40px;color:var(--danger);">User not found</div>'; return; }

        // Badge header
        const initial = (user.name || 'U').charAt(0).toUpperCase();
        document.getElementById('ud-avatar').textContent = initial;
        document.getElementById('ud-avatar').style.background = user.avatar ? 'url('+user.avatar+') center/cover no-repeat' : 'linear-gradient(135deg, var(--primary), #5856d6)';
        document.getElementById('ud-user-name').textContent = user.name || 'Unknown';
        document.getElementById('ud-user-id').textContent = 'ID: ' + uid;
        document.getElementById('ud-user-phone').textContent = user.phone ? '📞 ' + user.phone : (user.email || '');
        const badge = document.getElementById('ud-status-badge');
        badge.textContent = user.status || 'Active';
        badge.className = 'ud-status-badge ' + ((user.status === 'Blocked') ? 'blocked' : 'active');

        // Build panes
        document.getElementById('ud-body').innerHTML = `
            <div class="ud-pane active" id="ud-pane-profile">
                ${buildProfilePane(user)}
            </div>
            <div class="ud-pane" id="ud-pane-wallet">
                <div style="text-align:center;padding:30px;color:var(--text-muted);"><i class="fas fa-spinner fa-spin" style="font-size:20px;"></i><p style="margin-top:8px;">Loading wallet...</p></div>
            </div>
            <div class="ud-pane" id="ud-pane-referral">
                <div style="text-align:center;padding:30px;color:var(--text-muted);"><i class="fas fa-spinner fa-spin" style="font-size:20px;"></i><p style="margin-top:8px;">Loading referral data...</p></div>
            </div>
        `;

        // Load wallet & referral in background
        loadWalletTab(uid);
        loadReferralTab(uid);

    } catch(e) {
        document.getElementById('ud-body').innerHTML = '<div style="text-align:center;padding:40px;color:var(--danger);">Error loading user</div>';
    }
}

function buildProfilePane(user) {
    const ffSection = (user.ff_name || user.ff_uid) ? `
        <div class="ud-section-title"><i class="fas fa-gamepad"></i> Game Details</div>
        <div class="ud-info-grid">
            <div class="ud-info-item"><span class="ud-label">FF Name</span><span class="ud-value">${user.ff_name || '-'}</span></div>
            <div class="ud-info-item"><span class="ud-label">FF UID</span><span class="ud-value">${user.ff_uid || '-'}</span></div>
        </div>
    ` : '';

    const bankSection = (user.saved_bank || user.saved_upi) ? `
        <div class="ud-section-title"><i class="fas fa-university"></i> Payment Details</div>
        <div class="ud-info-grid">
            <div class="ud-info-item"><span class="ud-label">Saved UPI</span><span class="ud-value">${user.saved_upi || '-'}</span></div>
            ${user.saved_bank ? `<div class="ud-info-item"><span class="ud-label">Bank Account</span><span class="ud-value">${user.saved_bank}</span></div>` : ''}
        </div>
    ` : '';

    return `
        <div class="ud-section-title"><i class="fas fa-info-circle"></i> Basic Information</div>
        <div class="ud-info-grid">
            <div class="ud-info-item"><span class="ud-label">Full Name</span><span class="ud-value">${user.name || '-'}</span></div>
            <div class="ud-info-item"><span class="ud-label">Phone</span><span class="ud-value">${user.phone || '-'}</span></div>
            <div class="ud-info-item"><span class="ud-label">Email</span><span class="ud-value">${user.email || '-'}</span></div>
            <div class="ud-info-item"><span class="ud-label">Login Method</span><span class="ud-value"><span class="ud-login-method ${user.login_method||'local'}">${user.login_method || 'local'}</span></span></div>
            <div class="ud-info-item"><span class="ud-label">Account Status</span><span class="ud-value"><span class="ud-status-dot ${user.status === 'Blocked' ? 'blocked' : 'active'}"></span> ${user.status || 'Active'}</span></div>
            <div class="ud-info-item"><span class="ud-label">Wallet Balance</span><span class="ud-value ud-balance">₹${(user.balance || 0).toLocaleString('en-IN')}</span></div>
        </div>

        ${ffSection}
        ${bankSection}

        <div class="ud-section-title"><i class="fas fa-calendar"></i> Account Timeline</div>
        <div class="ud-info-grid">
            <div class="ud-info-item"><span class="ud-label">Joined</span><span class="ud-value">${user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '-'}</span></div>
            <div class="ud-info-item"><span class="ud-label">Last Updated</span><span class="ud-value">${user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '-'}</span></div>
        </div>

        <div style="margin-top:15px;display:flex;gap:8px;">
            <button class="btn" style="flex:1;padding:8px;font-size:12px;" onclick="openBalanceEdit('${user.id}','${(user.name||'').replace(/'/g,"\\'")}',${user.balance||0})"><i class="fas fa-coins"></i> Edit Balance</button>
            <button class="btn btn-danger" style="flex:1;padding:8px;font-size:12px;" onclick="toggleBlockUser('${user.id}','${user.status||'Active'}')"><i class="fas ${user.status === 'Blocked' ? 'fa-check-circle' : 'fa-ban'}"></i> ${user.status === 'Blocked' ? 'Unblock' : 'Block'}</button>
        </div>
    `;
}

async function loadWalletTab(uid) {
    const pane = document.getElementById('ud-pane-wallet');
    if(!pane) return;
    try {
        const [user, txs] = await Promise.all([FB.getUser(uid), FB.getTransactions(uid)]);
        if(!user) return;

        let totalDeposit = 0, totalWithdraw = 0, totalWin = 0, totalFees = 0;
        let pendingDep = 0, pendingWit = 0;
        (txs || []).forEach(tx => {
            if(tx.status === 'Success') {
                if(tx.type === 'Deposit') totalDeposit += tx.amount;
                else if(tx.type === 'Withdraw') totalWithdraw += tx.amount;
                else if(tx.type === 'Win') totalWin += tx.amount;
                else if(tx.type === 'Join Fee') totalFees += tx.amount;
            }
            if(tx.status === 'Pending') {
                if(tx.type === 'Deposit') pendingDep += tx.amount;
                if(tx.type === 'Withdraw') pendingWit += tx.amount;
            }
        });

        let txHtml = '';
        if(txs && txs.length) {
            txs.slice(0, 20).forEach(tx => {
                const icon = tx.type === 'Deposit' ? 'fa-arrow-down' : tx.type === 'Withdraw' ? 'fa-arrow-up' : tx.type === 'Win' ? 'fa-trophy' : 'fa-handshake';
                const color = tx.type === 'Deposit' ? 'var(--success)' : tx.type === 'Withdraw' ? 'var(--danger)' : tx.type === 'Win' ? '#FFD700' : 'var(--primary)';
                const statusColor = tx.status === 'Success' ? 'var(--success)' : tx.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)';
                txHtml += `<div class="ud-tx-row">
                    <div class="ud-tx-icon" style="background:${color}20;color:${color};"><i class="fas ${icon}"></i></div>
                    <div class="ud-tx-info">
                        <div class="ud-tx-type">${tx.type}</div>
                        <div class="ud-tx-date">${tx.datetime ? new Date(tx.datetime).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : '-'}</div>
                    </div>
                    <div class="ud-tx-amount" style="color:${tx.type === 'Deposit' || tx.type === 'Win' ? 'var(--success)' : 'var(--danger)'};">${tx.type === 'Deposit' || tx.type === 'Win' ? '+' : '-'}₹${tx.amount}</div>
                    <div class="ud-tx-status" style="color:${statusColor};">${tx.status}</div>
                </div>`;
            });
        } else {
            txHtml = '<div style="text-align:center;padding:20px;color:var(--text-muted);">No transactions yet</div>';
        }

        pane.innerHTML = `
            <div class="ud-wallet-summary">
                <div class="ud-wallet-card total-balance">
                    <div class="ud-wc-label">Current Balance</div>
                    <div class="ud-wc-value">₹${(user.balance || 0).toLocaleString('en-IN')}</div>
                </div>
                <div class="ud-wallet-grid">
                    <div class="ud-wallet-card">
                        <div class="ud-wc-label"><i class="fas fa-arrow-down" style="color:var(--success);"></i> Total Deposit</div>
                        <div class="ud-wc-value" style="color:var(--success);">₹${totalDeposit.toLocaleString('en-IN')}</div>
                    </div>
                    <div class="ud-wallet-card">
                        <div class="ud-wc-label"><i class="fas fa-arrow-up" style="color:var(--danger);"></i> Total Withdraw</div>
                        <div class="ud-wc-value" style="color:var(--danger);">₹${totalWithdraw.toLocaleString('en-IN')}</div>
                    </div>
                    <div class="ud-wallet-card">
                        <div class="ud-wc-label"><i class="fas fa-trophy" style="color:#FFD700;"></i> Total Wins</div>
                        <div class="ud-wc-value" style="color:#FFD700;">₹${totalWin.toLocaleString('en-IN')}</div>
                    </div>
                    <div class="ud-wallet-card">
                        <div class="ud-wc-label"><i class="fas fa-handshake" style="color:var(--primary);"></i> Entry Fees</div>
                        <div class="ud-wc-value" style="color:var(--primary);">₹${totalFees.toLocaleString('en-IN')}</div>
                    </div>
                </div>
                ${pendingDep > 0 || pendingWit > 0 ? `
                <div class="ud-wallet-pending">
                    <i class="fas fa-clock" style="color:var(--warning);"></i> Pending: ${pendingDep > 0 ? 'Deposit ₹'+pendingDep+' ' : ''}${pendingWit > 0 ? 'Withdraw ₹'+pendingWit : ''}
                </div>` : ''}
            </div>
            <div class="ud-section-title" style="margin-top:15px;"><i class="fas fa-list"></i> Recent Transactions</div>
            <div class="ud-tx-list">${txHtml}</div>
        `;
    } catch(e) {
        pane.innerHTML = '<div style="text-align:center;padding:30px;color:var(--danger);">Error loading wallet</div>';
    }
}

async function loadReferralTab(uid) {
    const pane = document.getElementById('ud-pane-referral');
    if(!pane) return;
    try {
        const user = await FB.getUser(uid);
        if(!user) return;

        // Check if user has referral fields
        const hasReferralCode = user.referral_code;
        const referredBy = user.referred_by;

        // Get all users to find who this user referred (if referral_code exists)
        let referredUsers = [];
        if(hasReferralCode) {
            const allUsers = await FB.getAllUsers();
            referredUsers = allUsers.filter(u => u.referred_by === hasReferralCode);
        }

        // Also check if this user was referred by someone
        let referrerName = null;
        if(referredBy) {
            try {
                const refUser = await FB.getUser(referredBy);
                if(refUser) referrerName = refUser.name;
            } catch(e) {}
        }

        const totalReferrals = referredUsers.length;

        pane.innerHTML = `
            <div class="ud-referral-stats">
                <div class="ud-ref-card">
                    <i class="fas fa-users" style="color:var(--primary);font-size:24px;"></i>
                    <div class="ud-ref-count">${totalReferrals}</div>
                    <div class="ud-ref-label">Total Referrals</div>
                </div>
                ${hasReferralCode ? `
                <div class="ud-ref-card">
                    <i class="fas fa-tag" style="color:var(--success);font-size:24px;"></i>
                    <div class="ud-ref-code">${hasReferralCode}</div>
                    <div class="ud-ref-label">Referral Code</div>
                </div>` : ''}
                ${referredBy ? `
                <div class="ud-ref-card">
                    <i class="fas fa-user-plus" style="color:var(--warning);font-size:24px;"></i>
                    <div class="ud-ref-code">${referrerName || referredBy}</div>
                    <div class="ud-ref-label">Referred By</div>
                </div>` : ''}
            </div>

            ${totalReferrals > 0 ? `
            <div class="ud-section-title"><i class="fas fa-list"></i> Referred Users</div>
            <div class="ud-ref-user-list">
                ${referredUsers.map(u => `
                    <div class="ud-ref-user-row" onclick="showUserDetail('${u.id}')">
                        <div class="ud-ref-user-avatar">${(u.name||'U').charAt(0).toUpperCase()}</div>
                        <div class="ud-ref-user-info">
                            <div class="ud-ref-user-name">${u.name || 'Unknown'}</div>
                            <div class="ud-ref-user-detail">${u.phone || u.email || ''}</div>
                        </div>
                        <div class="ud-ref-user-date">${u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : ''}</div>
                    </div>
                `).join('')}
            </div>` : `
            <div class="ud-empty-state">
                <i class="fas fa-share-alt"></i>
                <p>No referral data available for this user.</p>
                <p style="font-size:12px;color:var(--text-muted);margin-top:5px;">Referral tracking is not yet enabled for this account.</p>
            </div>
            <div class="ud-section-title" style="margin-top:15px;"><i class="fas fa-info-circle"></i> About Referrals</div>
            <div style="padding:12px;background:#f9f9fb;border-radius:10px;font-size:12px;color:var(--text-muted);line-height:1.6;">
                The referral system allows users to invite others using a unique referral code. 
                When a referred user joins, the referrer earns rewards. 
                To enable referrals, add <code>referral_code</code> and <code>referred_by</code> fields to user documents in Firestore.
            </div>
            `}
        `;
    } catch(e) {
        pane.innerHTML = '<div style="text-align:center;padding:30px;color:var(--danger);">Error loading referral data</div>';
    }
}

async function loadTransactions() {
    try {
        const txs = await FB.getAllTransactions();
        const tbody = document.getElementById('trx-list'); tbody.innerHTML = '';
        if(!txs.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No transactions</td></tr>'; return; }
        txs.forEach(tx => {
            let extra = tx.type === 'Deposit' ? `UTR: ${tx.utr}` : tx.type === 'Withdraw' ? `UPI: ${tx.upi}` : '';
            let bc = tx.status === 'Success' ? 'var(--success)' : tx.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)';
            tbody.innerHTML += `<tr data-type="${tx.type}" data-status="${tx.status}">
                <td style="font-size:12px;">${tx.user_id}</td>
                <td style="color:var(--primary); font-weight:800; font-size:13px;">${tx.type}</td>
                <td><strong>₹${tx.amount}</strong></td>
                <td style="font-size:11px; color:var(--text-muted);">${extra}</td>
                <td style="font-size:11px;">${tx.datetime || '-'}</td>
                <td><span style="color:${bc}; font-weight:bold; font-size:12px;">${tx.status}</span></td>
                <td class="action-btns">${tx.status === 'Pending' ? `<button class="btn btn-success" style="padding:4px 8px; font-size:11px;" onclick="updateTrx('${tx.id}', 'Success')">Approve</button><button class="btn btn-danger" style="padding:4px 8px; font-size:11px;" onclick="updateTrx('${tx.id}', 'Rejected')">Reject</button>` : '-'}</td></tr>`;
        });
    } catch(e) {}
}

async function updateTrx(id, status) {
    try { await FB.updateTransaction(id, status); showToast(`Transaction ${status}`); loadTransactions(); loadUsers(); } catch(e) { showToast("Error", "error"); }
}

async function loadTournaments() {
    try {
        const tours = await FB.getTournaments();
        const tbody = document.getElementById('tournament-list'); tbody.innerHTML = '';
        tours.forEach(t => {
            let players = t.joinedPlayers ? Object.keys(t.joinedPlayers).length : 0;
            tbody.innerHTML += `<tr>
                <td><strong>${t.title}</strong></td>
                <td style="font-size:12px;">${t.map} <span style="background:rgba(0,122,255,0.1); color:var(--primary); padding:2px 6px; border-radius:6px; font-size:10px; font-weight:700;">${t.type || 'Solo'}</span></td>
                <td style="font-size:12px;">Entry: ₹${t.entry}<br>Prize: ₹${t.prize}</td>
                <td><span style="color:${t.status==='live'?'var(--success)':'var(--warning)'}; font-weight:bold; text-transform:capitalize;">${t.status}</span></td>
                <td style="font-size:12px;">${players}/${t.target || 50}</td>
                <td class="action-btns">
                    <button class="btn" style="padding:4px 10px; font-size:11px;" onclick='editTournament(${JSON.stringify(t).replace(/'/g,"&#39;")})'>Edit</button>
                    <button class="btn btn-danger" style="padding:4px 10px; font-size:11px;" onclick="deleteTournament('${t.id}')">Delete</button>
                </td></tr>`;
        });
    } catch(e) {}
}

async function createOrUpdateTournament(btn) {
    const id = document.getElementById('t-edit-id').value;
    let rawTime = document.getElementById('t-time').value;
    let formattedTime = "TBA", rawTimeObjStr = "";
    if(rawTime) { let [h, m] = rawTime.split(':'); let ampm = h >= 12 ? 'PM' : 'AM'; let h12 = h % 12 || 12; formattedTime = (h12<10?'0'+h12:h12)+':'+m+' '+ampm; let d = new Date(); d.setHours(h,m,0,0); rawTimeObjStr = d.toISOString(); }
    const tData = { image:document.getElementById('t-image').value, title:document.getElementById('t-title').value, map:document.getElementById('t-map').value, type:document.getElementById('t-type').value, status:document.getElementById('t-status').value, entry:Number(document.getElementById('t-entry').value), prize:Number(document.getElementById('t-prize').value), kill:Number(document.getElementById('t-kill').value), time:formattedTime, rawTimeObj:rawTimeObjStr, target:Number(document.getElementById('t-target').value), roomId:document.getElementById('t-room-id').value, roomPass:document.getElementById('t-room-pass').value, showRoom:document.getElementById('t-show-room').value==="true", winnerName:document.getElementById('t-winner-name').value, winnerUid:document.getElementById('t-winner-uid').value, rules:document.getElementById('t-rules').value };
    if(!tData.title) { showToast("Title required!", "error"); return; }
    btnLoading(btn, true);
    try { if(id) { await FB.updateTournament(id, tData); showToast("Updated!"); } else { await FB.createTournament(tData); showToast("Published!"); } cancelEdit(); loadTournaments(); } catch(e) { showToast("Error", "error"); }
    btnLoading(btn, false);
}

function editTournament(t) {
    document.getElementById('t-edit-id').value = t.id;
    document.getElementById('t-image').value = t.image||''; document.getElementById('t-title').value = t.title||''; document.getElementById('t-map').value = t.map||''; document.getElementById('t-type').value = t.type||'Solo'; document.getElementById('t-status').value = t.status||'live'; document.getElementById('t-entry').value = t.entry||''; document.getElementById('t-prize').value = t.prize||''; document.getElementById('t-kill').value = t.kill||''; document.getElementById('t-target').value = t.target||''; document.getElementById('t-room-id').value = t.room_id||''; document.getElementById('t-room-pass').value = t.room_pass||''; document.getElementById('t-show-room').value = t.show_room?"true":"false"; document.getElementById('t-winner-name').value = t.winner_name||''; document.getElementById('t-winner-uid').value = t.winner_uid||''; document.getElementById('t-rules').value = t.rules||'';
    if(t.raw_time_obj) { let d=new Date(t.raw_time_obj); document.getElementById('t-time').value=`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; } else document.getElementById('t-time').value='';
    document.getElementById('t-btn-text').innerText = "Update Tournament"; document.getElementById('btn-t-cancel').style.display = "inline-flex"; showToast("Loaded for editing");
}

async function deleteTournament(id) { if(!confirm("Delete tournament?")) return; try { await FB.deleteTournament(id); showToast("Deleted!"); loadTournaments(); } catch(e) { showToast("Error","error"); } }

function cancelEdit() { ['t-edit-id','t-image','t-title','t-map','t-entry','t-prize','t-kill','t-time','t-target','t-room-id','t-room-pass','t-winner-name','t-winner-uid','t-rules'].forEach(id=>document.getElementById(id).value=''); document.getElementById('t-status').value='live'; document.getElementById('t-show-room').value='false'; document.getElementById('t-btn-text').innerText="Publish"; document.getElementById('btn-t-cancel').style.display="none"; }

async function loadPolls() {
    try {
        const polls = await FB.getPolls();
        const tbody = document.getElementById('poll-list'); tbody.innerHTML = '';
        polls.forEach(p => {
            let totalVotes = p.votes ? Object.keys(p.votes).length : 0;
            let opts = p.options ? Object.values(p.options).join(', ') : '';
            tbody.innerHTML += `<tr><td><strong>${p.question}</strong></td><td style="font-size:12px;">${opts}</td><td><strong style="color:var(--primary);">${totalVotes}</strong></td><td><span style="color:${p.status==='active'?'var(--success)':'var(--danger)'}; font-weight:bold; text-transform:capitalize;">${p.status}</span></td><td class="action-btns"><button class="btn" style="padding:4px 10px; font-size:11px;" onclick='editPoll(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Edit</button> <button class="btn btn-danger" style="padding:4px 10px; font-size:11px;" onclick="deletePoll('${p.id}')">Delete</button></td></tr>`;
        });
    } catch(e) {}
}

async function createOrUpdatePoll(btn) {
    const id = document.getElementById('p-edit-id').value;
    const question = document.getElementById('p-question').value;
    const status = document.getElementById('p-status').value;
    const opt1=document.getElementById('p-opt1').value, opt2=document.getElementById('p-opt2').value;
    const opt3=document.getElementById('p-opt3').value, opt4=document.getElementById('p-opt4').value;
    if(!question||!opt1||!opt2) { showToast("Question + 2 options required!", "error"); return; }
    const options = {opt1,opt2}; if(opt3)options.opt3=opt3; if(opt4)options.opt4=opt4;
    btnLoading(btn, true);
    try { if(id) { await FB.updatePoll(id, question, status, options); showToast("Updated!"); } else { await FB.createPoll(question, status, options); showToast("Created!"); } cancelPollEdit(); loadPolls(); } catch(e) { showToast("Error","error"); }
    btnLoading(btn, false);
}

function editPoll(p) {
    document.getElementById('p-edit-id').value=p.id; document.getElementById('p-question').value=p.question||''; document.getElementById('p-status').value=p.status||'active';
    document.getElementById('p-opt1').value=(p.options&&p.options.opt1)||''; document.getElementById('p-opt2').value=(p.options&&p.options.opt2)||''; document.getElementById('p-opt3').value=(p.options&&p.options.opt3)||''; document.getElementById('p-opt4').value=(p.options&&p.options.opt4)||'';
    document.getElementById('p-btn-text').innerText="Update Poll"; document.getElementById('btn-p-cancel').style.display="inline-flex";
}

async function deletePoll(id) { if(!confirm("Delete poll?")) return; try { await FB.deletePoll(id); showToast("Deleted!"); loadPolls(); } catch(e) { showToast("Error","error"); } }

function cancelPollEdit() { document.getElementById('p-edit-id').value=''; document.getElementById('p-question').value=''; document.getElementById('p-status').value='active'; ['p-opt1','p-opt2','p-opt3','p-opt4'].forEach(id=>document.getElementById(id).value=''); document.getElementById('p-btn-text').innerText="Publish Poll"; document.getElementById('btn-p-cancel').style.display="none"; }

async function loadSettings() {
    try {
        const s = await FB.getSettings();
        document.getElementById('s-qr').value = s.qrImage||''; document.getElementById('s-upi').value = s.upiId||''; document.getElementById('s-qr-link').value = s.qrLink||''; document.getElementById('s-min-withdraw').value = s.minWithdraw||''; document.getElementById('s-telegram').value = s.telegram||''; document.getElementById('s-help').value = s.help||''; document.getElementById('s-appname').value = s.appName||''; document.getElementById('s-applogo').value = s.appLogo||''; document.getElementById('s-bot-token').value = s.telegramBotToken||''; document.getElementById('s-payment-channel').value = s.telegramPaymentChannel||''; document.getElementById('s-user-channel').value = s.telegramUserChannel||''; document.getElementById('s-tournament-channel').value = s.telegramTournamentChannel||'';
    } catch(e) {}
}

async function saveSettings(btn) {
    btnLoading(btn, true);
    try {
        await FB.updateSettings({
            qrImage:document.getElementById('s-qr').value, upiId:document.getElementById('s-upi').value, qrLink:document.getElementById('s-qr-link').value, minWithdraw:document.getElementById('s-min-withdraw').value, telegram:document.getElementById('s-telegram').value, help:document.getElementById('s-help').value, appName:document.getElementById('s-appname').value, appLogo:document.getElementById('s-applogo').value, telegramBotToken:document.getElementById('s-bot-token').value, telegramPaymentChannel:document.getElementById('s-payment-channel').value, telegramUserChannel:document.getElementById('s-user-channel').value, telegramTournamentChannel:document.getElementById('s-tournament-channel').value
        });
        showToast("Settings Saved!");
    } catch(e) { showToast("Error","error"); }
    btnLoading(btn, false);
}

document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(user => {
        if(user) { adminUser = user; document.getElementById('login-section').style.display = 'none'; document.getElementById('admin-layout').style.display = 'flex'; loadAllData(); }
    });
});
