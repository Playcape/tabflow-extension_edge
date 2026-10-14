# Repository workflow

- Use `https://github.com/Playcape/tabflow-extension_edge` as the source of truth.
  Fetch the current GitHub state before making changes and base work on the
  intended remote branch rather than on generated local packages.
- Commit and push verified source fixes to GitHub when the task authorizes a
  push. Verify the remote commit before reporting that a fix is on GitHub.
- Follow the user's instructions about generating ZIPs. Source changes can be
  tested without rebuilding the committed download archives; make stale
  download documentation explicit when those archives are left unchanged.
