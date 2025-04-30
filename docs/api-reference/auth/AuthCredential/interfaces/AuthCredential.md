[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthCredential](../README.md) / AuthCredential

# Interface: AuthCredential

Defined in: [src/auth/AuthCredential.ts:190](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L190)

Interface for authentication credentials

Examples:

API Key Auth:
```
{
  auth_type: AuthCredentialTypes.API_KEY,
  api_key: "1234"
}
```

HTTP Auth:
```
{
  auth_type: AuthCredentialTypes.HTTP,
  http: {
    scheme: "basic",
    credentials: { username: "user", password: "password" }
  }
}
```

OAuth2 Bearer Token in HTTP Header:
```
{
  auth_type: AuthCredentialTypes.HTTP,
  http: {
    scheme: "bearer",
    credentials: { token: "eyAkaknabna...." }
  }
}
```

OAuth2 Auth with Authorization Code Flow:
```
{
  auth_type: AuthCredentialTypes.OAUTH2,
  oauth2: {
    client_id: "1234",
    client_secret: "secret"
  }
}
```

OpenID Connect Auth:
```
{
  auth_type: AuthCredentialTypes.OPEN_ID_CONNECT,
  oauth2: {
    client_id: "1234",
    client_secret: "secret",
    redirect_uri: "https://example.com",
    scopes: ["scope1", "scope2"]
  }
}
```

Auth with resource reference:
```
{
  auth_type: AuthCredentialTypes.API_KEY,
  resource_ref: "projects/1234/locations/us-central1/resources/resource1"
}
```

## Properties

### api\_key?

> `optional` **api\_key**: `string`

Defined in: [src/auth/AuthCredential.ts:199](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L199)

***

### auth\_type

> **auth\_type**: [`AuthCredentialTypes`](../enumerations/AuthCredentialTypes.md)

Defined in: [src/auth/AuthCredential.ts:191](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L191)

***

### http?

> `optional` **http**: [`HttpAuth`](HttpAuth.md)

Defined in: [src/auth/AuthCredential.ts:200](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L200)

***

### oauth2?

> `optional` **oauth2**: [`OAuth2Auth`](OAuth2Auth.md)

Defined in: [src/auth/AuthCredential.ts:202](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L202)

***

### resource\_ref?

> `optional` **resource\_ref**: `string`

Defined in: [src/auth/AuthCredential.ts:197](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L197)

Resource reference for the credential.
This will be supported in the future.

***

### service\_account?

> `optional` **service\_account**: [`ServiceAccount`](ServiceAccount.md)

Defined in: [src/auth/AuthCredential.ts:201](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L201)
