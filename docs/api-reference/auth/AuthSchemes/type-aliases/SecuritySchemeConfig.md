[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthSchemes](../README.md) / SecuritySchemeConfig

# Type Alias: SecuritySchemeConfig

> **SecuritySchemeConfig** = \{[`key`: `string`]: `any`; `type`: [`AuthSchemeType`](../enumerations/AuthSchemeType.md); \} \| [`OpenIdConnectWithConfig`](../interfaces/OpenIdConnectWithConfig.md)

Defined in: [src/auth/AuthSchemes.ts:56](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L56)

SecuritySchemeConfig is a union of SecurityScheme and OpenIdConnectWithConfig.
In TypeScript, SecurityScheme can be any object with a 'type' property.
