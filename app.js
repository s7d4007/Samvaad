// --- STEP 1: INITIALIZE SUPABASE ---
const { createClient } = supabase;
// The variables SUPABASE_URL and SUPABASE_ANON_KEY are available from the config.js file
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('SupABASE is connected!', db);

//Global Variable Declarations
let currentUserId = null; // Will hold the user's ID when logged in
let selectedChatId = null; // This will store the ID of the active chat
let isSessionReady = false; // This flag will prevent the double-load

// --- STEP 2: GET DOM ELEMENTS ---
const authOverlay = document.getElementById('auth-overlay');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupBtn = document.getElementById('show-signup-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const chatApp = document.querySelector('.chat-app');

// Auth password toggle elements
const loginPasswordInput = document.getElementById('login-password');
const signupPasswordInput = document.getElementById('signup-password');
const toggleLoginPasswordBtn = document.getElementById('toggle-login-password');
const toggleSignupPasswordBtn = document.getElementById('toggle-signup-password');

// User info display
const userEmailDisplay = document.getElementById('user-email-display');

// New Chat Modal elements
const newChatBtn = document.getElementById('new-chat-btn');
const newChatModal = document.getElementById('new-chat-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelNewChatBtn = document.getElementById('cancel-new-chat-btn');
const newChatForm = document.getElementById('new-chat-form');
const newChatError = document.getElementById('new-chat-error');

// Logout Modal elements
const signOutBtn = document.getElementById('sign-out-btn');
const confirmLogoutModal = document.getElementById('confirm-logout-modal');
const closeLogoutModalBtn = document.getElementById('close-logout-modal-btn');
const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
const confirmLogoutBtn = document.getElementById('confirm-logout-btn');

const contactsList = document.getElementById('contacts-list');
const chatPlaceholder = document.getElementById('chat-placeholder');
const chatWindow = document.getElementById('chat-window');
const chatHeaderName = document.getElementById('chat-header-name');
const chatHeaderAvatar = document.getElementById('chat-header-avatar');

//Message Area elements
const messagesArea = document.getElementById('messages-area');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

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

// --- START: CHAT SELECTION LOGIC ---
contactsList.addEventListener('click', (e) => {
    // Find the <li> element that was clicked on
    // e.target is whatever the user *actually* clicked (like the <strong> or the <span>)
    // .closest() finds the nearest parent with the class '.contact-item'
    const clickedLi = e.target.closest('.contact-item');

    // If the user clicked on empty space (or the 'No chats' message), do nothing
    if (!clickedLi) {
        return;
    }
    // We found the <li>! Call our new function with it.
    selectChat(clickedLi);
});
// --- END: CHAT SELECTION LOGIC ---

// NEW CHAT LIST
// This function will fetch and display the user's real chats
async function loadUserChats() {
    console.log("Loading user chats...");

    if (!contactsList) return; // Safety check if the element doesn't exist

    // This is the "whiteboard eraser"
    contactsList.innerHTML = '';

    try {
        // 1. Call the database function we created
        const { data: chats, error } = await db.rpc('get_my_chats');

        if (error) {
            console.error("Error loading chats:", error.message);
            contactsList.innerHTML = '<li class="chat-list-empty">Error loading chats.</li>';
            return;
        }

        // 2. We got the data, now let's render it
        if (chats && chats.length > 0) {

            chats.forEach(chat => {
                // Create a new <li> element
                const li = document.createElement('li');

                // Add a class for styling
                li.classList.add('contact-item');

                // Add data attributes to store info about this chat
                li.dataset.chatId = chat.chat_id;
                li.dataset.chatEmail = chat.other_user_email;

                // Set the inner HTML for the chat item
                li.innerHTML = `
                        <figure class="avatar">
                            <!-- Get the first letter of the email for the avatar -->
                            <span>${chat.other_user_email.charAt(0).toUpperCase()}</span>
                        </figure>
                        <div class="contact-info">
                            <strong>${chat.other_user_email}</strong>
                            <small>Click to open chat...</small>
                        </div>
                    `;

                // Add this new <li> to the list in the UI
                contactsList.appendChild(li);
            });

        } else {
            // Show a "No chats yet" message
            contactsList.innerHTML = '<li class="chat-list-empty">No chats yet. Click "+" to start one!</li>';
        }

    } catch (error) {
        console.error("An unexpected JS error occurred:", error.message);
        contactsList.innerHTML = '<li class="chat-list-empty">Error loading chats.</li>';
    }
}

// This function handles opening a chat and highlighting the selection
function selectChat(chatElement) {
    // 1. Get the info from the clicked <li>
    const chatId = chatElement.dataset.chatId;
    const chatEmail = chatElement.dataset.chatEmail;
    const firstLetter = chatEmail.charAt(0).toUpperCase();

    // 2. Update the global selectedChatId
    selectedChatId = chatId;
    console.log(`Selected chat: ${selectedChatId} with ${chatEmail}`);

    // 3. Handle the highlighting
    // First, find any *other* item that is currently selected and remove the class
    const currentlySelected = document.querySelector('.contact-item.selected');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected');
    }

    // Now, add the 'selected' class to the one we just clicked
    chatElement.classList.add('selected');

    // 4. Update the main chat window
    // Hide the placeholder and show the chat window
    chatPlaceholder.style.display = 'none';
    chatWindow.classList.add('active'); // This uses .active CSS

    // Update the header with the new chat's info
    chatHeaderName.textContent = chatEmail;
    chatHeaderAvatar.innerHTML = `<span>${firstLetter}</span>`;

   loadMessages(chatId);
}

async function loadMessages(chatId) {
    if (!messagesArea) return; // Safety check
    console.log(`Loading messages for chat: ${chatId}`);

    // 1. Clear old messages and show a loading state
    messagesArea.innerHTML = '<p class="chat-list-empty">Loading messages...</p>';

    try {
        // 2. Fetch messages from the database
        // We also sort them by 'created_at' to show them in order
        const { data: messages, error } = await db
            .from('messages')
            .select('*') // Get all columns
            .eq('chat_id', chatId) // For this specific chat
            .order('created_at', { ascending: true }); // Oldest first

        if (error) {
            console.error("Error loading messages:", error.message);
            messagesArea.innerHTML = '<p class="chat-list-empty">Error loading messages.</p>';
            return;
        }

        // 3. Clear the "Loading..." message
        messagesArea.innerHTML = '';

        // 4. Render the new messages
        if (messages && messages.length > 0) {
            messages.forEach(message => {
                // Check if the message was sent by the current user
                const isSent = message.sender_id === currentUserId;
                const messageClass = isSent ? 'sent' : 'received';

                // Create the message element
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', messageClass);

                // Set the inner HTML. We use <p> for the bubble.
                // (We'll add image/text logic here later)
                messageDiv.innerHTML = `<p>${message.content}</p>`;

                // Add this new <div> to the messages area
                messagesArea.appendChild(messageDiv);
            });
        } else {
            // Show a "No messages yet" message
            messagesArea.innerHTML = '<p class="chat-list-empty">No messages yet. Say hi!</p>';
        }

        // 5. Scroll to the bottom to show the latest message
        messagesArea.scrollTop = messagesArea.scrollHeight;

    } catch (error) {
        console.error("An unexpected JS error occurred:", error.message);
        messagesArea.innerHTML = '<p class="chat-list-empty">Error loading messages.</p>';
    }
}

// --- END: NEW CHAT LIST LOGIC ---

// --- STEP 4: MANAGE SESSION ---
db.auth.onAuthStateChange((event, session) => {

    if (session) {
        // --- THIS IS THE NEW CHECK ---
        // If the session is already set up, don't run all this code again
        if (isSessionReady) {
            return; 
        }
        // --- END OF NEW CHECK ---

        // User is LOGGED IN for the first time
        console.log('Auth state changed: User is IN', session.user.email);
        authOverlay.classList.add('hidden');
        document.body.classList.remove('auth-visible');
        chatApp.classList.remove('hidden');

        userEmailDisplay.textContent = session.user.email;
        currentUserId = session.user.id; 
        newChatBtn.disabled = false; // Enable the "New Chat" button

        loadUserChats(); 

        // --- SET THE FLAG ---
        isSessionReady = true; // Mark the session as ready

    } else {
        // User is LOGGED OUT
        console.log('Auth state changed: User is OUT');
        authOverlay.classList.remove('hidden');
        document.body.classList.add('auth-visible');
        chatApp.classList.add('hidden');

        currentUserId = null;
        newChatBtn.disabled = true; // Disable the button if logged out

        // --- RESET THE FLAG ---
        isSessionReady = false; // Reset the flag for the next login
    }
});