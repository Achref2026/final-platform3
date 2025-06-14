import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';

// Import components
import MobileNotifications from './components/MobileNotifications';
import OfflineQuiz from './components/OfflineQuiz';
import PWAInstallPrompt from './components/PWAInstallPrompt';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Algerian States
const ALGERIAN_STATES = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", 
  "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", 
  "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", 
  "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", 
  "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", 
  "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", 
  "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", 
  "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun", 
  "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès", "In Salah", 
  "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"
];

// Multi-language support
const translations = {
  en: {
    appName: "DriveMaster Algeria",
    tagline: "Professional Driving Education Platform",
    home: "Home",
    findSchools: "Schools",
    dashboard: "Dashboard",
    login: "Sign In",
    register: "Get Started",
    logout: "Sign Out",
    welcome: "Welcome",
    email: "Email Address",
    password: "Password",
    phone: "Phone Number",
    address: "Address",
    state: "Wilaya",
    loading: "Loading...",
    enrollNow: "Enroll Now",
    viewDetails: "View Details",
    heroTitle: "Master Professional Driving in Algeria",
    heroSubtitle: "Connect with Algeria's premier driving schools across all 58 wilayas. Experience world-class training with certified instructors and modern facilities.",
    heroButton1: "Explore Driving Schools",
    heroButton2: "Start Free Practice",
    whyChoose: "Why Choose DriveMaster",
    feature1Title: "Certified Excellence",
    feature1Desc: "All driving schools are government-certified with experienced instructors meeting national standards.",
    feature2Title: "Complete Training Program",
    feature2Desc: "Comprehensive curriculum covering theory, parking practice, and real-world driving experience.",
    feature3Title: "State-Wide Coverage",
    feature3Desc: "Access to driving schools across all 58 Algerian wilayas with consistent quality standards.",
    offlineQuiz: "Practice Tests",
    stat1: "58",
    stat1Label: "Wilayas Covered",
    stat2: "200+",
    stat2Label: "Certified Schools",
    stat3: "15K+",
    stat3Label: "Students Trained"
  },
  ar: {
    appName: "ماستر القيادة الجزائر",
    tagline: "منصة تعليم القيادة المهنية",
    home: "الرئيسية",
    findSchools: "المدارس",
    dashboard: "لوحة التحكم",
    login: "تسجيل الدخول",
    register: "ابدأ الآن",
    logout: "تسجيل الخروج",
    welcome: "مرحباً",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    phone: "رقم الهاتف",
    address: "العنوان",
    state: "الولاية",
    loading: "جاري التحميل...",
    enrollNow: "سجل الآن",
    viewDetails: "عرض التفاصيل",
    heroTitle: "إتقان القيادة المهنية في الجزائر",
    heroSubtitle: "تواصل مع أفضل مدارس تعليم القيادة في الجزائر عبر جميع الولايات الـ58. استمتع بتدريب عالمي المستوى مع مدربين معتمدين ومرافق حديثة.",
    heroButton1: "استكشف مدارس القيادة",
    heroButton2: "ابدأ التمرين المجاني",
    whyChoose: "لماذا تختار ماستر القيادة",
    feature1Title: "التميز المعتمد",
    feature1Desc: "جميع مدارس القيادة معتمدة حكومياً مع مدربين ذوي خبرة يلبون المعايير الوطنية.",
    feature2Title: "برنامج تدريبي شامل",
    feature2Desc: "منهج شامل يغطي النظريات وممارسة الوقوف والقيادة في العالم الحقيقي.",
    feature3Title: "تغطية على مستوى الولاية",
    feature3Desc: "الوصول إلى مدارس القيادة عبر جميع الولايات الجزائرية الـ58 بمعايير جودة متسقة.",
    offlineQuiz: "اختبارات التمرين",
    stat1: "58",
    stat1Label: "ولاية مغطاة",
    stat2: "200+",
    stat2Label: "مدرسة معتمدة",
    stat3: "15K+",
    stat3Label: "طالب مدرب"
  },
  fr: {
    appName: "DriveMaster Algérie",
    tagline: "Plateforme d'Éducation de Conduite Professionnelle",
    home: "Accueil",
    findSchools: "Écoles",
    dashboard: "Tableau de Bord",
    login: "Connexion",
    register: "Commencer",
    logout: "Déconnexion",
    welcome: "Bienvenue",
    email: "Adresse Email",
    password: "Mot de Passe",
    phone: "Numéro de Téléphone",
    address: "Adresse",
    state: "Wilaya",
    loading: "Chargement...",
    enrollNow: "S'inscrire",
    viewDetails: "Voir Détails",
    heroTitle: "Maîtrisez la Conduite Professionnelle en Algérie",
    heroSubtitle: "Connectez-vous avec les meilleures auto-écoles d'Algérie dans les 58 wilayas. Profitez d'une formation de classe mondiale avec des instructeurs certifiés et des installations modernes.",
    heroButton1: "Explorer les Auto-écoles",
    heroButton2: "Commencer la Pratique Gratuite",
    whyChoose: "Pourquoi Choisir DriveMaster",
    feature1Title: "Excellence Certifiée",
    feature1Desc: "Toutes les auto-écoles sont certifiées gouvernementales avec des instructeurs expérimentés répondant aux normes nationales.",
    feature2Title: "Programme de Formation Complet",
    feature2Desc: "Curriculum complet couvrant la théorie, la pratique du stationnement et l'expérience de conduite réelle.",
    feature3Title: "Couverture à l'Échelle de l'État",
    feature3Desc: "Accès aux auto-écoles dans les 58 wilayas algériennes avec des normes de qualité cohérentes.",
    offlineQuiz: "Tests de Pratique",
    stat1: "58",
    stat1Label: "Wilayas Couvertes",
    stat2: "200+",
    stat2Label: "Écoles Certifiées",
    stat3: "15K+",
    stat3Label: "Étudiants Formés"
  }
};

function App() {
  // State management
  const [language, setLanguage] = useState('en');
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // States and search
  const [states] = useState(ALGERIAN_STATES);
  const [selectedState, setSelectedState] = useState('');
  const [drivingSchools, setDrivingSchools] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0
  });
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterStats, setFilterStats] = useState(null);
  
  // Modal and UI states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [showOfflineQuiz, setShowOfflineQuiz] = useState(false);
  
  // Message states
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Dashboard and notifications
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showMobileNotifications, setShowMobileNotifications] = useState(false);
  
  // Form states
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: 'male',
    state: ''
  });

  // Get current translations
  const t = translations[language];

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Initialize user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
  }, []);

  // Language functions
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('preferred_language', lang);
  };

  // Load saved language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('preferred_language');
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    }
  }, []);

  // Notification functions
  const markNotificationAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? {...n, is_read: true} : n)
    );
    setUnreadNotificationCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    setUnreadNotificationCount(0);
  };

  const deleteNotification = async (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadNotificationCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
    });
  };

  // Utility functions
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setErrorMessage('');
    setGlobalError('');
  };

  const showError = (message) => {
    setErrorMessage(message);
    setSuccessMessage('');
    setGlobalError('');
  };

  const handleApiError = (error, defaultMessage) => {
    const message = error.message || defaultMessage;
    setGlobalError(message);
    console.error('API Error:', error);
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        
        // Update notifications
        if (data.notifications) {
          setNotifications(data.notifications);
          const unread = data.notifications.filter(n => !n.is_read).length;
          setUnreadNotificationCount(unread);
        }
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      handleApiError(error, 'Failed to load dashboard');
    }
  };

  // Load dashboard when user logs in
  useEffect(() => {
    if (user && currentPage === 'dashboard') {
      fetchDashboardData();
    }
  }, [user, currentPage]);

  // Authentication handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      
      // Common fields
      formData.append('email', authData.email);
      formData.append('password', authData.password);
      
      // Registration-specific fields
      if (authMode === 'register') {
        formData.append('first_name', authData.first_name);
        formData.append('last_name', authData.last_name);
        formData.append('phone', authData.phone);
        formData.append('address', authData.address);
        formData.append('date_of_birth', authData.date_of_birth);
        formData.append('gender', authData.gender);
        formData.append('state', authData.state);
      }

      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const url = `${BACKEND_URL}${endpoint}`;

      const response = await fetch(url, {
        method: 'POST',
        body: authMode === 'register' ? formData : JSON.stringify({
          email: authData.email,
          password: authData.password
        }),
        headers: authMode === 'login' ? {
          'Content-Type': 'application/json',
        } : {}
      });

      if (!response.ok) {
        let errorMessage = `${authMode === 'login' ? t.login : t.register} failed`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map(err => err.msg).join(', ');
            } else {
              errorMessage = errorData.detail;
            }
          }
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        setUser(data.user);
        setSuccessMessage(`${authMode === 'login' ? t.login : t.register} successful!`);
        
        setTimeout(() => {
          setShowAuthModal(false);
          setSuccessMessage('');
        }, 1500);
        
        setAuthData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          phone: '',
          address: '',
          date_of_birth: '',
          gender: 'male',
          state: ''
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrorMessage(`${authMode === 'login' ? t.login : t.register} failed: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setCurrentPage('home');
    setDashboardData(null);
  };

  const fetchDrivingSchools = async (options = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (options.state || selectedState) {
        params.append('state', options.state || selectedState);
      }
      if (options.search || searchQuery) {
        params.append('search', options.search || searchQuery);
      }
      if (options.min_price || priceRange.min) {
        params.append('min_price', options.min_price || priceRange.min);
      }
      if (options.max_price || priceRange.max) {
        params.append('max_price', options.max_price || priceRange.max);
      }
      if (options.min_rating || minRating) {
        params.append('min_rating', options.min_rating || minRating);
      }
      if (options.sort_by || sortBy) {
        params.append('sort_by', options.sort_by || sortBy);
      }
      if (options.sort_order || sortOrder) {
        params.append('sort_order', options.sort_order || sortOrder);
      }
      if (options.page) {
        params.append('page', options.page);
      }
      
      const url = `${BACKEND_URL}/api/driving-schools?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch driving schools: ${response.status}`);
      }
      const data = await response.json();
      setDrivingSchools(data.schools || []);
      setPagination(data.pagination || { current_page: 1, total_pages: 1, total_count: 0 });
    } catch (error) {
      handleApiError(error, 'Failed to load driving schools. Please try again.');
      setDrivingSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/driving-schools/search-suggestions?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch search suggestions:', error);
    }
  };

  const fetchFilterStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/driving-schools/filters/stats`);
      if (response.ok) {
        const data = await response.json();
        setFilterStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch filter stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDrivingSchools({ page: 1 });
  };

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    fetchSearchSuggestions(value);
    setShowSuggestions(true);
  };

  const clearFilters = () => {
    setSelectedState('');
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setMinRating('');
    setSortBy('name');
    setSortOrder('asc');
    fetchDrivingSchools();
  };

  const handleEnroll = async (schoolId) => {
    if (!user) {
      setErrorMessage('Please login to enroll in a driving school');
      setShowAuthModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          school_id: schoolId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess('Enrollment successful! Please upload required documents for manager approval.');
        setCurrentPage('dashboard');
        fetchDashboardData();
      } else {
        throw new Error(data.detail || 'Enrollment failed');
      }
    } catch (error) {
      handleApiError(error, 'Failed to enroll in driving school');
    }
  };

  // Navigation Component
  const renderNavigation = () => (
    <nav className="navbar navbar-expand-lg navbar-custom fixed-top">
      <div className="container">
        <a 
          href="#" 
          className="navbar-brand navbar-brand-custom d-flex align-items-center"
          onClick={() => setCurrentPage('home')}
        >
          <div className="me-3 p-2 bg-primary rounded" style={{fontSize: '1.5rem'}}>
            🚗
          </div>
          <div>
            <div className="fw-bold">{t.appName}</div>
            <div style={{fontSize: '0.75rem', opacity: 0.8}}>{t.tagline}</div>
          </div>
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a 
                href="#" 
                className={`nav-link nav-link-custom ${currentPage === 'home' ? 'active' : ''}`}
                onClick={() => setCurrentPage('home')}
              >
                {t.home}
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#" 
                className={`nav-link nav-link-custom ${currentPage === 'find-schools' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage('find-schools');
                  fetchDrivingSchools();
                }}
              >
                {t.findSchools}
              </a>
            </li>
            {user && user.role !== 'guest' && (
              <li className="nav-item">
                <a 
                  href="#" 
                  className={`nav-link nav-link-custom ${currentPage === 'dashboard' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentPage('dashboard');
                    fetchDashboardData();
                  }}
                >
                  {t.dashboard}
                </a>
              </li>
            )}
            <li className="nav-item">
              <a 
                href="#" 
                className="nav-link nav-link-custom"
                onClick={() => setShowOfflineQuiz(true)}
              >
                {t.offlineQuiz}
              </a>
            </li>
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="language-selector"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
            </select>
            
            {user ? (
              <div className="d-flex align-items-center gap-3">
                <div className="text-white small">
                  {t.welcome}, {user.first_name}
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-light btn-sm"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="btn btn-outline-light btn-sm"
                >
                  {t.login}
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="btn btn-light btn-sm"
                >
                  {t.register}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  // Home Page Component
  const renderHomePage = () => (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="hero-content">
                <div className="hero-badge">
                  <span>🇩🇿</span>
                  <span>Professional Driving Education</span>
                </div>
                
                <h1 className="hero-title">
                  {t.heroTitle}
                </h1>
                
                <p className="hero-subtitle">
                  {t.heroSubtitle}
                </p>
                
                <div className="d-flex gap-3 mb-5">
                  <button
                    onClick={() => {
                      setCurrentPage('find-schools');
                      fetchDrivingSchools();
                    }}
                    className="btn btn-custom-primary"
                  >
                    🔍 {t.heroButton1}
                  </button>
                  <button
                    onClick={() => setShowOfflineQuiz(true)}
                    className="btn btn-custom-black"
                  >
                    📚 {t.heroButton2}
                  </button>
                </div>
                
                <div className="hero-stats">
                  <div className="hero-stat">
                    <span className="hero-stat-number">{t.stat1}</span>
                    <span className="hero-stat-label">{t.stat1Label}</span>
                  </div>
                  <div className="hero-stat">
                    <span className="hero-stat-number">{t.stat2}</span>
                    <span className="hero-stat-label">{t.stat2Label}</span>
                  </div>
                  <div className="hero-stat">
                    <span className="hero-stat-number">{t.stat3}</span>
                    <span className="hero-stat-label">{t.stat3Label}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6">
              <div className="text-center">
                <div className="bg-white bg-opacity-10 rounded-4 p-5 backdrop-blur">
                  <div className="display-1 mb-3">🎓</div>
                  <h3 className="h4 mb-3">Premium Training</h3>
                  <p className="mb-0">Experience world-class driving education</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <div className="badge bg-primary fs-6 mb-3">Excellence in Education</div>
            <h2 className="display-5 fw-bold text-dark mb-3">{t.whyChoose}</h2>
            <p className="lead text-muted mx-auto" style={{maxWidth: '600px'}}>
              Join thousands of successful drivers who chose our platform for their driving education journey.
            </p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">🏆</div>
                <h3 className="feature-title">{t.feature1Title}</h3>
                <p className="feature-description">{t.feature1Desc}</p>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">📋</div>
                <h3 className="feature-title">{t.feature2Title}</h3>
                <p className="feature-description">{t.feature2Desc}</p>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">🗺️</div>
                <h3 className="feature-title">{t.feature3Title}</h3>
                <p className="feature-description">{t.feature3Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Schools Page Component
  const renderSchoolsPage = () => (
    <div className="pt-5 mt-5">
      <div className="container">
        <div className="text-center mb-5">
          <div className="badge bg-primary fs-6 mb-3">Premium Driving Schools</div>
          <h2 className="display-5 fw-bold text-dark mb-3">Choose Your Driving School</h2>
          <p className="lead text-muted mx-auto" style={{maxWidth: '600px'}}>
            Explore certified driving schools across Algeria with guaranteed quality and professional instruction.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="search-container mb-5">
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="position-relative mx-auto" style={{maxWidth: '600px'}}>
              <input
                type="text"
                placeholder="Search schools by name, address, or description..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="form-control form-control-lg pe-5"
              />
              <button
                type="submit"
                className="btn btn-primary position-absolute top-50 end-0 translate-middle-y me-2"
                style={{zIndex: 5}}
              >
                🔍
              </button>
              
              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                        fetchDrivingSchools({ search: suggestion, page: 1 });
                      }}
                      className="search-suggestion-item"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Advanced Filters */}
          <div className="row g-3 mb-3">
            
            {/* State Filter */}
            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-medium">Wilaya</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  fetchDrivingSchools({ state: e.target.value, page: 1 });
                }}
                className="form-select"
              >
                <option value="">All Wilayas</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-medium">Min Price (DZD)</label>
              <input
                type="number"
                placeholder="Min price"
                value={priceRange.min}
                onChange={(e) => {
                  setPriceRange(prev => ({ ...prev, min: e.target.value }));
                }}
                onBlur={() => fetchDrivingSchools({ page: 1 })}
                className="form-control"
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-medium">Max Price (DZD)</label>
              <input
                type="number"
                placeholder="Max price"
                value={priceRange.max}
                onChange={(e) => {
                  setPriceRange(prev => ({ ...prev, max: e.target.value }));
                }}
                onBlur={() => fetchDrivingSchools({ page: 1 })}
                className="form-control"
              />
            </div>

            {/* Rating Filter */}
            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-medium">Min Rating</label>
              <select
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value);
                  fetchDrivingSchools({ min_rating: e.target.value, page: 1 });
                }}
                className="form-select"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-medium">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  fetchDrivingSchools({ sort_by: e.target.value, page: 1 });
                }}
                className="form-select"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-medium">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  fetchDrivingSchools({ sort_order: e.target.value, page: 1 });
                }}
                className="form-select"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <button
              onClick={clearFilters}
              className="btn btn-outline-secondary"
            >
              Clear All Filters
            </button>
            
            {pagination.total_count > 0 && (
              <div className="text-muted">
                Showing {pagination.total_count} school(s)
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-custom"></div>
          </div>
        ) : (
          <>
            <div className="row g-4">
              {drivingSchools.map((school) => (
                <div key={school.id} className="col-lg-6">
                  <div className="school-card">
                    <div className="school-header">
                      <div>
                        <h3 className="school-title">{school.name}</h3>
                        <div className="school-location">
                          📍 {school.address}, {school.state}
                        </div>
                      </div>
                      <div className="school-price">{school.price} DZD</div>
                    </div>
                  
                    <div className="school-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="star">
                            {i < Math.floor(school.rating) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <span className="school-reviews">({school.total_reviews} reviews)</span>
                    </div>
                  
                    <p className="school-description">
                      {school.description}
                    </p>
                  
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleEnroll(school.id)}
                        className="btn btn-custom-primary flex-grow-1"
                      >
                        {t.enrollNow}
                      </button>
                      <button className="btn btn-outline-secondary">
                        {t.viewDetails}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <nav className="mt-5">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${!pagination.has_prev ? 'disabled' : ''}`}>
                    <button
                      onClick={() => fetchDrivingSchools({ page: pagination.current_page - 1 })}
                      disabled={!pagination.has_prev}
                      className="page-link"
                    >
                      ← Previous
                    </button>
                  </li>
                  
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <li key={page} className={`page-item ${pagination.current_page === page ? 'active' : ''}`}>
                        <button
                          onClick={() => fetchDrivingSchools({ page })}
                          className="page-link"
                        >
                          {page}
                        </button>
                      </li>
                    );
                  })}
                  
                  <li className={`page-item ${!pagination.has_next ? 'disabled' : ''}`}>
                    <button
                      onClick={() => fetchDrivingSchools({ page: pagination.current_page + 1 })}
                      disabled={!pagination.has_next}
                      className="page-link"
                    >
                      Next →
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}

        {drivingSchools.length === 0 && !loading && (
          <div className="text-center py-5">
            <div style={{fontSize: '4rem'}} className="mb-4">🏫</div>
            <h3>No driving schools found matching your criteria.</h3>
            <button
              onClick={clearFilters}
              className="btn btn-primary mt-3"
            >
              Clear filters to see all schools
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Dashboard Component
  const renderDashboard = () => (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-welcome">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="dashboard-subtitle">
            Your role: <span className="fw-bold text-capitalize">{user?.role}</span>
          </p>
        </div>
        
        {dashboardData ? (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="dashboard-card">
                <h3 className="dashboard-card-title">Your Enrollments</h3>
                {dashboardData.enrollments && dashboardData.enrollments.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {dashboardData.enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="p-3 border rounded">
                        <h4 className="fw-bold mb-2">
                          {enrollment.school_name}
                        </h4>
                        <div className="d-flex align-items-center gap-3">
                          <span>Status:</span>
                          <span className={`status-badge status-${enrollment.enrollment_status.replace('_', '-')}`}>
                            {enrollment.enrollment_status.replace('_', ' ')}
                          </span>
                        </div>
                        {enrollment.enrollment_status === 'pending_documents' && (
                          <p className="text-primary small mt-2">
                            ℹ️ Please upload required documents for approval
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No enrollments yet. Find a school to get started!</p>
                )}
              </div>
            </div>
            
            <div className="col-lg-4">
              <div className="dashboard-card">
                <h3 className="dashboard-card-title">Quick Actions</h3>
                <div className="d-flex flex-column gap-3">
                  <button
                    onClick={() => {
                      setCurrentPage('find-schools');
                      fetchDrivingSchools();
                    }}
                    className="btn btn-custom-primary"
                  >
                    🔍 Find Driving Schools
                  </button>
                  <button
                    onClick={() => setShowOfflineQuiz(true)}
                    className="btn btn-custom-black"
                  >
                    📚 Practice Tests
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="loading-container">
            <div className="spinner-custom"></div>
          </div>
        )}
      </div>
    </div>
  );

  // Auth Modal Component
  const renderAuthModal = () => (
    showAuthModal && (
      <div 
        className="modal show d-block" 
        style={{backgroundColor: 'rgba(0, 0, 0, 0.75)'}}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {authMode === 'login' ? t.login : t.register}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowAuthModal(false)}
              ></button>
            </div>
            
            <div className="modal-body">
              {errorMessage && (
                <div className="alert-custom-error">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="alert-custom-success">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleAuth}>
                <div className="mb-3">
                  <label className="form-label">{t.email}</label>
                  <input
                    type="email"
                    required
                    value={authData.email}
                    onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                    className="form-control"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required
                    value={authData.password}
                    onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                    className="form-control"
                  />
                </div>

                {authMode === 'register' && (
                  <>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          required
                          value={authData.first_name}
                          onChange={(e) => setAuthData(prev => ({ ...prev, first_name: e.target.value }))}
                          className="form-control"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          required
                          value={authData.last_name}
                          onChange={(e) => setAuthData(prev => ({ ...prev, last_name: e.target.value }))}
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t.phone}</label>
                      <input
                        type="tel"
                        required
                        value={authData.phone}
                        onChange={(e) => setAuthData(prev => ({ ...prev, phone: e.target.value }))}
                        className="form-control"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t.address}</label>
                      <input
                        type="text"
                        required
                        value={authData.address}
                        onChange={(e) => setAuthData(prev => ({ ...prev, address: e.target.value }))}
                        className="form-control"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        required
                        value={authData.date_of_birth}
                        onChange={(e) => setAuthData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        className="form-control"
                      />
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Gender</label>
                        <select
                          value={authData.gender}
                          onChange={(e) => setAuthData(prev => ({ ...prev, gender: e.target.value }))}
                          className="form-select"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">{t.state}</label>
                        <select
                          required
                          value={authData.state}
                          onChange={(e) => setAuthData(prev => ({ ...prev, state: e.target.value }))}
                          className="form-select"
                        >
                          <option value="">Select Wilaya</option>
                          {states.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn btn-primary w-100 mt-4"
                >
                  {authLoading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2"></div>
                      {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    authMode === 'login' ? t.login : t.register
                  )}
                </button>
              </form>

              <div className="text-center mt-3">
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="btn btn-link text-decoration-none"
                >
                  {authMode === 'login' 
                    ? "Don't have an account? Register" 
                    : "Already have an account? Login"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Main render
  return (
    <div className="min-vh-100">
      {/* Global Messages */}
      {globalError && (
        <div className="position-fixed top-0 end-0 m-3" style={{zIndex: 9999}}>
          <div className="alert-custom-error" style={{maxWidth: '400px'}}>
            {globalError}
            <button
              onClick={() => setGlobalError('')}
              className="btn-close ms-auto"
            ></button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="position-fixed top-0 end-0 m-3" style={{zIndex: 9999}}>
          <div className="alert-custom-success" style={{maxWidth: '400px'}}>
            {successMessage}
            <button
              onClick={() => setSuccessMessage('')}
              className="btn-close ms-auto"
            ></button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {renderNavigation()}

      {/* Main Content */}
      <main>
        {currentPage === 'home' && renderHomePage()}
        {currentPage === 'find-schools' && renderSchoolsPage()}
        {currentPage === 'dashboard' && renderDashboard()}
      </main>

      {/* Modals */}
      {renderAuthModal()}
      
      {/* Offline Quiz Modal */}
      {showOfflineQuiz && (
        <OfflineQuiz onClose={() => setShowOfflineQuiz(false)} />
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

export default App;