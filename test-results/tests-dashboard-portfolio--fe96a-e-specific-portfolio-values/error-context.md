# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\dashboard-portfolio-history.spec.ts >> dashboard portfolio history timeframes >> seeded snapshots drive timeframe-specific portfolio values
- Location: tests\dashboard-portfolio-history.spec.ts:18:7

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "Axiom AI" [ref=e5] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]:
          - img [ref=e8]
          - generic [ref=e10]: Axiom
          - generic [ref=e11]: AI
      - heading "Bon retour" [level=1] [ref=e12]
      - paragraph [ref=e13]: Connectez-vous à votre compte
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: Email
          - textbox "vous@exemple.com" [ref=e18]
        - generic [ref=e19]:
          - generic [ref=e20]: Mot de passe
          - generic [ref=e21]:
            - textbox "Votre mot de passe" [ref=e22]
            - button [ref=e23]:
              - img [ref=e24]
        - button "Se connecter" [ref=e27]
        - button "Mot de passe oublié ?" [ref=e28]
      - generic [ref=e29]:
        - text: Pas encore de compte ?
        - link "Créer un compte" [ref=e30] [cursor=pointer]:
          - /url: /register
  - button "Open Next.js Dev Tools" [ref=e36] [cursor=pointer]:
    - img [ref=e37]
  - alert [ref=e40]
```