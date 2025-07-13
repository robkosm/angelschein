import { useEffect, useState } from "react";
import QuizQuestion from "./components/QuizQuestion";
import ProgressOverview from "./components/ProgressOverview";
import Header from "./components/Header";

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionCount, setQuestionCount] = useState(0);

  const API_URL = "http://localhost:3001";
  const USER_ID = "default"; // In a real app, this would come from authentication

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [questionsRes, progressRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/questions`),
        fetch(`${API_URL}/api/quiz/progress/${USER_ID}`),
        fetch(`${API_URL}/api/quiz/stats/${USER_ID}`),
      ]);

      const questionsData = await questionsRes.json();
      const progressData = await progressRes.json();
      const statsData = await statsRes.json();

      setQuestions(questionsData);
      setProgress(progressData);
      setStats(statsData);

      // Load first question
      await loadNextQuestion();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextQuestion = async (excludeId = null) => {
    try {
      const url = excludeId
        ? `${API_URL}/api/quiz/next/${USER_ID}?exclude=${excludeId}`
        : `${API_URL}/api/quiz/next/${USER_ID}`;

      const response = await fetch(url);
      if (response.ok) {
        const question = await response.json();
        setCurrentQuestion(question);
        setQuestionCount((prev) => prev + 1);
      } else {
        console.error("No questions available");
      }
    } catch (error) {
      console.error("Error loading next question:", error);
    }
  };

  const handleAnswerSubmit = async (questionId, selectedAnswerId) => {
    try {
      const response = await fetch(`${API_URL}/api/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          questionId,
          selectedAnswerId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reload progress and stats
        const [progressRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/quiz/progress/${USER_ID}`),
          fetch(`${API_URL}/api/quiz/stats/${USER_ID}`),
        ]);

        const progressData = await progressRes.json();
        const statsData = await statsRes.json();

        setProgress(progressData);
        setStats(statsData);

        return result;
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion) {
      loadNextQuestion(currentQuestion.question_id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Quiz wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        questionCount={questionCount}
        stats={stats}
        onToggleProgress={() => setShowProgress(!showProgress)}
        showProgress={showProgress}
      />

      <div className="max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-80px)]">
        {showProgress ? (
          <ProgressOverview
            progress={progress}
            questions={questions}
            stats={stats}
            onClose={() => setShowProgress(false)}
          />
        ) : (
          <div className="space-y-6">
            {currentQuestion ? (
              <QuizQuestion
                question={currentQuestion}
                onSubmit={handleAnswerSubmit}
                onNext={handleNextQuestion}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎣</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Keine Fragen verfügbar
                </h2>
                <p className="text-gray-600 mb-6">
                  Füge einige Fragen hinzu, um zu beginnen!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
