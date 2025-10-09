# RAKBANK Digital Business Card

A responsive React single-page application that presents a polished digital business card for RAKBANK relationship managers. The page can run standalone in any browser and also includes a Microsoft Teams style host shell to demo how the experience will feel as a personal tab inside Teams, Outlook, or the Microsoft 365 app.

## Features

- **Interactive profile card** &mdash; Shows the employee's name, job title, email address, and mobile number with hover animations for the card body and QR code area.
- **Shareable QR code** &mdash; Automatically generates a vCard payload that can be scanned to save the contact details directly into a user's address book.
- **RAKBANK branding** &mdash; Displays the bank's logo and colors and gracefully falls back if a profile photo is not available.
- **Teams simulation toggle** &mdash; Wraps the card inside a faux Microsoft Teams chrome for usability sessions and stakeholder reviews without requiring a full Teams deployment.
- **Microsoft Entra ID integration** &mdash; Attempts to pull the signed-in user's contact information and profile photo from Microsoft Graph. When access is unavailable (for example, when running outside Teams or before configuration) the UI clearly falls back to the sample profile.

## Project structure

```
├── public/                 # Static assets served by the dev server (logos, manifest, etc.)
├── src/
│   └── components/App.tsx  # Main React component that renders the card and Teams simulator
├── images/                 # Documentation assets (not bundled with the app)
├── package.json            # Scripts and dependencies
└── README.md               # Project documentation (this file)
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18 LTS or newer
- npm 9+ (bundled with Node 18)

> If you plan to sideload the experience into Microsoft Teams, install the [Teams Toolkit for VS Code](https://aka.ms/teams-toolkit) or the [TeamsFx CLI](https://aka.ms/teamsfx-cli) and sign in with a Microsoft 365 developer tenant. Those tools are not required to preview the simulator locally.

## Getting started

```bash
# Install dependencies (only required the first time)
npm install

# Start the local development server
npm start
```

Open your browser to [http://localhost:3000](http://localhost:3000). The app will hot-reload whenever you edit files under `src/`.

At the top of the page you'll find a **Simulate Microsoft Teams host** toggle. Turn it on to wrap the business card inside the mock Teams chrome, or leave it off to view the standalone card presentation.

Whenever the app can reach Microsoft Entra ID it replaces the placeholder contact with the authenticated user's details and indicates the current data source in the info banner. When live data is unavailable, the bundled RAKBANK sample profile continues to render so stakeholders can still review the experience without authentication.

## Configuring Microsoft Entra ID integration

The business card can hydrate itself with live user data by calling Microsoft Graph with delegated permissions. Complete the following steps after you provision the Azure AD (Entra ID) application through the Teams Toolkit or the Azure portal:

1. **Ensure the Graph permission is granted.** The default Teams Toolkit manifest requests the `User.Read` delegated permission. Approve admin consent if your tenant requires it so the user profile endpoint can be called.
2. **Collect the authentication values.** Note the Teams Toolkit values (or your own) for:
   - `REACT_APP_CLIENT_ID` – the Azure AD application (client) ID.
   - `REACT_APP_START_LOGIN_PAGE_URL` – the hosted URL for `auth-start.html` (for example `https://<your-domain>/auth-start.html`).
3. **Expose the variables to React.** Create a `.env.local` file at the project root (ignored by git) or update the environment used by `env-cmd` and add:

   ```bash
   REACT_APP_CLIENT_ID=<your-aad-app-id>
   REACT_APP_START_LOGIN_PAGE_URL=<https://your-domain/auth-start.html>
   ```

4. **Restart the dev server.** `react-scripts` only reads environment variables on startup. Once the app reloads it will prompt the user to sign in (or silently use the Teams context) and, on success, the status banner will report that Microsoft Entra data is being used.

### Testing the Microsoft Entra connection

- **Local preview:** Run `npm start` in a terminal (or `npm run dev:teamsfx` if you are using the Teams Toolkit-generated `.localConfigs` file). When prompted, complete the Microsoft 365 sign-in flow that appears in a popup window. The banner above the card confirms whether live profile information is loaded and surfaces any authentication issues.
- **Teams Toolkit debug session:** Launch "Debug in Teams (Edge/Chrome)" from the Teams Toolkit. This spins up the React dev server alongside the Teams hosting frame so the `TeamsUserCredential` component can negotiate SSO automatically.
- **Sideloaded tab:** Package the app with the Teams Toolkit and upload the zip under `appPackage/` to Microsoft Teams. The first launch will request consent for the Microsoft Graph permission if it hasn't been granted yet.

If the app cannot authenticate, a friendly status message explains the reason and the card reverts to the bundled sample profile so that demos can continue uninterrupted.

## Building for production

```bash
npm run build
```

The optimized assets will be output to the `build/` folder and can be hosted on any static web server.

## Customizing the profile content

With Microsoft Entra connectivity configured the card automatically renders the signed-in user's information. To provide a permanent fallback profile (useful for demos or before access is granted):

1. Edit the `FALLBACK_PROFILE` constant in `src/components/App.tsx` and update the default name, job title, email, phone number, and `photoUrl`.
2. Place the corresponding profile image under `public/` so that it can be served by the dev server (for example `public/jane_doe.png`).
3. Adjust the QR code color or other brand accents by updating the `accentColor` constant in the same file.

Because the QR code encodes a vCard string, any change to the profile fields will automatically be reflected in the scanned contact data. The status banner at the top of the page always makes it clear whether the live Microsoft Entra data or the fallback profile is currently displayed.

## Deploying to Microsoft Teams (optional)

When you're ready to demonstrate the experience inside Microsoft Teams or Outlook:

1. Install the Teams Toolkit extension or CLI and sign in to your Microsoft 365 developer tenant.
2. Use the toolkit to provision the necessary Azure resources (if required) and sideload the app package located in `appPackage/`.
3. Select the personal tab capability, upload the generated manifest, and assign it to the appropriate users.

Refer to the [Teams Toolkit documentation](https://github.com/OfficeDev/TeamsFx/wiki/Teams-Toolkit-Visual-Studio-Code-v5-Guide#overview) for detailed guidance on provisioning, deploying, and publishing your app.

## Useful scripts

| Command          | Description                                   |
| ---------------- | --------------------------------------------- |
| `npm start`      | Runs the app in development mode with hot reload.
| `npm run dev:teamsfx` | Starts the dev server while loading environment variables from `.localConfigs` (Teams Toolkit local debugging).
| `npm run build`  | Generates a production-ready build in `build/`.
| `npm test`       | Placeholder for unit tests (not configured).

## License

This project is provided for demonstration purposes for RAKBANK. Please consult your project stakeholders before reusing it in other contexts.
