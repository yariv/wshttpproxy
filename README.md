# Introduction

WsHTTPProxy is a Node server that forwards HTTP requests to clients that are connected to it by web sockets.

WsHTTPProxy is designed improve iteration speed in micro-service environments. Such environments can make testing of backend code changes challenging for a few reasons:

- Creating realistic staging or development environments becomes more harder as the number of production services grows as well as the rate at which new code is deployed across those services.
- The behavior of production services often depends on production data. Reproducing this data in dev or staging can introduce operational overhead as well as security concerns. Without production data, debugging production issues can be difficult.
- Deploying code to a remote dev or staging environment can introduce much higher latencies to the development cycle than reloading code in a locally running service.

WsHTTPProxy addresses these challenges by routing authenticated requests through the production stack to the developer's instance of the service under development. This routing lets you test the your code changes as they would behave if they were deployed to production. To instantiate a dev request, you load a URL such as `http://www-abc123.your-domain.com`, where `abc123` is a unique identifier for your development environment. Those requests are routed through upstream production services and out to your service under development. This enables realistic end-to-end testing prior to deploying your code.

# Architecture

It's easiest to understand WsHTTPProxy in the context of a hypothetical micro-service architecture as the one depicted below:

<img width="471" alt="Screen Shot 2021-03-15 at 3 51 30 PM" src="https://user-images.githubusercontent.com/12111/111231358-5c079c00-85a6-11eb-8d2e-2fc90ba0ba3c.png">

This diagram depicts an architecture composed of 4 services, where one of them (Service A) takes requests from clients and sends downstream requests to services B, C and D, each of which fronts a dedicated database.

Traditionally, if a developer wanted to make a code change to service B, he or she would have to create or use a replica of the entire production environment wherein they could test their changes in isolation of users or other developers. It would look like this diagram:

<img width="849" alt="Screen Shot 2021-03-15 at 3 59 49 PM" src="https://user-images.githubusercontent.com/12111/111232094-a3daf300-85a7-11eb-99a4-a3be14a03ea1.png">


With WsHTTPProxy, the developer could make changes to service B without needing a full replica of the production environment. They could just use their own instance of Service B, routing requests in and out of production.

<img width="714" alt="Screen Shot 2021-03-15 at 3 58 45 PM" src="https://user-images.githubusercontent.com/12111/111231945-58c0e000-85a7-11eb-8e98-dbcade6f8e7b.png">


WsHTTPProxy consists of a few components:

## WsServer

The WsServer serves a few roles:

- It issues `AuthToken`s, which are 40 character pseudo-random strings used to secure request forwarding. Typically, each developer is granted their own `AuthToken`. The first 6 characters of the `AuthToken` are used as the `RoutingKey` -- the code in the original HTTP request that identifies to which host the request should be proxied.

- It maintains WebSocket connections to `WsClient`s running on developers' machines. Each connection is identified by its `RoutingKey`. To establish a connection, the `WsClient` has to authenticate with a valid `AuthToken`.

- It forwards HTTP requests from the `Reverse Proxy` to the developer's `WsClient` identified by the `RoutingKey` in the request.

## Reverse Proxy

When the reverse proxy receives a HTTP request from the browser, it inspects the request and looks for a unique key identifying the developer's session.

The current implementation relies on a subdomain pattern (as a regular expression, `www-(.+)`). This enables easy access to development services from a web browser. Other ways of embedding `RoutingKey`s in HTTP requests, such as using custom HTTP headers, can be easily supported.

If a request contains a unique `RouteKey`, the reverse proxy forwards the request to the `WsServer`, which maintains connections to `WsClient`s running on developers' machines.

WsHTTPProxy includes a reference reverse proxy, but you can also use NGINX, Apache, or any other reverse proxy, as long as it allows you to redirect requests based on whether they contain a `RoutingKey`.

## WsClient

The `WsClient` runs on developers' machines. It initiating websocket connections to the router and proxies HTTP request from the router to the local instance of the service under development.

Each WsClient Both of these connections are authenticated with a handshake packet containing the WsClient's `AuthToken`.

## Other Components

### DB Proxy
The DB Proxy shown in the diagram isn't included with WsHTTPProxy. The DB proxy is a proxy such as [node-db-proxy](https://github.com/yariv/node-db-proxy). It's a recommended component that automatically rolls back any writes that occurred during a test. It's recommended to run [node-db-proxy](https://github.com/yariv/node-db-proxy) against a replica of the production database (not shown in the diagram).

### Tracing Framework
Ideally, there should be some facility to automatically forward the `RouteKey` from the frontend service (Service A in the diagram) to the Reverse Proxy without needing to make code changes to every service that make exist along the request chain between them. A tracing framework like [Jaeger](https://www.jaegertracing.io) can facilitate this automated payload forwarding. 

# Handling Downstream Dependencies

Most production services have downstream dependencies: databases, caches, external services, etc. To safely test code changes, care should be taken to prevent requests to those dependencies from impacting users or partners. A few strageties are possible:

- **Stubbing/Mocking**. Dependencies such as caches can be stubbed. For writes, they can return a successful response without actually caching anything. For reads, they can alway return an empty response.
- **Using test accounts**. If you're testing interaction between users, you can use test accounts that are only visible to one another but that aren't visible to normal users.
- **Using DB proxies with safety guarantees**. Proxies such as node-db-proxy (link) ensure that writes are never committed. They can also be used to scrub private or sensitive data from dev environments. They still consume resources, however, and may hold row locks, so they're only recommended against replicas of the production DB.
- **Logging/monitoring/rate-limiting**. These strategies don't prevent adverse effects but they can be used to mitigate them.


# Installation

## Server Side

1. To install WsHTTPProxy on a server machine, make sure you have installed Yarn, and then call the following commmands to install the dependencies and generate your server's `AuthToken` SQLite database.

```
git clone https://github.com/yariv/wshttpproxy.git
cd wshttpproxy
yarn
yarn gen-db
```

1. Run WsHTTPServer by calling

```
yarn wsServer --port [port]
```

The first time you run `wsServer`, it generates a new `RoutingSecret`, whose hash it saves in a local `.env` file. This `RoutingSecret` must be included in all reverse-proxy HTTP requests to the router as the value of the `ws-http-proxy-routing-key` header. This ensures that only authenticated reverse proxies can initiate reverse-proxy requests to the router.

2. Run the reverse proxy by calling

```
yarn reverseProxy --port [port] --routingSecret [routingSecret] --prodUrl [prodUrl] --wsServerUrl [wsServerUrl]
```

This command takes the following arguments:
- `port`: the port on which the reverse proxy should listen
- `routingSecret`: the `RoutingSecret` from the step above.
- `prodUrl`: the URL of the production service to which normal traffic should be directed
- `wsServerUrl`: the URL of your wsServer

You can also use your own reverse proxy such as Nginx or Apache instead of the provided reverse proxy.

If your website uses HTTPS, you may need to obtain a wildcard SSL certificate if you want to be able to proxy requests such as `https://www-[`RoutingKey`].[YourDomain]`.

3. To create a new `AuthToken`, ssh into the machine that's running the `wsServer` if you haven't already, and call

```
curl -X POST http://localhost:[PORT]/api/createToken
```

For security, this endpoint is by default restricted to clients whose origin address is localhost.

The AuthToken isn't persisted in the DB -- only its hash is. If you lose it, you won't be able to retrieve it and you'll have to generate a new `AuthToken`.


### Client side

1. Check out the git repo and dependencies as above (you don't need to call ```yarn gen-db```):

```
git clone https://github.com/yariv/wshttpproxy.git
cd wshttpproxy
yarn
```

2. Run your WsClient by calling

```
yarn wsClient --routerWsUrl [routerWsUrl] --devServiceUrl [devServiceUrl] --authToken [AuthToken]
```

This command takes the following arguments:
- `routerWsUrl`: a URL of the form ```ws://[wsServerDomain]:[wsServerPort]/ws```
- `devServiceUrl`: the URL of the development version of your service (it should be running on localhost in most cases).
- `authToken`: the `AuthToken` generated in step 3) above.

Your client's `RoutingKey` is the first 6 characters of the `AuthToken`. If everything was set up correctly, you should be able to send requests to `http://www-[RoutingKey].[YourDomain]` and those requests will be forwarded to the `devServiceUrl`.
