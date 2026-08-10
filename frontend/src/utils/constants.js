// frontend/src/utils/constants.js
export const PLATFORM_FEE_PERCENT = 5;
export const GST_PERCENT = 18;
export const MIN_WITHDRAWAL = 100;
export const ADMIN_EMAIL = 'admin@engineerhub.in';

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  ATTENDANCE: '/attendance',
  RESULTS: '/results',
  MARKETPLACE: '/marketplace',
  EARNINGS: '/earnings',
  FREELANCING: '/freelancing',
  FREELANCER_PROFILE: '/freelancer/:id',
  PURCHASES: '/purchases',
  RESOURCES: '/resources',
  PLACEMENTS: '/placements',
  MESSAGES: '/messages',
  EVENTS: '/events',
  PROFILE: '/profile',
  WITHDRAWAL: '/withdrawal',
  ADMIN_WITHDRAWALS: '/admin/withdrawals',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN: '/admin',
  ADMIN_APPROVAL: '/admin/approval',
  ADMIN_EARNINGS: '/admin/earnings',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements',
};

export const BRANCHES = ['CSE','ECE','ME','CE','EE','Other'];
export const SEMESTERS = [1,2,3,4,5,6,7,8];
export const RESOURCE_TYPES = ['notes','assignment','paper','book','video','slides','code','other'];

export const categories = [
  'React','Angular','Vue','Node.js','Python','Java','C++','C#','PHP','Ruby','Go','Rust',
  'TypeScript','Swift','Kotlin','Dart','Flutter','React Native','Machine Learning',
  'Data Science','AI','IoT','Blockchain','Cyber Security','Cloud Computing','DevOps',
  'Mobile App','Web App','Desktop App','Game Development','AR/VR','Robotics',
  'Embedded Systems','HTML/CSS','JavaScript','Full Stack','Frontend','Backend',
  'UI/UX','Database','API','Template','Other',
];

export const projectTypes = [
  'All','Full Stack','Frontend','Backend','Mobile App','Desktop App','Web App',
  'Machine Learning','AI','Data Science','IoT','Blockchain','Game Development',
  'AR/VR','Robotics','Embedded Systems','Cloud Computing','DevOps','Cyber Security',
  'API Development','Database','UI/UX Design','Template','Other',
];

export const difficultyLevels = ['Beginner','Intermediate','Advanced','Expert'];
export const durations = ['Less than 1 week','1-2 weeks','2-4 weeks','1-2 months','2-3 months','3-6 months','6+ months'];
export const licenses = ['MIT','Apache 2.0','GPL 3.0','BSD 3-Clause','ISC','Unlicense','Proprietary','Other'];

export const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'priceLow', label: 'Price: Low to High' },
  { value: 'priceHigh', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export const skillsList = [
  'JavaScript','TypeScript','Python','Java','C++','C#','PHP','Go','Rust','Swift','Kotlin',
  'React','Angular','Vue.js','Next.js','Node.js','Express','Django','Flask','Spring Boot',
  'React Native','Flutter','MongoDB','PostgreSQL','MySQL','Redis','Firebase','AWS','Azure',
  'GCP','Docker','Kubernetes','Git','Figma','UI/UX Design','Machine Learning','Data Science',
  'TensorFlow','PyTorch','Blockchain','Solidity','Web3','IoT','Embedded Systems','Cybersecurity',
  'GraphQL','REST API','WebSockets','Tailwind CSS','Bootstrap','WordPress','Shopify',
];

export const experienceLevels = [
  'Entry Level (0-2 years)','Mid Level (2-5 years)',
  'Senior Level (5-8 years)','Expert (8+ years)','Lead/Manager',
];

export const jobTypes = ['Full-time','Part-time','Contract','Freelance','Internship','Remote','Hybrid','On-site'];
export const availabilityOptions = ['Immediately','Within 1 week','Within 2 weeks','Within 1 month','Not available','Open to offers'];
export const hourlyRates = ['₹500-₹1000','₹1000-₹2000','₹2000-₹3000','₹3000-₹5000','₹5000-₹7500','₹7500-₹10000','₹10000+'];
export const TOAST_DURATION = 3000;

export const ITEMS_PER_PAGE = {
  MARKETPLACE: 12, FREELANCERS: 12, PURCHASES: 10, EARNINGS: 10,
};

export const getDifficultyColor = (d) => {
  const m = { Beginner:'text-emerald-700 bg-emerald-50 border-emerald-200', Intermediate:'text-blue-700 bg-blue-50 border-blue-200', Advanced:'text-amber-700 bg-amber-50 border-amber-200', Expert:'text-red-700 bg-red-50 border-red-200' };
  return m[d] || 'text-gray-700 bg-gray-50 border-gray-200';
};

export const truncateText = (t, n=100) => (!t||t.length<=n) ? (t||'') : t.slice(0,n)+'…';
export const getInitials = (n='') => n.split(' ').map(x=>x[0]||'').join('').toUpperCase().slice(0,2)||'U';
export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const isValidPhone = (p) => /^[0-9]{10}$/.test(p);

