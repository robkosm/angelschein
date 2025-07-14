function Header({ onToggleProgress, showProgress }) {
  return (
    <header className="bg-white border-b-2 border-teal-600 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎣</div>
            <h1 className="text-xl font-bold text-gray-800">PetriPass</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleProgress}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                showProgress
                  ? "bg-white text-teal-700 border border-teal-700 hover:bg-teal-50"
                  : "bg-white text-teal-700 border border-teal-700 hover:bg-teal-50"
              }`}
            >
              {showProgress ? "← Zurück zum Quiz" : "📊 Fortschritt"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
