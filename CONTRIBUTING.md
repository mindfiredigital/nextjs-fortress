# Contributing to nextjs-fortress

We welcome and appreciate your contribution to nextjs-fortress. These guidelines will help ensure a smooth and collaborative process for everyone.

## How Can You Contribute?

Here are some ways you can contribute to the project:

- Reporting bugs or issues
- Submitting feature requests
- Writing or improving documentation
- Fixing bugs
- Implementing new features

## Steps for Contributing

1. **Fork** the repository to your GitHub account.

2. **Clone** the forked repository to your local machine.

3. Create a new **branch** for your change: `git checkout -b <type>/<issue-id>-<description>`. See [branching guidelines](#branching-strategy) below.

4. **Make changes** and **test** to ensure they work as expected.

5. **Commit** your changes following our [commit message format](#commit-message-format): `git commit -m 'type(scope): subject'`

6. **Push** your branch to your GitHub repository: `git push origin <type>/<issue-id>-<description>`.

7. Create a **Pull Request** from your branch to the original repository's `dev`

## Branching Strategy

### Branch Types

- **main**: Production-ready code.
- **dev**: Integration branch for features and bug fixes.
- **feature/\***: New features.
- **bug/\***: Bug fixes.
- **hotfix/\***: Critical fixes.
- **fixes/\***: General fixes that do not need to be immediately addressed.
- **docs/\***: Documentation-related changes (e.g., README updates, new docs).
- **other/\***: For any other changes that do not fall into the above categories.
- **enhancement/\***: Improvements that are not categorized as features or bug fixes.
- **patch/\***: General maintenance tasks that don't fit into feature or bug fix categories.

### Branching Guidelines

- Always create a new branch from the **dev** branch.
- When raising a pull request (PR), it should always be merged into the **dev** branch.

### Naming Convention

Branches should follow the format:

- Format: `<type>/<issue-id>-<description>`
- Example: `feature/12345-add-login-button`

### Merge Strategy

- Use pull requests for all merges.
- Code must be reviewed and approved before merging to `main` or `dev`.

### Conflict Resolution

1. Pull the latest changes from the base branch.
2. Resolve conflicts locally.
3. Rebase the branch and push changes.

## Commit Message Format

We follow a conventional commit message format to ensure consistent and meaningful messages. This format helps in automated versioning, changelog generation, and release management in our monorepo structure.

### Commit Structure

```
type(scope): subject
```

- **type**: The type of change being made (see types below)
- **scope**: The package name from the monorepo being affected (required)
- **subject**: A brief description of the change

### Release Management

Commit messages directly influence our automated release process:

1. MAJOR version (1.0.0 → 2.0.0)

   - Any commit with a breaking change (`!` or `BREAKING CHANGE` in body)

2. MINOR version (1.1.0 → 1.2.0)

   - Commits with `feat` type

3. PATCH version (1.1.1 → 1.1.2)

   - Commits with `fix` or `perf` type

4. No version change
   - Commits with `docs`, `chore`, `style`, `refactor`, `test`, or `ci` types

## Setting up Husky for Git Hooks

Husky is used for running pre-commit checks and enforcing commit message conventions. Follow these steps to set up Husky in the project:

1. Install Husky: After cloning the repository, install the project dependencies by running: `pnpm install`

2. Enable Husky Hooks:
   Once dependencies are installed, enable Git hooks with Husky: `pnpm husky install`

3. Verify Husky Setup:
   After Husky is installed, you can test the hooks by making a commit. For more information, refer to [husky documentation](https://typicode.github.io/husky/get-started.html).

## Pull Request Guidelines

- Make sure your PR addresses an issue or feature request.
- Describe your PR and provide context in the description.
- Keep your PR focused on a single change to make reviewing easier.
- Ensure your code follows the project's coding style and conventions.

## Code of Conduct and Licensing

Please ensure your contributions adhere to the project's [Code of Conduct](./CODE_OF_CONDUCT.md) and are licensed under the project's [License](./LICENSE).

## Need Help?

If you need further clarification or help, feel free to reach out by creating an issue or directly contacting the maintainers.

Thank you for your interest in contributing to PIVOTHEAD! We appreciate your efforts in making this project better.

Happy contributing!