# Webhook Navigation Setup Guide

## Overview

The webhook administration panels are now integrated into the main navigation with admin-only access control. Only users with the `admin` role can see and access the webhook management screens.

## What Was Added

### 1. **Webhook Tabs in Navigation**
- **Webhook Dashboard** - Real-time metrics and statistics
- **Webhook History** - Event history with filtering and retry options

### 2. **Admin-Only Access Control**
- Tabs only appear for users with `role: "admin"`
- Non-admin users see "Acesso Negado" error message
- Access guard component prevents unauthorized access

### 3. **User Role Integration**
- Added `role` field to User type (`"admin"` | `"user"`)
- Role is fetched from API and stored in auth state
- Role persists through app navigation

### 4. **Icon Mappings**
- `webhook` → Material Icon "webhook"
- `history` → Material Icon "history"

## Architecture

```
app/(tabs)/_layout.tsx
├── Checks user role: user?.role === "admin"
├── Conditionally renders webhook tabs
└── Tabs use WebhookAccessGuard wrapper

WebhookAccessGuard Component
├── Checks if user is admin
├── Shows error for non-admin users
└── Renders content for admin users

webhook-dashboard.tsx & webhook-history.tsx
├── Wrapped with WebhookAccessGuard
├── Protected from unauthorized access
└── Full admin functionality available
```

## Files Modified/Created

### Modified Files
- `app/(tabs)/_layout.tsx` - Added webhook tabs with admin check
- `lib/_core/auth.ts` - Added `role` field to User type
- `lib/_core/api.ts` - Added `role` to getMe response type
- `hooks/use-auth.ts` - Preserve role from API response
- `components/ui/icon-symbol.tsx` - Added webhook icons

### New Files
- `components/webhook-access-guard.tsx` - Access control wrapper
- `tests/webhook-navigation.test.ts` - 20 unit tests

## How It Works

### 1. User Login
```typescript
// User logs in with credentials
const response = await trpc.authCustom.login.useMutation();
// Response includes: { user: { id, name, email, role: "admin" } }
```

### 2. Role Stored in Auth State
```typescript
// useAuth hook preserves role
const userInfo: Auth.User = {
  id: apiUser.id,
  role: apiUser.role,  // ← "admin" or "user"
  // ... other fields
};
```

### 3. Tab Navigation Check
```typescript
// app/(tabs)/_layout.tsx
const isAdmin = user?.role === "admin";

{isAdmin && (
  <Tabs.Screen name="webhook-dashboard" ... />
)}
```

### 4. Access Guard Protection
```typescript
// WebhookAccessGuard component
if (!isAdmin) {
  return <ErrorScreen message="Acesso Negado" />;
}
return children;
```

## User Roles

### Admin Role
- Can access webhook dashboard
- Can view webhook history
- Can retry failed webhooks
- Can process all failed webhooks
- Can view real-time metrics

### User Role
- Cannot see webhook tabs
- Cannot access webhook screens
- Gets "Acesso Negado" error if trying to access directly

## Testing

### Run Navigation Tests
```bash
pnpm test webhook-navigation
```

### Expected Output
```
✓ tests/webhook-navigation.test.ts (20 tests)
Tests  20 passed (20)
```

### Test Coverage
- ✅ Admin users can see webhook tabs
- ✅ Non-admin users cannot see webhook tabs
- ✅ Role field is properly handled
- ✅ Access guard denies non-admin access
- ✅ Icon mappings are correct
- ✅ Tab configuration is correct
- ✅ User type compatibility

## Demo Credentials

### Admin User
- Email: `admin@condominio.com`
- Password: `admin123`
- Role: `admin`
- Access: Full webhook admin functionality

### Regular User
- Email: `morador@condominio.com`
- Password: `morador123`
- Role: `user`
- Access: No webhook tabs visible

## Integration Steps

### 1. Verify Role in API Response
Check that your backend `/api/auth/me` endpoint returns:
```json
{
  "user": {
    "id": 1,
    "openId": "...",
    "name": "Admin User",
    "email": "admin@test.com",
    "role": "admin",
    "lastSignedIn": "2026-04-27T14:00:00Z"
  }
}
```

### 2. Test Admin Access
1. Login with admin credentials
2. Check that webhook tabs appear in navigation
3. Click on webhook tabs to access dashboard/history

### 3. Test Non-Admin Access
1. Login with regular user credentials
2. Verify webhook tabs are NOT visible
3. Try accessing webhook URL directly
4. Should see "Acesso Negado" error

## Customization

### Change Admin Role Name
```typescript
// In app/(tabs)/_layout.tsx
const isAdmin = user?.role === "admin"; // Change "admin" to your role name
```

### Change Error Message
```typescript
// In components/webhook-access-guard.tsx
<Text>Apenas administradores podem acessar o painel de webhooks.</Text>
// Change to your message
```

### Add More Admin-Only Screens
```typescript
// In app/(tabs)/_layout.tsx
{isAdmin && (
  <Tabs.Screen
    name="new-admin-screen"
    options={{
      title: "Admin Screen",
      tabBarIcon: ({ color }) => <IconSymbol name="..." color={color} />,
    }}
  />
)}
```

## Troubleshooting

### Webhook Tabs Not Appearing
1. Check user is logged in with admin role
2. Verify `user?.role === "admin"` in _layout.tsx
3. Check API response includes `role` field
4. Clear app cache and reload

### "Acesso Negado" Error
1. User is not admin - login with admin credentials
2. Role not properly set - check API response
3. Access guard component issue - check console for errors

### Role Not Persisting
1. Check `useAuth` hook preserves role
2. Verify API response includes role
3. Check localStorage/SecureStore has role data

## Security Considerations

### ✅ Implemented
- Client-side role check for UI visibility
- Access guard component prevents rendering
- Backend should also validate admin role

### ⚠️ Important
- **Client-side checks are NOT secure**
- Always validate admin role on backend
- Never trust client-side role for sensitive operations
- Backend endpoints should use `adminProcedure` middleware

### Backend Validation Example
```typescript
// server/routers/webhook-admin.ts
export const webhookAdminRouter = router({
  getStatistics: adminProcedure.query(async ({ ctx }) => {
    // This endpoint only runs if user.role === "admin"
    // Backend validates, not just frontend
  }),
});
```

## Performance

- **Tab Rendering**: Conditional rendering based on role (no performance impact)
- **Access Guard**: Lightweight component (minimal overhead)
- **Role Check**: Simple string comparison (negligible cost)

## Future Enhancements

1. **Role-Based Features**: Add more admin-only screens
2. **Permission System**: More granular permissions beyond admin/user
3. **Audit Logging**: Log admin actions for compliance
4. **Role Management**: Admin panel to manage user roles
5. **Multi-Level Admin**: Different admin tiers with varying permissions

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review test cases in `tests/webhook-navigation.test.ts`
3. Check browser console for errors
4. Verify backend API response includes role

## Version History

- **v1.0.0** (2026-04-27)
  - Initial implementation
  - Admin-only webhook tabs
  - Access guard component
  - 20 unit tests
  - Full documentation
