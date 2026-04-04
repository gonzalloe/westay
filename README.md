# WeStay — Master Branch

> Reserved for future full-stack production merge.

## Branch Strategy

| Branch | Purpose |
|---|---|
| **`master`** | Production-ready full-stack (pending merge) |
| **`demo`** | Frontend-only SPA, deployed to [GitHub Pages](https://gonzalloe.github.io/westay/) |
| **`backend-dev`** | Full-stack dev (Express 5 + SQLite + JWT Auth) |

## How to Merge

When ready for production deployment:

```bash
git checkout master
git merge demo           # bring in frontend
git merge backend-dev    # bring in backend
# resolve conflicts, then:
git push origin master
```

---

*This branch is intentionally empty. See `demo` or `backend-dev` for project code.*
