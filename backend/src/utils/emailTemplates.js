// backend/src/utils/emailTemplates.js
// Shared wrapper so every transactional email looks consistent without
// repeating the same inline HTML boilerplate in every controller.

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const emailLayout = ({ heading, bodyHtml, ctaText, ctaUrl }) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color:#0f172a;">
    <div style="background: linear-gradient(135deg,#059669,#1d4ed8); padding: 18px 24px; border-radius: 12px 12px 0 0;">
      <span style="color:#fff; font-weight:900; font-size:15px; letter-spacing:0.02em;">Engineer Hub</span>
    </div>
    <div style="border:1px solid #e2e8f0; border-top:none; padding: 24px; border-radius: 0 0 12px 12px;">
      <h2 style="color:#059669; margin-top:0;">${heading}</h2>
      ${bodyHtml}
      ${ctaText && ctaUrl ? `
        <p style="margin: 24px 0;">
          <a href="${ctaUrl}" style="background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">${ctaText}</a>
        </p>` : ''}
      <p style="color:#94a3b8; font-size:11px; margin-top: 24px; border-top:1px solid #f1f5f9; padding-top:12px;">
        You're receiving this because it relates to activity on your Engineer Hub account.
        <a href="${FRONTEND_URL}/profile" style="color:#94a3b8;">Manage notification preferences</a>
      </p>
    </div>
  </div>
`;

export const welcomeEmail = (user) => ({
    subject: 'Welcome to Engineer Hub 🎉',
    html: emailLayout({
        heading: `Welcome, ${user.firstName || 'there'}!`,
        bodyHtml: `
            <p>Your account is set up and ready to go. Here's what you can do right away:</p>
            <ul style="color:#334155; line-height:1.8;">
                <li>Track your attendance and stay above 75%</li>
                <li>Browse or sell projects on the marketplace</li>
                <li>Pick up freelance gigs from other students</li>
                <li>Download study resources shared by seniors</li>
                <li>Check placement & internship drives</li>
            </ul>`,
        ctaText: 'Go to Dashboard',
        ctaUrl: `${FRONTEND_URL}/dashboard`,
    }),
    text: `Welcome to Engineer Hub, ${user.firstName || 'there'}! Your account is ready. Visit ${FRONTEND_URL}/dashboard to get started.`,
});

export const orderConfirmationEmail = ({ buyerName, itemTitle, amount, orderId }) => ({
    subject: `Order confirmed — ${itemTitle}`,
    html: emailLayout({
        heading: 'Order confirmed ✅',
        bodyHtml: `
            <p>Hi ${buyerName || 'there'},</p>
            <p>Your purchase of <strong>${itemTitle}</strong> for <strong>₹${amount}</strong> is confirmed.</p>
            <p style="color:#64748b; font-size:13px;">Order ID: ${orderId}</p>`,
        ctaText: 'View My Purchases',
        ctaUrl: `${FRONTEND_URL}/purchases`,
    }),
    text: `Order confirmed: ${itemTitle} for ₹${amount}. Order ID: ${orderId}. View at ${FRONTEND_URL}/purchases`,
});

export const newSaleEmail = ({ sellerName, itemTitle, amount, buyerName }) => ({
    subject: `You made a sale — ${itemTitle}`,
    html: emailLayout({
        heading: 'New sale! 💰',
        bodyHtml: `
            <p>Hi ${sellerName || 'there'},</p>
            <p><strong>${buyerName || 'A buyer'}</strong> just purchased <strong>${itemTitle}</strong> for <strong>₹${amount}</strong>.</p>`,
        ctaText: 'View Earnings',
        ctaUrl: `${FRONTEND_URL}/earnings`,
    }),
    text: `New sale: ${itemTitle} for ₹${amount} to ${buyerName || 'a buyer'}. View at ${FRONTEND_URL}/earnings`,
});

export const withdrawalStatusEmail = ({ userName, amount, status, note }) => {
    const statusCopy = {
        processing: 'is now being processed',
        paid: 'has been paid out',
        rejected: `was rejected${note ? `: ${note}` : ''}`,
        pending: 'is pending review',
    };
    return {
        subject: `Withdrawal update — ₹${amount}`,
        html: emailLayout({
            heading: 'Withdrawal update',
            bodyHtml: `<p>Hi ${userName || 'there'},</p><p>Your withdrawal of <strong>₹${amount}</strong> ${statusCopy[status] || `is now ${status}`}.</p>`,
            ctaText: 'View Withdrawal',
            ctaUrl: `${FRONTEND_URL}/withdrawal`,
        }),
        text: `Withdrawal update: ₹${amount} ${statusCopy[status] || `is now ${status}`}. View at ${FRONTEND_URL}/withdrawal`,
    };
};

export const placementDriveEmail = ({ studentName, title, company, type, deadline }) => ({
    subject: `New ${type === 'internship' ? 'internship' : 'placement'} drive: ${company}`,
    html: emailLayout({
        heading: `New ${type === 'internship' ? 'internship' : 'placement'} opportunity`,
        bodyHtml: `
            <p>Hi ${studentName || 'there'},</p>
            <p><strong>${company}</strong> just posted: <strong>${title}</strong></p>
            ${deadline ? `<p style="color:#dc2626; font-weight:bold;">Apply by ${new Date(deadline).toLocaleDateString('en-IN')}</p>` : ''}`,
        ctaText: 'View Details',
        ctaUrl: `${FRONTEND_URL}/placements`,
    }),
    text: `New ${type} drive: ${title} at ${company}. View at ${FRONTEND_URL}/placements`,
});
