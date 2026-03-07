package auth

import (
	"context"
	"log/slog"
)

// LogPasswordResetEmailSender is a development implementation of PasswordResetEmailSender
// that logs the reset token to stdout instead of sending a real email. It is intended
// for use in local development and should not be used in production.
type LogPasswordResetEmailSender struct {
	logger *slog.Logger
}

// NewLogPasswordResetEmailSender creates a LogPasswordResetEmailSender backed by logger.
func NewLogPasswordResetEmailSender(logger *slog.Logger) *LogPasswordResetEmailSender {
	return &LogPasswordResetEmailSender{logger: logger}
}

// SendPasswordResetEmail logs the reset token to stdout.
func (s *LogPasswordResetEmailSender) SendPasswordResetEmail(ctx context.Context, toEmail, rawToken string) error {
	s.logger.InfoContext(ctx, "password reset requested",
		"to", toEmail,
		"reset_token", rawToken,
	)
	return nil
}
