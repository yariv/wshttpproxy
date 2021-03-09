# DevInProd Introduction

DevInProd enables is a new type of development environment that overcomes the shortcomings of traditional environments.

An ideal development environment should provide the following criteria:

- Rapid iteration: Does the environment enable developers to quickly test their code changes?
- Easy setup: Is the environment easy to set up and maintain?
- Isolation: Does the environment enable developers to safely test their changes without interfering with users or other developers?
- Security: Does the environment protect sensitive data from leaking either due to malicious activity or accidents?
- Fidelity: Does the environment reflect the real production environment into which the code would be deployed? The greater is the disparity between the development environment and production, the less confidence developers have their their changes won't cause regressions, and the harder it can be to debug production issues.

The two most commonly used environment types are separate environments and direct to prod. Here's they compare to DevInProd.

|                 | Separate envs | Deploy to prod | DevInProd |
| --------------- | ------------- | -------------- | --------- |
| Rapid iteration |               |                | x         |
| Easy setup      |               | x              | x         |
| Isolation       | x             |                | x         |
| Security        | x             |                | x         |
| Fidelity        |               | x              | x         |

<br>

## Separate environments

Separate environments entail creating completely separate development, staging, test and production environments -- from the code to the data layer.

**Rapid Iteration**: These environments tend generally enable only slow iteration, as testing a change requires deploying it to a staging environment, which can be much slower than restarting it locally.

**Easy setup**: These environments tend to be difficult to set up and maintain as the production stack grows in complexity, sometimes requiring entire engineering teams to maintain. This is because to make these environments reflect production, every production service has to be available in the dev/staging environments, ideally with the most recent version of the code that's been deployed to production. Furthermore, useful data shims also have to be engineered so that developers can test the critical code paths triggered by production-like data.

**Isolation**: These environments offer complete isolation between developers and users, which provides strong protection against regressions and data leaks during development. However, these environments don't always enforce isolation between developers and each other, as in the case of shared staging environments.

**Security**: Separate environments can offer very good security if they prevent developers from being able to access sensitive data during development. This assumes that the databases in the development and/or staging environments don't contain any sensitive data.

**Fidelity**: They also tend to be of low fidelity, because making debugging certain issues difficult and providing lower guarantees that new code won't cause regressions once it's deployed.
If the backend is composed of multiple services, testability also tends to be weak because of the difficulty of testing changes to each service in an end-to-end manner.

## Direct to prod

This entails testing changes directly in the production environment, either by using feature flags to gating those changes only to developers or by deploying them to a small percentage of production traffic.

**Rapid Iteration**: Direct-to-prod environments don't typically enable rapid iteration because code typically has to be reviewed before it can be deployed to production. There's often also non-trivial latency involved in deploying code.

**Easy setup**: Their setup tends to be simple because they don't require creating separate fully-working environments.

**Isolation**: They could have sufficient isolation if changes are gated carefully enough but they offer weaker isolation guarantees than fully separate environments.

**Security**: Their security can be compromised if they give developers direct access to production databases or if they don't enforce strict code review practices.

**Fidelity**: They do offer a high fidelity environment because the code is tested within production.

## DevInProd

**Rapid Iteration**: DevInProd offers rapid iteration. The only latency imposed is from developers reloading the new code into their services that are running on their development machines.

**Easy Setup**: DevInProd only requires a one-time setup to enable routing developer requests to their dev machines. It also requires a one-time setup per downstream dependency such as the database to ensure the downstream dependency respects security and isolation.

**Isolation**: DevInProd ensures that developer sessions are isolation from each other and from users using uncomittable database transactions and (in the future, other strategies such as stubbing may be enabled for other downstream dependencies). It is recommended that developers develop against a replica of the production DB to ensure that users are isolated from developers.

**Security**: The DevInProd DB proxy can protect sensitive data by rewriting SELECT queries that read certain fields to return synthetic data. Logging of queries can ensure that developer activies are audited. Rate limited can protect against large-scale data leaks.

**Fidelity**: DevInProd offers developers an environments that's very similar to production. The only difference that should be apparent to developers is their own code changes.

# How DevInProd Works

[ TODO architecture diagram ]

DevInProd consists of a couple of key components:

### Reverse Proxy

When the reverse proxy receives a HTTP request from the browser, it inspects the request and looks for a unique key identifying the developer's session.

The current implementation relies on a subdomain pattern (as a regular expression, `www-(.+)`). This enables easy activation of development routes from a web browser. Other approaches, such as custom HTTP headers, can also be implemented.

If a request contains a unique route key, the reverse proxy forwards the request to another server, dubbed the Router, that maintains websocket connections to websocket clients running on developers' machines.

### Router

The Router serves a few roles:

- It issues `AuthToken`s, which are 40 character pseudo-random strings used to secure request forwarding. In a normal scenario, each developer is granted their own `AuthToken`. The first 6 characters of the `AuthToken` are used as the `RoutingKey` -- the code in the original HTTP request that identifies to which host the request should be proxied.

- It maintains WebSocket connections to `LocalProxies` running on developers' machines. Each connection is identified by its `RoutingKey`. To establish a connection, the `LocalProxy` has to authenticate with a valid `AuthToken`.

- It forwards HTTP requests from the `Reverse Proxy` to the developer's `LocalProxy` identified by the `RoutingKey` in the request.

### Database Proxy

The DB proxy ensures that all queries from a developer's session are serialized into a single non-committable transaction. When the database connection is severed at the end of the session, the database engine automatically rolls back all the queries previously executed in the transaction. If the developer's process attempts to start, commit, or roll back the transaction, the related SQL statements are translated into their `SAVEPOINT` counterparts so as to simulate transaction behavior while maintaining isolation from other developer or user sessions. `COMMIT` or `ROLLBACK` statements outside of `SAVEPOINT`s are ignored. So as to prevent unwanted sideffects, only a whitelisted set of queries is supported: `SELECT`, `CREATE`, `UPDATE`, `DELETE`, `BEGIN`, `START TRANSACTION`, `COMMIT`, and `ROLLBACK`.

Here's an example of how a series of DB statements would be translated by the DB proxy:

| Original Query                              | Rewritten Query                             |
| ------------------------------------------- | ------------------------------------------- |
|                                             | BEGIN                                       |
| BEGIN                                       | SAVEPOINT s1                                |
| INSERT INTO table_name(val) VALUES ('test') | INSERT INTO table_name(val) VALUES ('test') |
| COMMIT                                      | RELEASE SAVEPOINT s1                        |
| BEGIN                                       | SAVEPOINT s1                                |
| UPDATE table_name SET val='new val'         | UPDATE table_name SET val='new val'         |
| ROLLBACK                                    | ROLLBACK TO SAVEPOINT s1                    |
| DELETE FROM table_name                      | DELETE FROM table_name                      |
| COMMIT                                      |                                             |

<br>
The current DB Proxy only supports MySQL but any DB backend that supports transactions can be supported.
<br>
<br>

## LocalProxy

The `LocalProxy` runs on developers' machines. It serves two purposes:

- Initiating websocket connections to the router.
- Running a local DB proxy to which the AppServer connects. This local DB proxy maintains a connection to the remote DB proxy.

Each LocalProxy Both of these connections are authenticated with a handshake packet containing the LocalProxy's `AuthToken`.

This connection is authenticated with a JSON-encoded handshake sent as the first SQL query of the connection. This handshake contains the `LocalProxy`'s `AuthToken`.

# Usage Instructions

DevInProd is available as an open source set of package that you can install and run yourself.

1. To install the router, call

```
npm install @devinprod/router
```

2. Set up your router's `ApplicationSecret`

3. Configure your reverse proxy to forward requests that match a route key to the Router. Here's a sample Nginx config: [ TODO LINK ]. You can also use the `sidecar` project in the repo [TODO explain].

4. Start the router using the command

```
npx ts-node routerMain.ts
```

5. To create a new `AuthToken`, call

```
curl -X POST http://localhost:3001/api/createToken
```

Note that for security reasons, this endpoint is by default restricted to clients whose origin address is localhost.

6. To install and run the example app, call

```
npm install @devinprod/example
npx ts-node exampleMain.ts
```
