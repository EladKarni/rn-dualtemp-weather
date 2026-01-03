# Plan: Add CI/CD Pipeline

## Goal
Implement automated checks and deployment for the React Native weather app.

## Phase 1: Basic GitHub Actions Workflow (Week 1)

### 1.1 Create PR Checks Workflow
**File**: `.github/workflows/pr-checks.yml`

```yaml
name: PR Checks
on:
  pull_request:
    branches: [main, master]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: TypeScript check
        run: yarn tsc --noEmit

      - name: Run tests
        run: yarn test --passWithNoTests
```

### 1.2 Add Basic Scripts to package.json
```json
{
  "scripts": {
    "test": "jest",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  }
}
```

**Estimated Time**: 2 hours

## Phase 2: EAS Build Integration (Week 1-2)

### 2.1 Add EAS Build Workflow
**File**: `.github/workflows/eas-build.yml`

```yaml
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: yarn install

      - name: Build preview
        run: eas build --platform android --profile preview --non-interactive
```

### 2.2 Required GitHub Secrets
Add to repository settings → Secrets:
- `EXPO_TOKEN` - Get from `eas whoami` or Expo dashboard
- `SENTRY_AUTH_TOKEN` - From Sentry project settings

**Estimated Time**: 3 hours

## Phase 3: Environment Management (Week 2)

### 3.1 Create EAS Build Profiles
**File**: `eas.json`

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SENTRY_DSN": ""
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SENTRY_DSN": "$SENTRY_DSN"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SENTRY_DSN": "$SENTRY_DSN"
      }
    }
  }
}
```

### 3.2 Add Environment Variables to EAS
```bash
# Run locally or in CI
eas secret:create --name SENTRY_DSN --value "your-dsn" --type string
eas secret:create --name SENTRY_AUTH_TOKEN --value "your-token" --type string
```

**Estimated Time**: 2 hours

## Phase 4: Deployment Automation (Week 3)

### 4.1 Add Release Workflow
**File**: `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: yarn install

      - name: Build and submit to stores
        run: |
          eas build --platform all --profile production --non-interactive
          eas submit --platform all --latest
```

**Estimated Time**: 4 hours

## Phase 5: Automated Testing in CI (Week 3-4)

### 5.1 Enhance PR Checks with Coverage
```yaml
- name: Run tests with coverage
  run: yarn test --coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### 5.2 Add Test Results Reporting
```yaml
- name: Publish test results
  uses: dorny/test-reporter@v1
  if: success() || failure()
  with:
    name: Jest Tests
    path: junit.xml
    reporter: jest-junit
```

**Estimated Time**: 2 hours

## Complete Workflow Files

### Minimal PR Checks (Start Here)
```yaml
# .github/workflows/pr-checks.yml
name: PR Checks

on:
  pull_request:
    branches: [main, master]

jobs:
  check:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: TypeScript check
        run: yarn tsc --noEmit

      - name: Run tests
        run: yarn test --passWithNoTests

      - name: Check bundle size
        run: yarn expo export --platform web --dev false
```

## Success Metrics

- ✅ All PRs must pass TypeScript checks
- ✅ Tests run automatically on every PR
- ✅ Preview builds created for main branch
- ✅ Production builds automated on tags
- ✅ Build time < 15 minutes
- ✅ Zero secrets in repository

## Cost Estimation

- GitHub Actions: Free for public repos, $0.008/min for private
- EAS Build: Free tier (30 builds/month) or $29/month unlimited
- **Total**: $0-29/month

## Migration Path

1. **Week 1**: Add basic PR checks (TypeScript)
2. **Week 2**: Add EAS build integration
3. **Week 3**: Add automated deployments
4. **Week 4**: Add test coverage reporting

## Rollback Plan

If CI/CD causes issues:
1. Disable workflows (rename `.github/workflows` to `.github/workflows.disabled`)
2. Continue manual builds with `eas build`
3. Fix issues offline, re-enable when ready

## Dependencies

- EAS CLI installed: `npm install -g eas-cli`
- Expo account with project created
- GitHub repository with Actions enabled
- Sentry project created

## Next Steps

1. Create `.github/workflows` directory
2. Add `pr-checks.yml` (copy from above)
3. Commit and push to feature branch
4. Open PR to test workflow
5. Iterate based on results
