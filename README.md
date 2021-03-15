# Introduction

WsHTTPProxy is a Node server that forwards HTTP requests to clients that are connected to it by web sockets.

WsHTTPProxy is designed improve iteration speed in micro-service environments. Such environments can make testing of backend code changes challenging for a few reasons:

- Creating realistic staging or development environments becomes more harder as the number of production services grows as well as the rate at which new code is deployed among them.
- The behavior of production services often depends on production data. Reproducing this data in dev or staging can introduce operational overhead as well as security concerns. Without production data, debugging production issues can be difficult.
- Having to deploy code to dev or staging can involve much higher latency than reloading code in a locally running service.

WsHTTPProxy addresses these challenges by routing authenticated requests through the production stack to the developer's instance of the service under development. This routing lets you test the application end-to-end. You originate requests at the application's frontend. Those requests are served by production services except for the service under development.

[Diagram]

# Warning

Most production services have downstream dependencies: databases, caches, external services, etc. To safely test code changes, care should be taken to prevent requests to those dependencies from impacting users or partners. This can be done by stubbing those dependencies or by using preventing them from mutating data using proxies such as node-db-proxy (link). WsHTTPProxy doesn't provide any stubbing or isolation features for downstream dependencies. Use it at your own risk.

WsHTTPProxy consists of 3 components:

### WsServer

The WsServer serves a few roles:

- It issues `AuthToken`s, which are 40 character pseudo-random strings used to secure request forwarding. In a normal scenario, each developer is granted their own `AuthToken`. The first 6 characters of the `AuthToken` are used as the `RoutingKey` -- the code in the original HTTP request that identifies to which host the request should be proxied.

- It maintains WebSocket connections to `WsClient`s running on developers' machines. Each connection is identified by its `RoutingKey`. To establish a connection, the `WsClient` has to authenticate with a valid `AuthToken`.

- It forwards HTTP requests from the `Reverse Proxy` to the developer's `WsClient` identified by the `RoutingKey` in the request.

### Reverse Proxy

When the reverse proxy receives a HTTP request from the browser, it inspects the request and looks for a unique key identifying the developer's session.

The current implementation relies on a subdomain pattern (as a regular expression, `www-(.+)`). This enables easy activation of development routes from a web browser. Other approaches, such as custom HTTP headers, can also be implemented.

If a request contains a unique route key, the reverse proxy forwards the request to another server, dubbed the Router, that maintains websocket connections to websocket clients running on developers' machines.

WsHTTPProxy comes with a reference reverse proxy, but you can also use NGINX, Apache, or any other reverse proxy, as long as it allows you to redirect requests based on whether they contain a `RoutingKey`.

## WsClient

The `WsClient` runs on developers' machines. It initiating websocket connections to the router and proxies HTTP request from the router to the local instance of the service under development.

Each WsClient Both of these connections are authenticated with a handshake packet containing the WsClient's `AuthToken`.

# Usage Instructions

DevInProd is available as an open source package that you can install and run yourself.

1. To install DevInProd, call

```
npm install devinprod
```

2. Run the Router by calling

```
cd devinprod
npm router
```

The first time you run the router, it generates a new `RoutingKey`, which it saves in a local `.env` file. This `RoutingKey` must be included in all reverse-proxy HTTP requests to the router within the `dev-in-prod-routing-key` header. This ensures that only your reverse proxy can initiate reverse-proxy requests to the router.

The router exposes 2 ports: one for HTTP requests and one for the DB proxy. [TODO explain how to configure].

3. Configure your reverse proxy to forward requests that match a route key to the Router. Here's a sample Nginx config: [ TODO LINK ]. You can also use the `sidecar` project in the repo [TODO explain].

4. To create a new `AuthToken`, call

```
curl -X POST http://localhost:3001/api/createToken
```

Note that for security reasons, this endpoint is by default restricted to clients whose origin address is localhost. It ensures that you can only generate `AuthToken`s if you can ssh into the machine on which the router is running.

5. To run the example app, call

```
npm example
```

### Dev environment setup

1. Install the same dev-in-prod npm package as in the prod environment:

```
git clone dev-in-prod [TODO]
cd dev-in-prod
```

2. Configure the WsClient so it knows how to connect to your Router, both on the HTTP and MySQL Proxy port. This includes configuring its `AuthToken`. The first 6 characters of the `AuthToken` are used as the `RouteKey` for your WsClient. [TODO explain]

3. Run your WsClient by calling

```
npm WsClient
```

4. Run the same example app locally by calling

```
npm example
```

5. Your local example app is now ready to accept requests from your `Router`. To initiate a request, go to `www-[route-key].yourdomain.com`. If you don't have wildcard DNS set up, you can also send the `RouteKey` in a HTTP header.
