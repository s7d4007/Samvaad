# Samvaad - Real_Time Chat Application

This is a full-stack, real-time chat application built to demonstrate advanced backend and frontend development skills. The frontend is built with pure HTML5, CSS3, and modern JavaScript, while the backend is fully powered by Supabase.

This repository is for **showcase and portfolio purposes only**.

## Features

* **Secure Authentication:** Full secure user signup, login, and logout flow using  OTP email verification.
* **Real-Time Messaging:** Messages appear instantly on both users' screens without a page refresh using Supabase Realtime Subscriptions.
* **1-on-1 Chat Creation:** Users can find other users by their email address to start a new, private conversation.
* **Dynamic Chat List:** The contact list is dynamically loaded from the database, showing only the current user's active chats.

## Project Status

**Version:** 2.0

The core functionality for 1-on-1 real-time chat is complete and working.

## Tech Stack

### Frontend
* HTML5
* CSS3 (with variables)
* Modern JavaScript (ES Modules)
* Font Awesome

### Backend & Security
* **Platform:** [Supabase](https://supabase.com/)
* **Authentication:** Supabase Auth for all user management.
* **Database:** Supabase Postgres.
* **Real-Time:** Supabase Realtime Subscriptions.
* **Security (RLS):** The database is fully locked down with **Row Level Security (RLS)** policies, ensuring users can *only* access their own messages and chat participants.
* **Security (Database Functions):** Uses secure PL/pgSQL database functions to handle all complex business logic on the server, minimizing the frontend's exposure.

## License

This is a proprietary project. All rights are reserved.

You may view the code for educational and portfolio review purposes. You do not have permission to copy, modify, redistribute, or use this software for any commercial or non-commercial purposes.

Please see the `LICENSE` file for full details.
