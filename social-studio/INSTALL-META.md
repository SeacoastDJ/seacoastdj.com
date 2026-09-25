# Meta publishing setup

**Meta app setup is already complete for Seacoast DJ — do not recreate the app, permissions, or Login Configuration.** This document only lists the values to enter as environment variables.

Seacoast DJ Social Studio publishes only an approved caption paired with one explicitly selected photograph. Facebook Page photo posts and Instagram professional-account photo posts.

## Meta application (already created)

- App name: **SeacoastDJ Social Studio**
- App ID: `1056603570541749`
- Business Portfolio: **Seacoast DJ**
- Permissions granted, ready for testing: `business_management`, `instagram_basic`, `instagram_content_publish`, `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`, `public_profile`
- Facebook Login for Business Configuration: **"SeacoastDJ Social Studio Post"**, Configuration ID `1084989734226942`, access token type: User access token
- Instagram account: `@seacoastdj` (ID `17841403854471988`), confirmed connected to the Seacoast DJ Facebook Page

Do not add advertising, messaging, lead, catalog, comment-management, or insights permissions.

## Callback and domain settings (already entered)

- App domain: `social.seacoastdj.com`
- Valid OAuth redirect URI: `https://social.seacoastdj.com/auth/meta/callback`
- Website URL: `https://social.seacoastdj.com/`

The callback must match `META_REDIRECT_URI` exactly, including HTTPS and the path.

## Hostinger environment values

```text
META_APP_ID=1056603570541749
META_APP_SECRET=<Meta App Secret — enter directly in Hostinger's panel, never in chat or source control>
META_CONFIG_ID=1084989734226942
META_REDIRECT_URI=https://social.seacoastdj.com/auth/meta/callback
META_GRAPH_VERSION=v24.0
META_INSTAGRAM_ACCOUNT_ID=17841403854471988
PUBLIC_BASE_URL=https://social.seacoastdj.com
META_TOKEN_ENCRYPTION_KEY=<unique random secret, 32+ bytes>
META_MEDIA_SIGNING_SECRET=<different unique random secret, 32+ bytes>
```

Never put the App Secret or a generated access token in chat, screenshots, source control, or a public file.

## Connect and test

1. Deploy and restart the Node.js application.
2. Confirm `/health` reports `metaConfigured: true`.
3. Sign in to Social Studio and open **Meta connection**.
4. Select **Connect Facebook and Instagram**.
5. Authorize the Seacoast DJ Facebook Page and its connected Instagram professional account.
6. Confirm both account names appear as connected.
7. Use a private "TEST — delete me" project and an approved draft for the first post, then delete the live post right after confirming it published.

The selected photograph is exposed to Meta through a signed URL that expires after 15 minutes. Other project media remains behind the Social Studio login.

## Scope and limitations

- Photo publishing only.
- One photograph per publishing action.
- No automatic publishing or scheduling.
- No personal Facebook profile publishing.
- No Stories, carousel, or Reel publishing yet.
- A **Publish now** confirmation is required.
- Publication IDs and timestamps are retained with the draft.
- The Meta app is set to Standard Access, which already covers this app's own admin publishing to its own linked Page/Instagram account. If Meta ever demands business verification or a Live/Published app state before the connect or publish flow works, that's the point to revisit it — not before.
