function Header({ onToggleProgress, showProgress }) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎣</div>
            <h1 className="text-xl font-bold text-gray-800">
              Angelschein Quiz
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleProgress}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showProgress
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {showProgress ? "Zurück zum Quiz" : "Fortschritt"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
