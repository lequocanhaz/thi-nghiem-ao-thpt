CREATE TABLE assistant_secrets (id TEXT PRIMARY KEY, private_jwk TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE assistant_usage (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
