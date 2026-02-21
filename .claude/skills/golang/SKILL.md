# Golang Skill

Essential Go patterns and practices for building an event-sourced, multi-tenant communication platform.

## Code Style

### Formatting
- **Always use `gofmt`** - All code must be formatted before commit
- **Tabs for indentation** - Default Go style
- **Opening braces on same line** - Required by Go's semicolon insertion

```go
// Correct
if err != nil {
    return err
}

// Wrong - semicolon inserted before brace
if err != nil
{
    return err
}
```

### Naming Conventions

**Packages**
- Lowercase, single-word names: `event`, `tenant`, `conversation`
- Match directory name
- No underscores or mixedCaps

**Exported vs Unexported**
- `ExportedName` - Public API (first letter uppercase)
- `unexportedName` - Internal to package (first letter lowercase)

**Interfaces**
- Single-method: Method name + `-er` suffix (`Reader`, `Writer`, `Enricher`)
- Use canonical names: `Read`, `Write`, `Close`, `String`

**No `Get` prefix for getters**
```go
// Correct
func (p *Participant) Name() string

// Wrong
func (p *Participant) GetName() string
```

**Use MixedCaps, never underscores**
```go
// Correct
conversationID, tenantID, metadataValue

// Wrong
conversation_id, tenant_id, metadata_value
```

## Example Project Structure 

```
myapp/
├── cmd/
│   ├── api-server/         # HTTP API service
│   ├── event-broker/       # Event processing service
│   └── admin-panel/        # Admin interface
├── internal/
│   ├── event/             # Event log domain
│   ├── tenant/            # Multi-tenancy
│   ├── conversation/      # Conversation domain
│   ├── participant/       # Participant domain
│   ├── transport/         # Transport adapters
│   ├── enrichment/        # Message enrichment
│   ├── authorization/     # RBAC enforcement
│   └── materialized/      # Materialized views
├── pkg/
│   ├── middleware/        # Reusable HTTP middleware
│   └── observability/     # Logging, metrics, tracing
├── api/                   # API definitions (OpenAPI, protobuf)
└── migrations/            # Database migrations
```

## Critical Patterns

### 1. Error Handling

**Return errors, never panic in business logic**
```go
func (s *EventStore) Append(ctx context.Context, event *Event) error {
    if err := s.validate(event); err != nil {
        return fmt.Errorf("invalid event: %w", err)
    }

    if err := s.db.Insert(ctx, event); err != nil {
        return fmt.Errorf("failed to insert event: %w", err)
    }

    return nil
}
```

**ALWAYS check error return values - never ignore them**
```go
// BAD - ignoring error from function call
roleRepo.Create(ctx, role)

// GOOD - checking and handling error
if err := roleRepo.Create(ctx, role); err != nil {
    return fmt.Errorf("failed to create role: %w", err)
}

// BAD - ignoring error in test setup
func TestSomething(t *testing.T) {
    repo.Create(ctx, testData)
    // ... test continues
}

// GOOD - failing fast if setup fails
func TestSomething(t *testing.T) {
    if err := repo.Create(ctx, testData); err != nil {
        t.Fatalf("Failed to create test data: %v", err)
    }
    // ... test continues with valid setup
}
```

**Use error wrapping with `%w` for context**
```go
// Provides stack of context: "processing conversation abc123: invalid participant: user not found"
if err := processConversation(conv); err != nil {
    return fmt.Errorf("processing conversation %s: %w", conv.ID, err)
}
```

**Type assertions for specific error handling**
```go
if err := adapter.Send(msg); err != nil {
    var rateLimitErr *RateLimitError
    if errors.As(err, &rateLimitErr) {
        // Schedule retry after rate limit window
        return scheduleRetry(msg, rateLimitErr.RetryAfter)
    }
    return err
}
```

**Custom error types for domain errors**
```go
type AuthorizationError struct {
    UserID         string
    ConversationID string
    RequiredPerm   Permission
}

func (e *AuthorizationError) Error() string {
    return fmt.Sprintf("user %s lacks permission %s for conversation %s",
        e.UserID, e.RequiredPerm, e.ConversationID)
}
```

### 2. Context for Request Lifecycle

**Always pass `context.Context` as first parameter**
```go
func (s *Service) ProcessMessage(ctx context.Context, msg *Message) error {
    // Context carries cancellation, deadlines, tenant_id, user_id
}
```

**Extract tenant/user from context**
```go
func (s *Service) Authorize(ctx context.Context, conv *Conversation) error {
    tenantID := tenant.FromContext(ctx)
    userID := auth.UserIDFromContext(ctx)

    // Check authorization
    return s.authz.CanAccess(ctx, userID, tenantID, conv.ID)
}
```

**Set timeouts for external calls**
```go
func (a *SMSAdapter) Send(ctx context.Context, msg *Message) error {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    return a.twilioClient.SendSMS(ctx, msg.To, msg.Body)
}
```

### 3. Interfaces for Abstractions

**Define interfaces where consumed, not where implemented**
```go
// In enrichment package
type ClassificationStore interface {
    GetRules(ctx context.Context, tenantID string) ([]*Rule, error)
}

// Implementation in separate package
type PostgresClassificationStore struct {
    db *sql.DB
}

func (s *PostgresClassificationStore) GetRules(ctx context.Context, tenantID string) ([]*Rule, error) {
    // Implementation
}
```

**Small, focused interfaces**
```go
// Single responsibility - each adapter implements only what it needs
type MessageSender interface {
    Send(ctx context.Context, msg *Message) error
}

type DeliveryTracker interface {
    TrackDelivery(ctx context.Context, messageID, status string) error
}

type EndpointVerifier interface {
    SendVerification(ctx context.Context, endpoint *Endpoint) error
    ConfirmVerification(ctx context.Context, endpoint *Endpoint, code string) error
}
```

### 4. Struct Composition

**Embed for behavior delegation**
```go
type ConversationService struct {
    eventStore EventStore
    authz      Authorizer
    logger     *slog.Logger
}

func (s *ConversationService) CreateMessage(ctx context.Context, req *CreateMessageRequest) error {
    // Check authorization
    if err := s.authz.CanSendMessage(ctx, req.ConversationID); err != nil {
        return err
    }

    event := &Event{
        Type: "message.created",
        Payload: req,
    }

    return s.eventStore.Append(ctx, event)
}
```

**Table-driven configuration**
```go
var transportAdapters = map[string]TransportAdapter{
    "sms":   NewSMSAdapter(twilioClient),
    "email": NewEmailAdapter(smtpClient),
    "web":   NewWebSocketAdapter(hub),
}

func GetAdapter(transportType string) (TransportAdapter, error) {
    adapter, ok := transportAdapters[transportType]
    if !ok {
        return nil, fmt.Errorf("unknown transport: %s", transportType)
    }
    return adapter, nil
}
```

### 5. Concurrency Patterns

**Goroutines for parallel enrichment**
```go
func (e *Enricher) Enrich(ctx context.Context, msg *Message) (*EnrichedMessage, error) {
    var wg sync.WaitGroup
    errs := make(chan error, 3)

    result := &EnrichedMessage{Message: msg}

    // Parallel enrichment stages
    wg.Add(3)

    go func() {
        defer wg.Done()
        classifications, err := e.classifier.Classify(ctx, msg)
        if err != nil {
            errs <- err
            return
        }
        result.Classifications = classifications
    }()

    go func() {
        defer wg.Done()
        fields, err := e.extractor.Extract(ctx, msg)
        if err != nil {
            errs <- err
            return
        }
        result.ExtractedFields = fields
    }()

    go func() {
        defer wg.Done()
        assignments, err := e.router.Route(ctx, msg)
        if err != nil {
            errs <- err
            return
        }
        result.Assignments = assignments
    }()

    wg.Wait()
    close(errs)

    // Check for errors
    for err := range errs {
        if err != nil {
            return nil, err
        }
    }

    return result, nil
}
```

**Channels for event streaming**
```go
type EventStream struct {
    events chan *Event
    done   chan struct{}
}

func (s *EventBroker) Subscribe(ctx context.Context, filter EventFilter) *EventStream {
    stream := &EventStream{
        events: make(chan *Event, 100), // Buffered for backpressure
        done:   make(chan struct{}),
    }

    go func() {
        defer close(stream.events)

        for {
            select {
            case <-ctx.Done():
                return
            case <-stream.done:
                return
            case event := <-s.internalEvents:
                if filter.Matches(event) {
                    stream.events <- event
                }
            }
        }
    }()

    return stream
}
```

**Worker pool for rate-limited operations**
```go
func (a *SMSAdapter) StartWorkers(ctx context.Context, numWorkers int) {
    jobs := make(chan *Message, 100)

    for i := 0; i < numWorkers; i++ {
        go func(workerID int) {
            limiter := rate.NewLimiter(rate.Limit(10), 10) // 10 SMS/sec per worker

            for {
                select {
                case <-ctx.Done():
                    return
                case msg := <-jobs:
                    if err := limiter.Wait(ctx); err != nil {
                        a.logger.Error("rate limit wait failed", "error", err)
                        continue
                    }

                    if err := a.send(ctx, msg); err != nil {
                        a.logger.Error("failed to send SMS", "error", err)
                    }
                }
            }
        }(i)
    }
}
```

### 6. Database Patterns

**Use prepared statements for security and performance**
```go
const insertEventQuery = `
    INSERT INTO events (id, tenant_id, conversation_id, event_type, payload, occurred_at)
    VALUES ($1, $2, $3, $4, $5, $6)
`

func (s *EventStore) Append(ctx context.Context, event *Event) error {
    _, err := s.db.ExecContext(ctx, insertEventQuery,
        event.ID,
        event.TenantID,
        event.ConversationID,
        event.Type,
        event.Payload,
        event.OccurredAt,
    )
    return err
}
```

**Scan rows with error handling**
```go
func (s *ConversationStore) List(ctx context.Context, tenantID string, limit int) ([]*Conversation, error) {
    rows, err := s.db.QueryContext(ctx, `
        SELECT id, tenant_id, participant_ids, created_at, updated_at
        FROM conversations
        WHERE tenant_id = $1
        ORDER BY updated_at DESC
        LIMIT $2
    `, tenantID, limit)
    if err != nil {
        return nil, fmt.Errorf("query failed: %w", err)
    }
    defer rows.Close()

    var conversations []*Conversation
    for rows.Next() {
        var c Conversation
        if err := rows.Scan(&c.ID, &c.TenantID, &c.ParticipantIDs, &c.CreatedAt, &c.UpdatedAt); err != nil {
            return nil, fmt.Errorf("scan failed: %w", err)
        }
        conversations = append(conversations, &c)
    }

    if err := rows.Err(); err != nil {
        return nil, fmt.Errorf("rows iteration failed: %w", err)
    }

    return conversations, nil
}
```

**Use transactions for atomic operations**
```go
func (s *ConversationService) CreateWithParticipants(ctx context.Context, conv *Conversation, participants []*Participant) error {
    tx, err := s.db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback() // No-op if commit succeeds

    if err := s.insertConversation(ctx, tx, conv); err != nil {
        return err
    }

    for _, p := range participants {
        if err := s.insertParticipant(ctx, tx, p); err != nil {
            return err
        }
    }

    return tx.Commit()
}
```

### 7. Testing Patterns

**Prefer standard function-based tests for clarity**

Standard function-based tests are easier to read, debug, and maintain. Use them for most test cases:

```go
func TestService_ProcessMessage_Success(t *testing.T) {
    store := &mockEventStore{
        appendFunc: func(ctx context.Context, event *Event) error {
            return nil
        },
    }
    svc := NewService(store)

    err := svc.ProcessMessage(context.Background(), &Message{Body: "test"})
    if err != nil {
        t.Fatalf("expected no error, got: %v", err)
    }
}

func TestService_ProcessMessage_StoreError(t *testing.T) {
    store := &mockEventStore{
        appendFunc: func(ctx context.Context, event *Event) error {
            return errors.New("database connection failed")
        },
    }
    svc := NewService(store)

    err := svc.ProcessMessage(context.Background(), &Message{Body: "test"})
    if err == nil {
        t.Fatal("expected error, got nil")
    }
    if !strings.Contains(err.Error(), "database connection failed") {
        t.Errorf("expected database error, got: %v", err)
    }
}

func TestService_ProcessMessage_EmptyBody(t *testing.T) {
    svc := NewService(&mockEventStore{})

    err := svc.ProcessMessage(context.Background(), &Message{Body: ""})
    if err == nil {
        t.Fatal("expected validation error for empty body")
    }
}
```

**Use table-driven tests for parameter rainbow-testing**

Reserve table-driven tests for scenarios where you need to test multiple parameter combinations, input variations, or edge cases:

```go
func TestClassifier_Classify(t *testing.T) {
    // Table-driven test appropriate here because we're testing
    // various keyword combinations, rule configurations, and classification scenarios
    tests := []struct {
        name     string
        message  string
        rules    []*Rule
        want     []Classification
        wantErr  bool
    }{
        {
            name:    "HVAC keywords detected",
            message: "My furnace is broken and the AC won't turn on",
            rules: []*Rule{
                {Class: "equipment_type", Value: "hvac", Keywords: []string{"furnace", "ac"}},
            },
            want: []Classification{
                {Class: "equipment_type", Value: "hvac", Confidence: 1.0},
            },
        },
        {
            name:    "Multiple matches with priorities",
            message: "Emergency plumbing leak in kitchen",
            rules: []*Rule{
                {Class: "severity", Value: "urgent", Keywords: []string{"emergency"}},
                {Class: "equipment_type", Value: "plumbing", Keywords: []string{"plumbing", "leak"}},
            },
            want: []Classification{
                {Class: "severity", Value: "urgent", Confidence: 1.0},
                {Class: "equipment_type", Value: "plumbing", Confidence: 1.0},
            },
        },
        {
            name:    "Case insensitive matching",
            message: "FURNACE not working",
            rules:   []*Rule{{Class: "equipment_type", Value: "hvac", Keywords: []string{"furnace"}}},
            want:    []Classification{{Class: "equipment_type", Value: "hvac", Confidence: 1.0}},
        },
        {
            name:    "No matches returns empty",
            message: "Hello, how are you?",
            rules:   []*Rule{{Class: "equipment_type", Value: "hvac", Keywords: []string{"furnace"}}},
            want:    []Classification{},
        },
        {
            name:    "Empty message",
            message: "",
            rules:   []*Rule{{Class: "equipment_type", Value: "hvac", Keywords: []string{"furnace"}}},
            want:    []Classification{},
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            c := NewClassifier(tt.rules)
            got, err := c.Classify(context.Background(), &Message{Body: tt.message})

            if (err != nil) != tt.wantErr {
                t.Errorf("Classify() error = %v, wantErr %v", err, tt.wantErr)
                return
            }

            if !reflect.DeepEqual(got, tt.want) {
                t.Errorf("Classify() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

**When to use each approach:**
- **Standard function tests**: Single scenarios, error paths, integration tests, behavior verification
- **Table-driven tests**: Input validation with many edge cases, parser/classifier logic, format conversions, mathematical functions with various inputs

**Create reusable stubs and fakes in testing.go files**

Don't create per-test mocks with function fields. Instead, create reusable test implementations co-located with the interface definition in a `testing.go` file:

```go
// event/testing.go - Co-located with the EventStore interface
package event

import "context"

// StubEventStore is a reusable test implementation of EventStore.
// Use it for tests that don't care about event storage details.
type StubEventStore struct {
    AppendFunc func(ctx context.Context, event *Event) error
    Events     []*Event // Captured events for verification
}

func NewStubEventStore() *StubEventStore {
    return &StubEventStore{
        Events: make([]*Event, 0),
        AppendFunc: func(ctx context.Context, event *Event) error {
            return nil // Default: success
        },
    }
}

func (s *StubEventStore) Append(ctx context.Context, event *Event) error {
    s.Events = append(s.Events, event)
    return s.AppendFunc(ctx, event)
}

// FakeEventStore is an in-memory implementation for integration tests.
// Use it when you need realistic event storage behavior.
type FakeEventStore struct {
    events map[string][]*Event // conversationID -> events
}

func NewFakeEventStore() *FakeEventStore {
    return &FakeEventStore{
        events: make(map[string][]*Event),
    }
}

func (f *FakeEventStore) Append(ctx context.Context, event *Event) error {
    if event.ConversationID == "" {
        return errors.New("conversation_id required")
    }
    f.events[event.ConversationID] = append(f.events[event.ConversationID], event)
    return nil
}

func (f *FakeEventStore) GetEvents(conversationID string) []*Event {
    return f.events[conversationID]
}
```

**Use stubs in tests**

```go
// conversation/service_test.go
func TestService_ProcessMessage_Success(t *testing.T) {
    store := event.NewStubEventStore()
    svc := NewService(store)

    err := svc.ProcessMessage(context.Background(), &Message{Body: "test"})
    if err != nil {
        t.Fatalf("expected no error, got: %v", err)
    }

    if len(store.Events) != 1 {
        t.Fatalf("expected 1 event, got %d", len(store.Events))
    }
}

func TestService_ProcessMessage_StoreError(t *testing.T) {
    store := event.NewStubEventStore()
    store.AppendFunc = func(ctx context.Context, event *Event) error {
        return errors.New("database connection failed")
    }
    svc := NewService(store)

    err := svc.ProcessMessage(context.Background(), &Message{Body: "test"})
    if err == nil {
        t.Fatal("expected error, got nil")
    }
}

func TestService_ProcessMessage_Integration(t *testing.T) {
    // Use the fake for more realistic behavior
    store := event.NewFakeEventStore()
    svc := NewService(store)

    msg := &Message{Body: "test", ConversationID: "conv123"}
    err := svc.ProcessMessage(context.Background(), msg)
    if err != nil {
        t.Fatalf("expected no error, got: %v", err)
    }

    events := store.GetEvents("conv123")
    if len(events) != 1 {
        t.Fatalf("expected 1 event in store, got %d", len(events))
    }
}
```

**CRITICAL: Always check errors in test setup**

Test setup operations (creating test data, configuring mocks, etc.) can fail. Always check these errors and fail the test early with `t.Fatalf()`:

```go
// BAD - ignoring setup errors
func TestPermissionCheck(t *testing.T) {
    roleRepo := NewFakeRoleRepository()
    testRole, _ := role.New("role1", "tenant1", "Owner", true, permissions, nil)
    roleRepo.Create(context.Background(), testRole) // Error ignored!

    // Test continues with potentially invalid setup
    result := checkPermission(roleRepo, "role1", "messages", "send")
    // ...
}

// GOOD - checking setup errors
func TestPermissionCheck(t *testing.T) {
    roleRepo := NewFakeRoleRepository()
    testRole, err := role.New("role1", "tenant1", "Owner", true, permissions, nil)
    if err != nil {
        t.Fatalf("Failed to create test role: %v", err)
    }

    if err := roleRepo.Create(context.Background(), testRole); err != nil {
        t.Fatalf("Failed to save test role: %v", err)
    }

    // Test continues with guaranteed valid setup
    result := checkPermission(roleRepo, "role1", "messages", "send")
    // ...
}

// BAD - ignoring cache setup error
func TestCacheInvalidation(t *testing.T) {
    cache := NewFakeRedisAdapter()
    cache.Set("key", "value", 300) // Error ignored!

    // Test may have invalid assumptions
    service.InvalidateCache(ctx, "key")
    // ...
}

// GOOD - checking cache setup error
func TestCacheInvalidation(t *testing.T) {
    cache := NewFakeRedisAdapter()
    if err := cache.Set("key", "value", 300); err != nil {
        t.Fatalf("Failed to setup cache: %v", err)
    }

    // Test proceeds with valid cache state
    if err := service.InvalidateCache(ctx, "key"); err != nil {
        t.Fatalf("Failed to invalidate cache: %v", err)
    }
    // ...
}
```

**Why this matters:**
- **Prevents silent failures**: If setup fails, you want to know immediately, not get confusing test failures later
- **Clear diagnostics**: `t.Fatalf()` tells you exactly what went wrong during setup
- **Matches production standards**: Tests should follow the same error-checking discipline as production code
- **Catches bugs early**: Setup errors often indicate real problems with your test helpers or fakes

**Benefits of this approach:**
- **Reusability**: Share test implementations across all test files
- **Consistency**: Same test behavior throughout the codebase
- **Discoverability**: Easy to find test helpers (`event.NewStubEventStore()`)
- **Maintainability**: Update once when interface changes
- **Documentation**: Test implementations show how to use the interface

### 8. Configuration and Initialization

**Use `init()` sparingly - only for registration**
```go
// Good use: Register transport adapters
func init() {
    RegisterAdapter("sms", NewSMSAdapter)
    RegisterAdapter("email", NewEmailAdapter)
}

// Bad use: Loading config, making network calls
// Instead, do this in main() or explicit Init() functions
```

**Environment-based configuration**
```go
type Config struct {
    DatabaseURL      string
    KafkaBrokers     []string
    TwilioAccountSID string
    LogLevel         string
}

func LoadConfig() (*Config, error) {
    cfg := &Config{
        DatabaseURL:      os.Getenv("DATABASE_URL"),
        KafkaBrokers:     strings.Split(os.Getenv("KAFKA_BROKERS"), ","),
        TwilioAccountSID: os.Getenv("TWILIO_ACCOUNT_SID"),
        LogLevel:         getEnvOrDefault("LOG_LEVEL", "info"),
    }

    if cfg.DatabaseURL == "" {
        return nil, errors.New("DATABASE_URL is required")
    }

    return cfg, nil
}

func getEnvOrDefault(key, defaultValue string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return defaultValue
}
```

### 9. Logging and Observability

**Use structured logging (slog)**
```go
func (s *Service) ProcessMessage(ctx context.Context, msg *Message) error {
    s.logger.InfoContext(ctx, "processing message",
        "message_id", msg.ID,
        "tenant_id", msg.TenantID,
        "conversation_id", msg.ConversationID,
    )

    if err := s.enrich(ctx, msg); err != nil {
        s.logger.ErrorContext(ctx, "enrichment failed",
            "message_id", msg.ID,
            "error", err,
        )
        return err
    }

    return nil
}
```

**Add tracing context**
```go
import "go.opentelemetry.io/otel"

func (s *Service) ProcessMessage(ctx context.Context, msg *Message) error {
    ctx, span := otel.Tracer("myapp").Start(ctx, "ProcessMessage")
    defer span.End()

    span.SetAttributes(
        attribute.String("message.id", msg.ID),
        attribute.String("tenant.id", msg.TenantID),
    )

    // Process with traced context
    return s.process(ctx, msg)
}
```

## Security Patterns

### Input Validation
```go
func validateConversationID(id string) error {
    if id == "" {
        return errors.New("conversation_id is required")
    }

    // CUID format validation
    if !cuidRegex.MatchString(id) {
        return errors.New("invalid conversation_id format")
    }

    return nil
}
```

### SQL Injection Prevention
```go
// ALWAYS use parameterized queries
func (s *Store) GetByID(ctx context.Context, tenantID, conversationID string) (*Conversation, error) {
    var c Conversation
    err := s.db.QueryRowContext(ctx, `
        SELECT id, tenant_id, created_at
        FROM conversations
        WHERE tenant_id = $1 AND id = $2
    `, tenantID, conversationID).Scan(&c.ID, &c.TenantID, &c.CreatedAt)

    return &c, err
}

// NEVER concatenate user input into SQL
// BAD: query := "SELECT * FROM conversations WHERE id = '" + id + "'"
```

### Tenant Isolation Enforcement
```go
func (s *Store) List(ctx context.Context, tenantID string) ([]*Conversation, error) {
    // ALWAYS filter by tenant_id from context
    // NEVER trust client-provided tenant_id

    rows, err := s.db.QueryContext(ctx, `
        SELECT id, tenant_id, created_at
        FROM conversations
        WHERE tenant_id = $1
    `, tenantID)

    // ... scan rows
}
```

### XSS Prevention
```go
import "html"

func sanitizeMessageBody(body string) string {
    // HTML-escape user input before storage/display
    return html.EscapeString(body)
}
```

## Performance Patterns

### Use sync.Pool for frequent allocations
```go
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func processMessage(msg *Message) error {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufferPool.Put(buf)
    }()

    // Use buffer
    buf.WriteString(msg.Body)
    // ...
}
```

### Batch database operations
```go
func (s *Store) InsertBatch(ctx context.Context, events []*Event) error {
    if len(events) == 0 {
        return nil
    }

    stmt, err := s.db.PrepareContext(ctx, `
        INSERT INTO events (id, tenant_id, event_type, payload)
        VALUES ($1, $2, $3, $4)
    `)
    if err != nil {
        return err
    }
    defer stmt.Close()

    for _, event := range events {
        if _, err := stmt.ExecContext(ctx, event.ID, event.TenantID, event.Type, event.Payload); err != nil {
            return err
        }
    }

    return nil
}
```

## Anti-Patterns to Avoid

### Don't use panic for normal errors
```go
// BAD
func getConversation(id string) *Conversation {
    conv, err := store.Get(id)
    if err != nil {
        panic(err) // Never do this in business logic
    }
    return conv
}

// GOOD
func getConversation(id string) (*Conversation, error) {
    return store.Get(id)
}
```

### Don't ignore errors - EVER
```go
// BAD - production code
store.Save(conversation)

// GOOD - production code
if err := store.Save(conversation); err != nil {
    return fmt.Errorf("failed to save conversation: %w", err)
}

// BAD - test code
roleRepo.Create(ctx, testRole)

// GOOD - test code
if err := roleRepo.Create(ctx, testRole); err != nil {
    t.Fatalf("Failed to create test role: %v", err)
}

// BAD - ignoring error with blank identifier
_ = cache.Set(key, value, ttl)

// GOOD - handle it or fail
if err := cache.Set(key, value, ttl); err != nil {
    return fmt.Errorf("failed to cache value: %w", err)
}
```

**The `errcheck` linter will catch ignored errors.** If you see an `errcheck` violation, it means you're ignoring an error return value - fix it immediately. This applies to ALL code: production, tests, examples, and utilities.

### Don't use global state
```go
// BAD
var db *sql.DB

func init() {
    db = connectDatabase() // Global mutable state
}

// GOOD
type Service struct {
    db *sql.DB
}

func NewService(db *sql.DB) *Service {
    return &Service{db: db}
}
```

### Don't start goroutines without lifecycle management
```go
// BAD
go processForever() // No way to stop

// GOOD
func (s *Service) Start(ctx context.Context) {
    go func() {
        for {
            select {
            case <-ctx.Done():
                return
            case msg := <-s.messages:
                s.process(ctx, msg)
            }
        }
    }()
}
```

## Quick Reference

### Essential Packages
- `context` - Request lifecycle, cancellation, tenant/user context
- `database/sql` - PostgreSQL access
- `encoding/json` - JSON serialization (event payloads)
- `errors` - Error wrapping and inspection
- `fmt` - String formatting, error messages
- `log/slog` - Structured logging
- `net/http` - HTTP API server
- `sync` - Mutexes, WaitGroups, Pool
- `time` - Timestamps, timeouts, rate limiting

### Third-Party Packages
- `github.com/lib/pq` - PostgreSQL driver
- `github.com/segmentio/kafka-go` - Kafka client for event streaming
- `golang.org/x/time/rate` - Rate limiting
- `go.opentelemetry.io/otel` - Distributed tracing

---

## Summary: Building the Go Way

1. **Keep it simple** - Prefer straightforward code over clever abstractions
2. **Handle errors explicitly** - Return errors, wrap with context, never ignore
3. **Use interfaces sparingly** - Define where consumed, keep them small
4. **Leverage concurrency safely** - Goroutines + channels for parallelism, but manage lifecycle
5. **Enforce security at every layer** - Validate input, parameterize queries, isolate tenants
6. **Test thoroughly** - Standard function tests for clarity, table-driven for parameter variations, reusable stubs/fakes in testing.go files, test error paths
7. **Log with structure** - Use slog for queryable logs in production
8. **Follow conventions** - Use gofmt, follow naming rules, write idiomatic Go
