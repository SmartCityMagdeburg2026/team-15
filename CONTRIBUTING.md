# Contributing to Magdeburg Pulse

Thank you for your interest in contributing to the Magdeburg Pulse project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Testing](#testing)

---

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Git
- A GitHub account

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/magdeburg-pulse.git
cd team-15
```

3. Add upstream remote:
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/magdeburg-pulse.git
```

### Install Dependencies

```bash
npm install
```

### Set Up Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

---

## Development Workflow

### Create a Feature Branch

Always create a new branch for your work:

```bash
# Update main from upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**
- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation
- `refactor/description` - for refactoring
- `test/description` - for tests

### Development

1. Make your changes in your feature branch
2. Test your changes:
```bash
npm run dev
npm run lint
npm run build
```

3. Commit your changes (see [Commit Conventions](#commit-conventions))
4. Push to your fork:
```bash
git push origin feature/your-feature-name
```

---

## Code Style Guide

### TypeScript

- Use **strict mode** - enabled in `tsconfig.json`
- Type all function parameters and return values
- Avoid `any` type; use generics or unions instead
- Use interfaces for object shapes, types for primitives/unions

```typescript
// ✓ Good
interface UserData {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<UserData | null> {
  // implementation
}

// ✗ Avoid
function getUser(id: any): any {
  // implementation
}
```

### React Components

- Use **functional components** only
- Use **TypeScript interfaces** for props:

```typescript
interface CardProps {
  title: string;
  description: string;
  onClick?: () => void;
}

export function Card({ title, description, onClick }: CardProps) {
  return (
    <div onClick={onClick}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
```

- Use **React Server Components** when possible (Next.js 16)
- Separate client components explicitly with `'use client'`

### Styling

- Use **Tailwind CSS** for styling
- Avoid inline styles
- Use consistent spacing and colors

```typescript
// ✓ Good
<div className="bg-blue-500 p-4 rounded-lg shadow-md">
  Content
</div>

// ✗ Avoid
<div style={{ backgroundColor: 'blue', padding: '1rem' }}>
  Content
</div>
```

### File Organization

- Organize files by feature in `src/features/`
- Keep components focused and single-purpose
- Export interfaces from `src/types/`
- Utilities in `src/lib/`

```
src/
├── features/
│   ├── housing/
│   │   ├── HousingDashboard.tsx
│   │   ├── RentCard.tsx
│   │   └── types.ts
│   └── environment/
│       ├── EnvironmentDashboard.tsx
│       └── AirQualityChart.tsx
├── types/
│   ├── housing.ts
│   └── environment.ts
└── lib/
    └── api/
        └── housing.ts
```

### Naming Conventions

- **Components**: PascalCase (e.g., `HousingCard.tsx`)
- **Utilities/Functions**: camelCase (e.g., `formatPrice.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (e.g., `HousingData`)

---

## Commit Conventions

Follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting)
- `refactor`: Code change without feature or bug fix
- `perf`: Code change that improves performance
- `test`: Adding missing tests or changing tests
- `chore`: Changes to build process, dependencies, etc.

### Examples

```bash
# Feature
git commit -m "feat(housing): add rent affordability indicator"

# Bug fix
git commit -m "fix(map): correct district boundary rendering"

# Documentation
git commit -m "docs(readme): add deployment instructions"

# With body
git commit -m "refactor(api): simplify data fetching logic

- Extract API client to separate module
- Remove unused parameters
- Improve error handling"
```

### Scopes

Use feature names as scopes:
- `housing`
- `mobility`
- `environment`
- `map`
- `api`
- `ui`

---

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream:
```bash
git fetch upstream
git rebase upstream/main
```

2. **Run tests and linting**:
```bash
npm run lint
npm run build
```

3. **Fix any issues**:
```bash
npm run lint -- --fix
```

### Creating a PR

1. Push your branch to your fork
2. Open a Pull Request on GitHub
3. Fill out the PR template with:
   - Description of changes
   - Related issues (use `Fixes #123`)
   - Screenshots (if UI changes)
   - Testing instructions

### PR Title Format

Use the same format as commit conventions:

```
feat(housing): add price trend visualization
fix(mobility): correct traffic data parsing
docs: update deployment guide
```

### Code Review

- Address all reviewer comments
- Push follow-up commits (don't force-push during review)
- Request re-review when ready
- PR must have at least 1 approval before merging

### Merging

- PRs are merged with **squash commit** strategy
- Ensure commit message follows conventions
- Delete feature branch after merging

---

## Reporting Bugs

### Before Reporting

- Check existing issues to avoid duplicates
- Test with latest version
- Gather relevant information:
  - OS and browser versions
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots/videos if applicable

### Bug Report Template

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. Expected: X happens
4. Actual: Y happens

## Environment
- OS: macOS/Windows/Linux
- Browser: Chrome/Firefox/Safari
- Version: 0.1.0

## Screenshots
[If applicable]
```

---

## Feature Requests

### Submitting Ideas

1. Check existing feature requests
2. Describe the feature and use case
3. Suggest implementation if you have ideas
4. Discuss with maintainers before implementing large features

### Feature Request Template

```markdown
## Description
What feature would you like to see?

## Use Case
Why is this needed? Who benefits?

## Suggested Solution
How could this be implemented?

## Alternatives
Any alternative approaches?
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Writing Tests

- Write tests for new features
- Maintain >80% code coverage
- Use descriptive test names

```typescript
// src/lib/utils/__tests__/formatPrice.test.ts
describe('formatPrice', () => {
  it('should format price with EUR currency', () => {
    const result = formatPrice(1234.56);
    expect(result).toBe('€1,234.56');
  });

  it('should handle zero price', () => {
    const result = formatPrice(0);
    expect(result).toBe('€0.00');
  });
});
```

---

## Performance Considerations

When contributing:

- Avoid unnecessary re-renders (use `React.memo`, `useMemo`)
- Optimize images (use Next.js Image component)
- Use dynamic imports for large components
- Lazy load routes when possible
- Monitor bundle size with `npm run analyze`

---

## Documentation

When adding features:

1. **Update README** if feature affects users
2. **Add JSDoc comments** to functions:

```typescript
/**
 * Calculates the affordability ratio for a given rent and income
 * @param monthlyRent - Monthly rent in EUR
 * @param monthlyIncome - Monthly income in EUR
 * @returns Affordability ratio as a percentage
 */
export function calculateAffordabilityRatio(
  monthlyRent: number,
  monthlyIncome: number
): number {
  return (monthlyRent / monthlyIncome) * 100;
}
```

3. **Update DEPLOYMENT.md** if deployment process changes
4. **Add comments** for complex logic

---

## Getting Help

- **Questions**: Open a discussion in GitHub Discussions
- **Issues**: Report bugs via GitHub Issues
- **Chat**: Join our community Discord/Slack (if available)
- **Docs**: Check README.md and DEPLOYMENT.md

---

## Contributor Recognition

We recognize all contributors! Check [CONTRIBUTORS.md](./CONTRIBUTORS.md) or GitHub's contributor graph.

---

Thank you for contributing to Magdeburg Pulse! 🎉

**Happy coding!**

---

**Last Updated**: June 6, 2026
