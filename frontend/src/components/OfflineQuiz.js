import React, { useState, useEffect, useCallback } from 'react';

const OfflineQuiz = ({ onClose }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error

  // Monitor online/offline status
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

  // Load quizzes on component mount
  useEffect(() => {
    loadQuizzes();
  }, []);

  // Timer effect
  useEffect(() => {
    let timer;
    if (quizStarted && !quizCompleted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleQuizSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted, timeLeft]);

  const loadQuizzes = async () => {
    try {
      // First try to load from network
      if (isOnline) {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/quizzes/theory`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (response.ok) {
          const data = await response.json();
          setQuizzes(data);
          // Store in localStorage for offline use
          localStorage.setItem('offline_quizzes', JSON.stringify(data));
          return;
        }
      }
      
      // Fallback to cached/offline quizzes
      const cachedQuizzes = localStorage.getItem('offline_quizzes');
      if (cachedQuizzes) {
        setQuizzes(JSON.parse(cachedQuizzes));
      } else {
        // Default offline quiz if no cache available
        setQuizzes([{
          id: 'offline-default',
          title: 'Road Signs Quiz (Offline)',
          description: 'Practice road signs offline',
          difficulty: 'medium',
          questions: [
            {
              id: 1,
              question: 'What does a red triangle sign with an exclamation mark mean?',
              options: ['Stop', 'General Warning', 'No Entry', 'Speed Limit'],
              correct_answer: 'General Warning',
              explanation: 'A red triangle with exclamation mark indicates a general warning to drivers.'
            },
            {
              id: 2,
              question: 'What is the speed limit in urban areas in Algeria?',
              options: ['40 km/h', '50 km/h', '60 km/h', '70 km/h'],
              correct_answer: '50 km/h',
              explanation: 'The speed limit in urban areas in Algeria is 50 km/h unless otherwise indicated.'
            },
            {
              id: 3,
              question: 'When should you use your headlights during the day?',
              options: ['Never', 'Only when raining', 'Outside urban areas', 'Always'],
              correct_answer: 'Outside urban areas',
              explanation: 'In Algeria, headlights must be used during the day when driving outside urban areas.'
            },
            {
              id: 4,
              question: 'What does a circular blue sign with a white arrow mean?',
              options: ['Prohibition', 'Mandatory direction', 'Information', 'Warning'],
              correct_answer: 'Mandatory direction',
              explanation: 'Blue circular signs indicate mandatory actions, including direction.'
            },
            {
              id: 5,
              question: 'At what age can you get a driving license in Algeria?',
              options: ['16 years', '17 years', '18 years', '19 years'],
              correct_answer: '18 years',
              explanation: 'In Algeria, you must be at least 18 years old to obtain a driving license.'
            }
          ],
          passing_score: 70,
          time_limit_minutes: 10,
          offline: true
        }]);
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      // Load from localStorage if available
      const cachedQuizzes = localStorage.getItem('offline_quizzes');
      if (cachedQuizzes) {
        setQuizzes(JSON.parse(cachedQuizzes));
      }
    }
  };

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(quiz.time_limit_minutes * 60);
    setQuizStarted(true);
    setQuizCompleted(false);
    setScore(0);
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuizSubmit = useCallback(() => {
    if (!selectedQuiz || quizCompleted) return;

    // Calculate score
    let correctAnswers = 0;
    selectedQuiz.questions.forEach(question => {
      if (answers[question.id] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / selectedQuiz.questions.length) * 100);
    setScore(finalScore);
    setQuizCompleted(true);
    setQuizStarted(false);

    // Store result locally for sync when online
    const result = {
      id: Date.now().toString(),
      quiz_id: selectedQuiz.id,
      answers: answers,
      score: finalScore,
      passed: finalScore >= selectedQuiz.passing_score,
      completed_at: new Date().toISOString(),
      time_taken: (selectedQuiz.time_limit_minutes * 60) - timeLeft,
      offline: !isOnline
    };

    // Store in localStorage for sync
    const storedResults = JSON.parse(localStorage.getItem('offline_quiz_results') || '[]');
    storedResults.push(result);
    localStorage.setItem('offline_quiz_results', JSON.stringify(storedResults));

    // Try to sync immediately if online
    if (isOnline) {
      syncQuizResults();
    }
  }, [selectedQuiz, answers, quizCompleted, timeLeft, isOnline]);

  const syncQuizResults = async () => {
    const storedResults = JSON.parse(localStorage.getItem('offline_quiz_results') || '[]');
    if (storedResults.length === 0) return;

    setSyncStatus('syncing');
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setSyncStatus('error');
        return;
      }

      for (const result of storedResults) {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/quiz-attempts`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(result)
          });

          if (response.ok) {
            // Remove synced result
            const updatedResults = storedResults.filter(r => r.id !== result.id);
            localStorage.setItem('offline_quiz_results', JSON.stringify(updatedResults));
          }
        } catch (error) {
          console.error('Failed to sync individual result:', error);
        }
      }

      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && syncStatus === 'idle') {
      const storedResults = JSON.parse(localStorage.getItem('offline_quiz_results') || '[]');
      if (storedResults.length > 0) {
        syncQuizResults();
      }
    }
  }, [isOnline]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!selectedQuiz) return 0;
    return Math.round(((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100);
  };

  const currentQuestion = selectedQuiz?.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === selectedQuiz?.questions.length - 1;
  const unsyncedResults = JSON.parse(localStorage.getItem('offline_quiz_results') || '[]').length;

  if (!quizStarted && !quizCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Offline Quizzes</h2>
                <p className="text-blue-100 mt-1">Practice anytime, anywhere</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Connection Status */}
            <div className="flex items-center mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
              <div className={`w-3 h-3 rounded-full mr-3 ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">
                {isOnline ? 'Online' : 'Offline'} 
                {unsyncedResults > 0 && (
                  <span className="ml-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs">
                    {unsyncedResults} results pending sync
                  </span>
                )}
              </span>
              {syncStatus === 'syncing' && (
                <div className="ml-auto flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="text-sm">Syncing...</span>
                </div>
              )}
              {syncStatus === 'synced' && (
                <div className="ml-auto flex items-center text-green-200">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Synced</span>
                </div>
              )}
            </div>
          </div>

          {/* Quiz List */}
          <div className="p-6">
            {quizzes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-gray-500 mb-4">No quizzes available offline</p>
                <button
                  onClick={loadQuizzes}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {quiz.title}
                          {quiz.offline && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              📱 Offline
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-600 mt-1">{quiz.description}</p>
                        
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {quiz.questions?.length || 0} questions
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {quiz.time_limit_minutes || 30} minutes
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {quiz.difficulty || 'medium'}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => startQuiz(quiz)}
                        className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Start Quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const passed = score >= selectedQuiz.passing_score;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className={`p-6 rounded-t-lg text-white ${passed ? 'bg-green-600' : 'bg-red-600'}`}>
            <div className="text-center">
              <div className="text-6xl mb-4">{passed ? '🎉' : '😔'}</div>
              <h2 className="text-2xl font-bold">
                {passed ? 'Congratulations!' : 'Try Again!'}
              </h2>
              <p className="text-lg mt-2">Score: {score}%</p>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                {passed 
                  ? `You passed the quiz! You need ${selectedQuiz.passing_score}% to pass.`
                  : `You need ${selectedQuiz.passing_score}% to pass. Keep practicing!`
                }
              </p>

              {!isOnline && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">
                    📱 Your result is saved offline and will sync when you're back online.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => startQuiz(selectedQuiz)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setSelectedQuiz(null);
                    setQuizCompleted(false);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Back to Quizzes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with progress */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{selectedQuiz.title}</h2>
            <div className="text-right">
              <div className="text-lg font-bold">{formatTime(timeLeft)}</div>
              <div className="text-sm text-blue-100">Time Left</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-blue-800 rounded-full h-2 mb-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="text-sm text-blue-100">
            Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    answers[currentQuestion.id] === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                    className="mr-3 text-blue-600"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleQuizSubmit}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Offline indicator */}
          {!isOnline && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-800 text-sm">
                  Taking quiz offline - results will sync when you reconnect
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineQuiz;