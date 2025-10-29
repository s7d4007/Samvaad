// --- STEP 1: INITIALIZE SUPABASE ---
const { createClient } = supabase;
// The variables SUPABASE_URL and SUPABASE_ANON_KEY
// are available from the config.js file
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('SupABASE is connected!', db);

let currentUserId = null; // Will hold the user's ID when logged in

// --- STEP 2: GET DOM ELEMENTS ---
// Auth Elements
const authOverlay = document.getElementById('auth-overlay');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupBtn = document.getElementById('show-signup-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');

// Password Toggle Elements
const loginPasswordInput = document.getElementById('login-password');
const signupPasswordInput = document.getElementById('signup-password');
const toggleLoginPasswordBtn = document.getElementById('toggle-login-password');
const toggleSignupPasswordBtn = document.getElementById('toggle-signup-password');

// Main App Elements
const chatApp = document.querySelector('.chat-app');
const userEmailDisplay = document.getElementById('user-email-display');
const signOutBtn = document.getElementById('sign-out-btn');
const contactsList = document.getElementById('contacts-list'); // The <ul> we'll use later

// New Chat Modal Elements
const newChatBtn = document.getElementById('new-chat-btn');
const newChatModal = document.getElementById('new-chat-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelNewChatBtn = document.getElementById('cancel-new-chat-btn');
const newChatForm = document.getElementById('new-chat-form');
const newChatError = document.getElementById('new-chat-error');

// Logout Modal Elements
const confirmLogoutModal = document.getElementById('confirm-logout-modal');
const closeLogoutModalBtn = document.getElementById('close-logout-modal-btn');
const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
const confirmLogoutBtn = document.getElementById('confirm-logout-btn');


// --- STEP 3: HANDLE AUTH LOGIC ---

// Toggle between login and signup forms
showSignupBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
});

showLoginBtn.addEventListener('click', () => {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
});

// Helper function to toggle password visibility
const togglePassword = (input, button) => {
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = '<i class="fas fa-eye-slash"></i>'; // Use Font Awesome
    } else {
        input.type = 'password';
        button.innerHTML = '<i class="fas fa-eye"></i>'; // Use Font Awesome
    }
};

// Add click listeners for both password toggle buttons
toggleLoginPasswordBtn.addEventListener('click', () => {
    togglePassword(loginPasswordInput, toggleLoginPasswordBtn);
});

toggleSignupPasswordBtn.addEventListener('click', () => {
    togglePassword(signupPasswordInput, toggleSignupPasswordBtn);
});

// Handle Sign Up
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const { data: authData, error: authError } = await db.auth.signUp({ email, password });
    
    if (authError) {
        signupError.textContent = authError.message;
        signupError.style.display = 'block';
        console.error('Signup Error:', authError.message);
        return;
    }

    const { error: profileError } = await db.from('profiles').insert({ 
        id: authData.user.id, 
        email: email 
    });

    if (profileError) {
        signupError.textContent = 'Failed to create profile: ' + profileError.message;
        signupError.style.display = 'block';
        console.error('Profile Error:', profileError.message);
    } else {
        console.log('User signed up and profile created!');
    }
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await db.auth.signInWithPassword({ email, password });
    
    if (error) {
        loginError.textContent = error.message;
        loginError.style.display = 'block';
        console.error('Login Error:', error.message);
    } else {
        console.log('User logged in:', data.user.email);
    }
});

// Handle Sign Out
signOutBtn.addEventListener('click', () => {
    // Now, instead of logging out, just open the modal
    openLogoutModal();
});


// --- START: NEW CHAT MODAL LOGIC ---
function openNewChatModal() {
    newChatModal.classList.add('show');
    newChatError.textContent = '';
    newChatError.style.display = 'none';
    newChatForm.reset();
}
function closeNewChatModal() {
    newChatModal.classList.remove('show');
}
newChatBtn.addEventListener('click', () => {
    openNewChatModal();
});
closeModalBtn.addEventListener('click', () => {
    closeNewChatModal();
});
cancelNewChatBtn.addEventListener('click', () => {
    closeNewChatModal();
});

// Handle the form submission (NEW - v2)
newChatForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    // Safety check: is the user logged in?
    if (!currentUserId) {
        console.error('User is not logged in or session is not ready.');
        newChatError.textContent = "Error: Not logged in. Please wait or refresh.";
        newChatError.style.display = 'block';
        return;
    }

    // Get the email from the form
    const emailToChat = document.getElementById('new-chat-email').value;
    const loggedInUserEmail = userEmailDisplay.textContent; 

    // Clear any previous errors
    newChatError.textContent = '';
    newChatError.style.display = 'none';

    // Check 1: Is the user trying to chat with themselves?
    if (emailToChat === loggedInUserEmail) {
        newChatError.textContent = "You can't start a chat with yourself.";
        newChatError.style.display = 'block';
        return; // Stop the function
    }

    // Check 2: Did the user type anything?
    if (!emailToChat) {
        newChatError.textContent = "Please enter an email address.";
        newChatError.style.display = 'block';
        return; // Stop the function
    }
    
    // --- START: NEW, SIMPLIFIED LOGIC ---
    try {
        const { data: newChatId, error } = await db.rpc('create_new_chat', { 
            target_user_email: emailToChat 
        });

        if (error) {
            console.error('Error creating chat:', error.message);
            newChatError.textContent = error.message; 
            newChatError.style.display = 'block';
        } else {
            console.log('Successfully created chat! New Chat ID:', newChatId);
            closeNewChatModal();
            // await loadUserChats(currentUserId);
            // selectChat(newChatId, emailToChat); 
        }

    } catch (error) {
        console.error('An unexpected JS error occurred:', error.message);
        newChatError.textContent = 'An unexpected error occurred.';
        newChatError.style.display = 'block';
    }
    // --- END: NEW, SIMPLIFIED LOGIC ---
});
// --- END: NEW CHAT MODAL LOGIC ---


// --- START: LOGOUT CONFIRM LOGIC ---
function openLogoutModal() {
    confirmLogoutModal.classList.add('show');
}
function closeLogoutModal() {
    confirmLogoutModal.classList.remove('show');
}
closeLogoutModalBtn.addEventListener('click', () => {
    closeLogoutModal();
});
cancelLogoutBtn.addEventListener('click', () => {
    closeLogoutModal();
});
confirmLogoutBtn.addEventListener('click', async () => {
    console.log('Signing out...');
    const { error } = await db.auth.signOut();
    
    if (error) {
        console.error('Error signing out:', error.message);
    } else {
        console.log('User signed out successfully.');
    }
    
    closeLogoutModal();
});
// --- END: LOGOUT CONFIRM LOGIC ---


// --- STEP 4: MANAGE SESSION ---
db.auth.onAuthStateChange((event, session) => {
    if (session) {
        // User is LOGGED IN
        console.log('Auth state changed: User is IN', session.user.email);
        authOverlay.classList.add('hidden');
        document.body.classList.remove('auth-visible');
        chatApp.classList.remove('hidden');

        userEmailDisplay.textContent = session.user.email;
        currentUserId = session.user.id; 
        newChatBtn.disabled = false; // Enable the "New Chat" button
        
        // loadUserChats(currentUserId); 

    } else {
        // User is LOGGED OUT
        console.log('Auth state changed: User is OUT');
        authOverlay.classList.remove('hidden');
        document.body.classList.add('auth-visible');
        chatApp.classList.add('hidden');
        
        currentUserId = null;
        newChatBtn.disabled = true; // Disable the button if logged out
    }
});
