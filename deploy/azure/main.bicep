// =============================================================================
// PaySwitch Credit Scoring — Frontend infrastructure (Azure Container Apps)
//
// Provisions, in one resource group:
//   - Log Analytics workspace (logs + metrics for the Container Apps env)
//   - Container Registry (private, AcrPull granted to the workload identity)
//   - User-assigned Managed Identity (used by the Container App to pull images)
//   - Container Apps Environment (the shared host for all revisions)
//   - Container App (the Next.js workload itself)
//
// Wire-up:
//   The Container App carries one secret:
//     - `backend-api-url` — base URL of the upstream backend
//
//   This is read by the Next Route Handlers (server-side only) — the browser
//   only ever talks to /api/* on this app, never to the backend directly. The
//   image is therefore ENVIRONMENT-PORTABLE: the same tag promotes from dev →
//   prod unchanged. No browser-baked secrets, no rebuild-per-env.
// =============================================================================

@description('Azure region for every resource in this deployment.')
param location string = resourceGroup().location

@description('Short environment label that prefixes every resource name. Use "dev", "stg", or "prod".')
@allowed(['dev', 'stg', 'prod'])
param environmentName string = 'dev'

@description('Globally unique stem appended to resource names that require uniqueness (e.g. ACR, Log Analytics workspace). Use a 4-6 char alphanumeric suffix tied to the resource group.')
@minLength(3)
@maxLength(8)
param resourceSuffix string

@description('Container image fully-qualified tag, e.g. "myacr.azurecr.io/credit-scoring-fe:1.2.3". Provided by the deploy script.')
param containerImage string

@secure()
@description('Backend API base URL the Next app calls server-side. No trailing slash. Treated as a secret so the value is never logged in deployment history.')
param backendApiUrl string

@description('Number of warm revisions to keep at minimum. 1 keeps cold-start to zero; 0 lets the env scale to zero between requests.')
@minValue(0)
@maxValue(10)
param minReplicas int = 1

@description('Maximum revision count under load.')
@minValue(1)
@maxValue(30)
param maxReplicas int = 5

// -----------------------------------------------------------------------------
// Naming convention: <prefix>-<env>-<suffix>
// -----------------------------------------------------------------------------
var prefix = 'cs-fe'
var logsName = toLower('${prefix}-${environmentName}-${resourceSuffix}-logs')
var acrName = toLower('csfe${environmentName}${resourceSuffix}') // ACR names: 5-50 alphanumeric, lowercase
var identityName = toLower('${prefix}-${environmentName}-${resourceSuffix}-id')
var envName = toLower('${prefix}-${environmentName}-${resourceSuffix}-env')
var appName = toLower('${prefix}-${environmentName}-${resourceSuffix}')

// -----------------------------------------------------------------------------
// Log Analytics — backing store for the Container Apps env
// -----------------------------------------------------------------------------
resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    workspaceCapping: { dailyQuotaGb: 1 }
  }
}

// -----------------------------------------------------------------------------
// Container Registry — private, basic SKU, admin user disabled.
// -----------------------------------------------------------------------------
resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

// -----------------------------------------------------------------------------
// Managed Identity used by the Container App to pull from ACR.
// -----------------------------------------------------------------------------
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
}

// AcrPull role definition ID is well-known: 7f951dda-4ed3-4680-a7ca-43fe172d538d
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: acr
  name: guid(acr.id, identity.id, acrPullRoleId)
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      acrPullRoleId
    )
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// -----------------------------------------------------------------------------
// Container Apps environment
// -----------------------------------------------------------------------------
resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: envName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Container App — the Next.js workload.
// -----------------------------------------------------------------------------
resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  dependsOn: [acrPullAssignment]
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
        traffic: [
          { latestRevision: true, weight: 100 }
        ]
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: identity.id
        }
      ]
      // Single server-only secret. The Next.js Route Handlers read it at
      // request time; nothing reaches the browser.
      secrets: [
        {
          name: 'backend-api-url'
          value: backendApiUrl
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
          env: [
            { name: 'BACKEND_API_URL', secretRef: 'backend-api-url' }
            { name: 'PORT', value: '3000' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: 3000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: 3000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 5
              periodSeconds: 10
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Outputs — consumed by deploy/scripts/deploy.sh
// -----------------------------------------------------------------------------
output containerAppName string = app.name
output containerAppFqdn string = app.properties.configuration.ingress.fqdn
output registryLoginServer string = acr.properties.loginServer
output registryName string = acr.name
output identityId string = identity.id
output environmentName string = env.name
