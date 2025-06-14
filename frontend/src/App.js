import React, { useState, useEffect } from 'react';
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

  // Executive Navigation
  const renderExecutiveNavigation = () => (
    <nav className="executive-nav">
      <div className="executive-nav-container">
        <a href="#" className="executive-logo" onClick={() => setCurrentPage('home')}>
          <div className="executive-logo-icon">🚗</div>
          <div>
            <div>{t.appName}</div>
            <div style={{fontSize: '0.75rem', opacity: 0.8}}>{t.tagline}</div>
          </div>
        </a>
        
        <div className="executive-nav-menu">
          <a 
            href="#" 
            className={`executive-nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            {t.home}
          </a>
          <a 
            href="#" 
            className={`executive-nav-link ${currentPage === 'find-schools' ? 'active' : ''}`}
            onClick={() => {
              setCurrentPage('find-schools');
              fetchDrivingSchools();
            }}
          >
            {t.findSchools}
          </a>
          {user && user.role !== 'guest' && (
            <a 
              href="#" 
              className={`executive-nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setCurrentPage('dashboard');
                fetchDashboardData();
              }}
            >
              {t.dashboard}
            </a>
          )}
          <a 
            href="#" 
            className="executive-nav-link"
            onClick={() => setShowOfflineQuiz(true)}
          >
            {t.offlineQuiz}
          </a>
        </div>
        
        <div className="executive-nav-actions">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="executive-language-selector"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="fr">Français</option>
          </select>
          
          {user ? (
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{color: 'white', fontSize: '0.875rem'}}>
                {t.welcome}, {user.first_name}
              </div>
              <button
                onClick={handleLogout}
                className="btn-executive btn-secondary"
              >
                {t.logout}
              </button>
            </div>
          ) : (
            <div style={{display: 'flex', gap: '1rem'}}>
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="btn-executive btn-outline"
              >
                {t.login}
              </button>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setShowAuthModal(true);
                }}
                className="btn-executive btn-primary"
              >
                {t.register}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  // Executive Home Page - Desktop Only Design
  const renderExecutiveHomePage = () => (
    <div>
      {/* Hero Section */}
      <section className="executive-hero">
        <div className="executive-hero-container">
          <div className="executive-hero-content">
            <div className="executive-hero-badge">
              <span>🇩🇿</span>
              <span>Professional Driving Education</span>
            </div>
            
            <h1 className="executive-hero-title">
              {t.heroTitle}
            </h1>
            
            <p className="executive-hero-subtitle">
              {t.heroSubtitle}
            </p>
            
            <div className="executive-hero-actions">
              <button
                onClick={() => {
                  setCurrentPage('find-schools');
                  fetchDrivingSchools();
                }}
                className="btn-executive btn-primary"
              >
                🔍 {t.heroButton1}
              </button>
              <button
                onClick={() => setShowOfflineQuiz(true)}
                className="btn-executive btn-algeria"
              >
                📚 {t.heroButton2}
              </button>
            </div>
            
            <div className="executive-hero-stats">
              <div className="executive-hero-stat">
                <span className="executive-hero-stat-number">{t.stat1}</span>
                <span className="executive-hero-stat-label">{t.stat1Label}</span>
              </div>
              <div className="executive-hero-stat">
                <span className="executive-hero-stat-number">{t.stat2}</span>
                <span className="executive-hero-stat-label">{t.stat2Label}</span>
              </div>
              <div className="executive-hero-stat">
                <span className="executive-hero-stat-number">{t.stat3}</span>
                <span className="executive-hero-stat-label">{t.stat3Label}</span>
              </div>
            </div>
          </div>
          
          <div className="executive-hero-visual">
            <div className="executive-hero-visual-content">
              <div className="executive-hero-icon">🎓</div>
              <h3 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Premium Training</h3>
              <p style={{opacity: 0.8}}>Experience world-class driving education</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="executive-features">
        <div className="executive-features-container">
          <div className="executive-section-header">
            <div className="executive-section-badge">Excellence in Education</div>
            <h2 className="executive-section-title">{t.whyChoose}</h2>
            <p className="executive-section-subtitle">
              Join thousands of successful drivers who chose our platform for their driving education journey.
            </p>
          </div>
          
          <div className="executive-features-grid">
            <div className="executive-feature-card">
              <div className="executive-feature-icon">🏆</div>
              <h3 className="executive-feature-title">{t.feature1Title}</h3>
              <p className="executive-feature-description">{t.feature1Desc}</p>
            </div>
            
            <div className="executive-feature-card">
              <div className="executive-feature-icon">📋</div>
              <h3 className="executive-feature-title">{t.feature2Title}</h3>
              <p className="executive-feature-description">{t.feature2Desc}</p>
            </div>
            
            <div className="executive-feature-card">
              <div className="executive-feature-icon">🗺️</div>
              <h3 className="executive-feature-title">{t.feature3Title}</h3>
              <p className="executive-feature-description">{t.feature3Desc}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Executive Schools Page
  const renderExecutiveSchoolsPage = () => (
    <div className="executive-schools">
      <div className="container-executive" style={{paddingTop: '120px'}}>
        <div className="executive-section-header">
          <div className="executive-section-badge">Premium Driving Schools</div>
          <h2 className="executive-section-title">Choose Your Driving School</h2>
          <p className="executive-section-subtitle">
            Explore certified driving schools across Algeria with guaranteed quality and professional instruction.
          </p>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div style={{maxWidth: '1200px', margin: '3rem auto', background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: 'var(--shadow-lg)'}}>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{marginBottom: '2rem'}}>
            <div style={{position: 'relative', maxWidth: '600px', margin: '0 auto'}}>
              <input
                type="text"
                placeholder="Search schools by name, address, or description..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="executive-form-input"
                style={{paddingRight: '4rem'}}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'var(--primary-blue)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer'
                }}
              >
                🔍
              </button>
              
              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid var(--neutral-200)',
                  borderRadius: '0.5rem',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 10,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                        fetchDrivingSchools({ search: suggestion, page: 1 });
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        borderBottom: index < searchSuggestions.length - 1 ? '1px solid var(--neutral-100)' : 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--neutral-50)'}
                      onMouseLeave={(e) => e.target.style.background = 'white'}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Advanced Filters */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>
            
            {/* State Filter */}
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Wilaya</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  fetchDrivingSchools({ state: e.target.value, page: 1 });
                }}
                className="executive-form-input executive-form-select"
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
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Min Price (DZD)</label>
              <input
                type="number"
                placeholder="Min price"
                value={priceRange.min}
                onChange={(e) => {
                  setPriceRange(prev => ({ ...prev, min: e.target.value }));
                }}
                onBlur={() => fetchDrivingSchools({ page: 1 })}
                className="executive-form-input"
              />
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Max Price (DZD)</label>
              <input
                type="number"
                placeholder="Max price"
                value={priceRange.max}
                onChange={(e) => {
                  setPriceRange(prev => ({ ...prev, max: e.target.value }));
                }}
                onBlur={() => fetchDrivingSchools({ page: 1 })}
                className="executive-form-input"
              />
            </div>

            {/* Rating Filter */}
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Min Rating</label>
              <select
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value);
                  fetchDrivingSchools({ min_rating: e.target.value, page: 1 });
                }}
                className="executive-form-input executive-form-select"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  fetchDrivingSchools({ sort_by: e.target.value, page: 1 });
                }}
                className="executive-form-input executive-form-select"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Order</label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  fetchDrivingSchools({ sort_order: e.target.value, page: 1 });
                }}
                className="executive-form-input executive-form-select"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <button
              onClick={clearFilters}
              className="btn-executive btn-secondary"
            >
              Clear All Filters
            </button>
            
            {pagination.total_count > 0 && (
              <div style={{color: 'var(--neutral-600)'}}>
                Showing {pagination.total_count} school(s)
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="executive-loading">
            <div className="executive-spinner"></div>
          </div>
        ) : (
          <>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem'}}>
              {drivingSchools.map((school) => (
                <div key={school.id} className="school-card-executive">
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
                    <div className="school-stars">
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
                
                  <div className="school-actions">
                    <button
                      onClick={() => handleEnroll(school.id)}
                      className="btn-executive btn-primary"
                      style={{flex: 1}}
                    >
                      {t.enrollNow}
                    </button>
                    <button className="btn-executive btn-secondary">
                      {t.viewDetails}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem'}}>
                <button
                  onClick={() => fetchDrivingSchools({ page: pagination.current_page - 1 })}
                  disabled={!pagination.has_prev}
                  className="btn-executive btn-secondary"
                  style={{opacity: pagination.has_prev ? 1 : 0.5}}
                >
                  ← Previous
                </button>
                
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => fetchDrivingSchools({ page })}
                        className={`btn-executive ${pagination.current_page === page ? 'btn-primary' : 'btn-secondary'}`}
                        style={{minWidth: '40px'}}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => fetchDrivingSchools({ page: pagination.current_page + 1 })}
                  disabled={!pagination.has_next}
                  className="btn-executive btn-secondary"
                  style={{opacity: pagination.has_next ? 1 : 0.5}}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {drivingSchools.length === 0 && !loading && (
          <div className="text-center" style={{padding: '4rem'}}>
            <div style={{fontSize: '4rem', marginBottom: '2rem'}}>🏫</div>
            <h3>No driving schools found matching your criteria.</h3>
            <button
              onClick={clearFilters}
              className="btn-executive btn-primary"
              style={{marginTop: '1rem'}}
            >
              Clear filters to see all schools
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Executive Dashboard
  const renderExecutiveDashboard = () => (
    <div className="executive-dashboard">
      <div className="executive-dashboard-container">
        <div className="executive-dashboard-header">
          <h1 className="executive-dashboard-welcome">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="executive-dashboard-subtitle">
            Your role: <span style={{fontWeight: 600, textTransform: 'capitalize'}}>{user?.role}</span>
          </p>
        </div>
        
        {dashboardData ? (
          <div className="executive-dashboard-grid">
            <div className="executive-dashboard-card">
              <h3 className="executive-dashboard-card-title">Your Enrollments</h3>
              {dashboardData.enrollments && dashboardData.enrollments.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {dashboardData.enrollments.map((enrollment) => (
                    <div key={enrollment.id} style={{padding: '1rem', border: '1px solid var(--neutral-200)', borderRadius: 'var(--border-radius-lg)'}}>
                      <h4 style={{fontWeight: 600, marginBottom: '0.5rem'}}>
                        {enrollment.school_name}
                      </h4>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <span>Status:</span>
                        <span className={`status-badge status-${enrollment.enrollment_status.replace('_', '-')}`}>
                          {enrollment.enrollment_status.replace('_', ' ')}
                        </span>
                      </div>
                      {enrollment.enrollment_status === 'pending_documents' && (
                        <p style={{color: 'var(--primary-blue)', fontSize: '0.875rem', marginTop: '0.5rem'}}>
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
            
            <div className="executive-dashboard-card">
              <h3 className="executive-dashboard-card-title">Quick Actions</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <button
                  onClick={() => {
                    setCurrentPage('find-schools');
                    fetchDrivingSchools();
                  }}
                  className="btn-executive btn-primary"
                >
                  🔍 Find Driving Schools
                </button>
                <button
                  onClick={() => setShowOfflineQuiz(true)}
                  className="btn-executive btn-algeria"
                >
                  📚 Practice Tests
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="executive-loading">
            <div className="executive-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );

  // Auth Modal
  const renderAuthModal = () => (
    showAuthModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '2rem'
      }}>
        <div className="executive-form">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
            <h2 className="executive-form-title" style={{margin: 0}}>
              {authMode === 'login' ? t.login : t.register}
            </h2>
            <button
              onClick={() => setShowAuthModal(false)}
              style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}
            >
              ×
            </button>
          </div>

          {errorMessage && (
            <div className="executive-alert executive-alert-error">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="executive-alert executive-alert-success">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleAuth}>
            <div className="executive-form-group">
              <label className="executive-form-label">{t.email}</label>
              <input
                type="email"
                required
                value={authData.email}
                onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                className="executive-form-input"
              />
            </div>

            <div className="executive-form-group">
              <label className="executive-form-label">Password</label>
              <input
                type="password"
                required
                value={authData.password}
                onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                className="executive-form-input"
              />
            </div>

            {authMode === 'register' && (
              <>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="executive-form-group">
                    <label className="executive-form-label">First Name</label>
                    <input
                      type="text"
                      required
                      value={authData.first_name}
                      onChange={(e) => setAuthData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="executive-form-input"
                    />
                  </div>
                  <div className="executive-form-group">
                    <label className="executive-form-label">Last Name</label>
                    <input
                      type="text"
                      required
                      value={authData.last_name}
                      onChange={(e) => setAuthData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="executive-form-input"
                    />
                  </div>
                </div>

                <div className="executive-form-group">
                  <label className="executive-form-label">{t.phone}</label>
                  <input
                    type="tel"
                    required
                    value={authData.phone}
                    onChange={(e) => setAuthData(prev => ({ ...prev, phone: e.target.value }))}
                    className="executive-form-input"
                  />
                </div>

                <div className="executive-form-group">
                  <label className="executive-form-label">{t.address}</label>
                  <input
                    type="text"
                    required
                    value={authData.address}
                    onChange={(e) => setAuthData(prev => ({ ...prev, address: e.target.value }))}
                    className="executive-form-input"
                  />
                </div>

                <div className="executive-form-group">
                  <label className="executive-form-label">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={authData.date_of_birth}
                    onChange={(e) => setAuthData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="executive-form-input"
                  />
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="executive-form-group">
                    <label className="executive-form-label">Gender</label>
                    <select
                      value={authData.gender}
                      onChange={(e) => setAuthData(prev => ({ ...prev, gender: e.target.value }))}
                      className="executive-form-input executive-form-select"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="executive-form-group">
                    <label className="executive-form-label">{t.state}</label>
                    <select
                      required
                      value={authData.state}
                      onChange={(e) => setAuthData(prev => ({ ...prev, state: e.target.value }))}
                      className="executive-form-input executive-form-select"
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
              className="btn-executive btn-primary"
              style={{width: '100%', marginTop: '1rem'}}
            >
              {authLoading ? (
                <>
                  <div className="executive-spinner" style={{width: '20px', height: '20px', marginRight: '0.5rem'}}></div>
                  {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                authMode === 'login' ? t.login : t.register
              )}
            </button>
          </form>

          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              style={{background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', textDecoration: 'underline'}}
            >
              {authMode === 'login' 
                ? "Don't have an account? Register" 
                : "Already have an account? Login"
              }
            </button>
          </div>
        </div>
      </div>
    )
  );

  // Main render
  return (
    <div style={{minHeight: '100vh', backgroundColor: 'var(--neutral-100)'}}>
      {/* Global Messages */}
      {globalError && (
        <div style={{position: 'fixed', top: '1rem', right: '1rem', zIndex: 9998}}>
          <div className="executive-alert executive-alert-error" style={{maxWidth: '400px'}}>
            {globalError}
            <button
              onClick={() => setGlobalError('')}
              style={{marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer'}}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div style={{position: 'fixed', top: '1rem', right: '1rem', zIndex: 9998}}>
          <div className="executive-alert executive-alert-success" style={{maxWidth: '400px'}}>
            {successMessage}
            <button
              onClick={() => setSuccessMessage('')}
              style={{marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer'}}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {renderExecutiveNavigation()}

      {/* Main Content */}
      <main>
        {currentPage === 'home' && renderExecutiveHomePage()}
        {currentPage === 'find-schools' && renderExecutiveSchoolsPage()}
        {currentPage === 'dashboard' && renderExecutiveDashboard()}
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
