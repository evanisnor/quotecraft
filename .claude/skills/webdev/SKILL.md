# Web Development Skill

Guidelines for TypeScript, React, and Next.js development.

## Code Organization: Feature-Sliced Design

All frontend code must follow [Feature-Sliced Design (FSD)](https://feature-sliced.design/) — an architectural methodology that organizes code by business domain rather than technical concerns.

### Layers

FSD defines standardized layers, ordered top to bottom. **Modules may only import from layers strictly below them.** No lateral imports between modules on the same layer.

| Layer | Purpose | Examples |
|-------|---------|----------|
| **app** | Runtime essentials: routing, entry points, global styles, providers | `app/layout.tsx`, `app/providers.tsx` |
| **pages** | Full pages or major routed views | `pages/dashboard`, `pages/calculator-editor` |
| **widgets** | Large self-contained UI blocks composed of features and entities | `widgets/calculator-preview`, `widgets/submission-list` |
| **features** | Reusable product feature implementations that deliver business value | `features/create-calculator`, `features/apply-theme` |
| **entities** | Business domain objects — data models, their UI representations, and API calls | `entities/calculator`, `entities/submission`, `entities/user` |
| **shared** | Reusable, project-agnostic code: UI kit, utilities, API client, config | `shared/ui`, `shared/lib`, `shared/api` |

### Slices

Within each layer (except `app` and `shared`), code is partitioned into **slices** by business domain. Each slice is a folder named after its domain concept.

**Critical rule:** Slices on the same layer cannot import from each other. This enforces low coupling.

```
features/
├── create-calculator/    # One slice
├── apply-theme/          # Another slice — cannot import from create-calculator
└── configure-formula/    # Another slice — cannot import from siblings
```

### Segments

Each slice contains **segments** that organize code by technical purpose:

| Segment | Contents |
|---------|----------|
| **ui** | React components, styles |
| **model** | TypeScript types/interfaces, stores, business logic |
| **api** | Backend interaction, data fetching, request/response types |
| **lib** | Internal utilities specific to this slice |
| **config** | Constants, feature flags, configuration |

### Public API

Every slice must export through an `index.ts` barrel file at its root. External consumers import only from this public API, never from internal segment files.

```typescript
// features/create-calculator/index.ts  — public API
export { CreateCalculatorForm } from './ui/CreateCalculatorForm';
export { useCreateCalculator } from './model/useCreateCalculator';
export type { CreateCalculatorParams } from './model/types';

// ✅ Good — import from the slice's public API
import { CreateCalculatorForm } from '@/features/create-calculator';

// ❌ Bad — reaching into internal segments
import { CreateCalculatorForm } from '@/features/create-calculator/ui/CreateCalculatorForm';
```

### Example Project Structure

```
src/
├── app/                          # App layer: Next.js routing, providers, global styles
│   ├── layout.tsx
│   ├── providers.tsx
│   ├── globals.css
│   ├── dashboard/
│   │   └── page.tsx
│   └── editor/[id]/
│       └── page.tsx
│
├── pages/                        # Pages layer: page-level compositions
│   ├── dashboard/
│   │   ├── ui/
│   │   ├── model/
│   │   └── index.ts
│   └── calculator-editor/
│       ├── ui/
│       ├── model/
│       └── index.ts
│
├── widgets/                      # Widgets layer: self-contained UI blocks
│   ├── calculator-preview/
│   │   ├── ui/
│   │   ├── model/
│   │   └── index.ts
│   └── submission-table/
│       ├── ui/
│       ├── model/
│       └── index.ts
│
├── features/                     # Features layer: user-facing capabilities
│   ├── create-calculator/
│   │   ├── ui/
│   │   ├── model/
│   │   ├── api/
│   │   └── index.ts
│   ├── configure-formula/
│   │   ├── ui/
│   │   ├── model/
│   │   └── index.ts
│   └── apply-theme/
│       ├── ui/
│       ├── model/
│       └── index.ts
│
├── entities/                     # Entities layer: business domain objects
│   ├── calculator/
│   │   ├── ui/
│   │   ├── model/
│   │   ├── api/
│   │   └── index.ts
│   ├── submission/
│   │   ├── ui/
│   │   ├── model/
│   │   ├── api/
│   │   └── index.ts
│   └── user/
│       ├── model/
│       ├── api/
│       └── index.ts
│
└── shared/                       # Shared layer: project-agnostic reusable code
    ├── ui/                       # UI kit (buttons, inputs, modals)
    ├── api/                      # API client, interceptors
    ├── lib/                      # Utilities (formatting, validation)
    └── config/                   # Constants, env config
```

### Import Rules Summary

```
app       → pages, widgets, features, entities, shared
pages     → widgets, features, entities, shared
widgets   → features, entities, shared
features  → entities, shared
entities  → shared
shared    → (external packages only)
```

Violations of these import rules indicate an architectural problem. Fix the dependency direction rather than working around it.

## TypeScript

### ES Modules

Always use ES module syntax (import/export) instead of CommonJS (require/module.exports).

**Bad - CommonJS:**
```javascript
const nextJest = require('next/jest');
module.exports = config;
```

**Good - ES Modules:**
```typescript
import nextJest from 'next/jest.js';
export default config;
```

**Important Notes:**
- When importing from npm packages in ESM mode, you may need to include the `.js` extension (e.g., `'next/jest.js'`)
- Use `import type` for TypeScript types to enable type-only imports
- Use named exports for utilities, default exports for components/configs

### Never Use `any` Types

The `any` type defeats the purpose of TypeScript and should be avoided. Use proper type assertions or type guards instead.

**Bad:**
```typescript
const result = convertFormat(input, options as any, output as any);
```

**Good:**
```typescript
import type { ParseOptions, FormatOptions } from "./types";

const inputOptions: ParseOptions = { format: format as DateTimeFormat, customFormat };
const outputOptions: FormatOptions = { format: format as DateTimeFormat };
const result = convertFormat(input, inputOptions, outputOptions);
```

**When you need type assertions:**
- Use specific type assertions: `value as string`, `value as DateTimeFormat`
- Import and use the actual types from their definitions
- Document why the assertion is safe with a comment if non-obvious

**Alternatives to `any`:**
- `unknown` - for truly unknown types (forces type checking before use)
- Union types - `string | number | boolean`
- Generic types - `<T>` with constraints
- Type guards - `if (typeof x === 'string')`

### Component Props Typing

**Use interfaces or types for component props:**
```typescript
interface MessageProps {
  /** The message content to display */
  content: string;
  /** Whether the message is from the current user */
  isOwn: boolean;
  /** Timestamp when the message was sent */
  timestamp: Date;
  /** Optional callback when message is clicked */
  onClick?: (messageId: string) => void;
}

function Message({ content, isOwn, timestamp, onClick }: MessageProps) {
  return (
    <div onClick={() => onClick?.(content)}>
      <p>{content}</p>
      <time>{timestamp.toISOString()}</time>
    </div>
  );
}
```

### Hook Typing Patterns

**`useState` - Let TypeScript infer when possible:**
```typescript
// Inferred as boolean
const [isOpen, setIsOpen] = useState(false);

// Union types need explicit typing
type Status = "idle" | "loading" | "success" | "error";
const [status, setStatus] = useState<Status>("idle");

// Discriminated unions for complex state
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Message[] }
  | { status: 'error'; error: Error };
const [state, setState] = useState<RequestState>({ status: 'idle' });
```

**`useReducer` - Type actions as discriminated unions:**
```typescript
interface State {
  messages: Message[];
  status: Status;
}

type Action =
  | { type: "messages_loaded"; messages: Message[] }
  | { type: "message_added"; message: Message }
  | { type: "message_deleted"; messageId: string }
  | { type: "status_changed"; status: Status };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "messages_loaded":
      return { ...state, messages: action.messages, status: "success" };
    case "message_added":
      return { ...state, messages: [...state.messages, action.message] };
    case "message_deleted":
      return {
        ...state,
        messages: state.messages.filter(m => m.id !== action.messageId)
      };
    case "status_changed":
      return { ...state, status: action.status };
  }
}
```

**`useContext` - Handle nullable contexts:**
```typescript
type User = { id: string; name: string; role: string };
const UserContext = createContext<User | null>(null);

function useUser() {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useUser must be used within UserProvider");
  }
  return user;
}
```

**Event handlers:**
```typescript
function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
  setValue(event.currentTarget.value);
}

function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  // ...
}

function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
  // ...
}
```

**Common React types:**
```typescript
interface ComponentProps {
  children: React.ReactNode;        // Any valid React child
  style?: React.CSSProperties;      // Inline styles
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}
```

## React State Management

### State Structure Principles

**1. Group related state**
```typescript
// ❌ Bad - separate state that updates together
const [x, setX] = useState(0);
const [y, setY] = useState(0);

// ✅ Good - group related state
const [position, setPosition] = useState({ x: 0, y: 0 });
```

**2. Avoid contradictions - use discriminated unions**
```typescript
// ❌ Bad - isSending and isSent could both be true
const [isSending, setIsSending] = useState(false);
const [isSent, setIsSent] = useState(false);

// ✅ Good - single source of truth
type Status = 'typing' | 'sending' | 'sent';
const [status, setStatus] = useState<Status>('typing');
```

**3. Avoid redundant state - calculate during render**
```typescript
// ❌ Bad - fullName duplicates firstName and lastName
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [fullName, setFullName] = useState('');

// ✅ Good - derive from existing state
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const fullName = `${firstName} ${lastName}`;
```

**4. Avoid duplication - store IDs, not objects**
```typescript
// ❌ Bad - selectedConversation duplicates data
const [conversations, setConversations] = useState<Conversation[]>([]);
const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

// ✅ Good - store only the ID
const [conversations, setConversations] = useState<Conversation[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);
const selectedConversation = conversations.find(c => c.id === selectedId);
```

**5. Avoid deeply nested state - flatten structure**
```typescript
// ❌ Bad - nested hierarchy
type ConversationTree = {
  id: string;
  children: ConversationTree[];
};

// ✅ Good - normalized/flat
type ConversationMap = Record<string, {
  id: string;
  childIds: string[];
}>;
```

### Declarative UI with State

**Think in terms of visual states:**
```typescript
type FormStatus = 'empty' | 'typing' | 'submitting' | 'success' | 'error';

function MessageForm() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<FormStatus>('empty');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await sendMessage(message);
      setStatus('success');
    } catch (err) {
      setError(err as Error);
      setStatus('error');
    }
  }

  if (status === 'success') {
    return <p>Message sent!</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={status === 'submitting'}
      />
      <button disabled={message.length === 0 || status === 'submitting'}>
        Send
      </button>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}
```

### Sharing State Between Components

**Lift state up to common parent:**
```typescript
// Parent component manages shared state
function ConversationView() {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  return (
    <>
      <MessageList
        selectedId={selectedMessageId}
        onSelect={setSelectedMessageId}
      />
      <MessageDetail
        messageId={selectedMessageId}
      />
    </>
  );
}

// Child components are controlled
interface MessageListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function MessageList({ selectedId, onSelect }: MessageListProps) {
  // Component is "controlled" - parent owns the state
}
```

### State Preservation and Reset

**React preserves state based on position in tree:**
```typescript
// ❌ Bad - state persists when switching conversations
function ConversationView() {
  return (
    <div>
      {conversationId === 'a' ? (
        <MessageInput />  // Same position, state preserved
      ) : (
        <MessageInput />  // Same component type = same state!
      )}
    </div>
  );
}

// ✅ Good - use key to reset state
function ConversationView() {
  return (
    <div>
      <MessageInput key={conversationId} />  // New key = new state
    </div>
  );
}
```

**Rules:**
- State tied to position in render tree, not JSX
- Same component at same position = state preserved
- Different component type at same position = state reset
- Use `key` prop to force reset when needed

### useReducer for Complex State

**Use `useReducer` when:**
- Many state updates spread across event handlers
- State logic is complex with interdependent updates
- Need to pass dispatch to children (easier than multiple setters)

```typescript
interface MessagesState {
  messages: Message[];
  filter: 'all' | 'unread';
  selectedId: string | null;
}

type MessagesAction =
  | { type: 'message_received'; message: Message }
  | { type: 'message_read'; messageId: string }
  | { type: 'filter_changed'; filter: 'all' | 'unread' }
  | { type: 'message_selected'; messageId: string | null };

function messagesReducer(state: MessagesState, action: MessagesAction): MessagesState {
  switch (action.type) {
    case 'message_received':
      return { ...state, messages: [...state.messages, action.message] };
    case 'message_read':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.messageId ? { ...m, unread: false } : m
        ),
      };
    case 'filter_changed':
      return { ...state, filter: action.filter, selectedId: null };
    case 'message_selected':
      return { ...state, selectedId: action.messageId };
  }
}

function Inbox() {
  const [state, dispatch] = useReducer(messagesReducer, {
    messages: [],
    filter: 'all',
    selectedId: null,
  });

  // Pass dispatch to children instead of multiple setters
  return <MessageList messages={state.messages} dispatch={dispatch} />;
}
```

**Reducer best practices:**
- Reducers must be pure (no side effects)
- Each action describes one user interaction
- Always return new state (don't mutate)
- Use switch with curly braces for scope

### Context for Avoiding Prop Drilling

**Create context with provider:**
```typescript
// contexts/UserContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

type User = { id: string; name: string; role: string };
type UserContextType = { user: User; setUser: (user: User) => void };

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

**Combine reducer with context:**
```typescript
// contexts/ConversationsContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

type State = { conversations: Conversation[]; selectedId: string | null };
type Action =
  | { type: 'conversation_added'; conversation: Conversation }
  | { type: 'conversation_selected'; id: string };

const ConversationsContext = createContext<State | null>(null);
const ConversationsDispatchContext = createContext<React.Dispatch<Action> | null>(null);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(conversationsReducer, initialState);

  return (
    <ConversationsContext.Provider value={state}>
      <ConversationsDispatchContext.Provider value={dispatch}>
        {children}
      </ConversationsDispatchContext.Provider>
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (!context) throw new Error('useConversations requires Provider');
  return context;
}

export function useConversationsDispatch() {
  const context = useContext(ConversationsDispatchContext);
  if (!context) throw new Error('useConversationsDispatch requires Provider');
  return context;
}

function conversationsReducer(state: State, action: Action): State {
  // Reducer implementation
}
```

**Use cases for Context:**
- Theming (dark mode, colors)
- Current user authentication
- Global UI state (modals, notifications)
- Complex state with reducers

**Alternatives to consider first:**
1. Start with props (explicit data flow)
2. Extract components and use `children` prop
3. Only use Context when data needed across distant parts of tree

## React Refs

### When to Use Refs

Use refs for values that **don't trigger re-renders:**
- Storing timeout/interval IDs
- Storing and manipulating DOM elements
- Storing objects not needed for JSX calculation

```typescript
import { useRef } from 'react';

function Stopwatch() {
  const intervalRef = useRef<number | null>(null);

  function handleStart() {
    intervalRef.current = setInterval(() => {
      // Update time
    }, 10);
  }

  function handleStop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }
}
```

**Refs vs State:**

| Aspect | Refs | State |
|--------|------|-------|
| Returns | `{ current: value }` | `[value, setValue]` |
| Re-renders | NO | YES |
| Mutation | Mutable | Immutable (use setter) |
| Reading | Don't read during render | Read anytime |

### DOM Manipulation with Refs

**Access DOM nodes:**
```typescript
function MessageInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFocus() {
    inputRef.current?.focus();
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleFocus}>Focus</button>
    </>
  );
}
```

**Ref callbacks for dynamic lists:**
```typescript
function ConversationList({ conversations }: { conversations: Conversation[] }) {
  const itemsRef = useRef<Map<string, HTMLLIElement>>(new Map());

  function scrollToConversation(id: string) {
    const node = itemsRef.current.get(id);
    node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return (
    <ul>
      {conversations.map((conv) => (
        <li
          key={conv.id}
          ref={(node) => {
            if (node) {
              itemsRef.current.set(conv.id, node);
            } else {
              itemsRef.current.delete(conv.id);
            }
          }}
        >
          {conv.title}
        </li>
      ))}
    </ul>
  );
}
```

**Best practices:**
- Access refs from event handlers, not during render
- Use for focus management, scrolling, measurements
- Never modify DOM that React manages (adding/removing elements)

## React Effects

### When to Use Effects

**Effects synchronize with external systems:**
```typescript
useEffect(() => {
  // Runs after render completes
  const connection = createConnection(serverUrl, roomId);
  connection.connect();

  return () => {
    connection.disconnect();  // Cleanup
  };
}, [roomId, serverUrl]);  // Re-run when dependencies change
```

**Valid use cases:**
- Network requests to external APIs
- Subscribing to browser events
- Connecting to WebSocket/SSE
- Integrating with third-party libraries
- Logging analytics events

### When NOT to Use Effects

**❌ Don't use Effects for:**

**1. Transforming data for rendering:**
```typescript
// ❌ Bad
const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
useEffect(() => {
  setFilteredMessages(messages.filter(m => !m.read));
}, [messages]);

// ✅ Good - calculate during render
const filteredMessages = messages.filter(m => !m.read);

// ✅ Or use useMemo for expensive calculations
const filteredMessages = useMemo(
  () => messages.filter(m => !m.read),
  [messages]
);
```

**2. Handling user events:**
```typescript
// ❌ Bad
useEffect(() => {
  if (submitted) {
    sendMessage(message);
  }
}, [submitted]);

// ✅ Good - put in event handler
async function handleSubmit() {
  await sendMessage(message);
  setSubmitted(true);
}
```

**3. Initializing state:**
```typescript
// ❌ Bad
const [messages, setMessages] = useState<Message[]>([]);
useEffect(() => {
  setMessages(loadFromStorage());
}, []);

// ✅ Good - use lazy initialization
const [messages, setMessages] = useState(() => loadFromStorage());
```

**4. Resetting state on prop changes:**
```typescript
// ❌ Bad
useEffect(() => {
  setDraft('');
}, [conversationId]);

// ✅ Good - use key prop
<MessageInput key={conversationId} />
```

### Effect Dependencies

**Include all reactive values:**
```typescript
function ChatRoom({ roomId, serverUrl }: { roomId: string; serverUrl: string }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]);  // Both are reactive (props)

  // message is reactive but NOT used in effect, so not a dependency
}
```

**Reactive values:**
- Props
- State variables
- Values calculated from props/state
- Variables declared inside component

**NOT reactive:**
- Constants outside component
- Values inside the Effect

**Removing unnecessary dependencies:**

**1. Use updater functions:**
```typescript
// ❌ Messages is a dependency
setMessages([...messages, newMessage]);

// ✅ No dependency needed
setMessages(prev => [...prev, newMessage]);
```

**2. Move static objects/functions outside component:**
```typescript
const options = { serverUrl: 'https://localhost:1234' };

function ChatRoom() {
  useEffect(() => {
    const connection = createConnection(options);
    // ...
  }, []);  // options not reactive
}
```

**3. Move dynamic objects/functions inside Effect:**
```typescript
useEffect(() => {
  const options = {
    serverUrl: serverUrl,
    roomId: roomId  // Only primitives as dependencies
  };
  const connection = createConnection(options);
  // ...
}, [roomId, serverUrl]);  // Primitives, not objects
```

### Effect Cleanup

**Always clean up side effects:**
```typescript
useEffect(() => {
  // Subscription
  const unsubscribe = api.subscribe(conversationId, (message) => {
    setMessages(prev => [...prev, message]);
  });

  return () => {
    unsubscribe();  // Cleanup prevents memory leaks
  };
}, [conversationId]);
```

**Cleanup runs:**
- Before Effect runs again (on dependency change)
- When component unmounts

**Preventing race conditions:**
```typescript
useEffect(() => {
  let ignore = false;

  async function fetchMessages() {
    const result = await api.getMessages(conversationId);
    if (!ignore) {
      setMessages(result);
    }
  }

  fetchMessages();

  return () => {
    ignore = true;  // Ignore stale requests
  };
}, [conversationId]);
```

### Custom Hooks

**Extract reusable Effect logic:**
```typescript
function useConversationMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');

  useEffect(() => {
    let ignore = false;
    setStatus('loading');

    api.getMessages(conversationId)
      .then(result => {
        if (!ignore) {
          setMessages(result);
          setStatus('success');
        }
      })
      .catch(() => {
        if (!ignore) {
          setStatus('error');
        }
      });

    return () => { ignore = true; };
  }, [conversationId]);

  return { messages, status };
}

// Usage
function Conversation({ conversationId }: { conversationId: string }) {
  const { messages, status } = useConversationMessages(conversationId);

  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <Error />;

  return <MessageList messages={messages} />;
}
```

**Custom Hook naming:**
- Must start with `use` followed by capital letter
- `useOnlineStatus`, `useAuth`, `useConversationMessages`
- Only functions that call Hooks should use `use` prefix

**Custom Hook principles:**
- Share stateful logic, NOT state itself
- Each Hook call gets independent state
- Extract when logic is reused across components
- Keep focused on concrete high-level use cases

## Next.js Server-Side Rendering

### Avoid Hydration Mismatches

Server and client must render identical HTML. Common causes of hydration errors:

**❌ Bad - operations that differ between server and client:**
```typescript
function ConversationList({ conversations }: { conversations: Conversation[] }) {
  return (
    <div>
      {conversations
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)  // ❌ Unstable between renders
        .map((conv) => <Item key={conv.id} {...conv} />)}
    </div>
  );
}
```

**✅ Good - memoize derived data:**
```typescript
function ConversationList({ conversations }: { conversations: Conversation[] }) {
  const sortedConversations = useMemo(
    () => conversations.slice().sort((a, b) => b.createdAt - a.createdAt),
    [conversations]
  );

  return (
    <div>
      {sortedConversations.map((conv) => <Item key={conv.id} {...conv} />)}
    </div>
  );
}
```

**Other hydration mismatch causes:**
- `Date.now()` or `Math.random()` called during render
- Browser-specific APIs: `window`, `localStorage`, `navigator`
- Date/time formatting without timezone handling
- Conditional rendering based on `typeof window !== 'undefined'`

**Fix with client-only rendering:**
```typescript
function ConversationList() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton />;  // Server renders skeleton
  }

  // Client-only logic here
  return <div>{/* Use browser APIs safely */}</div>;
}
```

## Testing Patterns

### Prefer Standard Function-Based Tests

Standard function-based tests are easier to read, debug, and maintain. Use them for most test cases:

```typescript
// conversation/ConversationService.test.ts
import { ConversationService } from './ConversationService';
import { EventStore } from '@/event';

describe('ConversationService', () => {
  describe('createMessage', () => {
    it('should append message event to store', async () => {
      const store = EventStore.stub();
      const service = new ConversationService(store);

      await service.createMessage({
        conversationId: 'conv123',
        content: 'Hello',
        authorId: 'user456',
      });

      expect(store.events).toHaveLength(1);
      expect(store.events[0].type).toBe('message.created');
    });

    it('should throw when store fails', async () => {
      const store = EventStore.stub();
      store.appendError = new Error('Database connection failed');
      const service = new ConversationService(store);

      await expect(
        service.createMessage({
          conversationId: 'conv123',
          content: 'Hello',
          authorId: 'user456',
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should validate required fields', async () => {
      const store = EventStore.stub();
      const service = new ConversationService(store);

      await expect(
        service.createMessage({
          conversationId: '',
          content: 'Hello',
          authorId: 'user456',
        })
      ).rejects.toThrow('conversationId is required');
    });
  });
});
```

### Use Table-Driven Tests for Parameter Variations

Reserve `test.each` for scenarios where you need to test multiple parameter combinations or edge cases:

```typescript
// utils/classifier.test.ts
import { classify } from './classifier';
import type { Rule } from './types';

describe('classify', () => {
  // Table-driven test appropriate here because we're testing
  // various keyword combinations and classification scenarios
  const hvacRule: Rule = {
    class: 'equipment_type',
    value: 'hvac',
    keywords: ['furnace', 'ac', 'hvac'],
  };

  const plumbingRule: Rule = {
    class: 'equipment_type',
    value: 'plumbing',
    keywords: ['plumbing', 'leak', 'pipe'],
  };

  test.each([
    {
      name: 'HVAC keywords detected',
      message: 'My furnace is broken and the AC won\'t turn on',
      rules: [hvacRule],
      expected: [{ class: 'equipment_type', value: 'hvac', confidence: 1.0 }],
    },
    {
      name: 'Multiple matches with different classifications',
      message: 'Emergency plumbing leak in kitchen',
      rules: [
        { class: 'severity', value: 'urgent', keywords: ['emergency'] },
        plumbingRule,
      ],
      expected: [
        { class: 'severity', value: 'urgent', confidence: 1.0 },
        { class: 'equipment_type', value: 'plumbing', confidence: 1.0 },
      ],
    },
    {
      name: 'Case insensitive matching',
      message: 'FURNACE not working',
      rules: [hvacRule],
      expected: [{ class: 'equipment_type', value: 'hvac', confidence: 1.0 }],
    },
    {
      name: 'No matches returns empty array',
      message: 'Hello, how are you?',
      rules: [hvacRule],
      expected: [],
    },
    {
      name: 'Empty message returns empty array',
      message: '',
      rules: [hvacRule],
      expected: [],
    },
  ])('$name', ({ message, rules, expected }) => {
    const result = classify(message, rules);
    expect(result).toEqual(expected);
  });
});
```

**When to use each approach:**
- **Standard function tests**: Single scenarios, error paths, integration tests, behavior verification
- **Table-driven tests (`test.each`)**: Input validation with many edge cases, parser/classifier logic, format conversions

### Create Reusable Stubs and Fakes

Don't create per-test mocks. Instead, create reusable test implementations co-located with the interface in a `testing.ts` file:

```typescript
// event/testing.ts - Co-located with EventStore interface
import type { Event, EventStore } from './types';

/**
 * StubEventStore is a reusable test implementation of EventStore.
 * Use it for tests that don't care about event storage details.
 */
export class StubEventStore implements EventStore {
  public events: Event[] = [];
  public appendError?: Error;

  async append(event: Event): Promise<void> {
    if (this.appendError) {
      throw this.appendError;
    }
    this.events.push(event);
  }

  async getEvents(conversationId: string): Promise<Event[]> {
    return this.events.filter((e) => e.conversationId === conversationId);
  }
}

/**
 * FakeEventStore is an in-memory implementation for integration tests.
 * Use it when you need realistic event storage behavior.
 */
export class FakeEventStore implements EventStore {
  private events = new Map<string, Event[]>();

  async append(event: Event): Promise<void> {
    if (!event.conversationId) {
      throw new Error('conversationId is required');
    }

    const conversationEvents = this.events.get(event.conversationId) ?? [];
    this.events.set(event.conversationId, [...conversationEvents, event]);
  }

  async getEvents(conversationId: string): Promise<Event[]> {
    return this.events.get(conversationId) ?? [];
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).flat();
  }

  clear(): void {
    this.events.clear();
  }
}

// Export factory functions for convenience
export const EventStoreStub = {
  create: () => new StubEventStore(),
};

export const EventStoreFake = {
  create: () => new FakeEventStore(),
};
```

**Use stubs in tests:**

```typescript
// conversation/ConversationService.test.ts
import { ConversationService } from './ConversationService';
import { StubEventStore, FakeEventStore } from '@/event/testing';

describe('ConversationService', () => {
  it('should store message events', async () => {
    const store = new StubEventStore();
    const service = new ConversationService(store);

    await service.createMessage({
      conversationId: 'conv123',
      content: 'Hello',
      authorId: 'user456',
    });

    expect(store.events).toHaveLength(1);
    expect(store.events[0].type).toBe('message.created');
  });

  it('should handle store errors', async () => {
    const store = new StubEventStore();
    store.appendError = new Error('Database connection failed');
    const service = new ConversationService(store);

    await expect(
      service.createMessage({
        conversationId: 'conv123',
        content: 'Hello',
        authorId: 'user456',
      })
    ).rejects.toThrow('Database connection failed');
  });

  it('should retrieve events by conversation', async () => {
    // Use the fake for more realistic behavior
    const store = new FakeEventStore();
    const service = new ConversationService(store);

    await service.createMessage({
      conversationId: 'conv123',
      content: 'First message',
      authorId: 'user456',
    });

    await service.createMessage({
      conversationId: 'conv123',
      content: 'Second message',
      authorId: 'user789',
    });

    const events = await store.getEvents('conv123');
    expect(events).toHaveLength(2);
    expect(events[0].payload.content).toBe('First message');
    expect(events[1].payload.content).toBe('Second message');
  });
});
```

### Testing React Components

**Test behavior, not implementation:**

```typescript
// components/MessageForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageForm } from './MessageForm';
import { StubMessageService } from '@/services/testing';

describe('MessageForm', () => {
  it('should submit message when form is valid', async () => {
    const service = new StubMessageService();
    const onSuccess = jest.fn();
    const user = userEvent.setup();

    render(<MessageForm service={service} onSuccess={onSuccess} />);

    await user.type(screen.getByRole('textbox'), 'Hello world');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(service.messages).toHaveLength(1);
    expect(service.messages[0].content).toBe('Hello world');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should disable submit when message is empty', () => {
    const service = new StubMessageService();

    render(<MessageForm service={service} onSuccess={jest.fn()} />);

    const submitButton = screen.getByRole('button', { name: /send/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show error when service fails', async () => {
    const service = new StubMessageService();
    service.sendError = new Error('Network error');
    const user = userEvent.setup();

    render(<MessageForm service={service} onSuccess={jest.fn()} />);

    await user.type(screen.getByRole('textbox'), 'Hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });
});
```

### Testing Custom Hooks

**Use `renderHook` from React Testing Library:**

```typescript
// hooks/useConversationMessages.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useConversationMessages } from './useConversationMessages';
import { StubMessageService } from '@/services/testing';

describe('useConversationMessages', () => {
  it('should load messages on mount', async () => {
    const service = new StubMessageService();
    service.messages = [
      { id: '1', content: 'Hello', conversationId: 'conv123' },
      { id: '2', content: 'World', conversationId: 'conv123' },
    ];

    const { result } = renderHook(() =>
      useConversationMessages('conv123', service)
    );

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.messages).toHaveLength(2);
  });

  it('should handle errors', async () => {
    const service = new StubMessageService();
    service.loadError = new Error('Failed to load');

    const { result } = renderHook(() =>
      useConversationMessages('conv123', service)
    );

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error?.message).toBe('Failed to load');
  });
});
```

### Benefits of Stubs/Fakes Over Mocks

- **Reusability**: Share test implementations across all test files
- **Consistency**: Same test behavior throughout the codebase
- **Discoverability**: Easy to find test helpers (`new StubEventStore()`)
- **Maintainability**: Update once when interface changes
- **Type safety**: TypeScript ensures stubs implement interfaces correctly
- **Documentation**: Test implementations show how to use the interface

### Testing File Organization

```
src/
├── event/
│   ├── EventStore.ts        # Interface definition
│   ├── PostgresEventStore.ts # Production implementation
│   ├── testing.ts           # StubEventStore, FakeEventStore
│   └── EventStore.test.ts   # Tests
├── conversation/
│   ├── ConversationService.ts
│   ├── ConversationService.test.ts
│   └── testing.ts           # Stub/fake for this module
```

## Summary: Key Principles

1. **Type everything** - No `any`, use proper TypeScript types
2. **Structure state wisely** - Group related, avoid redundant/contradictory
3. **Lift state up** - Share state via common parent, not duplicating
4. **Use keys** - Control state preservation/reset with `key` prop
5. **Prefer reducers** - For complex state with multiple update paths
6. **Context sparingly** - Only when passing through many levels
7. **Refs for non-rendering values** - Timeouts, DOM nodes, anything that doesn't affect JSX
8. **Effects for external systems** - Network, browser APIs, third-party libs
9. **Avoid Effects for** - Data transformation, event handling, initialization
10. **Custom Hooks for reuse** - Extract Effect logic into named, testable functions
11. **Prevent hydration errors** - Memoize derived data, avoid client-only APIs during render
12. **Test thoroughly** - Standard function tests for clarity, `test.each` for parameter variations, reusable stubs/fakes in testing.ts files
