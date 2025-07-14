function ProgressOverview({ progress, questions, stats, onClose }) {
  const getLevelColor = (level) => {
    const colors = [
      "bg-slate-100 text-slate-800", // Level 0 - New
      "bg-teal-200 text-teal-900", // Level 1
      "bg-teal-300 text-teal-900", // Level 2
      "bg-teal-400 text-white", // Level 3
      "bg-teal-500 text-white", // Level 4
      "bg-teal-600 text-white", // Level 5
      "bg-teal-700 text-white", // Level 6+ - Mastered
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  const getProgressBarColor = () => {
    return "bg-teal-600"; // All levels use the same teal color
  };

  const getLevelWeight = (level) => {
    const weights = [1, 0.8, 0.6, 0.4, 0.2, 0.1, 0.05];
    return weights[Math.min(level, weights.length - 1)];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Nie";
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 0.8) return "text-emerald-600";
    if (rate >= 0.6) return "text-amber-600";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Fortschritt</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Overall Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-lg shadow-gray-200/50">
            <div className="text-2xl font-bold text-gray-800">
              {stats.totalQuestions}
            </div>
            <div className="text-sm text-gray-600">Fragen gesamt</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg shadow-gray-200/50">
            <div className="text-2xl font-bold text-teal-700">
              {stats.averageLevel}
            </div>
            <div className="text-sm text-gray-600">Ø Level</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg shadow-gray-200/50">
            <div className="text-2xl font-bold text-teal-700">
              {stats.totalAttempts}
            </div>
            <div className="text-sm text-gray-600">Versuche gesamt</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg shadow-gray-200/50">
            <div className="text-2xl font-bold text-teal-700">
              {stats.totalQuestions > 0
                ? Math.round(
                    (stats.totalAttempts / stats.totalQuestions) * 100
                  ) / 100
                : 0}
            </div>
            <div className="text-sm text-gray-600">Ø Versuche/Frage</div>
          </div>
        </div>
      )}

      {/* Level Distribution Chart */}
      {stats && (
        <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Fragen nach Level
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.levelStats).map(([level, count]) => (
              <div key={level} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-gray-600">
                  Level {level}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${getProgressBarColor()}`}
                    style={{
                      width: `${
                        stats.totalQuestions > 0
                          ? (count / stats.totalQuestions) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="w-12 text-sm text-gray-600 text-right">
                  {count}
                </div>
                <div className="w-16 text-xs text-gray-500 text-right">
                  {getLevelWeight(parseInt(level))}x Gewicht
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Table */}
      <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">Fragen</h3>
        </div>
        <div className="space-y-4">
          {progress.map((item) => {
            const question = questions.find((q) => q.id === item.question_id);
            if (!question) return null;

            return (
              <div
                key={item.question_id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">
                      #{question.id}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(
                        item.level
                      )}`}
                    >
                      Level {item.level}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium ${getSuccessRateColor(
                      item.success_rate
                    )}`}
                  >
                    {Math.round(item.success_rate * 100)}%
                  </span>
                </div>

                <div className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                  {question.question}
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium inline-block">
                    {question.category}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{item.total_attempts} Versuche</span>
                    <span>{formatDate(item.last_reviewed)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SRS Level Guide */}
      <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">SRS-Level-System</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">
              Level-Fortschritt
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                • <strong>Level aufsteigen:</strong> 3 aufeinanderfolgende
                richtige Antworten
              </div>
              <div>
                • <strong>Level absteigen:</strong> 2 aufeinanderfolgende
                falsche Antworten
              </div>
              <div>
                • <strong>Max Level:</strong> 6 (gemeistert)
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Auswahlgewichte</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                • <strong>Höhere Level:</strong> Erscheinen seltener
              </div>
              <div>
                • <strong>Neue Fragen:</strong> Hohe Priorität (10x Gewicht)
              </div>
              <div>
                • <strong>Level 6:</strong> Sehr selten (0,05x Gewicht)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressOverview;
