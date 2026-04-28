// UI Helpers for Custom Modals and Toasts

export const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    const color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #ffffff;
        color: #0f172a;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        font-family: inherit;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        border-left: 5px solid ${color};
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        min-width: 250px;
    `;

    const title = document.createElement('div');
    title.innerText = 'NeighborNodes says';
    title.style.cssText = `
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
    `;

    const msg = document.createElement('div');
    msg.innerText = message;
    msg.style.cssText = `
        font-weight: 600;
        font-size: 14px;
        line-height: 1.4;
    `;

    toast.appendChild(title);
    toast.appendChild(msg);
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    // Auto close
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

export const showConfirmModal = ({ heading, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmColor = '#ef4444', onConfirm }) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.2s ease;
        backdrop-filter: blur(2px);
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: #ffffff;
        padding: 32px;
        border-radius: 16px;
        width: 90%;
        max-width: 420px;
        font-family: inherit;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        transform: scale(0.95) translateY(10px);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    const titleEl = document.createElement('div');
    titleEl.innerText = 'NeighborNodes says';
    titleEl.style.cssText = `
        font-size: 12px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        margin-bottom: 12px;
        letter-spacing: 0.5px;
    `;

    const headingEl = document.createElement('h3');
    headingEl.innerText = heading || 'Confirm Action';
    headingEl.style.cssText = `
        margin: 0 0 16px 0;
        color: #0f172a;
        font-size: 20px;
        font-weight: 800;
    `;

    const messageEl = document.createElement('p');
    messageEl.innerText = message || 'Are you sure?';
    messageEl.style.cssText = `
        margin: 0 0 32px 0;
        color: #475569;
        font-size: 15px;
        line-height: 1.5;
    `;

    const actions = document.createElement('div');
    actions.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerText = cancelText;
    closeBtn.style.cssText = `
        padding: 10px 18px;
        border-radius: 8px;
        background: transparent;
        border: 2px solid #e2e8f0;
        color: #64748b;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = '#f8fafc';
    closeBtn.onmouseout = () => closeBtn.style.background = 'transparent';

    const confirmBtn = document.createElement('button');
    confirmBtn.innerText = confirmText;
    confirmBtn.style.cssText = `
        padding: 10px 18px;
        border-radius: 8px;
        background: ${confirmColor};
        border: none;
        color: #ffffff;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        transition: all 0.2s;
    `;
    confirmBtn.onmouseover = () => confirmBtn.style.opacity = '0.9';
    confirmBtn.onmouseout = () => confirmBtn.style.opacity = '1';

    const closeModal = () => {
        overlay.style.opacity = '0';
        modal.style.transform = 'scale(0.95) translateY(10px)';
        setTimeout(() => overlay.remove(), 200);
        document.removeEventListener('keydown', handleKey);
    };

    const handleKey = (e) => {
        if (e.key === 'Escape') closeModal();
    };

    closeBtn.onclick = closeModal;
    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };
    confirmBtn.onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };

    document.addEventListener('keydown', handleKey);

    actions.appendChild(closeBtn);
    actions.appendChild(confirmBtn);

    modal.appendChild(titleEl);
    modal.appendChild(headingEl);
    modal.appendChild(messageEl);
    modal.appendChild(actions);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1) translateY(0)';
    });
};
