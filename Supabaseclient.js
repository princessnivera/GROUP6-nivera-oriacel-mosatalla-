// Import Supabase directly as a module (No need for script tag in HTML)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://phbskinzzgkvuykrbtva.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYnNraW56emdrdnV5a3JidHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5Nzc2MzIsImV4cCI6MjA3OTU1MzYzMn0.PyGnK_O47hZuRqDUkbcwUETwXEvBz7d8E49AdEDOrkY';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("✅ Supabase Client Initialized");

export async function getBooksFromSupabase() {
    try {
        // Fetch all books from the 'books' table
        let { data: books, error } = await supabase
            .from('books')
            .select('*');

        if (error) {
            console.error("❌ Supabase SQL Error:", error.message);
            return [];
        }
        
        console.log("📚 Books fetched from Supabase:", books);
        return books;
    } catch (err) {
        console.error("Unexpected Error:", err);
        return [];
    }
}