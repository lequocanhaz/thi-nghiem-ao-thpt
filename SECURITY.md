# Security Policy — Quanh Lab

Quanh Lab runs a public educational website at https://physicslab.tech/. HTML, CSS and JavaScript downloaded by a visitor are public browser resources. Making a repository private does not make those downloaded resources secret.

## Report security concerns privately

Use GitHub's private vulnerability reporting feature under Security if enabled, or contact the repository owner privately via their GitHub profile. Do not publish actual credentials, exploit examples, or student data in a public issue.

## Deployment and maintenance

- Keep GitHub Pages HTTPS enforced and the custom domain verified.
- Publish no service credentials or student records within the `dist/` folder.
- Store AI credentials only in the external server's secret manager. GitHub Pages deployment does not update that server.
- Maintain strict origin restrictions, backend request quotas, authentication where needed, and provider spending limits.
- Enable GitHub two-factor authentication, branch protections, and secret scanning where available.
- Audit third-party updates and restrict write access to the repository.
- Never assume static-site JavaScript, previously public source or prior copies can be made confidential by disabling right-click or developer tools.

Security reports should be handled carefully with responsible private disclosure.
