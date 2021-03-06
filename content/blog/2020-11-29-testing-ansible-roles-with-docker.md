---
title: Testing Ansible Roles With Docker-in-Docker
date: 2020-11-29
tags:
- ansible
- CI/CD
- testing
thumbnail: peace_fingers_thumb.png
teaser: How to develop and test Ansible roles with Molecule and Docker.
---

_A brief guide and reference example explaining a technique for using Molecule and a Docker-in-Docker dev/test environment to test Ansible roles_.

## Problem

[Ansible](https://www.ansible.com/) encourages the use of [Molecule](https://github.com/ansible-community/molecule) to test Ansible roles "against multiple instances, operating systems and distributions, virtualization providers, test frameworks, and testing scenarios." [Molecule documentation](https://molecule.readthedocs.io/en/latest/getting-started.html) offers an overview of how to get started, including how to use [Docker](https://docker.io) as the test driver provider, as well as how to use Ansible as the [Molecule verifier](https://molecule.readthedocs.io/en/latest/configuration.html#verifier). But what if you'd like to _also_ use Docker as your development environment, thus avoiding the need to install any dependencies &mdash; Python, Ansible, Molecule, etc. &mdash; beyond Docker itself? Or what if the relevant CI/CD pipeline steps run in a container, as is the case with a [Concourse task](https://concourse-ci.org/tasks.html), for example?

## Solution

[Docker-in-Docker](https://www.docker.com/blog/docker-can-now-run-within-docker/) allows the use of a containerized dev/test environment, within which Molecule can leverage its Docker driver provider to test the Ansible role against sub-containers (Note, however: the solution isn't free of tradeoffs. Read on for further insight on security concerns).

## The Details

[mdb/ansible-hello-world](https://github.com/mdb/ansible-hello-world) offers a basic reference example demonstrating the technique. For the sake of simplicity, the role's only responsibility is to create a `/hello-world.json` file on the targeted host. Its `molecule/converge.yml` file invokes the role against a Dockerized Ubuntu test container, while its `molecule/verify.yml` tests that the role behaves as expected and properly creates the `/hello-world.json` file on the targeted host. It requires no development dependencies beyond Docker (and `make`, arguably, though that's not a hard requirement).

To try it, clone the code:

```bash
git clone https://github.com/mdb/ansible-hello-world.git
cd ansible-hello-world
```

...and run `make` to start a [amidos/dcind](https://hub.docker.com/r/amidos/dcind/) container instance on which Docker is running, install Python, Ansible, and Molecule on it, and execute `molecule test` from within the container:

```text
make
docker run \
  --volume /Users/mball0001/git/ansible-hello-world:/ansible-hello-world \
  --workdir / \
  --privileged \
  --rm \
  --tty \
  clapclapexcitement/dind-ansible-molecule \
  molecule test
Starting Docker...
waiting for docker to come up...
/ansible-hello-world /
fetch http://dl-cdn.alpinelinux.org/alpine/v3.10/main/x86_64/APKINDEX.tar.gz

...

PLAY [Converge] ****************************************************************

TASK [Gathering Facts] *********************************************************
ok: [instance]

TASK [ansible-hello-world : create hello-world.json file] **********************
changed: [instance]

PLAY RECAP *********************************************************************
instance   : ok=2    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0

...

TASK [Assert that /hello-world.json has the expected contents] *****************
ok: [instance] => {
    "changed": false,
    "msg": "All assertions passed"
}

...

TASK [Delete docker network(s)] ************************************************

PLAY RECAP *********************************************************************
localhost    : ok=2    changed=2    unreachable=0    failed=0    skipped=1    rescued=0    ignored=0

INFO    Pruning extra files from scenario ephemeral directory
```

## Improvements

~~In current implementation, Python, Ansible, and Molecule are installed on the `amidos/dcind`-based container on each invocation of `make`. While this exercises the role's _continuous integration_ and compatibility with the latest versions of those dependencies, it's quite time consuming. To save time during test execution, these dependencies could be pre-installed on a purpose-built container image used instead of `amidos/dcind`. The `Dockerfile` for such a purpose-built image might look something like...~~

```Dockerfile
FROM amidos/dcind

RUN apk update && \
  apk add python3 python3-dev py3-openssl py3-pip

RUn pip3 install --upgrade pip &&
  pip3 install ansible molecule[docker]
```

**Update**: I've published [mdb/dind-ansible-molecule](https://github.com/mdb/dind-ansible-molecule), which has the Python, Ansible, and Molecule dependencies baked in. This blog post and the [mdb/ansible-hello-world](https://github.com/mdb/ansible-hello-world) reference example have been updated accordingly.

## A Development Environment

But what about those scenarios when you're rapidly iterating on the playbook? Or even the Molecule tests?

`make shell` can be used to start up a `clapclapexcitement/dind-ansible-molecule` container and pop you into an interactive `bash` shell:

```text
$ make shell
docker run \
  --volume /Users/mball0001/git/ansible-hello-world:/ansible-hello-world \
  --workdir /ansible-hello-world \
  --privileged \
  --interactive \
  --tty \
  --rm \
  clapclapexcitement/dind-ansible-molecule \
    /bin/bash
Starting Docker...
waiting for docker to come up...
bash-5.0#
```

From here, `molecule` commands like `molecule create`, `molecule converge`, and `molecule verify` can be invoked without having to fully tear down and rebuild the Docker-in-Docker container with each invocation; the testing container is left running between invocations:

```text
bash-5.0# docker ps
CONTAINER ID  IMAGE                                                        COMMAND                 CREATED             STATUS         PORTS  NAMES
4ea283fec6fe  molecule_local/geerlingguy/docker-ubuntu1804-ansible:latest  "/lib/systemd/systemd"  About a minute ago  Up 36 seconds         instance
```

In addition to enabling faster, more frequent playbook edits and feedback from `molecule` commands, this is also helpful in those scenarios where you may want to shell into the test container to poke around and troubleshoot via `docker exec`:

```text
docker exec -it <CONTAINER_ID> /bin/bash
```

## Bonus: Concourse CI

See [ci/task.yml](https://github.com/mdb/ansible-hello-world/blob/main/ci/tasks/test.yml) for an example [Concourse task configuration](https://concourse-ci.org/tasks.html) that invokes the playbook and Molecule tests against a test container within a Concourse task. The task uses the same `clapclapexcitement/dind-ansible-molecule` image used in development.

Its use within a Concourse pipeline `pipeline.yml` configuration file might look something like this, for example:

```yml
resources:

- name: ansible-hello-world-pull-request
  type: pull-request
  check_every: 24h
  webhook_token: ((webhook-token))
  source:
    repository: mdb/ansible-hello-world
    access_token: ((access-token))
    v3_endpoint: https://github.com/api/v3/
    v4_endpoint: https://github.com/api/graphql

resource_types:

- name: pull-request
  type: registry-image
  source:
    repository: teliaoss/github-pr-resource

jobs:

- name: verify-pull-request
  plan:
  - get: ansible-hello-world-pull-request
    trigger: true
  - put: ansible-hello-world-pull-request
    params:
      path: ansible-hello-world-pull-request
      status: pending
  - task: test
    file: ansible-hello-world-pull-request/ci/tasks/test.yml
    privileged: true
    on_success:
      put: ansible-hello-world-pull-request
      params:
        path: ansible-hello-world-pull-request
        status: success
    on_failure:
      put: ansible-hello-world-pull-request
      params:
        path: ansible-hello-world-pull-request
        status: failure
```

Note that the Concourse task must be executed with a [privileged: true](https://concourse-ci.org/jobs.html#schema.step.task-step.privileged) configuration to utilize Docker-in-Docker capabilities. As a result, the container's `root` user is the system's actual `root` user. This comes with some tradeoffs and security risks, as noted in the [Concourse documentation](https://concourse-ci.org/jobs.html#schema.step.task-step.privileged), and should never be done with untrusted code. For this reason, the above-described technique may not be advisable for all use cases and circumstances.

I'm curious to learn more about others' techniques, especially Concourse-compatible techniques that avoid the use of container privilege escalation.
