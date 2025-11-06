import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { MealGoalProvider } from './context/mealGoalContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MealGoalProvider>
      <App />
    </MealGoalProvider>
  </StrictMode>
);
