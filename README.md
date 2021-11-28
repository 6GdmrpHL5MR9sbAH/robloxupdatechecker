# Setup

Create an application [here](https://discord.com/developers/applications).

After you've created an application click on the **Bot** tab located to the left (below the **OAuth2** tab) then click **Add Bot**.

Copy the bots token by clicking the **Copy** button.

Enable the **Server Members** intent in the **Bot** tab so it should look similar to this:
![image](https://user-images.githubusercontent.com/94950634/143724046-8a82861a-6cf6-49c0-a47e-bef77ff0aee6.png)

Go to config.json then replace `TOKEN GOES HERE` with the token you copied then install the packages by using `npm i`.

Start the bot by using `node index.js`.

# Adding the bot to your server

Once you've successfully gone through the **Setup** section you need to add the bot to your own server.

Click on the **OAuth2** tab which is above the **Bot** tab you used at the setup section.

Click on the **URL Generator** tab below **General** and then enable the **bot** and **applications.commands** scope.

Enable **Administrator** in the **Bot Permissions** area then scroll down a bit more until you see **Generated URL**.

If you've done everything correctly it should look similar to this:
![image](https://user-images.githubusercontent.com/94950634/143378166-4abbbcea-f8c7-4fed-af89-6445fe517c68.png)

Visit the generated URL and follow the instructions.
