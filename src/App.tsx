import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import InitialSetupScreen from './screens/InitialSetupScreen';
import RefrigeratorScreen from './screens/RefrigeratorScreen';
import MenuSuggestionScreen from './screens/MenuSuggestionScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';


function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navigation />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<InitialSetupScreen />} />
            <Route path="/refrigerator" element={<RefrigeratorScreen />} />
            <Route path="/menu" element={<MenuSuggestionScreen />} />
            <Route path="/shopping" element={<ShoppingListScreen />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
