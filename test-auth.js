// Тестовый файл для проверки авторизации
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCvnOc7qOr9TxZlGV_edBChHtlQVrKLWLo",
  authDomain: "finnish-auto-new.firebaseapp.com",
  projectId: "finnish-auto-new",
  storageBucket: "finnish-auto-new.appspot.com",
  messagingSenderId: "66346972311",
  appId: "1:66346972311:web:70db71466b8fa2a35425d2",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, "us-central1");

// Проверка состояния авторизации
onAuthStateChanged(auth, (user) => {
  console.log("=== Состояние авторизации ===");
  console.log("Пользователь:", user);
  if (user) {
    console.log("Email:", user.email);
    console.log("UID:", user.uid);
    console.log("Email verified:", user.emailVerified);
  }
});

// Функция для тестирования входа
async function testLogin(email, password) {
  try {
    console.log("=== Тестирование входа ===");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Вход успешен:", userCredential.user.email);
    
    // Получаем токен
    const token = await userCredential.user.getIdToken(true);
    console.log("✅ Токен получен:", !!token);
    
    return userCredential.user;
  } catch (error) {
    console.error("❌ Ошибка входа:", error.message);
    throw error;
  }
}

// Функция для тестирования Cloud Function
async function testCloudFunction() {
  try {
    console.log("=== Тестирование Cloud Function ===");
    const user = auth.currentUser;
    
    if (!user) {
      console.log("❌ Нет авторизованного пользователя");
      return;
    }
    
    const createSession = httpsCallable(functions, "createStripeSession");
    const result = await createSession({
      successUrl: "http://localhost:5173/success",
      cancelUrl: "http://localhost:5173/cancel",
    });
    
    console.log("✅ Cloud Function выполнена успешно:", result.data);
  } catch (error) {
    console.error("❌ Ошибка Cloud Function:", error);
  }
}

// Экспортируем функции для использования в консоли браузера
window.testAuth = {
  testLogin,
  testCloudFunction,
  auth
};

console.log("🔧 Тестовые функции загружены. Используйте:");
console.log("- testAuth.testLogin(email, password)");
console.log("- testAuth.testCloudFunction()"); 