import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ⚠️ I-check at kumpirmahin na ito ang TAMA at PRIVATE na Firebase project configuration mo.
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


/**
 * Saves essential user data to the Firestore 'users' collection after registration.
 */
export async function saveUserDataToFirestore(uid, email, role = 'member') {
  try {
    const userRef = doc(db, "users", uid); 
    await setDoc(userRef, {
      email: email,
      name: email.split('@')[0], 
      role: role,
      joinedDate: new Date(),
    });
    console.log(`User ${uid} data saved to Firestore.`);
  } catch (error) {
    console.error("Error saving user data:", error.message);
  }
}

/**
 * Creates a new user account with email and password, then saves data to Firestore.
 */
export async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await saveUserDataToFirestore(userCredential.user.uid, email); 
    
    alert("✅ Registration successful! Please log in.");
    return userCredential;
  } catch (error) {
    // Mas detalyadong error handling para sa user
    console.error("Registration Error:", error.message);
    alert("Registration Failed: " + error.message);
    throw error;
  }
}

/**
 * Log in a user with email and password.
 * @param {import('firebase/auth').Auth} authInstance The Firebase Auth instance.
 */
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

/**
 * Log out the current user.
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    alert("🚪 Logged out successfully.");
  } catch (error) {
    console.error("Logout Error:", error.message);
    alert("Logout Failed: " + error.message);
  }
}

/**
 * Fetches all books from the 'books' Firestore collection.
 */
export async function getBooksFromDB() {
  try {
    const booksCollection = collection(db, "books");
    const bookSnapshot = await getDocs(booksCollection);
    const bookList = bookSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Fetched books:", bookList);
    return bookList;
  } catch (error) {
    console.error("Error fetching books:", error.message);
    return []; // Return empty array on failure
  }
}

// Export auth to check login state later
export { auth };

// Sa loob ng functions/index.js:

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize the Admin SDK once
admin.initializeApp();
const db = admin.firestore();

// Ito ang Cloud Function na tatawagin ng iyong website
exports.subscribeToNewsletter = functions.https.onRequest(async (req, res) => {
    // 1. Tiyakin na POST method ang ginamit
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const email = req.body.email;

    if (!email) {
        return res.status(400).send('Email is required.');
    }

    try {
        // 2. I-save ang email sa isang Firestore Collection (e.g., 'subscribers')
        await db.collection('subscribers').add({
            email: email,
            subscribedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // 3. Magbigay ng tagumpay na sagot pabalik sa frontend
        res.status(200).send({ message: "Subscription successful!" });
    } catch (error) {
        console.error("Error saving subscription:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});