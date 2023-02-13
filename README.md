# Dexli Backend
The Dexli Backend provides the API for reading Dexcom glucose data for a particular user. The backend needs to be deployed to any server and configured by providing the username and password of the Dexcom account as environment variables.
This backend is created to serve data for the [Dexli Watch Face](https://github.com/deviammx/dexli-watchface) for Garmin watches.

This project uses code from [share2nightscout-bridge](https://github.com/nightscout/share2nightscout-bridge). Props to [Nightscout](https://github.com/nightscout) project for their great work.

# Getting Started
These instructions will help you to run the Dexli Backend on your local server.

## Prerequisites
Your Dexcom Sharer username and password

You will need to have the following installed on your server:
- Node.js
- npm (Node Package Manager)
- Docker (optional)

## Installation
- Clone the repository to your local machine.
- Navigate to the project directory and run npm install to install the necessary dependencies.
- Set the following environment variables with the appropriate values:
  
    `BRIDGE_SERVER`: The key of the bridge server for the Dexcom API. Set it to `EU` or leave empty

    `DEXCOM_ACCOUNT_NAME`: The username for the Dexcom account.

    `DEXCOM_PASSWORD`: The password for the Dexcom account.

    `API_KEY`: The API key for the application. Generate a random string and set the variable. This variable will should be set with every request to the API.

- You can use direnv for applying the environment variables from `.envrc` file
- Start the backend by running `npm run start`.
- Or start the app in the container by running `docker compose up`

## API Reference
Documentation for the API endpoints and their functionality can be found in the API reference.


# Installation on a production server
## Azure Web App
Here is a step-by-step guide to registering and deploying a Node.js application to a free tier Azure Web App:

Create a Microsoft Azure account: If you don’t already have a Microsoft Azure account, sign up for a free account by visiting the Azure website and following the on-screen instructions.

Create a Web App: In the Azure portal, click the "Create a resource" button, then select "Web App". Fill in the required information, such as the App name, subscription, resource group, and operating system.

Configure the Node.js version: In the Web App configuration, select the "Node.js" runtime stack and the desired version.

Choose a hosting plan: For a free tier, select the "Free" pricing tier.

Create a Git repository: In the Azure portal, navigate to the newly created Web App and select the "Deployment Center" option. Choose "GitHub" as the source control provider, then select the desired repository or create a new one.

Set environment variables

Deploy the Node.js application: Follow the on-screen instructions to deploy the Node.js application to the Azure Web App by pushing the code to the GitHub repository.

Verify the deployment: Once the deployment is complete, navigate to the URL of the Web App in a web browser to verify that the Node.js application is up and running.

Developers can also deploy the applications by using Azure Plugin in VSCode

Note: Make sure that your Node.js application has a start script defined in the package.json file, as this will be used to start the application when it is deployed to the Azure Web App.

# Miscellaneous

This project is not FDA approved, not recommended for therapy, and not recommended by Dexcom.

## Contributing
If you're interested in contributing to the development of Dexli Backend, you can fork the repository and make pull requests with your changes. The project's contributors will review your changes and merge them into the main branch if they're deemed to be a good fit.

## License
Dexli Backend is licensed under the [GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html).

## Support
If you have any questions or issues with Dexli Backend, you can open an [issue](https://github.com/deviammx/dexli-backend/issues) on the project's repository or contact the developers directly for support.