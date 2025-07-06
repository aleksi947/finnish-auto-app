import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SubscribeButton from "./components/SubscribeButton";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";
import { auth } from "./firebase";
import { db } from "./firebase";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import LessonsPage from "./pages/LessonsPage";
import ProfilePage from "./pages/ProfilePage";
import LessonOverview from "./pages/LessonOverview";
import SpeakingBlock from "./components/SpeakingBlock";
import ListeningBlock from "./components/ListeningBlock";
import VocabularyPage from "./pages/VocabularyPage";

console.log("🔥 Firestore подключён:", db);
console.log("🔥 Firebase подключён:", auth);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/lesson/:lessonId" element={<LessonOverview />} />
        <Route
          path="/lesson/:lessonId/vocabulary"
          element={<VocabularyPage />}
        />
      </Routes>
    </Router>
  );
}

export default App;
