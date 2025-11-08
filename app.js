// --- STEP 1: INITIALIZE SUPABASE ---
const { createClient } = supabase;
// The variables SUPABASE_URL and SUPABASE_ANON_KEY are available from the config.js file
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('SupABASE is connected!', db);

//Global Variable Declarations
let currentUserId = null; // Will hold the user's ID when logged in
let selectedChatId = null; // This will store the ID of the active chat
let isSessionReady = false; // This flag will prevent the double-load
let currentChatChannel = null; // This will hold our active chat subscription
let emailForVerification = ''; // Stores the email during OTP check

// --- STEP 2: GET DOM ELEMENTS ---
const authOverlay = document.getElementById('auth-overlay');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupBtn = document.getElementById('show-signup-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const chatApp = document.querySelector('.chat-app');
const authContainer = document.getElementById('auth-container');

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
const messageSendBtn = messageForm.querySelector('button');

//Loader Element
const fullPageLoader = document.getElementById('full-page-loader');

// OTP Modal elements
const verifyOtpModal = document.getElementById('verify-otp-modal');
const verifyOtpForm = document.getElementById('verify-otp-form');
const otpEmailDisplay = document.getElementById('otp-email-display');
const otpInput = document.getElementById('otp-input');
const otpError = document.getElementById('otp-error');
const resendOtpBtn = document.getElementById('resend-otp-btn');

//Sidebar Elements
const mainNav = document.getElementById('main-nav');
const navToggleBtn = document.getElementById('nav-toggle-btn');

// Views
const chatsView = document.getElementById('chats-view');
const profileView = document.getElementById('profile-view');
const settingsView = document.getElementById('settings-view');
const starView = document.getElementById('star-view');

//Profile Elements
const profileForm = document.getElementById('profile-form');
const profileDisplayNameInput = document.getElementById('profile-display-name');
const profileEmailInput = document.getElementById('profile-email');
const profileSaveSuccess = document.getElementById('profile-save-success');

// --- STEP 3: HANDLE AUTH LOGIC ---

// --- START:  Sliding Panel Toggle Logic ---
showLoginBtn.addEventListener('click', () => {
    authContainer.classList.add('right-panel-active');

    // Clear the other form
    signupForm.reset();
    signupError.textContent = '';
    signupError.style.display = 'none';
});

showSignupBtn.addEventListener('click', () => {
    authContainer.classList.remove('right-panel-active');

    // Clear the other form
    loginForm.reset();
    loginError.textContent = '';
    loginError.style.display = 'none';
});
// --- END: Sliding Panel Toggle Logic ---

// Sidebar Navigation Toggle

navToggleBtn.addEventListener('click', () => {
    mainNav.classList.toggle('nav-expanded');
});

// Handle highlighting the active nav item
mainNav.addEventListener('click', (e) => {
    // Find the button that was clicked
    const clickedButton = e.target.closest('button');

    // If the user didn't click a button, or clicked the toggle/logout, do nothing
    if (!clickedButton || clickedButton.id === 'nav-toggle-btn' || clickedButton.id === 'sign-out-btn') {
        return;
    }

    // Find the parent <li>
    const clickedLi = clickedButton.parentElement;

    // 1. Find the *currently* active <li>
    const currentActive = mainNav.querySelector('li.active');
    if (currentActive) {
        currentActive.classList.remove('active');
    }

    // 2. Add the 'active' class to the <li> we just clicked
    clickedLi.classList.add('active');

    // 3. Get the view name from the button's 'data-view' attribute
    const view = clickedButton.dataset.view;
    if (view) {
        // If the user is clicking "Profile", load their data first
        if (view === 'profile') {
            loadUserProfile();
        }
        showView(view + '-view');
        console.log(`Switched to view: ${view}`);
    }
});

// --- START: View Switching Logic ---

function showView(viewId) {
    // 1. Find the currently active view (the one with the class)
    const currentView = document.querySelector('.main-view.view-active');
    if (currentView) {
        // Remove the class to make it fade out
        currentView.classList.remove('view-active');
    }

    // 2. Find the new view I want to show
    const viewToShow = document.getElementById(viewId);
    if (viewToShow) {
        // Add the class to make it fade in
        viewToShow.classList.add('view-active');
    } else {
        console.error(`View not found: ${viewId}`);
        // Fallback: show the chats view if something went wrong
        chatsView.classList.add('view-active');
    }
}

// --- END: View Switching Logic ---

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

// Handle Sign Up (NEW v2 - With OTP)
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    // Clear any old errors
    signupError.textContent = '';
    signupError.style.display = 'block';

    // 1. Sign up the user (this will send the OTP email)
    const { data, error: authError } = await db.auth.signUp({
        email,
        password
    });

    if (authError) {
        signupError.textContent = authError.message;
        signupError.style.display = 'block';
        console.error('Signup Error:', authError.message);
        return;
    }

    // 2. Check if the user was created successfully
    // We now expect data.user to exist, but data.session to be null
    if (data.user) {
        console.log('User created, awaiting verification:', data.user.email);

        // 3. Store the email for the next step
        emailForVerification = data.user.email;

        // 4. Update the OTP modal to show the email
        otpEmailDisplay.textContent = data.user.email;

        // 5. Hide the login/signup overlay
        authOverlay.classList.add('hidden');
        document.body.classList.remove('auth-visible');

        // 6. Show the NEW OTP verification modal
        verifyOtpModal.classList.add('show');
        otpInput.focus(); // Focus the input field

    } else {
        // This is a fallback, should not happen if authError is null
        signupError.textContent = 'An unknown error occurred. Please try again.';
        signupError.style.display = 'block';
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

// Handle the form submission
newChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    //Checking if the user is logged in?
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

    //Checking if the user is trying to chat with themselves or empty input
    if (emailToChat === loggedInUserEmail) {
        newChatError.textContent = "You can't start a chat with yourself.";
        newChatError.style.display = 'block';
        return; // Stop the function
    }

    //Had the user typed an email? 
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
            // Close the modal
            closeNewChatModal();
            //Manually refresh the chat list
            await loadUserChats();
            // Find the new chat in the list and select it
            const newChatElement = document.querySelector(`.contact-item[data-chat-id="${newChatId}"]`);
            if (newChatElement) {
                selectChat(newChatElement);
            }
        }

    } catch (error) {
        console.error('An unexpected JS error occurred:', error.message);
        newChatError.textContent = 'An unexpected error occurred.';
        newChatError.style.display = 'block';
    }
});
// --- END: CHAT MODAL LOGIC ---

// --- START: Profile Page Logic ---

async function loadUserProfile() {
    if (!currentUserId) return; // Safety check

    // 1. Fetch the user's profile from the database
    try {
        const { data, error } = await db
            .from('profiles')
            .select('email, display_name') // Get only the columns we need
            .eq('id', currentUserId)      // For the currently logged-in user
            .single(); // We only expect one row

        if (error) {
            console.error("Error loading user profile:", error.message);
            return;
        }

        if (data) {
            // 2. Fill in the form fields with the data
            profileEmailInput.value = data.email;

            // Use the display_name if it exists, otherwise show an empty string
            profileDisplayNameInput.value = data.display_name || '';
        }

    } catch (error) {
        console.error("An unexpected JS error occurred:", error.message);
    }
}

// Handle the "Save Changes" button click
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop the page from reloading
    if (!currentUserId) return;

    // Get the new name from the input
    const newDisplayName = profileDisplayNameInput.value.trim();

    try {
        // 1. Update the 'display_name' in the 'profiles' table
        const { error } = await db
            .from('profiles')
            .update({ display_name: newDisplayName }) // Update with the new name
            .eq('id', currentUserId); // Where the ID matches the current user

        if (error) {
            console.error("Error saving profile:", error.message);
            // Show a real error message to the user
        } else {
            console.log("Profile saved successfully!");

            // 2. Show the "Saved!" success message
            profileSaveSuccess.style.display = 'flex'; // Show the message

            // 3. Hide the message again after 2 seconds
            setTimeout(() => {
                profileSaveSuccess.style.display = 'none';
            }, 2000);

            loadUserChats();
        }

    } catch (error) {
        console.error("An unexpected JS error occurred:", error.message);
    }
});

// --- END: Profile Page Logic ---

// --- START: OTP VERIFICATION LOGIC ---

verifyOtpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = otpInput.value;

    // Clear any old errors
    otpError.textContent = '';
    otpError.style.display = 'none';

    if (!emailForVerification || !token) {
        otpError.textContent = 'Email or token is missing. Please try again.';
        otpError.style.display = 'block';
        return;
    }

    try {
        // 1. Verify the 6-digit code
        const { data, error: verifyError } = await db.auth.verifyOtp({
            email: emailForVerification,
            token: token,
            type: 'signup'
        });

        if (verifyError) {
            console.error('OTP Verify Error:', verifyError.message);
            otpError.textContent = 'Invalid or expired code. Please try again.';
            otpError.style.display = 'block';
            return;
        }

        // 2. SUCCESS! The user is now logged in.
        //    data.user and data.session are now available.
        // Create the user profile in the database
        console.log('OTP Verified! User is logged in:', data.user.email);

        const { error: profileError } = await db.from('profiles').insert({
            id: data.user.id,
            email: data.user.email
        });

        if (profileError) {
            // User is logged in but has no profile
            // Handle the error gracefully
            console.error('Profile Creation Error after OTP:', profileError.message);
            otpError.textContent = 'Login successful, but profile creation failed. Please contact support.';
            otpError.style.display = 'block';
            return;
        }

        // 3. FULL SUCCESS!
        // The user is logged in AND their profile is created.
        // Just Hide the modal
        console.log('Profile created successfully.');
        verifyOtpModal.classList.remove('show');
        emailForVerification = ''; // Clear the temp email

        // The main 'onAuthStateChange' listener will
        // automatically take over from here and load the app!

    } catch (error) {
        console.error('An unexpected error occurred:', error.message);
        otpError.textContent = 'An unexpected error occurred. Please try again.';
        otpError.style.display = 'block';
    }
});

// Handle "Resend Code"
resendOtpBtn.addEventListener('click', async () => {
    if (!emailForVerification) {
        otpError.textContent = 'Could not find email. Please refresh and sign up again.';
        otpError.style.display = 'block';
        return;
    }

    // This will resend the OTP email
    const { error } = await db.auth.resend({
        type: 'signup',
        email: emailForVerification
    });

    if (error) {
        console.error('Resend Error:', error.message);
        otpError.textContent = error.message;
        otpError.style.display = 'block';
    } else {
        console.log('Resent OTP email to:', emailForVerification);
        otpError.textContent = 'A new code has been sent to your email.';
        otpError.style.display = 'block';
    }
});
// --- END: NEW OTP VERIFICATION LOGIC ---

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
    // Found the <li>! Call our new function with it.
    selectChat(clickedLi);
});
// --- END: CHAT SELECTION LOGIC ---

// --- START: SEND MESSAGE LOGIC ---
messageForm.addEventListener('submit', async (e) => {
    // 1. Prevent the page from reloading!
    e.preventDefault();
    // 2. Get the message text
    const messageText = messageInput.value.trim();
    // 3. Check if it's empty or if no chat is selected
    if (!messageText || !selectedChatId || !currentUserId) {
        console.log("Cannot send message: no text, chat, or user.");
        return; // Do nothing
    }
    console.log(`Sending message to chat ${selectedChatId}: ${messageText}`);

    try {
        // 4. Send the message to the database
        const { error } = await db
            .from('messages')
            .insert({
                chat_id: selectedChatId,
                sender_id: currentUserId,
                content: messageText,
                message_type: 'text' // For now, all messages are 'text'
            });

        if (error) {
            console.error("Error sending message:", error.message);
            // Show an error in the UI
        } else {
            // 5. Success! Clear the input field
            messageInput.value = '';
        }

    } catch (error) {
        console.error("An unexpected JS error occurred:", error.message);
    }
});
// --- END: SEND MESSAGE LOGIC ---

// HELPER FUNCTION

// This function just creates the HTML for a single message
function displayMessage(message) {
    if (!messagesArea) return; // Safety check

    // Check if we're at the bottom before adding the new message
    const shouldScroll = messagesArea.scrollTop + messagesArea.clientHeight === messagesArea.scrollHeight;

    // Check if this is a "No messages" placeholder
    const placeholder = messagesArea.querySelector('.chat-list-empty');
    if (placeholder) {
        placeholder.remove(); // Remove "No messages yet"
    }

    // Check if the message was sent by the current user
    const isSent = message.sender_id === currentUserId;
    const messageClass = isSent ? 'sent' : 'received';

    // Create the message element
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', messageClass);

    // Set the inner HTML. We use <p> for the bubble.
    messageDiv.innerHTML = `<p>${message.content}</p>`;

    // Add this new <div> to the messages area
    messagesArea.appendChild(messageDiv);

    // Scroll to the bottom only if we were already at the bottom
    if (shouldScroll) {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
}

// NEW CHAT LIST LOGIC
// This function will fetch and display the user's real chats
async function loadUserChats() {
    console.log("Loading user chats...");

    if (!contactsList) return; // Safety check for the contacts list element

    // Clear the list to prevent duplicates when this function is called multiple times
    contactsList.innerHTML = '';

    try {
        // Call the database RPC function to get all chats for the current user
        const { data: chats, error } = await db.rpc('get_my_chats');

        if (error) {
            console.error("Error loading chats:", error.message);
            contactsList.innerHTML = '<li class="chat-list-empty">Error loading chats.</li>';
            return;
        }

        // Render the chat items if any exist
        if (chats && chats.length > 0) {

            chats.forEach(chat => {
                const li = document.createElement('li');
                li.classList.add('contact-item');

                // Store chat metadata on the element for click event handlers
                li.dataset.chatId = chat.chat_id;
                li.dataset.chatEmail = chat.other_user_email;

                // Default to the user's email if a display_name is not available
                const displayName = chat.other_user_display_name || chat.other_user_email;
                const firstLetter = displayName.charAt(0).toUpperCase();

                // Set the inner HTML for the chat list item
                li.innerHTML = `
                    <figure class="avatar">
                        <span>${firstLetter}</span>
                    </figure>
                    <div class="contact-info">
                        <strong>${displayName}</strong>
                        <small>Click to open chat...</small>
                    </div>
                `;

                contactsList.appendChild(li);
            });

        } else {
            // Handle the empty state if no chats are found
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
    subscribeToChat(chatId);
}

//Loading Messages into the chat window

async function loadMessages(chatId) {
    if (!messagesArea) return; // Safety check
    console.log(`Loading messages for chat: ${chatId}`);

    // 1. Clear old messages and show a loading state
    messagesArea.innerHTML = '<p class="chat-list-empty">Loading messages...</p>';

    try {
        // 2. Fetch messages from the database
        const { data: messages, error } = await db
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error loading messages:", error.message);
            messagesArea.innerHTML = '<p class="chat-list-empty">Error loading messages.</p>';
            return;
        }

        // 3. Clear the "Loading..." message
        messagesArea.innerHTML = '';

        // 4. Render the new messages
        if (messages && messages.length > 0) {

            // --- THIS IS THE UPDATED PART ---
            // We just loop and call our new helper
            messages.forEach(message => {
                displayMessage(message);
            });
            // --- END OF UPDATED PART ---

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

//Realtime Function

function subscribeToChat(chatId) {
    // 1. Unsubscribe from any old chat channel
    if (currentChatChannel) {
        console.log(`Unsubscribing from old chat: ${currentChatChannel.topic}`);
        db.removeChannel(currentChatChannel);
        currentChatChannel = null;
    }

    // 2. Create a new "channel" to listen to
    // Listen for any INSERTS on the 'messages' table
    // where the 'chat_id' matches our current chat.
    const channel = db.channel(`chat:${chatId}`);

    currentChatChannel = channel.on(
        'postgres_changes', // This is the event type
        {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
            // 3. A new message has arrived!
            console.log('New message received!', payload.new);

            // 4. Use helper function to display it!
            // Pass payload.new, which is the new message object
            displayMessage(payload.new);
        }
    )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`Successfully subscribed to chat: ${chatId}`);
            } else {
                console.log(`Failed to subscribe to chat: ${chatId}. Status: ${status}`);
            }
        });
}
// --- END OF REALTIME FUNCTION ---
// --- END: NEW CHAT LIST LOGIC ---

// --- STEP 4: MANAGE SESSION ---
db.auth.onAuthStateChange(async(event, session) => {

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
        messageInput.disabled = false;
        messageSendBtn.disabled = false;
        loadUserChats();
        fullPageLoader.classList.add('hidden'); // Hide the loader
        isSessionReady = true; // Mark the session as ready
    } else {
        // User is LOGGED OUT
        console.log('Auth state changed: User is OUT');
        authOverlay.classList.remove('hidden');
        document.body.classList.add('auth-visible');
        fullPageLoader.classList.add('hidden'); // Hide the loader
        chatApp.classList.add('hidden');

        currentUserId = null;
        newChatBtn.disabled = true; // Disable the button if logged out
        messageInput.disabled = true;
        messageSendBtn.disabled = true;
        // --- RESET THE FLAG ---
        isSessionReady = false; // Reset the flag for the next login
    }
});