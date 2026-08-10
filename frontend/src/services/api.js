// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const req = async (endpoint, method = 'GET', data = null) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // sends the httpOnly auth cookie automatically
  };
  if (data) opts.body = JSON.stringify(data);

  const res = await fetch(`${API_URL}${endpoint}`, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Something went wrong');
  return json;
};

// ── AUTH ──────────────────────────────────────────────────────────────────
export const register = (d) => req('/auth/register', 'POST', d);
export const login    = (d) => req('/auth/login',    'POST', d);
export const logout   = async () => {
  try { await req('/auth/logout','POST'); } catch {}
};
export const getMe = () => req('/auth/me');
export const getCurrentUser = (id) => req(`/users/${id}`);
export const getCurrentUserFromToken = async () => {
  try { const r = await getMe(); return r.user || null; } catch { return null; }
};
export const updateUserRole = (id, d) => req(`/auth/update-role/${id}`, 'PUT', d);

// ── USERS ─────────────────────────────────────────────────────────────────
export const getAllUsers     = (params) => req(`/users${params?`?${new URLSearchParams(params)}`:''}`);
export const getUserById     = (id)     => req(`/users/${id}`);
export const getUserByEmail  = (email)  => req(`/users/email/${encodeURIComponent(email)}`);
export const getUsersByRole  = (role)   => req(`/users/role/${role}`);
export const updateUser      = (id, d)  => req(`/users/${id}`, 'PUT', d);
export const deleteUser      = (id)     => req(`/users/${id}`, 'DELETE');
export const toggleUserStatus= (id)     => req(`/users/${id}/toggle-status`, 'PUT');
export const changePassword  = (id, d)  => req(`/users/${id}/password`, 'PUT', d);
export const updateUpiId     = (id, d)  => req(`/users/${id}/upi`, 'PUT', d);
export const deleteMyAccount = (password) => req('/users/me', 'DELETE', { password });
export const getProfile      = (id)     => getUserById(id);
export const updateProfile   = (id, d)  => updateUser(id, d);
export const formatUserData  = (d) => {
  if (d.fullName && !d.firstName) {
    const p = d.fullName.trim().split(' ');
    return { ...d, firstName: p[0]||'', middleName: p.length>2?p.slice(1,-1).join(' '):'', lastName: p[p.length-1]||'' };
  }
  return d;
};

// ── MARKETPLACE ───────────────────────────────────────────────────────────
export const getAllMarketplaceItems  = ()         => req('/marketplace/all');
export const getApprovedItems        = (params)   => req(`/marketplace${params?`?${new URLSearchParams(params)}`:''}`);
export const getPendingItems         = ()         => req('/marketplace/pending');
export const getItemsByUser          = (uid)      => req(`/marketplace/user/${uid}`);
export const getItemById             = (id)       => req(`/marketplace/${id}`);
export const createItem              = (d)        => req('/marketplace', 'POST', d);
export const addReview               = (id, d)    => req(`/marketplace/${id}/review`, 'POST', d);
export const updateItem              = (id, d)    => req(`/marketplace/${id}`, 'PUT', d);
export const deleteItem              = (id)       => req(`/marketplace/${id}`, 'DELETE');
export const approveItem             = (id, d)    => req(`/marketplace/${id}/approve`, 'PUT', d);
export const bulkModerateItems       = (ids, status) => req('/marketplace/bulk-moderate', 'POST', { ids, status });

// ── ORDERS ────────────────────────────────────────────────────────────────
export const getAllOrders    = ()        => req('/orders');
export const getOrdersByUser = (uid)    => req(`/orders/user/${uid}`);
export const createOrder     = (d)      => req('/orders', 'POST', d);
export const markOrderPayout = (id)     => req(`/orders/${id}/payout`, 'PUT');

// ── EARNINGS ──────────────────────────────────────────────────────────────
export const getPlatformStats    = ()      => req('/earnings/platform/stats');
export const getAllSellers        = ()      => req('/earnings/sellers');
export const getSellersEarnings  = (email) => req(`/earnings/seller/${encodeURIComponent(email)}`);
export const processPayout       = (email) => req(`/earnings/seller/${encodeURIComponent(email)}/payout`, 'POST');
export const getUserOrders       = (uid)   => getOrdersByUser(uid);

// ── ATTENDANCE ────────────────────────────────────────────────────────────
export const getUserLectures      = (uid)  => req(`/attendance/lectures/${uid}`);
export const getAttendanceHistory = (uid)  => req(`/attendance/history/${uid}`);
export const getAttendanceStats   = (uid)  => req(`/attendance/user/${uid}/stats`);
export const createLecture        = (d)    => req('/attendance/lectures', 'POST', d);
export const updateLecture        = (id,d) => req(`/attendance/lectures/${id}`, 'PUT', d);
export const deleteLecture        = (id)   => req(`/attendance/lectures/${id}`, 'DELETE');
export const markAttendance       = (lid,d)=> req(`/attendance/mark/${lid}`, 'POST', d);
export const resetLectureAttendance=(id)   => req(`/attendance/lectures/${id}/reset`, 'PUT');

// ── RESOURCES ─────────────────────────────────────────────────────────────
export const getApprovedResources  = (p)   => req(`/resources${p?`?${new URLSearchParams(p)}`:''}`);
export const getPendingResources   = ()    => req('/resources/pending');
export const getResourcesByUser    = (uid) => req(`/resources/user/${uid}`);
export const getResourceById       = (id)  => req(`/resources/${id}`);
export const createResource        = (d)   => req('/resources', 'POST', d);
export const updateResource        = (id,d)=> req(`/resources/${id}`, 'PUT', d);
export const deleteResource        = (id)  => req(`/resources/${id}`, 'DELETE');
export const approveResource       = (id)  => req(`/resources/${id}/approve`, 'PUT');
export const bulkModerateResources = (ids, action, note) => req('/resources/bulk-moderate', 'POST', { ids, action, note });
export const rejectResource        = (id, note) => req(`/resources/${id}/reject`, 'PUT', { note });
export const incrementDownload     = (id)  => req(`/resources/${id}/download`, 'PUT');

// ── EVENTS ────────────────────────────────────────────────────────────────
export const getAllEvents        = ()     => req('/events');
export const getUpcomingEvents   = ()     => req('/events/upcoming');
export const getPastEvents       = ()     => req('/events/past');
export const getEventById        = (id)   => req(`/events/${id}`);
export const createEvent         = (d)    => req('/events', 'POST', d);
export const updateEvent         = (id,d) => req(`/events/${id}`, 'PUT', d);
export const deleteEvent         = (id)   => req(`/events/${id}`, 'DELETE');
export const registerForEvent    = (id)   => req(`/events/${id}/register`, 'POST');

// ── RESULTS ───────────────────────────────────────────────────────────────
export const getResultsByUser   = (uid) => req(`/results/user/${uid}`);
export const getPendingResults  = ()    => req('/results/pending');
export const getAllResults       = ()    => req('/results');
export const createResult       = (d)   => req('/results', 'POST', d);
export const updateResult       = (id,d)=> req(`/results/${id}`, 'PUT', d);
export const deleteResult       = (id)  => req(`/results/${id}`, 'DELETE');
export const approveResult      = (id)  => req(`/results/${id}/approve`, 'PUT');

// ── FREELANCERS ───────────────────────────────────────────────────────────
export const getAllFreelancers    = (p)   => req(`/freelancers${p?`?${new URLSearchParams(p)}`:''}`);
export const getOpenProjects     = ()    => req('/freelancers/open');
export const getFreelancerById   = (id)  => req(`/freelancers/${id}`);
export const getProjectsByClient = (uid) => req(`/freelancers/client/${uid}`);
export const getPendingProjects  = ()    => req('/freelancers/pending');
export const approveProject      = (id)  => req(`/freelancers/${id}/approve`, 'PUT');
export const bulkModerateProjects = (ids, action, note) => req('/freelancers/bulk-moderate', 'POST', { ids, action, note });
export const rejectProjectListing= (id, note) => req(`/freelancers/${id}/reject`, 'PUT', { note });
export const createProject       = (d)   => req('/freelancers', 'POST', d);
export const updateProject       = (id,d)=> req(`/freelancers/${id}`, 'PUT', d);
export const deleteProject       = (id)  => req(`/freelancers/${id}`, 'DELETE');
export const submitBid           = (id,d)=> req(`/freelancers/${id}/bid`, 'POST', d);
export const updateBidStatus     = (id,d)=> req(`/freelancers/${id}/bid-status`, 'PUT', d);
export const rateFreelancer      = (id,d)=> req(`/freelancers/${id}/rate-freelancer`, 'POST', d);

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────
export const getAllAnnouncements    = ()     => req('/announcements/active');
export const getAdminAnnouncements = ()     => req('/announcements');
export const createAnnouncement    = (d)    => req('/announcements', 'POST', d);
export const updateAnnouncement    = (id,d) => req(`/announcements/${id}`, 'PUT', d);
export const deleteAnnouncement    = (id)   => req(`/announcements/${id}`, 'DELETE');
export const toggleAnnouncement    = (id)   => req(`/announcements/${id}/status`, 'PUT');

// ── TESTIMONIALS ──────────────────────────────────────────────────────────
export const getApprovedTestimonials = ()    => req('/testimonials/approved');
export const getPendingTestimonials  = ()    => req('/testimonials/pending');
export const createTestimonial       = (d)   => req('/testimonials', 'POST', d);
export const approveTestimonial      = (id)  => req(`/testimonials/${id}/approve`, 'PUT');
export const deleteTestimonial       = (id)  => req(`/testimonials/${id}`, 'DELETE');

// ── ANALYTICS ─────────────────────────────────────────────────────────────
export const getAnalyticsOverview = () => req('/analytics/overview');
export const getUserGrowth        = () => req('/analytics/users/growth');
export const getAnalyticsTrends   = () => req('/analytics/trends');

// ── WITHDRAWALS ───────────────────────────────────────────────────────────
export const getAllWithdrawals    = (status) => req(`/withdrawals${status ? `?status=${status}` : ''}`);
export const getMyWithdrawals    = ()        => req('/withdrawals/mine');
export const getWithdrawalSummary= ()        => req('/withdrawals/summary');
export const createWithdrawal    = (d)       => req('/withdrawals', 'POST', d);
export const updateWithdrawalStatus = (id,d) => req(`/withdrawals/${id}/status`, 'PUT', d);
export const deleteWithdrawal    = (id)      => req(`/withdrawals/${id}`, 'DELETE');

// ── SETTINGS ─────────────────────────────────────────────────────────────
export const getPublicSettings   = ()        => req('/settings/public');
export const getAllSettings       = ()        => req('/settings');
export const updateSetting        = (d)       => req('/settings', 'PUT', d);
export const bulkUpdateSettings   = (d)       => req('/settings/bulk', 'PUT', d);

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────
export const getNotifications          = () => req('/notifications');
export const getUnreadNotificationCount= () => req('/notifications/unread-count');
export const markNotificationRead      = (id) => req(`/notifications/${id}/read`, 'PUT');
export const markAllNotificationsRead  = () => req('/notifications/read-all', 'PUT');
export const deleteNotification        = (id) => req(`/notifications/${id}`, 'DELETE');

// ── REPORTS ───────────────────────────────────────────────────────────────
export const createReport  = (d)      => req('/reports', 'POST', d);
export const getReports    = (status) => req(`/reports${status ? `?status=${status}` : ''}`);
export const resolveReport = (id, d)  => req(`/reports/${id}/resolve`, 'PUT', d);
export const bulkResolveReports = (ids, action, note) => req('/reports/bulk-resolve', 'POST', { ids, action, note });

// ── PLACEMENTS / INTERNSHIPS ─────────────────────────────────────────────
export const getPlacements    = (p)      => req(`/placements${p ? `?${new URLSearchParams(p)}` : ''}`);
export const createPlacement  = (d)      => req('/placements', 'POST', d);
export const updatePlacement  = (id, d)  => req(`/placements/${id}`, 'PUT', d);
export const deletePlacement  = (id)     => req(`/placements/${id}`, 'DELETE');

// Multipart upload — different from the JSON `req()` helper above, since the
// browser needs to set its own multipart Content-Type boundary.
export const uploadPoster = async (file) => {
  const formData = new FormData();
  formData.append('poster', file);
  const res = await fetch(`${API_URL}/uploads/poster`, { method: 'POST', credentials: 'include', body: formData });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Upload failed');
  return json;
};

// ── PUSH NOTIFICATIONS ───────────────────────────────────────────────────
export const subscribePush   = (d)        => req('/push/subscribe', 'POST', d);
export const unsubscribePush = (endpoint) => req('/push/subscribe', 'DELETE', { endpoint });

// ── GLOBAL SEARCH ─────────────────────────────────────────────────────────
export const globalSearch = (q) => req(`/search?q=${encodeURIComponent(q)}`);

// ── MESSAGING ─────────────────────────────────────────────────────────────
export const getOrCreateConversation = (d)  => req('/messages/conversations', 'POST', d);
export const getMyConversations      = ()   => req('/messages/conversations');
export const getConversationMessages = (id) => req(`/messages/conversations/${id}`);
export const sendMessage             = (id, text) => req(`/messages/conversations/${id}`, 'POST', { text });
export const getUnreadMessageCount   = ()   => req('/messages/unread-count');
