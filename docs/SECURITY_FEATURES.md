# Security Features

## 1. Authentication & Authorization

### JWT (JSON Web Token) Authentication
```
Implementation:
- Access Token: 60 minutes expiry
- Refresh Token: 7 days expiry
- Token Rotation: Enabled
- Blacklist after rotation: Enabled
- Algorithm: HS256
- Signing Key: Django SECRET_KEY

Token Structure:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "role": "admin",
  "email": "admin@example.com"
}
```

### Role-Based Access Control (RBAC)
```
Roles:
1. Admin
   - Full system access
   - User management
   - Model deployment
   - View all analytics
   - System configuration

2. Researcher
   - Upload datasets
   - Train models
   - View model metrics
   - View analytics
   - Cannot deploy models

3. User
   - Make predictions
   - View own history
   - View basic analytics
   - Cannot train models
   - Cannot manage users

Implementation:
- Decorators on API views
- Middleware checks
- Frontend route protection
- Database-level permissions
```

### Password Security
```
Hashing Algorithm:
- PBKDF2 (Password-Based Key Derivation Function 2)
- Iterations: 100,000 (Django default)
- Salt: Automatically generated
- Hash length: 128 characters

Password Requirements:
- Minimum length: 8 characters
- Django validators enabled:
  * UserAttributeSimilarityValidator
  * MinimumLengthValidator
  * CommonPasswordValidator
  * NumericPasswordValidator
```

## 2. API Security

### Request Validation
```
Input Validation:
- DRF serializers for all inputs
- Type checking
- Length constraints
- Format validation (email, URL, etc.)
- Required field validation

Example:
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8
    )
```

### SQL Injection Prevention
```
Protection Methods:
1. Django ORM (Object-Relational Mapping)
   - Parameterized queries by default
   - No raw SQL in application code
   - Built-in escaping

2. Example Safe Query:
   users = User.objects.filter(username=username)
   
   # NOT vulnerable to SQL injection
   # Django handles parameterization automatically
```

### XSS (Cross-Site Scripting) Prevention
```
Protection Methods:
1. Django Template Auto-escaping
   - HTML entities escaped by default
   - Safe filter used only when necessary

2. React JSX Auto-escaping
   - Content automatically escaped
   - dangerouslySetInnerHTML used sparingly

3. Content Security Policy (CSP) (future)
   - Restrict script sources
   - Prevent inline scripts
   - Control external resources
```

### CSRF (Cross-Site Request Forgery) Protection
```
Implementation:
- Django CSRF middleware enabled
- CSRF tokens in forms
- SameSite cookie attribute
- Verified on state-changing requests

Frontend Implementation:
axios.defaults.headers.common['X-CSRFToken'] = getCookie('csrftoken')
```

## 3. Data Security

### Encryption at Rest
```
Database Encryption:
- PostgreSQL: Transparent Data Encryption (TDE) (production)
- Password hashes: Already encrypted (PBKDF2)
- Sensitive fields: Consider field-level encryption (future)

File Storage:
- Media files: Stored securely
- Model files: Protected directory
- Access control via Django permissions
```

### Encryption in Transit
```
HTTPS/TLS:
- SSL/TLS certificates (production)
- HTTPS enforced
- HSTS (HTTP Strict Transport Security) (future)
- Secure cookie flags

Configuration:
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### Data Masking
```
Sensitive Data Handling:
- Passwords: Never logged or displayed
- API Keys: Environment variables only
- User PII: Limited access
- Logs: Sanitized before storage

Example:
logger.info(f"User {user.username} logged in")  # Safe
logger.info(f"User {user.username} with password {password}")  # NEVER
```

## 4. API Rate Limiting (Future Enhancement)

### Implementation Plan
```
Rate Limiting Strategy:
- Per-user rate limits
- Per-IP rate limits
- Endpoint-specific limits
- Burst allowance

Configuration:
- 100 requests per minute per user
- 1000 requests per hour per IP
- Stricter limits on expensive endpoints

Implementation:
- Django Ratelimit or DRF throttling
- Redis for distributed tracking
- Custom middleware for enforcement
```

## 5. File Upload Security

### File Validation
```
Validation Checks:
1. File type validation
   - Allowed: PNG, JPG, JPEG
   - MIME type verification
   - Magic number verification

2. File size limits
   - Maximum: 5MB
   - Enforced at multiple levels

3. Filename sanitization
   - Remove special characters
   - Prevent directory traversal
   - Generate safe filenames

Implementation:
ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
```

### Secure File Storage
```
Storage Security:
- Files stored outside web root
- Access via Django views only
- Permission checks on access
- Random filename generation

Configuration:
MEDIA_ROOT = '/app/media/'
MEDIA_URL = '/media/'
```

## 6. Session Security

### Session Management
```
Session Configuration:
- Secure cookies (HTTPS only)
- HttpOnly cookies (prevent XSS)
- SameSite attribute (prevent CSRF)
- Session expiration

Django Settings:
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
```

### Session Timeout
```
JWT Token Expiry:
- Access token: 60 minutes
- Refresh token: 7 days
- Automatic refresh mechanism
- Manual logout option

Implementation:
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

## 7. Logging and Monitoring

### Security Logging
```
Log Events:
- Failed login attempts
- Successful logins
- Permission denials
- Suspicious activities
- API errors

Implementation:
import logging

logger = logging.getLogger('security')
logger.warning(f"Failed login attempt for {username}")
```

### Audit Trail
```
Audit Logging:
- User actions
- Model changes
- Data access
- System configuration changes

Database Tables:
- AuditLog model (future)
- Track who did what when
- Immutable records
```

## 8. Dependency Security

### Vulnerability Scanning
```
Tools:
- pip-audit (Python)
- npm audit (JavaScript)
- Snyk (optional)
- Dependabot (GitHub)

Regular Updates:
- Weekly dependency checks
- Security patches applied promptly
- Version pinning in requirements.txt
```

### Secure Dependencies
```
Dependency Management:
- Use official package repositories
- Verify package integrity
- Regular security updates
- Remove unused dependencies

Example:
pip install --upgrade pip
pip-audit
```

## 9. Infrastructure Security

### Docker Security
```
Container Security:
- Minimal base images
- Non-root user in containers
- Read-only filesystems (where possible)
- Resource limits
- Network isolation

Configuration:
FROM python:3.9-slim
USER appuser
```

### Network Security
```
Network Configuration:
- Internal network isolation
- Firewall rules
- VPN access (production)
- Private subnets

Docker Networks:
networks:
  hdc_network:
    driver: bridge
    internal: false
```

## 10. Production Security Checklist

### Before Deployment
```
□ Change default SECRET_KEY
□ Set DEBUG = False
□ Configure ALLOWED_HOSTS
□ Enable HTTPS/SSL
□ Set up database backups
□ Configure logging
□ Enable security headers
□ Set up monitoring
□ Review user permissions
□ Test authentication flow
□ Verify file upload security
□ Check CORS configuration
□ Review API documentation
```

### Security Headers
```
HTTP Headers:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'

Django Middleware:
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_SSL_REDIRECT = True
```

## 11. Incident Response Plan

### Security Incident Response
```
1. Detection
   - Monitoring alerts
   - User reports
   - Automated scans

2. Containment
   - Isolate affected systems
   - Disable compromised accounts
   - Block malicious IPs

3. Investigation
   - Analyze logs
   - Determine scope
   - Identify root cause

4. Recovery
   - Restore from backups
   - Patch vulnerabilities
   - Update security measures

5. Post-Incident
   - Document lessons learned
   - Update security policies
   - Train staff
```

## 12. Compliance Considerations

### Data Protection
```
GDPR Compliance (if applicable):
- User consent for data collection
- Right to data deletion
- Data portability
- Privacy by design
- Data breach notification

Implementation:
- Privacy policy
- Cookie consent
- Data retention policies
- User data export
```

### Accessibility
```
Security vs Accessibility:
- Maintain accessibility while securing
- WCAG compliance
- Screen reader compatibility
- Keyboard navigation
```
