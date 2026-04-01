# Contributing to AetherRise

Thank you for your interest in contributing! 

## Getting Started

1. Fork the repository
2. Clone your fork:
```bash
   git clone https://github.com/your-username/AetherRise.git
```
3. Install dependencies:
```bash
   npm install
```
4. Create a `.env.local` file:
```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```
5. Run the development server:
```bash
   npm run dev
```

## Making Changes

- Create a new branch for your feature:
```bash
  git checkout -b feature/your-feature-name
```
- Make your changes
- Run lint before committing:
```bash
  npm run lint
```
- Commit with a clear message:
```bash
  git commit -m "feat: describe your change"
```

## Pull Request Guidelines

- Keep PRs small and focused
- Describe what your PR does clearly
- Make sure lint and build pass before submitting

## Commit Message Format

| Prefix | Use for |
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Maintenance |
| `ci:` | CI/CD changes |
| `docs:` | Documentation |

## Questions?

Open an issue and we'll get back to you! 