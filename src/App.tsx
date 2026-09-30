import { Navigate, Route, Routes } from 'react-router-dom';
import ChoosePage from './pages/ChoosePage';
import ResultPage from './pages/ResultPage';
import DevScannerPage from './pages/DevScannerPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChoosePage />} />
      <Route path="/result/:cardId" element={<ResultPage />} />
      {/* TEMPORARY: scanner test page. import.meta.env.DEV is true only in `npm run dev`,
          so this route doesn't exist on the deployed site. */}
      {import.meta.env.DEV && <Route path="/dev/scanner" element={<DevScannerPage />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
