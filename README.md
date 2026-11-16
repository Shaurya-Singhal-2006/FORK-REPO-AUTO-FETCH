<div align="center">

# 🔄 Fork Sync

**Keep your GitHub fork up to date automatically.**

Create a GitHub Actions workflow that syncs your fork from its upstream repository on a schedule you choose.

</div>

## 💡 What it does

Fork Sync generates a ready-to-use workflow file for your repository. GitHub Actions then brings changes from the original repository into your fork on your schedule, with an option to run a sync manually.

## 🧭 Setup steps

1. 🔎 Enter the upstream repository as `owner/repo`, such as `facebook/react`.
2. 🌿 Choose the branch to sync and a schedule, such as `main` every 12 hours. GitHub schedule times use UTC.
3. 🛡️ Choose optional settings: force sync can discard commits on a diverged branch; a personal access token is needed when syncing changes to workflow files.
4. 📋 Copy the generated YAML or download `sync-fork.yml`.
5. 🗂️ In your fork, create `.github/workflows/sync-fork.yml`, paste the YAML, and commit the file.
6. ⚡ Open the fork’s **Actions** tab. Enable workflows if GitHub asks, then select **Sync Fork → Run workflow** to try it.
7. 🎉 Done! GitHub will sync your fork automatically on the chosen schedule.

## 🧪 Example

To keep a fork of React’s `main` branch updated every 12 hours, use:

| Setting | Example |
| --- | --- |
| Upstream repository | `facebook/react` |
| Branch | `main` |
| Sync frequency | Every 12 hours |
| Force sync | Off |
| Personal access token | Off |

Generate the workflow, save it as `.github/workflows/sync-fork.yml` in your fork, and enable it in **Actions**. The first run can be started manually; future runs follow the schedule.
