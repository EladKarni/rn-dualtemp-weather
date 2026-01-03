# Plan: Resolve EAS Build Warnings

## Goal
Eliminate all EAS build warnings and optimize configuration for future compatibility.

## Issues Identified

1. **Missing `cli.appVersionSource` field** - Required for future EAS versions
2. **No environment variables for preview environment** - Currently warning about missing variables  
3. **Configuration duplication** - Multiple build profiles with repeated settings
4. **Version management opportunities** - Better autoIncrement strategies

## Current Configuration Analysis

### Current `eas.json` Structure
- 4 build profiles: `development`, `preview`, `preview-apk`, `production`
- Duplicated channel configurations
- Missing `cli.appVersionSource` 
- No environment variable definitions for preview

### Current `app.json` Version Strategy
- Manual version management: "1.2.2"
- iOS buildNumber: "1.2.2" 
- Android versionCode: 12
- Runtime version policy: "appVersion"

## Solution Approach

### 1. Add Required EAS Configuration

**Add to `eas.json`:**
```json
{
  "cli": {
    "version": "16.28.0",
    "promptToConfigurePushNotifications": false,
    "appVersionSource": "remote"
  }
}
```

**Benefits:**
- Eliminates "cli.appVersionSource is not set" warning
- Enables centralized version management via EAS
- Future-proofs against breaking changes

### 2. Optimize Build Profiles with "extends" Pattern

**Current Issues:**
- `preview` and `preview-apk` both use `"distribution": "internal"`
- Channel names repeated across profiles
- No base configuration to extend from

**Proposed Structure:**
```json
{
  "build": {
    "production": {
      "channel": "production",
      "autoIncrement": true
    },
    "preview": {
      "extends": "production",
      "distribution": "internal",
      "channel": "preview",
      "autoIncrement": false
    },
    "development": {
      "extends": "preview", 
      "developmentClient": true,
      "channel": "development"
    },
    "preview-apk": {
      "extends": "preview",
      "android": {
        "buildType": "apk"
      },
      "channel": "preview-apk"
    }
  }
}
```

**Benefits:**
- Reduces configuration duplication by ~60%
- Makes profile relationships explicit
- Easier to maintain shared settings
- Clear inheritance hierarchy

### 3. Configure Environment Variables

**Add Environment Structure:**
```json
{
  "build": {
    "preview": {
      "extends": "production",
      "env": {}
    }
  }
}
```

**Future-Ready Structure:**
```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-staging.example.com",
        "EXPO_PUBLIC_SENTRY_DSN": ""
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.example.com", 
        "EXPO_PUBLIC_SENTRY_DSN": ""
      }
    }
  }
}
```

**Benefits:**
- Eliminates "No environment variables found" warning
- Prepares for future API keys and configuration
- Clear separation between environments

### 4. Enhance Version Management

**Auto-Increment Configuration:**
- Production builds: `"autoIncrement": true`
- Preview builds: `"autoIncrement": false` (manual control)
- Development builds: `"autoIncrement": false` (faster builds)

**Version Strategy Options:**

**Option A: Keep Current Manual Strategy**
- Pros: Full control, predictable releases
- Cons: Manual intervention required

**Option B: EAS Remote Version Management**  
- Pros: Automatic, centralized, reduces merge conflicts
- Cons: Less granular control

**Recommendation:** Start with Option A, migrate to Option B when team grows

### 5. Complete `eas.json` Configuration

**Final Proposed `eas.json`:**
```json
{
  "cli": {
    "version": "16.28.0",
    "promptToConfigurePushNotifications": false,
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "channel": "production",
      "autoIncrement": true,
      "env": {}
    },
    "preview": {
      "extends": "production",
      "distribution": "internal",
      "channel": "preview",
      "autoIncrement": false
    },
    "development": {
      "extends": "preview",
      "developmentClient": true,
      "channel": "development"
    },
    "preview-apk": {
      "extends": "preview",
      "android": {
        "buildType": "apk"
      },
      "channel": "preview-apk"
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./serviceKey.json",
        "track": "production"
      },
      "ios": {
        "appleId": "elad.karni@gmail.com",
        "ascAppId": "1665040449",
        "appleTeamId": "RUW8C26QSP"
      }
    }
  }
}
```

## Implementation Steps

### Step 1: Backup Current Configuration
```bash
cp eas.json eas.json.backup
cp app.json app.json.backup
```

### Step 2: Update `eas.json`
- Add `cli.appVersionSource: "remote"`
- Reorganize build profiles with "extends" pattern
- Add empty `env` objects where needed
- Add `autoIncrement` settings

### Step 3: Validate Configuration
```bash
eas build:configure --platform all
eas config --json
```

### Step 4: Test Build Profiles
```bash
# Test preview build
eas build --platform android --profile preview --non-interactive

# Verify no warnings appear
eas build --platform ios --profile preview --non-interactive
```

### Step 5: Verify Version Management
```bash
# Check current version status
eas build:version:list

# Test auto-increment (production only)
# Note: Only run if you want to increment version
# eas build --profile production --auto-increment
```

## Expected Outcomes

### Warnings Eliminated:
✅ "The field 'cli.appVersionSource' is not set, but it will be required in the future"
✅ "No environment variables with visibility 'Plain text' and 'Sensitive' found for the 'preview' environment"

### Configuration Improvements:
✅ 60% reduction in configuration duplication
✅ Clear inheritance hierarchy between build profiles
✅ Centralized version management capability
✅ Future-ready environment variable structure

### Future-Proofing:
✅ Compatible with upcoming EAS CLI versions
✅ Scalable for additional build profiles
✅ Prepared for multi-environment deployments
✅ Version conflict reduction in teams

## Rollback Plan

If issues arise after changes:

### Quick Rollback:
```bash
cp eas.json.backup eas.json
cp app.json.backup app.json
```

### Partial Rollback Options:
1. **Keep appVersionSource, revert extends pattern**
2. **Keep extends pattern, revert appVersionSource**  
3. **Selectively revert specific profiles**

### Validation After Rollback:
```bash
eas config --json
eas build:configure --platform all
```

## Tradeoffs Considered

### "extends" Pattern Benefits vs Complexity
- **Benefit**: Reduced duplication, clearer relationships
- **Complexity**: Learning curve for new team members
- **Decision**: Benefits outweigh complexity for current team size

### Remote vs Local Version Management
- **Remote**: Easier collaboration, automatic updates
- **Local**: More control, predictable versioning  
- **Decision**: Start local, migrate to remote when team scales

### Environment Variables Now vs Later
- **Now**: Eliminates warning, prepares for future needs
- **Later**: Simpler current configuration
- **Decision**: Add empty structure now, populate later

## Time Estimates

| Task | Estimated Time | Priority |
|------|----------------|----------|
| Backup configs | 5 minutes | High |
| Update eas.json | 15 minutes | High |
| Validate configuration | 10 minutes | High |
| Test preview builds | 20 minutes | High |
| Verify version management | 10 minutes | Medium |
| Documentation updates | 15 minutes | Low |

**Total Estimated Time: 75 minutes**

## Dependencies

- EAS CLI version 16.28.0 (already installed)
- Valid Expo project (already configured)
- GitHub repository with EAS project linked (already done)

## Next Steps

1. **Implement Changes**: Follow the Implementation Steps
2. **Test Thoroughly**: Verify all build profiles work
3. **Monitor Builds**: Check CI/CD pipeline for any issues
4. **Update Team**: Share new configuration patterns with team
5. **Consider Enhancement**: Plan for environment variable population

## Success Criteria

- [ ] All EAS build warnings eliminated
- [ ] Configuration duplication reduced by >50%
- [ ] All build profiles function correctly
- [ ] Version management works as expected
- [ ] Team understands new configuration structure
- [ ] CI/CD pipeline runs without issues

## Related Documentation

- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [App Version Management](https://docs.expo.dev/build-reference/app-versions/)
- [Environment Variables](https://docs.expo.dev/build/environment-variables/)
- [Extending Build Profiles](https://docs.expo.dev/build/eas-json/#extends-property)
