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
      setSubmitted(true);
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
        ? "border-emerald-400 bg-emerald-50"
        : "border-gray-200 hover:border-gray-300";
    }

    const isSelected = selectedAnswer === answerId;
    const isCorrect = answerId === result?.correctAnswer?.id;

    if (isCorrect) {
      return "border-green-500 bg-green-50";
    } else if (isSelected && !isCorrect) {
      return "border-red-500 bg-red-50";
    } else {
      return "border-gray-200 opacity-60";
    }
  };

  if (!question?.question) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-500">Keine Frage verfügbar</p>
      </div>
    );
  }

  // Extract the actual question data from the progress object
  const questionData = question.question;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-[600px] flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {questionData.category}
            </span>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Level {questionData.level}</span>
              <span>•</span>
              <span>{question.total_attempts} Versuche</span>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {questionData.question}
          </h2>
        </div>

        <div className="space-y-3 flex-1">
          {questionData.answers.map((answer) => (
            <button
              key={answer.id}
              onClick={() => handleAnswerSelect(answer.id)}
              disabled={submitted}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${getAnswerClass(
                answer.id
              )} ${!submitted ? "hover:shadow-sm" : ""}`}
            >
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedAnswer === answer.id
                      ? "border-emerald-400 bg-emerald-400"
                      : "border-gray-300"
                  }`}
                >
                  {selectedAnswer === answer.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="font-medium text-gray-700">{answer.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer || loading}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Wird gesendet..." : "Antwort senden"}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Nächste Frage
          </button>
        )}
      </div>
    </div>
  );
}

export default QuizQuestion;
