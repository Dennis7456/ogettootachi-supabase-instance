
## 🔐 Environment Configuration

### Secret Management

1. **Never Commit Secrets**
   - Copy `.env.example` to `.env`
   - Replace all placeholder values with your actual secrets
   - Add `.env` to `.gitignore`

2. **Environment Variables**
   - Use different configurations for development and production
   - Rotate secrets every 90 days
   - Use a secure secret management system in production

### Setting Up Your Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Replace placeholders in `.env` with your actual credentials

3. Verify your configuration:
   ```bash
   # Check Supabase configuration
   supabase status
   
   # Validate environment setup
   ./scripts/setup-env.sh dev
   ```

### Security Best Practices

- Use unique, complex secrets for each environment
- Never share your `.env` file
- Use environment-specific secret rotation scripts
- Implement multi-factor authentication
- Regularly audit and rotate access tokens

### Troubleshooting

If you encounter issues with secrets:
- Verify all required environment variables are set
- Check that your secrets are correctly configured
- Use the secret rotation scripts to regenerate keys

