import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";
import { auth } from "./firebase";
import { db } from "./firebase";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import LessonsPage from "./pages/LessonsPage";
import ProfilePage from "./pages/ProfilePage";
import SubscriptionPage from "./pages/SubscriptionPage";
import LessonOverview from "./pages/LessonOverview";
import SpeakingBlock from "./components/SpeakingBlock";
import ListeningBlock from "./components/ListeningBlock";
import VocabularyPage from "./pages/VocabularyPage";
import LessonGrammarPage from "./pages/LessonGrammarPage";
import LessonGrammarSectionsPage from "./pages/LessonGrammarSectionsPage";
import ExercisePage from "./pages/ExercisePage";
import LessonListeningPage from "./pages/LessonListeningPage";
import ListeningExercisePage from "./pages/ListeningExercisePage";
import LessonSpeakingExercisePage from "./pages/LessonSpeakingExercisePage";
import LessonSpeakingPage from "./pages/LessonSpeakingPage";
import LessonWritingPage from "./pages/LessonWritingPage";
import LessonReadingPage from "./pages/LessonReadingPage";
import LessonReadingExercisePage from "./pages/LessonReadingExercisePage";
import LessonWritingExercisePage from "./pages/LessonWritingExercisePage";
import VocabularyBlockPage from "./pages/VocabularyBlockPage";
import LessonAdminPage from "./pages/LessonAdminPage";
import LessonEditPage from "./pages/LessonEditPage";
import LessonEditorPage from "./pages/admin/LessonEditorPage";
import LessonCreatePage from "./pages/admin/LessonCreatePage";

import LessonGuard from "./components/LessonGuard";
import AdminGuard from "./components/AdminGuard";
import { SUBSCRIPTIONS_ENABLED } from "./config/features";

console.log("🔥 Firestore подключён:", db);
console.log("🔥 Firebase подключён:", auth);

function App() {
  return (
    <Router>
      <Routes>
        {SUBSCRIPTIONS_ENABLED && (
          <>
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/cancel" element={<CancelPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
          </>
        )}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<HomePage />} />
        
        {/* Protected lesson routes */}
        <Route element={<LessonGuard />}>
          <Route path="/lesson/:lessonId" element={<LessonOverview />} />
          <Route
            path="/lesson/:lessonId/vocabulary"
            element={<VocabularyPage />}
          />
          <Route
            path="/lesson/:lessonId/grammar"
            element={<LessonGrammarPage />}
          />
          <Route
            path="/lesson/:lessonId/grammar/:sectionId"
            element={<LessonGrammarSectionsPage />}
          />
          <Route
            path="/lesson/:lessonId/grammar/:sectionId/exercise/:exerciseId"
            element={<ExercisePage />}
          />
          <Route
            path="/lesson/:lessonId/listening"
            element={<LessonListeningPage />}
          />
          <Route
            path="/lesson/:lessonId/listening/exercise/:taskId"
            element={<ListeningExercisePage />}
          />
          <Route
            path="/lesson/:lessonId/speaking/exercise/:taskId"
            element={<LessonSpeakingExercisePage />}
          />
          <Route
            path="/lesson/:lessonId/speaking"
            element={<LessonSpeakingPage />}
          />
          <Route
            path="/lesson/:lessonId/writing/exercise/:taskId"
            element={<LessonWritingExercisePage />}
          />
          <Route
            path="/lesson/:lessonId/writing"
            element={<LessonWritingPage />}
          />
          <Route
            path="/lesson/:lessonId/reading"
            element={<LessonReadingPage />}
          />
          <Route
            path="/lesson/:lessonId/reading/exercise/:taskId"
            element={<LessonReadingExercisePage />}
          />
          <Route
            path="/lesson/:lessonId/vocabulary/:blockId"
            element={<VocabularyBlockPage />}
          />
        </Route>

        <Route element={<AdminGuard />}>
          <Route path="/admin/lessons" element={<LessonAdminPage />} />
          <Route
            path="/admin/lesson/:level/:lessonId"
            element={<LessonEditorPage />}
          />
          <Route path="/admin/lessons/new" element={<LessonCreatePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
