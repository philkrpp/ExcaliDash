# philkrpp fork

Branch `philippkrapp` is deployed by Coolify (project "Philipp Krapp" / production, app `whiteboard`, s4-coolify)
to https://whiteboard.philippkrapp.de on every push, using `docker-compose.coolify.yml`.

- `main` mirrors upstream `ZimengXiong/ExcaliDash` unchanged.
- Own changes go to `philippkrapp`. Small, general fixes are also offered upstream as a PR.
- Update from upstream:
  ```bash
  git fetch upstream --tags
  git switch main && git merge --ff-only upstream/main && git push origin main
  git switch philippkrapp && git merge v<new-tag>   # a release tag, not an arbitrary main commit
  git push origin philippkrapp                        # deploys
  ```
- Runbook (secrets, DB, R2, Authentik, restore): proxmox `docs/whiteboard.md`.
