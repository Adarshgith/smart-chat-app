# Frontend Architecture

## Tech Stack

- **Framework:** React 19 (JavaScript, no TypeScript)
- **Routing:** React Router DOM v7
- **HTTP Client:** Axios
- **Tooling:** Create React App (react-scripts 5.0.1)
- **Styling:** Plain CSS (no CSS modules, no preprocessors, no UI library)

## Folder Structure

```
frontend/
├── public/                     # Static assets served as-is
│   ├── index.html              # HTML entry point (mounts React into #root)
│   ├── manifest.json           # PWA manifest metadata
│   └── robots.txt              # Search engine crawling rules
│
├── src/                        # Application source code
│   ├── index.js                # React entry point — renders <App /> into the DOM
│   ├── App.js                  # Root component — sets up routing and AuthProvider
│   ├── App.css                 # Global styles (sidebar, chat UI, messages, dark mode)
│   │
│   ├── components/             # Page-level UI components
│   │   ├── chat.js             # Main chat interface (sidebar + message area + input)
│   │   ├── login.js            # Login form page
│   │   ├── signup.js           # Signup form page
│   │   └── Auth.css            # Shared styles for login & signup pages
│   │
│   └── context/                # React Context providers
│       └── AuthContext.js      # Auth state (user, token, login, signup, logout)
│
├── package.json                # Dependencies and npm scripts
└── README.md                   # Project readme
```

## Application Flow

### Entry Point

`index.js` → renders `<App />` inside `React.StrictMode`.

### Routing (`App.js`)

| Route      | Component  | Access                                      |
| ---------- | ---------- | ------------------------------------------- |
| `/`        | —          | Redirects to `/chat`                        |
| `/login`   | `Login`    | Public only (redirects to `/chat` if authed)|
| `/signup`  | `Signup`   | Public only (redirects to `/chat` if authed)|
| `/chat`    | `Chat`     | Public (works for both guests and users)    |

`PublicRoute` is a wrapper that redirects authenticated users away from login/signup.

### Authentication (`context/AuthContext.js`)

- Provides `user`, `token`, `login()`, `signup()`, `logout()`, and `loading` via React Context.
- Token is persisted in `localStorage`.
- On mount, reads the stored token to restore the session.
- All auth API calls go to `http://localhost:5000/api/auth/*`.

### Chat (`components/chat.js`)

- Supports **guest mode** (no persistence) and **authenticated mode** (chat history saved to backend).
- Sidebar contains: new-chat button, chat history list (auth only), dark/light theme toggle, login/logout button.
- Messages are sent to `POST /api/search` and responses are displayed in a conversational UI.
- Chat CRUD via `/api/chats` endpoints (create, list, load, append messages).

### Styling

- `App.css` — all chat/sidebar/message/input styles + dark mode (`.App.dark` class) + responsive breakpoints.
- `Auth.css` — login and signup form styles.
- Dark mode is toggled via local component state in `Chat`, applying a `.dark` class to the root element.

## Backend API Dependency

The frontend expects a backend running at `http://localhost:5000` with these endpoints:

| Method | Endpoint                          | Purpose                  |
| ------ | --------------------------------- | ------------------------ |
| POST   | `/api/auth/login`                 | User login               |
| POST   | `/api/auth/signup`                | User registration        |
| POST   | `/api/search`                     | Send query, get AI reply |
| GET    | `/api/chats`                      | List user's chats        |
| POST   | `/api/chats`                      | Create a new chat        |
| GET    | `/api/chats/:id`                  | Load a specific chat     |
| POST   | `/api/chats/:id/messages`         | Append message to chat   |

Authenticated requests use `Authorization: Bearer <token>` header.
