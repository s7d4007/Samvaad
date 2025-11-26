// --- STEP 1: INITIALIZE SUPABASE ---
const { createClient } = supabase;
// The variables SUPABASE_URL and SUPABASE_ANON_KEY are available from the config.js file
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('SupABASE is connected!', db);
// --- START: THEME LOADER ---
// This runs immediately when the script loads
(function() {
    // Check localStorage for a saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        // If 'light' is saved, apply the class to the body
        document.body.classList.add('light-theme');
        document.addEventListener('DOMContentLoaded', () => {
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.checked = true;
            }
        });
    }
})();
// --- END: THEME LOADER ---

// --- START: WALLPAPER LOADER ---
(function() {
    const savedWallpaper = localStorage.getItem('chat_wallpaper');
    // Can't access DOM elements like 'messagesArea' efficiently here 
    // because the DOM might not be ready, So handle the applying
    // inside the main DOMContentLoaded or later in the script.
    // However, checking if it exists allows to set state early if needed.
})();
// --- END: WALLPAPER LOADER ---

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

// Star Elements
const starViewContent = document.getElementById('star-view-content');

//Theme Elements
const themeToggle = document.getElementById('theme-toggle');

//More-Options
const dropdownToggle = document.querySelector('.dropdown-toggle');
const dropdownMenu = document.querySelector('.dropdown-menu');
const exportChatBtn = document.getElementById('export-chat-btn');

//Upload Button
const attachmentBtn = document.getElementById('attachment-btn');
const iconClip = document.getElementById('icon-clip');
const iconCross = document.getElementById('icon-cross');
const attachmentMenu = document.getElementById('attachment-menu');
const uploadFileBtn = document.getElementById('upload-file-btn');
const fileInput = document.getElementById('file-input');
const filePreviewName = document.getElementById('file-preview-name');

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
        // Check which view is being opened
        if (view === 'profile') {
            // Load profile data when profile is clicked
            loadUserProfile();
        } else if (view === 'star') {
            // Load starred messages when star is clicked
            loadStarredMessages();
        }
        showView(view + '-view');
        console.log(`Switched to view: ${view}`);
    }
});

// --- START: Theme Toggle Logic ---
themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        // If the toggle is "on", add the light-theme class
        document.body.classList.add('light-theme');
        // Save the choice to localStorage
        localStorage.setItem('theme', 'light');
    } else {
        // If the toggle is "off", remove the light-theme class
        document.body.classList.remove('light-theme');
        // Save the choice to localStorage
        localStorage.setItem('theme', 'dark');
    }
});
// --- END: Theme Toggle Logic ---

// --- START: View Switching Logic ---

function showView(viewId) {
    // 1. Find the currently active view (the one with the class)
    const currentView = document.querySelector('.main-view.view-active');
    if (currentView) {
        // Remove the class to make it fade out
        currentView.classList.remove('view-active');
    }

    // 2. Find the new view to show
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
        button.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        button.innerHTML = '<i class="fas fa-eye"></i>';
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

// --- START: Starred Messages Logic ---

async function loadStarredMessages() {
    if (!starViewContent || !currentUserId) return; // Safety checks

    // 1. Show a loading state
    starViewContent.innerHTML = '<p class="chat-list-empty">Loading starred messages...</p>';

    try {
        // 2. This is a 2-step query:
        // First, get all chat IDs the user is a part of
        const { data: chats, error: chatsError } = await db
            .from('chat_participants')
            .select('chat_id')
            .eq('user_id', currentUserId);

        if (chatsError) {
            console.error("Error fetching user's chats:", chatsError.message);
            starViewContent.innerHTML = '<p class="chat-list-empty">Error loading messages.</p>';
            return;
        }

        // 3. Extract just the IDs into an array
        const chatIds = chats.map(c => c.chat_id);

        // 4. Now, find all messages in *those chats* that are starred
        const { data: messages, error: messagesError } = await db
            .from('messages')
            .select('*') // Get all message data
            .in('chat_id', chatIds) // Where the chat_id is in our list
            .eq('is_starred', true) // And the message is starred
            .order('created_at', { ascending: false }); // Show newest first

        if (messagesError) {
            console.error("Error fetching starred messages:", messagesError.message);
            starViewContent.innerHTML = '<p class="chat-list-empty">Error loading messages.</p>';
            return;
        }

        // 5. Render the messages
        if (messages && messages.length > 0) {
            starViewContent.innerHTML = ''; // Clear "Loading..."

            messages.forEach(message => {

                // Check if the message was sent by the current user
                const isSent = message.sender_id === currentUserId;
                const messageClass = isSent ? 'sent' : 'received';

                // Create the message element
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', messageClass);
                messageDiv.dataset.messageId = message.id; // Add this for consistency

                // Set the inner HTML.
                messageDiv.innerHTML = `<p>${message.content}</p>`;
                // Add this new <div> to the *star view*
                starViewContent.appendChild(messageDiv);
            });

        } else {
            // Show the "No Starred Messages" message
            starViewContent.innerHTML = '<p class="chat-list-empty">No starred messages.</p>';
        }

    } catch (error) {
        console.error("An unexpected JS error occurred:", error.message);
        starViewContent.innerHTML = '<p class="chat-list-empty">An error occurred.</p>';
    }
}

// --- END: Starred Messages Logic ---

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

// --- START: UPLOAD ATTACHMENT LOGIC ---

async function sendAttachment() {
    if (!selectedChatId || !currentUserId || !fileInput.files || fileInput.files.length === 0) {
        console.error("Attachment failed: No file or chat selected.");
        return;
    }

    const file = fileInput.files[0];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Create a unique path (user_id/chat_id/timestamp_filename)
    const filePath = `${currentUserId}/${selectedChatId}/${Date.now()}_${file.name}`;
    
    // Determine message type for display later
    let messageType = 'file';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension)) {
        messageType = 'image';
    }

    try {
        // 1. Upload the file to Supabase Storage
        console.log(`Uploading file: ${filePath}`);
        
        // This call requires the INSERT RLS policy we set up earlier
        const { data: uploadData, error: uploadError } = await db.storage
            .from('chat_media')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error("Storage Upload Error:", uploadError.message);
            return;
        }
        
        // 2. Get the public URL for the file
        const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/chat_media/${filePath}`;
        
        // 3. Insert the message row with the file's URL
        const { error: insertError } = await db
            .from('messages')
            .insert({
                chat_id: selectedChatId,
                sender_id: currentUserId,
                content: fileUrl, // The content is the URL
                message_type: messageType // 'image' or 'file'
            });

        if (insertError) {
            console.error("Database Insert Error:", insertError.message);
            // If the insert fails, you might want to delete the file from storage!
            return;
        }

        console.log(`Attachment sent successfully as type: ${messageType}`);
        
    } catch (error) {
        console.error("General Upload Error:", error.message);
    } finally {
        // 4. Clean up the UI, regardless of success or failure
        closeAttachmentMenu();
    }
}

// --- END: UPLOAD ATTACHMENT LOGIC ---

// --- START: SEND MESSAGE LOGIC ---
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check if a file is attached (the new logic)
    if (fileInput.files && fileInput.files.length > 0) {
        // If a file is selected, upload it and return.
        await sendAttachment();
        return;
    }
    
    // Standard Text Message Logic (Rest of the original function)
    const messageText = messageInput.value.trim();
    if (!messageText || !selectedChatId || !currentUserId) {
        return; 
    }

    try {
        const { error } = await db
            .from('messages')
            .insert({
                chat_id: selectedChatId,
                sender_id: currentUserId,
                content: messageText,
                message_type: 'text' 
            });

        if (error) {
            console.error("Error sending message:", error.message);
        } else {
            messageInput.value = '';
        }
    } catch (error) {
        console.error("An unexpected JS error occurred:", error.message);
    }
});
// --- END: SEND MESSAGE LOGIC ---

// --- START: STAR MESSAGE LOGIC ---

// This one listener will handle all clicks on star buttons
messagesArea.addEventListener('click', async (e) => {
    // 1. Check if a star button was clicked
    const starButton = e.target.closest('.star-btn');
    if (!starButton) {
        return; // The user clicked something else
    }

    // 2. Get the icon and the message ID
    const icon = starButton.querySelector('i');
    const messageDiv = starButton.closest('.message');
    const messageId = messageDiv.dataset.messageId;

    // 3. Get the *current* state (is it starred or not?)
    const isStarred = starButton.classList.contains('is-starred');
    const newState = !isStarred; // The new state will be the opposite

    // 4. Run the animation!
    // We only run the "pop" animation when starring (not un-starring)
    if (newState === true) {
        icon.classList.add('star-animation');

        // Clean up the class after the animation finishes
        icon.addEventListener('animationend', () => {
            icon.classList.remove('star-animation');
        }, { once: true }); // {once: true} is important
    }

    // 5. Update the UI *instantly*
    starButton.classList.toggle('is-starred', newState);
    icon.classList.toggle('fas', newState); // Solid star
    icon.classList.toggle('far', !newState); // Outline star

    // 6. Update the database in the background
    try {
        const { error } = await db
            .from('messages')
            .update({ is_starred: newState })
            .eq('id', messageId);

        if (error) {
            console.error("Error updating star:", error.message);
            // Revert the UI if the database update failed
            starButton.classList.toggle('is-starred', isStarred);
            icon.classList.toggle('fas', isStarred);
            icon.classList.toggle('far', !isStarred);
        } else {
            console.log(`Message ${messageId} star status: ${newState}`);
        }
    } catch (error) {
        console.error("An unexpected JS error occurred:", error.message);
    }
});
// --- END: STAR MESSAGE LOGIC ---

// --- START: DELETE MESSAGE LOGIC ---

// 1. Get Elements
const confirmDeleteModal = document.getElementById('confirm-delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
let messageToDeleteId = null; // Variable to store the ID temporarily

// 2. Listen for clicks on the Trash Icon (Opens Modal)
messagesArea.addEventListener('click', (e) => {
    // Check if the Delete button was clicked
    const deleteBtn = e.target.closest('.delete-btn');
    if (!deleteBtn) return;

    // Get the Message ID
    const messageDiv = deleteBtn.closest('.message');
    messageToDeleteId = messageDiv.dataset.messageId;

    // Show the custom modal (instead of window.confirm)
    confirmDeleteModal.classList.add('show');
});

// 3. Handle "Cancel"
cancelDeleteBtn.addEventListener('click', () => {
    confirmDeleteModal.classList.remove('show');
    messageToDeleteId = null; // Clear the stored ID
});

// 4. Handle "Delete It" (Performs the Action)
confirmDeleteBtn.addEventListener('click', async () => {
    if (!messageToDeleteId) return;

    try {
        // Delete from Supabase
        const { error } = await db
            .from('messages')
            .delete()
            .eq('id', messageToDeleteId);

        if (error) {
            console.error("Error deleting message:", error.message);
            // Close confirm modal
            confirmDeleteModal.classList.remove('show');
            // Show our custom error alert from the previous step!
            showCustomAlert("Error", "Could not delete this message. Please try again.");
        } else {
            console.log("Message deleted successfully");
            // Success! Close the modal.
            // (The Realtime Subscription will handle removing it from the screen)
            confirmDeleteModal.classList.remove('show');
        }

    } catch (err) {
        console.error("Unexpected error:", err);
        confirmDeleteModal.classList.remove('show');
        showCustomAlert("Error", "An unexpected error occurred.");
    } finally {
        messageToDeleteId = null; // Reset
    }
});

// --- END: DELETE MESSAGE LOGIC ---

// --- START: Chat Header Dropdown Logic ---

async function exportChat() {
    if (!selectedChatId) {
        console.error("No chat selected to export.");
        return;
    }

    console.log(`Exporting chat: ${selectedChatId}`);

    try {
        // 1. Fetch all messages for the current chat
        const { data: messages, error } = await db
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('chat_id', selectedChatId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching messages for export:", error.message);
            return;
        }

        // 2. Format the chat data into a text string
        const chatHeader = `Chat Export\nChat ID: ${selectedChatId}\nExported on: ${new Date().toLocaleString()}\n\n---\n\n`;

        const chatContent = messages.map(msg => {
            const prefix = msg.sender_id === currentUserId ? "You" : "Them";
            const timestamp = new Date(msg.created_at).toLocaleString();
            return `[${timestamp}] ${prefix}: ${msg.content}`;
        }).join('\n'); // Add a new line for each message

        const fileContent = chatHeader + chatContent;

        // 3. Create a fake download link and click it
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `chat-export-${selectedChatId}.txt`; // File name

        document.body.appendChild(link); // Add link to the document
        link.click(); // Click the link to trigger download
        document.body.removeChild(link); // Clean up and remove the link

    } catch (error) {
        console.error("Error during chat export:", error.message);
    }
}

// --- START: Chat Header Dropdown Logic ---

dropdownToggle.addEventListener('click', (e) => {
    // Stop the click from bubbling up to the window listener
    e.stopPropagation();
    // Toggle the 'show' class to make the menu appear/disappear
    dropdownMenu.classList.toggle('show');
});

exportChatBtn.addEventListener('click', (e) => {
    // Stop the click from closing the menu immediately
    e.stopPropagation(); 

    // Call the helper function
    exportChat();

    // Close the menu after clicking
    dropdownMenu.classList.remove('show');
});

// --- END: Chat Header Dropdown Logic ---

// --- START: Attachment Menu Logic ---

// This helper function cleanly closes the menu
function closeAttachmentMenu() {
    attachmentMenu.classList.remove('show');
    attachmentBtn.classList.remove('toggled'); // Use class, not style
    filePreviewName.textContent = '';
    fileInput.value = null;
}

// Main toggle button for the "paperclip"
attachmentBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Toggle the "toggled" class on the button for the animation
    const isToggled = attachmentBtn.classList.toggle('toggled');
    
    // Toggle the "show" class on the menu
    if (isToggled) {
        attachmentMenu.classList.add('show');
    } else {
        closeAttachmentMenu();
    }
});

// "Upload File" button clicks the hidden file input
uploadFileBtn.addEventListener('click', () => {
    fileInput.click();
});

// Listen for when a file is selected
fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;
        filePreviewName.textContent = `Selected: ${fileName}`;
        console.log("File selected:", fileName);
    }
});
// --- END: Attachment Menu Logic ---

// --- START: Global Click Listener (for modals/dropdowns) ---

window.addEventListener('click', () => {
    // Check if the dropdown menu is currently open
    if (dropdownMenu.classList.contains('show')) {
        dropdownMenu.classList.remove('show');
    }

    // Check if the attachment menu is currently open
    if (attachmentMenu.classList.contains('show')) {
        closeAttachmentMenu();
    }
});

// --- END: Global Click Listener ---

// HELPER FUNCTION

// This function just creates the HTML for a single message
function displayMessage(message) {
    if (!messagesArea) return; 
    
    const shouldScroll = messagesArea.scrollTop + messagesArea.clientHeight >= messagesArea.scrollHeight - 10;
    const placeholder = messagesArea.querySelector('.chat-list-empty');
    if (placeholder) {
        placeholder.remove(); 
    }

    const isSent = message.sender_id === currentUserId;
    const messageClass = isSent ? 'sent' : 'received';

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', messageClass);
    messageDiv.dataset.messageId = message.id;

    // --- Content Logic ---
    let contentHTML;
    if (message.message_type === 'image') {
        contentHTML = `<a href="${message.content}" target="_blank" style="display: block;">
            <img src="${message.content}" alt="Image attachment" style="max-width: 250px; max-height: 200px; height: auto; border-radius: 8px;">
        </a>`;
    } else if (message.message_type === 'file') {
        const urlParts = message.content.split('/');
        const fileName = urlParts[urlParts.length - 1].split('_').pop(); 
        contentHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem;">
                <i class="fas fa-file-alt" style="font-size: 1.2rem;"></i>
                <a href="${message.content}" target="_blank" style="color: inherit; text-decoration: underline; font-weight: 500;">${fileName}</a>
            </div>
        `;
    } else {
        contentHTML = `<p>${message.content}</p>`;
    }

    // --- Star Button ---
    const starClass = message.is_starred ? 'fas fa-star' : 'far fa-star';
    const starButtonHtml = `
        <button class="star-btn ${message.is_starred ? 'is-starred' : ''}" title="Star message">
            <i class="${starClass}"></i>
        </button>
    `;

    // --- NEW: Delete Button (Only for Sender) ---
    let deleteButtonHtml = '';
    if (isSent) {
        deleteButtonHtml = `
            <button class="delete-btn" title="Delete message">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }

    // --- Assembly ---
    // Note: We use row-reverse in CSS for sent messages, so the order here matters less visually,
    // but typically we want: [Content] [Star] [Delete]
    if (isSent) {
        // For sent messages: Content is first, then buttons
        messageDiv.innerHTML = `${contentHTML} ${starButtonHtml} ${deleteButtonHtml}`;
    } else {
        // For received messages: Content first, then Star (No delete button)
        messageDiv.innerHTML = `${contentHTML} ${starButtonHtml}`;
    }

    messagesArea.appendChild(messageDiv);

    if (shouldScroll) {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
}

// NEW CHAT LIST LOGIC
// This function will fetch and display the user's real chats
async function loadUserChats() {
    console.log("Loading user chats...");

    if (!contactsList) return;

    contactsList.innerHTML = '';

    try {
        const { data: chats, error } = await db.rpc('get_my_chats');

        if (error) {
            console.error("Error loading chats:", error.message);
            contactsList.innerHTML = '<li class="chat-list-empty">Error loading chats.</li>';
            return;
        }

        if (chats && chats.length > 0) {

            chats.forEach(chat => {
                const li = document.createElement('li');
                li.classList.add('contact-item');

                li.dataset.chatId = chat.chat_id;
                li.dataset.chatEmail = chat.other_user_email;

                // This is the new logic to store the display name
                const displayName = chat.other_user_display_name || chat.other_user_email;
                li.dataset.chatName = displayName; // Store it for the header
                const firstLetter = displayName.charAt(0).toUpperCase();

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
    chatHeaderName.textContent = chatElement.dataset.chatName;
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
    // 1. Unsubscribe from old channels to prevent duplicates
    if (currentChatChannel) {
        db.removeChannel(currentChatChannel);
        currentChatChannel = null;
    }

    // 2. Create the channel
    const channel = db.channel(`chat:${chatId}`);

    currentChatChannel = channel
        // --- LISTENER 1: NEW MESSAGES (Keep the Filter) ---
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${chatId}` // Filter is safe here!
            },
            (payload) => {
                console.log('New message received!', payload.new);
                displayMessage(payload.new);
            }
        )
        // --- LISTENER 2: DELETED MESSAGES (Remove the Filter) ---
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'messages'
                // REMOVED THE FILTER HERE
            },
            (payload) => {
                // We receive the ID of the deleted row in payload.old
                const messageId = payload.old.id;
                
                // We check if this message exists in our current DOM
                const messageDiv = document.querySelector(`.message[data-message-id="${messageId}"]`);
                
                if (messageDiv) {
                    console.log('Deleting message from screen:', messageId);
                    // Add a fade-out effect
                    messageDiv.style.transition = "opacity 0.3s ease";
                    messageDiv.style.opacity = '0'; 
                    
                    // Remove it from the DOM after the animation
                    setTimeout(() => messageDiv.remove(), 300); 
                }
                // If messageDiv is null, it means the deleted message belongs 
                // to a different chat, so we just ignore it.
            }
        )
        .subscribe((status) => {
            console.log(`Subscription status for ${chatId}: ${status}`);
        });
}
// --- END OF REALTIME FUNCTION ---
// --- END: NEW CHAT LIST LOGIC ---

// --- START: WALLPAPER LOGIC ---

const wallpaperInput = document.getElementById('wallpaper-input');
const changeWallpaperBtn = document.getElementById('change-wallpaper-btn');
const removeWallpaperBtn = document.getElementById('remove-wallpaper-btn');

// Custom Alert Elements
const customAlertModal = document.getElementById('custom-alert-modal');
const alertTitle = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const closeAlertBtn = document.getElementById('close-alert-btn');

// Helper: Show Custom Alert
function showCustomAlert(title, message) {
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    customAlertModal.classList.add('show');
}

// Helper: Close Custom Alert
closeAlertBtn.addEventListener('click', () => {
    customAlertModal.classList.remove('show');
});

// 1. Load Wallpaper on Startup
function loadSavedWallpaper() {
    try {
        const savedWallpaper = localStorage.getItem('chat_wallpaper');
        if (savedWallpaper) {
            messagesArea.style.backgroundImage = `url(${savedWallpaper})`;
            removeWallpaperBtn.style.display = 'inline-flex'; 
        }
    } catch (e) {
        console.error("Error loading wallpaper:", e);
    }
}

loadSavedWallpaper();

// 2. Handle "Change" Button Click
changeWallpaperBtn.addEventListener('click', () => {
    wallpaperInput.click(); 
});

// 3. Handle File Selection
wallpaperInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        // LIMIT CHECK: 3MB (3 * 1024 * 1024 bytes)
        const limit = 3 * 1024 * 1024; 

        if (file.size > limit) {
            // Show our FANCY modal instead of alert()
            showCustomAlert("File Too Large", "Please choose an image smaller than 3MB. High-resolution images are too heavy for this app!");
            // Reset input so they can try again
            wallpaperInput.value = ''; 
            return;
        }

        const reader = new FileReader();

        reader.onload = function(event) {
            const base64String = event.target.result;

            try {
                // Attempt to save to Local Storage
                localStorage.setItem('chat_wallpaper', base64String);
                
                // Apply immediately
                messagesArea.style.backgroundImage = `url(${base64String})`;
                removeWallpaperBtn.style.display = 'inline-flex';
                console.log("Wallpaper updated successfully!");
                
            } catch (error) {
                // This catches the "QuotaExceededError" if LocalStorage is full
                console.error("Storage failed:", error);
                showCustomAlert("Storage Full", "Your browser's local storage is full. Try a smaller image or lower resolution.");
            }
        };

        reader.readAsDataURL(file);
    }
});

// 4. Handle "Remove" Button Click
removeWallpaperBtn.addEventListener('click', () => {
    localStorage.removeItem('chat_wallpaper');
    messagesArea.style.backgroundImage = 'none';
    removeWallpaperBtn.style.display = 'none';
    wallpaperInput.value = '';
});

// --- END: WALLPAPER LOGIC ---

// --- STEP 4: MANAGE SESSION ---
db.auth.onAuthStateChange(async (event, session) => {

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