package config

// OAuthConfig holds OAuth provider configuration
type OAuthConfig struct {
	Google   GoogleOAuthConfig
	LinkedIn LinkedInOAuthConfig
	GitHub   GitHubOAuthConfig
}

// GoogleOAuthConfig holds Google OAuth configuration
type GoogleOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL string
	Scopes       []string
}

// LinkedInOAuthConfig holds LinkedIn OAuth configuration
type LinkedInOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL string
	Scopes       []string
}

// GitHubOAuthConfig holds GitHub OAuth configuration
type GitHubOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL string
	Scopes       []string
}

// LoadOAuthConfig loads OAuth configuration from environment variables
func LoadOAuthConfig() *OAuthConfig {
	return &OAuthConfig{
		Google: GoogleOAuthConfig{
			ClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
			ClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
			RedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/v1/auth/oauth/google/callback"),
			Scopes:       []string{"openid", "profile", "email"},
		},
		LinkedIn: LinkedInOAuthConfig{
			ClientID:     getEnv("LINKEDIN_CLIENT_ID", ""),
			ClientSecret: getEnv("LINKEDIN_CLIENT_SECRET", ""),
			RedirectURL:  getEnv("LINKEDIN_REDIRECT_URL", "http://localhost:8080/api/v1/auth/oauth/linkedin/callback"),
			Scopes:       []string{"openid", "profile", "email"},
		},
		GitHub: GitHubOAuthConfig{
			ClientID:     getEnv("GITHUB_CLIENT_ID", ""),
			ClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
			RedirectURL:  getEnv("GITHUB_REDIRECT_URL", "http://localhost:8080/api/v1/auth/oauth/github/callback"),
			Scopes:       []string{"user:email", "read:user"},
		},
	}
}
