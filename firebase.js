import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDocs, 
    setDoc,
    deleteDoc,         // <--- NEW: For removing books from library
    serverTimestamp    // <--- NEW: For adding a save timestamp
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyCOq2iKWlFv3lWWt9l5JdDyXgKyT4DICtk",
    authDomain: "digital-library-hub-a5b9e.firebaseapp.com",
    projectId: "digital-library-hub-a5b9e",
    storageBucket: "digital-library-hub-a5b9e.firebasestorage.app",
    messagingSenderId: "638910621422",
    appId: "1:638910621422:web:e02359b6e0dd23536975ff",
    measurementId: "G-L046P4N37N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// === Social Auth Providers ===
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

/**
 * Save user data helper (Reused)
 */
export async function saveUserDataToFirestore(uid, email, role = 'member') {
  try {
    const userRef = doc(db, "users", uid); 
    await setDoc(userRef, {
      email: email,
      name: email.split('@')[0], 
      role: role,
      joinedDate: new Date(),
    }, { merge: true }); // merge: true para di mapatungan kung may data na
    console.log(`User ${uid} data saved/updated.`);
  } catch (error) {
    console.error("Error saving user data:", error.message);
  }
}

/**
 * Login with Google
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await saveUserDataToFirestore(user.uid, user.email);
    alert(`👋 Welcome, ${user.displayName || user.email}!`);
    return user;
  } catch (error) {
    console.error("Google Login Error:", error.message);
    alert("Google Login Failed: " + error.message);
    throw error;
  }
}

/**
 * Login with Facebook
 */
export async function loginWithFacebook() {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;
    await saveUserDataToFirestore(user.uid, user.email);
    alert(`👋 Welcome, ${user.displayName || user.email}!`);
    return user;
  } catch (error) {
    console.error("Facebook Login Error:", error.message);
    alert("Facebook Login Failed: " + error.message);
    throw error;
  }
}

// ... (Maintain existing functions: registerUser, loginUser, logoutUser, getBooksFromDB here) ...

export async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await saveUserDataToFirestore(userCredential.user.uid, email); 
    alert("✅ Registration successful! You are now logged in.");
    return userCredential;
  } catch (error) {
    console.error("Registration Error:", error.message);
    alert("Registration Failed: " + error.message);
    throw error;
  }
}

export async function loginUser(email, password) { 
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    alert("👋 Welcome back! Login successful.");
    return userCredential;
  } catch (error) {
    console.error("Login Error:", error.message);
    alert("Login Failed: " + error.message);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    alert("Logged out successfully.");
  } catch (error) {
    console.error("Logout Error:", error.message);
    alert("Logout Failed: " + error.message);
  }
}

export async function getBooksFromDB() {
  try {
    const booksCollection = collection(db, "books");
    const bookSnapshot = await getDocs(booksCollection);
    return bookSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching books:", error.message);
    return [];
  }
}

// Dapat nasa dulo ito ng iyong firebase.js file:
export { auth, db };