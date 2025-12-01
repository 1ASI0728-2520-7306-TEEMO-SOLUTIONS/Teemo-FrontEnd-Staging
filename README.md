# FrontEndTeemo

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.9.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
npm run build
```

This compiles the Angular application with the production configuration and writes the browser bundle to `dist/front-end-teemo/browser`, which is also the directory published to Firebase Hosting.

Component-level CSS budgets are configured at 10 kB (warning) / 16 kB (error) inside `angular.json`, so if a future component legitimately needs more styles you can adjust those limits in the same file.

## Firebase Hosting workflow

The Firebase CLI is already connected to the `teemo-routing-staging` project (`.firebaserc`). The hosting config (`firebase.json`) points to `dist/front-end-teemo/browser`, and the npm scripts below run the production build before pushing files.

- **First-time setup:** make sure you are authenticated with the correct Google account by running `firebase login`.
- **Production deploy:** run `npm run deploy:hosting`. This compiles the Angular app and then pushes the updated assets to Hosting.
- **Preview URLs:** run `npm run deploy:preview -- <channel-name> [--expires <duration>]` to publish a temporary channel (for example `npm run deploy:preview -- feature-eta --expires 7d`). The script builds before publishing so the preview matches production bits.
- **Local verification (optional):** after `npm run build`, you can run `firebase emulators:start --only hosting` to test the exact files that Hosting will serve.

All of these commands rely on the Firebase CLI installed in `node_modules`, so no global installation is required.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
