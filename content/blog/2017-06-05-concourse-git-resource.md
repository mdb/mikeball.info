---
title: Committing Via the Concourse Git Resource
date: 2017-06-05
tags:
- concourse
- github
- git
thumbnail: faces_thumb.png
teaser: How to commit to a git repo from Concourse using the git resource.
---

A [Concourse](http://concourse-ci.org) _resource_ is any entity that can be checked for new versions, fetched at a specific version, and/or pushed up to idempotently create new versions. [Concourse](http://concourse-ci.org)'s built-in [git-resource](https://github.com/concourse/git-resource) is a Concourse resource for working with git repositories.

Pulling down a git repository for use in a pipeline job using the `git-resource` is fairly straight forward:

```yaml
resources:

- name: my-repo
  type: git
  source:
    branch: master
    uri: https://github.com/my-org/my-repo.git
    uername: git
    password: ((github-access-token))

jobs:

- name: git-log
  plan:
  - get: my-repo
  - task: show-log
    config:
      inputs:
      - name: my-repo
      platform: linux
      image_resource:
        type: registry-image
        source:
          repository: node
          tag: 6.3.1
      run:
        dir: my-repo
        path: git
        args:
          - --no-pager
          - log
```

But how can Concourse's `git-resource` be leveraged to make and push commits to a repository? The following offers an example pipeline job executing a `put` on a modified git resource:

```yaml
resources:

- name: my-repo
  type: git
  source:
    branch: master
    uri: https://github.com:my-org/my-repo.git
    username: git
    password: ((github-access-token))

jobs:

- name: commit-and-push-to-repo
  plan:
  - get: my-repo
  - task: commit-and-push
    config:
      inputs:
      - name: my-repo
      outputs:
      - name: my-repo-modified
      platform: linux
      image_resource:
        type: docker-image
        source:
          repository: node
          tag: 6.3.1
      run:
        path: bash
        args:
          - -exc
          - git clone my-repo my-repo-modified
          - cd my-repo-modified
          - echo $(date) > date_file.txt
          - git add .
          - git commit -m "add new date_file.txt date"
  - put: my-repo
    params:
      repository: my-repo-modified
```
