package db

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"testing"
)

// fakeDriver is a minimal database/sql driver used for testing without a real
// database. It registers under a unique per-test name.
type fakeDriver struct {
	pingErr error
}

// fakeConn is a minimal driver.Conn that also implements driver.Pinger so
// the *sql.DB.Ping call flows through to our fake.
type fakeConn struct {
	pingErr error
}

func (c *fakeConn) Prepare(query string) (driver.Stmt, error) { return nil, nil }
func (c *fakeConn) Close() error                              { return nil }
func (c *fakeConn) Begin() (driver.Tx, error)                 { return nil, nil }
func (c *fakeConn) Ping(_ context.Context) error              { return c.pingErr }

type fakeDriverImpl struct {
	d *fakeDriver
}

func (w *fakeDriverImpl) Open(_ string) (driver.Conn, error) {
	return &fakeConn{pingErr: w.d.pingErr}, nil
}

// registerFakeDriver registers a fake sql driver under a unique per-test name
// and returns the driver name for use with openWithOpener.
func registerFakeDriver(t *testing.T, d *fakeDriver) string {
	t.Helper()
	name := "fake-" + t.Name()
	sql.Register(name, &fakeDriverImpl{d: d})
	return name
}

// fakePool is a test double for dbPool that returns configurable errors.
type fakePool struct {
	pingErr  error
	closeErr error
}

func (f *fakePool) PingContext(_ context.Context) error { return f.pingErr }
func (f *fakePool) Close() error                        { return f.closeErr }

// TestOpen_Success verifies that openWithOpener succeeds when the driver opens
// and pings without error. The returned DB must be non-nil and DB() must be non-nil.
func TestOpen_Success(t *testing.T) {
	driverName := registerFakeDriver(t, &fakeDriver{})

	d, err := openWithOpener(driverName, "fake://test", func(drv, dsn string) (*sql.DB, error) {
		return sql.Open(drv, dsn)
	})
	if err != nil {
		t.Fatalf("openWithOpener() returned unexpected error: %v", err)
	}
	if d == nil {
		t.Fatal("openWithOpener() returned nil DB")
	}
	if d.DB() == nil {
		t.Error("DB() returned nil")
	}
}

// TestOpen_PublicFunction verifies that the public Open function delegates to
// openWithOpener (tests the thin wrapper by triggering an expected error).
func TestOpen_PublicFunction(t *testing.T) {
	_, err := Open("postgres", "postgres://invalid:invalid@localhost:1/nodb?sslmode=disable")
	if err == nil {
		t.Fatal("expected error from Open with invalid DSN, got nil")
	}
}

// TestOpen_OpenerError verifies that openWithOpener wraps errors from sql.Open.
func TestOpen_OpenerError(t *testing.T) {
	wantErr := errors.New("open failed")

	_, err := openWithOpener("ignored", "ignored", func(drv, dsn string) (*sql.DB, error) {
		return nil, wantErr
	})
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped open error, got: %v", err)
	}
}

// TestOpen_PingError verifies that openWithOpener returns an error when the
// initial ping fails after a successful open.
func TestOpen_PingError(t *testing.T) {
	driverName := registerFakeDriver(t, &fakeDriver{pingErr: errors.New("connection refused")})

	_, err := openWithOpener(driverName, "fake://test", func(drv, dsn string) (*sql.DB, error) {
		return sql.Open(drv, dsn)
	})
	if err == nil {
		t.Fatal("expected ping error, got nil")
	}
}

// TestPing_Success verifies that Ping delegates to the underlying pool and
// returns nil on success.
func TestPing_Success(t *testing.T) {
	pool := &fakePool{}
	d := newWithPool(pool, nil)

	if err := d.Ping(context.Background()); err != nil {
		t.Errorf("Ping() returned unexpected error: %v", err)
	}
}

// TestPing_Error verifies that Ping returns a wrapped error when the underlying
// pool ping fails.
func TestPing_Error(t *testing.T) {
	wantErr := errors.New("ping refused")
	pool := &fakePool{pingErr: wantErr}
	d := newWithPool(pool, nil)

	err := d.Ping(context.Background())
	if err == nil {
		t.Fatal("expected error from Ping, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestClose_Success verifies that Close returns nil when the pool closes without error.
func TestClose_Success(t *testing.T) {
	pool := &fakePool{}
	d := newWithPool(pool, nil)

	if err := d.Close(); err != nil {
		t.Errorf("Close() returned unexpected error: %v", err)
	}
}

// TestClose_Error verifies that Close wraps and returns the underlying error
// when the pool close fails.
func TestClose_Error(t *testing.T) {
	wantErr := errors.New("close failed")
	pool := &fakePool{closeErr: wantErr}
	d := newWithPool(pool, nil)

	err := d.Close()
	if err == nil {
		t.Fatal("expected error from Close, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestDB_ReturnsUnderlyingSQLDB verifies that DB() exposes the raw *sql.DB.
func TestDB_ReturnsUnderlyingSQLDB(t *testing.T) {
	driverName := registerFakeDriver(t, &fakeDriver{})
	sqlDB, err := sql.Open(driverName, "fake://test")
	if err != nil {
		t.Fatalf("sql.Open failed: %v", err)
	}
	defer func() {
		if err := sqlDB.Close(); err != nil {
			t.Errorf("closing sqlDB: %v", err)
		}
	}()

	d := newWithPool(&fakePool{}, sqlDB)
	if d.DB() != sqlDB {
		t.Error("DB() did not return the expected *sql.DB")
	}
}
