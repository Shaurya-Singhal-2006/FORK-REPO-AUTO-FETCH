<div align="center">

# 🔄 Fork Sync

### Your fork. Always up to date.

Generate a GitHub Actions workflow to bring upstream changes into your fork automatically.

<br />

## 🚀 [Open the live app](https://shaurya-singhal-2006.github.io/FORK-REPO-AUTO-FETCH/)

</div>

---

## 💡 What it does

Fork Sync creates a ready-to-use workflow for a repository you forked. Choose the upstream repository, branch, and sync schedule; then add the generated file to your fork. GitHub Actions handles future updates, and you can also start a sync manually.

```text
Original repository  →  Your fork  →  Automatic updates
```

## 🧭 Set it up

1. 🔎 Enter the upstream repository as `owner/repo` — for example, `facebook/react`.
2. 🌿 Select the branch and how often to sync. GitHub schedule times use UTC.
3. 🛡️ Choose any options you need:
   - **Force sync** can discard commits made directly on a diverged branch.
   - **Workflow file access** uses a personal access token when upstream changes include `.github/workflows` files.
4. 📋 Copy the generated YAML or download `sync-fork.yml`.
5. 🗂️ In your fork, create `.github/workflows/sync-fork.yml`, paste the YAML, and commit it.
6. ⚡ Open the fork’s **Actions** tab and enable workflows if GitHub asks. Then choose **Sync Fork → Run workflow** to test it.
7. 🎉 That’s it! Your fork will sync on the selected schedule.

## 🧪 Example

To keep a fork of React’s `main` branch up to date twice a day:

| Choose | Value |
| --- | --- |
| Upstream repository | `facebook/react` |
| Branch | `main` |
| Schedule | Every 12 hours |
| Force sync | Off |
| Personal access token | Off |

The generated workflow goes in **`.github/workflows/sync-fork.yml`**. Commit it to your fork, enable it in **Actions**, and run **Sync Fork** once to try it out.

---

<div align="center">

✨ Less manual syncing. More time building. ✨

</div>
