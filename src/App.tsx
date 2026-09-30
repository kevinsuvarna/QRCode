import { Navigate, Route, Routes } from 'react-router-dom';
import ChoosePage from './pages/ChoosePage';
import ResultPage from './pages/ResultPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChoosePage />} />
      <Route path="/result/:cardId" element={<ResultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
