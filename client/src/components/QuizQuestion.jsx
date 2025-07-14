import { useState } from "react";

function QuizQuestion({ question, onSubmit, onNext }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnswerSelect = (answerId) => {
    if (!submitted) {
      setSelectedAnswer(answerId);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) return;

    setLoading(true);
    try {
      const result = await onSubmit(question.question_id, selectedAnswer);
      setResult(result);
      // Add a small delay to allow the click animation to complete
      setTimeout(() => {
        setSubmitted(true);
      }, 150);
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setSubmitted(false);
    setResult(null);
    onNext();
  };

  const getAnswerClass = (answerId) => {
    if (!submitted) {
      return selectedAnswer === answerId
        ? "border-teal-600 bg-teal-50 shadow-md"
        : "border-gray-200 hover:border-gray-300 hover:shadow-md";
    }

    const isSelected = selectedAnswer === answerId;
    const isCorrect = answerId === result?.correctAnswer?.id;

    if (isCorrect) {
      return "border-emerald-500 bg-emerald-50 shadow-md";
    } else if (isSelected && !isCorrect) {
      return "border-red-400 bg-red-50 shadow-md";
    } else {
      return "border-gray-200 opacity-60";
    }
  };

  if (!question?.question) {
    return (
      <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 p-6">
        <p className="text-gray-500">Keine Frage verfügbar</p>
      </div>
    );
  }

  // Extract the actual question data from the progress object
  const questionData = question.question;

  return (
    <div className="bg-white rounded-xl shadow-xl shadow-gray-200/50 p-6 h-[85vh] sm:h-[600px] flex flex-col w-full max-w-2xl mx-auto">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
        <div className="flex items-center space-x-2">
          <div className="bg-white text-gray-700 px-2 rounded-full text-sm font-medium">
            #{questionData.id}
          </div>
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
            {questionData.category}
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Level {questionData.level}</span>
          <span>•</span>
          <span>{question.total_attempts} Versuche</span>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {questionData.question}
      </h2>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="space-y-3 pb-2">
            {questionData.answers.map((answer) => (
              <button
                key={answer.id}
                onClick={() => handleAnswerSelect(answer.id)}
                disabled={submitted}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${getAnswerClass(
                  answer.id
                )} ${!submitted ? "hover:shadow-lg" : ""}`}
              >
                <div className="flex items-start">
                  <div
                    className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                      selectedAnswer === answer.id && !submitted
                        ? "border-teal-600 bg-teal-600"
                        : submitted &&
                          selectedAnswer === answer.id &&
                          answer.id !== result?.correctAnswer?.id
                        ? "border-red-400 bg-red-400"
                        : submitted && answer.id === result?.correctAnswer?.id
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedAnswer === answer.id && !submitted && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                    {submitted && answer.id === result?.correctAnswer?.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                    {submitted &&
                      selectedAnswer === answer.id &&
                      answer.id !== result?.correctAnswer?.id && (
                        <div className="text-white text-sm font-bold">✗</div>
                      )}
                  </div>
                  <span className="font-medium text-gray-700">
                    {answer.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer || loading}
            className="bg-teal-700 text-white px-8 py-2 rounded-xl font-medium hover:bg-teal-600 disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 w-[200px]"
          >
            Antwort senden
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="bg-teal-700 text-white px-8 py-2 rounded-xl font-medium hover:bg-teal-600 transition-all duration-200 w-[200px]"
          >
            Nächste Frage
          </button>
        )}
      </div>
    </div>
  );
}

export default QuizQuestion;
