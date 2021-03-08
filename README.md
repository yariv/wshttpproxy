# devinprod

DevInProd enables is a new type of development environment that overcomes the shortcomings of traditional environments.

An ideal development environment should provide the following criteria:

- Rapid iteration: Does the environment enable developers to quickly test their code changes?
- Easy setup: Is the environment easy to set up and maintain?
- Isolation: Does the environment enable developers to safely test their changes without interfering with users or other developers?
- Security: Does the environment protect sensitive data from leaking either due to malicious activity or accidents?
- High Fidelity: Does the environment reflect the real production environment into which the code would be deployed? The greater is the disparity between the development environment and production, the less confidence developers have their their changes won't cause regressions, and the harder it can be to debug production issues.

The two most commonly used environment types are separate environments and direct to prod. Here's they compare to DevInProd.

|                 | Separate envs | Deploy to prod | DevInProd |
| --------------- | ------------- | -------------- | --------- |
| Rapid iteration |               |                | x         |
| Easy setup      |               | x              | x         |
| Isolation       | x             |                | x         |
| Security        | x             |                | x         |
| High Fidelity   |               | x              | x         |

# Separate environments

Separate environments entail creating completely separate development, staging, test and production environments -- from the code to the data layer.

## Rapid Iteration

These environments tend generally enable only slow iteration, as testing a change requires deploying it to a staging environment, which can be much slower than restarting it locally.

## Easy setup

These environments tend to be difficult to set up and maintain as the production stack grows in complexity, sometimes requiring entire engineering teams to maintain. This is because to make these environments reflect production, every production service has to be available in the dev/staging environments, ideally with the most recent version of the code that's been deployed to production. Furthermore, useful data shims also have to be engineered so that developers can test the critical code paths triggered by production-like data.

## Isolation

These environments offer complete isolation between developers and users, which provides strong protection against regressions and data leaks during development. However, these environments don't always enforce isolation between developers and each other, as in the case of shared staging environments.

## Security

Separate environments can offer very good security if they prevent developers from being able to access sensitive data during development. This assumes that the databases in the development and/or staging environments don't contain any sensitive data.

## High Fidelity

They also tend to be of low fidelity, because making debugging certain issues difficult and providing lower guarantees that new code won't cause regressions once it's deployed.
If the backend is composed of multiple services, testability also tends to be weak because of the difficulty of testing changes to each service in an end-to-end manner.

# Direct to prod

This entails testing changes directly in the production environment, either by using feature flags to gating those changes only to developers or by deploying them to a small percentage of production traffic.

## Rapid Iteration

Direct-to-prod environments don't typically enable rapid iteration because code typically has to be reviewed before it can be deployed to production. There's often also non-trivial latency involved in deploying code.

## Easy setup

Their setup tends to be simple because they don't require creating separate fully-working environments.

## Isolation

They could have sufficient isolation if changes are gated carefully enough but they offer weaker isolation guarantees than fully separate environments.

## Security

Their security can be compromised if they give developers direct access to production databases or if they don't enforce strict code review practices.

## High Fidelity

They do offer a high fidelity environment because the code is tested within production.

# DevInProd

## Rapid Iteration

DevInProd offers rapid iteration. The only latency imposed is from developers reloading the new code into their services that are running on their development machines.

## Easy Setup

DevInProd only requires a one-time setup to enable routing developer requests to their dev machines. It also requires a one-time setup per downstream dependency such as the database to ensure the downstream dependency respects security and isolation.

## Isolation

DevInProd ensures that developer sessions are isolation from each other and from users using uncomittable database transactions and (in the future, other strategies such as stubbing may be enabled for other downstream dependencies). It is recommended that developers develop against a replica of the production DB to ensure that users are isolated from developers.

## Security

The DevInProd DB proxy can protect sensitive data by rewriting SELECT queries that read certain fields to return synthetic data. Logging of queries can ensure that developer activies are audited. Rate limited can protect against large-scale data leaks.

## High Fidelity

DevInProd offers developers an environments that's very similar to production. The only difference that should be apparent to developers is their own code changes.
